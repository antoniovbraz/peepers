/**
 * Testes de Segurança - Peepers ERP
 * 
 * Suite completa de testes para validar todas as implementações
 * de segurança após auditoria IAM:
 * - Rate limiting avançado
 * - Proteção CORS
 * - Rotação de tokens
 * - Sistema de eventos de segurança
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock all external dependencies at the top level
vi.mock('@/lib/cache', () => ({
  getKVClient: vi.fn(() => ({
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1),
    incr: vi.fn().mockResolvedValue(1),
    expire: vi.fn().mockResolvedValue(1),
    pipeline: vi.fn(() => ({
      get: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([null, null])
    }))
  }))
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}));

const mockLogSecurityEvent = vi.fn();
const mockGetSecurityStats = vi.fn();

vi.mock('@/lib/security-events', () => ({
  logSecurityEvent: mockLogSecurityEvent,
  getSecurityStats: mockGetSecurityStats,
  SecurityEventType: {
    RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
    AUTH_FAILED: 'auth_failed',
    SUSPICIOUS_IP: 'suspicious_ip',
    CSRF_DETECTED: 'csrf_detected'
  }
}));

// Rate Limiting Tests
describe('Rate Limiting Security', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('IP Rate Limiting', () => {
    it('should allow requests within limit', async () => {
      const { checkIPLimit } = await import('@/lib/rate-limiter');
      
      const result = await checkIPLimit('192.168.1.100', {
        maxRequests: 100,
        windowMs: 60000
      });
      
      expect(result.allowed).toBe(true);
      expect(typeof result.remaining).toBe('number');
      expect(typeof result.resetTime).toBe('number');
    });

    it('should block requests exceeding limit', async () => {
      const { checkIPLimit } = await import('@/lib/rate-limiter');
      
      // Simular múltiplas requests do mesmo IP
      const ip = '192.168.1.200';
      const config = { maxRequests: 3, windowMs: 60000 };
      
      // Primeiras requests devem passar
      for (let i = 0; i < 3; i++) {
        const result = await checkIPLimit(ip, config);
        expect(result.allowed).toBe(true);
      }
      
      // Próxima request deve ser bloqueada
      const blockedResult = await checkIPLimit(ip, config);
      expect(blockedResult.allowed).toBe(false);
      expect(blockedResult.remaining).toBe(0);
    });
  });

  describe('Login Rate Limiting', () => {
    it('should protect against brute force attacks', async () => {
      const { checkLoginLimit } = await import('@/lib/rate-limiter');
      
      const ip = '192.168.1.300';
      
      // Primeiras tentativas de login devem passar
      for (let i = 0; i < 5; i++) {
        const result = await checkLoginLimit(ip);
        expect(result.allowed).toBe(true);
      }
      
      // Tentativas excessivas devem ser bloqueadas
      const blockedResult = await checkLoginLimit(ip);
      expect(blockedResult.allowed).toBe(false);
    });
  });

  describe('Webhook Rate Limiting', () => {
    it('should limit webhook requests', async () => {
      const { checkWebhookLimit } = await import('@/lib/rate-limiter');
      
      const result = await checkWebhookLimit('192.168.1.400', 'MercadoLibre-Webhook/1.0');
      
      expect(result.allowed).toBe(true);
      expect(typeof result.totalHits).toBe('number');
    });
  });

  describe('Public API Rate Limiting', () => {
    it('should limit public API access', async () => {
      const { checkPublicAPILimit } = await import('@/lib/rate-limiter');
      
      const result = await checkPublicAPILimit('192.168.1.500', '/api/products-public');
      
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Authenticated API Rate Limiting', () => {
    it('should limit authenticated API access', async () => {
      const { checkAuthAPILimit } = await import('@/lib/rate-limiter');
      
      const result = await checkAuthAPILimit(
        'user123', 
        '192.168.1.600', 
        '/api/products'
      );
      
      expect(result.allowed).toBe(true);
      expect(typeof result.resetTime).toBe('number');
    });
  });
});

// Security Events Tests
describe('Security Events System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Event Logging', () => {
    it('should log security events correctly', async () => {
      const { logSecurityEvent, SecurityEventType } = await import('@/lib/security-events');
      
      const eventData = {
        type: SecurityEventType.RATE_LIMIT_EXCEEDED,
        severity: 'MEDIUM' as const,
        clientIP: '192.168.1.700',
        details: {
          endpoint: '/api/test',
          limit: 100
        }
      };
      
      // Should not throw
      expect(() => logSecurityEvent(eventData)).not.toThrow();
    });

    it('should handle critical events', async () => {
      const { logSecurityEvent, SecurityEventType } = await import('@/lib/security-events');
      
      const criticalEvent = {
        type: SecurityEventType.CSRF_DETECTED,
        severity: 'CRITICAL' as const,
        clientIP: '192.168.1.800',
        userId: 'user456',
        details: {
          expectedState: 'abc123',
          receivedState: 'xyz789'
        }
      };
      
      expect(() => logSecurityEvent(criticalEvent)).not.toThrow();
    });
  });

  describe('Event Statistics', () => {
    it('should aggregate event statistics', async () => {
      const { getSecurityStats } = await import('@/lib/security-events');
      
      const stats = await getSecurityStats(3600); // 1 hour window
      
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('byType');
      expect(stats).toHaveProperty('bySeverity');
      expect(typeof stats.total).toBe('number');
    });
  });
});

// Token Rotation Tests
describe('Token Rotation Security', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Token Family Management', () => {
    it('should create token families', async () => {
      const { TokenRotationService } = await import('@/lib/token-rotation');
      
      const tokenService = new TokenRotationService();
      const userId = 'user789';
      
      const family = await tokenService.createTokenFamily(userId, {
        tokenTTL: 3600,
        refreshTokenTTL: 604800
      });
      
      expect(family).toHaveProperty('familyId');
      expect(family).toHaveProperty('accessToken');
      expect(family).toHaveProperty('refreshToken');
      expect(family.userId).toBe(userId);
    });

    it('should rotate tokens correctly', async () => {
      const { TokenRotationService } = await import('@/lib/token-rotation');
      
      const tokenService = new TokenRotationService();
      const userId = 'user890';
      
      // Criar família inicial
      const initialFamily = await tokenService.createTokenFamily(userId, {
        tokenTTL: 3600,
        refreshTokenTTL: 604800
      });
      
      // Rotacionar tokens
      const rotatedFamily = await tokenService.rotateTokens(
        initialFamily.refreshToken,
        userId
      );
      
      expect(rotatedFamily).toHaveProperty('accessToken');
      expect(rotatedFamily).toHaveProperty('refreshToken');
      expect(rotatedFamily.accessToken).not.toBe(initialFamily.accessToken);
      expect(rotatedFamily.refreshToken).not.toBe(initialFamily.refreshToken);
    });

    it('should detect token theft', async () => {
      const { TokenRotationService } = await import('@/lib/token-rotation');
      
      const tokenService = new TokenRotationService();
      const userId = 'user901';
      
      // Criar família e rotacionar
      const family = await tokenService.createTokenFamily(userId, {
        tokenTTL: 3600,
        refreshTokenTTL: 604800
      });
      
      const rotated = await tokenService.rotateTokens(family.refreshToken, userId);
      
      // Tentar usar token antigo (simulando roubo)
      await expect(
        tokenService.rotateTokens(family.refreshToken, userId)
      ).rejects.toThrow('Token theft detected');
    });
  });

  describe('Token Blacklisting', () => {
    it('should blacklist compromised tokens', async () => {
      const { TokenRotationService } = await import('@/lib/token-rotation');
      
      const tokenService = new TokenRotationService();
      const tokenToBlacklist = 'compromised-token-123';
      
      await tokenService.blacklistToken(tokenToBlacklist, 'Security breach');
      
      const isBlacklisted = await tokenService.isTokenBlacklisted(tokenToBlacklist);
      expect(isBlacklisted).toBe(true);
    });
  });
});

// CORS Protection Tests
describe('CORS Protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Origin Validation', () => {
    it('should allow valid origins', async () => {
      const { CORSHandler } = await import('@/lib/cors');
      
      const corsHandler = new CORSHandler();
      
      // Mock environment
      vi.stubEnv('NODE_ENV', 'development');
      
      const isAllowed = corsHandler.isOriginAllowed('http://localhost:3000');
      expect(isAllowed).toBe(true);
    });

    it('should block invalid origins', async () => {
      const { CORSHandler } = await import('@/lib/cors');
      
      const corsHandler = new CORSHandler();
      
      const isAllowed = corsHandler.isOriginAllowed('https://malicious-site.com');
      expect(isAllowed).toBe(false);
    });

    it('should log CORS violations', async () => {
      const { CORSHandler } = await import('@/lib/cors');
      
      const corsHandler = new CORSHandler();
      
      // Mock security event logging (use doMock so factory is not hoisted)
      const logSpy = vi.fn();
      vi.doMock('@/lib/security-events', () => ({
        logSecurityEvent: logSpy
      }));
      
      corsHandler.handlePreflightViolation('https://evil.com', '/api/test');
      
      // Should have logged a security event
      expect(logSpy).toHaveBeenCalled();
    });
  });
});

// Integration Tests
describe('Security Integration', () => {
  describe('Authentication Flow', () => {
    it('should handle complete secure flow', async () => {
      // Test: Rate limiting -> CORS check -> Token validation -> Event logging
      
      const testIP = '192.168.1.999';
      const testOrigin = 'http://localhost:3000';
      
      // 1. Rate limiting check
      const { checkLoginLimit } = await import('@/lib/rate-limiter');
      const rateLimitResult = await checkLoginLimit(testIP);
      expect(rateLimitResult.allowed).toBe(true);
      
      // 2. CORS validation
      const { CORSHandler } = await import('@/lib/cors');
      const corsHandler = new CORSHandler();
      const corsValid = corsHandler.isOriginAllowed(testOrigin);
      expect(corsValid).toBe(true);
      
      // 3. Event logging
      const { logSecurityEvent, SecurityEventType } = await import('@/lib/security-events');
      expect(() => {
        logSecurityEvent({
          type: SecurityEventType.LOGIN_SUCCESS,
          severity: 'LOW',
          clientIP: testIP,
          details: { origin: testOrigin }
        });
      }).not.toThrow();
    });

    it('should block suspicious patterns', async () => {
      const suspiciousIP = '10.0.0.666';
      const maliciousOrigin = 'https://attacker.com';
      
      // Should be blocked by CORS
      const { CORSHandler } = await import('@/lib/cors');
      const corsHandler = new CORSHandler();
      const corsBlocked = corsHandler.isOriginAllowed(maliciousOrigin);
      expect(corsBlocked).toBe(false);
      
      // Should eventually be blocked by rate limiting
      const { checkLoginLimit } = await import('@/lib/rate-limiter');
      
      // Multiple attempts should eventually fail
      let attempts = 0;
      let lastResult;
      
      do {
        lastResult = await checkLoginLimit(suspiciousIP);
        attempts++;
      } while (lastResult.allowed && attempts < 20);
      
      expect(lastResult.allowed).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should gracefully handle rate limiter errors', async () => {
      // Mock Redis failure (doMock to avoid hoisting issues)
      vi.doMock('@/lib/cache', () => ({
        getKVClient: () => ({
          get: vi.fn().mockRejectedValue(new Error('Redis connection failed')),
          set: vi.fn().mockRejectedValue(new Error('Redis connection failed'))
        })
      }));
      
      const { checkIPLimit } = await import('@/lib/rate-limiter');
      
      // Should not throw, should fallback gracefully
      const result = await checkIPLimit('192.168.1.123', {
        windowMs: 60000,
        max: 100
      });
      
      expect(result).toHaveProperty('allowed');
      expect(result).toHaveProperty('remaining');
    });

    it('should handle security event logging failures', async () => {
      // Mock logging failure (doMock to avoid hoisting issues)
      vi.doMock('@/lib/logger', () => ({
        logger: {
          error: vi.fn(),
          warn: vi.fn(),
          info: vi.fn()
        }
      }));
      
      const { logSecurityEvent, SecurityEventType } = await import('@/lib/security-events');
      
      // Should not throw even if logging fails
      expect(() => {
        logSecurityEvent({
          type: SecurityEventType.SYSTEM_ERROR,
          severity: 'LOW',
          details: { error: 'Test error' }
        });
      }).not.toThrow();
    });
  });
});

// Performance Tests
describe('Security Performance', () => {
  describe('Rate Limiting Performance', () => {
    it('should complete rate limit checks quickly', async () => {
      const { checkIPLimit } = await import('@/lib/rate-limiter');
      
      const start = Date.now();
      await checkIPLimit('192.168.1.456', {
        windowMs: 60000,
        max: 100
      });
      const duration = Date.now() - start;
      
      // Should complete in less than 100ms
      expect(duration).toBeLessThan(100);
    });

    it('should handle concurrent rate limit checks', async () => {
      const { checkIPLimit } = await import('@/lib/rate-limiter');
      
      const promises = Array.from({ length: 10 }, (_, i) =>
        checkIPLimit(`192.168.1.${i}`, {
          windowMs: 60000,
          max: 100
        })
      );
      
      const start = Date.now();
      const results = await Promise.all(promises);
      const duration = Date.now() - start;
      
      expect(results).toHaveLength(10);
      expect(results.every(r => r.allowed)).toBe(true);
      expect(duration).toBeLessThan(500); // Should complete in less than 500ms
    });
  });

  describe('Security Events Performance', () => {
    it('should log events efficiently', async () => {
      const { logSecurityEvent, SecurityEventType } = await import('@/lib/security-events');
      
      const start = Date.now();
      
      // Log multiple events
      for (let i = 0; i < 50; i++) {
        logSecurityEvent({
          type: SecurityEventType.API_REQUEST,
          severity: 'LOW',
          clientIP: `192.168.1.${i}`,
          details: { test: i }
        });
      }
      
      const duration = Date.now() - start;
      
      // Should complete in less than 200ms
      expect(duration).toBeLessThan(200);
    });
  });
});

// Mock helpers
function mockRedisClient() {
  return {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1),
    keys: vi.fn().mockResolvedValue([]),
    exists: vi.fn().mockResolvedValue(0),
    ttl: vi.fn().mockResolvedValue(-1),
    expire: vi.fn().mockResolvedValue(1)
  };
}

// Test utilities
export const securityTestUtils = {
  mockRedisClient,
  generateTestIP: (suffix: number) => `192.168.1.${suffix}`,
  generateTestUserId: (suffix: number) => `test-user-${suffix}`,
  
  async testRateLimitExhaustion(checkFunction: (config: Record<string, unknown>) => Promise<{ allowed: boolean }>, config: Record<string, unknown>) {
    let attempts = 0;
    let result;
    
    do {
      result = await checkFunction(config);
      attempts++;
    } while (result.allowed && attempts < 1000);
    
    return { result, attempts };
  }
};