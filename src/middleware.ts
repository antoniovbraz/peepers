import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cache } from '@/lib/cache';
import { logger } from '@/lib/logger';

export async function middleware(request: NextRequest) {
  // Rotas públicas que não precisam de autenticação
  const publicPaths = [
    '/api/products',
    '/api/health',
    '/api/cache-debug',
    '/api/debug',
    '/api/auth/mercado-livre',
    '/api/auth/mercado-livre/callback'
  ];

  // Se a rota é pública, permite o acesso
  if (publicPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
    return NextResponse.next();
  }

  try {
    // Verifica se tem token de acesso válido
    // O token pode estar no cache (salvo como `access_token:{userId}`) ou em variáveis de ambiente
    const userId = process.env.ML_USER_ID;
    let token: { token?: string; expires_at?: string } | null = null;

    if (userId) {
      // No cache os tokens são salvos via cache.setUser(`access_token:{userId}`, { token, expires_at, user_id })
      token = await cache.getUser(`access_token:${userId}`);
    }

    // Fallback para token em variáveis de ambiente caso não exista no cache
    if ((!token || !token.token) && process.env.ML_ACCESS_TOKEN) {
      token = {
        token: process.env.ML_ACCESS_TOKEN,
        // Se não houver expiry explícito em env, considera um prazo longo para não bloquear chamadas internas
        expires_at: process.env.ML_ACCESS_TOKEN_EXPIRES_AT ?? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      };
    }

    if (!token || !token.token) {
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
    const expiresAt = token.expires_at ? new Date(token.expires_at) : null;
    if (expiresAt && expiresAt < new Date()) {
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
    '/api/sync/:path*'
  ]
};
