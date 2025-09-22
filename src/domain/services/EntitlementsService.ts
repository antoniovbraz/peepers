/**
 * Entitlements Service - Domain Layer
 *
 * Serviço de domínio para gerenciamento de entitlements
 * Implementa regras de negócio para validação de planos e features
 *
 * Clean Architecture: Domain Layer
 * Não depende de infraestrutura externa (Stripe, cache, etc.)
 */

import { PeepersPlanType, PeepersFeature, TenantEntitlement, EntitlementCheck } from '@/types/stripe';
// import { PEEPERS_PLANS } from '@/config/entitlements';

export interface EntitlementValidationResult {
  isValid: boolean;
  reason?: string;
  requiredPlan?: PeepersPlanType;
}

export interface UsageLimitCheck {
  type: 'api_calls' | 'products' | 'users' | 'storage';
  current: number;
  limit: number;
}

export class EntitlementsService {
  /**
   * Valida se um tenant tem direito a uma feature específica
   */
  validateFeatureAccess(
    entitlement: TenantEntitlement | null,
    feature: PeepersFeature
  ): EntitlementValidationResult {
    // Sem entitlement = sem acesso
    if (!entitlement) {
      return {
        isValid: false,
        reason: 'No active subscription found',
        requiredPlan: this.getMinimumPlanForFeature(feature)
      };
    }

    // Subscription não ativa = sem acesso
    if (!this.isSubscriptionActive(entitlement.subscription_status)) {
      return {
        isValid: false,
        reason: `Subscription status: ${entitlement.subscription_status}`,
        requiredPlan: this.getMinimumPlanForFeature(feature)
      };
    }

    // Feature não incluída no plano = sem acesso
    if (!entitlement.features.includes(feature)) {
      return {
        isValid: false,
        reason: `Feature '${feature}' not included in ${entitlement.plan_type} plan`,
        requiredPlan: this.getMinimumPlanForFeature(feature)
      };
    }

    return { isValid: true };
  }

  /**
   * Valida se um tenant não excedeu limites de uso
   */
  validateUsageLimits(
    entitlement: TenantEntitlement,
    usageCheck: UsageLimitCheck
  ): EntitlementValidationResult {
    const limit = usageCheck.limit;
    const used = usageCheck.current;

    // Limite ilimitado = sempre válido
    if (limit === -1) {
      return { isValid: true };
    }

    // Verificar se excedeu limite
    if (used >= limit) {
      return {
        isValid: false,
        reason: `${usageCheck.type} limit exceeded (${used}/${limit})`
      };
    }

    return { isValid: true };
  }

