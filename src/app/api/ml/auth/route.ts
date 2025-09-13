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
    
    // Ultra-robust cookie settings for maximum compatibility
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 1800, // 30 minutes for better reliability
    };
    
    // Set cookies with multiple approaches for better compatibility
    response.cookies.set('ml_code_verifier', codeVerifier, cookieOptions);
    response.cookies.set('oauth_state', state, cookieOptions);
    
    // Also set with different paths as fallback
    response.cookies.set('ml_pkce_verifier', codeVerifier, { ...cookieOptions, path: '/api' });
    response.cookies.set('ml_oauth_state', state, { ...cookieOptions, path: '/api' });

    // ALWAYS store in cache as primary storage (using multiple keys for redundancy)
    try {
      const sessionData = {
        access_token: '', // dummy values to match CachedUser interface
        refresh_token: '',
        expires_at: new Date(Date.now() + 1800000).toISOString(), // 30 minutes
        user_id: 0,
        oauth_data: {
          code_verifier: codeVerifier,
          state: state,
          timestamp: Date.now(),
          client_id: clientId
        }
      } as any;
      
      // Store with multiple keys for maximum reliability
      await Promise.all([
        cache.setUser(`oauth_session:${state}`, sessionData),
        cache.setUser(`oauth_verifier:${codeVerifier}`, sessionData),
        cache.setUser(`oauth_backup:${Date.now()}`, sessionData)
      ]);
      
      console.log('✅ OAuth session stored in cache with multiple keys');
    } catch (err) {
      console.error('❌ CRITICAL: Failed to cache OAuth session:', err);
      // Don't fail the request, but log the error prominently
    }

    console.log('🍪 Cookies and cache set:', { 
      state,
      codeVerifierLength: codeVerifier.length,
      codeChallengeLength: codeChallenge.length,
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      maxAge: cookieOptions.maxAge,
      timestamp: new Date().toISOString()
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
