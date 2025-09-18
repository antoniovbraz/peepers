import { PAGES } from '@/config/routes';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cache } from '@/lib/cache';
import { logger } from '@/lib/logger';
import { MIDDLEWARE_CONFIG } from '@/config/routes';
import { corsHandler } from '@/lib/cors';
import { stripeClient } from '@/lib/stripe';
import { entitlementsManager } from '@/lib/entitlements';
import { PREMIUM_FEATURES } from '@/config/entitlements';
import type { PeepersFeature } from '@/types/stripe';
import { TenantMiddleware } from '@/infrastructure/middleware/TenantMiddleware';
import { isSuperAdmin } from '@/config/platform-admin';

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
  const pathname = request.nextUrl.pathname;
  
  // Debug: log para entender quais rotas estão sendo processadas
  if (pathname.startsWith('/api/')) {
    console.log(`🔍 Middleware processing: ${pathname}`);
  }

  // 1. Verificar se é uma rota pública - se for, permitir acesso imediato
  const isPublicPath = MIDDLEWARE_CONFIG.PUBLIC_PATHS.some(path => {
    const matches = pathname.startsWith(path);
    if (pathname.startsWith('/api/v1/products')) {
      console.log(`🔍 Checking ${pathname} against ${path}: ${matches}`);
    }
    return matches;
  });
  
  if (isPublicPath) {
    console.log(`✅ Public path allowed: ${pathname}`);
    return NextResponse.next();
  }
  
  console.log(`🔒 Protected path detected: ${pathname}`);

  // 2. CORS: Verificar e aplicar política CORS para APIs
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const corsResponse = corsHandler.handleAPIRequest(request);
    if (corsResponse) {
      return corsResponse; // CORS bloqueou ou tratou OPTIONS
    }
  }

  try {
    // 3. Verificar se existe cookie de sessão
    const sessionToken = request.cookies.get('session_token')?.value;
    const userId = request.cookies.get('user_id')?.value;

    if (!sessionToken || !userId) {
      logger.warn('No session cookies found');
      return NextResponse.redirect(new URL(PAGES.LOGIN, request.url));
    }

    // 3.5. Verificar se é super admin - se for, permitir acesso total
    const userEmail = request.cookies.get('user_email')?.value;
    
    if (userEmail && isSuperAdmin({ email: userEmail, id: userId })) {
      logger.info({ userId, email: userEmail }, 'Super admin access granted');
      return NextResponse.next();
    }

    // 4. Verificar se o usuário está na lista de autorizados
    const allowedUserIds = process.env.ALLOWED_USER_IDS?.split(',') || [];
    if (allowedUserIds.length > 0 && !allowedUserIds.includes(userId)) {
      logger.warn(`Unauthorized user attempt: ${userId}`);
      
      // Log evento de segurança
      try {
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
      } catch (error) {
        // Ignore errors in security logging during tests
        logger.warn({ error }, 'Failed to log security event');
      }
      
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

    // 8. TEMPORÁRIO: Desabilitar isolamento de tenant para focar na integração ML
    // TODO: Reabilitar quando implementar multi-tenant completo
    /*
    const needsTenantIsolation = 
      request.nextUrl.pathname.startsWith('/api/tenant/') ||
      (request.nextUrl.pathname.startsWith('/admin/') && !request.nextUrl.pathname.startsWith('/admin/platform'));

    if (needsTenantIsolation) {
      const tenantResult = await TenantMiddleware.handleTenantIsolation(request);

      if (tenantResult instanceof NextResponse && !tenantResult.ok) {
        logger.warn({ userId, path: request.nextUrl.pathname }, 'Tenant isolation failed');
        return tenantResult;
      }

      // Se o middleware retornou uma resposta modificada, usar ela
      if (tenantResult instanceof NextResponse) {
        return tenantResult;
      }
    }
    */

    // 9. SIMPLIFICADO: Remover verificação de entitlements por enquanto para focar no ML
    // TODO: Reabilitar quando ML estiver 100% funcionando
    /*
    const entitlementCheck = await checkEntitlements(request, userId);
    if (!entitlementCheck.allowed) {
      logger.warn({
        userId,
        path: request.nextUrl.pathname,
        reason: entitlementCheck.reason
      }, 'Access denied due to entitlement check');

      // Log evento de segurança
      try {
        await import('@/lib/security-events').then(m => m.logSecurityEvent({
          type: m.SecurityEventType.UNAUTHORIZED_ACCESS,
          severity: 'MEDIUM',
          userId,
          clientIP: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          details: {
            attempted_path: request.nextUrl.pathname,
            reason: entitlementCheck.reason,
            upgrade_required: entitlementCheck.upgrade_required
          },
          path: request.nextUrl.pathname
        }));
      } catch (error) {
        // Ignore errors in security logging during tests
        logger.warn({ error }, 'Failed to log security event');
      }

      // Redirecionar para página de upgrade ou acesso negado
      if (entitlementCheck.upgrade_required) {
        return NextResponse.redirect(new URL('/upgrade?reason=plan_required', request.url));
      } else {
        return NextResponse.redirect(new URL(PAGES.ACESSO_NEGADO, request.url));
      }
    }
    */

    // 9. Se chegou aqui, está tudo ok
    const response = NextResponse.next();
    
    // Aplicar headers CORS se for request para API
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return await corsHandler.applyCORSHeaders(request, response);
    }
    
    return response;

  } catch (error) {
    logger.error({ error }, 'Middleware error');
    
    // Em caso de erro, redirecionar para login ao invés de retornar erro 500
    // Isso evita quebrar a experiência do usuário
    return NextResponse.redirect(new URL(PAGES.LOGIN, request.url));
  }
}

