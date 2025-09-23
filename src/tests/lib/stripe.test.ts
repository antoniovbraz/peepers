/**
 * Stripe Client Tests - Peepers Enterprise v2.0.0
 *
 * Testes unitários para o cliente Stripe
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock do Stripe SDK (must be declared before importing stripeClient)
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

// Mock do cache (must be declared before importing stripeClient)
vi.mock('@/lib/cache', () => ({
  getKVClient: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn()
  }))
}));

import { stripeClient } from '@/lib/stripe';

describe('StripeClient', () => {
  let mockStripe: {
    customers: {
      list: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
    };
    subscriptions: {
      list: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    webhooks: {
      constructEvent: ReturnType<typeof vi.fn>;
    };
  };
  let mockCache: {
    get: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
    del: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    // Setup Stripe mock
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

    // Setup cache mock
    mockCache = {
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn()
    };
    // Inject mocks into the stripe client singleton (use imported client)
    const client = stripeClient;
    client.__setStripeInstanceForTest(mockStripe);
    // Wire cache mock to exported getKVClient via dynamic import
    const cache = await import('@/lib/cache');
    (cache.getKVClient as any).mockReturnValue(mockCache);
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
        plan_type: 'business',
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
              metadata: { plan_type: 'business' }
            }
          }]
        },
        metadata: { tenant_id: 'tenant_123' }
      };

      mockCache.get.mockResolvedValue(null);
      mockStripe.subscriptions.list.mockResolvedValue({ data: [subscription] });

      const result = await stripeClient.getTenantEntitlement('tenant_123');

      expect(result?.plan_type).toBe('business');
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
                metadata: { plan_type: 'business' }
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
                metadata: { plan_type: 'business' }
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

  describe('processWebhook', () => {
    beforeEach(() => {
      // Mock constructEvent
      mockStripe.webhooks.constructEvent.mockReturnValue({
        id: 'evt_test',
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_test',
            customer: 'cus_test',
            status: 'active',
            metadata: { tenant_id: 'tenant_123' }
          }
        }
      });
    });

    it('should handle subscription created event', async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue({
        id: 'evt_test',
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_test',
            customer: 'cus_test',
            status: 'active',
            metadata: { tenant_id: 'tenant_123' }
          }
        }
      });

      await stripeClient.processWebhook('raw_body', 'signature');

      expect(mockCache.del).toHaveBeenCalledWith('stripe:entitlement:tenant_123');
    });

    it('should handle payment succeeded event', async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue({
        id: 'evt_test',
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            id: 'inv_test',
            customer: 'cus_test',
            subscription: 'sub_test',
            amount_paid: 14900
          }
        }
      });

      await stripeClient.processWebhook('raw_body', 'signature');

      expect(mockCache.del).toHaveBeenCalledWith('stripe:entitlement:cus_test');
    });

    it('should handle payment failed event', async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue({
        id: 'evt_test',
        type: 'invoice.payment_failed',
        data: {
          object: {
            id: 'inv_test',
            customer: 'cus_test',
            attempt_count: 1,
            next_payment_attempt: 1234567890
          }
        }
      });

      await stripeClient.processWebhook('raw_body', 'signature');

      // Payment failure should not invalidate cache immediately
      expect(mockCache.del).not.toHaveBeenCalled();
    });

    it('should handle invoice created event', async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue({
        id: 'evt_test',
        type: 'invoice.created',
        data: {
          object: {
            id: 'inv_test',
            customer: 'cus_test',
            amount_due: 14900,
            due_date: 1234567890
          }
        }
      });

      await stripeClient.processWebhook('raw_body', 'signature');

      // Invoice created should not invalidate cache
      expect(mockCache.del).not.toHaveBeenCalled();
    });

    it('should handle trial ending event', async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue({
        id: 'evt_test',
        type: 'customer.subscription.trial_will_end',
        data: {
          object: {
            id: 'sub_test',
            customer: 'cus_test',
            trial_end: 1234567890
          }
        }
      });

      await stripeClient.processWebhook('raw_body', 'signature');

      // Trial ending should not invalidate cache
      expect(mockCache.del).not.toHaveBeenCalled();
    });

    it('should handle unknown webhook events gracefully', async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue({
        id: 'evt_test',
        type: 'unknown.event',
        data: { object: {} }
      });

      await stripeClient.processWebhook('raw_body', 'signature');

      expect(mockCache.del).not.toHaveBeenCalled();
    });

    it('should throw error for invalid webhook signature', async () => {
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      await expect(stripeClient.processWebhook('raw_body', 'invalid_signature'))
        .rejects.toThrow('Invalid signature');
    });
  });
});