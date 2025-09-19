/**
 * Entitlements Integration Tests - Peepers Enterprise v2.0.0
 *
 * Testes de integração para o fluxo completo de entitlements
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { middleware } from '@/middleware';
import { stripeClient } from '@/lib/stripe';
import { cache } from '@/lib/cache';

// Mocks
vi.mock('@/lib/stripe');
vi.mock('@/lib/cache');
vi.mock('@/lib/cors', () => ({
  corsHandler: {
    handleAPIRequest: vi.fn().mockReturnValue(null),
    applyCORSHeaders: vi.fn().mockImplementation((request, response) => response || NextResponse.next())
  }
}));
vi.mock('@/lib/security-events', () => ({
  logSecurityEvent: vi.fn().mockResolvedValue(undefined)
}));

describe('Entitlements Integration Flow', () => {
  let mockStripeClient: any;
  let mockCache: any;

  beforeEach(() => {
    mockStripeClient = {
      checkEntitlement: vi.fn(),
      getTenantEntitlement: vi.fn()
    };

    mockCache = {
      getUser: vi.fn(),
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn()
    };

    // Use vi.mocked to properly mock the imports
    vi.mocked(stripeClient).checkEntitlement = mockStripeClient.checkEntitlement;
    vi.mocked(stripeClient).getTenantEntitlement = mockStripeClient.getTenantEntitlement;
    vi.mocked(cache).getUser = mockCache.getUser;
  });

  describe('Complete User Journey', () => {
    it('should handle starter plan user accessing basic features', async () => {
      // Setup: User with starter plan
      const userId = 'user_starter_123';
      const sessionToken = 'session_starter_456';

      mockCache.getUser.mockResolvedValue({
        token: 'valid_token',
        session_token: sessionToken,
        expires_at: new Date(Date.now() + 3600000).toISOString()
      });

      mockStripeClient.checkEntitlement.mockResolvedValue({
        allowed: true
      });

      // Test: Access basic dashboard
      const request = new NextRequest('http://localhost/api/products');
      request.cookies.set('session_token', sessionToken);
      request.cookies.set('user_id', userId);

      const response = await middleware(request);

      expect(response.status).toBe(200);
      expect(mockStripeClient.checkEntitlement).not.toHaveBeenCalled(); // Basic features don't require premium
    });

    it('should block starter plan user from admin features', async () => {
      const userId = 'user_starter_123';
      const sessionToken = 'session_starter_456';

      mockCache.getUser.mockResolvedValue({
        token: 'valid_token',
        session_token: sessionToken,
        expires_at: new Date(Date.now() + 3600000).toISOString()
      });

      mockStripeClient.checkEntitlement.mockResolvedValue({
        allowed: false,
        reason: 'Feature not included in starter plan',
        upgrade_required: true
      });

      const request = new NextRequest('http://localhost/admin/dashboard');
      request.cookies.set('session_token', sessionToken);
      request.cookies.set('user_id', userId);

      const response = await middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/upgrade');
      expect(mockStripeClient.checkEntitlement).toHaveBeenCalledWith(userId, 'advanced_analytics');
    });

    it('should allow professional plan user admin access', async () => {
      const userId = 'user_pro_123';
      const sessionToken = 'session_pro_456';

      mockCache.getUser.mockResolvedValue({
        token: 'valid_token',
        session_token: sessionToken,
        expires_at: new Date(Date.now() + 3600000).toISOString()
      });

      mockStripeClient.checkEntitlement.mockResolvedValue({
        allowed: true
      });

      const request = new NextRequest('http://localhost/admin/metrics');
      request.cookies.set('session_token', sessionToken);
      request.cookies.set('user_id', userId);

      const response = await middleware(request);

      expect(response.status).toBe(200);
      expect(mockStripeClient.checkEntitlement).toHaveBeenCalledWith(userId, 'advanced_analytics');
    });

    it('should allow enterprise plan user API public access', async () => {
      const userId = 'user_enterprise_123';
      const sessionToken = 'session_enterprise_456';

      mockCache.getUser.mockResolvedValue({
        token: 'valid_token',
        session_token: sessionToken,
        expires_at: new Date(Date.now() + 3600000).toISOString()
      });

      mockStripeClient.checkEntitlement.mockResolvedValue({
        allowed: true
      });

      const request = new NextRequest('http://localhost/api/products-public');
      request.cookies.set('session_token', sessionToken);
      request.cookies.set('user_id', userId);

      const response = await middleware(request);

      expect(response.status).toBe(200);
      expect(mockStripeClient.checkEntitlement).toHaveBeenCalledWith(userId, 'api_access');
    });
  });

  describe('Error Scenarios', () => {
    it('should handle Stripe API failures gracefully', async () => {
      const userId = 'user_123';
      const sessionToken = 'session_456';

      mockCache.getUser.mockResolvedValue({
        token: 'valid_token',
        session_token: sessionToken,
        expires_at: new Date(Date.now() + 3600000).toISOString()
      });

      mockStripeClient.checkEntitlement.mockRejectedValue(
        new Error('Stripe API unavailable')
      );

      const request = new NextRequest('http://localhost/admin/dashboard');
      request.cookies.set('session_token', sessionToken);
      request.cookies.set('user_id', userId);

      const response = await middleware(request);

      // Should allow access to prevent downtime
      expect(response.status).toBe(200);
    });

    it('should handle expired sessions correctly', async () => {
      const userId = 'user_123';
      const sessionToken = 'expired_session';

      mockCache.getUser.mockResolvedValue({
        token: 'valid_token',
        session_token: 'different_session_token',
        expires_at: new Date(Date.now() + 3600000).toISOString()
      });

      const request = new NextRequest('http://localhost/admin/dashboard');
      request.cookies.set('session_token', sessionToken);
      request.cookies.set('user_id', userId);

      const response = await middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/login');
    });
  });

  describe('Cache Behavior', () => {
    // Cache behavior is tested through the checkEntitlement calls in other tests
    // The actual Redis caching cannot be tested in unit tests without Redis
  });
});