/**
 * Quick Actions Component - v2.0
 * 
 * Fast access buttons for common admin tasks
 * Contextual actions based on current state
 */

'use client';

import { useState } from 'react';
import {
  PlusIcon,
  ArrowPathIcon,
  ChartBarIcon,
  CogIcon,
  DocumentArrowDownIcon,
  BellIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: typeof PlusIcon;
  action: () => void;
  variant: 'primary' | 'secondary' | 'success' | 'warning';
  badge?: number;
}

interface QuickActionsProps {
  className?: string;
}

const getActionClasses = (variant: QuickAction['variant']) => {
  const baseClasses = 'flex flex-col items-center p-4 rounded-xl border transition-all duration-200 hover:shadow-md cursor-pointer';
  
  switch (variant) {
    case 'primary':
      return `${baseClasses} bg-green-50 border-green-200 text-green-700 hover:bg-green-100`;
    case 'secondary':
      return `${baseClasses} bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100`;
    case 'success':
      return `${baseClasses} bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100`;
    case 'warning':
      return `${baseClasses} bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100`;
    default:
      return `${baseClasses} bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100`;
  }
};

export default function QuickActions({ className }: QuickActionsProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleAction = async (actionId: string, action: () => void) => {
    setIsLoading(actionId);
    try {
      await action();
    } finally {
      setIsLoading(null);
    }
  };

  const actions: QuickAction[] = [
    {
      id: 'new-product',
      title: 'Novo Produto',
      description: 'Criar anúncio no ML',
      icon: PlusIcon,
      action: () => {
        // TODO: Navigate to product creation
        console.log('Navigating to new product...');
      },
      variant: 'primary'
    },
    {
      id: 'sync-data',
      title: 'Sincronizar',
      description: 'Atualizar dados ML',
      icon: ArrowPathIcon,
      action: async () => {
        // TODO: Trigger data sync
        console.log('Syncing data...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      },
      variant: 'secondary'
    },
    {
      id: 'view-analytics',
      title: 'Analytics',
      description: 'Ver métricas detalhadas',
      icon: ChartBarIcon,
      action: () => {
        // TODO: Navigate to analytics
        console.log('Navigating to analytics...');
      },
      variant: 'success'
    },
    {
      id: 'answer-questions',
      title: 'Perguntas',
      description: 'Responder clientes',
      icon: ChatBubbleLeftRightIcon,
      action: () => {
        // TODO: Navigate to Q&A
        console.log('Navigating to Q&A...');
      },
      variant: 'warning',
      badge: 5
    },
    {
      id: 'notifications',
      title: 'Notificações',
      description: 'Ver alertas',
      icon: BellIcon,
      action: () => {
        // TODO: Open notifications panel
        console.log('Opening notifications...');
      },
      variant: 'secondary',
      badge: 3
    },
    {
      id: 'export-report',
      title: 'Relatório',
      description: 'Exportar dados',
      icon: DocumentArrowDownIcon,
      action: async () => {
        // TODO: Generate and download report
        console.log('Generating report...');
        await new Promise(resolve => setTimeout(resolve, 1500));
      },
      variant: 'secondary'
    },
    {
      id: 'product-search',
      title: 'Buscar',
      description: 'Encontrar produtos',
      icon: MagnifyingGlassIcon,
      action: () => {
        // TODO: Open search modal
        console.log('Opening search...');
      },
      variant: 'secondary'
    },
    {
      id: 'settings',
      title: 'Configurações',
      description: 'Ajustar sistema',
      icon: CogIcon,
      action: () => {
        // TODO: Navigate to settings
        console.log('Navigating to settings...');
      },
      variant: 'secondary'
    }
  ];

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Ações Rápidas
        </h3>
        <p className="text-sm text-gray-600">
          Acesso rápido às funcionalidades principais
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          const isActionLoading = isLoading === action.id;
          
          return (
            <div
              key={action.id}
              className={getActionClasses(action.variant)}
              onClick={() => !isActionLoading && handleAction(action.id, action.action)}
            >
              <div className="relative mb-3">
                {isActionLoading ? (
                  <ArrowPathIcon className="h-6 w-6 animate-spin" />
                ) : (
                  <Icon className="h-6 w-6" />
                )}
                {action.badge && !isActionLoading && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {action.badge}
                  </span>
                )}
              </div>
              
              <h4 className="text-sm font-medium text-center mb-1">
                {action.title}
              </h4>
              
              <p className="text-xs text-center opacity-75">
                {action.description}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Última sincronização:</span>
          <span>há 5 minutos</span>
        </div>
        <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
          <div className="bg-green-500 h-1 rounded-full" style={{ width: '85%' }}></div>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Sistema funcionando normalmente
        </p>
      </div>
    </div>
  );
}