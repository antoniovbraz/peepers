/**
 * Testes de Webhook - Mercado Livre
 *
 * Suite completa de testes para validação crítica de webhooks ML:
 * - Validação de assinatura HMAC
 * - Validação de IP whitelist
 * - Timeout enforcement
 * - Rate limiting
 * - Segurança e compliance ML
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock all external dependencies at the top level
vi.mock('@/lib/utils', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 999, resetTime: Date.now() + 3600000 })
}));

vi.mock('@/lib/rate-limiter', () => ({
  rateLimiter: {
    limitWebhook: vi.fn().mockResolvedValue({ allowed: true, remaining: 999, resetTime: Date.now() + 3600000, totalHits: 1 })
  },
  checkWebhookLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 999, resetTime: Date.now() + 3600000, totalHits: 1 })
}));

vi.mock('@/lib/cache', () => ({
  getKVClient: vi.fn(() => ({
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1),
    incr: vi.fn().mockResolvedValue(1),
    expire: vi.fn().mockResolvedValue(1),
    lrange: vi.fn().mockResolvedValue([]),
    lpush: vi.fn().mockResolvedValue(1),
    ltrim: vi.fn().mockResolvedValue('OK')
  }))
}));

vi.mock('@/lib/jobs', () => ({
  enqueueJob: vi.fn().mockResolvedValue('job-id')
}));

vi.mock('@/lib/security-events', () => ({
  logSecurityEvent: vi.fn(),
  SecurityEventType: {
    WEBHOOK_SIGNATURE_INVALID: 'webhook.signature.invalid',
    WEBHOOK_IP_INVALID: 'webhook.ip.invalid'
  }
}));

describe('Webhook Signature Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up environment for testing
    vi.stubEnv('ML_WEBHOOK_SECRET', 'test-webhook-secret-12345');
    vi.stubEnv('NODE_ENV', 'production');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('HMAC Signature Validation', () => {
    it('should validate correct HMAC signature', async () => {
      const { validateWebhookSignature } = await import('@/config/webhook');

      const payload = '{"user_id":12345,"topic":"items","resource":"MLA123456"}';
      const secret = 'test-webhook-secret-12345';

      // Generate expected signature using Web Crypto API
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      const signatureBytes = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(payload)
      );

      const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

      const isValid = await validateWebhookSignature(payload, expectedSignature, secret);
      expect(isValid).toBe(true);
    });

    it('should reject invalid HMAC signature', async () => {
      const { validateWebhookSignature } = await import('@/config/webhook');

      const payload = '{"user_id":12345,"topic":"items","resource":"MLA123456"}';
      const secret = 'test-webhook-secret-12345';
      const invalidSignature = 'invalid-signature-12345';

      const isValid = await validateWebhookSignature(payload, invalidSignature, secret);
      expect(isValid).toBe(false);
    });

    it('should reject signature with wrong secret', async () => {
      const { validateWebhookSignature } = await import('@/config/webhook');

      const payload = '{"user_id":12345,"topic":"items","resource":"MLA123456"}';
      const correctSecret = 'test-webhook-secret-12345';
      const wrongSecret = 'wrong-secret-67890';

      // Generate signature with correct secret
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(correctSecret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      const signatureBytes = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(payload)
      );

      const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

      // Validate with wrong secret
      const isValid = await validateWebhookSignature(payload, signature, wrongSecret);
      expect(isValid).toBe(false);
    });

    it('should handle malformed signature gracefully', async () => {
      const { validateWebhookSignature } = await import('@/config/webhook');

      const payload = '{"user_id":12345,"topic":"items","resource":"MLA123456"}';
      const secret = 'test-webhook-secret-12345';
      const malformedSignature = '!!!invalid!!!base64!!!';

      const isValid = await validateWebhookSignature(payload, malformedSignature, secret);
      expect(isValid).toBe(false);
    });

    it('should handle empty payload', async () => {
      const { validateWebhookSignature } = await import('@/config/webhook');

      const payload = '';
      const secret = 'test-webhook-secret-12345';

      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      const signatureBytes = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(payload)
      );

      const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

      const isValid = await validateWebhookSignature(payload, expectedSignature, secret);
      expect(isValid).toBe(true);
    });
  });

  describe('Webhook Handler Integration', () => {
    it('should accept valid webhook with HMAC signature', async () => {
      // Import the handler
      const { POST } = await import('@/app/api/webhook/mercado-livre/route');

      const payload = '{"user_id":12345,"topic":"items","resource":"MLA123456","application_id":"123","attempts":1,"sent":"2025-01-01T00:00:00Z","received":"2025-01-01T00:00:01Z"}';
      const secret = 'test-webhook-secret-12345';

      // Generate valid signature
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      const signatureBytes = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(payload)
      );

      const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

      // Create request with valid ML IP and signature
      const request = new NextRequest('http://localhost:3000/api/webhook/mercado-livre', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '54.88.218.97', // Valid ML IP
          'x-ml-webhook-signature': signature,
          'user-agent': 'MercadoLibre-Webhook/1.0'
        },
        body: payload
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.received).toBe(true);
    });

    it('should reject webhook with invalid HMAC signature', async () => {
      const { POST } = await import('@/app/api/webhook/mercado-livre/route');

      const payload = '{"user_id":12345,"topic":"items","resource":"MLA123456","application_id":"123","attempts":1,"sent":"2025-01-01T00:00:00Z","received":"2025-01-01T00:00:01Z"}';

      const request = new NextRequest('http://localhost:3000/api/webhook/mercado-livre', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '54.88.218.97', // Valid ML IP
          'x-ml-webhook-signature': 'invalid-signature-12345',
          'user-agent': 'MercadoLibre-Webhook/1.0'
        },
        body: payload
      });

      const response = await POST(request);
      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should accept webhook with header secret (backwards compatibility)', async () => {
      const { POST } = await import('@/app/api/webhook/mercado-livre/route');

      const payload = '{"user_id":12345,"topic":"items","resource":"MLA123456","application_id":"123","attempts":1,"sent":"2025-01-01T00:00:00Z","received":"2025-01-01T00:00:01Z"}';

      const request = new NextRequest('http://localhost:3000/api/webhook/mercado-livre', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '54.88.218.97', // Valid ML IP
          'x-ml-webhook-secret': 'test-webhook-secret-12345', // Direct secret
          'user-agent': 'MercadoLibre-Webhook/1.0'
        },
        body: payload
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.received).toBe(true);
    });

    it('should reject webhook without any authentication', async () => {
      const { POST } = await import('@/app/api/webhook/mercado-livre/route');

      const payload = '{"user_id":12345,"topic":"items","resource":"MLA123456","application_id":"123","attempts":1,"sent":"2025-01-01T00:00:00Z","received":"2025-01-01T00:00:01Z"}';

      const request = new NextRequest('http://localhost:3000/api/webhook/mercado-livre', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '54.88.218.97', // Valid ML IP
          'user-agent': 'MercadoLibre-Webhook/1.0'
        },
        body: payload
      });

      const response = await POST(request);
      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('IP Whitelist Validation', () => {
    it('should accept requests from valid ML IPs', async () => {
      const { POST } = await import('@/app/api/webhook/mercado-livre/route');

      const payload = '{"user_id":12345,"topic":"items","resource":"MLA123456","application_id":"123","attempts":1,"sent":"2025-01-01T00:00:00Z","received":"2025-01-01T00:00:01Z"}';

      // Test each valid ML IP
      const validIPs = ['54.88.218.97', '18.215.140.160', '18.213.114.129', '18.206.34.84'];

      for (const ip of validIPs) {
        const request = new NextRequest('http://localhost:3000/api/webhook/mercado-livre', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-forwarded-for': ip,
            'x-ml-webhook-secret': 'test-webhook-secret-12345',
            'user-agent': 'MercadoLibre-Webhook/1.0'
          },
          body: payload
        });

        const response = await POST(request);
        expect(response.status).toBe(200);
      }
    });

    it('should reject requests from invalid IPs in production', async () => {
      const { POST } = await import('@/app/api/webhook/mercado-livre/route');

      const payload = '{"user_id":12345,"topic":"items","resource":"MLA123456","application_id":"123","attempts":1,"sent":"2025-01-01T00:00:00Z","received":"2025-01-01T00:00:01Z"}';

      const request = new NextRequest('http://localhost:3000/api/webhook/mercado-livre', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '192.168.1.100', // Invalid IP
          'x-ml-webhook-secret': 'test-webhook-secret-12345',
          'user-agent': 'MercadoLibre-Webhook/1.0'
        },
        body: payload
      });

      const response = await POST(request);
      expect(response.status).toBe(403);

      const data = await response.json();
      expect(data.error).toBe('Unauthorized IP');
      expect(data.ml_compliance).toBe('ip_validation_failed');
    });
  });

  describe('Timeout Enforcement', () => {
    it('should respond within 500ms timeout', async () => {
      const { POST } = await import('@/app/api/webhook/mercado-livre/route');

      const payload = '{"user_id":12345,"topic":"items","resource":"MLA123456","application_id":"123","attempts":1,"sent":"2025-01-01T00:00:00Z","received":"2025-01-01T00:00:01Z"}';

      const startTime = Date.now();

      const request = new NextRequest('http://localhost:3000/api/webhook/mercado-livre', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '54.88.218.97',
          'x-ml-webhook-secret': 'test-webhook-secret-12345',
          'user-agent': 'MercadoLibre-Webhook/1.0'
        },
        body: payload
      });

      const response = await POST(request);
      const processingTime = Date.now() - startTime;

      expect(processingTime).toBeLessThan(500);
      expect(response.status).toBe(200);
    });
  });

  describe('Rate Limiting', () => {
    it('should apply webhook rate limiting', async () => {
      const { checkRateLimit } = await import('@/lib/utils');

      // Mock rate limiter to reject requests
      vi.mocked(checkRateLimit).mockResolvedValueOnce({
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 3600000
      });

      const { POST } = await import('@/app/api/webhook/mercado-livre/route');

      const payload = '{"user_id":12345,"topic":"items","resource":"MLA123456","application_id":"123","attempts":1,"sent":"2025-01-01T00:00:00Z","received":"2025-01-01T00:00:01Z"}';

      const request = new NextRequest('http://localhost:3000/api/webhook/mercado-livre', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '54.88.218.97',
          'x-ml-webhook-secret': 'test-webhook-secret-12345',
          'user-agent': 'MercadoLibre-Webhook/1.0'
        },
        body: payload
      });

      const response = await POST(request);
      expect(response.status).toBe(429);
    });
  });
});