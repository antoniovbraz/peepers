import { NextRequest, NextResponse } from "next/server";
import { cache } from "@/lib/cache";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const state = searchParams.get("state");

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    if (!code) {
      return NextResponse.json({ error: "No authorization code" }, { status: 400 });
    }

    // Get PKCE code_verifier from cookies
    const codeVerifier = request.cookies.get('ml_code_verifier')?.value;
    const storedState = request.cookies.get('oauth_state')?.value;

    if (!codeVerifier) {
      return NextResponse.json({ 
        error: "Missing code_verifier", 
        message: "PKCE code_verifier not found in cookies" 
      }, { status: 400 });
    }

    if (state !== storedState) {
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

    // Clear PKCE cookies
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
