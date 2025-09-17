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

  async execute(filters?: DashboardFiltersDTO): Promise<{
    success: boolean;
    data?: DashboardMetricsDTO;
    error?: string;
  }> {
    try {
      const sellerId = filters?.sellerId || 123456; // Default seller for demo
      
      // Fetch all data in parallel for better performance
      const [
        productStatsResult,
        orderStatsResult,
        sellerReputationResult,
        sellerPerformanceResult,
        productsNeedingAttentionResult,
        ordersNeedingAttentionResult
      ] = await Promise.all([
        this.productRepository.getStatistics(sellerId),
        this.orderRepository.getStatistics(sellerId, filters?.dateFrom, filters?.dateTo),
        this.sellerRepository.getReputationMetrics(sellerId),
        this.sellerRepository.getPerformanceMetrics(sellerId, this.mapPeriod(filters?.period || 'month')),
        this.productRepository.findNeedingAttention(sellerId),
        this.orderRepository.findNeedingAttention(sellerId)
      ]);

      // Check for critical errors
      if (!productStatsResult.success) {
        throw new Error(`Product stats error: ${productStatsResult.error}`);
      }
      if (!orderStatsResult.success) {
        throw new Error(`Order stats error: ${orderStatsResult.error}`);
      }
      if (!sellerReputationResult.success) {
        throw new Error(`Seller reputation error: ${sellerReputationResult.error}`);
      }

      // Extract data with fallbacks
      const productStats = productStatsResult.data!;
      const orderStats = orderStatsResult.data!;
      const sellerReputation = sellerReputationResult.data!;
      const sellerPerformance = sellerPerformanceResult.success ? sellerPerformanceResult.data! : this.getDefaultPerformance();
      const sellerStats = this.getDefaultSellerStats(); // Mock data for now
      const productsNeedingAttention = productsNeedingAttentionResult.success ? productsNeedingAttentionResult.data! : [];
      const ordersNeedingAttention = ordersNeedingAttentionResult.success ? ordersNeedingAttentionResult.data! : [];

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
}