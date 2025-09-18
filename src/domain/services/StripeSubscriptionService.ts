/**
 * Stripe Subscription Service - Peepers Enterprise v2.0.0
 *
 * Serviço de domínio para gerenciamento de assinaturas Stripe
 * Orquestra criação, atualização e cancelamento de subscriptions
 */

import { PeepersTenant, PeepersUser } from '@/types/tenant';
import { PeepersPlanType, PeepersPlan, TenantEntitlement } from '@/types/stripe';
import { stripeClient } from '@/lib/stripe';
import { PEEPERS_PLANS } from '@/config/entitlements';
import { getKVClient } from '@/lib/cache';
import { logger } from '@/lib/logger';

export class StripeSubscriptionService {
  private static readonly CACHE_TTL = 3600; // 1 hour

  /**
   * Cria uma nova assinatura para um tenant
   */
  static async createSubscription(
    tenant: PeepersTenant,
    user: PeepersUser,
    planType: PeepersPlanType,
    billingCycle: 'monthly' | 'yearly' = 'monthly'
  ): Promise<{
    subscriptionId: string;
    clientSecret: string;
    tenant: PeepersTenant;
  }> {
    try {
      const plan = PEEPERS_PLANS[planType];
      const priceId = plan.stripe_price_ids[billingCycle];

      if (!priceId) {
        throw new Error(`Price ID not configured for plan ${planType} ${billingCycle}`);
      }

      // Criar ou obter customer no Stripe
      const customer = await stripeClient.getOrCreateCustomer(
        user.email,
        `${user.first_name} ${user.last_name}`,
        {
          tenant_id: tenant.id,
          ml_user_id: user.ml_user_id ? user.ml_user_id.toString() : '',
          plan_type: planType
        }
      );

      // Criar subscription
      const subscription = await stripeClient.createSubscription(
        customer.id,
        priceId,
        {
          tenant_id: tenant.id,
          user_id: user.id,
          plan_type: planType,
          billing_cycle: billingCycle
        }
      );

      // Atualizar tenant com dados do Stripe
      const updatedTenant: PeepersTenant = {
        ...tenant,
        subscription: {
          ...tenant.subscription,
          plan: planType,
          status: 'active',
          billing_cycle: billingCycle,
          stripe_customer_id: customer.id,
          stripe_subscription_id: subscription.id,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        },
        limits: {
          products: plan.limits.products_limit,
          orders_per_month: plan.limits.api_calls_per_month, // Usar API calls como proxy para orders
          api_calls_per_hour: Math.floor(plan.limits.api_calls_per_month / 30 / 24), // Distribuir por hora
          storage_gb: plan.limits.storage_gb,
          team_members: plan.limits.users_limit,
        },
        updated_at: new Date().toISOString(),
      };

      // Salvar no cache
      await this.saveTenantToCache(updatedTenant);

      logger.info({
        tenantId: tenant.id,
        subscriptionId: subscription.id,
        planType,
        customerId: customer.id
      }, 'Created Stripe subscription');

      return {
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice?.payment_intent?.client_secret || '',
        tenant: updatedTenant,
      };

    } catch (error) {
      logger.error({ error, tenantId: tenant.id, planType }, 'Failed to create subscription');
      throw error;
    }
  }

  /**
   * Atualiza o plano de um tenant
   */
  static async updateSubscription(
    tenant: PeepersTenant,
    newPlanType: PeepersPlanType,
    billingCycle?: 'monthly' | 'yearly'
  ): Promise<PeepersTenant> {
    try {
      if (!tenant.subscription.stripe_subscription_id) {
        throw new Error('Tenant does not have an active Stripe subscription');
      }

      const newPlan = PEEPERS_PLANS[newPlanType];
      const priceId = newPlan.stripe_price_ids[billingCycle || tenant.subscription.billing_cycle];

      // Atualizar subscription no Stripe
      const subscription = await stripeClient.updateSubscription(
        tenant.subscription.stripe_subscription_id,
        priceId
      );

      // Atualizar tenant
      const updatedTenant: PeepersTenant = {
        ...tenant,
        subscription: {
          ...tenant.subscription,
          plan: newPlanType,
          billing_cycle: billingCycle || tenant.subscription.billing_cycle,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        },
        limits: {
          products: newPlan.limits.products_limit,
          orders_per_month: newPlan.limits.api_calls_per_month,
          api_calls_per_hour: Math.floor(newPlan.limits.api_calls_per_month / 30 / 24),
          storage_gb: newPlan.limits.storage_gb,
          team_members: newPlan.limits.users_limit,
        },
        updated_at: new Date().toISOString(),
      };

      await this.saveTenantToCache(updatedTenant);

      logger.info({
        tenantId: tenant.id,
        oldPlan: tenant.subscription.plan,
        newPlan: newPlanType
      }, 'Updated subscription plan');

      return updatedTenant;

    } catch (error) {
      logger.error({ error, tenantId: tenant.id, newPlanType }, 'Failed to update subscription');
      throw error;
    }
  }

