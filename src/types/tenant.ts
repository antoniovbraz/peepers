/**
 * Multi-Tenant Types - Peepers Enterprise v2.0.0
 *
 * Tipos para isolamento multi-tenant e gerenciamento de tenants
 * Alinhado com estratégia de pricing estratégico (R$ 19,90/34,90/54,90)
 */

import { PeepersPlanId, PeepersPlanFeature } from '../config/pricing';

export interface PeepersTenant {
  id: string;                 // Tenant UUID
  name: string;               // Company name
  slug: string;               // URL slug
  ml_user_id: number;         // Primary ML user
  ml_users: number[];         // All associated ML users
  subscription: {
    plan: PeepersPlanId;
    status: 'active' | 'suspended' | 'cancelled' | 'trial';
    billing_cycle: 'monthly' | 'quarterly' | 'yearly';
    current_period_start: string; // ISO date
    current_period_end: string;   // ISO date
    trial_ends_at?: string;       // ISO date for trial
    cancel_at_period_end?: boolean; // Cancel at period end flag
    stripe_customer_id?: string;  // Stripe customer
    stripe_subscription_id?: string; // Stripe subscription
  };
  settings: {
    timezone: string;         // Tenant timezone
    currency: string;         // Default currency
    language: string;         // Interface language
    business_type: 'individual' | 'small_business' | 'enterprise';
    industry?: string;        // Business industry
    webhook_url?: string;     // Custom webhook
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
  };
  limits: {
    products: number;         // Product limit
    orders_per_month: number; // Order limit
    api_calls_per_hour: number; // API limit
    storage_gb: number;       // Storage limit
    team_members: number;     // User limit
  };
  usage: {
    products_count: number;
    orders_this_month: number;
    api_calls_today: number;
    storage_used_gb: number;
    team_members_count: number;
  };
  created_at: string;         // ISO creation date
  updated_at: string;         // ISO update date
  status: 'active' | 'suspended' | 'deleted';
}

export interface PeepersUser {
  id: string;                 // User UUID
  tenant_id: string;          // Tenant ID
  ml_user_id?: number;        // ML user (if linked)
  email: string;              // User email
  first_name: string;         // User first name
  last_name: string;          // User last name
  role: 'owner' | 'admin' | 'manager' | 'operator' | 'viewer';
  permissions: PeepersPlanFeature[];      // Granular permissions
  preferences: {
    timezone: string;
    language: string;
    notifications: {
      orders: boolean;
      messages: boolean;
      questions: boolean;
      products: boolean;
    };
    dashboard_layout?: Record<string, unknown>;   // Custom layout
  };
  last_login?: string;        // ISO last login
  status: 'active' | 'invited' | 'suspended';
  created_at: string;         // ISO creation date
  updated_at: string;         // ISO update date
}

export interface TenantContext {
  tenant: PeepersTenant;
  user: PeepersUser;
  permissions: string[];
  isOwner: boolean;
  isAdmin: boolean;
  canAccessFeature: (feature: string) => boolean;
}

export interface TenantEntitlement {
  tenant_id: string;
  plan_type: PeepersPlanId;
  subscription_status: 'active' | 'suspended' | 'cancelled' | 'trial';
  features: PeepersPlanFeature[];
  limits: {
    products: number;
    orders_per_month: number;
    api_calls_per_hour: number;
    storage_gb: number;
    team_members: number;
  };
  usage: {
    products_count: number;
    orders_this_month: number;
    api_calls_today: number;
    storage_used_gb: number;
    team_members_count: number;
  };
  trial_ends_at?: string;
  current_period_end: string;
}

// Additional Multi-Tenant Types
export interface TenantCreationRequest {
  name: string;
  slug: string;
  ml_user_id?: number;
  plan_id: PeepersPlanId;
  settings?: Partial<PeepersTenant['settings']>;
}

export interface TenantInvitation {
  id: string;
  tenant_id: string;
  email: string;
  role: PeepersUser['role'];
  invited_by: string;
  invited_at: string;
  expires_at: string;
  token: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
}

export interface TenantAuditLog {
  id: string;
  tenant_id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  changes: Record<string, unknown>;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export interface TenantMetrics {
  tenant_id: string;
  period_start: string;
  period_end: string;
  total_sales: number;
  total_orders: number;
  average_order_value: number;
  active_products: number;
  conversion_rate: number;
  api_calls_used: number;
  storage_used_gb: number;
  active_users: number;
}

// Helper Functions
export function isTenantActive(tenant: PeepersTenant): boolean {
  return tenant.status === 'active' &&
         (tenant.subscription.status === 'active' || tenant.subscription.status === 'trial');
}

export function isWithinTenantLimits(tenant: PeepersTenant, resource: keyof PeepersTenant['limits'], currentUsage: number): boolean {
  const limit = tenant.limits[resource];
  return limit === -1 || currentUsage < limit; // -1 means unlimited
}

export function canUserAccessFeature(user: PeepersUser, feature: PeepersPlanFeature): boolean {
  return user.permissions.includes(feature);
}

export function getTenantPlanFeatures(_tenant: PeepersTenant): PeepersPlanFeature[] {
  // This will be implemented to return features based on plan
  // For now, return empty array - will be populated from pricing config
  return [];
}

// Constants
export const TENANT_SLUG_PATTERN = /^[a-z0-9-]+$/;
export const MAX_TENANT_NAME_LENGTH = 100;
export const MAX_TENANT_SLUG_LENGTH = 50;
export const TENANT_INVITATION_EXPIRY_HOURS = 168; // 7 days