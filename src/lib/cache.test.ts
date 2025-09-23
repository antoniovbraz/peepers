import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { getKVClient, __resetKVClient, cache, getCachedProducts, getCachedProduct, getCachedQuestions } from './cache';

// Mock do @vercel/kv
const mockKV = {
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  scanIterator: vi.fn(),
};

vi.mock('@vercel/kv', () => ({
  createClient: vi.fn(() => mockKV),
}));

describe('Cache System', () => {
  const originalUrl = process.env.UPSTASH_REDIS_REST_URL;
  const originalToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  beforeEach(() => {
    vi.clearAllMocks();
    mockKV.get.mockReset();
    mockKV.set.mockReset();
    mockKV.del.mockReset();
    mockKV.scanIterator.mockReset();
  });

  afterEach(() => {
    __resetKVClient();
    if (originalUrl) {
      process.env.UPSTASH_REDIS_REST_URL = originalUrl;
    } else {
      delete process.env.UPSTASH_REDIS_REST_URL;
    }
    if (originalToken) {
      process.env.UPSTASH_REDIS_REST_TOKEN = originalToken;
    } else {
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
    }
  });

  describe('getKVClient', () => {
    it('throws without required env vars', () => {
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
      expect(() => getKVClient()).toThrow(/UPSTASH_REDIS_REST_URL/);
    });

    it('returns same client when env vars set', () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://example.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
      const client1 = getKVClient();
      const client2 = getKVClient();
      expect(client1).toBe(client2);
    });
  });

  describe('CacheManager', () => {
    let cacheManager: typeof cache;

    beforeEach(() => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://example.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
      cacheManager = cache;
    });

    describe('Error Handling', () => {
      it('handles cache errors gracefully in getAllProducts', async () => {
        mockKV.get.mockRejectedValue(new Error('Redis connection failed'));

        const result = await cacheManager.getAllProducts();
        expect(result).toBeNull();
      });

      it('handles cache errors gracefully in getActiveProducts', async () => {
        mockKV.get.mockRejectedValue(new Error('Redis connection failed'));

        const result = await cacheManager.getActiveProducts();
        expect(result).toBeNull();
      });

      it('handles cache errors gracefully in getProduct', async () => {
        mockKV.get.mockRejectedValue(new Error('Redis connection failed'));

        const result = await cacheManager.getProduct('MLB123456');
        expect(result).toBeNull();
      });

      it('handles cache errors gracefully in getUser', async () => {
        mockKV.get.mockRejectedValue(new Error('Redis connection failed'));

        const result = await cacheManager.getUser('123456');
        expect(result).toBeNull();
      });

      it('handles cache errors gracefully in getCategories', async () => {
        mockKV.get.mockRejectedValue(new Error('Redis connection failed'));

        const result = await cacheManager.getCategories();
        expect(result).toBeNull();
      });

      it('handles cache errors gracefully in getProductQuestions', async () => {
        mockKV.get.mockRejectedValue(new Error('Redis connection failed'));

        const result = await cacheManager.getProductQuestions('MLB123456');
        expect(result).toBeNull();
      });

      it('handles cache errors gracefully in getLastSyncTime', async () => {
        mockKV.get.mockRejectedValue(new Error('Redis connection failed'));

        const result = await cacheManager.getLastSyncTime();
        expect(result).toBeNull();
      });
    });

    describe('Cache Invalidation', () => {
      it('handles invalidation errors gracefully', async () => {
        mockKV.del.mockRejectedValue(new Error('Redis connection failed'));

        // These should not throw errors
        await expect(cacheManager.invalidateProduct('MLB123456')).resolves.not.toThrow();
        await expect(cacheManager.invalidateProductsCache()).resolves.not.toThrow();
        await expect(cacheManager.invalidateProductQuestions('MLB123456')).resolves.not.toThrow();
        await expect(cacheManager.releaseSyncLock()).resolves.not.toThrow();
      });
    });

    describe('Sync Lock Methods', () => {
      it('handles acquireSyncLock errors gracefully', async () => {
        mockKV.set.mockRejectedValue(new Error('Redis connection failed'));

        const result = await cacheManager.acquireSyncLock();
        expect(result).toBe(false);
      });
    });

    describe('Utility Methods', () => {
      describe('getCacheStats', () => {
        it('handles errors gracefully', async () => {
          mockKV.scanIterator.mockImplementation(() => {
            throw new Error('Scan error');
          });

          const result = await cacheManager.getCacheStats();

          expect(result).toEqual({
            productsCount: 0,
            questionsCount: 0,
            usersCount: 0,
            lastSync: null,
          });
        });
      });

      describe('healthCheck', () => {
        it('returns false when cache operations fail', async () => {
          mockKV.set.mockRejectedValue(new Error('Connection failed'));

          const result = await cacheManager.healthCheck();
          expect(result).toBe(false);
        });
      });
    });
  });

  describe('Helper Functions', () => {
    beforeEach(() => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://example.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
    });

    describe('getCachedProducts', () => {
      it('returns empty array when no active products cached', async () => {
        mockKV.get.mockResolvedValue(null);

        const result = await getCachedProducts();
        expect(result).toEqual([]);
      });
    });

    describe('getCachedProduct', () => {
      it('returns null when product not cached', async () => {
        mockKV.get.mockResolvedValue(null);

        const result = await getCachedProduct('MLB123456');
        expect(result).toBeNull();
      });
    });

    describe('getCachedQuestions', () => {
      it('returns empty array when no questions cached', async () => {
        mockKV.get.mockResolvedValue(null);

        const result = await getCachedQuestions('MLB123456');
        expect(result).toEqual([]);
      });
    });
  });
});
