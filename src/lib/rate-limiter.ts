import { getKVClient } from '@/lib/cache';
import { logger } from '@/lib/logger';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
  totalHits: number;
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (identifier: string) => string;
}

export const ML_RATE_LIMITS = {
  APP_HOURLY: {
    maxRequests: 1000,
    windowMs: 60 * 60 * 1000,
    keyGenerator: () => 'ml_rate_limit:app:global'
  },
  USER_DAILY: {
    maxRequests: 5000,
    windowMs: 24 * 60 * 60 * 1000,
    keyGenerator: (userId: string) => `ml_rate_limit:user:${userId}:daily`
  },
  WEBHOOK_HOURLY: {
    maxRequests: 2000,
    windowMs: 60 * 60 * 1000,
    keyGenerator: (ip: string) => `ml_rate_limit:webhook:${ip}:hourly`
  }
} as const;

type KVLike = {
  get: (key: string) => Promise<string | number | null>;
  set: (key: string, value: string) => Promise<unknown>;
  // Optional capabilities depending on provider
  scan?: (cursor: number, opts: { match?: string; count?: number }) => Promise<{ cursor?: number; keys?: string[] }>;
  keys?: (pattern: string) => Promise<string[]>;
  del?: (...keys: string[]) => Promise<unknown>;
};

export class AdvancedRateLimiter {
  // Do NOT call getKVClient eagerly at module load time. Some tests mock parts of the
  // environment and may not provide UPSTASH env vars. Access KV lazily inside methods.
  private getKV(): KVLike | null {
    try {
      return getKVClient() as unknown as KVLike;
    } catch {
      return null;
    }
  }

  // Generic IP limiter
  async limitByIP(clientIP: string, config: { maxRequests: number; windowMs: number; keyGenerator?: (ip: string) => string }): Promise<RateLimitResult> {
    const key = config.keyGenerator ? config.keyGenerator(clientIP) : `rate_limit:ip:${clientIP}`;
    return this.applySlidingWindow(key, { maxRequests: config.maxRequests, windowMs: config.windowMs, keyGenerator: () => key });
  }

  // Generic user limiter
  async limitByUser(userId: string, config: { maxRequests: number; windowMs: number; keyGenerator?: (id: string) => string }): Promise<RateLimitResult> {
    const key = config.keyGenerator ? config.keyGenerator(userId) : `rate_limit:user:${userId}`;
    return this.applySlidingWindow(key, { maxRequests: config.maxRequests, windowMs: config.windowMs, keyGenerator: () => key });
  }

  async limitWebhook(clientIP: string, userAgent: string = 'unknown'): Promise<RateLimitResult> {
    const isMLWebhook = userAgent.includes('MercadoLibre') || userAgent.includes('MercadoPago');
    
    const config = isMLWebhook ? ML_RATE_LIMITS.WEBHOOK_HOURLY : {
      maxRequests: 100,
      windowMs: 15 * 60 * 1000,
      keyGenerator: (ip: string) => `rate_limit:webhook_unknown:${ip}`
    };
    
    const key = config.keyGenerator(clientIP);
    return this.applySlidingWindow(key, config);
  }

  async limitMLUserDaily(userId: string): Promise<RateLimitResult> {
    const config = ML_RATE_LIMITS.USER_DAILY;
    const key = config.keyGenerator(userId);
    return this.applySlidingWindow(key, config);
  }

  async limitMLAppHourly(): Promise<RateLimitResult> {
    const config = ML_RATE_LIMITS.APP_HOURLY;
    const key = config.keyGenerator();
    return this.applySlidingWindow(key, config);
  }

  // Login rate limiting (IP + optional user)
  async limitLogin(clientIP: string, userId?: string): Promise<RateLimitResult> {
    // Check IP first
    const ipResult = await this.limitByIP(clientIP, { maxRequests: 10, windowMs: 15 * 60 * 1000, keyGenerator: (ip) => `rate_limit:login:ip:${ip}` });
    if (!ipResult.allowed) return ipResult;

    if (userId) {
      const userResult = await this.limitByUser(userId, { maxRequests: 5, windowMs: 10 * 60 * 1000, keyGenerator: (id) => `rate_limit:login:user:${id}` });
      if (!userResult.allowed) return userResult;
    }

    return ipResult;
  }

