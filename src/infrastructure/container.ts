/**
 * 🔧 DEPENDENCY INJECTION CONTAINER
 * 
 * Enterprise DI container implementing Inversion of Control
 * Manages all dependencies across Clean Architecture layers
 * 
 * CRITICAL SETUP:
 * - Singleton patterns for shared services
 * - Environment-based configuration
 * - Proper service lifecycle management
 */

import { kv } from '@vercel/kv';

// Domain Layer
import {
  MLAPIClient,
  CacheService,
  LoggingService,
  EventBus,
  MLProductRepository,
  MLOrderRepository,
  MLUserRepository,
  ProductDomainService,
  OrderDomainService,
  UserDomainService
} from '../domain/core.js';

// Application Layer
import {
  MLApplicationService,
  GetProductsUseCase,
  GetProductByIdUseCase,
  GetOrdersUseCase,
  GetUserUseCase,
  GetProductMetricsUseCase,
  GetOrderMetricsUseCase,
  CreateProductUseCase
} from '../application/core.js';

// Infrastructure Layer
import {
  MLAPIClientImpl,
  MLAPIConfig,
  RedisCacheService,
  ConsoleLoggingService,
  InMemoryEventBus,
  MLProductRepositoryImpl,
  MLOrderRepositoryImpl,
  MLUserRepositoryImpl
} from '../infrastructure/core.js';

// Domain Services
import {
  ProductDomainServiceImpl,
  OrderDomainServiceImpl,
  UserDomainServiceImpl
} from '../domain/services.js';

// ================================
// CONFIGURATION
// ================================

export interface AppConfig {
  readonly ml: MLAPIConfig;
  readonly redis: {
    readonly url: string;
    readonly token: string;
  };
  readonly app: {
    readonly environment: 'development' | 'production' | 'test';
    readonly logLevel: 'debug' | 'info' | 'warn' | 'error';
    readonly baseUrl: string;
  };
}

export function createAppConfig(): AppConfig {
  return {
    ml: {
      baseUrl: 'https://api.mercadolibre.com',
      clientId: process.env.ML_CLIENT_ID || '',
      clientSecret: process.env.ML_CLIENT_SECRET || '',
      timeout: 30000, // 30 seconds
      rateLimits: {
        appCallsPerHour: 1000,
        userCallsPerDay: 5000,
        maxCallsPerMinute: 100
      }
    },
    redis: {
      url: process.env.UPSTASH_REDIS_REST_URL || '',
      token: process.env.UPSTASH_REDIS_REST_TOKEN || ''
    },
    app: {
      environment: (process.env.NODE_ENV as any) || 'development',
      logLevel: (process.env.LOG_LEVEL as any) || 'info',
      baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    }
  };
}

// ================================
// CONTAINER IMPLEMENTATION
// ================================

export class DIContainer {
  private static instance: DIContainer;
  private readonly services = new Map<string, any>();
  private readonly config: AppConfig;

  private constructor(config: AppConfig) {
    this.config = config;
    this.initializeServices();
  }

  public static getInstance(config?: AppConfig): DIContainer {
    if (!DIContainer.instance) {
      if (!config) {
        config = createAppConfig();
      }
      DIContainer.instance = new DIContainer(config);
    }
    return DIContainer.instance;
  }

  public static reset(): void {
    DIContainer.instance = null as any;
  }

  private initializeServices(): void {
    // Infrastructure Layer (Leaf dependencies)
    this.registerLoggingService();
    this.registerCacheService();
    this.registerEventBus();
    this.registerMLAPIClient();

    // Domain Services
    this.registerDomainServices();

    // Repositories
    this.registerRepositories();

    // Use Cases
    this.registerUseCases();

    // Application Service
    this.registerApplicationService();
  }

  private registerLoggingService(): void {
    const loggingService = new ConsoleLoggingService();
    this.services.set('LoggingService', loggingService);
  }

  private registerCacheService(): void {
    const loggingService = this.get<LoggingService>('LoggingService');
    
    // Use Vercel KV in production, in-memory cache for development
    if (this.config.app.environment === 'production' && this.config.redis.url) {
      const cacheService = new RedisCacheService(kv, loggingService);
      this.services.set('CacheService', cacheService);
    } else {
      // Simple in-memory cache for development
      const cacheService = new InMemoryCacheService(loggingService);
      this.services.set('CacheService', cacheService);
    }
  }

