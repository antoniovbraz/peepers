import { createClient } from '@vercel/kv';
import {
  MLProduct,
  MLQuestion,
  CachedProduct,
  CachedQuestions,
  CachedUser,
  CachedCategory,
} from '@/types/ml';

let kvClient: ReturnType<typeof createClient> | null = null;

export function getKVClient() {
  if (kvClient) return kvClient;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  if (!url) {
    throw new Error('Missing environment variable: UPSTASH_REDIS_REST_URL');
  }

  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!token) {
    throw new Error('Missing environment variable: UPSTASH_REDIS_REST_TOKEN');
  }

  kvClient = createClient({ url, token });
  return kvClient;
}

export function __resetKVClient() {
  kvClient = null;
}

// Cache TTL constants (in seconds)
const CACHE_TTL = {
  PRODUCTS: 7200, // 2 hours
  QUESTIONS: 3600, // 1 hour
  USER_DATA: 1800, // 30 minutes
  CATEGORIES: 86400, // 24 hours
} as const;

// Cache key prefixes
const CACHE_KEYS = {
  PRODUCTS_ALL: 'products:all',
  PRODUCTS_ACTIVE: 'products:active',
  PRODUCT: 'product:',
  QUESTIONS: 'questions:',
  USER: 'user:',
  CATEGORIES: 'categories:all',
  SYNC_LOCK: 'sync:lock',
  LAST_SYNC: 'sync:last',
} as const;

class CacheManager {
  private toMLProduct(cached: CachedProduct): MLProduct {
    if (cached.body) {
      return cached.body;
    }

    const { cached_at: _ca, cache_ttl: _ct, code: _code, ...product } = cached;
    if (
      typeof product.id === 'string' &&
      typeof product.title === 'string' &&
      typeof product.status === 'string'
    ) {
      return product as MLProduct;
    }

    throw new Error('Invalid cached product format');
  }

