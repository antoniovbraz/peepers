'use client';

import { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  EyeIcon,
  StarIcon,
  ShoppingBagIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import KPICard from '@/components/admin/dashboard/KPICard';

  // Load metrics from API
  useEffect(() => {
    loadMetrics();
  }, [selectedPeriod]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      // Tentar obter token do localStorage (usuário logado)
      const userToken = localStorage.getItem('ml_user_token');
      
      if (userToken) {
        // Tentar buscar métricas reais do ML
        try {
          const response = await fetch(`/api/admin/metrics?period=${selectedPeriod}`, {
            headers: {
              'Authorization': `Bearer ${userToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data?.metrics) {
              setMetrics(data.data.metrics);
              setIsRealData(true);
              setDataSource('mercado_livre');
              console.log('✅ Métricas reais do ML carregadas!');
              return;
            }
          }
        } catch (error) {
          console.warn('Erro ao buscar métricas do ML:', error);
        }
      }

      // Fallback: usar dados mockados
      setMetrics(mockMetrics);
      setIsRealData(false);
      setDataSource('mock');
      console.log('⚠️ Usando métricas de demonstração');
      
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
      setMetrics(mockMetrics);
      setIsRealData(false);
      setDataSource('error_fallback');
    } finally {
      setLoading(false);
    }
  };con,
  ClockIcon,
} from '@heroicons/react/24/outline';
import KPICard from '@/components/admin/dashboard/KPICard';

// Types
interface MetricsData {
  sales: {
    totalRevenue: number;
    monthlyRevenue: number[];
    monthlyOrders: number[];
    conversionRate: number;
    averageOrderValue: number;
  };
  products: {
    totalViews: number;
    dailyViews: number[];
    topProducts: Array<{
      id: string;
      title: string;
      views: number;
      sales: number;
      revenue: number;
    }>;
  };
  reputation: {
    score: number;
    totalReviews: number;
    positiveReviews: number;
    neutralReviews: number;
    negativeReviews: number;
    averageResponseTime: number;
  };
  performance: {
    ordersFulfilled: number;
    onTimeDelivery: number;
    customerSatisfaction: number;
    returnRate: number;
  };
}

// Mock data
const mockMetrics: MetricsData = {
  sales: {
    totalRevenue: 125000.50,
    monthlyRevenue: [45000, 52000, 48000, 61000, 55000, 68000, 72000, 69000, 75000, 82000, 78000, 85000],
    monthlyOrders: [120, 145, 132, 168, 155, 189, 201, 195, 210, 225, 218, 235],
    conversionRate: 3.2,
    averageOrderValue: 532.50,
  },
  products: {
    totalViews: 45230,
    dailyViews: [1200, 1350, 1180, 1420, 1380, 1650, 1580, 1720, 1450, 1520, 1680, 1750, 1620, 1480],
    topProducts: [
      {
        id: 'MLB123456789',
        title: 'iPhone 15 Pro Max 256GB Azul Titânio',
        views: 12500,
        sales: 45,
        revenue: 355499.55,
      },
      {
        id: 'MLB987654321',
        title: 'Samsung Galaxy S24 Ultra 512GB Preto',
        views: 8750,
        sales: 32,
        revenue: 201599.68,
      },
      {
        id: 'MLB456789123',
        title: 'MacBook Air M3 256GB Prateado',
        views: 6200,
        sales: 18,
        revenue: 179999.82,
      },
    ],
  },
  reputation: {
    score: 4.7,
    totalReviews: 1247,
    positiveReviews: 1089,
    neutralReviews: 132,
    negativeReviews: 26,
    averageResponseTime: 2.3, // hours
  },
  performance: {
    ordersFulfilled: 98.5,
    onTimeDelivery: 96.2,
    customerSatisfaction: 4.6,
    returnRate: 2.1,
  },
};

// Simple Chart Components
interface BarChartProps {
  data: number[];
  labels: string[];
  title: string;
  color?: string;
}

function SimpleBarChart({ data, labels, title, color = '#0D6832' }: BarChartProps) {
  const maxValue = Math.max(...data);
  
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      <div className="flex items-end space-x-2 h-48">
        {data.map((value, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div
              className="w-full rounded-t transition-all duration-300 hover:opacity-80"
              style={{
                height: `${(value / maxValue) * 160}px`,
                backgroundColor: color,
                minHeight: '8px',
              }}
            />
            <div className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-left">
              {labels[index]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface LineChartProps {
  data: number[];
  labels: string[];
  title: string;
  color?: string;
}

function SimpleLineChart({ data, labels, title, color = '#0D6832' }: LineChartProps) {
  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const range = maxValue - minValue;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = range > 0 ? ((maxValue - value) / range) * 70 + 10 : 40;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      <div className="relative h-48">
        <svg className="w-full h-full" viewBox="0 0 100 80">
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="2"
            points={points}
          />
          {data.map((value, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = range > 0 ? ((maxValue - value) / range) * 70 + 10 : 40;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="2"
                fill={color}
                className="hover:r-3 transition-all cursor-pointer"
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export default function MetricasPage() {
  const [metrics, setMetrics] = useState<MetricsData>(mockMetrics);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [loading, setLoading] = useState(true);
  const [isRealData, setIsRealData] = useState(false);
  const [dataSource, setDataSource] = useState<string>('');

  const monthLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const dayLabels = Array.from({ length: 14 }, (_, i) => `${i + 1}`);

  // Load metrics from API
  useEffect(() => {
    loadMetrics();
  }, [selectedPeriod]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      // Tentar obter token do localStorage (usuário logado)
      const userToken = localStorage.getItem('ml_user_token');
      
      if (userToken) {
        // Tentar buscar métricas reais do ML
        try {
          const response = await fetch(`/api/admin/metrics?period=${selectedPeriod}`, {
            headers: {
              'Authorization': `Bearer ${userToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data?.metrics) {
              setMetrics(data.data.metrics);
              setIsRealData(true);
              setDataSource('mercado_livre');
              console.log('✅ Métricas reais do ML carregadas!');
              return;
            }
          }
        } catch (error) {
          console.warn('Erro ao buscar métricas do ML:', error);
        }
      }

      // Fallback: usar dados mockados
      setMetrics(mockMetrics);
      setIsRealData(false);
      setDataSource('mock');
      console.log('⚠️ Usando métricas de demonstração');
      
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
      setMetrics(mockMetrics);
      setIsRealData(false);
      setDataSource('error_fallback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Métricas e Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">
            Análise detalhada de performance e vendas
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
          >
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
            <option value="1y">Último ano</option>
          </select>
          
          <button 
            onClick={loadMetrics}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            <ArrowTrendingUpIcon className="h-4 w-4 mr-2" />
            {loading ? 'Atualizando...' : 'Exportar Relatório'}
          </button>
        </div>
      </div>

      {/* Data Source Indicator */}
      {!loading && (
        <div className={clsx(
          'rounded-md p-3 text-sm',
          isRealData 
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
        )}>
          <div className="flex items-center">
            {isRealData ? (
              <CheckCircleIcon className="h-4 w-4 mr-2" />
            ) : (
              <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
            )}
            <span className="font-medium">
              {isRealData 
                ? '✅ Métricas reais do Mercado Livre'
                : '⚠️ Dados de demonstração - faça login para ver métricas reais'
              }
            </span>
          </div>
        </div>
      )}

      {/* Overview KPIs */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Receita Total"
          value={`R$ ${metrics.sales.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitle="últimos 30 dias"
          trend={{
            value: 18.5,
            isPositive: true,
            period: 'vs período anterior',
          }}
          icon={<CurrencyDollarIcon className="h-full w-full" />}
          status="success"
        />
        
        <KPICard
          title="Visualizações"
          value={metrics.products.totalViews.toLocaleString('pt-BR')}
          subtitle="produtos visualizados"
          trend={{
            value: 12.3,
            isPositive: true,
            period: 'vs período anterior',
          }}
          icon={<EyeIcon className="h-full w-full" />}
          status="success"
        />
        
        <KPICard
          title="Taxa de Conversão"
          value={`${metrics.sales.conversionRate}%`}
          subtitle="visitantes que compraram"
          trend={{
            value: 2.1,
            isPositive: false,
            period: 'vs período anterior',
          }}
          icon={<ChartBarIcon className="h-full w-full" />}
          status="warning"
        />
        
        <KPICard
          title="Reputação"
          value={metrics.reputation.score.toFixed(1)}
          subtitle={`${metrics.reputation.totalReviews} avaliações`}
          trend={{
            value: 0.3,
            isPositive: true,
            period: 'vs mês anterior',
          }}
          icon={<StarIcon className="h-full w-full" />}
          status="success"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SimpleBarChart
          data={metrics.sales.monthlyRevenue}
          labels={monthLabels}
          title="Receita Mensal (R$)"
          color="#0D6832"
        />
        
        <SimpleLineChart
          data={metrics.products.dailyViews}
          labels={dayLabels}
          title="Visualizações Diárias"
          color="#E0C81A"
        />
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance KPIs */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Performance Operacional</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {metrics.performance.ordersFulfilled}%
              </div>
              <div className="text-sm text-gray-500">Pedidos Cumpridos</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {metrics.performance.onTimeDelivery}%
              </div>
              <div className="text-sm text-gray-500">Entregas Pontuais</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {metrics.performance.customerSatisfaction.toFixed(1)}
              </div>
              <div className="text-sm text-gray-500">Satisfação Cliente</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {metrics.performance.returnRate}%
              </div>
              <div className="text-sm text-gray-500">Taxa de Devolução</div>
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Top Produtos</h3>
          <div className="space-y-4">
            {metrics.products.topProducts.map((product, index) => (
              <div key={product.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-green-600">
                        {index + 1}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {product.title}
                    </p>
                    <p className="text-sm text-gray-500">
                      {product.views.toLocaleString('pt-BR')} visualizações
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {product.sales} vendas
                  </p>
                  <p className="text-sm text-gray-500">
                    R$ {product.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reputation Details */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Detalhes da Reputação</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {metrics.reputation.positiveReviews}
            </div>
            <div className="text-sm text-gray-500">Avaliações Positivas</div>
            <div className="text-xs text-gray-400">
              {((metrics.reputation.positiveReviews / metrics.reputation.totalReviews) * 100).toFixed(1)}%
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">
              {metrics.reputation.neutralReviews}
            </div>
            <div className="text-sm text-gray-500">Avaliações Neutras</div>
            <div className="text-xs text-gray-400">
              {((metrics.reputation.neutralReviews / metrics.reputation.totalReviews) * 100).toFixed(1)}%
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">
              {metrics.reputation.negativeReviews}
            </div>
            <div className="text-sm text-gray-500">Avaliações Negativas</div>
            <div className="text-xs text-gray-400">
              {((metrics.reputation.negativeReviews / metrics.reputation.totalReviews) * 100).toFixed(1)}%
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {metrics.reputation.averageResponseTime.toFixed(1)}h
            </div>
            <div className="text-sm text-gray-500">Tempo Médio Resposta</div>
            <div className="text-xs text-gray-400">
              últimos 30 dias
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}