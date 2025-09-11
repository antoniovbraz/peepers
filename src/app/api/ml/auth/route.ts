import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

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

export async function GET(request: NextRequest) {
  try {
    const clientId = process.env.ML_CLIENT_ID;
    const redirectUri = 'https://peepers.vercel.app/api/ml/auth/callback';
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'ML_CLIENT_ID not configured' },
        { status: 500 }
      );
    }

    // Generate PKCE code_verifier and code_challenge
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    // Store code_verifier in a way we can retrieve it (using a simple approach)
    const state = Math.random().toString(36).substring(2, 15);
    
    // Mercado Livre OAuth URL with PKCE
    const authUrl = new URL('https://auth.mercadolivre.com.br/authorization');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', 'read write offline_access');
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');
    authUrl.searchParams.set('state', state);

    console.log('Redirecting to ML OAuth with PKCE:', authUrl.toString());

    // Store code_verifier temporarily (in a real app, use secure session storage)
    const response = NextResponse.redirect(authUrl.toString());
    response.cookies.set('pkce_verifier', codeVerifier, { 
      httpOnly: true, 
      secure: true, 
      maxAge: 600 // 10 minutes
    });
    response.cookies.set('oauth_state', state, { 
      httpOnly: true, 
      secure: true, 
      maxAge: 600 
    });

    return response;
    
  } catch (error) {
    console.error('OAuth initiation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to initiate OAuth',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
