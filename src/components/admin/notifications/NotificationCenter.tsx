'use client';

import { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import {
  BellIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ShoppingBagIcon,
  CurrencyDollarIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  category: 'order' | 'product' | 'payment' | 'message' | 'system';
}

interface NotificationCenterProps {
  className?: string;
}

// Mock notifications
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'warning',
    title: 'Produto com estoque baixo',
    message: 'iPhone 15 Pro Max tem apenas 2 unidades em estoque',
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    read: false,
    actionUrl: '/admin/produtos/MLB123456789',
    actionLabel: 'Ver Produto',
    category: 'product',
  },
  {
    id: '2',
    type: 'success',
    title: 'Novo pedido recebido',
    message: 'Pedido #ORD-123456789 foi confirmado (R$ 7.899,99)',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    read: false,
    actionUrl: '/admin/vendas/ORD-123456789',
    actionLabel: 'Ver Pedido',
    category: 'order',
  },
  {
    id: '3',
    type: 'info',
    title: 'Nova pergunta no produto',
    message: 'Comprador perguntou sobre disponibilidade de cores',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    read: true,
    actionUrl: '/admin/comunicacao/perguntas',
    actionLabel: 'Responder',
    category: 'message',
  },
  {
    id: '4',
    type: 'error',
    title: 'Falha no pagamento',
    message: 'Pagamento do pedido #ORD-987654321 foi rejeitado',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    read: true,
    actionUrl: '/admin/vendas/ORD-987654321',
    actionLabel: 'Ver Detalhes',
    category: 'payment',
  },
  {
    id: '5',
    type: 'info',
    title: 'Sincronização concluída',
    message: 'Produtos sincronizados com sucesso com o Mercado Livre',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    read: true,
    category: 'system',
  },
];

const getNotificationIcon = (category: Notification['category']) => {
  switch (category) {
    case 'order':
      return ShoppingBagIcon;
    case 'payment':
      return CurrencyDollarIcon;
    case 'message':
      return ChatBubbleLeftRightIcon;
    case 'product':
      return ShoppingBagIcon;
    case 'system':
      return InformationCircleIcon;
    default:
      return BellIcon;
  }
};

const getTypeIcon = (type: Notification['type']) => {
  switch (type) {
    case 'success':
      return CheckIcon;
    case 'warning':
      return ExclamationTriangleIcon;
    case 'error':
      return ExclamationTriangleIcon;
    case 'info':
      return InformationCircleIcon;
    default:
      return InformationCircleIcon;
  }
};

const getTypeColor = (type: Notification['type']) => {
  switch (type) {
    case 'success':
      return 'text-green-600';
    case 'warning':
      return 'text-yellow-600';
    case 'error':
      return 'text-red-600';
    case 'info':
      return 'text-blue-600';
    default:
      return 'text-gray-600';
  }
};

const formatTimestamp = (timestamp: Date) => {
  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 60) {
    return `${minutes}m atrás`;
  } else if (hours < 24) {
    return `${hours}h atrás`;
  } else {
    return `${days}d atrás`;
  }
};

export default function NotificationCenter({ className }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const unreadCount = notifications.filter(n => !n.read).length;
  
  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => 
      prev.filter(n => n.id !== notificationId)
    );
  };

  return (
    <div className={clsx('relative', className)}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white" />
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Notificações
                  {unreadCount > 0 && (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {unreadCount}
                    </span>
                  )}
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              
              {/* Filters */}
              <div className="mt-3 flex space-x-3">
                <button
                  onClick={() => setFilter('all')}
                  className={clsx(
                    'text-sm font-medium px-3 py-1 rounded-full',
                    filter === 'all'
                      ? 'bg-green-100 text-green-800'
                      : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  Todas
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={clsx(
                    'text-sm font-medium px-3 py-1 rounded-full',
                    filter === 'unread'
                      ? 'bg-green-100 text-green-800'
                      : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  Não lidas ({unreadCount})
                </button>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-green-600 hover:text-green-800 ml-auto"
                  >
                    Marcar todas como lidas
                  </button>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {filteredNotifications.length === 0 ? (
                <div className="p-6 text-center">
                  <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    Nenhuma notificação
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Você está em dia com tudo!
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredNotifications.map((notification) => {
                    const IconComponent = getNotificationIcon(notification.category);
                    const TypeIcon = getTypeIcon(notification.type);
                    
                    return (
                      <div
                        key={notification.id}
                        className={clsx(
                          'p-4 hover:bg-gray-50 transition-colors',
                          !notification.read && 'bg-blue-50'
                        )}
                      >
                        <div className="flex space-x-3">
                          <div className="flex-shrink-0">
                            <div className={clsx(
                              'h-8 w-8 rounded-full flex items-center justify-center',
                              notification.type === 'success' && 'bg-green-100',
                              notification.type === 'warning' && 'bg-yellow-100',
                              notification.type === 'error' && 'bg-red-100',
                              notification.type === 'info' && 'bg-blue-100'
                            )}>
                              <TypeIcon className={clsx('h-4 w-4', getTypeColor(notification.type))} />
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className={clsx(
                                  'text-sm font-medium',
                                  notification.read ? 'text-gray-900' : 'text-gray-900 font-semibold'
                                )}>
                                  {notification.title}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-2">
                                  {formatTimestamp(notification.timestamp)}
                                </p>
                              </div>
                              
                              <div className="flex items-center space-x-2 ml-2">
                                {!notification.read && (
                                  <button
                                    onClick={() => markAsRead(notification.id)}
                                    className="text-xs text-green-600 hover:text-green-800"
                                    title="Marcar como lida"
                                  >
                                    <CheckIcon className="h-4 w-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => deleteNotification(notification.id)}
                                  className="text-xs text-gray-400 hover:text-gray-600"
                                  title="Remover notificação"
                                >
                                  <XMarkIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            
                            {notification.actionUrl && notification.actionLabel && (
                              <div className="mt-3">
                                <a
                                  href={notification.actionUrl}
                                  className="text-sm text-green-600 hover:text-green-800 font-medium"
                                  onClick={() => setIsOpen(false)}
                                >
                                  {notification.actionLabel} →
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}