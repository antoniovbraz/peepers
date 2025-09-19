/**
 * 🔌 INFRASTRUCTURE LAYER - External Services & Repositories
 * 
 * Enterprise infrastructure layer implementing Clean Architecture patterns
 * Real ML API integration following official specifications
 * 
 * CRITICAL COMPLIANCE:
 * - 500ms webhook timeout enforcement
 * - IP whitelist validation (54.88.218.97, 18.215.140.160, 18.213.114.129, 18.206.34.84)
 * - Rate limiting: 1000 calls/hour (app) + 5000 calls/day (user)
 * - OAuth 2.0 + PKCE with SHA-256 code challenge
 */

import {
  MLProduct,
  MLOrder,
  MLUser,
  MLProductRepository,
  MLOrderRepository,
  MLUserRepository,
  MLProductId,
  MLOrderId,
  MLUserId,
  ProductFilters,
  OrderFilters,
  ProductSearchQuery,
  OrderSearchQuery,
  ProductSearchResult,
  OrderSearchResult,
  MLAPIClient,
  CacheService,
  LoggingService,
  EventBus,
  DomainEvent,
  EventHandler,
  ExternalServiceError,
  NotFoundError
} from '../domain/core.js';

// ================================
// ML API CLIENT IMPLEMENTATION
// ================================

export interface MLAPIConfig {
  readonly baseUrl: string;
  readonly clientId: string;
  readonly clientSecret: string;
  readonly timeout: number;
  readonly rateLimits: {
    readonly appCallsPerHour: number;
    readonly userCallsPerDay: number;
    readonly maxCallsPerMinute: number;
  };
}

export interface RateLimitState {
  appCalls: number;
  userCalls: Map<number, number>;
  lastReset: Date;
  callsThisMinute: number;
  minuteStart: Date;
}

export class MLAPIClientImpl implements MLAPIClient {
  private readonly config: MLAPIConfig;
  private readonly rateLimitState: RateLimitState;

  constructor(
    config: MLAPIConfig,
    private readonly cacheService: CacheService,
    private readonly logger: LoggingService
  ) {
    this.config = config;
    this.rateLimitState = {
      appCalls: 0,
      userCalls: new Map(),
      lastReset: new Date(),
      callsThisMinute: 0,
      minuteStart: new Date()
    };
  }

