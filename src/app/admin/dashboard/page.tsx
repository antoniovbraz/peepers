/**
 * Admin Dashboard Page - v2.0
 * 
 * Modern dashboard with KPIs, charts, and quick actions
 * following Clean Architecture presentation layer patterns
 */

'use client';

import { Suspense } from 'react';
import { 
  ShoppingBagIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

// Mock data - in real implementation, this would come from repositories
const mockMetrics = {
  products: {
    total: 95,
    active: 89,
    paused: 4,
    outOfStock: 2,
    change: +12
  },
  sales: {
    today: 15420.50,
    week: 89350.75,
    month: 342150.20,
    change: +18.5
  },
  orders: {
    pending: 8,
    shipped: 23,
    delivered: 156,
    total: 187,
    change: +5.2
  },
  reputation: {
    score: 98,
    level: 'Excelente',
    transactions: 1247,
    change: +0.3
  }
};

interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: typeof ShoppingBagIcon;
  color: 'primary' | 'secondary' | 'accent' | 'gray';
  subtitle?: string;
}

function MetricCard({ title, value, change, icon: Icon, color, subtitle }: MetricCardProps) {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-600 border-primary-200',
    secondary: 'bg-secondary-50 text-secondary-600 border-secondary-200',
    accent: 'bg-accent-50 text-accent-600 border-accent-200',
    gray: 'bg-gray-50 text-gray-600 border-gray-200'
  };

  const changeColor = change >= 0 ? 'text-green-600' : 'text-red-600';
  const ChangeIcon = change >= 0 ? ArrowTrendingUpIcon : ArrowTrendingDownIcon;

  return (
    <div className={`rounded-xl border p-6 transition-all duration-200 hover:shadow-md ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`rounded-lg p-2 ${color === 'primary' ? 'bg-primary-100' : color === 'secondary' ? 'bg-secondary-100' : color === 'accent' ? 'bg-accent-100' : 'bg-gray-100'}`}>
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

interface QuickActionProps {
  title: string;
  description: string;
  icon: typeof ShoppingBagIcon;
  href: string;
  badge?: number;
}

function QuickAction({ title, description, icon: Icon, href, badge }: QuickActionProps) {
  return (
    <a
      href={href}
      className="group block rounded-xl border border-gray-200 p-4 transition-all duration-200 hover:border-primary-300 hover:shadow-md hover:bg-primary-50"
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="rounded-lg bg-gray-100 p-2 group-hover:bg-primary-100 transition-colors">
            <Icon className="h-5 w-5 text-gray-600 group-hover:text-primary-600" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900 group-hover:text-primary-900">
              {title}
            </p>
            {badge && (
              <span className="inline-flex items-center rounded-full bg-accent-100 px-2 py-1 text-xs font-medium text-accent-600">
                {badge}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 group-hover:text-primary-700">
            {description}
          </p>
        </div>
      </div>
    </a>
  );
}

function ActivityFeed() {
  const activities = [
    {
      id: 1,
      type: 'sale',
      message: 'Novo pedido recebido - R$ 89,90',
      time: '2 min atrás',
      icon: CurrencyDollarIcon,
      color: 'text-green-600 bg-green-100'
    },
    {
      id: 2,
      type: 'product',
      message: 'Produto "Smartphone XYZ" com estoque baixo',
      time: '15 min atrás',
      icon: ExclamationTriangleIcon,
      color: 'text-yellow-600 bg-yellow-100'
    },
    {
      id: 3,
      type: 'message',
      message: '3 novas perguntas de clientes',
      time: '1h atrás',
      icon: UserGroupIcon,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      id: 4,
      type: 'view',
      message: 'Aumento de 25% nas visualizações hoje',
      time: '2h atrás',
      icon: EyeIcon,
      color: 'text-purple-600 bg-purple-100'
    }
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Atividades Recentes</h3>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3">
            <div className={`rounded-lg p-2 ${activity.color}`}>
              <activity.icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900">{activity.message}</p>
              <p className="text-xs text-gray-500">{activity.time}</p>
            </div>
          </div>
        ))}
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
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Visão geral do seu negócio no Mercado Livre</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Suspense fallback={<LoadingCard />}>
          <MetricCard
            title="Produtos Ativos"
            value={mockMetrics.products.active}
            change={mockMetrics.products.change}
            icon={ShoppingBagIcon}
            color="primary"
            subtitle={`${mockMetrics.products.total} total`}
          />
        </Suspense>

        <Suspense fallback={<LoadingCard />}>
          <MetricCard
            title="Vendas do Mês"
            value={`R$ ${mockMetrics.sales.month.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            change={mockMetrics.sales.change}
            icon={CurrencyDollarIcon}
            color="secondary"
          />
        </Suspense>

        <Suspense fallback={<LoadingCard />}>
          <MetricCard
            title="Pedidos Ativos"
            value={mockMetrics.orders.pending + mockMetrics.orders.shipped}
            change={mockMetrics.orders.change}
            icon={ChartBarIcon}
            color="accent"
            subtitle={`${mockMetrics.orders.total} total`}
          />
        </Suspense>

        <Suspense fallback={<LoadingCard />}>
          <MetricCard
            title="Reputação"
            value={`${mockMetrics.reputation.score}%`}
            change={mockMetrics.reputation.change}
            icon={ArrowTrendingUpIcon}
            color="gray"
            subtitle={mockMetrics.reputation.level}
          />
        </Suspense>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickAction
            title="Gerenciar Produtos"
            description="Adicionar, editar ou pausar produtos"
            icon={ShoppingBagIcon}
            href="/admin/produtos"
          />
          <QuickAction
            title="Ver Pedidos"
            description="Acompanhar vendas e envios"
            icon={CurrencyDollarIcon}
            href="/admin/vendas"
            badge={mockMetrics.orders.pending}
          />
          <QuickAction
            title="Responder Clientes"
            description="Perguntas e mensagens pendentes"
            icon={UserGroupIcon}
            href="/admin/comunicacao"
            badge={5}
          />
        </div>
      </div>

      {/* Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityFeed />
        
        {/* Placeholder for charts */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendas dos Últimos 7 Dias</h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <ChartBarIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>Gráfico de vendas em desenvolvimento</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}