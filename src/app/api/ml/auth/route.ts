import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

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

    // Mercado Livre OAuth URL
    const authUrl = new URL('https://auth.mercadolivre.com.br/authorization');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', 'read write offline_access');

    console.log('Redirecting to ML OAuth:', authUrl.toString());

    return NextResponse.redirect(authUrl.toString());
    
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