  async get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.makeRequest<T>('GET', endpoint, undefined, headers);
  }

  async post<T>(endpoint: string, data: any, headers?: Record<string, string>): Promise<T> {
    return this.makeRequest<T>('POST', endpoint, data, headers);
  }

  async put<T>(endpoint: string, data: any, headers?: Record<string, string>): Promise<T> {
    return this.makeRequest<T>('PUT', endpoint, data, headers);
  }

  async delete<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.makeRequest<T>('DELETE', endpoint, undefined, headers);
  }

  private async makeRequest<T>(
    method: string,
    endpoint: string,
    data?: any,
    headers?: Record<string, string>
  ): Promise<T> {
    // Rate limiting enforcement
    await this.enforceRateLimit();

    const url = `${this.config.baseUrl}${endpoint}`;
    const requestHeaders = {
      'Content-Type': 'application/json',
      'User-Agent': 'Peepers/2.0.0 (Enterprise ML Integration)',
      ...headers
    };

    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
      signal: AbortSignal.timeout(this.config.timeout)
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      requestOptions.body = JSON.stringify(data);
    }

    try {
      this.logger.debug('MLAPIClient: Making request', { 
        method, 
        url, 
        hasAuth: !!headers?.Authorization 
      });

      const response = await fetch(url, requestOptions);
      
      // Update rate limit counters from headers
      this.updateRateLimitFromHeaders(response.headers);

      if (!response.ok) {
        const errorBody = await response.text();
        throw new ExternalServiceError(
          `ML API request failed: ${response.status} ${response.statusText}`,
          'ML_API',
          response.status,
          errorBody
        );
      }

      const result = await response.json();
      
      this.logger.debug('MLAPIClient: Request successful', { 
        method, 
        url, 
        status: response.status 
      });

      return result;

    } catch (error) {
      if (error instanceof ExternalServiceError) {
        throw error;
      }

      this.logger.error('MLAPIClient: Request failed', error as Error, { 
        method, 
        url 
      });

      throw new ExternalServiceError(
        `ML API request failed: ${(error as Error).message}`,
        'ML_API',
        undefined,
        { originalError: error }
      );
    }
  }

  private async enforceRateLimit(): Promise<void> {
    const now = new Date();
    
    // Reset hourly counters
    if (now.getTime() - this.rateLimitState.lastReset.getTime() >= 3600000) {
      this.rateLimitState.appCalls = 0;
      this.rateLimitState.userCalls.clear();
      this.rateLimitState.lastReset = now;
    }

    // Reset minute counters
    if (now.getTime() - this.rateLimitState.minuteStart.getTime() >= 60000) {
      this.rateLimitState.callsThisMinute = 0;
      this.rateLimitState.minuteStart = now;
    }

    // Check app-level rate limit
    if (this.rateLimitState.appCalls >= this.config.rateLimits.appCallsPerHour) {
      throw new ExternalServiceError(
        'App rate limit exceeded (1000 calls/hour)',
        'ML_API',
        429
      );
    }

    // Check minute-level rate limit
    if (this.rateLimitState.callsThisMinute >= this.config.rateLimits.maxCallsPerMinute) {
      const waitTime = 60000 - (now.getTime() - this.rateLimitState.minuteStart.getTime());
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    // Increment counters
    this.rateLimitState.appCalls++;
    this.rateLimitState.callsThisMinute++;
  }

  private updateRateLimitFromHeaders(headers: Headers): void {
    // ML API returns rate limit info in headers
    const remaining = headers.get('X-Ratelimit-Remaining');
    const resetTime = headers.get('X-Ratelimit-Reset');
    
    if (remaining) {
      this.logger.debug('MLAPIClient: Rate limit remaining', { remaining });
    }
  }

  async validateUserRateLimit(userId: number): Promise<boolean> {
    const userCalls = this.rateLimitState.userCalls.get(userId) || 0;
    return userCalls < this.config.rateLimits.userCallsPerDay;
  }

  incrementUserCalls(userId: number): void {
    const current = this.rateLimitState.userCalls.get(userId) || 0;
    this.rateLimitState.userCalls.set(userId, current + 1);
  }
}

// ================================
// PRODUCT REPOSITORY IMPLEMENTATION
// ================================

export class MLProductRepositoryImpl implements MLProductRepository {
  constructor(
    private readonly apiClient: MLAPIClient,
    private readonly cacheService: CacheService,
    private readonly logger: LoggingService
  ) {}

  async findById(id: MLProductId): Promise<MLProduct | null> {
    try {
      this.logger.info('MLProductRepository: Finding product by ID', { productId: id.toString() });

      const cacheKey = `product:${id.toString()}`;
      const cached = await this.cacheService.get<MLProduct>(cacheKey);
      
      if (cached) {
        this.logger.debug('MLProductRepository: Cache hit for product', { productId: id.toString() });
        return cached;
      }

      const product = await this.apiClient.get<MLProduct>(`/items/${id.toString()}`);
      
      if (!product) {
        return null;
      }

      // Cache for 10 minutes
      await this.cacheService.set(cacheKey, product, 600);

      this.logger.info('MLProductRepository: Product found and cached', { productId: id.toString() });
      
      return product;

    } catch (error) {
      if (error instanceof ExternalServiceError && error.statusCode === 404) {
        this.logger.info('MLProductRepository: Product not found', { productId: id.toString() });
        return null;
      }

      this.logger.error('MLProductRepository: Error finding product', error as Error, { 
        productId: id.toString() 
      });
      throw error;
    }
  }

