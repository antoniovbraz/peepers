'use client';

import { useState, useEffect } from 'react';
import {
  ShoppingBagIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import useCleanAuthUrl from '@/hooks/useCleanAuthUrl';
import KPICard from '@/components/admin/dashboard/KPICard';

import { DashboardMetricsDTO } from '../../../application/dtos/DashboardMetricsDTO';
import { GetDashboardMetricsUseCase } from '../../../application/use-cases/GetDashboardMetricsUseCase';
import { ProductRepository } from '../../../infrastructure/repositories/ProductRepository';
import { OrderRepository } from '../../../infrastructure/repositories/OrderRepository';
import { SellerRepository } from '../../../infrastructure/repositories/SellerRepository';
import SalesChart from '@/components/admin/dashboard/SalesChart';
import AnalyticsOverview from '@/components/admin/dashboard/AnalyticsOverview';
import ActivityFeed from '@/components/admin/dashboard/ActivityFeed';
import QuickActions from '@/components/admin/dashboard/QuickActions';

// Initialize repositories and use case
const productRepository = new ProductRepository();
const orderRepository = new OrderRepository();
const sellerRepository = new SellerRepository();
const getDashboardMetrics = new GetDashboardMetricsUseCase(
  productRepository,
  orderRepository,
  sellerRepository
);

interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: typeof ShoppingBagIcon;
  color: 'green' | 'blue' | 'purple' | 'yellow';
  subtitle?: string;
}

