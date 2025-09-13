import { NextRequest, NextResponse } from "next/server";
import { cache } from "@/lib/cache";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const state = searchParams.get("state");

    console.log('🔍 Callback received:', { code: !!code, error, state });
    console.log('🍪 Available cookies:', Object.fromEntries(request.cookies.getAll().map(c => [c.name, c.value])));

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    if (!code) {
      return NextResponse.json({ error: "No authorization code" }, { status: 400 });
    }

    // Get PKCE code_verifier from cookies
    let codeVerifier = request.cookies.get('ml_code_verifier')?.value;
    let storedState = request.cookies.get('oauth_state')?.value;

    console.log('🔐 PKCE verification:', { 
      hasCodeVerifier: !!codeVerifier, 
      hasStoredState: !!storedState,
      stateMatch: state === storedState
    });

    // If cookies are missing, try to get from cache as fallback
    if (!codeVerifier || !storedState) {
      console.log('🔄 Cookies missing, trying cache fallback...');
      try {
        const cachedSession = await cache.getUser(`oauth_session:${state}`);
        if (cachedSession && (cachedSession as any).oauth_data) {
          const oauthData = (cachedSession as any).oauth_data;
          codeVerifier = oauthData.code_verifier;
          storedState = oauthData.state;
          console.log('✅ Retrieved from cache:', { hasCodeVerifier: !!codeVerifier, hasStoredState: !!storedState });
        }
      } catch (err) {
        console.warn('Cache lookup failed:', err);
      }
    }

    if (!codeVerifier) {
      console.error('❌ Missing code_verifier in both cookies and cache');
      return NextResponse.json({ 
        error: "Missing code_verifier", 
        message: "PKCE code_verifier not found in cookies or cache. Please try the authentication again.",
        suggestion: "Go to /api/ml/auth to restart the authentication process"
      }, { status: 400 });
    }

    if (state !== storedState) {
      console.error('❌ State mismatch:', { received: state, stored: storedState });
      return NextResponse.json({ 
        error: "Invalid state", 
        message: "OAuth state mismatch" 
      }, { status: 400 });
    }

    const clientId = process.env.ML_CLIENT_ID;
    const clientSecret = process.env.ML_CLIENT_SECRET;
    const redirectUri = "https://peepers.vercel.app/api/ml/auth/callback";

    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: "ML credentials not configured" }, { status: 500 });
    }

    console.log('🔄 Exchanging code for token with PKCE...');

    const tokenResponse = await fetch("https://api.mercadolibre.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier, // PKCE parameter
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('❌ Token exchange failed:', tokenData);
      return NextResponse.json({ error: tokenData }, { status: 400 });
    }

    console.log('✅ Token exchange successful for user:', tokenData.user_id);

    await cache.setUser(`access_token:${tokenData.user_id}`, {
      token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      access_token: tokenData.access_token,
      user_id: tokenData.user_id
    });

    // Clear PKCE cookies (cache will expire automatically)
    const response = NextResponse.json({
      success: true,
      user_id: tokenData.user_id,
      message: "Autenticação realizada com sucesso!"
    });
    
    response.cookies.delete('ml_code_verifier');
    response.cookies.delete('oauth_state');

    return response;

  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
