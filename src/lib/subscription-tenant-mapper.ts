/**
 * Subscription Tenant Mapping - Peepers Enterprise v2.0.0
 * Integration between Stripe billing and tenant management
 */

import { Stripe } from 'stripe';
import { kv } from '@vercel/kv';
import { TenantService } from './tenant-service';
import { PeepersTenant } from '../types/tenant';
import { PeepersPlanId, PEEPERS_PLANS, PEEPERS_PRICING } from '../config/pricing';
import { stripeClient } from './stripe';

// Cache keys for subscription mapping
const CACHE_KEYS = {
  STRIPE_TO_TENANT: (stripeCustomerId: string) => `stripe:customer:${stripeCustomerId}:tenant`,
  TENANT_TO_STRIPE: (tenantId: string) => `tenant:${tenantId}:stripe_customer`,
  SUBSCRIPTION_EVENTS: (tenantId: string) => `tenant:${tenantId}:subscription_events`,
  BILLING_HISTORY: (tenantId: string) => `tenant:${tenantId}:billing_history`
} as const;

// Cache TTL
const CACHE_TTL = {
  MAPPING: 86400, // 24 hours
  EVENTS: 604800, // 7 days
  HISTORY: 2592000 // 30 days
} as const;

export interface SubscriptionMapping {
  tenant_id: string;
  stripe_customer_id: string;
  stripe_subscription_id?: string;
  plan_id: PeepersPlanId;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid';
  current_period_start: number;
  current_period_end: number;
  trial_ends_at?: number;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface BillingEvent {
  id: string;
  tenant_id: string;
  type: 'subscription_created' | 'subscription_updated' | 'subscription_deleted' | 'invoice_paid' | 'invoice_failed';
  stripe_event_id: string;
  data: Record<string, unknown>;
  processed_at: string;
}

export class SubscriptionTenantMapper {
  /**
   * Create Stripe customer and map to tenant
   */
  static async createCustomerForTenant(
    tenantId: string,
    customerData: {
      email: string;
      name: string;
      metadata?: Record<string, string>;
    }
  ): Promise<Stripe.Customer> {
    const tenant = await TenantService.getTenant(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Create Stripe customer
    const customer = await stripeClient.getOrCreateCustomer(
      customerData.email,
      customerData.name,
      customerData.metadata
    );

    // Create mapping
    const mapping: SubscriptionMapping = {
      tenant_id: tenantId,
      stripe_customer_id: customer.id,
      plan_id: tenant.subscription.plan,
      status: 'trialing',
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor(Date.now() / 1000) + (14 * 24 * 60 * 60), // 14 days trial
      trial_ends_at: Math.floor(Date.now() / 1000) + (14 * 24 * 60 * 60),
      cancel_at_period_end: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Save mappings
    await this.saveMapping(mapping);

    // Update tenant with Stripe customer ID
    await TenantService.updateTenant(tenantId, {
      subscription: {
        ...tenant.subscription,
        stripe_customer_id: customer.id
      }
    }, 'system');

    return customer;
  }

  /**
   * Create subscription for tenant
   */
  static async createSubscriptionForTenant(
    tenantId: string,
    subscriptionData: {
      price_id: string;
      trial_period_days?: number;
      metadata?: Record<string, string>;
    }
  ): Promise<Stripe.Subscription> {
    const mapping = await this.getMappingByTenantId(tenantId);
    if (!mapping) {
      throw new Error('No Stripe customer mapping found for tenant');
    }

    // Get price details to determine plan
    const price = await stripe.prices.retrieve(subscriptionData.price_id);
    const planId = this.getPlanIdFromPriceId(subscriptionData.price_id);

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: mapping.stripe_customer_id,
      items: [{
        price: subscriptionData.price_id
      }],
      trial_period_days: subscriptionData.trial_period_days || 14,
      metadata: {
        tenant_id: tenantId,
        plan_id: planId,
        ...subscriptionData.metadata
      },
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent']
    });

    // Update mapping
    const updatedMapping: Partial<SubscriptionMapping> = {
      stripe_subscription_id: subscription.id,
      plan_id: planId,
      status: subscription.status as any,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      trial_ends_at: subscription.trial_end || undefined,
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString()
    };

    await this.updateMapping(tenantId, updatedMapping);

    // Update tenant subscription status
    const tenant = await TenantService.getTenant(tenantId);
    if (!tenant) throw new Error('Tenant not found');

    await TenantService.updateTenant(tenantId, {
      subscription: {
        ...tenant.subscription,
        plan: planId,
        status: this.mapStripeStatusToTenantStatus(subscription.status),
        stripe_subscription_id: subscription.id,
        current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
        current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
        trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : undefined,
        cancel_at_period_end: subscription.cancel_at_period_end
      }
    }, 'system');

    return subscription;
  }

