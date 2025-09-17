/**
 * Notification Context - v2.0
 * 
 * Global notification system with toast and real-time updates
 * Supports different notification types and persistence
 */

'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  persistent?: boolean;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  showToast: (type: 'success' | 'error' | 'warning' | 'info', message: string, options?: any) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: React.ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = useCallback((notificationData: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notificationData,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Auto-show as toast if not persistent
    if (!notificationData.persistent) {
      showToast(notificationData.type, notificationData.message);
    }

    return newNotification.id;
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const showToast = useCallback((
    type: 'success' | 'error' | 'warning' | 'info',
    message: string,
    options: any = {}
  ) => {
    const toastOptions = {
      duration: type === 'error' ? 6000 : 4000,
      position: 'top-right' as const,
      ...options,
    };

    switch (type) {
      case 'success':
        toast.success(message, toastOptions);
        break;
      case 'error':
        toast.error(message, toastOptions);
        break;
      case 'warning':
        toast(message, {
          ...toastOptions,
          icon: '⚠️',
          style: {
            background: '#FEF3C7',
            color: '#92400E',
            border: '1px solid #F59E0B',
          },
        });
        break;
      case 'info':
        toast(message, {
          ...toastOptions,
          icon: 'ℹ️',
          style: {
            background: '#DBEAFE',
            color: '#1E40AF',
            border: '1px solid #3B82F6',
          },
        });
        break;
    }
  }, []);

  // Mock real-time notifications (in production, this would be WebSocket/SSE)
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate random notifications for demo
      const mockNotifications = [
        {
          type: 'success' as const,
          title: 'Nova venda realizada',
          message: 'Produto vendido: iPhone 15 Pro Max',
          persistent: true,
          metadata: { productId: 'MLB123456789', amount: 7899.99 }
        },
        {
          type: 'warning' as const,
          title: 'Estoque baixo',
          message: 'Samsung Galaxy S24 tem apenas 2 unidades',
          persistent: true,
          metadata: { productId: 'MLB987654321' }
        },
        {
          type: 'info' as const,
          title: 'Nova pergunta',
          message: 'Cliente perguntou sobre prazo de entrega',
          persistent: true,
          actionUrl: '/admin/comunicacao',
          actionLabel: 'Responder'
        },
      ];

      // 10% chance of showing a notification every 30 seconds
      if (Math.random() < 0.1) {
        const randomNotification = mockNotifications[
          Math.floor(Math.random() * mockNotifications.length)
        ];
        addNotification(randomNotification);
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [addNotification]);

  // Load notifications from localStorage on mount
  useEffect(() => {
    const savedNotifications = localStorage.getItem('peepers-notifications');
    if (savedNotifications) {
      try {
        const parsed = JSON.parse(savedNotifications);
        setNotifications(parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
        })));
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    }
  }, []);

  // Save notifications to localStorage when they change
  useEffect(() => {
    localStorage.setItem('peepers-notifications', JSON.stringify(notifications));
  }, [notifications]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    showToast,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#FFFFFF',
            color: '#1F2937',
            border: '1px solid #E5E7EB',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
          success: {
            iconTheme: {
              primary: '#0D6832',
              secondary: '#FFFFFF',
            },
          },
          error: {
            iconTheme: {
              primary: '#DC2626',
              secondary: '#FFFFFF',
            },
          },
        }}
      />
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

// Utility hooks for common notification patterns
export function useNotificationActions() {
  const { addNotification, showToast } = useNotifications();

  const notifySuccess = useCallback((message: string, title?: string) => {
    if (title) {
      addNotification({ type: 'success', title, message });
    } else {
      showToast('success', message);
    }
  }, [addNotification, showToast]);

  const notifyError = useCallback((message: string, title?: string) => {
    if (title) {
      addNotification({ type: 'error', title, message });
    } else {
      showToast('error', message);
    }
  }, [addNotification, showToast]);

  const notifyWarning = useCallback((message: string, title?: string) => {
    if (title) {
      addNotification({ type: 'warning', title, message });
    } else {
      showToast('warning', message);
    }
  }, [addNotification, showToast]);

  const notifyInfo = useCallback((message: string, title?: string) => {
    if (title) {
      addNotification({ type: 'info', title, message });
    } else {
      showToast('info', message);
    }
  }, [addNotification, showToast]);

  return {
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo,
  };
}