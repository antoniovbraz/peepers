/**
 * Entitlements Configuration - Peepers Enterprise v2.0.0
 *
 * Configuração centralizada de planos e features
 * Baseado na documentação enterprise/overview.md
 */

import { PeepersPlan, PeepersFeature, PeepersPlanType } from '@/types/stripe';

export const PEEPERS_PLANS: Record<PeepersPlanType, PeepersPlan> = {
  starter: {
    type: 'starter',
    name: 'Starter',
    price: {
      monthly: 14900, // R$ 149,00
      quarterly: 39900, // R$ 399,00 (10% desconto)
      yearly: 149900   // R$ 1.499,00 (20% desconto)
    },
    limits: {
      api_calls_per_month: 5000,
      products_limit: 100,
      users_limit: 1,
      storage_gb: 1
    },
    features: [
      'basic_dashboard',
      'product_sync',
      'order_management'
    ],
    stripe_price_ids: {
      monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY || '',
      quarterly: process.env.STRIPE_PRICE_STARTER_QUARTERLY || '',
      yearly: process.env.STRIPE_PRICE_STARTER_YEARLY || ''
    }
  },
  professional: {
    type: 'professional',
    name: 'Professional',
    price: {
      monthly: 49900, // R$ 499,00
      quarterly: 134900, // R$ 1.349,00 (10% desconto)
      yearly: 499900   // R$ 4.999,00 (20% desconto)
    },
    limits: {
      api_calls_per_month: 50000,
      products_limit: 1000,
      users_limit: 5,
      storage_gb: 10
    },
    features: [
      'basic_dashboard',
      'product_sync',
      'order_management',
      'advanced_analytics',
      'multi_user'
    ],
    stripe_price_ids: {
      monthly: process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY || '',
      quarterly: process.env.STRIPE_PRICE_PROFESSIONAL_QUARTERLY || '',
      yearly: process.env.STRIPE_PRICE_PROFESSIONAL_YEARLY || ''
    }
  },
  enterprise: {
    type: 'enterprise',
    name: 'Enterprise',
    price: {
      monthly: 149900, // R$ 1.499,00
      quarterly: 404900, // R$ 4.049,00 (10% desconto)
      yearly: 1499900  // R$ 14.999,00 (20% desconto)
    },
    limits: {
      api_calls_per_month: -1, // Unlimited
      products_limit: -1,      // Unlimited
      users_limit: -1,         // Unlimited
      storage_gb: -1           // Unlimited
    },
    features: [
      'basic_dashboard',
      'product_sync',
      'order_management',
      'advanced_analytics',
      'multi_user',
      'api_access',
      'white_label',
      'priority_support',
      'custom_integrations'
    ],
    stripe_price_ids: {
      monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || '',
      quarterly: process.env.STRIPE_PRICE_ENTERPRISE_QUARTERLY || '',
      yearly: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY || ''
    }
  }
} as const;

/**
 * Features que requerem premium plans
 */
export const PREMIUM_FEATURES: Record<string, PeepersPlanType> = {
  // Rotas admin
  '/admin': 'professional',
  '/api/admin': 'professional',

  // Analytics avançado
  '/admin/metrics': 'professional',
  '/api/admin/metrics': 'professional',

  // Multi-usuário
  '/admin/users': 'professional',
  '/api/admin/users': 'professional',

  // API Access
  '/api/products-public': 'starter',

  // White-label
  '/admin/branding': 'enterprise',

  // Suporte prioritário (não é rota, mas feature)
  'priority_support': 'enterprise'
} as const;

/**
 * Cache TTL para entitlements (5 minutos)
 */
export const ENTITLEMENTS_CACHE_TTL = 300; // 5 minutes

/**
 * Trial period em dias
 */
export const TRIAL_PERIOD_DAYS = 14;

/**
 * Features disponíveis durante trial
 */
export const TRIAL_FEATURES: PeepersFeature[] = [
  'basic_dashboard',
  'product_sync',
  'order_management'
];

/**
 * Utilitários para verificar entitlements
 */
export class EntitlementUtils {
  static getPlanByType(planType: PeepersPlanType): PeepersPlan {
    return PEEPERS_PLANS[planType];
  }

  static getRequiredPlanForFeature(feature: string): PeepersPlanType | null {
    return PREMIUM_FEATURES[feature] || null;
  }

  static isFeatureAllowed(planType: PeepersPlanType, feature: PeepersFeature): boolean {
    const plan = this.getPlanByType(planType);
    return plan.features.includes(feature);
  }

  static isLimitExceeded(current: number, limit: number): boolean {
    return limit !== -1 && current >= limit;
  }
}