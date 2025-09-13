import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    
    if (!code) {
      return NextResponse.json({ error: 'Code required' }, { status: 400 });
    }

    logger.info({ code }, 'Testing token exchange with code');

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

    logger.info({ status: tokenResponse.status }, 'ML API Response status');
    
    const responseText = await tokenResponse.text();
    logger.info({ body: responseText }, 'ML API Response body');

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
    logger.error({ err: error }, 'Test token error');
    
    return NextResponse.json({
      error: 'Test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
