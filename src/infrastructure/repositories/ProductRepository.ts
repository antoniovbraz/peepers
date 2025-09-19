/**
 * Product Repository Implementation - Infrastructure Layer
 * 
 * Implements IProductRepository interface using Mercado Livre API
 * and cache layer following Clean Architecture principles
 */

import { API_ENDPOINTS } from '@/config/routes';
import { 
  IProductRepository, 
  RepositoryResult, 
  PaginatedResult 
} from '@/domain/repositories';
import { Product, ProductFilters, PaginationParams } from '@/domain/entities/Product';
import { getKVClient } from '@/lib/cache';

export class ProductRepository implements IProductRepository {
  private readonly apiBaseUrl: string;
  private readonly isAdminContext: boolean;
  
  constructor(apiBaseUrl?: string, isAdminContext: boolean = false) {
    this.apiBaseUrl = apiBaseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://peepers.vercel.app');
    this.isAdminContext = isAdminContext;
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

  // Mock admin products method for server-side use
  private async getMockAdminProducts(
    filters?: ProductFilters,
    pagination?: PaginationParams
  ): Promise<RepositoryResult<PaginatedResult<Product>>> {
    try {
      // Mock admin products data
      const mockProducts = [
        {
          id: "MLB123456789",
          title: "Camiseta Básica Premium",
          price: 29.90,
          status: "active" as const,
          available_quantity: 50,
          category: "Roupas",
          condition: "new" as const,
          permalink: "https://produto.mercadolivre.com.br/MLB123456789",
          thumbnail: "https://http2.mlstatic.com/mock-image-1.jpg",
          visits: 120,
          sold_quantity: 5
        },
        {
          id: "MLB987654321", 
          title: "Calça Jeans Masculina",
          price: 89.90,
          status: "paused" as const,
          available_quantity: 25,
          category: "Roupas",
          condition: "new" as const,
          permalink: "https://produto.mercadolivre.com.br/MLB987654321",
          thumbnail: "https://http2.mlstatic.com/mock-image-2.jpg",
          visits: 85,
          sold_quantity: 2
        },
        {
          id: "MLB555444333",
          title: "Tênis Esportivo Unissex",
          price: 159.99,
          status: "active" as const, 
          available_quantity: 0,
          category: "Calçados",
          condition: "new" as const,
          permalink: "https://produto.mercadolivre.com.br/MLB555444333",
          thumbnail: "https://http2.mlstatic.com/mock-image-3.jpg",
          visits: 200,
          sold_quantity: 15
        },
        {
          id: "MLB777888999",
          title: "Mochila Executiva",
          price: 120.00,
          status: "active" as const,
          available_quantity: 3,
          category: "Acessórios",
          condition: "new" as const, 
          permalink: "https://produto.mercadolivre.com.br/MLB777888999",
          thumbnail: "https://http2.mlstatic.com/mock-image-4.jpg",
          visits: 75,
          sold_quantity: 8
        },
        {
          id: "MLB111222333",
          title: "Relógio Digital",
          price: 45.50,
          status: "closed" as const,
          available_quantity: 0,
          category: "Eletrônicos",
          condition: "new" as const,
          permalink: "https://produto.mercadolivre.com.br/MLB111222333",
          thumbnail: "https://http2.mlstatic.com/mock-image-5.jpg",
          visits: 90,
          sold_quantity: 12
        }
      ];

      // Transform mock data to Product entities
      const products = mockProducts.map(item => Product.fromMLResponse(item));

      const result: PaginatedResult<Product> = {
        items: products,
        pagination: {
          total: products.length,
          page: pagination?.page || 1,
          limit: pagination?.limit || 50,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false
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
        error: error instanceof Error ? error.message : 'Failed to get mock admin products',
        timestamp: new Date()
      };
    }
  }

  async findAll(
    filters?: ProductFilters,
    pagination?: PaginationParams
  ): Promise<RepositoryResult<PaginatedResult<Product>>> {
    try {
      // If in admin context and server-side, use mock data to avoid circular API calls
      if (this.isAdminContext && typeof window === 'undefined') {
        return this.getMockAdminProducts(filters, pagination);
      }

      // Build query string
      const params = new URLSearchParams();
      
      if (pagination) {
        params.append('page', pagination.page.toString());
        params.append('limit', pagination.limit.toString());
      }
      
      if (filters) {
        if (filters.categoryId) params.append('category', filters.categoryId);
        if (filters.condition) params.append('condition', filters.condition);
        if (filters.priceMin) params.append('price_min', filters.priceMin.toString());
        if (filters.priceMax) params.append('price_max', filters.priceMax.toString());
        if (filters.status) params.append('status', filters.status);
        if (filters.hasFreeShipping !== undefined) {
          params.append('free_shipping', filters.hasFreeShipping.toString());
        }
      }

      params.append('format', 'full');
      
      // Use admin endpoint if in admin context
      const endpoint = this.isAdminContext ? API_ENDPOINTS.ADMIN_PRODUCTS : API_ENDPOINTS.PRODUCTS;
      const url = `${this.apiBaseUrl}${endpoint}?${params.toString()}`;
      
      // Try cache first
      const cacheKey = `products_${this.isAdminContext ? 'admin_' : ''}${params.toString()}`;
      const cached = await this.getCachedData<PaginatedResult<Product>>(cacheKey);
      
      if (cached) {
        return {
          success: true,
          data: cached,
          timestamp: new Date()
        };
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const rawData = await response.json();
      
      if (!rawData.success) {
        throw new Error(rawData.error || 'Failed to fetch products');
      }

      // Transform API response to domain entities
      const products = rawData.data.items.map((item: Record<string, unknown>) => {
        try {
          return Product.fromMLResponse(item);
        } catch (error) {
          // Log problematic product for debugging
          console.error('❌ Error creating Product from ML data:', {
            id: item.id,
            title: item.title,
            titleLength: item.title ? (item.title as string).length : 0,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          
          // Skip this product instead of failing the entire request
          return null;
        }
      }).filter(Boolean) as Product[];

      const result: PaginatedResult<Product> = {
        items: products,
        pagination: {
          total: rawData.data.total || 0,
          page: rawData.data.page || 1,
          limit: rawData.data.limit || 50,
          totalPages: rawData.data.totalPages || 1,
          hasNext: rawData.data.hasNext || false,
          hasPrevious: rawData.data.hasPrev || false
        }
      };

      // Cache result for 10 minutes
      await this.setCachedData(cacheKey, result, 600);

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

  async findById(id: string): Promise<RepositoryResult<Product>> {
    try {
      const cacheKey = `product_${id}`;
      const cached = await this.getCachedData<Product>(cacheKey);
      
      if (cached) {
        return {
          success: true,
          data: cached,
          timestamp: new Date()
        };
      }

      const url = `${this.apiBaseUrl}${API_ENDPOINTS.PRODUCTS}?id=${id}&format=full`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const rawData = await response.json();
      
      if (!rawData.success || !rawData.data.products.length) {
        throw new Error('Product not found');
      }

      const product = Product.fromMLResponse(rawData.data.products[0]);
      
      // Cache for 30 minutes
      await this.setCachedData(cacheKey, product, 1800);

      return {
        success: true,
        data: product,
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

  async findByIds(ids: string[]): Promise<RepositoryResult<Product[]>> {
    try {
      const results = await Promise.all(
        ids.map(id => this.findById(id))
      );

      const products: Product[] = [];
      const errors: string[] = [];

      results.forEach((result, index) => {
        if (result.success && result.data) {
          products.push(result.data);
        } else {
          errors.push(`Product ${ids[index]}: ${result.error}`);
        }
      });

      return {
        success: true,
        data: products,
        error: errors.length > 0 ? `Some products failed: ${errors.join(', ')}` : undefined,
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

  async getStatistics(sellerId?: number): Promise<RepositoryResult<{
    total: number;
    active: number;
    paused: number;
    closed: number;
    outOfStock: number;
    lowStock: number;
    totalValue: number;
    averagePrice: number;
  }>> {
    try {
      // If in admin context and server-side, try to fetch real ML data first
      if (this.isAdminContext && typeof window === 'undefined') {
        try {
          console.log('🔄 Tentando buscar produtos reais do ML para estatísticas...');

          // Try to fetch real products from ML API
          const realProductsResponse = await fetch(`${this.apiBaseUrl}/api/products?limit=1000`, {
            headers: {
              'Cookie': `user_id=${sellerId}; session_token=dummy_session`,
              'Content-Type': 'application/json',
            },
            credentials: 'include'
          });

          if (realProductsResponse.ok) {
            const realProductsData = await realProductsResponse.json();
            if (realProductsData.success && realProductsData.data?.items) {
              const products = realProductsData.data.items;

              console.log(`✅ Buscados ${products.length} produtos reais do ML para estatísticas`);

              const stats = {
                total: products.length,
                active: products.filter((p: Record<string, unknown>) => p.status === 'active').length,
                paused: products.filter((p: Record<string, unknown>) => p.status === 'paused').length,
                closed: products.filter((p: Record<string, unknown>) => p.status === 'closed').length,
                outOfStock: products.filter((p: Record<string, unknown>) => (p.available_quantity as number || 0) === 0).length,
                lowStock: products.filter((p: Record<string, unknown>) => ((p.available_quantity as number || 0) < 5) && ((p.available_quantity as number || 0) > 0)).length,
                totalValue: products.reduce((sum: number, p: Record<string, unknown>) => sum + (((p.price as number) || 0) * ((p.available_quantity as number) || 0)), 0),
                averagePrice: products.length > 0 ? products.reduce((sum: number, p: Record<string, unknown>) => sum + ((p.price as number) || 0), 0) / products.length : 0
              };

              // Cache stats for 5 minutes
              await this.setCachedData('product_statistics_real', stats, 300);

              return {
                success: true,
                data: stats,
                timestamp: new Date()
              };
            }
          }

          console.warn('❌ Falha ao buscar produtos reais do ML, usando dados mockados');
        } catch (error) {
          console.warn('❌ Erro ao buscar produtos reais do ML:', error);
        }
      }

      // Fallback: Get all products to calculate statistics (using existing mock data)
      const result = await this.findAll(undefined, { page: 1, limit: 1000, offset: 0 });
      
      if (!result.success || !result.data) {
        const errorMessage = result.error || 'Failed to fetch products for statistics';
        console.error('❌ Product stats error:', errorMessage);
        throw new Error(`Product stats error: ${errorMessage}`);
      }

      const products = result.data.items;
      
      const stats = {
        total: products.length,
        active: products.filter(p => p.status === 'active').length,
        paused: products.filter(p => p.status === 'paused').length,
        closed: products.filter(p => p.status === 'closed').length,
        outOfStock: products.filter(p => (p.available_quantity || 0) === 0).length,
        lowStock: products.filter(p => (p.available_quantity || 0) < 5 && (p.available_quantity || 0) > 0).length,
        totalValue: products.reduce((sum, p) => sum + ((p.price || 0) * (p.available_quantity || 0)), 0),
        averagePrice: products.length > 0 ? products.reduce((sum, p) => sum + (p.price || 0), 0) / products.length : 0
      };

      // Cache stats for 5 minutes
      await this.setCachedData('product_statistics', stats, 300);

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

  async findBySeller(_sellerId: number, pagination?: PaginationParams): Promise<RepositoryResult<PaginatedResult<Product>>> {
    // For now, we assume all products belong to the authenticated seller
    return this.findAll(undefined, pagination);
  }

  async findByCategory(categoryId: string, pagination?: PaginationParams): Promise<RepositoryResult<PaginatedResult<Product>>> {
    return this.findAll({ categoryId }, pagination);
  }

  async search(query: string, pagination?: PaginationParams): Promise<RepositoryResult<PaginatedResult<Product>>> {
    try {
      // Implementation would depend on ML API search capabilities
      // For now, filter by title
      const result = await this.findAll(undefined, pagination);
      
      if (!result.success || !result.data) {
        return result;
      }

      const filteredProducts = result.data.items.filter(product =>
        product.title.toLowerCase().includes(query.toLowerCase())
      );

      return {
        success: true,
        data: {
          ...result.data,
          items: filteredProducts
        },
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

  async findNeedingAttention(_sellerId?: number): Promise<RepositoryResult<Product[]>> {
    try {
      const result = await this.findAll();
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch products');
      }

      const productsNeedingAttention = result.data.items.filter(product => 
        product.needsAttention() || product.isOutOfStock()
      );

      return {
        success: true,
        data: productsNeedingAttention,
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

  async findByStatus(status: 'active' | 'paused' | 'closed', pagination?: PaginationParams): Promise<RepositoryResult<PaginatedResult<Product>>> {
    return this.findAll({ status }, pagination);
  }

  // Write operations - not implemented yet (would require ML API authentication)
  async create(_product: Omit<Product, 'id' | 'date_created' | 'last_updated'>): Promise<RepositoryResult<Product>> {
    return {
      success: false,
      error: 'Create operation not implemented yet',
      timestamp: new Date()
    };
  }

  async update(_id: string, _product: Partial<Product>): Promise<RepositoryResult<Product>> {
    return {
      success: false,
      error: 'Update operation not implemented yet',
      timestamp: new Date()
    };
  }

  async delete(_id: string): Promise<RepositoryResult<boolean>> {
    return {
      success: false,
      error: 'Delete operation not implemented yet',
      timestamp: new Date()
    };
  }

  async updateStock(_id: string, _quantity: number): Promise<RepositoryResult<Product>> {
    return {
      success: false,
      error: 'Stock update operation not implemented yet',
      timestamp: new Date()
    };
  }

  async updatePrice(_id: string, _price: number): Promise<RepositoryResult<Product>> {
    return {
      success: false,
      error: 'Price update operation not implemented yet',
      timestamp: new Date()
    };
  }

  async updateStatus(_id: string, _status: Product['status']): Promise<RepositoryResult<Product>> {
    return {
      success: false,
      error: 'Status update operation not implemented yet',
      timestamp: new Date()
    };
  }

  async bulkUpdate(_updates: Array<{ id: string; data: Partial<Product> }>): Promise<RepositoryResult<Product[]>> {
    return {
      success: false,
      error: 'Bulk update operation not implemented yet',
      timestamp: new Date()
    };
  }

  async syncFromExternal(_sellerId: number): Promise<RepositoryResult<{ synced: number; errors: string[] }>> {
    try {
      // Clear cache to force fresh data
      // In a real implementation, this would sync with ML API
      
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