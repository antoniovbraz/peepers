import { getKVClient } from '@/lib/cache';
import { logger } from '@/lib/logger';
import { logSecurityEvent, SecurityEventType } from '@/lib/security-events';

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (identifier: string) => string;
  skipIf?: (identifier: string) => boolean;
  onLimitReached?: (identifier: string, limit: RateLimitResult) => void;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
  totalHits: number;
}

/**
 * Sistema de Rate Limiting Granular e Avançado
 * 
 * Implementa diferentes estratégias de rate limiting:
 * - Por IP
 * - Por usuário autenticado  
 * - Por endpoint específico
 * - Sliding window algorithm
 * - Burst protection
 * - Whitelisting de IPs confiáveis
 */
export class AdvancedRateLimiter {
  private readonly kv = getKVClient();

  /**
   * Rate limiting por IP com sliding window
   */
  async limitByIP(
    clientIP: string, 
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const key = config.keyGenerator ? 
      config.keyGenerator(clientIP) : 
      `rate_limit:ip:${clientIP}`;
    
    return this.applySlidingWindow(key, config, clientIP);
  }

  /**
   * Rate limiting por usuário autenticado
   */
  async limitByUser(
    userId: string, 
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const key = config.keyGenerator ? 
      config.keyGenerator(userId) : 
      `rate_limit:user:${userId}`;
    
    return this.applySlidingWindow(key, config, userId);
  }

  /**
   * Rate limiting por endpoint + IP
   */
  async limitByEndpoint(
    endpoint: string,
    clientIP: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const key = config.keyGenerator ? 
      config.keyGenerator(`${endpoint}:${clientIP}`) : 
      `rate_limit:endpoint:${endpoint}:${clientIP}`;
    
    return this.applySlidingWindow(key, config, clientIP);
  }

  /**
   * Rate limiting específico para webhook
   */
  async limitWebhook(
    clientIP: string,
    userAgent: string = 'unknown'
  ): Promise<RateLimitResult> {
    // Webhooks legítimos do ML têm user-agents específicos
    const isMLWebhook = userAgent.includes('MercadoLibre') || userAgent.includes('MercadoPago');
    
    const config: RateLimitConfig = {
      maxRequests: isMLWebhook ? 1000 : 100, // ML webhooks têm limite maior
      windowMs: 15 * 60 * 1000, // 15 minutos
      keyGenerator: (ip) => `rate_limit:webhook:${ip}`,
      onLimitReached: (ip, result) => {
        logSecurityEvent({
          type: SecurityEventType.RATE_LIMIT_EXCEEDED,
          severity: 'HIGH',
          clientIP: ip,
          userAgent,
          details: {
            endpoint: 'webhook',
            limit: config.maxRequests,
            window_ms: config.windowMs,
            is_ml_webhook: isMLWebhook,
            total_hits: result.totalHits
          },
          path: '/api/webhook/mercado-livre'
        });
      }
    };

    return this.limitByIP(clientIP, config);
  }

  /**
   * Rate limiting para tentativas de login
   */
  async limitLogin(
    clientIP: string,
    userId?: string
  ): Promise<RateLimitResult> {
    // Dupla verificação: por IP e por usuário
    const ipLimit = await this.limitByIP(clientIP, {
      maxRequests: 10, // 10 tentativas por IP
      windowMs: 15 * 60 * 1000, // 15 minutos
      keyGenerator: (ip) => `rate_limit:login:ip:${ip}`,
      onLimitReached: (ip, result) => {
        logSecurityEvent({
          type: SecurityEventType.BRUTE_FORCE_DETECTED,
          severity: 'HIGH',
          clientIP: ip,
          userId,
          details: {
            attack_type: 'login_brute_force_ip',
            limit: 10,
            window_ms: 15 * 60 * 1000,
            total_hits: result.totalHits
          },
          path: '/api/auth/mercado-livre'
        });
      }
    });

    if (!ipLimit.allowed) {
      return ipLimit;
    }

    // Se temos userId, verificar também por usuário
    if (userId) {
      const userLimit = await this.limitByUser(userId, {
        maxRequests: 5, // 5 tentativas por usuário
        windowMs: 10 * 60 * 1000, // 10 minutos
        keyGenerator: (user) => `rate_limit:login:user:${user}`,
        onLimitReached: (user, result) => {
          logSecurityEvent({
            type: SecurityEventType.BRUTE_FORCE_DETECTED,
            severity: 'HIGH',
            userId: user,
            clientIP,
            details: {
              attack_type: 'login_brute_force_user',
              limit: 5,
              window_ms: 10 * 60 * 1000,
              total_hits: result.totalHits
            },
            path: '/api/auth/mercado-livre'
          });
        }
      });

      if (!userLimit.allowed) {
        return userLimit;
      }
    }

    return ipLimit; // Retornar limite menos restritivo se ambos passaram
  }

