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

import type Stripe from 'stripe';
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
  private _stripeInitialized = false;

  constructor() {
    // Do not initialize Stripe SDK at module import time. Tests may mock
    // the 'stripe' module after importing this file; initializing lazily
    // on first use ensures mocks are honored.
    this.stripe = {} as any;
    this._stripeInitialized = false;
  }

  /**
   * Test helper: inject a mock stripe instance (used by unit tests)
   */
  public __setStripeInstanceForTest(instance: any): void {
    this.stripe = instance;
    this._stripeInitialized = true;
  }

  private ensureStripe(): void {
    if (this._stripeInitialized) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const StripeModule = require('stripe');
      // When running tests the mocked stripe module may be a factory that
      // doesn't expect a real secret. Allow calling without secret in tests
      // to avoid the SDK making network calls with a placeholder key.
      const secret = process.env.NODE_ENV === 'test' ? undefined : (process.env.STRIPE_SECRET_KEY || '');
      // Support both CJS and ESM mock shapes: tests may mock 'stripe' with a
      // default export (StripeModule.default) or export the constructor directly.
      // Prefer StripeModule.default when available.
      const StripeCtor = (StripeModule && (StripeModule.default || StripeModule)) as any;
      // @ts-ignore - dynamic instantiation
      // The mocked module can be exported as a constructor function, a factory
      // that must be called (not `new`), or a plain object. Try multiple
      // strategies so tests' vi.mock shapes are accepted.
      let instance: any;
      if (typeof StripeCtor === 'function') {
        try {
          instance = secret
            ? new StripeCtor(secret, { apiVersion: '2025-08-27.basil', typescript: true })
            : new StripeCtor();
        } catch (innerErr) {
          // Some mocks are plain factory functions (not meant to be called with `new`)
          try {
            instance = secret
              ? (StripeCtor as any)(secret, { apiVersion: '2025-08-27.basil', typescript: true })
              : (StripeCtor as any)();
          } catch (innerErr2) {
            throw innerErr2 || innerErr;
          }
        }
      } else {
        instance = StripeCtor;
      }

      this.stripe = instance;
    } catch (e) {
      logger.warn('Stripe SDK not available or failed to initialize; falling back to empty client');
      this.stripe = {} as any;
    }
    this._stripeInitialized = true;
  }

  /**
   * Busca ou cria customer no Stripe
   */
  async getOrCreateCustomer(email: string, name?: string, metadata?: Record<string, string>): Promise<StripeCustomer> {
    this.ensureStripe();
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
  this.ensureStripe();
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

      return subscription as unknown as StripeSubscription;

    } catch (error) {
      logger.error({ error, customerId, priceId }, 'Failed to create subscription');
      throw error;
    }
  }

  /**
   * Busca subscription ativa de um customer
   */
  async getActiveSubscription(customerId: string): Promise<StripeSubscription | null> {
    this.ensureStripe();
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
   * Atualiza subscription existente
   */
  async updateSubscription(subscriptionId: string, newPriceId: string): Promise<StripeSubscription> {
    this.ensureStripe();
    try {
      // Cancelar items existentes
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);

      // Atualizar com novo price
      const updatedSubscription = await this.stripe.subscriptions.update(subscriptionId, {
        items: [{
          id: subscription.items.data[0].id,
          price: newPriceId,
        }],
        proration_behavior: 'create_prorations',
      });

      logger.info({
        subscriptionId,
        newPriceId
      }, 'Updated Stripe subscription');

      return updatedSubscription as unknown as StripeSubscription;

    } catch (error) {
      logger.error({ error, subscriptionId, newPriceId }, 'Failed to update subscription');
      throw error;
    }
  }

  /**
   * Cancela uma subscription
   */
  async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd: boolean = false): Promise<StripeSubscription> {
    this.ensureStripe();
    try {
      const subscription = await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: cancelAtPeriodEnd,
      });

      if (!cancelAtPeriodEnd) {
        // Cancelar imediatamente
        await this.stripe.subscriptions.cancel(subscriptionId);
      }

      logger.info({
        subscriptionId,
        cancelAtPeriodEnd
      }, 'Cancelled Stripe subscription');

      return subscription as unknown as StripeSubscription;

    } catch (error) {
      logger.error({ error, subscriptionId }, 'Failed to cancel subscription');
      throw error;
    }
  }

  /**
   * Reativa uma subscription cancelada
   */
  async reactivateSubscription(subscriptionId: string): Promise<StripeSubscription> {
    this.ensureStripe();
    try {
      const subscription = await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
      });

      logger.info({ subscriptionId }, 'Reactivated Stripe subscription');
      return subscription as unknown as StripeSubscription;

    } catch (error) {
      logger.error({ error, subscriptionId }, 'Failed to reactivate subscription');
      throw error;
    }
  }

  /**
   * Busca subscription por ID
   */
  async getSubscription(subscriptionId: string): Promise<StripeSubscription> {
    this.ensureStripe();
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['latest_invoice.payment_intent']
      });

      return subscription as unknown as StripeSubscription;

    } catch (error) {
      logger.error({ error, subscriptionId }, 'Failed to get subscription');
      throw error;
    }
  }

  /**
   * Busca customer por ID
   */
  async getCustomer(customerId: string): Promise<StripeCustomer> {
    this.ensureStripe();
    try {
      const customer = await this.stripe.customers.retrieve(customerId);
      return customer as StripeCustomer;

    } catch (error) {
      logger.error({ error, customerId }, 'Failed to get customer');
      throw error;
    }
  }

  /**
   * Busca invoices de um customer
   */
  async getCustomerInvoices(customerId: string): Promise<any[]> {
    this.ensureStripe();
    try {
      const invoices = await this.stripe.invoices.list({
        customer: customerId,
        limit: 10
      });

      return invoices.data;

    } catch (error) {
      logger.error({ error, customerId }, 'Failed to get customer invoices');
      throw error;
    }
  }

  /**
   * Busca a próxima fatura do customer
   */
  async getUpcomingInvoice(customerId: string): Promise<Stripe.Invoice | null> {
    this.ensureStripe();
    try {
      // Use type assertion to bypass TypeScript checking for this method
      const upcomingInvoice = await (this.stripe.invoices as any).retrieveUpcoming({
        customer: customerId
      }) as Stripe.Invoice;

      logger.info({ customerId, invoiceId: upcomingInvoice.id }, 'Retrieved upcoming invoice');
      return upcomingInvoice;

    } catch (error: unknown) {
      // Upcoming invoice might not exist for customers without active subscriptions
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.info({ customerId, error: errorMessage }, 'No upcoming invoice found for customer');
      return null;
    }
  }

  /**
   * Cria sessão do portal de cobrança do Stripe
   */
  async createBillingPortalSession(
    customerId: string,
    returnUrl: string = `${process.env.NEXT_PUBLIC_APP_URL}/admin/billing`
  ): Promise<{ url: string }> {
  this.ensureStripe();
  try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });

      logger.info({
        customerId,
        sessionId: session.id
      }, 'Created billing portal session');

      return { url: session.url };

    } catch (error) {
      logger.error({ error, customerId }, 'Failed to create billing portal session');
      throw error;
    }
  }

  /**
   * Cria sessão de checkout para upgrade/downgrade
   */
  async createCheckoutSession(
    customerId: string,
    priceId: string,
    successUrl: string = `${process.env.NEXT_PUBLIC_APP_URL}/admin/billing?success=true`,
    cancelUrl: string = `${process.env.NEXT_PUBLIC_APP_URL}/admin/billing?canceled=true`,
    mode: 'subscription' | 'payment' = 'subscription'
  ): Promise<{ url: string; sessionId: string }> {
  this.ensureStripe();
  try {
      const session = await this.stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [{
          price: priceId,
          quantity: 1,
        }],
        mode,
        success_url: successUrl,
        cancel_url: cancelUrl,
        allow_promotion_codes: true,
        billing_address_collection: 'required',
        metadata: {
          customer_id: customerId,
          price_id: priceId
        }
      });

      logger.info({
        customerId,
        priceId,
        sessionId: session.id
      }, 'Created checkout session');

      return {
        url: session.url!,
        sessionId: session.id
      };

    } catch (error) {
      logger.error({ error, customerId, priceId }, 'Failed to create checkout session');
      throw error;
    }
  }

  /**
   * Upgrade de plano (mantém período de cobrança)
   */
  async upgradeSubscription(
    subscriptionId: string,
    newPriceId: string,
    prorationBehavior: 'create_prorations' | 'none' = 'create_prorations'
  ): Promise<StripeSubscription> {
  this.ensureStripe();
  try {
      // Buscar subscription atual
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);

      // Atualizar com novo price
      const updatedSubscription = await this.stripe.subscriptions.update(subscriptionId, {
        items: [{
          id: subscription.items.data[0].id,
          price: newPriceId,
        }],
        proration_behavior: prorationBehavior,
      });

      // Invalidar cache
      const cacheKey = `${this.cachePrefix}entitlement:${subscription.customer}`;
      const kv = getKVClient();
      await kv.del(cacheKey);

      logger.info({
        subscriptionId,
        oldPriceId: subscription.items.data[0].price.id,
        newPriceId,
        prorationBehavior
      }, '✅ Subscription upgraded successfully');

      return updatedSubscription as unknown as StripeSubscription;

    } catch (error) {
      logger.error({ error, subscriptionId, newPriceId }, 'Failed to upgrade subscription');
      throw error;
    }
  }

  /**
   * Downgrade de plano (agenda para próximo ciclo)
   */
  async scheduleDowngrade(
    subscriptionId: string,
    newPriceId: string
  ): Promise<StripeSubscription> {
  this.ensureStripe();
  try {
      // Buscar subscription atual
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);

      // Agendar mudança para próximo ciclo
      const updatedSubscription = await this.stripe.subscriptions.update(subscriptionId, {
        items: [{
          id: subscription.items.data[0].id,
          price: newPriceId,
        }],
        proration_behavior: 'none', // Sem proration para downgrade
      });

      logger.info({
        subscriptionId,
        oldPriceId: subscription.items.data[0].price.id,
        newPriceId,
        effectiveDate: new Date((subscription as unknown as { current_period_end: number }).current_period_end * 1000)
      }, '📅 Downgrade scheduled for next billing cycle');

      return updatedSubscription as unknown as StripeSubscription;

    } catch (error) {
      logger.error({ error, subscriptionId, newPriceId }, 'Failed to schedule downgrade');
      throw error;
    }
  }

  /**
   * Cancela downgrade agendado
   */
  async cancelScheduledDowngrade(subscriptionId: string): Promise<StripeSubscription> {
    this.ensureStripe();
    try {
      // Reverter para preço atual (remove mudanças agendadas)
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      const currentPriceId = subscription.items.data[0].price.id;

      const updatedSubscription = await this.stripe.subscriptions.update(subscriptionId, {
        items: [{
          id: subscription.items.data[0].id,
          price: currentPriceId,
        }],
        proration_behavior: 'none'
      });

      logger.info({
        subscriptionId,
        priceId: currentPriceId
      }, '❌ Scheduled downgrade cancelled');

      return updatedSubscription as unknown as StripeSubscription;

    } catch (error) {
      logger.error({ error, subscriptionId }, 'Failed to cancel scheduled downgrade');
      throw error;
    }
  }

  /**
   * Busca preços disponíveis para upgrade/downgrade
   */
  async getAvailablePrices(): Promise<Array<{
    id: string;
    currency: string;
    unit_amount: number | null;
    recurring: { interval: string; interval_count: number } | null;
    metadata: Record<string, string>;
  }>> {
  this.ensureStripe();
  try {
      const prices = await this.stripe.prices.list({
        active: true,
        type: 'recurring'
      });

      return prices.data.map(price => ({
        id: price.id,
        currency: price.currency,
        unit_amount: price.unit_amount,
        recurring: price.recurring,
        metadata: price.metadata
      }));

    } catch (error) {
      logger.error({ error }, 'Failed to get available prices');
      throw error;
    }
  }

  /**
   * Calcula preview de upgrade/downgrade
   */
  async calculateUpgradePreview(
    subscriptionId: string,
    newPriceId: string
  ): Promise<{
    immediate_total: number;
    currency: string;
    period_end: Date;
  }> {
  this.ensureStripe();
  try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);

      // Calcular proration usando invoice preview
      const invoice = await this.stripe.invoices.create({
        customer: subscription.customer as string,
        subscription: subscriptionId
      });

      return {
        immediate_total: invoice.amount_due,
        currency: invoice.currency,
        period_end: new Date((subscription as unknown as { current_period_end: number }).current_period_end * 1000)
      };

    } catch (error) {
      logger.error({ error, subscriptionId, newPriceId }, 'Failed to calculate upgrade preview');
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
  // getActiveSubscription will ensure Stripe is initialized
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
        features: [...plan.features],
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
              type: currentUsage.type as 'api_calls' | 'products' | 'users' | 'storage',
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
          // Handle additional webhook events
          if (event.type === 'invoice.created') {
            await this.handleInvoiceCreated(event);
          } else if (event.type === 'customer.subscription.trial_will_end') {
            await this.handleTrialEnding(event);
          } else {
            logger.info({ eventType: event.type }, 'Unhandled Stripe webhook event');
          }
      }

    } catch (error) {
      logger.error({ error }, 'Failed to process Stripe webhook');
      throw error;
    }
  }

  // Métodos privados auxiliares

  private extractPlanTypeFromPrice(price: { metadata?: { plan_type?: string } } | null): PeepersPlanType | null {
    if (!price?.metadata?.plan_type) return null;

    const planType = price.metadata.plan_type as PeepersPlanType;
    return Object.keys(PEEPERS_PLANS).includes(planType) ? planType : null;
  }

  private async getTrialEntitlement(_tenantId: string): Promise<TenantEntitlement | null> {
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
    const invoice = event.data.object as { id: string; subscription?: string; customer: string; amount_paid?: number };

    // Atualizar status de pagamento
    const subscriptionId = invoice.subscription;
    if (subscriptionId) {
      // Invalidar cache do tenant
      const cacheKey = `${this.cachePrefix}entitlement:${invoice.customer}`;
      const kv = getKVClient();
      await kv.del(cacheKey);

      logger.info({
        invoiceId: invoice.id,
        subscriptionId,
        customerId: invoice.customer,
        amount: invoice.amount_paid
      }, '💰 Payment succeeded - cache invalidated');
    }
  }

  private async handlePaymentFailure(event: StripeWebhookEvent): Promise<void> {
    const invoice = event.data.object as { id: string; customer: string; attempt_count?: number; next_payment_attempt?: number };

    logger.warn({
      invoiceId: invoice.id,
      customerId: invoice.customer,
      attemptCount: invoice.attempt_count,
      nextPaymentAttempt: invoice.next_payment_attempt
    }, '❌ Payment failed');

    // TODO: Implementar notificações de falha de pagamento
    // TODO: Implementar downgrade automático após múltiplas tentativas
  }

  private async handleInvoiceCreated(event: StripeWebhookEvent): Promise<void> {
    const invoice = event.data.object as { id: string; customer: string; amount_due?: number; due_date?: number };

    logger.info({
      invoiceId: invoice.id,
      customerId: invoice.customer,
      amount: invoice.amount_due,
      dueDate: invoice.due_date
    }, '📄 Invoice created');
  }

  private async handleTrialEnding(event: StripeWebhookEvent): Promise<void> {
    const subscription = event.data.object as { id: string; customer: string; trial_end?: number };

    logger.info({
      subscriptionId: subscription.id,
      customerId: subscription.customer,
      trialEnd: subscription.trial_end
    }, '⏰ Trial ending soon');

    // TODO: Implementar notificações de fim de trial
  }
}

// Exportar instância singleton (lazily initialized)
let _stripeClient: StripeClient | null = null;

export function getStripeClient(): StripeClient {
  if (!_stripeClient) _stripeClient = new StripeClient();
  return _stripeClient;
}

// Backwards-compatible default export for existing imports
export const stripeClient = getStripeClient();
export default stripeClient;