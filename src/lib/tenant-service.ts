/**
 * Tenant Service - Peepers Enterprise v2.0.0
 * Service layer for multi-tenant operations
 */

import { kv } from '@vercel/kv';
import { randomUUID } from 'crypto';
import {
  PeepersTenant,
  PeepersUser,
  TenantCreationRequest,
  TenantInvitation,
  TenantAuditLog,
  TenantMetrics,
  TENANT_SLUG_PATTERN,
  MAX_TENANT_NAME_LENGTH,
  MAX_TENANT_SLUG_LENGTH,
  TENANT_INVITATION_EXPIRY_HOURS
} from '../types/tenant';
import { PEEPERS_PLANS, PeepersPlanId, PeepersPlanFeature } from '../config/pricing';

// Cache keys
const CACHE_KEYS = {
  TENANT: (id: string) => `tenant:${id}`,
  TENANT_BY_SLUG: (slug: string) => `tenant:slug:${slug}`,
  TENANT_USERS: (tenantId: string) => `tenant:${tenantId}:users`,
  TENANT_USER: (tenantId: string, userId: string) => `tenant:${tenantId}:user:${userId}`,
  TENANT_INVITATIONS: (tenantId: string) => `tenant:${tenantId}:invitations`,
  TENANT_METRICS: (tenantId: string, period: string) => `tenant:${tenantId}:metrics:${period}`,
  USER_TENANTS: (userId: string) => `user:${userId}:tenants`
} as const;

// Cache TTL
const CACHE_TTL = {
  TENANT: 3600, // 1 hour
  USERS: 1800,  // 30 minutes
  METRICS: 7200 // 2 hours
} as const;

