import { NextRequest, NextResponse } from 'next/server';
import { mlApi } from '@/lib/ml-api';
import { cache } from '@/lib/cache';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.json(
        { error: 'OAuth authorization failed', details: error },
        { status: 400 }
      );
    }

    if (!code) {
      return NextResponse.json(
        { error: 'Authorization code not provided' },
        { status: 400 }
      );
    }

    console.log('Received authorization code, exchanging for token...');

    // Exchange code for access token
    const redirectUri = 'https://peepers.vercel.app/api/ml/auth/callback';
    const tokenData = await mlApi.exchangeCodeForToken(code, redirectUri);
    
    console.log('Token exchange successful:', {
      access_token: tokenData.access_token ? 'received' : 'missing',
      user_id: tokenData.user_id,
      expires_in: tokenData.expires_in
    });

    // Store token and user info in cache
    await cache.setUser('access_token', {
      token: tokenData.access_token,
      expires_at: new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString(),
      user_id: tokenData.user_id
    });

    await cache.setUser(tokenData.user_id.toString(), {
      user_id: tokenData.user_id,
      nickname: 'ML User',
      connected_at: new Date().toISOString()
    });

    // Return success page
    return new NextResponse(`
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
          <a href="/api/ml/sync" class="button">Sincronizar Produtos Agora</a>
          
          <p><small>User ID: ${tokenData.user_id}</small></p>
        </body>
      </html>
    `, {
      headers: {
        'Content-Type': 'text/html',
      },
    });

  } catch (error) {
    console.error('OAuth callback error:', error);
    
    return new NextResponse(`
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
          <p><strong>Erro:</strong> ${error instanceof Error ? error.message : 'Erro desconhecido'}</p>
          
          <a href="/api/ml/auth" class="button">Tentar Novamente</a>
          <a href="/" class="button">Voltar ao Site</a>
        </body>
      </html>
    `, {
      status: 500,
      headers: {
        'Content-Type': 'text/html',
      },
    });
  }
}
