/**
 * Repository Interfaces - Clean Architecture Domain Layer
 * 
 * These interfaces define the contracts for data access without
 * depending on specific implementations (database, cache, API, etc.).
 * This follows the Dependency Inversion Principle.
 */

import { Product, ProductFilters, PaginationParams } from '../entities/Product';
import { Order } from '../entities/Order';
import { Seller } from '../entities/Seller';

// Common types for all repositories
export interface RepositoryResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

/**
 * Product Repository Interface
 * 
 * Defines all operations related to product data access
 */
export interface IProductRepository {
  /**
   * Get all products with optional filtering and pagination
   */
  findAll(
    filters?: ProductFilters,
    pagination?: PaginationParams
  ): Promise<RepositoryResult<PaginatedResult<Product>>>;

  /**
   * Get a product by its ID
   */
  findById(id: string): Promise<RepositoryResult<Product>>;

  /**
   * Get multiple products by their IDs
   */
  findByIds(ids: string[]): Promise<RepositoryResult<Product[]>>;

  /**
   * Get products by seller ID
   */
  findBySeller(sellerId: number, pagination?: PaginationParams): Promise<RepositoryResult<PaginatedResult<Product>>>;

  /**
   * Get products by category
   */
  findByCategory(categoryId: string, pagination?: PaginationParams): Promise<RepositoryResult<PaginatedResult<Product>>>;

  /**
   * Search products by title or description
   */
  search(query: string, pagination?: PaginationParams): Promise<RepositoryResult<PaginatedResult<Product>>>;

  /**
   * Get products that need attention (low stock, paused, etc.)
   */
  findNeedingAttention(sellerId?: number): Promise<RepositoryResult<Product[]>>;

  /**
   * Get products by status
   */
  findByStatus(status: Product['status'], pagination?: PaginationParams): Promise<RepositoryResult<PaginatedResult<Product>>>;

  /**
   * Create a new product
   */
  create(product: Omit<Product, 'id' | 'date_created' | 'last_updated'>): Promise<RepositoryResult<Product>>;

  /**
   * Update an existing product
   */
  update(id: string, product: Partial<Product>): Promise<RepositoryResult<Product>>;

  /**
   * Delete a product
   */
  delete(id: string): Promise<RepositoryResult<boolean>>;

  /**
   * Update product stock
   */
  updateStock(id: string, quantity: number): Promise<RepositoryResult<Product>>;

  /**
   * Update product price
   */
  updatePrice(id: string, price: number): Promise<RepositoryResult<Product>>;

  /**
   * Update product status (active, paused, closed)
   */
  updateStatus(id: string, status: Product['status']): Promise<RepositoryResult<Product>>;

  /**
   * Bulk update multiple products
   */
  bulkUpdate(updates: Array<{ id: string; data: Partial<Product> }>): Promise<RepositoryResult<Product[]>>;

  /**
   * Get product statistics
   */
  getStatistics(sellerId?: number): Promise<RepositoryResult<{
    total: number;
    active: number;
    paused: number;
    closed: number;
    outOfStock: number;
    lowStock: number;
    totalValue: number;
    averagePrice: number;
  }>>;

  /**
   * Sync products from external source (Mercado Livre API)
   */
  syncFromExternal(sellerId: number): Promise<RepositoryResult<{ synced: number; errors: string[] }>>;
}

/**
 * Order Repository Interface
 * 
 * Defines all operations related to order data access
 */
export interface IOrderRepository {
  /**
   * Get all orders with optional filtering and pagination
   */
  findAll(
    filters?: {
      sellerId?: number;
      status?: Order['status'];
      dateFrom?: Date;
      dateTo?: Date;
      buyerId?: number;
    },
    pagination?: PaginationParams
  ): Promise<RepositoryResult<PaginatedResult<Order>>>;

  /**
   * Get an order by its ID
   */
  findById(id: string): Promise<RepositoryResult<Order>>;

  /**
   * Get orders by seller ID
   */
  findBySeller(sellerId: number, pagination?: PaginationParams): Promise<RepositoryResult<PaginatedResult<Order>>>;

  /**
   * Get orders by buyer ID
   */
  findByBuyer(buyerId: number, pagination?: PaginationParams): Promise<RepositoryResult<PaginatedResult<Order>>>;

  /**
   * Get orders by status
   */
  findByStatus(status: Order['status'], pagination?: PaginationParams): Promise<RepositoryResult<PaginatedResult<Order>>>;

  /**
   * Get orders that need attention
   */
  findNeedingAttention(sellerId?: number): Promise<RepositoryResult<Order[]>>;