function MetricCard({ title, value, change, icon: Icon, color, subtitle }: MetricCardProps) {
  const colorClasses = {
    green: 'bg-green-50 text-green-600 border-green-200',
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200'
  };

  const changeColor = change >= 0 ? 'text-green-600' : 'text-red-600';
  const ChangeIcon = change >= 0 ? ArrowTrendingUpIcon : ArrowTrendingDownIcon;

  return (
    <div className={`rounded-xl border p-6 transition-all duration-200 hover:shadow-md ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`rounded-lg p-2 ${color === 'green' ? 'bg-green-100' : color === 'blue' ? 'bg-blue-100' : color === 'purple' ? 'bg-purple-100' : 'bg-yellow-100'}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-500">{subtitle}</p>
            )}
          </div>
        </div>
        <div className={`flex items-center space-x-1 ${changeColor}`}>
          <ChangeIcon className="h-4 w-4" />
          <span className="text-sm font-medium">{Math.abs(change)}%</span>
        </div>
      </div>
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="rounded-xl border border-gray-200 p-6 animate-pulse">
      <div className="flex items-center space-x-3">
        <div className="rounded-lg bg-gray-200 p-2 w-10 h-10"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetricsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Limpa automaticamente query parameters de autenticação da URL
  useCleanAuthUrl();

  useEffect(() => {
    async function loadMetrics() {
      try {
        setLoading(true);
        const result = await getDashboardMetrics.execute();
        
        if (result.success && result.data) {
          setMetrics(result.data);
          setError(null);
        } else {
          setError(result.error || 'Failed to load metrics');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    loadMetrics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <LoadingCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        </div>
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Erro ao carregar métricas
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Visão geral da sua loja no Mercado Livre
          </p>
        </div>
        
        {/* Quick Actions */}
        <div className="flex space-x-3">
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
            <ArrowTrendingUpIcon className="h-4 w-4 mr-2" />
            Sincronizar
          </button>
          <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
            <EyeIcon className="h-4 w-4 mr-2" />
            Ver Relatório
          </button>
        </div>
      </div>

      {/* Alerts */}
      {metrics.alerts.length > 0 && (
        <div className="space-y-3">
          {metrics.alerts.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-md p-4 ${
                alert.severity === 'critical' ? 'bg-red-50' :
                alert.severity === 'high' ? 'bg-orange-50' :
                alert.severity === 'medium' ? 'bg-yellow-50' :
                'bg-blue-50'
              }`}
            >
              <div className="flex">
                <ExclamationTriangleIcon 
                  className={`h-5 w-5 ${
                    alert.severity === 'critical' ? 'text-red-400' :
                    alert.severity === 'high' ? 'text-orange-400' :
                    alert.severity === 'medium' ? 'text-yellow-400' :
                    'text-blue-400'
                  }`} 
                />
                <div className="ml-3">
                  <h3 className={`text-sm font-medium ${
                    alert.severity === 'critical' ? 'text-red-800' :
                    alert.severity === 'high' ? 'text-orange-800' :
                    alert.severity === 'medium' ? 'text-yellow-800' :
                    'text-blue-800'
                  }`}>
                    {alert.title}
                  </h3>
                  <div className={`mt-2 text-sm ${
                    alert.severity === 'critical' ? 'text-red-700' :
                    alert.severity === 'high' ? 'text-orange-700' :
                    alert.severity === 'medium' ? 'text-yellow-700' :
                    'text-blue-700'
                  }`}>
                    <p>{alert.message}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Produtos Ativos"
          value={metrics.products.active}
          subtitle={`${metrics.products.total} total`}
          trend={{
            value: calculateProductChange(metrics.products),
            isPositive: calculateProductChange(metrics.products) > 0,
            period: 'vs mês anterior',
          }}
          icon={<ShoppingBagIcon className="h-full w-full" />}
          status={metrics.products.active > 0 ? 'success' : 'warning'}
        />
        
        <KPICard
          title="Receita do Mês"
          value={`R$ ${metrics.orders.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitle="Valor total"
          trend={{
            value: 15.2, // Mock change for now
            isPositive: true,
            period: 'vs mês anterior',
          }}
          icon={<CurrencyDollarIcon className="h-full w-full" />}
          status="success"
        />
        
        <KPICard
          title="Pedidos Ativos"
          value={metrics.seller.performance.orders.pending + metrics.seller.performance.orders.shipped}
          subtitle={`${metrics.orders.total} total`}
          trend={{
            value: 5.2,
            isPositive: true,
            period: 'vs período anterior',
          }}
          icon={<ChartBarIcon className="h-full w-full" />}
          status="success"
        />
        
        <KPICard
          title="Reputação"
          value={`${(metrics.seller.reputation.score * 20).toFixed(0)}%`}
          subtitle={metrics.seller.reputation.level}
          trend={{
            value: metrics.seller.performance.reputation.trend,
            isPositive: metrics.seller.performance.reputation.trend > 0,
            period: 'vs mês anterior',
          }}
          icon={<UserGroupIcon className="h-full w-full" />}
          status={metrics.seller.reputation.score >= 4.5 ? 'success' : 'warning'}
        />
      </div>

      {/* Charts and Analytics */}
      <div className="space-y-6">
        <SalesChart height={350} />
        <QuickActions />
        <AnalyticsOverview />
        <ActivityFeed maxItems={8} />
      </div>

      {/* Performance Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Resumo de Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              metrics.summary.performance === 'excellent' ? 'text-green-600' :
              metrics.summary.performance === 'good' ? 'text-blue-600' :
              metrics.summary.performance === 'fair' ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {metrics.summary.performance === 'excellent' ? 'Excelente' :
               metrics.summary.performance === 'good' ? 'Boa' :
               metrics.summary.performance === 'fair' ? 'Regular' :
               'Ruim'}
            </div>
            <div className="text-sm text-gray-500">Performance Geral</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {metrics.summary.needsAttention}
            </div>
            <div className="text-sm text-gray-500">Itens precisam atenção</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {metrics.summary.totalIssues}
            </div>
            <div className="text-sm text-gray-500">Problemas críticos</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function calculateProductChange(products: DashboardMetricsDTO['products']): number {
  // Simple calculation: if more active than paused/closed, positive change
  const activeRatio = products.active / products.total;
  return activeRatio > 0.8 ? 12 : activeRatio > 0.6 ? 5 : -3;
}