  private registerEventBus(): void {
    const loggingService = this.get<LoggingService>('LoggingService');
    const eventBus = new InMemoryEventBus(loggingService);
    this.services.set('EventBus', eventBus);
  }

  private registerMLAPIClient(): void {
    const cacheService = this.get<CacheService>('CacheService');
    const loggingService = this.get<LoggingService>('LoggingService');
    
    const apiClient = new MLAPIClientImpl(
      this.config.ml,
      cacheService,
      loggingService
    );
    
    this.services.set('MLAPIClient', apiClient);
  }

  private registerDomainServices(): void {
    const loggingService = this.get<LoggingService>('LoggingService');

    const productDomainService = new ProductDomainServiceImpl(loggingService);
    const orderDomainService = new OrderDomainServiceImpl(loggingService);
    const userDomainService = new UserDomainServiceImpl(loggingService);

    this.services.set('ProductDomainService', productDomainService);
    this.services.set('OrderDomainService', orderDomainService);
    this.services.set('UserDomainService', userDomainService);
  }

  private registerRepositories(): void {
    const apiClient = this.get<MLAPIClient>('MLAPIClient');
    const cacheService = this.get<CacheService>('CacheService');
    const loggingService = this.get<LoggingService>('LoggingService');

    const productRepository = new MLProductRepositoryImpl(apiClient, cacheService, loggingService);
    const orderRepository = new MLOrderRepositoryImpl(apiClient, cacheService, loggingService);
    const userRepository = new MLUserRepositoryImpl(apiClient, cacheService, loggingService);

    this.services.set('MLProductRepository', productRepository);
    this.services.set('MLOrderRepository', orderRepository);
    this.services.set('MLUserRepository', userRepository);
  }

  private registerUseCases(): void {
    // Dependencies
    const productRepository = this.get<MLProductRepository>('MLProductRepository');
    const orderRepository = this.get<MLOrderRepository>('MLOrderRepository');
    const userRepository = this.get<MLUserRepository>('MLUserRepository');
    
    const productDomainService = this.get<ProductDomainService>('ProductDomainService');
    const orderDomainService = this.get<OrderDomainService>('OrderDomainService');
    const userDomainService = this.get<UserDomainService>('UserDomainService');
    
    const cacheService = this.get<CacheService>('CacheService');
    const loggingService = this.get<LoggingService>('LoggingService');
    const eventBus = this.get<EventBus>('EventBus');

    // Query Use Cases
    const getProductsUseCase = new GetProductsUseCase(
      productRepository,
      productDomainService,
      cacheService,
      loggingService
    );

    const getProductByIdUseCase = new GetProductByIdUseCase(
      productRepository,
      cacheService,
      loggingService
    );

    const getOrdersUseCase = new GetOrdersUseCase(
      orderRepository,
      orderDomainService,
      cacheService,
      loggingService
    );

    const getUserUseCase = new GetUserUseCase(
      userRepository,
      userDomainService,
      cacheService,
      loggingService
    );

    const getProductMetricsUseCase = new GetProductMetricsUseCase(
      productRepository,
      productDomainService,
      cacheService,
      loggingService
    );

    const getOrderMetricsUseCase = new GetOrderMetricsUseCase(
      orderRepository,
      orderDomainService,
      cacheService,
      loggingService
    );

    // Command Use Cases
    const createProductUseCase = new CreateProductUseCase(
      productRepository,
      productDomainService,
      eventBus,
      loggingService
    );

    // Register all use cases
    this.services.set('GetProductsUseCase', getProductsUseCase);
    this.services.set('GetProductByIdUseCase', getProductByIdUseCase);
    this.services.set('GetOrdersUseCase', getOrdersUseCase);
    this.services.set('GetUserUseCase', getUserUseCase);
    this.services.set('GetProductMetricsUseCase', getProductMetricsUseCase);
    this.services.set('GetOrderMetricsUseCase', getOrderMetricsUseCase);
    this.services.set('CreateProductUseCase', createProductUseCase);
  }