  /**
   * Get orders for a specific date range
   */
  findByDateRange(dateFrom: Date, dateTo: Date, pagination?: PaginationParams): Promise<RepositoryResult<PaginatedResult<Order>>>;

  /**
   * Update order status
   */
  updateStatus(id: string, status: Order['status']): Promise<RepositoryResult<Order>>;

  /**
   * Add tracking information to order
   */
  addTracking(id: string, trackingNumber: string, trackingUrl?: string): Promise<RepositoryResult<Order>>;

  /**
   * Get order statistics
   */
  getStatistics(sellerId?: number, dateFrom?: Date, dateTo?: Date): Promise<RepositoryResult<{
    total: number;
    byStatus: Record<Order['status'], number>;
    totalRevenue: number;
    totalProfit: number;
    averageOrderValue: number;
    conversionRate: number;
  }>>;

  /**
   * Get sales metrics
   */
  getSalesMetrics(sellerId: number, period: 'day' | 'week' | 'month' | 'year'): Promise<RepositoryResult<{
    sales: Array<{
      date: Date;
      orders: number;
      revenue: number;
      profit: number;
    }>;
    summary: {
      totalOrders: number;
      totalRevenue: number;
      totalProfit: number;
      averageOrderValue: number;
      growthRate: number;
    };
  }>>;

  /**
   * Sync orders from external source (Mercado Livre API)
   */
  syncFromExternal(sellerId: number): Promise<RepositoryResult<{ synced: number; errors: string[] }>>;
}

/**
 * Seller Repository Interface
 * 
 * Defines all operations related to seller data access
 */
export interface ISellerRepository {
  /**
   * Get a seller by ID
   */
  findById(id: number): Promise<RepositoryResult<Seller>>;

  /**
   * Get seller by nickname
   */
  findByNickname(nickname: string): Promise<RepositoryResult<Seller>>;

  /**
   * Get current authenticated seller
   */
  getCurrentSeller(): Promise<RepositoryResult<Seller>>;

  /**
   * Update seller information
   */
  update(id: number, seller: Partial<Seller>): Promise<RepositoryResult<Seller>>;

  /**
   * Get seller reputation metrics
   */
  getReputationMetrics(id: number): Promise<RepositoryResult<{
    score: number;
    level: string;
    transactions: number;
    claims: number;
    delayedHandling: number;
    powerSellerLevel: string | null;
  }>>;

  /**
   * Get seller performance metrics
   */
  getPerformanceMetrics(id: number, period: 'week' | 'month' | 'quarter' | 'year'): Promise<RepositoryResult<{
    sales: {
      total: number;
      growth: number;
    };
    reputation: {
      score: number;
      trend: number;
    };
    products: {
      active: number;
      views: number;
      conversion: number;
    };
    orders: {
      pending: number;
      shipped: number;
      delivered: number;
      problems: number;
    };
  }>>;

  /**
   * Sync seller data from external source (Mercado Livre API)
   */
  syncFromExternal(id: number): Promise<RepositoryResult<Seller>>;

  /**
   * Check if seller needs attention
   */
  checkSellerHealth(id: number): Promise<RepositoryResult<{
    needsAttention: boolean;
    issues: Array<{
      type: 'reputation' | 'performance' | 'compliance' | 'account';
      severity: 'low' | 'medium' | 'high' | 'critical';
      message: string;
      actionRequired?: string;
    }>;
  }>>;
}

/**
 * Cache Repository Interface
 * 
 * Defines operations for caching data to improve performance
 */
export interface ICacheRepository {
  /**
   * Get data from cache
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Set data in cache with optional TTL
   */
  set<T>(key: string, data: T, ttlSeconds?: number): Promise<boolean>;

  /**
   * Delete data from cache
   */
  delete(key: string): Promise<boolean>;

  /**
   * Delete multiple keys from cache
   */
  deleteMany(keys: string[]): Promise<number>;

  /**
   * Clear all cache data
   */
  clear(): Promise<boolean>;

  /**
   * Check if key exists in cache
   */
  exists(key: string): Promise<boolean>;

  /**
   * Get cache statistics
   */
  getStats(): Promise<{
    hits: number;
    misses: number;
    hitRate: number;
    totalKeys: number;
  }>;

  /**
   * Get keys matching pattern
   */
  getKeys(pattern: string): Promise<string[]>;

  /**
   * Set cache with expiration at specific time
   */
  setExpireAt<T>(key: string, data: T, expireAt: Date): Promise<boolean>;

  /**
   * Increment numeric value in cache
   */
  increment(key: string, by?: number): Promise<number>;

  /**
   * Decrement numeric value in cache
   */
  decrement(key: string, by?: number): Promise<number>;
}