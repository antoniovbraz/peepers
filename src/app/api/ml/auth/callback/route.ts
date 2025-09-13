import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/cache';
import { html } from '@/lib/html';
import { renderHtml } from '@/lib/render-html';
import { createMercadoLivreAPI } from '@/lib/ml-api';
import logger from '@/lib/logger';

const mlApi = createMercadoLivreAPI(
  { fetch },
  {
    clientId: process.env.ML_CLIENT_ID!,
    clientSecret: process.env.ML_CLIENT_SECRET!,
    accessToken: process.env.ML_ACCESS_TOKEN,
    refreshToken: process.env.ML_REFRESH_TOKEN,
    userId: process.env.ML_USER_ID
  }
);

// Removed edge runtime - incompatible with Redis operations

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');
    const oauthState = request.cookies.get('oauth_state')?.value;

    if (error) {
      logger.error('OAuth error:', error);
      return NextResponse.json(
        { error: 'OAuth authorization failed', details: error },
        { status: 400 }
      );
    }

    if (!state || !oauthState || state !== oauthState) {
      const response = NextResponse.json(
        { error: 'Invalid OAuth state' },
        { status: 400 }
      );
      response.cookies.set('oauth_state', '', {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
      });
      return response;
    }

    if (!code) {
      return NextResponse.json(
        { error: 'Authorization code not provided' },
        { status: 400 }
      );
    }

    // Retrieve code_verifier from cookies
    const codeVerifier = request.cookies.get('ml_code_verifier')?.value;
    
    if (!codeVerifier) {
      logger.error('PKCE code_verifier not found in cookies');
      return NextResponse.json(
        { error: 'PKCE code_verifier missing - please restart authorization' },
        { status: 400 }
      );
    }

    logger.info('Received authorization code:', code);
    logger.info('Retrieved code_verifier from cookies');
    logger.info('Exchanging for token...');

    // Exchange code for access token with PKCE
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const tokenData = await mlApi.exchangeCodeForToken(
      code,
      `${baseUrl}/api/ml/auth/callback`,
      codeVerifier
    );
    
    logger.info('Token exchange successful:', {
      access_token: tokenData.access_token ? 'received' : 'missing',
      user_id: tokenData.user_id,
      expires_in: tokenData.expires_in
    });

    // Store token and user info in cache
    await cache.setUser(`access_token:${tokenData.user_id}`, {
      token: tokenData.access_token,
      expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      user_id: tokenData.user_id
    });

    await cache.setUser(tokenData.user_id.toString(), {
      user_id: tokenData.user_id,
      nickname: 'ML User',
      connected_at: new Date().toISOString()
    });

    // Create response with success page
    const response = renderHtml(
      html`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Peepers - Autorização Concluída</title>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              max-width: 600px;
              margin: 50px auto;
              padding: 20px;
              text-align: center;
            }
            .success { color: #28a745; }
            .info { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .button {
              display: inline-block;
              background: #007bff;
              color: white;
              padding: 10px 20px;
              text-decoration: none;
              border-radius: 5px;
              margin: 10px;
            }
          </style>
        </head>
        <body>
          <h1 class="success">✅ Autorização Concluída!</h1>
          <p>Sua conta do Mercado Livre foi conectada com sucesso à Peepers.</p>

          <div class="info">
            <strong>Próximos passos:</strong><br>
            • Seus produtos serão sincronizados automaticamente<br>
            • Você receberá notificações de perguntas em tempo real<br>
            • O cache será atualizado a cada 2 horas
          </div>

          <a href="/" class="button">Voltar ao Site</a>
          <a href="/api/ml/sync?action=sync" class="button">Sincronizar Produtos Agora</a>

          <p><small>User ID: ${tokenData.user_id}</small></p>
        </body>
      </html>
    `
    );

    // Clear the code_verifier cookie after successful token exchange
    response.cookies.set('ml_code_verifier', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/'
    });

    // Remove the OAuth state cookie
    response.cookies.set('oauth_state', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;

  } catch (error) {
    logger.error('OAuth callback error:', error);

    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return renderHtml(
      html`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Peepers - Erro na Autorização</title>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              max-width: 600px;
              margin: 50px auto;
              padding: 20px;
              text-align: center;
            }
            .error { color: #dc3545; }
            .button {
              display: inline-block;
              background: #007bff;
              color: white;
              padding: 10px 20px;
              text-decoration: none;
              border-radius: 5px;
              margin: 10px;
            }
          </style>
        </head>
        <body>
          <h1 class="error">❌ Erro na Autorização</h1>
          <p>Ocorreu um erro ao conectar sua conta do Mercado Livre.</p>
          <p><strong>Erro:</strong> ${message}</p>

          <a href="/api/ml/auth" class="button">Tentar Novamente</a>
          <a href="/" class="button">Voltar ao Site</a>
        </body>
      </html>
    `,
      { status: 500 }
    );
  }
}
