/**
 * Multi-tenant Architecture Migration Plan
 * 
 * PROBLEMA ATUAL:
 * - ALLOWED_USER_IDS hardcoded (não escala)
 * - ML User ID como Tenant ID (confunde autenticação com billing)
 * - Sem separação real de tenants
 * - Sem onboarding automático
 * 
 * SOLUÇÃO ENTERPRISE:
 * 1. Tenant/Organization model separado
 * 2. Users pertencentes a Organizations
 * 3. Stripe Customer = Organization (não User)
 * 4. ML connections como "integrations" do tenant
 * 5. Self-service signup
 */

// NOVA ESTRUTURA DE DADOS

export interface Organization {
  id: string;                    // UUID próprio (org_xxxxx)
  name: string;                  // Nome da empresa/loja
  slug: string;                  // URL amigável (peepers.com/acme-store)
  created_at: Date;
  updated_at: Date;
  
  // Billing (Stripe)
  stripe_customer_id?: string;   // Stripe Customer ID
  subscription_status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'none';
  plan_type: 'starter' | 'business' | 'enterprise';
  
  // Settings
  settings: {
    timezone: string;
    currency: string;
    language: string;
  };
  
  // Limits & Usage
  limits: {
    max_users: number;
    max_ml_connections: number;
    max_products: number;
    api_calls_limit: number;
  };
  
  usage: {
    users_count: number;
    ml_connections_count: number;
    products_count: number;
    api_calls_used: number;
  };
}

export interface User {
  id: string;                    // UUID próprio (user_xxxxx)
  email: string;                 // Email único global
  name: string;
  avatar_url?: string;
  created_at: Date;
  updated_at: Date;
  
  // Organization membership
  organization_id: string;       // FK para Organization
  role: 'owner' | 'admin' | 'member' | 'viewer';
  
  // Auth preferences
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
  };
}

export interface MLConnection {
  id: string;                    // UUID próprio (mlconn_xxxxx)
  organization_id: string;       // FK para Organization
  
  // ML OAuth data
  ml_user_id: string;           // ID do usuário no ML
  ml_nickname: string;          // Nickname no ML
  access_token: string;         // Token de acesso
  refresh_token: string;        // Token de refresh
  expires_at: Date;             // Expiração do token
  
  // Connection info
  status: 'active' | 'expired' | 'disconnected';
  last_sync_at?: Date;
  
  // ML Account data
  ml_account_info: {
    email: string;
    country_id: string;
    site_id: string;
    seller_reputation: any;
  };
}

// MIGRATION STRATEGY

export const MIGRATION_STEPS = [
  {
    step: 1,
    title: "Create Organizations table",
    description: "Add Organizations with proper tenant isolation",
    sql: `
      CREATE TABLE organizations (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        stripe_customer_id VARCHAR(255) UNIQUE,
        subscription_status VARCHAR(50) DEFAULT 'none',
        plan_type VARCHAR(50) DEFAULT 'starter',
        settings JSON,
        limits JSON,
        usage JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `
  },
  {
    step: 2,
    title: "Create Users table",
    description: "Separate user identity from ML accounts",
    sql: `
      CREATE TABLE users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        avatar_url VARCHAR(255),
        organization_id VARCHAR(255) NOT NULL,
        role ENUM('owner', 'admin', 'member', 'viewer') DEFAULT 'member',
        preferences JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
      );
    `
  },
  {
    step: 3,
    title: "Create ML Connections table", 
    description: "ML accounts as integrations, not primary identity",
    sql: `
      CREATE TABLE ml_connections (
        id VARCHAR(255) PRIMARY KEY,
        organization_id VARCHAR(255) NOT NULL,
        ml_user_id VARCHAR(255) NOT NULL,
        ml_nickname VARCHAR(255),
        access_token TEXT NOT NULL,
        refresh_token TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        status ENUM('active', 'expired', 'disconnected') DEFAULT 'active',
        last_sync_at TIMESTAMP,
        ml_account_info JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
        UNIQUE KEY unique_ml_user_org (ml_user_id, organization_id)
      );
    `
  }
];

// NOVO FLUXO DE AUTHENTICATION

export const NEW_AUTH_FLOW = {
  "1_signup": {
    endpoint: "/api/auth/signup",
    description: "Self-service signup with email/password",
    flow: [
      "User enters email/name/company",
      "Creates Organization + User in same transaction", 
      "Sends email verification",
      "Automatic 14-day trial starts"
    ]
  },
  
  "2_login": {
    endpoint: "/api/auth/login",
    description: "Email/password login to organization",
    flow: [
      "User enters email/password",
      "Validates against users table",
      "Sets organization context in session",
      "Redirects to /dashboard"
    ]
  },
  
  "3_ml_connect": {
    endpoint: "/api/integrations/mercado-livre/connect",
    description: "Connect ML account as integration",
    flow: [
      "User clicks 'Connect Mercado Livre'",
      "OAuth flow creates MLConnection record",
      "Links to current organization", 
      "Starts product sync background job"
    ]
  },
  
  "4_organization_switch": {
    endpoint: "/api/organizations/switch",
    description: "Multi-org support (future)",
    flow: [
      "User can belong to multiple orgs",
      "Switch context via dropdown",
      "All data filtered by current org_id"
    ]
  }
};

// BACKWARD COMPATIBILITY

export const COMPATIBILITY_LAYER = {
  description: "Gradual migration without breaking current users",
  strategy: [
    "Keep ALLOWED_USER_IDS working during transition",
    "Auto-create Organizations for existing ML users",
    "Migrate existing cache keys to new format",
    "Dual auth support (old + new) for 30 days"
  ]
};

export default {
  MIGRATION_STEPS,
  NEW_AUTH_FLOW,
  COMPATIBILITY_LAYER
};