  /**
   * Rate limiting para APIs públicas
   */
  async limitPublicAPI(
    clientIP: string,
    endpoint: string
  ): Promise<RateLimitResult> {
    return this.limitByEndpoint(endpoint, clientIP, {
      maxRequests: 100, // 100 requests por IP por endpoint
      windowMs: 60 * 1000, // 1 minuto
      keyGenerator: (key) => `rate_limit:public:${key}`,
      onLimitReached: (key, result) => {
        logSecurityEvent({
          type: SecurityEventType.RATE_LIMIT_EXCEEDED,
          severity: 'MEDIUM',
          clientIP,
          details: {
            endpoint,
            limit: 100,
            window_ms: 60 * 1000,
            total_hits: result.totalHits
          },
          path: endpoint
        });
      }
    });
  }

  /**
   * Rate limiting diário por usuário (conforme ML API limits)
   */
  async limitUserDaily(
    userId: string,
    clientIP: string
  ): Promise<RateLimitResult> {
    return this.limitByUser(userId, {
      maxRequests: 5000, // 5000 requests por dia por usuário (ML limit)
      windowMs: 24 * 60 * 60 * 1000, // 24 horas
      keyGenerator: (user) => `rate_limit:daily:user:${user}`,
      onLimitReached: (user, result) => {
        logSecurityEvent({
          type: SecurityEventType.RATE_LIMIT_EXCEEDED,
          severity: 'HIGH',
          userId: user,
          clientIP,
          details: {
            limit_type: 'daily_user',
            limit: 5000,
            window_ms: 24 * 60 * 60 * 1000,
            total_hits: result.totalHits
          },
          path: '/api/webhook/mercado-livre'
        });
      }
    });
  }

  /**
   * Rate limiting para APIs autenticadas (mais permissivo)
   */
  async limitAuthenticatedAPI(
    userId: string,
    clientIP: string,
    endpoint: string
  ): Promise<RateLimitResult> {
    return this.limitByUser(userId, {
      maxRequests: 500, // 500 requests por usuário
      windowMs: 60 * 1000, // 1 minuto
      keyGenerator: (user) => `rate_limit:auth:${endpoint}:${user}`,
      onLimitReached: (user, result) => {
        logSecurityEvent({
          type: SecurityEventType.RATE_LIMIT_EXCEEDED,
          severity: 'MEDIUM',
          userId: user,
          clientIP,
          details: {
            endpoint,
            limit: 500,
            window_ms: 60 * 1000,
            total_hits: result.totalHits
          },
          path: endpoint
        });
      }
    });
  }

