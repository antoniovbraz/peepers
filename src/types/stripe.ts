/**
 * Stripe Integration Types - Peepers Enterprise v2.0.0
 *
 * Tipos para integração com Stripe Billing API
 * Suporte a planos Starter/Pro/Enterprise com entitlements
 */

export interface StripeSubscription {
  id: string;
  customer: string;
  status: StripeSubscriptionStatus;
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  items: {
    data: Array<{
      id: string;
      price: StripePrice;
      quantity: number;
    }>;
  };
  metadata: {
    tenant_id?: string;
    plan_type?: PeepersPlanType;
  };
}

export type StripeSubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'past_due'
  | 'trialing'
  | 'unpaid';

export interface StripePrice {
  id: string;
  currency: string;
  unit_amount: number;
  recurring: {
    interval: 'month' | 'year';
    interval_count: number;
  };
  metadata: {
    plan_type: PeepersPlanType;
    features: string; // JSON string of features
  };
}

export interface StripeCustomer {
  id: string;
  email: string;
  name?: string;
  metadata: {
    tenant_id?: string;
    ml_user_id?: string;
  };
}

export type PeepersPlanType = 'starter' | 'professional' | 'enterprise';

export interface PeepersPlan {
  type: PeepersPlanType;
  name: string;
  price: {
    monthly: number;
    yearly: number;
  };
  limits: {
    api_calls_per_month: number;
    products_limit: number;
    users_limit: number;
    storage_gb: number;
  };
  features: PeepersFeature[];
  stripe_price_ids: {
    monthly: string;
    yearly: string;
  };
}

export type PeepersFeature =
  | 'basic_dashboard'
  | 'product_sync'
  | 'order_management'
  | 'advanced_analytics'
  | 'multi_user'
  | 'api_access'
  | 'white_label'
  | 'priority_support'
  | 'custom_integrations';

export interface TenantEntitlement {
  tenant_id: string;
  plan_type: PeepersPlanType;
  features: PeepersFeature[];
  limits: {
    api_calls_used: number;
    api_calls_limit: number;
    products_count: number;
    products_limit: number;
    users_count: number;
    users_limit: number;
    storage_used_gb: number;
    storage_limit_gb: number;
  };
  subscription_status: StripeSubscriptionStatus;
  trial_ends_at?: Date;
  current_period_end: Date;
  cancel_at_period_end: boolean;
}

export interface EntitlementCheck {
  allowed: boolean;
  reason?: string;
  upgrade_required?: boolean;
  limit_exceeded?: {
    type: 'api_calls' | 'products' | 'users' | 'storage';
    current: number;
    limit: number;
  };
}

export interface StripeWebhookEvent {
  id: string;
  type: StripeWebhookEventType;
  data: {
    object: StripeSubscription | StripeCustomer;
  };
  created: number;
}

export type StripeWebhookEventType =
  | 'customer.subscription.created'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'invoice.payment_succeeded'
  | 'invoice.payment_failed';