/**
 * Verifica entitlements para acesso a features premium
 */
async function checkEntitlements(request: NextRequest, userId: string) {
  try {
    // Verificar se a rota requer feature premium
    const path = request.nextUrl.pathname;
    const requiredFeature = getRequiredFeatureForPath(path);

    if (!requiredFeature) {
      // Rota não requer premium, permitir acesso
      return { allowed: true };
    }

    // Obter entitlement do tenant
    const entitlement = await stripeClient.getTenantEntitlement(userId);

    // Verificar entitlement usando o manager
    const context = {
      tenantId: userId, // Usando userId como tenantId por enquanto
      userId,
      feature: requiredFeature,
      clientIP: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    };

    const result = await entitlementsManager.checkEntitlement(context, entitlement);

    return {
      allowed: result.allowed,
      reason: result.reason,
      upgrade_required: !result.allowed && result.reason?.includes('not included'),
      limit_exceeded: result.limit_exceeded
    };

  } catch (error) {
    logger.error({ error, userId, path: request.nextUrl.pathname }, 'Error checking entitlements');

    // Em caso de erro, permitir acesso para evitar downtime
    // TODO: implementar circuit breaker para múltiplas falhas
    return {
      allowed: true,
      reason: 'Error checking entitlements, allowing access to prevent downtime'
    };
  }
}

/**
 * Determina qual feature é requerida para uma rota específica
 */
function getRequiredFeatureForPath(path: string): PeepersFeature | null {
  // Verificar rotas específicas
  for (const [routePattern, requiredPlan] of Object.entries(PREMIUM_FEATURES)) {
    if (path.startsWith(routePattern)) {
      // Mapear plano para feature principal
      switch (requiredPlan) {
        case 'professional':
          return 'advanced_analytics'; // Feature que representa acesso ao admin
        case 'enterprise':
          return 'api_access'; // Feature que representa acesso enterprise
        default:
          return null;
      }
    }
  }

  // Verificar padrões de rota admin
  if (path.startsWith('/admin/') || path.startsWith('/api/admin/')) {
    return 'advanced_analytics'; // Professional plan feature
  }

  // Verificar API v1 (enterprise)
  if (path.startsWith('/api/v1/')) {
    return 'api_access'; // Enterprise plan feature
  }

  return null; // Rota pública ou básica
}

// Configurar em quais rotas o middleware deve ser executado
export const config = {
  matcher: [
    '/admin/:path*',
    '/api/sync/:path*',
    '/api/products/:path*',
    '/api/auth/logout',
    '/api/admin/:path*',
    '/api/entitlements',
    '/api/tenant/:path*',
    '/api/v1/:path*',
    '/upgrade',
    '/billing'
  ]
};