  // Public API limit helper (per endpoint + IP)
  async limitPublicAPI(clientIP: string, endpoint: string): Promise<RateLimitResult> {
    const key = `rate_limit:public:${endpoint}:${clientIP}`;
    return this.applySlidingWindow(key, { maxRequests: 100, windowMs: 60 * 1000, keyGenerator: () => key });
  }

  // Authenticated API limit helper
  async limitAuthAPI(clientIP: string, userId?: string): Promise<RateLimitResult> {
    // Prefer per-user daily limit when available
    if (userId) return this.limitMLUserDaily(userId);
    return this.limitByIP(clientIP, { maxRequests: 500, windowMs: 60 * 60 * 1000, keyGenerator: (ip) => `rate_limit:auth:ip:${ip}` });
  }

  private async applySlidingWindow(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const now = Date.now();
    
    try {
      const counterKey = `${key}:count`;
      const lastResetKey = `${key}:reset`;
      const kv = this.getKV();

      const [countRes, lastResetRes] = kv ? await Promise.all([
        kv.get(counterKey),
        kv.get(lastResetKey)
      ]) : ['0', '0'];

      const currentCount = parseInt((countRes ?? '0') as string);
      const lastResetTime = parseInt((lastResetRes ?? '0') as string);

      if (now - lastResetTime > config.windowMs) {
        if (kv) {
          await Promise.all([
            kv.set(counterKey, '1'),
            kv.set(lastResetKey, now.toString())
          ]);
        }
        
        return {
          allowed: true,
          remaining: config.maxRequests - 1,
          resetTime: now + config.windowMs,
          totalHits: 1
        };
      }

      const newCount = currentCount + 1;
  if (kv) await kv.set(counterKey, newCount.toString());
      
      const allowed = newCount <= config.maxRequests;
      const remaining = Math.max(0, config.maxRequests - newCount);
      const resetTime = lastResetTime + config.windowMs;
      const retryAfter = allowed ? undefined : Math.ceil((resetTime - now) / 1000);

      return {
        allowed,
        remaining,
        resetTime,
        retryAfter,
        totalHits: newCount
      };

    } catch (error) {
      logger.error(error, 'Rate limiter error');
      
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetTime: now + config.windowMs,
        totalHits: 0
      };
    }
  }

  // Summarize counters for a given pattern or globally
  async getStats(pattern?: string): Promise<{ keys: number; errors?: string; sample?: Array<{ key: string; count: number; reset?: number }>; }> {
    try {
      const kv = this.getKV();
      // If KV provides scan/keys, attempt to list keys; otherwise return minimal info
      const hasScan = !!kv && typeof kv.scan === 'function';
      const hasKeys = !!kv && typeof kv.keys === 'function';
      if (!hasScan && !hasKeys) {
        return { keys: 0 };
      }

      const match = pattern ? `${pattern}` : `rate_limit:*`;
      let keys: string[] = [];

      if (hasScan && kv && kv.scan) {
        // Upstash pattern scan
        const result = await kv.scan(0, { match, count: 100 });
        const scanned = Array.isArray(result?.keys) ? result.keys as string[] : [];
        keys = scanned.filter(k => k.endsWith(':count'));
      } else if (hasKeys && kv && kv.keys) {
        // node-redis KEYS (avoid in prod, but acceptable for small sets)
        const all = await kv.keys(match);
        keys = (all as string[]).filter(k => k.endsWith(':count'));
      }

      const sampleKeys = keys.slice(0, 25);
      const counts = kv ? await Promise.all(sampleKeys.map(k => kv.get(k))) : [];
      const resetKeys = sampleKeys.map(k => k.replace(/:count$/, ':reset'));
      const resets = kv ? await Promise.all(resetKeys.map(k => kv.get(k))) : [];

      const sample = sampleKeys.map((k, i) => ({
        key: k,
        count: parseInt((counts[i] ?? '0') as string),
        reset: parseInt((resets[i] ?? '0') as string)
      }));

      return { keys: keys.length, sample };
    } catch (e) {
      logger.error(e, 'Failed to collect rate limit stats');
      return { keys: 0, errors: 'collection_failed' };
    }
  }

  // Reset a specific limiter key prefix (dangerous; admin-only)
  async resetLimit(keyPrefix: string): Promise<void> {
    try {
      const kv = this.getKV();
      const hasScan = !!kv && typeof kv.scan === 'function';
      const hasKeys = !!kv && typeof kv.keys === 'function';
      if (!hasScan && !hasKeys) return;
      const match = keyPrefix.endsWith('*') ? keyPrefix : `${keyPrefix}*`;
      let keys: string[] = [];
      if (hasScan && kv && kv.scan) {
        const result = await kv.scan(0, { match, count: 100 });
        keys = Array.isArray(result?.keys) ? result.keys as string[] : [];
      } else if (hasKeys && kv && kv.keys) {
        keys = await kv.keys(match);
      }
      const delKeys: string[] = [];
      for (const k of keys) {
        delKeys.push(k);
        const resetKey = k.endsWith(':count') ? k.replace(/:count$/, ':reset') : `${k}:reset`;
        delKeys.push(resetKey);
      }
      if (delKeys.length > 0 && kv && typeof kv.del === 'function' && kv.del) {
        await kv.del(...delKeys);
      } else if (kv) {
        // fallback: set zero
        await Promise.all(delKeys.map(k => kv.set(k, '0')));
      }
    } catch (e) {
      logger.error(e, 'Failed to reset rate limit keys');
    }
  }
}

