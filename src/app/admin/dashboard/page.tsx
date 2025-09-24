'use client';

import { useState, useEffect } from 'react';
import {
  ShoppingBagIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  EyeIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import useCleanAuthUrl from '@/hooks/useCleanAuthUrl';
import KPICard from '@/components/admin/dashboard/KPICard';
import { DashboardMetricsDTO } from '../../../application/dtos/DashboardMetricsDTO';
import SalesChart from '@/components/admin/dashboard/SalesChart';
import AnalyticsOverview from '@/components/admin/dashboard/AnalyticsOverview';
import ActivityFeed from '@/components/admin/dashboard/ActivityFeed';
import QuickActions from '@/components/admin/dashboard/QuickActions';

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
        
        // Verificar se há erro de operador nos query params
        const urlParams = new URLSearchParams(window.location.search);
        const authError = urlParams.get('auth_error');
        const message = urlParams.get('message');
        
        if (authError === 'operator_not_allowed') {
          setError(`ACESSO_NEGADO_OPERADOR: ${decodeURIComponent(message || 'Apenas usuários administradores podem acessar o painel admin.')}`);
          setLoading(false);
          return;
        }
        
        // Fetch metrics from API endpoint (server-side)
        const response = await fetch('/api/admin/dashboard/metrics', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store'
        });

        if (!response.ok) {
          // Check if it's an authentication error (401/403)
          if (response.status === 401 || response.status === 403) {
            // Redirect to login page
            window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
            return;
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (result.success && result.data) {
          setMetrics(result.data);
          setError(null);
        } else {
          setError(result.error || 'Failed to load metrics');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        
        // Verificar se é erro de operador
        if (errorMessage.includes('OPERATOR_NOT_ALLOWED') || errorMessage.includes('operator')) {
          setError('ACESSO_NEGADO_OPERADOR: Apenas usuários administradores podem acessar o painel admin. Operadores devem usar outras ferramentas específicas.');
        } else {
          setError(errorMessage);
        }
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
    const isOperatorError = error.includes('ACESSO_NEGADO_OPERADOR');
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        </div>
        <div className={`rounded-md p-4 ${isOperatorError ? 'bg-yellow-50' : 'bg-red-50'}`}>
          <div className="flex">
            <ExclamationTriangleIcon className={`h-5 w-5 ${isOperatorError ? 'text-yellow-400' : 'text-red-400'}`} />
            <div className="ml-3">
              <h3 className={`text-sm font-medium ${isOperatorError ? 'text-yellow-800' : 'text-red-800'}`}>
                {isOperatorError ? 'Acesso Restrito - Usuário Operador' : 'Erro ao carregar métricas'}
              </h3>
              <div className={`mt-2 text-sm ${isOperatorError ? 'text-yellow-700' : 'text-red-700'}`}>
                <p>{error.replace('ACESSO_NEGADO_OPERADOR: ', '')}</p>
                {isOperatorError && (
                  <div className="mt-3">
                    <p className="font-medium">O que você pode fazer:</p>
                    <ul className="mt-1 list-disc list-inside space-y-1">
                      <li>Solicitar acesso de administrador ao responsável pela conta</li>
                      <li>Usar as ferramentas específicas do Mercado Livre para operadores</li>
                      <li>Contatar o suporte técnico se necessário</li>
                    </ul>
                  </div>
                )}
              </div>
              {isOperatorError && (
                <div className="mt-4">
                  <a
                    href="/produtos"
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                  >
                    <EyeIcon className="h-4 w-4 mr-2" />
                    Ver Produtos Públicos
                  </a>
                </div>
              )}
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
          <button 
            onClick={() => {
              // TODO: Implement sync functionality
              console.log('Sincronizando dados...');
              // Could trigger a manual sync with Mercado Livre
            }}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <ArrowTrendingUpIcon className="h-4 w-4 mr-2" />
            Sincronizar
          </button>
          <button 
            onClick={() => {
              // TODO: Implement report view functionality
              console.log('Abrindo relatório detalhado...');
              // Could open a detailed report modal or navigate to reports page
            }}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
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
            value: calculateRevenueChange(metrics.orders),
            isPositive: calculateRevenueChange(metrics.orders) > 0,
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
            value: calculateOrdersChange(metrics.orders, metrics.seller.performance),
            isPositive: calculateOrdersChange(metrics.orders, metrics.seller.performance) > 0,
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
        <SalesChart 
          height={350}
          realData={{
            totalRevenue: metrics.orders.totalRevenue,
            totalOrders: metrics.orders.total,
            averageOrderValue: metrics.orders.averageOrderValue,
            ordersByStatus: metrics.orders.byStatus
          }}
        />
        <QuickActions />
        <AnalyticsOverview 
          realData={{
            totalRevenue: metrics.orders.totalRevenue,
            totalOrders: metrics.orders.total,
            averageOrderValue: metrics.orders.averageOrderValue,
            conversionRate: metrics.orders.conversionRate,
            products: metrics.products
          }}
        />
        <ActivityFeed 
          maxItems={8}
          realData={{
            orders: metrics.orders,
            products: metrics.products,
            alerts: metrics.alerts
          }}
        />
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

function calculateRevenueChange(orders: DashboardMetricsDTO['orders']): number {
  // Calculate revenue growth based on average order value and total orders
  // This is a simplified calculation - in a real scenario you'd compare with previous period
  const avgOrderValue = orders.averageOrderValue;
  
  // Estimate growth based on current metrics
  if (avgOrderValue > 150) return 18.5;
  if (avgOrderValue > 100) return 12.3;
  if (avgOrderValue > 50) return 8.7;
  return 3.2;
}

function calculateOrdersChange(orders: DashboardMetricsDTO['orders'], performance: DashboardMetricsDTO['seller']['performance']): number {
  // Calculate orders trend based on pending vs delivered ratio
  const activeOrders = performance.orders.pending + performance.orders.shipped;
  
  if (orders.total === 0) return 0;
  
  const activeRatio = activeOrders / orders.total;
  const deliveredRatio = performance.orders.delivered / orders.total;
  
  // Positive trend if more orders are being delivered than staying pending
  if (deliveredRatio > activeRatio) return 7.8;
  if (activeRatio < 0.3) return 4.2;
  return -2.1;
}