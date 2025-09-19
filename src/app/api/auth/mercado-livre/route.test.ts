import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';

// Mocks
vi.mock('@/lib/cache', () => ({
  getKVClient: vi.fn(() => ({
    set: vi.fn().mockResolvedValue('OK'),
  })),
}));

vi.mock('@/lib/rate-limiter', () => ({
  checkLoginLimit: vi.fn(async () => ({ allowed: true, remaining: 100, resetTime: Date.now() + 60000, totalHits: 1 })),
}));

vi.mock('@/lib/security-events', () => ({
  logSecurityEvent: vi.fn(),
  SecurityEventType: {
    RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  }
}));

vi.mock('@/config/routes', () => ({
  ML_CONFIG: {
    AUTH_URL: 'https://auth.mercadolivre.com.br/authorization',
    SCOPES: 'offline_access read write',
  },
  CACHE_KEYS: {
    PKCE_VERIFIER: (state: string) => `pkce_verifier:${state}`,
  },
  API_ENDPOINTS: {
    AUTH_ML_CALLBACK: '/api/auth/mercado-livre/callback',
  },
}));

describe('OAuth Init (PKCE)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Ensure crypto.subtle.digest is available in test env
    // @ts-expect-error jsdom environment polyfill
    if (!global.crypto?.subtle) {
      // Minimal subtle.digest polyfill for test
      // Not cryptographically secure, good enough to exercise code paths
      // @ts-expect-error polyfill
      global.crypto = {
        getRandomValues: (arr: Uint8Array) => {
          for (let i = 0; i < arr.length; i++) arr[i] = (Math.random() * 256) | 0;
          return arr;
        },
        subtle: {
          digest: async (_algo: string, data: Uint8Array) => {
            // Simple hash imitation: reverse + sum for stable output length
            const out = new Uint8Array(data.length);
            for (let i = 0; i < data.length; i++) out[i] = (data[data.length - 1 - i] + i) % 256;
            return out.buffer;
          },
        },
      } as unknown as Crypto;
    }
  });

  it('redirects to ML with PKCE S256 and stores verifier', async () => {
    // Arrange
    const request = new NextRequest('http://localhost:3000/api/auth/mercado-livre');
    const { getKVClient } = await import('@/lib/cache');
    const kv = getKVClient();
    const setSpy = vi.mocked(kv.set);

    // Act
    const response = await GET(request);

    // Assert
    expect(response.status).toBe(307);
    const location = response.headers.get('location') || '';
    expect(location.startsWith('https://auth.mercadolivre.com.br/authorization?')).toBe(true);
    const url = new URL(location);
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('state')).toBeTruthy();
    expect(url.searchParams.get('scope')).toBe('offline_access read write');

    // Verifier stored with TTL ~10min
    expect(setSpy).toHaveBeenCalled();
    const [key, value, opts] = setSpy.mock.calls[0];
    expect(String(key)).toMatch(/^pkce_verifier:/);
    expect(typeof value).toBe('string');
    expect(opts).toHaveProperty('ex');
  });
});
