/**
 * Dashboard Metrics DTO - Application Layer
 * 
 * Data Transfer Object for dashboard metrics data
 */

export interface DashboardMetricsDTO {
  products: {
    total: number;
    active: number;
    paused: number;
    closed: number;
    outOfStock: number;
    lowStock: number;
    totalValue: number;
    averagePrice: number;
  };
  orders: {
    total: number;
    byStatus: Record<string, number>;
    totalRevenue: number;
    totalProfit: number;
    averageOrderValue: number;
    conversionRate: number;
    pendingShipment?: number;
  };
  seller: {
    reputation: {
      score: number;
      level: string;
      transactions: number;
      claims: number;
      delayedHandling: number;
      powerSellerLevel: string | null;
    };
    performance: {
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
    };
    stats: {
      totalProducts: number;
      activeProducts: number;
      totalSales: number;
      totalRevenue: number;
      averageRating: number;
      conversionRate: number;
      responseTime: number;
      profileCompletion: number;
    };
  };
  alerts: Array<{
    id: string;
    type: 'product' | 'order' | 'reputation' | 'performance';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    message: string;
    actionRequired?: boolean;
    timestamp: Date;
  }>;
  summary: {
    needsAttention: number;
    totalIssues: number;
    performance: 'excellent' | 'good' | 'fair' | 'poor';
    trends: {
      sales: 'up' | 'down' | 'stable';
      reputation: 'up' | 'down' | 'stable';
      efficiency: 'up' | 'down' | 'stable';
    };
  };
}

export interface DashboardFiltersDTO {
  dateFrom?: Date;
  dateTo?: Date;
  sellerId?: number;
  period?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  includeInactive?: boolean;
}