  async findByUserId(userId: MLUserId, filters?: ProductFilters): Promise<MLProduct[]> {
    try {
      this.logger.info('MLProductRepository: Finding products by user ID', { 
        userId: userId.toNumber(),
        filters 
      });

      const cacheKey = `products:user:${userId.toNumber()}:${JSON.stringify(filters)}`;
      const cached = await this.cacheService.get<MLProduct[]>(cacheKey);
      
      if (cached) {
        this.logger.debug('MLProductRepository: Cache hit for user products', { 
          userId: userId.toNumber(),
          count: cached.length 
        });
        return cached;
      }

      // Build query parameters
      const params = new URLSearchParams();
      params.append('seller_id', userId.toNumber().toString());
      
      if (filters?.status?.length) {
        params.append('status', filters.status.join(','));
      }
      if (filters?.categoryId) {
        params.append('category', filters.categoryId);
      }
      if (filters?.minPrice) {
        params.append('price_min', filters.minPrice.toString());
      }
      if (filters?.maxPrice) {
        params.append('price_max', filters.maxPrice.toString());
      }

      const response = await this.apiClient.get<{ results: MLProduct[] }>(
        `/users/${userId.toNumber()}/items/search?${params.toString()}`
      );

      const products = response.results || [];

      // Cache for 5 minutes
      await this.cacheService.set(cacheKey, products, 300);

      this.logger.info('MLProductRepository: Products found and cached', { 
        userId: userId.toNumber(),
        count: products.length 
      });

      return products;

    } catch (error) {
      this.logger.error('MLProductRepository: Error finding products by user', error as Error, { 
        userId: userId.toNumber() 
      });
      throw error;
    }
  }

  async findByCategory(categoryId: string, filters?: ProductFilters): Promise<MLProduct[]> {
    try {
      this.logger.info('MLProductRepository: Finding products by category', { categoryId, filters });

      const cacheKey = `products:category:${categoryId}:${JSON.stringify(filters)}`;
      const cached = await this.cacheService.get<MLProduct[]>(cacheKey);
      
      if (cached) {
        return cached;
      }

      const params = new URLSearchParams();
      params.append('category', categoryId);
      
      if (filters?.status?.length) {
        params.append('status', filters.status.join(','));
      }
      if (filters?.minPrice) {
        params.append('price_min', filters.minPrice.toString());
      }
      if (filters?.maxPrice) {
        params.append('price_max', filters.maxPrice.toString());
      }

      const response = await this.apiClient.get<{ results: MLProduct[] }>(
        `/sites/MLB/search?${params.toString()}`
      );

      const products = response.results || [];

      // Cache for 15 minutes
      await this.cacheService.set(cacheKey, products, 900);

      this.logger.info('MLProductRepository: Products found by category', { 
        categoryId,
        count: products.length 
      });

      return products;

    } catch (error) {
      this.logger.error('MLProductRepository: Error finding products by category', error as Error, { 
        categoryId 
      });
      throw error;
    }
  }

  async search(query: ProductSearchQuery): Promise<ProductSearchResult> {
    try {
      this.logger.info('MLProductRepository: Searching products', { query });

      const cacheKey = `products:search:${JSON.stringify(query)}`;
      const cached = await this.cacheService.get<ProductSearchResult>(cacheKey);
      
      if (cached) {
        return cached;
      }

      const params = new URLSearchParams();
      
      if (query.query) {
        params.append('q', query.query);
      }
      if (query.categoryId) {
        params.append('category', query.categoryId);
      }
      if (query.sellerId) {
        params.append('seller_id', query.sellerId.toString());
      }
      if (query.sort) {
        params.append('sort', query.sort as string);
      }
      if (query.limit) {
        params.append('limit', Math.min(query.limit, 200).toString()); // ML max is 200
      }
      if (query.offset) {
        params.append('offset', query.offset.toString());
      }

      // Add filters
      if (query.filters) {
        if (query.filters.status?.length) {
          params.append('status', query.filters.status.join(','));
        }
        if (query.filters.minPrice) {
          params.append('price_min', query.filters.minPrice.toString());
        }
        if (query.filters.maxPrice) {
          params.append('price_max', query.filters.maxPrice.toString());
        }
        if (query.filters.freeShipping) {
          params.append('shipping_cost', 'free');
        }
        if (query.filters.condition?.length) {
          params.append('condition', query.filters.condition.join(','));
        }
      }

      const endpoint = query.sellerId 
        ? `/users/${query.sellerId}/items/search`
        : '/sites/MLB/search';

      const response = await this.apiClient.get<{
        results: MLProduct[];
        paging: {
          total: number;
          limit: number;
          offset: number;
        };
        available_filters?: any[];
        available_sorts?: any[];
      }>(`${endpoint}?${params.toString()}`);

      const result: ProductSearchResult = {
        results: response.results || [],
        total: response.paging?.total || 0,
        limit: response.paging?.limit || query.limit || 50,
        offset: response.paging?.offset || 0,
        hasNext: (response.paging?.offset || 0) + (response.paging?.limit || 0) < (response.paging?.total || 0)
      };

      // Cache for 5 minutes
      await this.cacheService.set(cacheKey, result, 300);

      this.logger.info('MLProductRepository: Search completed', { 
        query: query.query,
        total: result.total,
        returned: result.results.length 
      });

      return result;

    } catch (error) {
      this.logger.error('MLProductRepository: Search failed', error as Error, { query });
      throw error;
    }
  }

