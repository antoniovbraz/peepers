import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cache } from '@/lib/cache';
import { logger } from '@/lib/logger';
import { MIDDLEWARE_CONFIG, CACHE_KEYS } from '@/config/routes';

export async function middleware(request: NextRequest) {
  // Se a rota é pública, permite o acesso
  if (MIDDLEWARE_CONFIG.PUBLIC_PATHS.some(path => request.nextUrl.pathname.startsWith(path))) {
    return NextResponse.next();
  }

  try {
    // Verificar se existe cookie de sessão
    const sessionToken = request.cookies.get('session_token')?.value;
    const userId = request.cookies.get('user_id')?.value;

    if (!sessionToken || !userId) {
      logger.warn('No session cookies found');
      return NextResponse.redirect(new URL('/login', request.url));
    }    // Verificar se o usuário está na lista de autorizados
    const allowedUserIds = process.env.ALLOWED_USER_IDS?.split(',') || [];
    if (allowedUserIds.length > 0 && !allowedUserIds.includes(userId)) {
      logger.warn(`Unauthorized user attempt: ${userId}`);
      return NextResponse.redirect(new URL('/login', request.url));
    }    // Verificar se o token existe no cache
    const tokenData = await cache.getUser(userId);

    if (!tokenData || !tokenData.token) {
      logger.warn({ userId }, 'No token found in cache for user');
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Verificar se o token está expirado
    const expiresAt = tokenData.expires_at ? new Date(tokenData.expires_at) : null;
    if (expiresAt && expiresAt < new Date()) {
      logger.warn({ userId }, 'Token expired for user');
      return NextResponse.redirect(new URL('/login', request.url));
    }    // Se chegou aqui, está tudo ok
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
    '/admin/:path*',
    '/api/sync/:path*',
    '/api/products/:path*',
    '/api/auth/logout'
  ]
};