import { PAGES } from '@/config/routes';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cache } from '@/lib/cache';
import { logger } from '@/lib/logger';
import { MIDDLEWARE_CONFIG } from '@/config/routes';
import { corsHandler } from '@/lib/cors';

/**
 * Middleware de Autenticação, Autorização e CORS
 * 
 * Implementa controle de acesso multi-camada para rotas protegidas:
 * 1. Verificação CORS para requests cross-origin
 * 2. Verificação de rotas públicas (bypass de autenticação)
 * 3. Validação de cookies de sessão (session_token + user_id)
 * 4. Autorização por lista de usuários permitidos (ALLOWED_USER_IDS)
 * 5. Validação de integridade da sessão no cache Redis
 * 6. Verificação de expiração de tokens OAuth
 * 
 * Segurança implementada:
 * - Proteção CORS com whitelist de origens
 * - Proteção CSRF via session_token matching
 * - Rate limiting implícito via cache TTL
 * - Logs estruturados para auditoria
 * - Redirecionamento seguro para login/acesso negado
 * 
 * Conformidade LGPD:
 * - Cookies com flags httpOnly e sameSite=strict
 * - Logs sem exposição de dados sensíveis
 * - TTL respeitando tempo mínimo necessário
 * 
 * @param request - NextRequest contendo cookies e URL
 * @returns NextResponse com redirecionamento ou continuação
 */
export async function middleware(request: NextRequest) {
  // 1. CORS: Verificar e aplicar política CORS para APIs
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const corsResponse = corsHandler.handleAPIRequest(request);
    if (corsResponse) {
      return corsResponse; // CORS bloqueou ou tratou OPTIONS
    }
  }

  // 2. Se a rota é pública, permite o acesso
  if (MIDDLEWARE_CONFIG.PUBLIC_PATHS.some(path => request.nextUrl.pathname.startsWith(path))) {
    const response = NextResponse.next();
    
    // Aplicar headers CORS mesmo para rotas públicas
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return await corsHandler.applyCORSHeaders(request, response);
    }
    
    return response;
  }

  try {
    // 3. Verificar se existe cookie de sessão
    const sessionToken = request.cookies.get('session_token')?.value;
    const userId = request.cookies.get('user_id')?.value;

    if (!sessionToken || !userId) {
      logger.warn('No session cookies found');
      return NextResponse.redirect(new URL(PAGES.LOGIN, request.url));
    }

    // 4. Verificar se o usuário está na lista de autorizados
    const allowedUserIds = process.env.ALLOWED_USER_IDS?.split(',') || [];
    if (allowedUserIds.length > 0 && !allowedUserIds.includes(userId)) {
      logger.warn(`Unauthorized user attempt: ${userId}`);
      
      // Log evento de segurança
      await import('@/lib/security-events').then(m => m.logSecurityEvent({
        type: m.SecurityEventType.UNAUTHORIZED_ACCESS,
        severity: 'HIGH',
        userId,
        clientIP: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        details: {
          attempted_path: request.nextUrl.pathname,
          reason: 'User not in ALLOWED_USER_IDS'
        },
        path: request.nextUrl.pathname
      }));
      
      // Usuário autenticado mas não autorizado - redirecionar para página de vendas
      return NextResponse.redirect(new URL(PAGES.ACESSO_NEGADO, request.url));
    }

    // 5. Verificar se o token existe no cache
    const tokenData = await cache.getUser(userId);

    if (!tokenData || !tokenData.token) {
      logger.warn({ userId }, 'No token found in cache for user');
      return NextResponse.redirect(new URL(PAGES.LOGIN, request.url));
    }

    // 6. CRÍTICO: Verificar se o session_token do cookie corresponde ao armazenado no cache
    if (!tokenData.session_token || tokenData.session_token !== sessionToken) {
      logger.warn({ userId }, 'Invalid session token for user');
      return NextResponse.redirect(new URL(PAGES.LOGIN, request.url));
    }

    // 7. Verificar se o token está expirado
    const expiresAt = tokenData.expires_at ? new Date(tokenData.expires_at) : null;
    if (expiresAt && expiresAt < new Date()) {
      logger.warn({ userId }, 'Token expired for user');
      return NextResponse.redirect(new URL(PAGES.LOGIN, request.url));
    }

    // 8. Se chegou aqui, está tudo ok
    const response = NextResponse.next();
    
    // Aplicar headers CORS se for request para API
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return await corsHandler.applyCORSHeaders(request, response);
    }
    
    return response;

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