export const rateLimiter = new AdvancedRateLimiter();

export const checkWebhookLimit = (ip: string, userAgent?: string) => 
  rateLimiter.limitWebhook(ip, userAgent);

export const checkUserDailyLimit = (userId: string) => 
  rateLimiter.limitMLUserDaily(userId);

// Compatibility wrappers used across the codebase/tests
export const checkIPLimit = (ip: string, config?: { max?: number; maxRequests?: number; windowMs?: number }) =>
  rateLimiter.limitByIP(ip, { maxRequests: config?.maxRequests ?? config?.max ?? 100, windowMs: config?.windowMs ?? 60 * 1000, keyGenerator: (i) => `rate_limit:ip:${i}` });

export const checkLoginLimit = (ip: string, userId?: string) =>
  rateLimiter.limitLogin(ip, userId);

export const checkPublicAPILimit = (ip: string, endpoint: string) =>
  rateLimiter.limitPublicAPI(ip, endpoint);

// Backwards-compatible wrapper that accepts multiple call signatures:
// - checkAuthAPILimit(ip, userId?)
// - checkAuthAPILimit(userIdOrPublic, ip, endpoint?)  <-- legacy usage across code/tests
export const checkAuthAPILimit = async (...args: unknown[]): Promise<RateLimitResult> => {
  // If called with (ip, userId?) -> keep existing behavior
  if (args.length <= 2 && typeof args[0] === 'string' && (args.length === 1 || typeof args[1] === 'string')) {
    const [ip, userId] = args as [string, string | undefined];
    return rateLimiter.limitAuthAPI(ip, userId);
  }

  // Legacy: (userIdOrPublic, ip, endpoint?)
  if (args.length >= 2) {
    const [userIdOrPublic, ip] = args as [string | undefined, string | undefined];
    // If first arg is 'public' treat as no user
    const userId = userIdOrPublic === 'public' ? undefined : userIdOrPublic;
    return rateLimiter.limitAuthAPI(ip ?? '0.0.0.0', userId);
  }

  // Fallback: allow
  return { allowed: true, remaining: 0, resetTime: Date.now(), retryAfter: undefined, totalHits: 0 };
};

export const checkMLAppHourly = () => rateLimiter.limitMLAppHourly();

export const checkMLUserDaily = (userId: string) => rateLimiter.limitMLUserDaily(userId);
