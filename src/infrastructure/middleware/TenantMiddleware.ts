/**
 * Tenant Middleware - Peepers Enterprise v2.0.0
 *
 * Middleware para isolamento multi-tenant e validação de contexto
 */

import { NextRequest, NextResponse } from 'next/server';
import { PeepersTenant, PeepersUser, TenantContext } from '@/types/tenant';
import { TenantDomainService } from '@/domain/services/TenantDomainService';
import { getKVClient } from '@/lib/cache';

export class TenantMiddleware {
  private static readonly TENANT_CACHE_TTL = 3600; // 1 hour
  private static readonly USER_CACHE_TTL = 1800;   // 30 minutes

  /**
   * Middleware principal para isolamento de tenant
   */
  static async handleTenantIsolation(request: NextRequest): Promise<NextResponse | null> {
    try {
      // Extrair tenant_id da URL ou header
      const tenantId = this.extractTenantId(request);

      if (!tenantId) {
        return NextResponse.json(
          { error: 'Tenant ID required' },
          { status: 400 }
        );
      }

      // Buscar tenant no cache
      const tenant = await this.getTenantFromCache(tenantId);

      if (!tenant) {
        return NextResponse.json(
          { error: 'Tenant not found' },
          { status: 404 }
        );
      }

      // Validar acesso do tenant
      if (!TenantDomainService.validateTenantAccess(tenant)) {
        return NextResponse.json(
          { error: 'Tenant access denied' },
          { status: 403 }
        );
      }

      // Extrair user_id do contexto de autenticação
      const userId = this.extractUserId(request);

      if (!userId) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      // Buscar usuário no cache
      const user = await this.getUserFromCache(userId);

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Validar que usuário pertence ao tenant
      if (user.tenant_id !== tenantId) {
        return NextResponse.json(
          { error: 'Access denied: User does not belong to tenant' },
          { status: 403 }
        );
      }

      // Verificar se usuário está ativo
      if (user.status !== 'active') {
        return NextResponse.json(
          { error: 'User account is not active' },
          { status: 403 }
        );
      }

      // Criar contexto do tenant
      const tenantContext = TenantDomainService.createTenantContext(tenant, user);

      // Adicionar contexto ao request
      const response = NextResponse.next();
      response.headers.set('x-tenant-id', tenantId);
      response.headers.set('x-user-id', userId);
      response.headers.set('x-tenant-context', JSON.stringify(tenantContext));

      return response;

    } catch (error) {
      console.error('Tenant middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * Extrai tenant_id da requisição
   */
  private static extractTenantId(request: NextRequest): string | null {
    // Tentar extrair do header
    const headerTenantId = request.headers.get('x-tenant-id');
    if (headerTenantId) {
      return headerTenantId;
    }

    // Tentar extrair da URL (subdomain ou path)
    const url = new URL(request.url);
    const hostname = url.hostname;

    // Subdomain approach: tenant1.peepers.com
    if (hostname.includes('.peepers.com')) {
      const subdomain = hostname.split('.')[0];
      if (subdomain !== 'www' && subdomain !== 'app') {
        return subdomain;
      }
    }

    // Path approach: /tenant/{tenantId}/...
    const pathSegments = url.pathname.split('/');
    if (pathSegments[1] === 'tenant' && pathSegments[2]) {
      return pathSegments[2];
    }

    return null;
  }

  /**
   * Extrai user_id da requisição (do contexto de autenticação)
   */
  private static extractUserId(request: NextRequest): string | null {
    // Tentar do header de autenticação
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      // Aqui seria validado o JWT token
      // Por enquanto, assumimos que o user_id está no header
      return request.headers.get('x-user-id');
    }

    // Do cookie de sessão
    const sessionCookie = request.cookies.get('peepers_session');
    if (sessionCookie) {
      // Aqui seria decodificado o cookie de sessão
      return sessionCookie.value;
    }

    return null;
  }

  /**
   * Busca tenant no cache
   */
  private static async getTenantFromCache(tenantId: string): Promise<PeepersTenant | null> {
    try {
      const kv = getKVClient();
      const cacheKey = `tenant:${tenantId}`;
  const cached = (await kv.get(cacheKey)) as PeepersTenant | null;

      if (cached) {
        return cached;
      }

      // Se não estiver no cache, buscar do "banco de dados"
      // Por enquanto, retornar um tenant mock para desenvolvimento
      const mockTenant: PeepersTenant = {
        id: tenantId,
        name: 'Demo Tenant',
        slug: 'demo',
        ml_user_id: 12345,
        ml_users: [12345],
        subscription: {
          plan: 'starter',
          status: 'active',
          billing_cycle: 'monthly',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
        settings: {
          timezone: 'America/Sao_Paulo',
          currency: 'BRL',
          language: 'pt-BR',
          business_type: 'small_business',
          notifications: {
            email: true,
            sms: false,
            push: true,
          },
        },
        limits: TenantDomainService.getPlanLimits('starter'),
        usage: {
          products_count: 0,
          orders_this_month: 0,
          api_calls_today: 0,
          storage_used_gb: 0,
          team_members_count: 1,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'active',
      };

      // Salvar no cache
      await kv.set(cacheKey, mockTenant, { ex: this.TENANT_CACHE_TTL });

      return mockTenant;

    } catch (error) {
      console.error('Error fetching tenant from cache:', error);
      return null;
    }
  }

  /**
   * Busca usuário no cache
   */
  private static async getUserFromCache(userId: string): Promise<PeepersUser | null> {
    try {
      const kv = getKVClient();
      const cacheKey = `user:${userId}`;
  const cached = (await kv.get(cacheKey)) as PeepersUser | null;

      if (cached) {
        return cached;
      }

      // Se não estiver no cache, buscar do "banco de dados"
      // Por enquanto, retornar um usuário mock para desenvolvimento
      const mockUser: PeepersUser = {
        id: userId,
        tenant_id: 'demo-tenant-id', // Deve corresponder ao tenant
        email: 'user@demo.com',
        first_name: 'Demo',
        last_name: 'User',
        role: 'owner',
        permissions: ['manage_products', 'manage_orders', 'view_analytics'],
        preferences: {
          timezone: 'America/Sao_Paulo',
          language: 'pt-BR',
          notifications: {
            orders: true,
            messages: true,
            questions: true,
            products: true,
          },
        },
        last_login: new Date().toISOString(),
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Salvar no cache
      await kv.set(cacheKey, mockUser, { ex: this.USER_CACHE_TTL });

      return mockUser;

    } catch (error) {
      console.error('Error fetching user from cache:', error);
      return null;
    }
  }

  /**
   * Verifica rate limiting por tenant
   */
  static async checkRateLimit(tenantId: string, operation: string): Promise<boolean> {
    try {
      const kv = getKVClient();
      const cacheKey = `ratelimit:${tenantId}:${operation}`;
  const current = (await kv.get(cacheKey)) as number | 0;

      // Limites por operação (exemplo)
      const limits = {
        api_call: 1000, // por hora
        create_product: 100, // por hora
        process_order: 500, // por hora
      };

      const limit = limits[operation as keyof typeof limits] || 100;

      if (current >= limit) {
        return false; // Rate limit excedido
      }

      // Incrementar contador
      await kv.set(cacheKey, current + 1, { ex: 3600 }); // 1 hora TTL

      return true;

    } catch (error) {
      console.error('Rate limit check error:', error);
      return true; // Em caso de erro, permitir a operação
    }
  }
}