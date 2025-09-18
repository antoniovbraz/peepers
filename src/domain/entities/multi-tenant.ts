/**
 * Multi-tenant Domain Models - Enterprise v2.1.0
 * 
 * Clean Architecture: Domain Layer
 * Define as entidades principais do sistema multi-tenant
 */

export interface Organization {
  // Identity
  id: string;                    // org_xxxxx
  name: string;                  // "ACME Store"
  slug: string;                  // "acme-store" (URL friendly)
  domain?: string;               // "acme.peepers.com" (custom domain)
  
  // Timestamps
  created_at: Date;
  updated_at: Date;
  
  // Billing & Subscription
  stripe_customer_id?: string;
  subscription: {
    status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'none';
    plan_type: 'starter' | 'professional' | 'enterprise';
    current_period_start?: Date;
    current_period_end?: Date;
    cancel_at_period_end: boolean;
    trial_end?: Date;
  };
  
  // Configuration
  settings: {
    timezone: string;            // "America/Sao_Paulo"
    currency: string;           // "BRL"
    language: string;           // "pt-BR"
    business_type: 'individual' | 'business';
    tax_id?: string;            // CPF/CNPJ
  };
  
  // Limits & Usage (from Stripe plan)
  limits: {
    max_users: number;          // -1 = unlimited
    max_ml_connections: number; // Quantas contas ML pode conectar
    max_products: number;       // -1 = unlimited
    api_calls_per_month: number; // 1000, 10000, 100000
    storage_gb: number;         // 1, 10, 100
  };
  
  // Current usage (real-time)
  usage: {
    users_count: number;
    ml_connections_count: number;
    products_count: number;
    api_calls_used: number;     // Reset monthly
    storage_used_gb: number;
  };
  
  // Features enabled (from plan)
  features: string[];           // ['basic_dashboard', 'advanced_analytics', 'api_access']
}

export interface User {
  // Identity
  id: string;                   // user_xxxxx
  email: string;                // Unique globally
  name: string;
  avatar_url?: string;
  
  // Organization membership
  organization_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  invited_by?: string;         // user_id who invited
  joined_at: Date;
  
  // Authentication
  email_verified: boolean;
  password_hash?: string;      // For email/password login
  last_login_at?: Date;
  
  // Preferences
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    timezone: string;
    notifications: {
      email: boolean;
      browser: boolean;
      slack: boolean;
    };
  };
  
  // Timestamps
  created_at: Date;
  updated_at: Date;
}

export interface MLConnection {
  // Identity
  id: string;                   // mlconn_xxxxx
  organization_id: string;
  
  // ML Account Info
  ml_user_id: string;          // ID no Mercado Livre
  ml_nickname: string;         // Nickname no ML
  ml_email: string;            // Email da conta ML
  ml_country_id: string;       // "BR", "AR", etc
  ml_site_id: string;          // "MLB", "MLA", etc
  
  // OAuth Tokens
  access_token: string;
  refresh_token: string;
  expires_at: Date;
  scopes: string[];            // ["read", "write", "offline_access"]
  
  // Connection Status
  status: 'active' | 'expired' | 'error' | 'disconnected';
  last_sync_at?: Date;
  last_error?: {
    code: string;
    message: string;
    occurred_at: Date;
  };
  
  // ML Account Data (cached)
  ml_account_info: {
    seller_reputation: {
      level_id: string;
      power_seller_status: string;
      transactions: {
        total: number;
        completed: number;
        canceled: number;
      };
    };
    address: {
      city: string;
      state: string;
      country: string;
    };
    phone?: {
      area_code: string;
      number: string;
      verified: boolean;
    };
  };
  
  // Sync Configuration
  sync_settings: {
    auto_sync_enabled: boolean;
    sync_interval_minutes: number; // 15, 30, 60
    sync_products: boolean;
    sync_orders: boolean;
    sync_messages: boolean;
  };
  
  // Timestamps
  created_at: Date;
  updated_at: Date;
  disconnected_at?: Date;
}

export interface Session {
  // Identity
  id: string;                   // session_xxxxx
  user_id: string;
  organization_id: string;      // Current org context
  
  // Session data
  token: string;                // JWT or random token
  expires_at: Date;
  ip_address: string;
  user_agent: string;
  
  // Security
  last_activity_at: Date;
  is_active: boolean;
  
  // Timestamps
  created_at: Date;
}

export interface Invitation {
  // Identity
  id: string;                   // inv_xxxxx
  organization_id: string;
  invited_by_user_id: string;
  
  // Invitation details
  email: string;
  role: 'admin' | 'member' | 'viewer';
  token: string;                // Unique invitation token
  
  // Status
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  accepted_by_user_id?: string;
  accepted_at?: Date;
  
  // Expiration
  expires_at: Date;             // 7 days from creation
  
  // Timestamps
  created_at: Date;
  updated_at: Date;
}

// Domain Events
export interface OrganizationCreated {
  type: 'organization.created';
  organization_id: string;
  owner_user_id: string;
  plan_type: string;
  created_at: Date;
}

export interface UserInvited {
  type: 'user.invited';
  organization_id: string;
  invitation_id: string;
  email: string;
  role: string;
  invited_by: string;
  created_at: Date;
}

export interface MLConnectionEstablished {
  type: 'ml_connection.established';
  organization_id: string;
  connection_id: string;
  ml_user_id: string;
  ml_nickname: string;
  created_at: Date;
}

export interface SubscriptionChanged {
  type: 'subscription.changed';
  organization_id: string;
  old_plan: string;
  new_plan: string;
  stripe_subscription_id: string;
  changed_at: Date;
}

// Value Objects
export class OrganizationSlug {
  constructor(private readonly value: string) {
    if (!this.isValid(value)) {
      throw new Error('Invalid organization slug');
    }
  }
  
  private isValid(slug: string): boolean {
    // 3-30 chars, lowercase, alphanumeric + hyphens
    return /^[a-z0-9-]{3,30}$/.test(slug) && 
           !slug.startsWith('-') && 
           !slug.endsWith('-') &&
           !slug.includes('--');
  }
  
  toString(): string {
    return this.value;
  }
  
  static fromName(name: string): OrganizationSlug {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 30);
    
    return new OrganizationSlug(slug);
  }
}

export class Email {
  constructor(private readonly value: string) {
    if (!this.isValid(value)) {
      throw new Error('Invalid email address');
    }
  }
  
  private isValid(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
  
  toString(): string {
    return this.value;
  }
  
  domain(): string {
    return this.value.split('@')[1];
  }
}