/**
 * Multi-Tenant Types - Peepers Enterprise v2.0.0
 *
 * Tipos para isolamento multi-tenant e gerenciamento de tenants
 */

export interface PeepersTenant {
  id: string;                 // Tenant UUID
  name: string;               // Company name
  slug: string;               // URL slug
  ml_user_id: number;         // Primary ML user
  ml_users: number[];         // All associated ML users
  subscription: {
    plan: 'starter' | 'professional' | 'enterprise';
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
  permissions: string[];      // Granular permissions
  preferences: {
    timezone: string;
    language: string;
    notifications: {
      orders: boolean;
      messages: boolean;
      questions: boolean;
      products: boolean;
    };
    dashboard_layout?: any;   // Custom layout
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
  plan_type: 'starter' | 'professional' | 'enterprise';
  subscription_status: 'active' | 'suspended' | 'cancelled' | 'trial';
  features: string[];
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