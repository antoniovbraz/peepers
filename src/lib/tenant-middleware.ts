/**
 * Tenant Middleware - Peepers Enterprise v2.0.0
 * Middleware for tenant context and request scoping
 */

import { NextRequest, NextResponse } from 'next/server';
import { TenantService } from '../lib/tenant-service';
import { PeepersTenant, PeepersUser, TenantContext } from '../types/tenant';

// Custom error for tenant-related issues
export class TenantError extends Error {
  constructor(message: string, public statusCode: number = 400) {
    super(message);
    this.name = 'TenantError';
  }
}

// Tenant context attached to requests
export interface RequestTenantContext {
  tenant: PeepersTenant;
  user: PeepersUser;
  permissions: string[];
  isOwner: boolean;
  isAdmin: boolean;
  canAccessFeature: (feature: string) => boolean;
}

export class TenantMiddleware {
  /**
   * Extract tenant slug from request URL
   */
  static extractTenantSlug(request: NextRequest): string | null {
    const url = new URL(request.url);
    const hostname = url.hostname;

    // Check for subdomain (tenant.example.com)
    if (hostname.includes('.')) {
      const parts = hostname.split('.');
      if (parts.length >= 3) {
        return parts[0];
      }
    }

    // Check for path-based tenant (/tenant-slug/...)
    const pathParts = url.pathname.split('/').filter(Boolean);
    if (pathParts.length > 0 && pathParts[0] !== 'api') {
      return pathParts[0];
    }

    return null;
  }

  /**
   * Get tenant from request
   */
  static async getTenantFromRequest(request: NextRequest): Promise<PeepersTenant> {
    const tenantSlug = this.extractTenantSlug(request);

    if (!tenantSlug) {
      throw new TenantError('No tenant identifier found in request', 400);
    }

    const tenant = await TenantService.getTenantBySlug(tenantSlug);

    if (!tenant) {
      throw new TenantError('Tenant not found', 404);
    }

    if (tenant.status !== 'active') {
      throw new TenantError('Tenant is not active', 403);
    }

    return tenant;
  }

  /**
   * Get user from request (from session/cookies)
   */
  static async getUserFromRequest(request: NextRequest, tenantId: string): Promise<PeepersUser> {
    // This would typically get user ID from session/cookies
    // For now, we'll use a placeholder implementation
    const userId = this.getUserIdFromSession(request);

    if (!userId) {
      throw new TenantError('User not authenticated', 401);
    }

    const user = await TenantService.getTenantUser(tenantId, userId);

    if (!user) {
      throw new TenantError('User not found in tenant', 403);
    }

    if (user.status !== 'active') {
      throw new TenantError('User account is not active', 403);
    }

    return user;
  }

  /**
   * Create tenant context
   */
  static async createTenantContext(request: NextRequest): Promise<RequestTenantContext> {
    const tenant = await this.getTenantFromRequest(request);
    const user = await this.getUserFromRequest(request, tenant.id);

    const permissions = user.permissions.map(p => p.toString());
    const isOwner = user.role === 'owner';
    const isAdmin = isOwner || user.role === 'admin';

    const canAccessFeature = (feature: string): boolean => {
      return permissions.includes(feature);
    };

    return {
      tenant,
      user,
      permissions,
      isOwner,
      isAdmin,
      canAccessFeature
    };
  }

  /**
   * Middleware function for Next.js
   */
  static async middleware(request: NextRequest): Promise<NextResponse> {
    try {
      // Skip middleware for public routes
      if (this.isPublicRoute(request)) {
        return NextResponse.next();
      }

      // Create tenant context
      const tenantContext = await this.createTenantContext(request);

      // Check if user has access to the requested resource
      if (!this.hasAccessToRoute(request, tenantContext)) {
        return new NextResponse('Access denied', { status: 403 });
      }

      // Add tenant context to request headers for downstream use
      const response = NextResponse.next();
      response.headers.set('x-tenant-id', tenantContext.tenant.id);
      response.headers.set('x-user-id', tenantContext.user.id);
      response.headers.set('x-user-role', tenantContext.user.role);

      return response;

    } catch (error) {
      if (error instanceof TenantError) {
        return new NextResponse(error.message, { status: error.statusCode });
      }

      console.error('Tenant middleware error:', error);
      return new NextResponse('Internal server error', { status: 500 });
    }
  }