  /**
   * Cancela a assinatura de um tenant
   */
  static async cancelSubscription(
    tenant: PeepersTenant,
    cancelImmediately: boolean = false
  ): Promise<PeepersTenant> {
    try {
      if (!tenant.subscription.stripe_subscription_id) {
        throw new Error('Tenant does not have an active Stripe subscription');
      }

      const subscription = await stripeClient.cancelSubscription(
        tenant.subscription.stripe_subscription_id,
        !cancelImmediately
      );

      // Atualizar tenant
      const updatedTenant: PeepersTenant = {
        ...tenant,
        subscription: {
          ...tenant.subscription,
          status: cancelImmediately ? 'cancelled' : 'active', // Mantém active se cancel at period end
          cancel_at_period_end: !cancelImmediately,
        },
        updated_at: new Date().toISOString(),
      };

      await this.saveTenantToCache(updatedTenant);

      logger.info({
        tenantId: tenant.id,
        subscriptionId: tenant.subscription.stripe_subscription_id,
        cancelImmediately
      }, 'Cancelled subscription');

      return updatedTenant;

    } catch (error) {
      logger.error({ error, tenantId: tenant.id }, 'Failed to cancel subscription');
      throw error;
    }
  }

  /**
   * Reativa uma assinatura cancelada
   */
  static async reactivateSubscription(tenant: PeepersTenant): Promise<PeepersTenant> {
    try {
      if (!tenant.subscription.stripe_subscription_id) {
        throw new Error('Tenant does not have a Stripe subscription');
      }

      const subscription = await stripeClient.reactivateSubscription(
        tenant.subscription.stripe_subscription_id
      );

      // Atualizar tenant
      const updatedTenant: PeepersTenant = {
        ...tenant,
        subscription: {
          ...tenant.subscription,
          status: 'active',
          cancel_at_period_end: false,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        },
        updated_at: new Date().toISOString(),
      };

      await this.saveTenantToCache(updatedTenant);

      logger.info({
        tenantId: tenant.id,
        subscriptionId: tenant.subscription.stripe_subscription_id
      }, 'Reactivated subscription');

      return updatedTenant;

    } catch (error) {
      logger.error({ error, tenantId: tenant.id }, 'Failed to reactivate subscription');
      throw error;
    }
  }

  /**
   * Obtém informações detalhadas da assinatura
   */
  static async getSubscriptionDetails(tenant: PeepersTenant): Promise<{
    subscription: any;
    customer: any;
    invoices: any[];
    upcomingInvoice: any;
  }> {
    try {
      if (!tenant.subscription.stripe_customer_id) {
        throw new Error('Tenant does not have a Stripe customer');
      }

      const [subscription, customer, invoices, upcomingInvoice] = await Promise.all([
        tenant.subscription.stripe_subscription_id
          ? stripeClient.getSubscription(tenant.subscription.stripe_subscription_id)
          : null,
        stripeClient.getCustomer(tenant.subscription.stripe_customer_id),
        stripeClient.getCustomerInvoices(tenant.subscription.stripe_customer_id),
        stripeClient.getUpcomingInvoice(tenant.subscription.stripe_customer_id)
      ]);

      return {
        subscription,
        customer,
        invoices,
        upcomingInvoice
      };

    } catch (error) {
      logger.error({ error, tenantId: tenant.id }, 'Failed to get subscription details');
      throw error;
    }
  }

  /**
   * Calcula o custo de upgrade/downgrade
   */
  static calculatePlanChangeCost(
    currentPlan: PeepersPlanType,
    newPlan: PeepersPlanType,
    billingCycle: 'monthly' | 'yearly',
    daysRemaining: number
  ): {
    proratedAmount: number;
    immediateCharge: number;
    description: string;
  } {
    const currentPlanData = PEEPERS_PLANS[currentPlan];
    const newPlanData = PEEPERS_PLANS[newPlan];

    const currentPrice = currentPlanData.price[billingCycle];
    const newPrice = newPlanData.price[billingCycle];

    // Calcular valor proporcional
    const dailyCurrentPrice = currentPrice / (billingCycle === 'yearly' ? 365 : 30);
    const dailyNewPrice = newPrice / (billingCycle === 'yearly' ? 365 : 30);

    const proratedAmount = (newPrice - currentPrice) * (daysRemaining / (billingCycle === 'yearly' ? 365 : 30));
    const immediateCharge = Math.max(0, proratedAmount);

    return {
      proratedAmount,
      immediateCharge,
      description: proratedAmount > 0
        ? `Upgrade para ${newPlanData.name} - cobrança imediata de R$ ${(immediateCharge / 100).toFixed(2)}`
        : `Downgrade para ${newPlanData.name} - crédito de R$ ${Math.abs(immediateCharge / 100).toFixed(2)}`
    };
  }

  // Métodos auxiliares privados

  private static async saveTenantToCache(tenant: PeepersTenant): Promise<void> {
    const kv = getKVClient();
    const cacheKey = `tenant:${tenant.id}`;
    await kv.set(cacheKey, tenant, { ex: this.CACHE_TTL });
  }
}