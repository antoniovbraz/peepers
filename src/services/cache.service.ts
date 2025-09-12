import { createClient } from '@vercel/kv';
import { Product, ProductQuestion } from '@/types/product';
import { CacheUser } from '@/types/auth';
import { AppError } from '@/core/error';

interface CacheConfig {
  url?: string;
  token?: string;
}

interface CacheStats {
  total_products: number;
  active_products: number;
  cached_questions: number;
}

interface CacheKVResponse<T = any> {
  result: T;
  metadata: {
    created_at: string;
    expires_at?: string;
  };
}

export class CacheService {
  private readonly kv;
  private readonly productPrefix = 'product:';
  private readonly questionsPrefix = 'questions:';
  private readonly statsKey = 'cache:stats';
  private readonly productsKey = 'products:all';
  private readonly lastSyncKey = 'sync:last';
  private readonly userKey = 'user';

  constructor(config: CacheConfig = {}) {
    if (!config.url || !config.token) {
      config.url = process.env.UPSTASH_REDIS_REST_URL;
      config.token = process.env.UPSTASH_REDIS_REST_TOKEN;
    }

    if (!config.url || !config.token) {
      throw new Error('Cache configuration missing');
    }

    this.kv = createClient({
      url: config.url,
      token: config.token,
    });
  }

  async getProduct(id: string): Promise<Product | null> {
    try {
      return await this.kv.get(`${this.productPrefix}${id}`);
    } catch (error) {
      console.error('Cache error (getProduct):', error);
      return null;
    }
  }

  async setProduct(product: Product): Promise<void> {
    try {
      await this.kv.set(`${this.productPrefix}${product.id}`, product);
      await this.updateStats();
    } catch (error) {
      console.error('Cache error (setProduct):', error);
      throw AppError.internal('Failed to cache product');
    }
  }

  async getProductQuestions(id: string): Promise<ProductQuestion[] | null> {
    try {
      return await this.kv.get(`${this.questionsPrefix}${id}`);
    } catch (error) {
      console.error('Cache error (getProductQuestions):', error);
      return null;
    }
  }

  async setProductQuestions(id: string, questions: ProductQuestion[]): Promise<void> {
    try {
      await this.kv.set(`${this.questionsPrefix}${id}`, questions);
      await this.updateStats();
    } catch (error) {
      console.error('Cache error (setProductQuestions):', error);
      throw AppError.internal('Failed to cache product questions');
    }
  }

  async getActiveProducts(): Promise<Product[] | null> {
    try {
      const products = await this.kv.get<Product[]>(this.productsKey);
      return products?.filter((p: Product) => p.status === 'active') || null;
    } catch (error) {
      console.error('Cache error (getActiveProducts):', error);
      return null;
    }
  }

  async setAllProducts(products: Product[]): Promise<void> {
    try {
      await this.kv.set(this.productsKey, products);
      await this.updateStats();
    } catch (error) {
      console.error('Cache error (setAllProducts):', error);
      throw AppError.internal('Failed to cache products list');
    }
  }

  async getCacheStats(): Promise<CacheStats> {
    try {
      const stats = await this.kv.get<CacheStats>(this.statsKey);
      return stats || { total_products: 0, active_products: 0, cached_questions: 0 };
    } catch (error) {
      console.error('Cache error (getCacheStats):', error);
      return { total_products: 0, active_products: 0, cached_questions: 0 };
    }
  }

  private async updateStats(): Promise<void> {
    try {
      const products = await this.kv.get<Product[]>(this.productsKey) || [];
      const stats: CacheStats = {
        total_products: products.length,
        active_products: products.filter((p: Product) => p.status === 'active').length,
        cached_questions: await this.countCachedQuestions(),
      };
      await this.kv.set(this.statsKey, stats);
    } catch (error) {
      console.error('Cache error (updateStats):', error);
    }
  }

  private async countCachedQuestions(): Promise<number> {
    try {
      const keys = await this.kv.keys(`${this.questionsPrefix}*`);
      return keys.length;
    } catch (error) {
      console.error('Cache error (countCachedQuestions):', error);
      return 0;
    }
  }

  async getUser(key: keyof CacheUser): Promise<CacheUser[keyof CacheUser] | null> {
    try {
      const user = await this.kv.get<CacheUser>(this.userKey);
      return user ? user[key] : null;
    } catch (error) {
      console.error('Cache error (getUser):', error);
      return null;
    }
  }

  async setUser(data: Partial<CacheUser>): Promise<void> {
    try {
      const existing = await this.kv.get(this.userKey) || {};
      await this.kv.set(this.userKey, { ...existing, ...data });
    } catch (error) {
      console.error('Cache error (setUser):', error);
      throw AppError.internal('Failed to cache user data');
    }
  }

  async getLastSyncTime(): Promise<number | null> {
    try {
      return await this.kv.get(this.lastSyncKey);
    } catch (error) {
      console.error('Cache error (getLastSyncTime):', error);
      return null;
    }
  }

  async updateLastSyncTime(): Promise<void> {
    try {
      await this.kv.set(this.lastSyncKey, Date.now());
    } catch (error) {
      console.error('Cache error (updateLastSyncTime):', error);
    }
  }
}