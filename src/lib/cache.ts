import { kv } from '@vercel/kv';
import { MLProduct, MLQuestion, CachedProduct, CachedQuestions } from '@/types/ml';

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
  // Product Cache Methods
  async getAllProducts(): Promise<MLProduct[] | null> {
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
      
      return cached;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async setAllProducts(products: MLProduct[]): Promise<void> {
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
          cachedProducts.filter(p => p.status === 'active'),
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
      
      return cached;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async getProduct(productId: string): Promise<MLProduct | null> {
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
      
      return cached;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async setProduct(product: MLProduct): Promise<void> {
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
    try {
      await kv.del(`${CACHE_KEYS.QUESTIONS}${productId}`);
      console.log(`Invalidated questions cache for product ${productId}`);
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  // User Cache Methods
  async getUser(userId: string): Promise<any | null> {
    try {
      return await kv.get(`${CACHE_KEYS.USER}${userId}`);
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async setUser(userId: string, userData: any): Promise<void> {
    try {
      await kv.set(`${CACHE_KEYS.USER}${userId}`, userData, { ex: CACHE_TTL.USER_DATA });
    } catch (error) {
      console.error('Cache set error:', error);
      throw error;
    }
  }

  // Categories Cache Methods
  async getCategories(): Promise<any[] | null> {
    try {
      return await kv.get<any[]>(CACHE_KEYS.CATEGORIES);
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async setCategories(categories: any[]): Promise<void> {
    try {
      await kv.set(CACHE_KEYS.CATEGORIES, categories, { ex: CACHE_TTL.CATEGORIES });
    } catch (error) {
      console.error('Cache set error:', error);
      throw error;
    }
  }

  // Sync Lock Methods (to prevent concurrent syncs)
  async acquireSyncLock(): Promise<boolean> {
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
    try {
      await kv.del(CACHE_KEYS.SYNC_LOCK);
    } catch (error) {
      console.error('Lock release error:', error);
    }
  }

  async getLastSyncTime(): Promise<string | null> {
    try {
      return await kv.get<string>(CACHE_KEYS.LAST_SYNC);
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  // Utility Methods
  async clearAllCache(): Promise<void> {
    try {
      // Get all keys with our prefixes
      const keys = await kv.keys('products:*');
      const questionKeys = await kv.keys('questions:*');
      const userKeys = await kv.keys('user:*');
      
      const allKeys = [...keys, ...questionKeys, ...userKeys, CACHE_KEYS.CATEGORIES];
      
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
      const [productKeys, questionKeys, userKeys, lastSync] = await Promise.all([
        kv.keys('products:*'),
        kv.keys('questions:*'),
        kv.keys('user:*'),
        this.getLastSyncTime()
      ]);

      return {
        productsCount: productKeys.length,
        questionsCount: questionKeys.length,
        usersCount: userKeys.length,
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
