import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';

// Mock dependencies
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/utils', () => ({
  checkRateLimit: vi.fn(),
}));

describe('Webhook Mercado Livre', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/webhook/mercado-livre', () => {
    it('should reject requests without webhook secret', async () => {
      // Set environment variable for test
      process.env.ML_WEBHOOK_SECRET = 'test-secret';

      const { checkRateLimit } = await import('@/lib/utils');
      vi.mocked(checkRateLimit).mockResolvedValue({
        allowed: true,
        remaining: 999,
        resetTime: Date.now() + 900000,
      });

      const request = new NextRequest('http://localhost:3000/api/webhook/mercado-livre', {
        method: 'POST',
        body: JSON.stringify({
          user_id: 123,
          topic: 'items',
          resource: '/items/123',
          application_id: 'app123',
          attempts: 1,
          sent: new Date().toISOString(),
          received: new Date().toISOString(),
        }),
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(401);
      expect(result.error).toBe('Unauthorized');
    });

    it('should reject invalid webhook payload', async () => {
      // Set environment variable for test
      process.env.ML_WEBHOOK_SECRET = 'valid-secret';

      const { checkRateLimit } = await import('@/lib/utils');
      vi.mocked(checkRateLimit).mockResolvedValue({
        allowed: true,
        remaining: 999,
        resetTime: Date.now() + 900000,
      });

      const request = new NextRequest('http://localhost:3000/api/webhook/mercado-livre', {
        method: 'POST',
        headers: {
          'x-ml-webhook-secret': 'valid-secret',
        },
        body: JSON.stringify({
          invalid_field: 'invalid',
        }),
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toBe('Invalid payload schema');
    });

    it('should accept valid webhook payload', async () => {
      const { checkRateLimit } = await import('@/lib/utils');
      vi.mocked(checkRateLimit).mockResolvedValue({
        allowed: true,
        remaining: 999,
        resetTime: Date.now() + 900000,
      });

      const validPayload = {
        user_id: 123,
        topic: 'items',
        resource: '/items/123',
        application_id: 'app123',
        attempts: 1,
        sent: new Date().toISOString(),
        received: new Date().toISOString(),
      };

      const request = new NextRequest('http://localhost:3000/api/webhook/mercado-livre', {
        method: 'POST',
        headers: {
          'x-ml-webhook-secret': process.env.ML_WEBHOOK_SECRET || 'test-secret',
        },
        body: JSON.stringify(validPayload),
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.topic).toBe('items');
    });

    it('should handle rate limiting', async () => {
      const { checkRateLimit } = await import('@/lib/utils');
      vi.mocked(checkRateLimit).mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 900000,
      });

      const request = new NextRequest('http://localhost:3000/api/webhook/mercado-livre', {
        method: 'POST',
        headers: {
          'x-ml-webhook-secret': 'valid-secret',
        },
        body: JSON.stringify({
          user_id: 123,
          topic: 'items',
          resource: '/items/123',
          application_id: 'app123',
          attempts: 1,
          sent: new Date().toISOString(),
          received: new Date().toISOString(),
        }),
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(429);
      expect(result.error).toBe('Too many requests');
      expect(response.headers.get('Retry-After')).toBeDefined();
    });

    it('should handle malformed JSON', async () => {
      // Set environment variable for test
      process.env.ML_WEBHOOK_SECRET = 'valid-secret';

      const { checkRateLimit } = await import('@/lib/utils');
      vi.mocked(checkRateLimit).mockResolvedValue({
        allowed: true,
        remaining: 999,
        resetTime: Date.now() + 900000,
      });

      const request = new NextRequest('http://localhost:3000/api/webhook/mercado-livre', {
        method: 'POST',
        headers: {
          'x-ml-webhook-secret': 'valid-secret',
        },
        body: 'invalid json',
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toBe('Invalid JSON payload');
    });
  });
});