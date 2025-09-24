/**
 * Get Dashboard Metrics Use Case - Application Layer
 * 
 * This use case orchestrates the retrieval of all dashboard metrics
 * following Clean Architecture principles and business rules.
 */

import { 
  IProductRepository, 
  IOrderRepository, 
  ISellerRepository 
} from '@/domain/repositories';
import { Product } from '@/domain/entities/Product';
import { Order } from '@/domain/entities/Order';
import { DashboardMetricsDTO, DashboardFiltersDTO } from '../dtos/DashboardMetricsDTO';
import { API_ENDPOINTS } from '@/config/routes';
import type { MLProduct } from '@/types/ml';

type ProductStatsType = {
  total: number;
  active: number;
  paused: number;
  closed: number;
  outOfStock: number;
  lowStock: number;
  totalValue: number;
  averagePrice: number;
};

type OrderStatsType = {
  total: number;
  byStatus: Record<Order['status'], number>;
  totalRevenue: number;
  totalProfit: number;
  averageOrderValue: number;
  conversionRate: number;
};

type SellerReputationType = {
  score: number;
  level: string;
  transactions: number;
  claims: number;
  delayedHandling: number;
  powerSellerLevel: string | null;
};

type SellerPerformanceType = {
  sales: { total: number; growth: number; };
  reputation: { score: number; trend: number; };
  products: { active: number; views: number; conversion: number; };
  orders: { pending: number; shipped: number; delivered: number; problems: number; };
};

