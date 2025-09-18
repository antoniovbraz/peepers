/**
 * Entitlements API - Consulta de features e limites do tenant
 * 
 * Endpoint para verificar entitlements, limites e uso atual
 * Usado pelo frontend para mostrar/ocultar features e aplicar limitações
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripeClient } from '@/lib/stripe';
import { logger } from '@/lib/logger';
import { PeepersFeature } from '@/types/stripe';
import { getKVClient } from '@/lib/cache';
import { headers } from 'next/headers';
import { isSuperAdmin, getSuperAdminEntitlements } from '@/config/platform-admin';

export async function GET(request: NextRequest) {
  try {
    // Extrair user info dos headers (adicionado pelo middleware)
    const headersList = await headers();
    const userId = headersList.get('x-user-id');
    const userEmail = headersList.get('x-user-email');

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verificar se é super admin PRIMEIRO
    if (isSuperAdmin({ email: userEmail || undefined, id: userId })) {
      logger.info(`Super admin entitlements requested for ${userEmail}`);
      return NextResponse.json(getSuperAdminEntitlements());
    }

    // Para usuários normais, buscar entitlements Stripe
    const entitlements = await stripeClient.getTenantEntitlement(userId);

    if (!entitlements) {
      return NextResponse.json({
        plan_type: 'free',
        features: [],
        limits: {
          api_calls_used: 0,
          api_calls_limit: 1000, // Free tier limit
          products_count: 0,
          products_limit: 10,
          users_count: 1,
          users_limit: 1,
          storage_used_gb: 0,
          storage_limit_gb: 0.1
        },
        subscription_status: 'none',
        trial_available: true,
        is_super_admin: false
      });
    }

    // Adicionar flag de super admin para entitlements normais
    return NextResponse.json({
      ...entitlements,
      is_super_admin: false
    });

  } catch (error) {
    logger.error('Failed to get tenant entitlements');

    return NextResponse.json(
      { error: 'Failed to retrieve entitlements' },
      { status: 500 }
    );
  }
}