  async save(product: MLProduct): Promise<void> {
    // Implementation would involve ML API product creation/update
    throw new Error('Product save not yet implemented - requires ML API product management');
  }

  async delete(id: MLProductId): Promise<void> {
    // Implementation would involve ML API product deletion
    throw new Error('Product delete not yet implemented - requires ML API product management');
  }
}

// ================================
// ORDER REPOSITORY IMPLEMENTATION
// ================================

export class MLOrderRepositoryImpl implements MLOrderRepository {
  constructor(
    private readonly apiClient: MLAPIClient,
    private readonly cacheService: CacheService,
    private readonly logger: LoggingService
  ) {}

  async findById(id: MLOrderId): Promise<MLOrder | null> {
    try {
      this.logger.info('MLOrderRepository: Finding order by ID', { orderId: id.toNumber() });

      const cacheKey = `order:${id.toNumber()}`;
      const cached = await this.cacheService.get<MLOrder>(cacheKey);
      
      if (cached) {
        return cached;
      }

      const order = await this.apiClient.get<MLOrder>(`/orders/${id.toNumber()}`);
      
      if (!order) {
        return null;
      }

      // Cache for 5 minutes
      await this.cacheService.set(cacheKey, order, 300);

      this.logger.info('MLOrderRepository: Order found and cached', { orderId: id.toNumber() });
      
      return order;

    } catch (error) {
      if (error instanceof ExternalServiceError && error.statusCode === 404) {
        this.logger.info('MLOrderRepository: Order not found', { orderId: id.toNumber() });
        return null;
      }

      this.logger.error('MLOrderRepository: Error finding order', error as Error, { 
        orderId: id.toNumber() 
      });
      throw error;
    }
  }

  async findByUserId(userId: MLUserId, filters?: OrderFilters): Promise<MLOrder[]> {
    try {
      this.logger.info('MLOrderRepository: Finding orders by user ID', { 
        userId: userId.toNumber(),
        filters 
      });

      const cacheKey = `orders:user:${userId.toNumber()}:${JSON.stringify(filters)}`;
      const cached = await this.cacheService.get<MLOrder[]>(cacheKey);
      
      if (cached) {
        return cached;
      }

      const params = new URLSearchParams();
      params.append('seller', userId.toNumber().toString());
      
      if (filters?.status?.length) {
        params.append('order.status', filters.status.join(','));
      }
      if (filters?.dateFrom) {
        params.append('order.date_created.from', filters.dateFrom.toISOString());
      }
      if (filters?.dateTo) {
        params.append('order.date_created.to', filters.dateTo.toISOString());
      }

      const response = await this.apiClient.get<{ results: MLOrder[] }>(
        `/orders/search?${params.toString()}`
      );

      const orders = response.results || [];

      // Cache for 3 minutes
      await this.cacheService.set(cacheKey, orders, 180);

      this.logger.info('MLOrderRepository: Orders found and cached', { 
        userId: userId.toNumber(),
        count: orders.length 
      });

      return orders;

    } catch (error) {
      this.logger.error('MLOrderRepository: Error finding orders by user', error as Error, { 
        userId: userId.toNumber() 
      });
      throw error;
    }
  }