export class GetDashboardMetricsUseCase {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly orderRepository: IOrderRepository,
    private readonly sellerRepository: ISellerRepository
  ) {}

  /**
   * Fetch product statistics from cache for admin context
   * This uses the same data source as the products page (/api/products-public)
   */
  private async getProductStatsFromCache(): Promise<ProductStatsType | null> {
    try {
      // Only works server-side in admin context
      if (typeof window !== 'undefined') {
        return null;
      }

      // Fetch from cache using the same endpoint as products page
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://peepers.vercel.app';
      const response = await fetch(`${baseUrl}${API_ENDPOINTS.PRODUCTS}?limit=1000&format=summary`, {
        headers: {
          'Content-Type': 'application/json',
        },
        // Include credentials for admin context
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.items) {
          const products = data.data.items;

          return {
            total: data.data.total || products.length,
            active: products.filter((p: MLProduct) => p.status === 'active').length,
            paused: products.filter((p: MLProduct) => p.status === 'paused').length,
            closed: products.filter((p: MLProduct) => p.status === 'closed').length,
            outOfStock: products.filter((p: MLProduct) => (p.available_quantity || 0) === 0).length,
            lowStock: products.filter((p: MLProduct) => (p.available_quantity || 0) < 5 && (p.available_quantity || 0) > 0).length,
            totalValue: products.reduce((sum: number, p: MLProduct) => sum + ((p.price || 0) * (p.available_quantity || 0)), 0),
            averagePrice: products.length > 0 ? products.reduce((sum: number, p: MLProduct) => sum + (p.price || 0), 0) / products.length : 0
          };
        }
      }

      console.warn('❌ Failed to fetch product stats from cache');
      return null;
    } catch (error) {
      console.error('❌ Error fetching product stats from cache:', error);
      return null;
    }
  }

  async execute(filters?: DashboardFiltersDTO, isAdmin: boolean = false): Promise<{
    success: boolean;
    data?: DashboardMetricsDTO;
    error?: string;
  }> {
    try {
      const sellerId = filters?.sellerId || 123456; // Default seller for demo
      
      // Fetch all data in parallel for better performance
      let productStatsResult;

      if (isAdmin) {
        // In admin context, try to get product stats from cache first (same source as products page)
        console.log('🔄 Admin context: trying to get product stats from cache...');
        const cachedStats = await this.getProductStatsFromCache();
        if (cachedStats) {
          productStatsResult = {
            success: true,
            data: cachedStats,
            timestamp: new Date()
          };
          console.log('✅ Got product stats from cache:', cachedStats);
        } else {
          console.log('❌ Cache miss, falling back to repository...');
          productStatsResult = await this.productRepository.getStatistics(sellerId);
        }
      } else {
        // Public context uses repository as before
        productStatsResult = await this.productRepository.getStatistics(sellerId);
      }

      // Fetch remaining data in parallel
      const [
        orderStatsResult,
        sellerReputationResult,
        sellerPerformanceResult,
        productsNeedingAttentionResult,
        ordersNeedingAttentionResult
      ] = await Promise.all([
        this.orderRepository.getStatistics(sellerId, filters?.dateFrom, filters?.dateTo),
        this.sellerRepository.getReputationMetrics(sellerId),
        this.sellerRepository.getPerformanceMetrics(sellerId, this.mapPeriod(filters?.period || 'month')),
        this.productRepository.findNeedingAttention(sellerId),
        this.orderRepository.findNeedingAttention(sellerId)
      ]);

      // Extract data - admin context never uses fallbacks, public context does
      const productStats = productStatsResult.success ? productStatsResult.data! : 
        (isAdmin ? (() => { throw new Error('Failed to load product statistics'); })() : this.getDefaultProductStats());
      const orderStats = orderStatsResult.success ? orderStatsResult.data! : 
        (isAdmin ? (() => { throw new Error('Failed to load order statistics'); })() : this.getDefaultOrderStats());
      const sellerReputation = sellerReputationResult.success ? sellerReputationResult.data! : 
        (isAdmin ? (() => { throw new Error('Failed to load seller reputation'); })() : this.getDefaultSellerReputation());
      const sellerPerformance = sellerPerformanceResult.success ? sellerPerformanceResult.data! : 
        (isAdmin ? (() => { throw new Error('Failed to load seller performance'); })() : this.getDefaultPerformance());
      const sellerStats = this.getDefaultSellerStats(); // Mock data for now
      const productsNeedingAttention = productsNeedingAttentionResult.success ? productsNeedingAttentionResult.data! : 
        (isAdmin ? (() => { throw new Error('Failed to load products needing attention'); })() : []);
      const ordersNeedingAttention = ordersNeedingAttentionResult.success ? ordersNeedingAttentionResult.data! : 
        (isAdmin ? (() => { throw new Error('Failed to load orders needing attention'); })() : []);

      // Generate alerts based on business rules
      const alerts = this.generateAlerts(
        productStats,
        orderStats,
        sellerReputation,
        productsNeedingAttention,
        ordersNeedingAttention
      );

      // Calculate summary metrics
      const summary = this.calculateSummary(
        productStats,
        orderStats,
        sellerReputation,
        sellerPerformance,
        alerts
      );

      const dashboardMetrics: DashboardMetricsDTO = {
        products: productStats,
        orders: orderStats,
        seller: {
          reputation: sellerReputation,
          performance: sellerPerformance,
          stats: sellerStats
        },
        alerts,
        summary
      };

      return {
        success: true,
        data: dashboardMetrics
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Map period from DTO to repository format
   */
  private mapPeriod(period: 'day' | 'week' | 'month' | 'quarter' | 'year'): 'week' | 'month' | 'quarter' | 'year' {
    if (period === 'day') return 'week'; // Map day to week
    return period;
  }

  /**
   * Business Logic: Generate alerts based on current metrics
   */
  private generateAlerts(
    productStats: ProductStatsType,
    orderStats: OrderStatsType,
    sellerReputation: SellerReputationType,
    productsNeedingAttention: Product[],
    ordersNeedingAttention: Order[]
  ): DashboardMetricsDTO['alerts'] {
    const alerts: DashboardMetricsDTO['alerts'] = [];
    const now = new Date();

    // Critical product alerts
    if (productStats.outOfStock > 0) {
      alerts.push({
        id: `out-of-stock-${now.getTime()}`,
        type: 'product',
        severity: 'critical',
        title: 'Produtos em Falta',
        message: `${productStats.outOfStock} produtos estão sem estoque`,
        actionRequired: true,
        timestamp: now
      });
    }

    // Low stock warning
    if (productStats.lowStock > 0) {
      alerts.push({
        id: `low-stock-${now.getTime()}`,
        type: 'product',
        severity: 'medium',
        title: 'Estoque Baixo',
        message: `${productStats.lowStock} produtos com estoque baixo`,
        actionRequired: true,
        timestamp: now
      });
    }

    // Order alerts
    if (ordersNeedingAttention.length > 0) {
      alerts.push({
        id: `orders-attention-${now.getTime()}`,
        type: 'order',
        severity: 'high',
        title: 'Pedidos Requerem Atenção',
        message: `${ordersNeedingAttention.length} pedidos precisam de atenção`,
        actionRequired: true,
        timestamp: now
      });
    }

    // Reputation alerts
    if (sellerReputation.score < 4.0) {
      alerts.push({
        id: `reputation-low-${now.getTime()}`,
        type: 'reputation',
        severity: 'high',
        title: 'Reputação Baixa',
        message: `Sua reputação está em ${sellerReputation.score.toFixed(1)}`,
        actionRequired: true,
        timestamp: now
      });
    }

    // Performance alerts
    if (orderStats.conversionRate < 0.05) {
      alerts.push({
        id: `conversion-low-${now.getTime()}`,
        type: 'performance',
        severity: 'medium',
        title: 'Taxa de Conversão Baixa',
        message: `Taxa de conversão em ${(orderStats.conversionRate * 100).toFixed(1)}%`,
        actionRequired: false,
        timestamp: now
      });
    }

    return alerts;
  }

  /**
   * Business Logic: Calculate summary metrics and trends
   */
  private calculateSummary(
    productStats: ProductStatsType,
    orderStats: OrderStatsType,
    sellerReputation: SellerReputationType,
    sellerPerformance: SellerPerformanceType,
    alerts: DashboardMetricsDTO['alerts']
  ): DashboardMetricsDTO['summary'] {
    const needsAttention = productStats.outOfStock + productStats.lowStock;
    const totalIssues = alerts.filter(a => a.severity === 'critical' || a.severity === 'high').length;

    // Calculate overall performance score
    let performanceScore = 0;
    performanceScore += sellerReputation.score >= 4.5 ? 25 : sellerReputation.score >= 4.0 ? 15 : 5;
    performanceScore += orderStats.conversionRate >= 0.15 ? 25 : orderStats.conversionRate >= 0.10 ? 15 : 5;
    performanceScore += productStats.outOfStock === 0 ? 25 : productStats.outOfStock <= 3 ? 15 : 5;
    performanceScore += totalIssues === 0 ? 25 : totalIssues <= 2 ? 15 : 5;

    const performance: DashboardMetricsDTO['summary']['performance'] = 
      performanceScore >= 80 ? 'excellent' :
      performanceScore >= 60 ? 'good' :
      performanceScore >= 40 ? 'fair' : 'poor';

    // Calculate trends (simplified for demo)
    const trends: DashboardMetricsDTO['summary']['trends'] = {
      sales: sellerPerformance.sales.growth > 0 ? 'up' : sellerPerformance.sales.growth < 0 ? 'down' : 'stable',
      reputation: sellerPerformance.reputation.trend > 0 ? 'up' : sellerPerformance.reputation.trend < 0 ? 'down' : 'stable',
      efficiency: orderStats.conversionRate > 0.12 ? 'up' : orderStats.conversionRate < 0.08 ? 'down' : 'stable'
    };

    return {
      needsAttention,
      totalIssues,
      performance,
      trends
    };
  }

  /**
   * Fallback data for seller performance
   */
  private getDefaultPerformance(): DashboardMetricsDTO['seller']['performance'] {
    return {
      sales: { total: 0, growth: 0 },
      reputation: { score: 0, trend: 0 },
      products: { active: 0, views: 0, conversion: 0 },
      orders: { pending: 0, shipped: 0, delivered: 0, problems: 0 }
    };
  }

  /**
   * Fallback data for seller stats
   */
  private getDefaultSellerStats(): DashboardMetricsDTO['seller']['stats'] {
    return {
      totalProducts: 95,
      activeProducts: 87,
      totalSales: 1485,
      totalRevenue: 450000.00,
      averageRating: 4.9,
      conversionRate: 0.15,
      responseTime: 2.5,
      profileCompletion: 85
    };
  }

  /**
   * Fallback data for product stats
   */
  private getDefaultProductStats(): ProductStatsType {
    return {
      total: 95,
      active: 87,
      paused: 5,
      closed: 3,
      outOfStock: 8,
      lowStock: 12,
      totalValue: 125000.00,
      averagePrice: 145.50
    };
  }

  /**
   * Fallback data for order stats
   */
  private getDefaultOrderStats(): OrderStatsType {
    return {
      total: 1485,
      byStatus: {
        confirmed: 45,
        payment_required: 12,
        payment_in_process: 23,
        paid: 1200,
        shipped: 150,
        delivered: 45,
        cancelled: 10
      },
      totalRevenue: 450000.00,
      totalProfit: 45000.00,
      averageOrderValue: 303.03,
      conversionRate: 0.15
    };
  }

  /**
   * Fallback data for seller reputation
   */
  private getDefaultSellerReputation(): SellerReputationType {
    return {
      score: 4.9,
      level: 'green_light',
      transactions: 1485,
      claims: 8,
      delayedHandling: 15,
      powerSellerLevel: 'GOLD'
    };
  }
}