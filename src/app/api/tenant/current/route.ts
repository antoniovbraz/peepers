/**
 * Tenant Current API Route - Peepers Enterprise v2.0.0
 *
 * API para obter dados do tenant atual do usuário
 */

import { NextRequest, NextResponse } from 'next/server';
import { TenantMiddleware } from '@/infrastructure/middleware/TenantMiddleware';
import { TenantDomainService } from '@/domain/services/TenantDomainService';

export async function GET(request: NextRequest) {
  try {
    // Aplicar middleware de isolamento de tenant
    const middlewareResult = await TenantMiddleware.handleTenantIsolation(request);

    if (middlewareResult instanceof NextResponse && !middlewareResult.ok) {
      return middlewareResult;
    }

    // Extrair contexto do tenant dos headers
    const tenantContextHeader = request.headers.get('x-tenant-context');

    if (!tenantContextHeader) {
      return NextResponse.json(
        { error: 'Tenant context not found' },
        { status: 500 }
      );
    }

    const tenantContext = JSON.parse(tenantContextHeader);

    return NextResponse.json({
      tenant: tenantContext.tenant,
      user: tenantContext.user,
      context: tenantContext,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error fetching current tenant:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Atualizar dados do tenant
 */
export async function PUT(request: NextRequest) {
  try {
    // Aplicar middleware de isolamento de tenant
    const middlewareResult = await TenantMiddleware.handleTenantIsolation(request);

    if (middlewareResult instanceof NextResponse && !middlewareResult.ok) {
      return middlewareResult;
    }

    const body = await request.json();
    const { settings, preferences } = body;

    // Extrair contexto do tenant
    const tenantContextHeader = request.headers.get('x-tenant-context');

    if (!tenantContextHeader) {
      return NextResponse.json(
        { error: 'Tenant context not found' },
        { status: 500 }
      );
    }

    const tenantContext = JSON.parse(tenantContextHeader);

    // Aqui seria implementada a lógica para atualizar o tenant no banco/cache
    // Por enquanto, apenas retornamos os dados atuais

    return NextResponse.json({
      tenant: tenantContext.tenant,
      user: tenantContext.user,
      context: tenantContext,
      updated: true,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error updating tenant:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}