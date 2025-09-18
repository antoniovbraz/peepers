/**
 * EntitlementsService - Unit Tests
 *
 * Testes unitários para o serviço de domínio de entitlements
 * Valida regras de negócio sem dependências externas
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EntitlementsService } from '@/domain/services/EntitlementsService';
import { TenantEntitlement, PeepersPlanType, PeepersFeature } from '@/types/stripe';

describe('EntitlementsService', () => {
  let service: EntitlementsService;
  let mockEntitlement: TenantEntitlement;

  beforeEach(() => {
    service = new EntitlementsService();

    mockEntitlement = {
      tenant_id: 'tenant_123',
      plan_type: 'professional',
      features: [
        'basic_dashboard',
        'product_sync',
        'order_management',
        'advanced_analytics',
        'multi_user'
      ],
      limits: {
        api_calls_used: 1000,
        api_calls_limit: 50000,
        products_count: 500,
        products_limit: 1000,
        users_count: 3,
        users_limit: 5,
        storage_used_gb: 2,
        storage_limit_gb: 10
      },
      subscription_status: 'active',
      current_period_end: new Date('2025-12-31'),
      cancel_at_period_end: false
    };
  });

  describe('validateFeatureAccess', () => {
    it('should allow access when feature is included in plan', () => {
      const result = service.validateFeatureAccess(mockEntitlement, 'advanced_analytics');

      expect(result.isValid).toBe(true);
      expect(result.reason).toBeUndefined();
      expect(result.requiredPlan).toBeUndefined();
    });

    it('should deny access when feature is not included in plan', () => {
      const result = service.validateFeatureAccess(mockEntitlement, 'api_access');

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('not included in professional plan');
      expect(result.requiredPlan).toBe('enterprise');
    });

    it('should deny access when no entitlement exists', () => {
      const result = service.validateFeatureAccess(null, 'basic_dashboard');

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('No active subscription found');
      expect(result.requiredPlan).toBe('starter');
    });

    it('should deny access when subscription is not active', () => {
      const inactiveEntitlement = { ...mockEntitlement, subscription_status: 'canceled' as const };
      const result = service.validateFeatureAccess(inactiveEntitlement, 'advanced_analytics');

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Subscription status: canceled');
    });

    it('should allow trialing subscriptions', () => {
      const trialingEntitlement = { ...mockEntitlement, subscription_status: 'trialing' as const };
      const result = service.validateFeatureAccess(trialingEntitlement, 'advanced_analytics');

      expect(result.isValid).toBe(true);
    });
  });

  describe('validateUsageLimits', () => {
    it('should allow when usage is below limit', () => {
      const usageCheck = { type: 'api_calls' as const, current: 1000, limit: 50000 };
      const result = service.validateUsageLimits(mockEntitlement, usageCheck);

      expect(result.isValid).toBe(true);
    });

    it('should deny when usage exceeds limit', () => {
      const usageCheck = { type: 'users' as const, current: 6, limit: 5 };
      const result = service.validateUsageLimits(mockEntitlement, usageCheck);

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('users limit exceeded');
    });

    it('should allow unlimited usage', () => {
      const unlimitedEntitlement = {
        ...mockEntitlement,
        limits: { ...mockEntitlement.limits, api_calls_limit: -1 }
      };
      const usageCheck = { type: 'api_calls' as const, current: 1000000, limit: -1 };
      const result = service.validateUsageLimits(unlimitedEntitlement, usageCheck);

      expect(result.isValid).toBe(true);
    });
  });

  describe('checkEntitlement', () => {
    it('should return allowed when all checks pass', () => {
      const result = service.checkEntitlement(mockEntitlement, 'advanced_analytics');

      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
      expect(result.upgrade_required).toBeUndefined();
    });

    it('should return denied with upgrade required when feature not included', () => {
      const result = service.checkEntitlement(mockEntitlement, 'api_access');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('not included');
      expect(result.upgrade_required).toBe(true);
    });

    it('should return denied with limit exceeded when usage limit reached', () => {
      const usageCheck = { type: 'users' as const, current: 6, limit: 5 };
      const result = service.checkEntitlement(mockEntitlement, 'multi_user', usageCheck);

      expect(result.allowed).toBe(false);
      expect(result.limit_exceeded).toEqual({
        type: 'users',
        current: 6, // from usageCheck
        limit: 5
      });
    });
  });

  describe('calculateUsagePercentage', () => {
    it('should calculate correct percentage', () => {
      const percentage = service.calculateUsagePercentage(mockEntitlement, 'api_calls');
      expect(percentage).toBe(2); // 1000/50000 = 2%
    });

    it('should return 0 for unlimited', () => {
      const unlimitedEntitlement = {
        ...mockEntitlement,
        limits: { ...mockEntitlement.limits, api_calls_limit: -1 }
      };
      const percentage = service.calculateUsagePercentage(unlimitedEntitlement, 'api_calls');
      expect(percentage).toBe(0);
    });

    it('should return 100 for zero limit', () => {
      const zeroLimitEntitlement = {
        ...mockEntitlement,
        limits: { ...mockEntitlement.limits, api_calls_limit: 0 }
      };
      const percentage = service.calculateUsagePercentage(zeroLimitEntitlement, 'api_calls');
      expect(percentage).toBe(100);
    });
  });

  describe('isNearLimit', () => {
    it('should return true when usage is 80% or more', () => {
      const highUsageEntitlement = {
        ...mockEntitlement,
        limits: { ...mockEntitlement.limits, api_calls_used: 40000, api_calls_limit: 50000 }
      };
      const isNear = service.isNearLimit(highUsageEntitlement, 'api_calls');
      expect(isNear).toBe(true);
    });

    it('should return false when usage is below 80%', () => {
      const isNear = service.isNearLimit(mockEntitlement, 'api_calls');
      expect(isNear).toBe(false);
    });
  });

  describe('getUpgradeRecommendations', () => {
    it('should recommend professional for starter near limits', () => {
      const starterEntitlement = {
        ...mockEntitlement,
        plan_type: 'starter' as PeepersPlanType,
        limits: {
          ...mockEntitlement.limits,
          api_calls_used: 4000,
          api_calls_limit: 5000,
          products_count: 80,
          products_limit: 100
        }
      };

      const recommendations = service.getUpgradeRecommendations(starterEntitlement);
      expect(recommendations).toContain('professional');
    });

    it('should recommend enterprise for professional near limits', () => {
      const professionalEntitlement = {
        ...mockEntitlement,
        limits: {
          ...mockEntitlement.limits,
          api_calls_used: 40000,
          api_calls_limit: 50000,
          users_count: 4,
          users_limit: 5
        }
      };

      const recommendations = service.getUpgradeRecommendations(professionalEntitlement);
      expect(recommendations).toContain('enterprise');
    });

    it('should return empty array when no upgrade needed', () => {
      const recommendations = service.getUpgradeRecommendations(mockEntitlement);
      expect(recommendations).toEqual([]);
    });
  });
});