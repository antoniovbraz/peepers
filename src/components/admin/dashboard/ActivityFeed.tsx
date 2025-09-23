/**
 * Activity Feed Component - v2.0
 * 
 * Real-time activity feed showing recent events and actions
 * Supports different activity types with contextual icons
export default function ActivityFeed({ className, maxItems = 10, realData }: ActivityFeedProps) {
  // Generate real activities from metrics if available
  const activities = realData ? generateRealActivities(realData, maxItems) : mockActivities;*/

'use client';

import { useState } from 'react';
import {
  ShoppingBagIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface ActivityItem {
  id: string;
  type: 'sale' | 'question' | 'payment' | 'issue' | 'product' | 'user';
  title: string;
  description: string;
  timestamp: string;
  status?: 'success' | 'warning' | 'error' | 'info';
  metadata?: {
    amount?: number;
    productId?: string;
    userId?: string;
  };
}

interface ActivityFeedProps {
  className?: string;
  maxItems?: number;
  // Real data from dashboard metrics
  realData?: {
    orders: {
      total: number;
      byStatus: Record<string, number>;
      totalRevenue: number;
    };
    products: {
      total: number;
      active: number;
      paused: number;
      closed: number;
    };
    alerts: Array<{
      id: string;
      type: string;
      severity: string;
      title: string;
      message: string;
      timestamp: Date;
    }>;
  };
}

// Generate real activities from dashboard metrics
const generateRealActivities = (realData: NonNullable<ActivityFeedProps['realData']>, maxItems: number = 10): ActivityItem[] => {
  const activities: ActivityItem[] = [];
  const now = new Date();
  
  // Add order-related activities
  if (realData.orders.total > 0) {
    activities.push({
      id: 'real-orders-summary',
      type: 'sale',
      title: `${realData.orders.total} pedidos processados`,
      description: `Receita total de R$ ${realData.orders.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      timestamp: new Date(now.getTime() - 1000 * 60 * 30).toISOString(), // 30 min ago
      status: 'success',
      metadata: { amount: realData.orders.totalRevenue }
    });
  }
  
  // Add product status activities
  if (realData.products.active > 0) {
    activities.push({
      id: 'real-products-active',
      type: 'product',
      title: `${realData.products.active} produtos ativos`,
      description: `${realData.products.total} produtos cadastrados no total`,
      timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      status: 'info'
    });
  }
  
  // Add alerts as activities
  realData.alerts.slice(0, 3).forEach((alert, index) => {
    const activityType = alert.type === 'order' ? 'question' : 
                        alert.type === 'product' ? 'product' : 
                        alert.type === 'reputation' ? 'user' : 'issue';
    
    activities.push({
      id: `real-alert-${index}`,
      type: activityType as ActivityItem['type'],
      title: alert.title,
      description: alert.message,
      timestamp: alert.timestamp.toISOString(),
      status: alert.severity === 'critical' ? 'error' : 
              alert.severity === 'high' ? 'warning' : 'info'
    });
  });
  
  // Add some default activities if we don't have enough real data
  if (activities.length < 3) {
    activities.push({
      id: 'real-system-status',
      type: 'user',
      title: 'Sistema operacional',
      description: 'Dashboard atualizado com dados em tempo real',
      timestamp: now.toISOString(),
      status: 'info'
    });
  }
  
  return activities.slice(0, (maxItems || 10));
};

const getActivityIcon = (type: ActivityItem['type']) => {
  const iconClasses = 'h-5 w-5';
  
  switch (type) {
    case 'sale':
      return <ShoppingBagIcon className={iconClasses} />;
    case 'question':
      return <ChatBubbleLeftRightIcon className={iconClasses} />;
    case 'payment':
      return <CurrencyDollarIcon className={iconClasses} />;
    case 'issue':
      return <ExclamationTriangleIcon className={iconClasses} />;
    case 'product':
      return <CheckCircleIcon className={iconClasses} />;
    case 'user':
      return <UserIcon className={iconClasses} />;
    default:
      return <ClockIcon className={iconClasses} />;
  }
};

const getStatusColor = (status?: ActivityItem['status']) => {
  switch (status) {
    case 'success':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'warning':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'error':
      return 'text-red-600 bg-red-50 border-red-200';
    default:
      return 'text-blue-600 bg-blue-50 border-blue-200';
  }
};

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'agora';
  if (diffInMinutes < 60) return `${diffInMinutes}m atrás`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h atrás`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d atrás`;
  
  return date.toLocaleDateString('pt-BR');
};

export default function ActivityFeed({ className, maxItems = 6 }: ActivityFeedProps) {
  const [filter, setFilter] = useState<ActivityItem['type'] | 'all'>('all');
  
  const filteredActivities = mockActivities
    .filter(activity => filter === 'all' || activity.type === filter)
    .slice(0, maxItems);

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Atividade Recente
          </h3>
          <p className="text-sm text-gray-600">
            Últimas ações e eventos do sistema
          </p>
        </div>
        
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as ActivityItem['type'] | 'all')}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-green-500 focus:border-green-500"
        >
          <option value="all">Todas</option>
          <option value="sale">Vendas</option>
          <option value="question">Perguntas</option>
          <option value="payment">Pagamentos</option>
          <option value="issue">Problemas</option>
          <option value="product">Produtos</option>
          <option value="user">Usuário</option>
        </select>
      </div>

      <div className="space-y-4">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-8">
            <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Nenhuma atividade encontrada</p>
          </div>
        ) : (
          filteredActivities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start space-x-3 p-3 rounded-lg border transition-colors hover:bg-gray-50"
            >
              <div className={`flex-shrink-0 p-2 rounded-lg border ${getStatusColor(activity.status)}`}>
                {getActivityIcon(activity.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {activity.title}
                  </h4>
                  <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                    {formatTimestamp(activity.timestamp)}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-2">
                  {activity.description}
                </p>
                
                {activity.metadata && (
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    {activity.metadata.amount && (
                      <span>R$ {activity.metadata.amount.toLocaleString()}</span>
                    )}
                    {activity.metadata.productId && (
                      <span>ID: {activity.metadata.productId}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {filteredActivities.length >= maxItems && (
        <div className="mt-4 text-center">
          <button className="text-sm text-green-600 hover:text-green-700 font-medium">
            Ver todas as atividades
          </button>
        </div>
      )}
    </div>
  );
}

// Mock activity data for fallback
const mockActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'sale',
    title: 'Nova venda realizada',
    description: 'iPhone 15 Pro Max vendido para João Silva',
    timestamp: '2025-09-17T14:30:00Z',
    status: 'success',
    metadata: { amount: 7899.99, productId: 'MLB123456789' }
  },
  {
    id: '2',
    type: 'question',
    title: 'Nova pergunta recebida',
    description: 'Cliente perguntou sobre prazo de entrega',
    timestamp: '2025-09-17T14:15:00Z',
    status: 'info'
  },
  {
    id: '3',
    type: 'payment',
    title: 'Pagamento aprovado',
    description: 'Pagamento de R$ 6.299,99 aprovado via PIX',
    timestamp: '2025-09-17T13:45:00Z',
    status: 'success',
    metadata: { amount: 6299.99 }
  },
  {
    id: '4',
    type: 'issue',
    title: 'Problema no estoque',
    description: 'Samsung Galaxy S24 Ultra sem estoque',
    timestamp: '2025-09-17T13:20:00Z',
    status: 'warning',
    metadata: { productId: 'MLB987654321' }
  },
  {
    id: '5',
    type: 'product',
    title: 'Produto pausado',
    description: 'MacBook Pro M3 pausado pelo vendedor',
    timestamp: '2025-09-17T12:50:00Z',
    status: 'info'
  },
  {
    id: '6',
    type: 'user',
    title: 'Login realizado',
    description: 'Acesso ao painel administrativo',
    timestamp: '2025-09-17T12:00:00Z',
    status: 'info'
  }
];