/**
 * Order Repository Implementation - Infrastructure Layer
 * 
 * Implements IOrderRepository interface using Mercado Livre API
 * and cache layer following Clean Architecture principles
 */

import { 
  IOrderRepository, 
  RepositoryResult, 
  PaginatedResult 
} from '@/domain/repositories';
import { Order } from '@/domain/entities/Order';
import { PaginationParams } from '@/domain/entities/Product';
import { getKVClient } from '@/lib/cache';

export interface OrderFilters {
  status?: Order['status'];
  buyerId?: number;
  dateFrom?: Date;
  dateTo?: Date;
  sellerId?: number;
}

export class OrderRepository implements IOrderRepository {
  private readonly apiBaseUrl: string;
  
  constructor(apiBaseUrl?: string) {
    this.apiBaseUrl = apiBaseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://peepers.vercel.app');
  }

  // Helper method to get cached data
  private async getCachedData<T>(key: string): Promise<T | null> {
    try {
  const kv = getKVClient();
  return (await kv.get(key)) as T | null;
    } catch (error) {
      console.warn(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  // Helper method to set cached data
  private async setCachedData<T>(key: string, data: T, ttl: number): Promise<void> {
    try {
      const kv = getKVClient();
      await kv.set(key, data, { ex: ttl });
    } catch (error) {
      console.warn(`Cache set error for key ${key}:`, error);
    }
  }

  async findAll(
    filters?: OrderFilters,
    pagination?: PaginationParams
  ): Promise<RepositoryResult<PaginatedResult<Order>>> {
    try {
      // Use real sales data based on actual products
      const salesResponse = await fetch(`${this.apiBaseUrl}/api/admin/sales?days=30`);
      
      if (!salesResponse.ok) {
        throw new Error('Failed to fetch sales data');
      }
      
      const salesData = await salesResponse.json();
      
      if (!salesData.success) {
        throw new Error('Sales API returned error');
      }
      
      // Convert sales to Order entities
      const orders: Order[] = salesData.data.sales.map((sale: any) => {
        return new Order(
          sale.id,
          sale.status === 'completed' ? 'paid' : 'payment_in_process',
          sale.status === 'completed' ? 'approved' : 'pending',
          new Date(sale.date),
          new Date(sale.date),
          sale.status === 'completed' ? new Date(sale.date) : undefined,
          sale.currency,
          sale.sale_price * sale.quantity,
          sale.sale_price * sale.quantity + (sale.shipping?.cost || 0),
          sale.sale_price * sale.quantity,
          undefined,
          [
            {
              item: {
                id: sale.product_id,
                title: sale.product_title,
                category_id: 'MLB5672', // Default category
                variation_id: undefined,
                seller_custom_field: undefined,
                variation_attributes: []
              },
              quantity: sale.quantity,
              unit_price: sale.sale_price,
              currency_id: sale.currency,
              full_unit_price: sale.sale_price,
              seller_sku: undefined
            }
          ],
          {
            id: sale.buyer.id,
            nickname: sale.buyer.nickname,
            email: `${sale.buyer.nickname}@example.com`,
            first_name: sale.buyer.nickname.split('_')[0] || 'Cliente',
            last_name: sale.buyer.nickname.split('_')[1] || 'ML',
            phone: {
              area_code: '11',
              number: '99999-9999'
            }
          },
          669073070 // Your seller ID
        );
      });

      // Apply filters if provided
      let filteredOrders = orders;
      
      if (filters) {
        if (filters.status) {
          filteredOrders = filteredOrders.filter((order: Order) => order.status === filters.status);
        }
        if (filters.buyerId && filteredOrders.some((order: Order) => order.buyer)) {
          filteredOrders = filteredOrders.filter((order: Order) => order.buyer?.id === filters.buyerId);
        }
        if (filters.dateFrom) {
          filteredOrders = filteredOrders.filter((order: Order) => order.date_created >= filters.dateFrom!);
        }
        if (filters.dateTo) {
          filteredOrders = filteredOrders.filter((order: Order) => order.date_created <= filters.dateTo!);
        }
      }

      // Apply pagination
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 50;
      const offset = pagination?.offset || (page - 1) * limit;
      
      const paginatedOrders = filteredOrders.slice(offset, offset + limit);
      
      const result: PaginatedResult<Order> = {
        items: paginatedOrders,
        pagination: {
          total: filteredOrders.length,
          page,
          limit,
          totalPages: Math.ceil(filteredOrders.length / limit),
          hasNext: offset + limit < filteredOrders.length,
          hasPrevious: page > 1
        }
      };

      return {
        success: true,
        data: result,
        timestamp: new Date()
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    }
  }

  async findById(id: string): Promise<RepositoryResult<Order>> {
    try {
      const cacheKey = `order_${id}`;
      const cached = await this.getCachedData<Order>(cacheKey);
      
      if (cached) {
        return {
          success: true,
          data: cached,
          timestamp: new Date()
        };
      }

      // Mock implementation - in real scenario would call ML Orders API
      const mockOrder = new Order(
        id,
        'paid',
        'approved',
        new Date('2024-12-15T10:00:00Z'),
        new Date('2024-12-15T10:30:00Z'),
        new Date('2024-12-15T10:30:00Z'),
        'BRL',
        299.99,
        315.98,
        299.99,
        undefined,
        [],
        {
          id: 123456,
          nickname: 'buyer_user',
          email: 'buyer@example.com',
          first_name: 'João',
          last_name: 'Silva',
          phone: {
            area_code: '11',
            number: '99999-9999'
          }
        },
        789012
      );

      // Cache for 10 minutes
      await this.setCachedData(cacheKey, mockOrder, 600);

      return {
        success: true,
        data: mockOrder,
        timestamp: new Date()
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    }
  }

  async findBySeller(_sellerId: number, pagination?: PaginationParams): Promise<RepositoryResult<PaginatedResult<Order>>> {
    // For now, assume all orders belong to the authenticated seller
    return this.findAll(undefined, pagination);
  }

  async findByBuyer(buyerId: number, pagination?: PaginationParams): Promise<RepositoryResult<PaginatedResult<Order>>> {
    return this.findAll({ buyerId }, pagination);
  }

  async findByStatus(status: Order['status'], pagination?: PaginationParams): Promise<RepositoryResult<PaginatedResult<Order>>> {
    return this.findAll({ status }, pagination);
  }

  async findByDateRange(dateFrom: Date, dateTo: Date, pagination?: PaginationParams): Promise<RepositoryResult<PaginatedResult<Order>>> {
    return this.findAll({ dateFrom, dateTo }, pagination);
  }

  async getStatistics(_sellerId?: number, _dateFrom?: Date, _dateTo?: Date): Promise<RepositoryResult<{
    total: number;
    byStatus: Record<Order['status'], number>;
    totalRevenue: number;
    totalProfit: number;
    averageOrderValue: number;
    conversionRate: number;
  }>> {
    try {
      const result = await this.findAll();
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch orders for statistics');
      }

      const orders = result.data.items;
      
      const byStatus: Record<Order['status'], number> = {
        confirmed: orders.filter(o => o.status === 'confirmed').length,
        payment_required: orders.filter(o => o.status === 'payment_required').length,
        payment_in_process: orders.filter(o => o.status === 'payment_in_process').length,
        paid: orders.filter(o => o.status === 'paid').length,
        shipped: orders.filter(o => o.status === 'shipped').length,
        delivered: orders.filter(o => o.status === 'delivered').length,
        cancelled: orders.filter(o => o.status === 'cancelled').length
      };

      const stats = {
        total: orders.length,
        byStatus,
        totalRevenue: orders.reduce((sum, o) => sum + o.total_amount, 0),
        totalProfit: orders.reduce((sum, o) => sum + (o.total_amount * 0.1), 0), // Mock 10% profit margin
        averageOrderValue: orders.length > 0 ? orders.reduce((sum, o) => sum + o.total_amount, 0) / orders.length : 0,
        conversionRate: 0.15 // Mock 15% conversion rate
      };

      // Cache stats for 5 minutes
      await this.setCachedData('order_statistics', stats, 300);

      return {
        success: true,
        data: stats,
        timestamp: new Date()
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    }
  }

  async findNeedingAttention(_sellerId?: number): Promise<RepositoryResult<Order[]>> {
    try {
      const result = await this.findAll();
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch orders');
      }

      const ordersNeedingAttention = result.data.items.filter(order => 
        order.needsAttention()
      );

      return {
        success: true,
        data: ordersNeedingAttention,
        timestamp: new Date()
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    }
  }

  async addTracking(_id: string, _trackingNumber: string, _trackingUrl?: string): Promise<RepositoryResult<Order>> {
    return {
      success: false,
      error: 'Add tracking operation not implemented yet',
      timestamp: new Date()
    };
  }

  async getSalesMetrics(_sellerId: number, _period: 'day' | 'week' | 'month' | 'year'): Promise<RepositoryResult<{
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
  }>> {
    try {
      // Mock implementation
      const mockData = {
        sales: [
          {
            date: new Date('2024-12-14'),
            orders: 5,
            revenue: 1500.00,
            profit: 150.00
          },
          {
            date: new Date('2024-12-15'),
            orders: 8,
            revenue: 2400.00,
            profit: 240.00
          }
        ],
        summary: {
          totalOrders: 13,
          totalRevenue: 3900.00,
          totalProfit: 390.00,
          averageOrderValue: 300.00,
          growthRate: 0.20
        }
      };

      return {
        success: true,
        data: mockData,
        timestamp: new Date()
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    }
  }

  // Write operations - not implemented yet (would require ML API authentication)
  async updateStatus(_id: string, _status: Order['status']): Promise<RepositoryResult<Order>> {
    return {
      success: false,
      error: 'Update status operation not implemented yet',
      timestamp: new Date()
    };
  }

  async addNote(_id: string, _note: string): Promise<RepositoryResult<Order>> {
    return {
      success: false,
      error: 'Add note operation not implemented yet',
      timestamp: new Date()
    };
  }

  async updateShippingStatus(_id: string, _status: string): Promise<RepositoryResult<Order>> {
    return {
      success: false,
      error: 'Update shipping status operation not implemented yet',
      timestamp: new Date()
    };
  }

  async syncFromExternal(_sellerId: number): Promise<RepositoryResult<{ synced: number; errors: string[] }>> {
    try {
      // Mock sync operation
      return {
        success: true,
        data: { synced: 0, errors: ['Sync operation not fully implemented'] },
        timestamp: new Date()
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    }
  }
}