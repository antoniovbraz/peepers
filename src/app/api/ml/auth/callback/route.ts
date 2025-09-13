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

    // Get PKCE code_verifier from multiple sources for maximum reliability
    let codeVerifier = request.cookies.get('ml_code_verifier')?.value 
                    || request.cookies.get('ml_pkce_verifier')?.value;
    let storedState = request.cookies.get('oauth_state')?.value 
                   || request.cookies.get('ml_oauth_state')?.value;

    console.log('🔐 PKCE verification (initial):', { 
      hasCodeVerifier: !!codeVerifier, 
      hasStoredState: !!storedState,
      stateMatch: state === storedState,
      receivedState: state,
      allCookies: Object.fromEntries(request.cookies.getAll().map(c => [c.name, c.value.substring(0, 10) + '...']))
    });

    // If cookies are missing, try multiple cache lookup strategies
    if (!codeVerifier || !storedState) {
      console.log('🔄 Cookies missing, trying enhanced cache fallback...');
      
      try {
        // Try multiple cache keys
        const cacheKeys = [
          `oauth_session:${state}`,
          `oauth_verifier:${codeVerifier}`, // if we have partial data
          // Also try recent backup keys
        ];
        
        // Get all recent oauth backups as last resort
        const recentBackups = [];
        const now = Date.now();
        for (let i = 0; i < 10; i++) {
          const timestamp = now - (i * 60000); // Check last 10 minutes
          recentBackups.push(`oauth_backup:${Math.floor(timestamp / 60000) * 60000}`);
        }
        
        const allKeys = [...cacheKeys, ...recentBackups].filter(Boolean);
        
        for (const key of allKeys) {
          try {
            const cachedSession = await cache.getUser(key);
            if (cachedSession && (cachedSession as any).oauth_data) {
              const oauthData = (cachedSession as any).oauth_data;
              
              // Verify this session matches our state
              if (oauthData.state === state || !state) {
                codeVerifier = oauthData.code_verifier;
                storedState = oauthData.state;
                console.log('✅ Retrieved from cache key:', key);
                break;
              }
            }
          } catch (keyErr) {
            console.warn(`Cache key ${key} failed:`, keyErr instanceof Error ? keyErr.message : 'Unknown error');
          }
        }
        
      } catch (err) {
        console.error('❌ Cache lookup completely failed:', err);
      }
    }

    if (!codeVerifier) {
      console.error('❌ Missing code_verifier after all attempts');
      console.error('Debug info:', {
        receivedState: state,
        cookiesReceived: Object.fromEntries(request.cookies.getAll().map(c => [c.name, '***'])),
        cacheAttempted: true,
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json({ 
        error: "Missing code_verifier", 
        message: "PKCE code_verifier not found in cookies or cache. This could be due to:",
        troubleshooting: [
          "1. Cookies were blocked or deleted by browser",
          "2. Too much time passed between auth initiation and callback",
          "3. Cache service (Redis) unavailable",
          "4. Browser privacy settings blocking cross-site cookies"
        ],
        suggestion: "Go to /api/ml/auth to restart the authentication process",
        debug: {
          hasState: !!state,
          cookieCount: request.cookies.getAll().length
        }
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

    // Clear PKCE cookies and cache entries (comprehensive cleanup)
    const response = NextResponse.json({
      success: true,
      user_id: tokenData.user_id,
      message: "Autenticação realizada com sucesso!"
    });
    
    // Delete all possible cookie variants
    const cookiesToDelete = [
      'ml_code_verifier',
      'ml_pkce_verifier', 
      'oauth_state',
      'ml_oauth_state'
    ];
    
    cookiesToDelete.forEach(cookieName => {
      response.cookies.delete(cookieName);
      // Also delete with different paths
      response.cookies.set(cookieName, '', { 
        maxAge: 0, 
        path: '/' 
      });
      response.cookies.set(cookieName, '', { 
        maxAge: 0, 
        path: '/api' 
      });
    });

    // Clean up cache entries
    try {
      await Promise.all([
        cache.setUser(`oauth_session:${state}`, null as any).catch(() => {}),
        cache.setUser(`oauth_verifier:${codeVerifier}`, null as any).catch(() => {})
      ]);
    } catch (cleanupErr) {
      console.warn('Cache cleanup warning:', cleanupErr);
    }

    return response;

  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