  /**
   * Update tenant subscription
   */
  static async updateTenantSubscription(
    tenantId: string,
    updates: {
      plan_id?: PeepersPlanId;
      cancel_at_period_end?: boolean;
      proration_behavior?: 'create_prorations' | 'none';
    }
  ): Promise<Stripe.Subscription> {
    const mapping = await this.getMappingByTenantId(tenantId);
    if (!mapping || !mapping.stripe_subscription_id) {
      throw new Error('No active subscription found for tenant');
    }

    const subscription = await stripe.subscriptions.retrieve(mapping.stripe_subscription_id);

    if (updates.plan_id) {
      // Change plan - requires updating subscription item
      const newPriceId = this.getPriceIdFromPlanId(updates.plan_id);

      await stripe.subscriptions.update(mapping.stripe_subscription_id, {
        items: [{
          id: subscription.items.data[0].id,
          price: newPriceId
        }],
        proration_behavior: updates.proration_behavior || 'create_prorations'
      });
    }

    if (updates.cancel_at_period_end !== undefined) {
      await stripe.subscriptions.update(mapping.stripe_subscription_id, {
        cancel_at_period_end: updates.cancel_at_period_end
      });
    }

    // Refresh subscription data
    const updatedSubscription = await stripe.subscriptions.retrieve(mapping.stripe_subscription_id);

    // Update mapping and tenant
    await this.updateMapping(tenantId, {
      status: updatedSubscription.status as any,
      current_period_start: updatedSubscription.current_period_start,
      current_period_end: updatedSubscription.current_period_end,
      cancel_at_period_end: updatedSubscription.cancel_at_period_end,
      updated_at: new Date().toISOString()
    });

    return updatedSubscription;
  }

  /**
   * Cancel tenant subscription
   */
  static async cancelTenantSubscription(
    tenantId: string,
    cancelImmediately: boolean = false
  ): Promise<Stripe.Subscription> {
    const mapping = await this.getMappingByTenantId(tenantId);
    if (!mapping || !mapping.stripe_subscription_id) {
      throw new Error('No active subscription found for tenant');
    }

    const subscription = await stripe.subscriptions.update(mapping.stripe_subscription_id, {
      cancel_at_period_end: !cancelImmediately
    });

    if (cancelImmediately) {
      await stripe.subscriptions.cancel(mapping.stripe_subscription_id);
    }

    // Update mapping and tenant
    await this.updateMapping(tenantId, {
      status: subscription.status as any,
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString()
    });

    return subscription;
  }

  /**
   * Get tenant by Stripe customer ID
   */
  static async getTenantByStripeCustomerId(stripeCustomerId: string): Promise<PeepersTenant | null> {
    const tenantId = await kv.get<string>(CACHE_KEYS.STRIPE_TO_TENANT(stripeCustomerId));
    if (tenantId) {
      return TenantService.getTenant(tenantId);
    }
    return null;
  }

  /**
   * Get mapping by tenant ID
   */
  static async getMappingByTenantId(tenantId: string): Promise<SubscriptionMapping | null> {
    const cached = await kv.get<string>(CACHE_KEYS.TENANT_TO_STRIPE(tenantId));
    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  }

  /**
   * Handle Stripe webhook events
   */
  static async handleStripeWebhook(stripeEvent: Stripe.Event): Promise<void> {
    const eventData = stripeEvent.data.object as Stripe.Subscription | Stripe.Invoice;

    switch (stripeEvent.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await this.handleSubscriptionEvent(stripeEvent);
        break;

      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(eventData);
        break;

      case 'invoice.payment_failed':
        await this.handlePaymentFailed(eventData);
        break;

      default:
        console.log(`Unhandled Stripe event: ${stripeEvent.type}`);
    }
  }

  /**
   * Get billing history for tenant
   */
  static async getBillingHistory(tenantId: string, limit: number = 20): Promise<Stripe.Invoice[]> {
    const mapping = await this.getMappingByTenantId(tenantId);
    if (!mapping) {
      return [];
    }

    const invoices = await stripe.invoices.list({
      customer: mapping.stripe_customer_id,
      limit
    });

    return invoices.data;
  }