  private registerApplicationService(): void {
    const getProductsUseCase = this.get<GetProductsUseCase>('GetProductsUseCase');
    const getProductByIdUseCase = this.get<GetProductByIdUseCase>('GetProductByIdUseCase');
    const getOrdersUseCase = this.get<GetOrdersUseCase>('GetOrdersUseCase');
    const getUserUseCase = this.get<GetUserUseCase>('GetUserUseCase');
    const getProductMetricsUseCase = this.get<GetProductMetricsUseCase>('GetProductMetricsUseCase');
    const getOrderMetricsUseCase = this.get<GetOrderMetricsUseCase>('GetOrderMetricsUseCase');
    const createProductUseCase = this.get<CreateProductUseCase>('CreateProductUseCase');
    const loggingService = this.get<LoggingService>('LoggingService');

    const applicationService = new MLApplicationService(
      getProductsUseCase,
      getProductByIdUseCase,
      getOrdersUseCase,
      getUserUseCase,
      getProductMetricsUseCase,
      getOrderMetricsUseCase,
      createProductUseCase,
      loggingService
    );

    this.services.set('MLApplicationService', applicationService);
  }

  public get<T>(serviceName: string): T {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service not found: ${serviceName}`);
    }
    return service;
  }

  public has(serviceName: string): boolean {
    return this.services.has(serviceName);
  }

  public getConfig(): AppConfig {
    return this.config;
  }
}

// ================================
// IN-MEMORY CACHE (Development)
// ================================

class InMemoryCacheService implements CacheService {
  private readonly cache = new Map<string, { value: any; expiry?: number }>();

  constructor(private readonly logger: LoggingService) {}

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check expiry
    if (item.expiry && item.expiry < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    this.logger.debug('InMemoryCache: Cache hit', { key });
    return item.value;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const expiry = ttl ? Date.now() + (ttl * 1000) : undefined;
    
    this.cache.set(key, { value, expiry });
    
    this.logger.debug('InMemoryCache: Cache set', { key, ttl });
  }

  async delete(key: string): Promise<void> {
    const deleted = this.cache.delete(key);
    this.logger.debug('InMemoryCache: Cache delete', { key, deleted });
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.logger.debug('InMemoryCache: Cache cleared');
  }
}

// ================================
// FACTORY FUNCTIONS
// ================================

export function createContainer(config?: AppConfig): DIContainer {
  return DIContainer.getInstance(config);
}

export function getApplicationService(config?: AppConfig): MLApplicationService {
  const container = createContainer(config);
  return container.get<MLApplicationService>('MLApplicationService');
}

export function getLoggingService(config?: AppConfig): LoggingService {
  const container = createContainer(config);
  return container.get<LoggingService>('LoggingService');
}

export function getCacheService(config?: AppConfig): CacheService {
  const container = createContainer(config);
  return container.get<CacheService>('CacheService');
}

// ================================
// WEBHOOK UTILITIES
// ================================

export interface WebhookConfig {
  readonly allowedIPs: string[];
  readonly secret: string;
  readonly timeoutMs: number;
}

export function createWebhookConfig(): WebhookConfig {
  return {
    allowedIPs: [
      '54.88.218.97',
      '18.215.140.160', 
      '18.213.114.129',
      '18.206.34.84'
    ],
    secret: process.env.WEBHOOK_SECRET || '',
    timeoutMs: 500 // CRITICAL: ML requires 500ms max response time
  };
}

export function validateWebhookIP(requestIP: string, config: WebhookConfig): boolean {
  return config.allowedIPs.includes(requestIP);
}

export function createWebhookTimeout(timeoutMs: number): AbortController {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller;
}

// ================================
// AUTHENTICATION UTILITIES
// ================================

export interface AuthConfig {
  readonly allowedUserIds: number[];
  readonly sessionTimeout: number;
}

export function createAuthConfig(): AuthConfig {
  const allowedIds = process.env.ALLOWED_USER_IDS || '';
  
  return {
    allowedUserIds: allowedIds
      .split(',')
      .map(id => parseInt(id.trim()))
      .filter(id => !isNaN(id)),
    sessionTimeout: 3600 // 1 hour
  };
}

export function isUserAuthorized(userId: number, config: AuthConfig): boolean {
  return config.allowedUserIds.includes(userId);
}

// ================================
// EXPORTS
// ================================

export {
  InMemoryCacheService
};