  /**
   * Executa verificação completa de entitlement
   */
  checkEntitlement(
    entitlement: TenantEntitlement | null,
    feature: PeepersFeature,
    usageCheck?: UsageLimitCheck
  ): EntitlementCheck {
    // Validar acesso à feature
    const featureValidation = this.validateFeatureAccess(entitlement, feature);
    if (!featureValidation.isValid) {
      return {
        allowed: false,
        reason: featureValidation.reason,
        upgrade_required: true
      };
    }

    // Se não há entitlement, já falhou na validação acima
    if (!entitlement) {
      return {
        allowed: false,
        reason: 'No entitlement data available',
        upgrade_required: true
      };
    }

    // Validar limites de uso se fornecidos
    if (usageCheck) {
      const usageValidation = this.validateUsageLimits(entitlement, usageCheck);
      if (!usageValidation.isValid) {
        return {
          allowed: false,
          reason: usageValidation.reason,
          limit_exceeded: {
            type: usageCheck.type,
            current: usageCheck.current,
            limit: usageCheck.limit
          }
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Determina o plano mínimo necessário para uma feature
   */
  private getMinimumPlanForFeature(feature: PeepersFeature): PeepersPlanType {
    // Features básicas disponíveis em todos os planos
    const basicFeatures: PeepersFeature[] = [
      'basic_analytics',
      'product_monitoring',
      'basic_pricing'
    ];

    if (basicFeatures.includes(feature)) {
      return 'starter';
    }

    // Features do plano Professional
    const professionalFeatures: PeepersFeature[] = [
      'advanced_analytics',
      'advanced_reports'
    ];

    if (professionalFeatures.includes(feature)) {
      return 'business';
    }

    // Features do plano Enterprise
    const enterpriseFeatures: PeepersFeature[] = [
      'api_access',
      'white_label',
      'dedicated_support',
      'market_intelligence'
    ];

    if (enterpriseFeatures.includes(feature)) {
      return 'enterprise';
    }

    // Default para enterprise se não identificado
    return 'enterprise';
  }

  /**
   * Verifica se uma subscription está ativa
   */
  private isSubscriptionActive(status: string): boolean {
    const activeStatuses = ['active', 'trialing'];
    return activeStatuses.includes(status);
  }

  /**
   * Obtém valor do limite para um tipo específico
   */
  private getLimitValue(entitlement: TenantEntitlement, type: string): number {
    let limit: number;

    switch (type) {
      case 'api_calls':
        limit = entitlement.limits.api_calls_limit;
        break;
      case 'products':
        limit = entitlement.limits.products_limit;
        break;
      case 'users':
        limit = entitlement.limits.users_limit;
        break;
      case 'storage':
        limit = entitlement.limits.storage_limit_gb;
        break;
      default:
        limit = 0;
    }

    // Validar se o limite é um número válido
    if (typeof limit !== 'number' || isNaN(limit)) {
      return 0;
    }

    return limit;
  }

  /**
   * Obtém valor usado para um tipo específico
   */
  private getUsedValue(entitlement: TenantEntitlement, type: string): number {
    let used: number;

    switch (type) {
      case 'api_calls':
        used = entitlement.limits.api_calls_used;
        break;
      case 'products':
        used = entitlement.limits.products_count;
        break;
      case 'users':
        used = entitlement.limits.users_count;
        break;
      case 'storage':
        used = entitlement.limits.storage_used_gb;
        break;
      default:
        used = 0;
    }

    // Validar se o valor usado é um número válido
    if (typeof used !== 'number' || isNaN(used)) {
      return 0;
    }

    return used;
  }

  /**
   * Calcula percentual de uso de um limite
   */
  calculateUsagePercentage(entitlement: TenantEntitlement, type: 'api_calls' | 'products' | 'users' | 'storage'): number {
    const limit = this.getLimitValue(entitlement, type);
    const used = this.getUsedValue(entitlement, type);

    // Limite ilimitado
    if (limit === -1) {
      return 0;
    }

    // Evitar divisão por zero
    if (limit === 0) {
      return 100;
    }

    return Math.round((used / limit) * 100);
  }

  /**
   * Verifica se um tenant está próximo do limite (80%+)
   */
  isNearLimit(entitlement: TenantEntitlement, type: 'api_calls' | 'products' | 'users' | 'storage'): boolean {
    const percentage = this.calculateUsagePercentage(entitlement, type);
    return percentage >= 80;
  }

  /**
   * Obtém recomendações de upgrade baseadas no uso
   */
  getUpgradeRecommendations(entitlement: TenantEntitlement): PeepersPlanType[] {
    const recommendations: PeepersPlanType[] = [];

    // Se está no starter e usa muito
    if (entitlement.plan_type === 'starter') {
      if (this.isNearLimit(entitlement, 'api_calls') ||
          this.isNearLimit(entitlement, 'products') ||
          this.isNearLimit(entitlement, 'users')) {
        recommendations.push('business');
      }
    }

    // Se está no professional e usa muito
    if (entitlement.plan_type === 'business') {
      if (this.isNearLimit(entitlement, 'api_calls') ||
          this.isNearLimit(entitlement, 'users')) {
        recommendations.push('enterprise');
      }
    }

    return recommendations;
  }
}