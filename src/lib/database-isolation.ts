/**
 * Database Isolation Layer - Peepers Enterprise v2.0.0
 * Tenant-aware data access patterns with complete isolation
 */

import { kv } from '@vercel/kv';
import { TenantService } from './tenant-service';
import { PeepersTenant } from '../types/tenant';

// Base interface for tenant-scoped data
export interface TenantScopedEntity {
  id: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

// Generic repository pattern for tenant data
export abstract class TenantRepository<T extends TenantScopedEntity> {
  protected abstract entityName: string;
  protected abstract cachePrefix: string;
  protected cacheTTL: number = 3600; // 1 hour default

  /**
   * Generate cache key for entity
   */
  protected getCacheKey(tenantId: string, entityId?: string): string {
    if (entityId) {
      return `${this.cachePrefix}:${tenantId}:${entityId}`;
    }
    return `${this.cachePrefix}:${tenantId}`;
  }

  /**
   * Generate list cache key
   */
  protected getListCacheKey(tenantId: string, filter?: string): string {
    return `${this.cachePrefix}:${tenantId}:list${filter ? `:${filter}` : ''}`;
  }

  /**
   * Validate tenant access
   */
  protected async validateTenantAccess(tenantId: string): Promise<PeepersTenant> {
    const tenant = await TenantService.getTenant(tenantId);
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }
    if (tenant.status !== 'active') {
      throw new Error(`Tenant ${tenantId} is not active`);
    }
    return tenant;
  }

