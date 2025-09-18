/**
 * EntitlementsManager - Unit Tests
 *
 * Testes unitários para o manager de entitlements
 * Valida coordenação entre domain e infrastructure
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { EntitlementsManager } from '@/lib/entitlements';
import { TenantEntitlement, PeepersFeature } from '@/types/stripe';

describe('EntitlementsManager', () => {
  let manager: EntitlementsManager;
  let mockEntitlement: TenantEntitlement;

  beforeEach(() => {
    manager = new EntitlementsManager();

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

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('checkEntitlement', () => {
    it('should return successful result when entitlement is valid', async () => {
      const context = {
        tenantId: 'tenant_123',
        userId: 'user_123',
        feature: 'advanced_analytics' as PeepersFeature,
        clientIP: '127.0.0.1',
        userAgent: 'test-agent'
      };

      const result = await manager.checkEntitlement(context, mockEntitlement);

      expect(result.allowed).toBe(true);
      expect(result.context).toEqual(context);
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should return denied result when feature not included', async () => {
      const context = {
        tenantId: 'tenant_123',
        userId: 'user_123',
        feature: 'api_access' as PeepersFeature
      };

      const result = await manager.checkEntitlement(context, mockEntitlement);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('not included in professional plan');
      expect(result.upgrade_required).toBe(true); // Domain service sets this
    });

    it('should return denied result when no entitlement', async () => {
      const context = {
        tenantId: 'tenant_123',
        userId: 'user_123',
        feature: 'basic_dashboard' as PeepersFeature
      };

      const result = await manager.checkEntitlement(context, null);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('No active subscription found');
    });

    it('should handle usage limit checks', async () => {
      const context = {
        tenantId: 'tenant_123',
        userId: 'user_123',
        feature: 'multi_user' as PeepersFeature,
        usageCheck: {
          type: 'users' as const,
          current: 6,
          limit: 5
        }
      };

      const result = await manager.checkEntitlement(context, mockEntitlement);

      expect(result.allowed).toBe(false);
      expect(result.limit_exceeded).toEqual({
        type: 'users',
        current: 6, // from usageCheck
        limit: 5
      });
    });

    it('should fallback to allow access on errors', async () => {
      // Mock console.error to avoid noise
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const context = {
        tenantId: 'tenant_123',
        userId: 'user_123',
        feature: 'advanced_analytics' as PeepersFeature
      };

      // Create a mock entitlement that will cause a TypeError
      const badEntitlement = null as any; // This will cause the domain service to throw

      // Mock the domain service to throw an error
      const error = new Error('Test error');
      vi.spyOn(manager['entitlementsService'], 'checkEntitlement').mockImplementation(() => {
        throw error;
      });

      const result = await manager.checkEntitlement(context, badEntitlement);

      expect(result.allowed).toBe(true);
      expect(result.reason).toBeDefined();
      expect(result.reason).toContain('allowing access');

      consoleSpy.mockRestore();
    });
  });

  describe('checkFeatureAccess', () => {
    it('should work without usage check', async () => {
      const context = {
        tenantId: 'tenant_123',
        userId: 'user_123',
        feature: 'advanced_analytics' as PeepersFeature
      };

      const result = await manager.checkFeatureAccess(context, mockEntitlement);

      expect(result.allowed).toBe(true);
      expect(result.context).toEqual(context);
    });
  });

  describe('checkUsageLimits', () => {
    it('should validate usage limits only', async () => {
      const context = {
        tenantId: 'tenant_123',
        userId: 'user_123',
        feature: 'multi_user' as PeepersFeature,
        usageCheck: {
          type: 'users' as const,
          current: 3,
          limit: 5
        }
      };

      const result = await manager.checkUsageLimits(context, mockEntitlement);

      expect(result.allowed).toBe(true);
    });

    it('should deny when usage exceeds limit', async () => {
      const context = {
        tenantId: 'tenant_123',
        userId: 'user_123',
        feature: 'multi_user' as PeepersFeature,
        usageCheck: {
          type: 'users' as const,
          current: 6,
          limit: 5
        }
      };

      const result = await manager.checkUsageLimits(context, mockEntitlement);

      expect(result.allowed).toBe(false);
      expect(result.limit_exceeded).toEqual({
        type: 'users',
        current: 6,
        limit: 5
      });
    });
  });

  describe('calculateUsageMetrics', () => {
    it('should calculate all usage metrics correctly', () => {
      const metrics = manager.calculateUsageMetrics(mockEntitlement);

      expect(metrics.api_calls).toEqual({
        used: 1000,
        limit: 50000,
        percentage: 2,
        near_limit: false
      });

      expect(metrics.products).toEqual({
        used: 500,
        limit: 1000,
        percentage: 50,
        near_limit: false
      });

      expect(metrics.users).toEqual({
        used: 3,
        limit: 5,
        percentage: 60,
        near_limit: false
      });

      expect(metrics.storage).toEqual({
        used: 2,
        limit: 10,
        percentage: 20,
        near_limit: false
      });
    });

    it('should detect near limit usage', () => {
      const highUsageEntitlement = {
        ...mockEntitlement,
        limits: {
          ...mockEntitlement.limits,
          api_calls_used: 45000,
          api_calls_limit: 50000
        }
      };

      const metrics = manager.calculateUsageMetrics(highUsageEntitlement);
      expect(metrics.api_calls.near_limit).toBe(true);
    });
  });

  describe('getUpgradeRecommendations', () => {
    it('should recommend upgrades based on usage', () => {
      const highUsageEntitlement = {
        ...mockEntitlement,
        plan_type: 'starter' as const,
        limits: {
          ...mockEntitlement.limits,
          api_calls_used: 4000,
          api_calls_limit: 5000,
          products_count: 80,
          products_limit: 100
        }
      };

      const recommendations = manager.getUpgradeRecommendations(highUsageEntitlement);
      expect(recommendations).toContain('professional');
    });
  });
});