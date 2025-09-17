'use client';

import { ReactNode } from 'react';
import { clsx } from 'clsx';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';

export interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    period: string;
  };
  icon?: ReactNode;
  status?: 'success' | 'warning' | 'error' | 'neutral';
  isLoading?: boolean;
  className?: string;
}

export default function KPICard({
  title,
  value,
  subtitle,
  trend,
  icon,
  status = 'neutral',
  isLoading = false,
  className,
}: KPICardProps) {
  const formatValue = (val: string | number): string => {
    if (typeof val === 'number') {
      // Format numbers with locale-appropriate separators
      return val.toLocaleString('pt-BR');
    }
    return val;
  };

  const getStatusColor = (status: KPICardProps['status']) => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  const getIconColor = (status: KPICardProps['status']) => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className={clsx(
        'bg-white border border-gray-200 rounded-lg p-6 shadow-sm',
        className
      )}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx(
      'border rounded-lg p-6 shadow-sm transition-shadow hover:shadow-md',
      getStatusColor(status),
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">
            {title}
          </p>
          
          <div className="flex items-baseline space-x-2">
            <p className="text-2xl font-bold text-gray-900">
              {formatValue(value)}
            </p>
            
            {trend && (
              <div className={clsx(
                'flex items-center text-sm font-medium',
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              )}>
                {trend.isPositive ? (
                  <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                ) : (
                  <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                )}
                <span>
                  {Math.abs(trend.value)}% {trend.period}
                </span>
              </div>
            )}
          </div>
          
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        
        {icon && (
          <div className={clsx(
            'flex-shrink-0 ml-4',
            getIconColor(status)
          )}>
            <div className="h-8 w-8">
              {icon}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}