/**
 * Platform Admin Configuration
 * 
 * Configuração especial para o dono da aplicação (super admin)
 * Distingue entre owner da SaaS vs customers pagantes
 */

export const PLATFORM_CONFIG = {
  // Email do dono da aplicação (você)
  SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL || 'peepers.shop@gmail.com',
  
  // User IDs que são super admins (para backward compatibility)
  SUPER_ADMIN_USER_IDS: (process.env.SUPER_ADMIN_USER_IDS || '').split(',').filter(Boolean),
  
  // Organização especial para super admins
  PLATFORM_ORGANIZATION_ID: 'org_platform_admin',
  
  // Features exclusivas do super admin
  SUPER_ADMIN_FEATURES: [
    'platform:analytics',
    'platform:users_management', 
    'platform:organizations_management',
    'platform:billing_overview',
    'platform:system_health',
    'platform:feature_flags',
    'platform:audit_logs',
    'admin:all_organizations', // Pode ver todas as orgs
    'admin:impersonate_users',  // Pode se passar por outros usuários
    'stripe:admin_access',      // Acesso total ao Stripe
    'ml:global_settings'        // Configurações globais ML
  ] as const,
  
  // Routes exclusivas do super admin
  SUPER_ADMIN_ROUTES: [
    '/admin/platform',
    '/admin/organizations',
    '/admin/users', 
    '/admin/billing',
    '/admin/analytics',
    '/admin/system'
  ] as const
} as const;

export type SuperAdminFeature = typeof PLATFORM_CONFIG.SUPER_ADMIN_FEATURES[number];

/**
 * Verifica se um email é super admin
 */
export function isSuperAdminEmail(email: string): boolean {
  return email === PLATFORM_CONFIG.SUPER_ADMIN_EMAIL;
}

/**
 * Verifica se um user ID é super admin
 */
export function isSuperAdminUserId(userId: string): boolean {
  return PLATFORM_CONFIG.SUPER_ADMIN_USER_IDS.includes(userId);
}

/**
 * Verifica se um usuário é super admin (por email ou user ID)
 */
export function isSuperAdmin(user: { email?: string; id?: string }): boolean {
  if (user.email && isSuperAdminEmail(user.email)) return true;
  if (user.id && isSuperAdminUserId(user.id)) return true;
  return false;
}

/**
 * Entitlements especiais para super admin
 */
export function getSuperAdminEntitlements() {
  return {
    plan_type: 'super_admin' as const,
    features: PLATFORM_CONFIG.SUPER_ADMIN_FEATURES,
    limits: {
      api_calls_used: 0,
      api_calls_limit: Number.MAX_SAFE_INTEGER, // Ilimitado
      products_count: 0, 
      products_limit: Number.MAX_SAFE_INTEGER,
      users_count: 0,
      users_limit: Number.MAX_SAFE_INTEGER,
      storage_used_gb: 0,
      storage_limit_gb: Number.MAX_SAFE_INTEGER,
      organizations_count: 0, // Quantas orgs existem na plataforma
      active_subscriptions: 0 // Quantas subscriptions ativas
    },
    subscription_status: 'platform_owner' as const,
    trial_available: false,
    is_super_admin: true,
    platform_access: {
      can_view_all_organizations: true,
      can_impersonate_users: true,
      can_modify_billing: true,
      can_access_stripe_admin: true,
      can_view_platform_analytics: true
    }
  };
}