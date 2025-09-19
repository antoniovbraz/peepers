/**
 * Middleware Entitlements Tests - Peepers Enterprise v2.0.0
 *
 * Testes unitários para validação de entitlements no middleware
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { middleware } from '@/middleware';
import { stripeClient } from '@/lib/stripe';
import { cache } from '@/lib/cache';

// Mocks
vi.mock('@/lib/stripe', () => ({
  stripeClient: {
    checkEntitlement: vi.fn()
  }
}));
vi.mock('@/lib/cache', () => ({
  cache: {
    getUser: vi.fn()
  }
}));
vi.mock('@/lib/cors', () => ({
  corsHandler: {
    handleAPIRequest: vi.fn().mockReturnValue(null),
    applyCORSHeaders: vi.fn().mockImplementation((request, response) => response || NextResponse.next())
  }
}));
vi.mock('@/lib/security-events', () => ({
  logSecurityEvent: vi.fn().mockResolvedValue(undefined)
}));

describe('Middleware Entitlements', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Public Routes', () => {
    it('should allow access to public routes without authentication', async () => {
      // Use a route that would normally require auth but is public
      mockRequest = new NextRequest('http://localhost/api/products');

      const response = await middleware(mockRequest);

      expect(response.status).toBe(200);
    });
  });

  describe('Premium Routes - Professional Plan Required', () => {
    beforeEach(() => {
      // Mock authenticated user
      vi.mocked(cache.getUser).mockResolvedValue({
        user_id: 123,
        token: 'valid_token',
        session_token: 'valid_session',
        expires_at: new Date(Date.now() + 3600000).toISOString()
      });
    });

    it('should allow access when user has required entitlement', async () => {
      mockRequest = new NextRequest('http://localhost/admin/dashboard');
      mockRequest.cookies.set('session_token', 'valid_session');
      mockRequest.cookies.set('user_id', '123');

      vi.mocked(stripeClient.checkEntitlement).mockResolvedValue({
        allowed: true
      });

      const response = await middleware(mockRequest);

      expect(vi.mocked(stripeClient.checkEntitlement)).toHaveBeenCalledWith('123', 'advanced_analytics');
      expect(response.status).toBe(200);
    });

    it('should deny access when user lacks required entitlement', async () => {
      mockRequest = new NextRequest('http://localhost/admin/dashboard');
      mockRequest.cookies.set('session_token', 'valid_session');
      mockRequest.cookies.set('user_id', '123');

      vi.mocked(stripeClient.checkEntitlement).mockResolvedValue({
        allowed: false,
        reason: 'Feature not included in current plan',
        upgrade_required: true
      });

      const response = await middleware(mockRequest);

      expect(vi.mocked(stripeClient.checkEntitlement)).toHaveBeenCalledWith('123', 'advanced_analytics');
      expect(response.status).toBe(307); // Temporary Redirect
      expect(response.headers.get('location')).toContain('/upgrade');
    });

    it('should deny access to enterprise routes without enterprise plan', async () => {
      mockRequest = new NextRequest('http://localhost/api/products-public');
      mockRequest.cookies.set('session_token', 'valid_session');
      mockRequest.cookies.set('user_id', '123');

      vi.mocked(stripeClient.checkEntitlement).mockResolvedValue({
        allowed: false,
        reason: 'Enterprise feature',
        upgrade_required: true
      });

      const response = await middleware(mockRequest);

      expect(vi.mocked(stripeClient.checkEntitlement)).toHaveBeenCalledWith('123', 'api_access');
      expect(response.status).toBe(307);
    });
  });

  describe('Error Handling', () => {
    it('should allow access on Stripe API errors to prevent downtime', async () => {
      mockRequest = new NextRequest('http://localhost/admin/dashboard');
      mockRequest.cookies.set('session_token', 'valid_session');
      mockRequest.cookies.set('user_id', '123');

      vi.mocked(cache.getUser).mockResolvedValue({
        user_id: 123,
        token: 'valid_token',
        session_token: 'valid_session',
        expires_at: new Date(Date.now() + 3600000).toISOString()
      });

      vi.mocked(stripeClient.checkEntitlement).mockRejectedValue(new Error('Stripe API error'));

      const response = await middleware(mockRequest);

      // Should allow access despite error
      expect(response.status).toBe(200);
    });
  });

  describe('Route Feature Mapping', () => {
    const testCases = [
      { path: '/admin/dashboard', expectedFeature: 'advanced_analytics' },
      { path: '/admin/metrics', expectedFeature: 'advanced_analytics' },
      { path: '/api/admin/users', expectedFeature: 'advanced_analytics' },
      { path: '/api/products-public', expectedFeature: 'api_access' },
      { path: '/api/products', expectedFeature: null },
      { path: '/health', expectedFeature: null }
    ];

    testCases.forEach(({ path, expectedFeature }) => {
      it(`should map ${path} to ${expectedFeature || 'no'} feature requirement`, async () => {
        mockRequest = new NextRequest(`http://localhost${path}`);
        mockRequest.cookies.set('session_token', 'valid_session');
        mockRequest.cookies.set('user_id', '123');

        vi.mocked(cache.getUser).mockResolvedValue({
          user_id: 123,
          token: 'valid_token',
          session_token: 'valid_session',
          expires_at: new Date(Date.now() + 3600000).toISOString()
        });

        vi.mocked(stripeClient.checkEntitlement).mockResolvedValue({ allowed: true });

        await middleware(mockRequest);

        if (expectedFeature) {
          expect(vi.mocked(stripeClient.checkEntitlement)).toHaveBeenCalledWith('123', expectedFeature);
        } else {
          expect(vi.mocked(stripeClient.checkEntitlement)).not.toHaveBeenCalled();
        }
      });
    });
  });
});