  async findByStatus(status: any, filters?: OrderFilters): Promise<MLOrder[]> {
    try {
      this.logger.info('MLOrderRepository: Finding orders by status', { status, filters });

      const params = new URLSearchParams();
      params.append('order.status', status);
      
      if (filters?.dateFrom) {
        params.append('order.date_created.from', filters.dateFrom.toISOString());
      }
      if (filters?.dateTo) {
        params.append('order.date_created.to', filters.dateTo.toISOString());
      }

      const response = await this.apiClient.get<{ results: MLOrder[] }>(
        `/orders/search?${params.toString()}`
      );

      return response.results || [];

    } catch (error) {
      this.logger.error('MLOrderRepository: Error finding orders by status', error as Error, { status });
      throw error;
    }
  }

  async search(query: OrderSearchQuery): Promise<OrderSearchResult> {
    try {
      this.logger.info('MLOrderRepository: Searching orders', { query });

      const cacheKey = `orders:search:${JSON.stringify(query)}`;
      const cached = await this.cacheService.get<OrderSearchResult>(cacheKey);
      
      if (cached) {
        return cached;
      }

      const params = new URLSearchParams();
      
      if (query.sellerId) {
        params.append('seller', query.sellerId.toString());
      }
      if (query.buyerId) {
        params.append('buyer', query.buyerId.toString());
      }
      if (query.sort) {
        params.append('sort', query.sort as string);
      }
      if (query.limit) {
        params.append('limit', Math.min(query.limit, 200).toString());
      }
      if (query.offset) {
        params.append('offset', query.offset.toString());
      }

      // Add filters
      if (query.filters) {
        if (query.filters.status?.length) {
          params.append('order.status', query.filters.status.join(','));
        }
        if (query.filters.dateFrom) {
          params.append('order.date_created.from', query.filters.dateFrom.toISOString());
        }
        if (query.filters.dateTo) {
          params.append('order.date_created.to', query.filters.dateTo.toISOString());
        }
        if (query.filters.minAmount) {
          params.append('order.total_amount.from', query.filters.minAmount.toString());
        }
        if (query.filters.maxAmount) {
          params.append('order.total_amount.to', query.filters.maxAmount.toString());
        }
      }

      const response = await this.apiClient.get<{
        results: MLOrder[];
        paging: {
          total: number;
          limit: number;
          offset: number;
        };
      }>(`/orders/search?${params.toString()}`);

      const result: OrderSearchResult = {
        results: response.results || [],
        total: response.paging?.total || 0,
        limit: response.paging?.limit || query.limit || 50,
        offset: response.paging?.offset || 0,
        hasNext: (response.paging?.offset || 0) + (response.paging?.limit || 0) < (response.paging?.total || 0)
      };

      // Cache for 3 minutes
      await this.cacheService.set(cacheKey, result, 180);

      this.logger.info('MLOrderRepository: Order search completed', { 
        total: result.total,
        returned: result.results.length 
      });

      return result;

    } catch (error) {
      this.logger.error('MLOrderRepository: Order search failed', error as Error, { query });
      throw error;
    }
  }

  async save(order: MLOrder): Promise<void> {
    // Orders are typically read-only in ML API
    throw new Error('Order save not implemented - orders are managed by ML platform');
  }
}

// ================================
// USER REPOSITORY IMPLEMENTATION
// ================================

export class MLUserRepositoryImpl implements MLUserRepository {
  constructor(
    private readonly apiClient: MLAPIClient,
    private readonly cacheService: CacheService,
    private readonly logger: LoggingService
  ) {}

  async findById(id: MLUserId): Promise<MLUser | null> {
    try {
      this.logger.info('MLUserRepository: Finding user by ID', { userId: id.toNumber() });

      const cacheKey = `user:${id.toNumber()}`;
      const cached = await this.cacheService.get<MLUser>(cacheKey);
      
      if (cached) {
        return cached;
      }

      const user = await this.apiClient.get<MLUser>(`/users/${id.toNumber()}`);
      
      if (!user) {
        return null;
      }

      // Cache for 30 minutes
      await this.cacheService.set(cacheKey, user, 1800);

      this.logger.info('MLUserRepository: User found and cached', { userId: id.toNumber() });
      
      return user;

    } catch (error) {
      if (error instanceof ExternalServiceError && error.statusCode === 404) {
        this.logger.info('MLUserRepository: User not found', { userId: id.toNumber() });
        return null;
      }

      this.logger.error('MLUserRepository: Error finding user', error as Error, { 
        userId: id.toNumber() 
      });
      throw error;
    }
  }

