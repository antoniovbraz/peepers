/**
 * Entitlements Middleware - Peepers Enterprise v2.0.0
 *
 * Middleware para validação de entitlements e planos
 * Integrado com Stripe para verificação em tempo real
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { stripeClient } from '@/lib/stripe';
import { PREMIUM_FEATURES } from '@/config/entitlements';
import { PeepersFeature } from '@/types/stripe';

export interface EntitlementContext {
  userId: string;
  tenantId: string;
  path: string;
}

/**
 * Middleware principal de entitlements
 */
export async function entitlementMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const context = extractContext(request);
  
  if (!context) {
    // Rotas públicas ou sem contexto necessário
    return null;
  }

  try {
    const feature = getRequiredFeature(context.path);
    
    if (!feature) {
      // Rota não requer entitlement específico
      return null;
    }

    const entitlementCheck = await stripeClient.checkEntitlement(context.tenantId, feature);

    if (!entitlementCheck.allowed) {
      logger.warn({
        userId: context.userId,
        tenantId: context.tenantId,
        path: context.path,
        feature,
        reason: entitlementCheck.reason
      }, 'Entitlement check failed');

      if (entitlementCheck.upgrade_required) {
        // Redirect para página de upgrade
        return NextResponse.redirect(
          new URL(`/upgrade?feature=${feature}&reason=${encodeURIComponent(entitlementCheck.reason || 'Access denied')}`, request.url)
        );
      }

      return NextResponse.json(
        { 
          error: 'Access denied',
          reason: entitlementCheck.reason || 'Insufficient permissions',
          upgrade_required: entitlementCheck.upgrade_required,
          upgrade_url: `/upgrade?feature=${feature}`
        },
        { status: 403 }
      );
    }

    // Entitlement OK - continuar
    return null;

  } catch (error) {
    logger.error({
      error,
      userId: context.userId,
      tenantId: context.tenantId,
      path: context.path
    }, 'Error checking entitlements');

    // Em caso de erro, permitir acesso para evitar downtime
    return null;
  }
}

/**
 * Extrai contexto de autenticação da request
 */
function extractContext(request: NextRequest): EntitlementContext | null {
  // Extrair user_id do cookie de sessão ou header
  const userId = request.cookies.get('user_id')?.value || 
                request.headers.get('x-user-id');

  // Extrair tenant_id (por enquanto usar userId como tenant_id)
  const tenantId = request.cookies.get('tenant_id')?.value || 
                  request.headers.get('x-tenant-id') || 
                  `tenant_${userId}`;

  const path = request.nextUrl.pathname;

  if (!userId) {
    return null;
  }

  return {
    userId,
    tenantId,
    path
  };
}

/**
 * Determina qual feature é necessária para acessar a rota
 */
function getRequiredFeature(path: string): PeepersFeature | null {
  // Mapear rotas para features necessárias
  const routeFeatureMap: Record<string, PeepersFeature> = {
    // Admin routes requerem professional+
    '/admin/dashboard': 'advanced_analytics',
    '/admin/metrics': 'advanced_analytics', 
    '/admin/users': 'multi_user',
    '/admin/analytics': 'advanced_analytics',

    // API v1 requer enterprise
    '/api/v1': 'api_access',
    '/api/admin/users': 'advanced_analytics',
    '/api/admin/metrics': 'advanced_analytics'
  };

  // Verificar match exato primeiro
  if (routeFeatureMap[path]) {
    return routeFeatureMap[path];
  }

  // Verificar match por prefixo
  for (const [route, feature] of Object.entries(routeFeatureMap)) {
    if (path.startsWith(route)) {
      return feature;
    }
  }

  return null;
}

/**
 * Valida se usuário tem acesso a uma feature específica
 */
export async function hasFeatureAccess(
  userId: string, 
  feature: PeepersFeature
): Promise<boolean> {
  try {
    const tenantId = `tenant_${userId}`;
    const check = await stripeClient.checkEntitlement(tenantId, feature);
    return check.allowed;
  } catch (error) {
    logger.error({ error, userId, feature }, 'Error checking feature access');
    // Em caso de erro, permitir acesso
    return true;
  }
}

/**
 * Helper para React components verificarem entitlements
 */
export async function useEntitlement(userId: string, feature: PeepersFeature) {
  return {
    hasAccess: await hasFeatureAccess(userId, feature),
    upgradeUrl: `/upgrade?feature=${feature}`
  };
}