  /**
   * Check if route is public (doesn't require tenant context)
   */
  private static isPublicRoute(request: NextRequest): boolean {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Public API routes
    const publicRoutes = [
      '/api/health',
      '/api/auth',
      '/api/webhook',
      '/api/cache-debug'
    ];

    return publicRoutes.some(route => pathname.startsWith(route));
  }

  /**
   * Check if user has access to the requested route
   */
  private static hasAccessToRoute(request: NextRequest, context: TenantContext): boolean {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Admin routes require admin/owner role
    if (pathname.startsWith('/admin') || pathname.includes('/admin')) {
      return context.isAdmin;
    }

    // API routes may have additional restrictions
    if (pathname.startsWith('/api')) {
      return this.checkApiAccess(pathname, context);
    }

    // Default: allow access
    return true;
  }

  /**
   * Check API-specific access rules
   */
  private static checkApiAccess(pathname: string, context: TenantContext): boolean {
    // Product management requires specific permissions
    if (pathname.includes('/products') && (pathname.includes('/create') || pathname.includes('/update') || pathname.includes('/delete'))) {
      return context.canAccessFeature('product_management');
    }

    // Analytics requires analytics permission
    if (pathname.includes('/analytics')) {
      return context.canAccessFeature('analytics');
    }

    // Settings require admin access
    if (pathname.includes('/settings') || pathname.includes('/tenant')) {
      return context.isAdmin;
    }

    // Default API access
    return true;
  }

  /**
   * Get user ID from session/cookies
   * This is a placeholder - implement based on your auth system
   */
  private static getUserIdFromSession(request: NextRequest): string | null {
    // Check for session cookie or JWT token
    const sessionCookie = request.cookies.get('session')?.value;
    const authToken = request.headers.get('authorization');

    if (sessionCookie) {
      // Decode session cookie to get user ID
      // This is a placeholder implementation
      return 'placeholder-user-id';
    }

    if (authToken) {
      // Decode JWT token to get user ID
      // This is a placeholder implementation
      return 'placeholder-user-id';
    }

    return null;
  }

  /**
   * Validate tenant limits for operations
   */
  static async validateTenantLimits(tenantId: string, operation: string, currentUsage?: number): Promise<void> {
    const tenant = await TenantService.getTenant(tenantId);

    if (!tenant) {
      throw new TenantError('Tenant not found', 404);
    }

    // Check subscription status
    if (tenant.subscription.status !== 'active' && tenant.subscription.status !== 'trial') {
      throw new TenantError('Tenant subscription is not active', 403);
    }

    // Check specific limits based on operation
    switch (operation) {
      case 'create_product':
        if (!this.isWithinLimit(tenant.limits.products, tenant.usage.products_count)) {
          throw new TenantError('Product limit exceeded', 403);
        }
        break;

      case 'api_call':
        if (currentUsage && !this.isWithinLimit(tenant.limits.api_calls_per_hour, currentUsage)) {
          throw new TenantError('API rate limit exceeded', 429);
        }
        break;

      case 'add_user':
        if (!this.isWithinLimit(tenant.limits.team_members, tenant.usage.team_members_count)) {
          throw new TenantError('Team member limit exceeded', 403);
        }
        break;
    }
  }

  /**
   * Update tenant usage
   */
  static async updateTenantUsage(tenantId: string, operation: string): Promise<void> {
    const updates: Partial<PeepersTenant['usage']> = {};

    switch (operation) {
      case 'create_product':
        updates.products_count = 1; // Increment by 1
        break;

      case 'api_call':
        updates.api_calls_today = 1; // Increment by 1
        break;

      case 'add_user':
        updates.team_members_count = 1; // Increment by 1
        break;
    }

    if (Object.keys(updates).length > 0) {
      await TenantService.updateTenantUsage(tenantId, updates);
    }
  }

  /**
   * Helper to check if value is within limit
   */
  private static isWithinLimit(limit: number, current: number): boolean {
    return limit === -1 || current < limit; // -1 means unlimited
  }
}

// Export types for use in other modules
export type { RequestTenantContext as TenantContext };