export class TenantService {
  /**
   * Create a new tenant
   */
  static async createTenant(request: TenantCreationRequest, createdBy: string): Promise<PeepersTenant> {
    // Validate input
    this.validateTenantCreationRequest(request);

    // Check if slug is available
    const existingTenant = await this.getTenantBySlug(request.slug);
    if (existingTenant) {
      throw new Error('Tenant slug already exists');
    }

    // Create tenant
    const tenant: PeepersTenant = {
      id: randomUUID(),
      name: request.name,
      slug: request.slug,
      ml_user_id: request.ml_user_id || 0, // 0 indicates no ML user linked yet
      ml_users: request.ml_user_id ? [request.ml_user_id] : [],
      subscription: {
        plan: request.plan_id,
        status: 'trial',
        billing_cycle: 'monthly',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days trial
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        cancel_at_period_end: false
      },
      settings: {
        timezone: 'America/Sao_Paulo',
        currency: 'BRL',
        language: 'pt-BR',
        business_type: 'small_business',
        notifications: {
          email: true,
          sms: false,
          push: true
        },
        ...request.settings
      },
      limits: this.getPlanLimits(request.plan_id),
      usage: {
        products_count: 0,
        orders_this_month: 0,
        api_calls_today: 0,
        storage_used_gb: 0,
        team_members_count: 1 // Creator counts as first member
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'active'
    };

    // Save to cache
    await kv.set(CACHE_KEYS.TENANT(tenant.id), JSON.stringify(tenant), { ex: CACHE_TTL.TENANT });
    await kv.set(CACHE_KEYS.TENANT_BY_SLUG(tenant.slug), tenant.id, { ex: CACHE_TTL.TENANT });

    // Create owner user
    await this.createTenantUser(tenant.id, createdBy, 'owner');

    // Log audit event
    await this.logAuditEvent(tenant.id, createdBy, 'tenant_created', 'tenant', tenant.id, {
      name: tenant.name,
      plan: tenant.subscription.plan
    });

    return tenant;
  }

  /**
   * Get tenant by ID
   */
  static async getTenant(tenantId: string): Promise<PeepersTenant | null> {
    const cached = await kv.get<string>(CACHE_KEYS.TENANT(tenantId));
    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  }

  /**
   * Get tenant by slug
   */
  static async getTenantBySlug(slug: string): Promise<PeepersTenant | null> {
    const tenantId = await kv.get<string>(CACHE_KEYS.TENANT_BY_SLUG(slug));
    if (tenantId) {
      return this.getTenant(tenantId);
    }
    return null;
  }

  /**
   * Update tenant
   */
  static async updateTenant(tenantId: string, updates: Partial<PeepersTenant>, updatedBy: string): Promise<PeepersTenant> {
    const tenant = await this.getTenant(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const updatedTenant = {
      ...tenant,
      ...updates,
      updated_at: new Date().toISOString()
    };

    // Save to cache
    await kv.set(CACHE_KEYS.TENANT(tenantId), JSON.stringify(updatedTenant), { ex: CACHE_TTL.TENANT });

    // Log audit event
    await this.logAuditEvent(tenantId, updatedBy, 'tenant_updated', 'tenant', tenantId, updates);

    return updatedTenant;
  }

  /**
   * Create user within tenant
   */
  static async createTenantUser(tenantId: string, userId: string, role: PeepersUser['role']): Promise<PeepersUser> {
    const user: PeepersUser = {
      id: randomUUID(),
      tenant_id: tenantId,
      email: '', // Will be populated from user service
      first_name: '',
      last_name: '',
      role,
      permissions: this.getRolePermissions(role),
      preferences: {
        timezone: 'America/Sao_Paulo',
        language: 'pt-BR',
        notifications: {
          orders: true,
          messages: true,
          questions: true,
          products: true
        }
      },
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Save to cache
    await kv.set(CACHE_KEYS.TENANT_USER(tenantId, userId), JSON.stringify(user), { ex: CACHE_TTL.USERS });

    // Add to tenant users list
    await kv.sadd(CACHE_KEYS.TENANT_USERS(tenantId), userId);

    return user;
  }

  /**
   * Get tenant user
   */
  static async getTenantUser(tenantId: string, userId: string): Promise<PeepersUser | null> {
    const cached = await kv.get<string>(CACHE_KEYS.TENANT_USER(tenantId, userId));
    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  }

  /**
   * Get all tenant users
   */
  static async getTenantUsers(tenantId: string): Promise<PeepersUser[]> {
    const userIds = await kv.smembers(CACHE_KEYS.TENANT_USERS(tenantId));
    const users: PeepersUser[] = [];

    for (const userId of userIds) {
      const user = await this.getTenantUser(tenantId, userId);
      if (user) {
        users.push(user);
      }
    }

    return users;
  }

  /**
   * Invite user to tenant
   */
  static async inviteUser(tenantId: string, email: string, role: PeepersUser['role'], invitedBy: string): Promise<TenantInvitation> {
    const invitation: TenantInvitation = {
      id: randomUUID(),
      tenant_id: tenantId,
      email,
      role,
      invited_by: invitedBy,
      invited_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + TENANT_INVITATION_EXPIRY_HOURS * 60 * 60 * 1000).toISOString(),
      token: randomUUID(),
      status: 'pending'
    };

    // Save invitation
    await kv.set(`tenant:${tenantId}:invitation:${invitation.token}`, JSON.stringify(invitation), {
      ex: TENANT_INVITATION_EXPIRY_HOURS * 60 * 60
    });

    // Add to invitations list
    await kv.sadd(CACHE_KEYS.TENANT_INVITATIONS(tenantId), invitation.id);

    return invitation;
  }

  /**
   * Update tenant usage
   */
  static async updateTenantUsage(tenantId: string, usage: Partial<PeepersTenant['usage']>): Promise<void> {
    const tenant = await this.getTenant(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const updatedUsage = { ...tenant.usage, ...usage };
    await this.updateTenant(tenantId, { usage: updatedUsage }, 'system');
  }

  /**
   * Get tenant metrics
   */
  static async getTenantMetrics(tenantId: string, period: string): Promise<TenantMetrics | null> {
    const cached = await kv.get<string>(CACHE_KEYS.TENANT_METRICS(tenantId, period));
    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  }

  /**
   * Update tenant metrics
   */
  static async updateTenantMetrics(tenantId: string, period: string, metrics: TenantMetrics): Promise<void> {
    await kv.set(CACHE_KEYS.TENANT_METRICS(tenantId, period), JSON.stringify(metrics), { ex: CACHE_TTL.METRICS });
  }

  // Private helper methods
  private static validateTenantCreationRequest(request: TenantCreationRequest): void {
    if (!request.name || request.name.length > MAX_TENANT_NAME_LENGTH) {
      throw new Error('Invalid tenant name');
    }

    if (!request.slug || !TENANT_SLUG_PATTERN.test(request.slug) || request.slug.length > MAX_TENANT_SLUG_LENGTH) {
      throw new Error('Invalid tenant slug');
    }

    if (!request.plan_id || !PEEPERS_PLANS[request.plan_id]) {
      throw new Error('Invalid plan ID');
    }
  }

  private static getPlanLimits(planId: PeepersPlanId): PeepersTenant['limits'] {
    const plan = PEEPERS_PLANS[planId];
    return {
      products: plan.limits.products_limit,
      orders_per_month: plan.limits.api_calls_per_month, // Using API calls as proxy for orders
      api_calls_per_hour: 1000, // Default hourly limit
      storage_gb: plan.limits.storage_gb,
      team_members: plan.limits.users_limit
    };
  }

  private static getRolePermissions(_role: PeepersUser['role']): PeepersPlanFeature[] {
    // This will be implemented based on role hierarchy
    // For now, return all features - will be filtered by plan later
    return [];
  }

  private static async logAuditEvent(
    tenantId: string,
    userId: string,
    action: string,
    resourceType: string,
    resourceId: string,
    changes: Record<string, unknown>
  ): Promise<void> {
    const auditLog: TenantAuditLog = {
      id: randomUUID(),
      tenant_id: tenantId,
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      changes,
      ip_address: '', // Will be populated from request
      user_agent: '', // Will be populated from request
      created_at: new Date().toISOString()
    };

    // Save audit log (in a real implementation, this would go to a database)
    await kv.lpush(`tenant:${tenantId}:audit`, JSON.stringify(auditLog));
    await kv.ltrim(`tenant:${tenantId}:audit`, 0, 999); // Keep last 1000 entries
  }
}