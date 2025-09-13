import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cache } from '@/lib/cache';
import { logger } from '@/lib/logger';

export async function middleware(request: NextRequest) {
  // Rotas públicas que não precisam de autenticação
  const publicPaths = [
    '/api/ml/auth',
    '/api/ml/auth/callback',
    '/api/ml/webhook'
  ];

  // Se a rota é pública, permite o acesso
  if (publicPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
    return NextResponse.next();
  }

  try {
    // Verifica se tem token de acesso válido
    const token = await cache.getAccessToken();
    
    if (!token) {
      logger.warn('No access token found');
      return new NextResponse(
        JSON.stringify({ 
          error: 'Unauthorized',
          message: 'Você precisa se autenticar com o Mercado Livre'
        }),
        { 
          status: 401,
          headers: { 'content-type': 'application/json' }
        }
      );
    }

    // Verifica se o token está expirado
    const expiresAt = new Date(token.expires_at);
    if (expiresAt < new Date()) {
      logger.warn('Access token expired');
      return new NextResponse(
        JSON.stringify({ 
          error: 'Token Expired',
          message: 'Sua sessão expirou. Por favor, faça login novamente.'
        }),
        { 
          status: 401,
          headers: { 'content-type': 'application/json' }
        }
      );
    }

    // Se chegou aqui, está tudo ok
    return NextResponse.next();

  } catch (error) {
    logger.error({ error }, 'Middleware error');
    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal Server Error',
        message: 'Ocorreu um erro ao verificar sua autenticação'
      }),
      { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      }
    );
  }
}

// Configurar em quais rotas o middleware deve ser executado
export const config = {
  matcher: [
    '/api/products/:path*',
    '/api/ml/sync/:path*',
    '/api/ml/test-token/:path*'
  ]
};