/**
 * Entitlements Manager - Application Layer
 *
 * Gerenciador de entitlements que coordena entre domain e infrastructure
 * Implementa lógica de aplicação para verificação de entitlements
 *
 * Clean Architecture: Application Layer
 * Coordena domain services com infrastructure
 */

import { PeepersFeature, TenantEntitlement, EntitlementCheck } from '@/types/stripe';
import { EntitlementsService, UsageLimitCheck } from '@/domain/services/EntitlementsService';
import { logger } from '@/lib/logger';

export interface EntitlementContext {
  tenantId: string;
  userId?: string;
  feature: PeepersFeature;
  usageCheck?: UsageLimitCheck;
  clientIP?: string;
  userAgent?: string;
}

export interface EntitlementResult extends EntitlementCheck {
  context: EntitlementContext;
  timestamp: Date;
  processingTime: number;
}

export class EntitlementsManager {
  private entitlementsService: EntitlementsService;

  constructor() {
    this.entitlementsService = new EntitlementsService();
  }

  /**
   * Verifica entitlement completo com contexto e logging
   */
  async checkEntitlement(
    context: EntitlementContext,
    entitlement: TenantEntitlement | null
  ): Promise<EntitlementResult> {
    const startTime = Date.now();

    try {
      // Executar verificação no domínio
      const checkResult = this.entitlementsService.checkEntitlement(
        entitlement,
        context.feature,
        context.usageCheck
      );

      const processingTime = Date.now() - startTime;
      const result: EntitlementResult = {
        ...checkResult,
        context,
        timestamp: new Date(),
        processingTime
      };

      // Log detalhado para auditoria
      this.logEntitlementCheck(result);

      return result;

    } catch (error) {
      const processingTime = Date.now() - startTime;

      logger.error({
        error,
        context,
        processingTime
      }, 'Error checking entitlement');

      // Em caso de erro, permitir acesso para evitar downtime
      const fallbackResult: EntitlementResult = {
        allowed: true,
        reason: 'Error checking entitlement, allowing access to prevent downtime',
        context,
        timestamp: new Date(),
        processingTime
      };

      this.logEntitlementCheck(fallbackResult);
      return fallbackResult;
    }
  }

  /**
   * Verifica apenas feature access (sem limites de uso)
   */
  async checkFeatureAccess(
    context: Omit<EntitlementContext, 'usageCheck'>,
    entitlement: TenantEntitlement | null
  ): Promise<EntitlementResult> {
    return this.checkEntitlement(context, entitlement);
  }

  /**
   * Verifica apenas limites de uso (assumindo feature já validada)
   */
  async checkUsageLimits(
    context: EntitlementContext,
    entitlement: TenantEntitlement
  ): Promise<EntitlementResult> {
    const startTime = Date.now();

    try {
      const validation = this.entitlementsService.validateUsageLimits(
        entitlement,
        context.usageCheck!
      );

      const processingTime = Date.now() - startTime;
      const result: EntitlementResult = {
        allowed: validation.isValid,
        reason: validation.reason,
        context,
        timestamp: new Date(),
        processingTime,
        ...(validation.isValid ? {} : {
          limit_exceeded: {
            type: context.usageCheck!.type,
            current: context.usageCheck!.current,
            limit: context.usageCheck!.limit
          }
        })
      };

      this.logEntitlementCheck(result);
      return result;

    } catch (error) {
      const processingTime = Date.now() - startTime;

      logger.error({
        error,
        context,
        processingTime
      }, 'Error checking usage limits');

      return {
        allowed: true,
        reason: 'Error checking usage limits, allowing access',
        context,
        timestamp: new Date(),
        processingTime
      };
    }
  }

  /**
   * Calcula métricas de uso para dashboard
   */
  calculateUsageMetrics(entitlement: TenantEntitlement) {
    return {
      api_calls: {
        used: entitlement.limits.api_calls_used,
        limit: entitlement.limits.api_calls_limit,
        percentage: this.entitlementsService.calculateUsagePercentage(entitlement, 'api_calls'),
        near_limit: this.entitlementsService.isNearLimit(entitlement, 'api_calls')
      },
      products: {
        used: entitlement.limits.products_count,
        limit: entitlement.limits.products_limit,
        percentage: this.entitlementsService.calculateUsagePercentage(entitlement, 'products'),
        near_limit: this.entitlementsService.isNearLimit(entitlement, 'products')
      },
      users: {
        used: entitlement.limits.users_count,
        limit: entitlement.limits.users_limit,
        percentage: this.entitlementsService.calculateUsagePercentage(entitlement, 'users'),
        near_limit: this.entitlementsService.isNearLimit(entitlement, 'users')
      },
      storage: {
        used: entitlement.limits.storage_used_gb,
        limit: entitlement.limits.storage_limit_gb,
        percentage: this.entitlementsService.calculateUsagePercentage(entitlement, 'storage'),
        near_limit: this.entitlementsService.isNearLimit(entitlement, 'storage')
      }
    };
  }

  /**
   * Obtém recomendações de upgrade
   */
  getUpgradeRecommendations(entitlement: TenantEntitlement) {
    return this.entitlementsService.getUpgradeRecommendations(entitlement);
  }

  /**
   * Log estruturado para auditoria de entitlements
   */
  private logEntitlementCheck(result: EntitlementResult): void {
    const logData = {
      tenant_id: result.context.tenantId,
      user_id: result.context.userId,
      feature: result.context.feature,
      allowed: result.allowed,
      reason: result.reason,
      processing_time: result.processingTime,
      client_ip: result.context.clientIP,
      user_agent: result.context.userAgent,
      limit_exceeded: result.limit_exceeded,
      timestamp: result.timestamp.toISOString()
    };

    if (result.allowed) {
      logger.info(logData, 'Entitlement check passed');
    } else {
      logger.warn(logData, 'Entitlement check failed');
    }
  }
}

// Singleton instance
export const entitlementsManager = new EntitlementsManager();