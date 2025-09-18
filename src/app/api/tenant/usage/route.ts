/**
 * Tenant Usage API Route - Peepers Enterprise v2.0.0
 *
 * API para atualizar e controlar o uso do tenant
 */

import { NextRequest, NextResponse } from 'next/server';
import { TenantMiddleware } from '@/infrastructure/middleware/TenantMiddleware';
import { TenantDomainService } from '@/domain/services/TenantDomainService';
import { getKVClient } from '@/lib/cache';

export async function POST(request: NextRequest) {
  try {
    // Aplicar middleware de isolamento de tenant
    const middlewareResult = await TenantMiddleware.handleTenantIsolation(request);

    if (middlewareResult instanceof NextResponse && !middlewareResult.ok) {
      return middlewareResult;
    }

    const body = await request.json();
    const { operation, increment = 1 } = body;

    if (!operation) {
      return NextResponse.json(
        { error: 'Operation is required' },
        { status: 400 }
      );
    }

    // Extrair contexto do tenant
    const tenantContextHeader = request.headers.get('x-tenant-context');

    if (!tenantContextHeader) {
      return NextResponse.json(
        { error: 'Tenant context not found' },
        { status: 500 }
      );
    }

    const tenantContext = JSON.parse(tenantContextHeader);
    const tenant = tenantContext.tenant;

    // Verificar se a operação é permitida
    const allowedOperations = [
      'create_product',
      'process_order',
      'api_call',
      'upload_file',
      'invite_user'
    ];

    if (!allowedOperations.includes(operation)) {
      return NextResponse.json(
        { error: 'Invalid operation' },
        { status: 400 }
      );
    }

    // Verificar rate limiting
    const rateLimitOk = await TenantMiddleware.checkRateLimit(tenant.id, operation);

    if (!rateLimitOk) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Verificar se o tenant pode executar a operação
    const canPerform = TenantDomainService.canPerformOperation(tenant, operation as any);

    if (!canPerform) {
      return NextResponse.json(
        { error: 'Operation not allowed: limit exceeded' },
        { status: 403 }
      );
    }

    // Atualizar uso do tenant
    const updatedTenant = TenantDomainService.updateUsage(tenant, operation as any, increment);

    // Salvar no cache
    const kv = getKVClient();
    const cacheKey = `tenant:${tenant.id}`;
    await kv.set(cacheKey, updatedTenant, { ex: 3600 }); // 1 hora

    // Criar novo contexto
    const updatedContext = TenantDomainService.createTenantContext(updatedTenant, tenantContext.user);

    return NextResponse.json({
      tenant: updatedTenant,
      context: updatedContext,
      operation,
      increment,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error updating tenant usage:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Obter estatísticas de uso do tenant
 */
export async function GET(request: NextRequest) {
  try {
    // Aplicar middleware de isolamento de tenant
    const middlewareResult = await TenantMiddleware.handleTenantIsolation(request);

    if (middlewareResult instanceof NextResponse && !middlewareResult.ok) {
      return middlewareResult;
    }

    // Extrair contexto do tenant
    const tenantContextHeader = request.headers.get('x-tenant-context');

    if (!tenantContextHeader) {
      return NextResponse.json(
        { error: 'Tenant context not found' },
        { status: 500 }
      );
    }

    const tenantContext = JSON.parse(tenantContextHeader);
    const tenant = tenantContext.tenant;

    // Calcular percentuais de uso
    const usagePercentages = {
      products: Math.round((tenant.usage.products_count / tenant.limits.products) * 100),
      orders: Math.round((tenant.usage.orders_this_month / tenant.limits.orders_per_month) * 100),
      api_calls: Math.round((tenant.usage.api_calls_today / tenant.limits.api_calls_per_hour) * 100),
      storage: Math.round((tenant.usage.storage_used_gb / tenant.limits.storage_gb) * 100),
      team_members: Math.round((tenant.usage.team_members_count / tenant.limits.team_members) * 100),
    };

    return NextResponse.json({
      usage: tenant.usage,
      limits: tenant.limits,
      percentages: usagePercentages,
      plan: tenant.subscription.plan,
      status: tenant.subscription.status,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error fetching tenant usage:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}