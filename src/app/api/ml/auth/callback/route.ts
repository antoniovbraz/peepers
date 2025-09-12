import { NextRequest, NextResponse } from 'next/server';
import { mlApi } from '@/lib/ml-api';
import { cache } from '@/lib/cache';
import { AppError } from '@/core/error';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
      throw AppError.badRequest('Authorization code is required');
    }

    const tokenData = await mlApi.exchangeCode(code);
    await cache.setUser({ access_token: tokenData });

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
          <p>Sua conta do Mercado Livre foi conectada com sucesso.</p>
          
          <div class="info">
            Agora você pode sincronizar seus produtos e gerenciar suas vendas através do Peepers.
          </div>
          
          <div>
            <a href="/api/ml/sync?action=sync" class="button">Sincronizar Produtos</a>
            <a href="/" class="button">Voltar ao Site</a>
          </div>
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
            .info { background: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .button {
              display: inline-block;
              background: #6c757d;
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
          <p>Não foi possível conectar sua conta do Mercado Livre.</p>
          
          <div class="info">
            <strong>Erro:</strong> ${error instanceof Error ? error.message : 'Erro desconhecido'}
          </div>
          
          <div>
            <a href="/api/ml/auth" class="button">Tentar Novamente</a>
            <a href="/" class="button">Voltar ao Site</a>
          </div>
        </body>
      </html>
    `, {
      headers: {
        'Content-Type': 'text/html',
      },
      status: error instanceof AppError ? error.statusCode : 500,
    });
  }
}