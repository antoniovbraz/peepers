/**
 * Stripe Client - Peepers Enterprise v2.0.0
 *
 * Cliente para integração       const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        metadata: metadata || {},
        trial_period_days: 14,
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent']
      });

      logger.info({
        subscriptionId: subscription.id,
        customerId,
        priceId
      }, 'Created Stripe subscription');

      return subscription as unknown as StripeSubscription;ng API
 * Gerenciamento de subscriptions, customers e webhooks
 */

import Stripe from 'stripe';
import { getKVClient } from '@/lib/cache';
import { logger } from '@/lib/logger';
import {
  TenantEntitlement,
  EntitlementCheck,
  PeepersPlanType,
  PeepersFeature,
  StripeSubscription,
  StripeCustomer,
  StripeWebhookEvent
} from '@/types/stripe';
import { PEEPERS_PLANS, ENTITLEMENTS_CACHE_TTL, TRIAL_FEATURES } from '@/config/entitlements';

class StripeClient {
  private stripe: Stripe;
  private readonly cachePrefix = 'stripe:';

  constructor() {
    // Skip Stripe initialization in test environment
    if (process.env.NODE_ENV === 'test') {
      this.stripe = {} as any;
      return;
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }

    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-08-27.basil',
      typescript: true,
    });
  }

  /**
   * Busca ou cria customer no Stripe
   */
  async getOrCreateCustomer(email: string, name?: string, metadata?: Record<string, string>): Promise<StripeCustomer> {
    try {
      // Buscar customer existente
      const existingCustomers = await this.stripe.customers.list({
        email,
        limit: 1
      });

      if (existingCustomers.data.length > 0) {
        return existingCustomers.data[0] as StripeCustomer;
      }

      // Criar novo customer
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata: metadata || {}
      });

      logger.info({ customerId: customer.id, email }, 'Created new Stripe customer');
      return customer as StripeCustomer;

    } catch (error) {
      logger.error({ error, email }, 'Failed to get/create Stripe customer');
      throw error;
    }
  }

  /**
   * Cria subscription para um customer
   */
  async createSubscription(
    customerId: string,
    priceId: string,
    metadata?: Record<string, string>
  ): Promise<StripeSubscription> {
    try {
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        metadata: metadata || {},
        trial_period_days: 14, // Trial de 14 dias
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent']
      });

      logger.info({
        subscriptionId: subscription.id,
        customerId,
        priceId
      }, 'Created Stripe subscription');

      return subscription as StripeSubscription;

    } catch (error) {
      logger.error({ error, customerId, priceId }, 'Failed to create subscription');
      throw error;
    }
  }

  /**
   * Busca subscription ativa de um customer
   */
  async getActiveSubscription(customerId: string): Promise<StripeSubscription | null> {
    try {
      const subscriptions = await this.stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
        limit: 1
      });

      return subscriptions.data.length > 0
        ? subscriptions.data[0] as unknown as StripeSubscription
        : null;

    } catch (error) {
      logger.error({ error, customerId }, 'Failed to get active subscription');
      throw error;
    }
  }

  /**
   * Cancela subscription
   */
  async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd = true): Promise<StripeSubscription> {
    try {
      const subscription = await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: cancelAtPeriodEnd
      });

      logger.info({ subscriptionId }, 'Cancelled Stripe subscription');
      return subscription as unknown as StripeSubscription;

    } catch (error) {
      logger.error({ error, subscriptionId }, 'Failed to cancel subscription');
      throw error;
    }
  }

  /**
   * Busca entitlements de um tenant
   */
  async getTenantEntitlement(tenantId: string): Promise<TenantEntitlement | null> {
    try {
      // Verificar cache primeiro
      const cacheKey = `${this.cachePrefix}entitlement:${tenantId}`;
      const kv = getKVClient();
      const cached = await kv.get(cacheKey);
      if (cached) {
        return JSON.parse(cached as string);
      }

      // Buscar subscription no Stripe
      const subscription = await this.getActiveSubscription(tenantId);

      if (!subscription) {
        // Verificar se está em trial
        const trialEntitlement = await this.getTrialEntitlement(tenantId);
        if (trialEntitlement) {
        // Cache por 5 minutos
        await kv.set(cacheKey, JSON.stringify(trialEntitlement), { ex: ENTITLEMENTS_CACHE_TTL });
          return trialEntitlement;
        }
        return null;
      }

      // Extrair informações do plano
      const price = subscription.items.data[0]?.price;
      const planType = this.extractPlanTypeFromPrice(price);

      if (!planType) {
        logger.warn({ subscriptionId: subscription.id }, 'Unknown plan type for subscription');
        return null;
      }

      const plan = PEEPERS_PLANS[planType];
      const entitlement: TenantEntitlement = {
        tenant_id: tenantId,
        plan_type: planType,
        features: plan.features,
        limits: {
          api_calls_used: 0, // TODO: implementar tracking
          api_calls_limit: plan.limits.api_calls_per_month,
          products_count: 0, // TODO: implementar tracking
          products_limit: plan.limits.products_limit,
          users_count: 0, // TODO: implementar tracking
          users_limit: plan.limits.users_limit,
          storage_used_gb: 0, // TODO: implementar tracking
          storage_limit_gb: plan.limits.storage_gb
        },
        subscription_status: subscription.status,
        current_period_end: new Date(subscription.current_period_end * 1000),
        cancel_at_period_end: subscription.cancel_at_period_end
      };

      // Cache por 5 minutos
      await kv.set(cacheKey, JSON.stringify(entitlement), { ex: ENTITLEMENTS_CACHE_TTL });

      return entitlement;

    } catch (error) {
      logger.error({ error, tenantId }, 'Failed to get tenant entitlement');
      throw error;
    }
  }

  /**
   * Verifica se um tenant tem acesso a uma feature
   */
  async checkEntitlement(
    tenantId: string,
    feature: PeepersFeature,
    currentUsage?: { type: string; value: number }
  ): Promise<EntitlementCheck> {
    try {
      const entitlement = await this.getTenantEntitlement(tenantId);

      if (!entitlement) {
        return {
          allowed: false,
          reason: 'No active subscription found',
          upgrade_required: true
        };
      }

      // Verificar se subscription está ativa
      if (!['active', 'trialing'].includes(entitlement.subscription_status)) {
        return {
          allowed: false,
          reason: `Subscription status: ${entitlement.subscription_status}`,
          upgrade_required: true
        };
      }

      // Verificar se feature está incluída no plano
      if (!entitlement.features.includes(feature)) {
        return {
          allowed: false,
          reason: `Feature '${feature}' not included in ${entitlement.plan_type} plan`,
          upgrade_required: true
        };
      }

      // Verificar limites se fornecidos
      if (currentUsage) {
        const limitKey = `${currentUsage.type}_limit` as keyof typeof entitlement.limits;
        const usedKey = `${currentUsage.type}_used` as keyof typeof entitlement.limits;
        const limit = entitlement.limits[limitKey] as number;
        const used = entitlement.limits[usedKey] as number;

        if (limit !== -1 && used >= limit) {
          return {
            allowed: false,
            reason: `${currentUsage.type} limit exceeded`,
            limit_exceeded: {
              type: currentUsage.type as any,
              current: used,
              limit
            }
          };
        }
      }

      return { allowed: true };

    } catch (error) {
      logger.error({ error, tenantId, feature }, 'Failed to check entitlement');
      // Em caso de erro, permitir acesso para evitar downtime
      return { allowed: true, reason: 'Error checking entitlement, allowing access' };
    }
  }

  /**
   * Processa webhook do Stripe
   */
  async processWebhook(rawBody: string, signature: string): Promise<void> {
    try {
      const event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      ) as unknown as StripeWebhookEvent;

      logger.info({ eventType: event.type, eventId: event.id }, 'Processing Stripe webhook');

      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          await this.handleSubscriptionChange(event);
          break;

        case 'invoice.payment_succeeded':
          await this.handlePaymentSuccess(event);
          break;

        case 'invoice.payment_failed':
          await this.handlePaymentFailure(event);
          break;

        default:
          logger.info({ eventType: event.type }, 'Unhandled Stripe webhook event');
      }

    } catch (error) {
      logger.error({ error }, 'Failed to process Stripe webhook');
      throw error;
    }
  }

  // Métodos privados auxiliares

  private extractPlanTypeFromPrice(price: any): PeepersPlanType | null {
    if (!price?.metadata?.plan_type) return null;

    const planType = price.metadata.plan_type as PeepersPlanType;
    return Object.keys(PEEPERS_PLANS).includes(planType) ? planType : null;
  }

  private async getTrialEntitlement(tenantId: string): Promise<TenantEntitlement | null> {
    // TODO: implementar lógica de trial baseada em database
    // Por enquanto, retorna null (sem trial)
    return null;
  }

  private async handleSubscriptionChange(event: StripeWebhookEvent): Promise<void> {
    const subscription = event.data.object as StripeSubscription;

    // Invalidar cache do tenant
    const cacheKey = `${this.cachePrefix}entitlement:${subscription.metadata?.tenant_id}`;
    const kv = getKVClient();
    await kv.del(cacheKey);

    logger.info({
      subscriptionId: subscription.id,
      tenantId: subscription.metadata?.tenant_id,
      status: subscription.status
    }, 'Subscription changed, cache invalidated');
  }

  private async handlePaymentSuccess(event: StripeWebhookEvent): Promise<void> {
    // TODO: implementar lógica de payment success
    logger.info({ eventId: event.id }, 'Payment succeeded');
  }

  private async handlePaymentFailure(event: StripeWebhookEvent): Promise<void> {
    // TODO: implementar lógica de payment failure
    logger.warn({ eventId: event.id }, 'Payment failed');
  }
}

// Exportar instância singleton
export const stripeClient = new StripeClient();
export default stripeClient;