import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';

// Mock dependencies
vi.mock('@/lib/cache', () => ({
  getKVClient: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  })),
  cache: {
    setUser: vi.fn(),
    getUser: vi.fn(),
  },
}));

vi.mock('@/config/routes', () => ({
  ML_CONFIG: {
    TOKEN_URL: 'https://api.mercadolibre.com/oauth/token',
    USER_ME: 'https://api.mercadolibre.com/users/me',
  },
  CACHE_KEYS: {
    PKCE_VERIFIER: (state: string) => `pkce:${state}`,
  },
  API_ENDPOINTS: {
    AUTH_ML_CALLBACK: '/api/auth/mercado-livre/callback',
  },
  PAGES: {
    ADMIN: '/admin',
  },
}));

vi.mock('@/lib/rate-limiter', () => ({
  checkLoginLimit: vi.fn(() => Promise.resolve({ allowed: true, remaining: 9, resetTime: Date.now() + 900000, totalHits: 1 })),
}));

// Mock fetch
global.fetch = vi.fn();

describe('OAuth Callback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/auth/mercado-livre/callback', () => {
    it('should reject requests without code parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/mercado-livre/callback?state=valid-state');

      const response = await GET(request);
      expect(response.status).toBe(307); // Temporary Redirect
      expect(response.headers.get('location')).toContain('auth_error=missing_params');
    });

    it('should reject requests without state parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/mercado-livre/callback?code=valid-code');

      const response = await GET(request);
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('auth_error=missing_params');
    });

    it('should reject requests with invalid state', async () => {
      const { getKVClient } = await import('@/lib/cache');
      const mockKV = {
        get: vi.fn().mockResolvedValue(null), // No stored verifier
        set: vi.fn(),
        del: vi.fn(),
      };
      vi.mocked(getKVClient).mockReturnValue(mockKV as unknown as ReturnType<typeof getKVClient>);

      const request = new NextRequest('http://localhost:3000/api/auth/mercado-livre/callback?code=valid-code&state=invalid-state');

      const response = await GET(request);
      expect(response.status).toBe(307);
    });

    it('should reject requests with malformed state', async () => {
      // Set environment variables for test
      process.env.ML_CLIENT_ID = 'test-client-id';
      process.env.ML_CLIENT_SECRET = 'test-client-secret';

      const request = new NextRequest('http://localhost:3000/api/auth/mercado-livre/callback?code=valid-code&state=invalid@state!');

      const response = await GET(request);
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('auth_error=invalid_state'); // State not in cache, so invalid_state
    });

    it('should handle successful OAuth flow', async () => {
      // Set environment variables for test
      process.env.ML_CLIENT_ID = 'test-client-id';
      process.env.ML_CLIENT_SECRET = 'test-client-secret';

      const { getKVClient, cache } = await import('@/lib/cache');
      const mockKV = {
        get: vi.fn().mockResolvedValue('valid-verifier'),
        set: vi.fn(),
        del: vi.fn(),
      };
      vi.mocked(getKVClient).mockReturnValue(mockKV as unknown as ReturnType<typeof getKVClient>);
      vi.mocked(cache.setUser).mockResolvedValue(undefined);
      vi.mocked(cache.getUser).mockResolvedValue({
        user_id: 123,
        token: 'access-token',
        session_token: 'session-token',
      });

      // Mock successful token exchange
      vi.mocked(global.fetch).mockImplementation((url) => {
        if (url === 'https://api.mercadolibre.com/oauth/token') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              access_token: 'access-token',
              refresh_token: 'refresh-token',
              expires_in: 21600,
              scope: 'read write',
              token_type: 'Bearer',
            }),
          } as Response);
        }
        if (url === 'https://api.mercadolibre.com/users/me') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              id: 123,
              nickname: 'testuser',
              first_name: 'Test',
              last_name: 'User',
              email: 'test@example.com',
              country_id: 'BR',
              user_type: 'normal',
              site_id: 'MLB',
            }),
          } as Response);
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      const request = new NextRequest('http://localhost:3000/api/auth/mercado-livre/callback?code=valid-code&state=valid-state-with-at-least-32-characters123456789');

      const response = await GET(request);
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/admin?auth_success=true');

      // Check if secure cookies are set
      const setCookieHeader = response.headers.get('set-cookie');
      expect(setCookieHeader).toContain('session_token=');
      expect(setCookieHeader).toContain('HttpOnly');
  expect(setCookieHeader).toContain('SameSite=lax');
    });

    it('should handle token exchange failure', async () => {
      // Set environment variables for test
      process.env.ML_CLIENT_ID = 'test-client-id';
      process.env.ML_CLIENT_SECRET = 'test-client-secret';

      const { getKVClient } = await import('@/lib/cache');
      const mockKV = {
        get: vi.fn().mockResolvedValue('valid-verifier'),
        set: vi.fn(),
        del: vi.fn(),
      };
      vi.mocked(getKVClient).mockReturnValue(mockKV as unknown as ReturnType<typeof getKVClient>);

      // Mock failed token exchange
      vi.mocked(global.fetch).mockImplementation((url) => {
        if (url === 'https://api.mercadolibre.com/oauth/token') {
          return Promise.resolve({
            ok: false,
            text: () => Promise.resolve('Invalid code'),
          } as Response);
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      const request = new NextRequest('http://localhost:3000/api/auth/mercado-livre/callback?code=invalid-code&state=valid-state-with-at-least-32-characters123456789');

      const response = await GET(request);
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('auth_error=token_exchange_failed');
    });
  });
});