  /**
   * Get current usage for billing
   */
  static async getCurrentUsageForBilling(tenantId: string): Promise<{
    products_count: number;
    api_calls_this_month: number;
    storage_used_gb: number;
  }> {
    const tenant = await TenantService.getTenant(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    return {
      products_count: tenant.usage.products_count,
      api_calls_this_month: tenant.usage.api_calls_today, // Use available field
      storage_used_gb: tenant.usage.storage_used_gb
    };
  }

  // Private helper methods
  private static async saveMapping(mapping: SubscriptionMapping): Promise<void> {
    await kv.set(CACHE_KEYS.TENANT_TO_STRIPE(mapping.tenant_id), JSON.stringify(mapping), { ex: CACHE_TTL.MAPPING });
    await kv.set(CACHE_KEYS.STRIPE_TO_TENANT(mapping.stripe_customer_id), mapping.tenant_id, { ex: CACHE_TTL.MAPPING });
  }

  private static async updateMapping(tenantId: string, updates: Partial<SubscriptionMapping>): Promise<void> {
    const existing = await this.getMappingByTenantId(tenantId);
    if (!existing) {
      throw new Error('Mapping not found');
    }

    const updated = { ...existing, ...updates };
    await this.saveMapping(updated);
  }

  private static getPlanIdFromPriceId(priceId: string): PeepersPlanId {
    // This would map Stripe price IDs to our plan IDs
    // For now, return a default
    const priceMappings: Record<string, PeepersPlanId> = {
      [PEEPERS_PRICING.PRICES.STARTER_MONTHLY.toString()]: 'starter',
      [PEEPERS_PRICING.PRICES.BUSINESS_MONTHLY.toString()]: 'business',
      [PEEPERS_PRICING.PRICES.ENTERPRISE_MONTHLY.toString()]: 'enterprise'
    };

    return priceMappings[priceId] || 'starter';
  }

  private static getPriceIdFromPlanId(planId: PeepersPlanId): string {
    // This would map our plan IDs to Stripe price IDs
    // For now, return a placeholder
    const planMappings: Record<PeepersPlanId, string> = {
      starter: 'price_starter_monthly',
      business: 'price_business_monthly',
      enterprise: 'price_enterprise_monthly'
    };

    return planMappings[planId];
  }

  private static async handleSubscriptionEvent(stripeEvent: Stripe.Event): Promise<void> {
    const subscription = stripeEvent.data.object as Stripe.Subscription;
    const tenant = await this.getTenantByStripeCustomerId(subscription.customer as string);

    if (!tenant) {
      console.error('Tenant not found for subscription event');
      return;
    }

    // Update tenant subscription status
    await TenantService.updateTenant(tenant.id, {
      subscription: {
        ...tenant.subscription,
        status: this.mapStripeStatusToTenantStatus(subscription.status),
        current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
        current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end
      }
    }, 'system');

    // Log event
    await this.logBillingEvent(tenant.id, stripeEvent.type, stripeEvent.id, subscription as unknown as Record<string, unknown>);
  }

  private static async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    const tenant = await this.getTenantByStripeCustomerId(invoice.customer as string);
    if (tenant) {
      await this.logBillingEvent(tenant.id, 'invoice_paid', invoice.id || 'unknown', invoice as unknown as Record<string, unknown>);
    }
  }

  private static async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const tenant = await this.getTenantByStripeCustomerId(invoice.customer as string);
    if (tenant) {
      await this.logBillingEvent(tenant.id, 'invoice_failed', invoice.id || 'unknown', invoice as unknown as Record<string, unknown>);
    }
  }

  private static mapStripeStatusToTenantStatus(stripeStatus: string): 'active' | 'suspended' | 'cancelled' | 'trial' {
    switch (stripeStatus) {
      case 'active':
        return 'active';
      case 'trialing':
        return 'trial';
      case 'canceled':
        return 'cancelled';
      case 'past_due':
      case 'unpaid':
        return 'suspended';
      default:
        return 'trial';
    }
  }

  private static async logBillingEvent(
    tenantId: string,
    eventType: string,
    stripeEventId: string,
    data: Record<string, unknown>
  ): Promise<void> {
    const event: BillingEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tenant_id: tenantId,
      type: eventType as BillingEvent['type'],
      stripe_event_id: stripeEventId,
      data,
      processed_at: new Date().toISOString()
    };

    await kv.lpush(CACHE_KEYS.SUBSCRIPTION_EVENTS(tenantId), JSON.stringify(event));
    await kv.ltrim(CACHE_KEYS.SUBSCRIPTION_EVENTS(tenantId), 0, 999); // Keep last 1000 events
  }
}