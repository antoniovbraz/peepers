import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    
    if (!code) {
      return NextResponse.json({ error: 'Code required' }, { status: 400 });
    }

    logger.info('Testing token exchange with code:', code);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    // Direct API call to ML
    const tokenResponse = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.ML_CLIENT_ID!,
        client_secret: process.env.ML_CLIENT_SECRET!,
        code: code,
        redirect_uri: `${baseUrl}/api/ml/auth/callback`
      })
    });

    logger.info('ML API Response status:', tokenResponse.status);
    
    const responseText = await tokenResponse.text();
    logger.info('ML API Response body:', responseText);

    if (!tokenResponse.ok) {
      return NextResponse.json({
        error: 'Token exchange failed',
        status: tokenResponse.status,
        response: responseText
      }, { status: 500 });
    }

    const tokenData = JSON.parse(responseText);
    
    return NextResponse.json({
      success: true,
      tokenData: {
        access_token: tokenData.access_token ? 'received' : 'missing',
        user_id: tokenData.user_id,
        expires_in: tokenData.expires_in
      }
    });

  } catch (error) {
    logger.error('Test token error:', error);
    
    return NextResponse.json({
      error: 'Test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
