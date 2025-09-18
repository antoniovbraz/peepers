/**
 * Stripe Client Tests - Peepers Enterprise v2.0.0
 *
 * Testes unitários para o cliente Stripe
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { stripeClient } from '@/lib/stripe';
import { cache } from '@/lib/cache';

// Mock do Stripe SDK
vi.mock('stripe', () => ({
  default: vi.fn().mockImplementation(() => ({
    customers: {
      list: vi.fn(),
      create: vi.fn()
    },
    subscriptions: {
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn()
    },
    webhooks: {
      constructEvent: vi.fn()
    }
  }))
}));

vi.mock('@/lib/cache');

describe('StripeClient', () => {
  let mockStripe: any;
  let mockCache: any;

  beforeEach(() => {
    // Reset mocks
    mockStripe = {
      customers: {
        list: vi.fn(),
        create: vi.fn()
      },
      subscriptions: {
        list: vi.fn(),
        create: vi.fn(),
        update: vi.fn()
      },
      webhooks: {
        constructEvent: vi.fn()
      }
    };

    mockCache = {
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn()
    };

    // Mock do cache
    (cache as any) = mockCache;

    // Mock do Stripe constructor
    const StripeMock = vi.fn().mockReturnValue(mockStripe);
    // vi.mocked(import('stripe')).mockResolvedValue({ default: StripeMock });
  });

  describe('getOrCreateCustomer', () => {
    it('should return existing customer if found', async () => {
      const existingCustomer = {
        id: 'cus_123',
        email: 'test@example.com'
      };

      mockStripe.customers.list.mockResolvedValue({
        data: [existingCustomer]
      });

      const result = await stripeClient.getOrCreateCustomer('test@example.com');

      expect(mockStripe.customers.list).toHaveBeenCalledWith({
        email: 'test@example.com',
        limit: 1
      });
      expect(result).toEqual(existingCustomer);
      expect(mockStripe.customers.create).not.toHaveBeenCalled();
    });

    it('should create new customer if not found', async () => {
      const newCustomer = {
        id: 'cus_456',
        email: 'new@example.com'
      };

      mockStripe.customers.list.mockResolvedValue({ data: [] });
      mockStripe.customers.create.mockResolvedValue(newCustomer);

      const result = await stripeClient.getOrCreateCustomer('new@example.com', 'John Doe');

      expect(mockStripe.customers.create).toHaveBeenCalledWith({
        email: 'new@example.com',
        name: 'John Doe',
        metadata: {}
      });
      expect(result).toEqual(newCustomer);
    });
  });

  describe('createSubscription', () => {
    it('should create subscription successfully', async () => {
      const subscription = {
        id: 'sub_123',
        customer: 'cus_456',
        status: 'active',
        items: {
          data: [{
            price: { id: 'price_789' }
          }]
        }
      };

      mockStripe.subscriptions.create.mockResolvedValue(subscription);

      const result = await stripeClient.createSubscription('cus_456', 'price_789');

      expect(mockStripe.subscriptions.create).toHaveBeenCalledWith({
        customer: 'cus_456',
        items: [{ price: 'price_789' }],
        metadata: {},
        trial_period_days: 14,
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent']
      });
      expect(result).toEqual(subscription);
    });
  });

  describe('getTenantEntitlement', () => {
    it('should return cached entitlement if available', async () => {
      const cachedEntitlement = {
        tenant_id: 'tenant_123',
        plan_type: 'professional',
        features: ['advanced_analytics']
      };

      mockCache.get.mockResolvedValue(JSON.stringify(cachedEntitlement));

      const result = await stripeClient.getTenantEntitlement('tenant_123');

      expect(mockCache.get).toHaveBeenCalledWith('stripe:entitlement:tenant_123');
      expect(result).toEqual(cachedEntitlement);
    });

    it('should fetch from Stripe if not cached', async () => {
      const subscription = {
        id: 'sub_123',
        status: 'active',
        current_period_end: 1640995200,
        cancel_at_period_end: false,
        items: {
          data: [{
            price: {
              id: 'price_123',
              metadata: { plan_type: 'professional' }
            }
          }]
        },
        metadata: { tenant_id: 'tenant_123' }
      };

      mockCache.get.mockResolvedValue(null);
      mockStripe.subscriptions.list.mockResolvedValue({ data: [subscription] });

      const result = await stripeClient.getTenantEntitlement('tenant_123');

      expect(result?.plan_type).toBe('professional');
      expect(result?.features).toContain('advanced_analytics');
      expect(mockCache.set).toHaveBeenCalled();
    });

    it('should return null if no subscription found', async () => {
      mockCache.get.mockResolvedValue(null);
      mockStripe.subscriptions.list.mockResolvedValue({ data: [] });

      const result = await stripeClient.getTenantEntitlement('tenant_123');

      expect(result).toBeNull();
    });
  });

  describe('checkEntitlement', () => {
    it('should allow access for included features', async () => {
      mockStripe.subscriptions.list.mockResolvedValue({
        data: [{
          status: 'active',
          current_period_end: 1640995200,
          cancel_at_period_end: false,
          items: {
            data: [{
              price: {
                metadata: { plan_type: 'professional' }
              }
            }]
          }
        }]
      });

      const result = await stripeClient.checkEntitlement('tenant_123', 'advanced_analytics');

      expect(result.allowed).toBe(true);
    });

    it('should deny access for non-included features', async () => {
      mockStripe.subscriptions.list.mockResolvedValue({
        data: [{
          status: 'active',
          items: {
            data: [{
              price: {
                metadata: { plan_type: 'starter' }
              }
            }]
          }
        }]
      });

      const result = await stripeClient.checkEntitlement('tenant_123', 'api_access');

      expect(result.allowed).toBe(false);
      expect(result.upgrade_required).toBe(true);
    });

    it('should deny access for inactive subscriptions', async () => {
      mockStripe.subscriptions.list.mockResolvedValue({
        data: [{
          status: 'canceled',
          items: {
            data: [{
              price: {
                metadata: { plan_type: 'professional' }
              }
            }]
          }
        }]
      });

      const result = await stripeClient.checkEntitlement('tenant_123', 'advanced_analytics');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('canceled');
    });
  });
});