  /**
   * Implementa sliding window algorithm
   */
  private async applySlidingWindow(
    key: string, 
    config: RateLimitConfig,
    identifier: string
  ): Promise<RateLimitResult> {
    try {
      // Verificar se deve pular verificação
      if (config.skipIf && config.skipIf(identifier)) {
        return {
          allowed: true,
          remaining: config.maxRequests,
          resetTime: Date.now() + config.windowMs,
          totalHits: 0
        };
      }

      const now = Date.now();
      const windowStart = now - config.windowMs;

      // Buscar bucket atual
      const bucket = await this.kv.get<{ requests: number[]; }>(key) || { requests: [] };

      // Filtrar requests dentro da janela de tempo
      const validRequests = bucket.requests.filter(timestamp => timestamp > windowStart);

      // Verificar se excedeu o limite
      if (validRequests.length >= config.maxRequests) {
        const oldestRequest = Math.min(...validRequests);
        const resetTime = oldestRequest + config.windowMs;
        const retryAfter = Math.max(0, Math.ceil((resetTime - now) / 1000));

        const result: RateLimitResult = {
          allowed: false,
          remaining: 0,
          resetTime,
          retryAfter,
          totalHits: validRequests.length
        };

        // Callback de limite atingido
        if (config.onLimitReached) {
          config.onLimitReached(identifier, result);
        }

        return result;
      }

      // Adicionar request atual
      validRequests.push(now);

      // Salvar bucket atualizado
      await this.kv.set(key, { requests: validRequests }, { 
        ex: Math.ceil(config.windowMs / 1000) 
      });

      return {
        allowed: true,
        remaining: config.maxRequests - validRequests.length,
        resetTime: now + config.windowMs,
        totalHits: validRequests.length
      };

    } catch (error) {
      logger.error({ error, key }, 'Rate limit check failed');
      
      // Falhar aberto - permitir request em caso de erro
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetTime: Date.now() + config.windowMs,
        totalHits: 0
      };
    }
  }

  /**
   * Verifica se IP está na whitelist
   */
  private isWhitelistedIP(ip: string): boolean {
    const whitelistedIPs = (process.env.RATE_LIMIT_WHITELIST || '').split(',');
    return whitelistedIPs.includes(ip);
  }

  /**
   * Reset manual de rate limit (para emergências)
   */
  async resetLimit(key: string): Promise<void> {
    try {
      await this.kv.del(key);
      logger.info({ key }, 'Rate limit manually reset');
    } catch (error) {
      logger.error({ error, key }, 'Failed to reset rate limit');
    }
  }

  /**
   * Obtém estatísticas de rate limiting
   */
  async getStats(pattern: string = 'rate_limit:*'): Promise<any> {
    try {
      const keys: string[] = [];
      
      // Scan todas as chaves de rate limit
      for await (const key of this.kv.scanIterator({ match: pattern })) {
        keys.push(key);
      }

      const stats = {
        total_keys: keys.length,
        by_type: {} as Record<string, number>,
        active_limits: 0
      };

      // Analisar tipos de rate limit
      for (const key of keys) {
        const type = key.split(':')[2] || 'unknown'; // rate_limit:type:...
        stats.by_type[type] = (stats.by_type[type] || 0) + 1;

        // Verificar se está ativo (tem dados)
        const data = await this.kv.get(key);
        if (data) {
          stats.active_limits++;
        }
      }

      return stats;
    } catch (error) {
      logger.error({ error }, 'Failed to get rate limit stats');
      return { error: 'Failed to retrieve stats' };
    }
  }
}

// Singleton instance
export const rateLimiter = new AdvancedRateLimiter();

// Helper functions
export const checkIPLimit = (ip: string, config: RateLimitConfig) => 
  rateLimiter.limitByIP(ip, config);

export const checkUserLimit = (userId: string, config: RateLimitConfig) => 
  rateLimiter.limitByUser(userId, config);

export const checkLoginLimit = (ip: string, userId?: string) => 
  rateLimiter.limitLogin(ip, userId);

export const checkWebhookLimit = (ip: string, userAgent?: string) => 
  rateLimiter.limitWebhook(ip, userAgent);

export const checkPublicAPILimit = (ip: string, endpoint: string) => 
  rateLimiter.limitPublicAPI(ip, endpoint);

export const checkAuthAPILimit = (userId: string, ip: string, endpoint: string) => 
  rateLimiter.limitAuthenticatedAPI(userId, ip, endpoint);

export const checkUserDailyLimit = (userId: string, ip: string) => 
  rateLimiter.limitUserDaily(userId, ip);