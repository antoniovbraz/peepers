import { NextResponse } from "next/server";
import { cache } from "@/lib/cache";

// PKCE helper functions
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode.apply(null, Array.from(array)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(digest))))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export async function GET() {
  try {
    const clientId = process.env.ML_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json({ error: "ML_CLIENT_ID not configured" }, { status: 500 });
    }
    
    const redirectUri = "https://peepers.vercel.app/api/ml/auth/callback";
    
    // Generate PKCE parameters
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = Math.random().toString(36).substring(2, 15);
    
    console.log('🔐 ML OAuth with PKCE:', { 
      codeVerifierLength: codeVerifier.length,
      codeChallengeLength: codeChallenge.length,
      state 
    });
    
    const authUrl = new URL("https://auth.mercadolivre.com.br/authorization");
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("scope", "read write offline_access");
    authUrl.searchParams.set("code_challenge", codeChallenge);
    authUrl.searchParams.set("code_challenge_method", "S256");
    authUrl.searchParams.set("state", state);

    // Store code_verifier in cookies for the callback
    const response = NextResponse.redirect(authUrl.toString());
    
    // Robust cookie settings for production - remove domain to avoid issues
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 900, // 15 minutes (increased for better reliability)
    };
    
    response.cookies.set('ml_code_verifier', codeVerifier, cookieOptions);
    response.cookies.set('oauth_state', state, cookieOptions);

    // ALSO store in cache as fallback (using state as key)
    try {
      await cache.setUser(`oauth_session:${state}`, {
        access_token: '', // dummy values to match CachedUser interface
        refresh_token: '',
        expires_at: '',
        user_id: 0, // Use number 0 instead of empty string
        // Store our actual OAuth data in a nested object
        oauth_data: {
          code_verifier: codeVerifier,
          state: state,
          timestamp: Date.now()
        }
      } as any); // Type assertion to bypass interface restrictions
    } catch (err) {
      console.warn('Failed to cache OAuth session (cookies only):', err);
    }

    console.log('🍪 Cookies and cache set:', { 
      state,
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      maxAge: cookieOptions.maxAge 
    });

    return response;
    
  } catch (error) {
    console.error('❌ OAuth error:', error);
    return NextResponse.json({ 
      error: "Failed to initiate OAuth",
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