  // Product Cache Methods
  async getAllProducts(): Promise<MLProduct[] | null> {
    const kv = getKVClient();
    try {
      const cached = await kv.get<CachedProduct[]>(CACHE_KEYS.PRODUCTS_ALL);
      
      if (!cached) return null;
      
      // Check if cache is expired
      const now = new Date().toISOString();
      const isExpired = cached.some(product => 
        new Date(product.cached_at).getTime() + (product.cache_ttl * 1000) < new Date(now).getTime()
      );
      
      if (isExpired) {
        await this.invalidateProductsCache();
        return null;
      }
      
      // Extract products from nested structure if needed
      return cached.map(product => this.toMLProduct(product));
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async setAllProducts(products: MLProduct[]): Promise<void> {
    const kv = getKVClient();
    try {
      const cachedProducts: CachedProduct[] = products.map(product => ({
        ...product,
        cached_at: new Date().toISOString(),
        cache_ttl: CACHE_TTL.PRODUCTS
      }));

      await Promise.all([
        kv.set(CACHE_KEYS.PRODUCTS_ALL, cachedProducts, { ex: CACHE_TTL.PRODUCTS }),
        kv.set(
          CACHE_KEYS.PRODUCTS_ACTIVE, 
          cachedProducts.filter(p => {
            // Handle nested structure from ML API response
            if (p.body && p.body.status) {
              return p.body.status === 'active';
            }
            // Handle direct structure
            return p.status === 'active';
          }),
          { ex: CACHE_TTL.PRODUCTS }
        )
      ]);

      // Cache individual products
      const individualCachePromises = cachedProducts.map(product =>
        kv.set(`${CACHE_KEYS.PRODUCT}${product.id}`, product, { ex: CACHE_TTL.PRODUCTS })
      );

      await Promise.all(individualCachePromises);
      
      // Update last sync timestamp
      await kv.set(CACHE_KEYS.LAST_SYNC, new Date().toISOString());
      
      console.log(`Cached ${products.length} products`);
    } catch (error) {
      console.error('Cache set error:', error);
      throw error;
    }
  }

  async getActiveProducts(): Promise<MLProduct[] | null> {
    const kv = getKVClient();
    try {
      const cached = await kv.get<CachedProduct[]>(CACHE_KEYS.PRODUCTS_ACTIVE);
      
      if (!cached) return null;
      
      // Check if cache is expired
      const now = new Date().toISOString();
      const isExpired = cached.some(product => 
        new Date(product.cached_at).getTime() + (product.cache_ttl * 1000) < new Date(now).getTime()
      );
      
      if (isExpired) {
        await this.invalidateProductsCache();
        return null;
      }

      // Extract products from nested structure if needed
      return cached.map(product => this.toMLProduct(product));
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async getProduct(productId: string): Promise<MLProduct | null> {
    const kv = getKVClient();
    try {
      const cached = await kv.get<CachedProduct>(`${CACHE_KEYS.PRODUCT}${productId}`);
      
      if (!cached) return null;
      
      // Check if cache is expired
      const now = new Date().toISOString();
      const isExpired = new Date(cached.cached_at).getTime() + (cached.cache_ttl * 1000) < new Date(now).getTime();
      
      if (isExpired) {
        await kv.del(`${CACHE_KEYS.PRODUCT}${productId}`);
        return null;
      }

      // Extract product from nested structure if needed
      return this.toMLProduct(cached);
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async setProduct(product: MLProduct): Promise<void> {
    const kv = getKVClient();
    try {
      const cachedProduct: CachedProduct = {
        ...product,
        cached_at: new Date().toISOString(),
        cache_ttl: CACHE_TTL.PRODUCTS
      };

      await kv.set(`${CACHE_KEYS.PRODUCT}${product.id}`, cachedProduct, { ex: CACHE_TTL.PRODUCTS });
    } catch (error) {
      console.error('Cache set error:', error);
      throw error;
    }
  }

  async invalidateProduct(productId: string): Promise<void> {
    const kv = getKVClient();
    try {
      await kv.del(`${CACHE_KEYS.PRODUCT}${productId}`);
      
      // Also invalidate the full products cache to trigger refresh
      await this.invalidateProductsCache();
      
      console.log(`Invalidated cache for product ${productId}`);
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  async invalidateProductsCache(): Promise<void> {
    const kv = getKVClient();
    try {
      await Promise.all([
        kv.del(CACHE_KEYS.PRODUCTS_ALL),
        kv.del(CACHE_KEYS.PRODUCTS_ACTIVE)
      ]);
      
      console.log('Invalidated products cache');
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  // Questions Cache Methods
  async getProductQuestions(productId: string): Promise<MLQuestion[] | null> {
    const kv = getKVClient();
    try {
      const cached = await kv.get<CachedQuestions>(`${CACHE_KEYS.QUESTIONS}${productId}`);
      
      if (!cached) return null;
      
      // Check if cache is expired
      const now = new Date().toISOString();
      const isExpired = new Date(cached.cached_at).getTime() + (cached.cache_ttl * 1000) < new Date(now).getTime();
      
      if (isExpired) {
        await kv.del(`${CACHE_KEYS.QUESTIONS}${productId}`);
        return null;
      }
      
      return cached.questions;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async setProductQuestions(productId: string, questions: MLQuestion[]): Promise<void> {
    const kv = getKVClient();
    try {
      const cachedQuestions: CachedQuestions = {
        item_id: productId,
        questions,
        cached_at: new Date().toISOString(),
        cache_ttl: CACHE_TTL.QUESTIONS
      };

      await kv.set(`${CACHE_KEYS.QUESTIONS}${productId}`, cachedQuestions, { ex: CACHE_TTL.QUESTIONS });
    } catch (error) {
      console.error('Cache set error:', error);
      throw error;
    }
  }

  async invalidateProductQuestions(productId: string): Promise<void> {
    const kv = getKVClient();
    try {
      await kv.del(`${CACHE_KEYS.QUESTIONS}${productId}`);
      console.log(`Invalidated questions cache for product ${productId}`);
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  // User Cache Methods
  async getUser(userId: string): Promise<CachedUser | null> {
    const kv = getKVClient();
    try {
      return await kv.get<CachedUser>(`${CACHE_KEYS.USER}${userId}`);
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async setUser(userId: string, userData: CachedUser): Promise<void> {
    const kv = getKVClient();
    try {
      await kv.set(`${CACHE_KEYS.USER}${userId}`, userData, { ex: CACHE_TTL.USER_DATA });
    } catch (error) {
      console.error('Cache set error:', error);
      throw error;
    }
  }

  // Categories Cache Methods
  async getCategories(): Promise<CachedCategory[] | null> {
    const kv = getKVClient();
    try {
      return await kv.get<CachedCategory[]>(CACHE_KEYS.CATEGORIES);
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async setCategories(categories: CachedCategory[]): Promise<void> {
    const kv = getKVClient();
    try {
      await kv.set(CACHE_KEYS.CATEGORIES, categories, { ex: CACHE_TTL.CATEGORIES });
    } catch (error) {
      console.error('Cache set error:', error);
      throw error;
    }
  }

  // Sync Lock Methods (to prevent concurrent syncs)
  async acquireSyncLock(): Promise<boolean> {
    const kv = getKVClient();
    try {
      const lockAcquired = await kv.set(CACHE_KEYS.SYNC_LOCK, 'locked', { 
        ex: 300, // 5 minutes
        nx: true // Only set if not exists
      });
      
      return lockAcquired === 'OK';
    } catch (error) {
      console.error('Lock acquisition error:', error);
      return false;
    }
  }

  async releaseSyncLock(): Promise<void> {
    const kv = getKVClient();
    try {
      await kv.del(CACHE_KEYS.SYNC_LOCK);
    } catch (error) {
      console.error('Lock release error:', error);
    }
  }

  async getLastSyncTime(): Promise<string | null> {
    const kv = getKVClient();
    try {
      return await kv.get<string>(CACHE_KEYS.LAST_SYNC);
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  // Utility Methods
  private async collectKeys(pattern: string): Promise<string[]> {
    const kv = getKVClient();
    const keys: string[] = [];
    for await (const key of kv.scanIterator({ match: pattern })) {
      keys.push(key);
    }
    return keys;
  }

  private async countKeys(pattern: string): Promise<number> {
    const kv = getKVClient();
    let count = 0;
    for await (const _ of kv.scanIterator({ match: pattern })) {
      count++;
    }
    return count;
  }

  async clearAllCache(): Promise<void> {
    const kv = getKVClient();
    try {
      const [productKeys, questionKeys, userKeys] = await Promise.all([
        this.collectKeys('products:*'),
        this.collectKeys('questions:*'),
        this.collectKeys('user:*')
      ]);

      const allKeys = [...productKeys, ...questionKeys, ...userKeys, CACHE_KEYS.CATEGORIES];

      if (allKeys.length > 0) {
        await kv.del(...allKeys);
      }

      console.log(`Cleared ${allKeys.length} cache entries`);
    } catch (error) {
      console.error('Cache clear error:', error);
      throw error;
    }
  }

  async getCacheStats(): Promise<{
    productsCount: number;
    questionsCount: number;
    usersCount: number;
    lastSync: string | null;
  }> {
    try {
      const [productsCount, questionsCount, usersCount, lastSync] = await Promise.all([
        this.countKeys('products:*'),
        this.countKeys('questions:*'),
        this.countKeys('user:*'),
        this.getLastSyncTime()
      ]);

      return {
        productsCount,
        questionsCount,
        usersCount,
        lastSync
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return {
        productsCount: 0,
        questionsCount: 0,
        usersCount: 0,
        lastSync: null
      };
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    const kv = getKVClient();
    try {
      const testKey = 'health:check';
      const testValue = Date.now().toString();

      await kv.set(testKey, testValue, { ex: 10 });
      const retrieved = await kv.get(testKey);
      await kv.del(testKey);
      
      return retrieved === testValue;
    } catch (error) {
      console.error('Cache health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const cache = new CacheManager();
export default cache;

// Helper functions for common operations
export async function getCachedProducts(): Promise<MLProduct[]> {
  return (await cache.getActiveProducts()) || [];
}

export async function getCachedProduct(productId: string): Promise<MLProduct | null> {
  return await cache.getProduct(productId);
}

export async function invalidateProductCache(productId: string): Promise<void> {
  await cache.invalidateProduct(productId);
}

export async function getCachedQuestions(productId: string): Promise<MLQuestion[]> {
  return (await cache.getProductQuestions(productId)) || [];
}
