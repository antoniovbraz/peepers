/**
 * Tenant Domain Service - Peepers Enterprise v2.0.0
 *
 * Serviço de domínio para isolamento e gerenciamento multi-tenant
 */

import { PeepersTenant, PeepersUser, TenantContext, TenantEntitlement } from '@/types/tenant';

export class TenantDomainService {
  /**
   * Valida se o tenant está ativo e dentro dos limites
   */
  static validateTenantAccess(tenant: PeepersTenant): boolean {
    if (tenant.status !== 'active') {
      return false;
    }

    if (tenant.subscription.status !== 'active' && tenant.subscription.status !== 'trial') {
      return false;
    }

    // Verificar se trial expirou
    if (tenant.subscription.status === 'trial' && tenant.subscription.trial_ends_at) {
      const trialEnd = new Date(tenant.subscription.trial_ends_at);
      if (trialEnd < new Date()) {
        return false;
      }
    }

    return true;
  }

  /**
   * Verifica se o tenant pode executar uma operação baseada nos limites
   */
  static canPerformOperation(
    tenant: PeepersTenant,
    operation: 'create_product' | 'process_order' | 'api_call' | 'upload_file' | 'invite_user'
  ): boolean {
    const usage = tenant.usage;
    const limits = tenant.limits;

    switch (operation) {
      case 'create_product':
        return usage.products_count < limits.products;
      case 'process_order':
        return usage.orders_this_month < limits.orders_per_month;
      case 'api_call':
        return usage.api_calls_today < limits.api_calls_per_hour;
      case 'upload_file':
        return usage.storage_used_gb < limits.storage_gb;
      case 'invite_user':
        return usage.team_members_count < limits.team_members;
      default:
        return false;
    }
  }

  /**
   * Atualiza o uso do tenant após uma operação
   */
  static updateUsage(
    tenant: PeepersTenant,
    operation: 'create_product' | 'process_order' | 'api_call' | 'upload_file' | 'invite_user',
    increment: number = 1
  ): PeepersTenant {
    const updatedTenant = { ...tenant };

    switch (operation) {
      case 'create_product':
        updatedTenant.usage.products_count += increment;
        break;
      case 'process_order':
        updatedTenant.usage.orders_this_month += increment;
        break;
      case 'api_call':
        updatedTenant.usage.api_calls_today += increment;
        break;
      case 'upload_file':
        updatedTenant.usage.storage_used_gb += increment;
        break;
      case 'invite_user':
        updatedTenant.usage.team_members_count += increment;
        break;
    }

    updatedTenant.updated_at = new Date().toISOString();
    return updatedTenant;
  }

  /**
   * Cria contexto do tenant para operações
   */
  static createTenantContext(tenant: PeepersTenant, user: PeepersUser): TenantContext {
    const permissions = this.getUserPermissions(user);

    return {
      tenant,
      user,
      permissions,
      isOwner: user.role === 'owner',
      isAdmin: user.role === 'admin' || user.role === 'owner',
      canAccessFeature: (feature: string) => permissions.includes(feature)
    };
  }

  /**
   * Obtém permissões do usuário baseado no papel
   */
  private static getUserPermissions(user: PeepersUser): string[] {
    const basePermissions = ['read_products', 'read_orders'];

    switch (user.role) {
      case 'owner':
        return [
          ...basePermissions,
          'manage_products',
          'manage_orders',
          'manage_users',
          'manage_billing',
          'manage_settings',
          'view_analytics',
          'export_data'
        ];
      case 'admin':
        return [
          ...basePermissions,
          'manage_products',
          'manage_orders',
          'manage_users',
          'view_analytics',
          'export_data'
        ];
      case 'manager':
        return [
          ...basePermissions,
          'manage_products',
          'manage_orders',
          'view_analytics'
        ];
      case 'operator':
        return [
          ...basePermissions,
          'manage_products',
          'manage_orders'
        ];
      case 'viewer':
        return basePermissions;
      default:
        return [];
    }
  }

  /**
   * Verifica se o usuário pode acessar um recurso específico
   */
  static canUserAccessResource(
    user: PeepersUser,
    resource: string,
    action: 'read' | 'write' | 'delete' | 'manage'
  ): boolean {
    const permissions = this.getUserPermissions(user);
    const requiredPermission = `${action}_${resource}`;

    return permissions.includes(requiredPermission) ||
           permissions.includes(`manage_${resource}`) ||
           user.role === 'owner';
  }

  /**
   * Obtém os limites do plano do tenant
   */
  static getPlanLimits(plan: 'starter' | 'professional' | 'enterprise'): TenantEntitlement['limits'] {
    switch (plan) {
      case 'starter':
        return {
          products: 100,
          orders_per_month: 500,
          api_calls_per_hour: 1000,
          storage_gb: 1,
          team_members: 3
        };
      case 'professional':
        return {
          products: 1000,
          orders_per_month: 5000,
          api_calls_per_hour: 5000,
          storage_gb: 10,
          team_members: 10
        };
      case 'enterprise':
        return {
          products: -1, // Unlimited
          orders_per_month: -1,
          api_calls_per_hour: 25000,
          storage_gb: 100,
          team_members: 50
        };
      default:
        return this.getPlanLimits('starter');
    }
  }

  /**
   * Calcula o custo do plano
   */
  static getPlanPricing(plan: 'starter' | 'professional' | 'enterprise', cycle: 'monthly' | 'quarterly' | 'yearly'): number {
    const monthlyPrices = {
      starter: 29.90,
      professional: 99.90,
      enterprise: 299.90
    };

    const basePrice = monthlyPrices[plan];

    switch (cycle) {
      case 'monthly':
        return basePrice;
      case 'quarterly':
        return basePrice * 3 * 0.95; // 5% discount
      case 'yearly':
        return basePrice * 12 * 0.85; // 15% discount
      default:
        return basePrice;
    }
  }
}