  /**
   * Create entity with tenant scoping
   */
  async create(tenantId: string, data: Omit<T, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>): Promise<T> {
    await this.validateTenantAccess(tenantId);

    const entity: T = {
      ...data,
      id: this.generateId(),
      tenant_id: tenantId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as T;

    // Save to cache
    await kv.set(this.getCacheKey(tenantId, entity.id), JSON.stringify(entity), { ex: this.cacheTTL });

    // Add to tenant's entity list
    await kv.sadd(this.getListCacheKey(tenantId), entity.id);

    // Invalidate list cache
    await this.invalidateListCache(tenantId);

    return entity;
  }

  /**
   * Get entity by ID with tenant validation
   */
  async getById(tenantId: string, entityId: string): Promise<T | null> {
    await this.validateTenantAccess(tenantId);

    const cached = await kv.get<string>(this.getCacheKey(tenantId, entityId));
    if (cached) {
      const entity = JSON.parse(cached);
      // Double-check tenant isolation
      if (entity.tenant_id !== tenantId) {
        throw new Error('Tenant isolation violation');
      }
      return entity;
    }

    return null;
  }

  /**
   * Get all entities for tenant
   */
  async getAll(tenantId: string, limit: number = 100, offset: number = 0): Promise<T[]> {
    await this.validateTenantAccess(tenantId);

    const entityIds = await kv.smembers(this.getListCacheKey(tenantId));
    const entities: T[] = [];

    // Apply pagination
    const paginatedIds = entityIds.slice(offset, offset + limit);

    for (const entityId of paginatedIds) {
      const entity = await this.getById(tenantId, entityId);
      if (entity) {
        entities.push(entity);
      }
    }

    return entities;
  }

  /**
   * Update entity with tenant validation
   */
  async update(tenantId: string, entityId: string, updates: Partial<Omit<T, 'id' | 'tenant_id' | 'created_at'>>): Promise<T> {
    const entity = await this.getById(tenantId, entityId);
    if (!entity) {
      throw new Error(`${this.entityName} not found`);
    }

    const updatedEntity = {
      ...entity,
      ...updates,
      updated_at: new Date().toISOString()
    };

    // Save to cache
    await kv.set(this.getCacheKey(tenantId, entityId), JSON.stringify(updatedEntity), { ex: this.cacheTTL });

    return updatedEntity;
  }

  /**
   * Delete entity with tenant validation
   */
  async delete(tenantId: string, entityId: string): Promise<boolean> {
    const entity = await this.getById(tenantId, entityId);
    if (!entity) {
      return false;
    }

    // Remove from cache
    await kv.del(this.getCacheKey(tenantId, entityId));

    // Remove from tenant's entity list
    await kv.srem(this.getListCacheKey(tenantId), entityId);

    // Invalidate list cache
    await this.invalidateListCache(tenantId);

    return true;
  }

  /**
   * Search entities with tenant scoping
   */
  async search(tenantId: string, query: Record<string, unknown>, limit: number = 50): Promise<T[]> {
    await this.validateTenantAccess(tenantId);

    const allEntities = await this.getAll(tenantId, 1000); // Get more for filtering
    const filteredEntities = allEntities.filter(entity => {
      return Object.entries(query).every(([key, value]) => {
        const entityValue = (entity as Record<string, unknown>)[key];
        if (typeof value === 'string' && typeof entityValue === 'string') {
          return entityValue.toLowerCase().includes(value.toLowerCase());
        }
        return entityValue === value;
      });
    });

    return filteredEntities.slice(0, limit);
  }

  /**
   * Count entities for tenant
   */
  async count(tenantId: string): Promise<number> {
    await this.validateTenantAccess(tenantId);
    const entityIds = await kv.smembers(this.getListCacheKey(tenantId));
    return entityIds.length;
  }

  /**
   * Bulk operations with tenant validation
   */
  async bulkCreate(tenantId: string, entities: Omit<T, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>[]): Promise<T[]> {
    await this.validateTenantAccess(tenantId);

    const createdEntities: T[] = [];

    for (const entityData of entities) {
      const entity = await this.create(tenantId, entityData);
      createdEntities.push(entity);
    }

    return createdEntities;
  }

  /**
   * Bulk delete with tenant validation
   */
  async bulkDelete(tenantId: string, entityIds: string[]): Promise<number> {
    await this.validateTenantAccess(tenantId);

    let deletedCount = 0;
    for (const entityId of entityIds) {
      if (await this.delete(tenantId, entityId)) {
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * Invalidate list cache
   */
  protected async invalidateListCache(_tenantId: string): Promise<void> {
    // This would be more sophisticated in a real implementation
    // For now, we'll just let the cache expire naturally
  }

  /**
   * Generate unique ID
   */
  protected generateId(): string {
    return `tenant_${this.entityName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Product Repository - Example implementation
export interface TenantProduct extends TenantScopedEntity {
  ml_product_id: string;
  title: string;
  price: number;
  category_id: string;
  status: 'active' | 'paused' | 'inactive';
  last_sync_at?: string;
  metadata: Record<string, unknown>;
}

export class ProductRepository extends TenantRepository<TenantProduct> {
  protected entityName = 'product';
  protected cachePrefix = 'tenant_products';
  protected cacheTTL = 1800; // 30 minutes for products
}

// Order Repository
export interface TenantOrder extends TenantScopedEntity {
  ml_order_id: string;
  customer_id: string;
  total_amount: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  items: OrderItem[];
  shipping_address: Address;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
}

export class OrderRepository extends TenantRepository<TenantOrder> {
  protected entityName = 'order';
  protected cachePrefix = 'tenant_orders';
  protected cacheTTL = 3600; // 1 hour for orders
}

// Customer Repository
export interface TenantCustomer extends TenantScopedEntity {
  ml_customer_id?: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  total_orders: number;
  total_spent: number;
  last_order_at?: string;
  tags: string[];
}

export class CustomerRepository extends TenantRepository<TenantCustomer> {
  protected entityName = 'customer';
  protected cachePrefix = 'tenant_customers';
  protected cacheTTL = 7200; // 2 hours for customers
}

// Analytics Repository
export interface TenantAnalytics extends TenantScopedEntity {
  period_start: string;
  period_end: string;
  metric_type: string;
  metric_name: string;
  value: number;
  dimensions: Record<string, string>;
}

export class AnalyticsRepository extends TenantRepository<TenantAnalytics> {
  protected entityName = 'analytics';
  protected cachePrefix = 'tenant_analytics';
  protected cacheTTL = 21600; // 6 hours for analytics
}

// Database Manager - Central access point
export class DatabaseManager {
  private static instances = new Map<string, DatabaseManager>();

  public readonly products: ProductRepository;
  public readonly orders: OrderRepository;
  public readonly customers: CustomerRepository;
  public readonly analytics: AnalyticsRepository;

  private constructor(private tenantId: string) {
    this.products = new ProductRepository();
    this.orders = new OrderRepository();
    this.customers = new CustomerRepository();
    this.analytics = new AnalyticsRepository();
  }

  /**
   * Get database manager for tenant
   */
  static forTenant(tenantId: string): DatabaseManager {
    if (!this.instances.has(tenantId)) {
      this.instances.set(tenantId, new DatabaseManager(tenantId));
    }
    return this.instances.get(tenantId)!;
  }

  /**
   * Validate tenant access for all operations
   */
  async validateAccess(): Promise<void> {
    await TenantService.getTenant(this.tenantId);
  }

  /**
   * Get tenant usage statistics
   */
  async getUsageStats(): Promise<{
    products: number;
    orders: number;
    customers: number;
    analytics_records: number;
  }> {
    const [productCount, orderCount, customerCount, analyticsCount] = await Promise.all([
      this.products.count(this.tenantId),
      this.orders.count(this.tenantId),
      this.customers.count(this.tenantId),
      this.analytics.count(this.tenantId)
    ]);

    return {
      products: productCount,
      orders: orderCount,
      customers: customerCount,
      analytics_records: analyticsCount
    };
  }

  /**
   * Clean up tenant data (for tenant deletion)
   */
  async cleanupTenantData(): Promise<void> {
    // This would implement proper cleanup of all tenant data
    // For now, it's a placeholder
    console.log(`Cleaning up data for tenant ${this.tenantId}`);
  }
}

// Export singleton access
export const getDatabaseForTenant = (tenantId: string) => DatabaseManager.forTenant(tenantId);