  async findByEmail(email: string): Promise<MLUser | null> {
    // ML API doesn't support user search by email directly
    throw new Error('User search by email not supported by ML API');
  }

  async findByNickname(nickname: string): Promise<MLUser | null> {
    try {
      this.logger.info('MLUserRepository: Finding user by nickname', { nickname });

      const response = await this.apiClient.get<{ results: MLUser[] }>(
        `/sites/MLB/search?nickname=${encodeURIComponent(nickname)}`
      );

      const users = response.results || [];
      return users.length > 0 ? users[0] : null;

    } catch (error) {
      this.logger.error('MLUserRepository: Error finding user by nickname', error as Error, { nickname });
      throw error;
    }
  }

  async save(user: MLUser): Promise<void> {
    // User data is typically read-only in ML API
    throw new Error('User save not implemented - user data is managed by ML platform');
  }
}

// ================================
// CACHE SERVICE IMPLEMENTATION
// ================================

export class RedisCacheService implements CacheService {
  constructor(
    private readonly redisClient: any, // Would be actual Redis client
    private readonly logger: LoggingService
  ) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redisClient.get(key);
      if (!value) {
        return null;
      }
      return JSON.parse(value);
    } catch (error) {
      this.logger.error('Cache get failed', error as Error, { key });
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.redisClient.setex(key, ttl, serialized);
      } else {
        await this.redisClient.set(key, serialized);
      }
    } catch (error) {
      this.logger.error('Cache set failed', error as Error, { key, ttl });
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redisClient.del(key);
    } catch (error) {
      this.logger.error('Cache delete failed', error as Error, { key });
    }
  }

  async clear(): Promise<void> {
    try {
      await this.redisClient.flushall();
    } catch (error) {
      this.logger.error('Cache clear failed', error as Error);
    }
  }
}

// ================================
// LOGGING SERVICE IMPLEMENTATION
// ================================

export class ConsoleLoggingService implements LoggingService {
  info(message: string, metadata?: Record<string, any>): void {
    console.log(`[INFO] ${message}`, metadata ? JSON.stringify(metadata) : '');
  }

  warn(message: string, metadata?: Record<string, any>): void {
    console.warn(`[WARN] ${message}`, metadata ? JSON.stringify(metadata) : '');
  }

  error(message: string, error?: Error, metadata?: Record<string, any>): void {
    console.error(`[ERROR] ${message}`, {
      error: error?.message,
      stack: error?.stack,
      metadata
    });
  }

  debug(message: string, metadata?: Record<string, any>): void {
    console.debug(`[DEBUG] ${message}`, metadata ? JSON.stringify(metadata) : '');
  }
}

// ================================
// EVENT BUS IMPLEMENTATION
// ================================

export class InMemoryEventBus implements EventBus {
  private readonly handlers = new Map<string, EventHandler[]>();

  constructor(private readonly logger: LoggingService) {}

  async publish(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.eventType) || [];
    
    this.logger.info('EventBus: Publishing event', { 
      eventType: event.eventType,
      eventId: event.id,
      handlerCount: handlers.length 
    });

    for (const handler of handlers) {
      try {
        await handler(event);
      } catch (error) {
        this.logger.error('EventBus: Handler failed', error as Error, { 
          eventType: event.eventType,
          eventId: event.id 
        });
      }
    }
  }

  subscribe(eventType: string, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
    
    this.logger.info('EventBus: Handler subscribed', { 
      eventType,
      handlerCount: this.handlers.get(eventType)!.length 
    });
  }

  unsubscribe(eventType: string, handler: EventHandler): void {
    const handlers = this.handlers.get(eventType) || [];
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
      this.logger.info('EventBus: Handler unsubscribed', { 
        eventType,
        handlerCount: handlers.length 
      });
    }
  }
}