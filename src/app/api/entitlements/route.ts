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

export async function GET(request: NextRequest) {
  try {
    // Extrair userId do cookie de sessão
    const sessionToken = request.cookies.get('session_token')?.value;
    const userId = request.cookies.get('user_id')?.value;

    if (!sessionToken || !userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verificar se o token existe no cache
    const cache = getKVClient();
    const tokenData = await cache.get(`user:${userId}`);
    if (!tokenData) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    const userData = JSON.parse(tokenData as string);
    if (userData.session_token !== sessionToken) {
      return NextResponse.json(
        { error: 'Session mismatch' },
        { status: 401 }
      );
    }

    // Buscar entitlements
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
        trial_available: true
      });
    }

    return NextResponse.json(entitlements);

  } catch (error) {
    logger.error({ error }, 'Failed to get tenant entitlements');

    return NextResponse.json(
      { error: 'Failed to retrieve entitlements' },
      { status: 500 }
    );
  }
}