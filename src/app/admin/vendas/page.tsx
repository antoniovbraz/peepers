'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowPathIcon, CurrencyDollarIcon, EyeIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';

import { useNotificationActions } from '@/contexts/NotificationContext';

interface TransformedOrder {
  id: string;
  status: string;
  date: string;
  total: number;
  currency: string;
  buyer: string;
  quantity: number;
  items: Array<{
    id: string;
    title: string;
    quantity: number;
    price: number;
  }>;
  payment_method?: string;
  payment_status?: string;
  shipping_status?: string;
}

interface SalesMetrics {
  total_orders: number;
  total_revenue: number;
  total_products_sold: number;
  avg_order_value: number;
}

interface SalesApiResponse {
  success: boolean;
  data: {
    orders: TransformedOrder[];
    metrics: SalesMetrics;
    pagination: {
      total: number;
      offset: number;
      limit: number;
      has_more: boolean;
    };
  };
  source: string;
  error?: string;
}

export default function SalesPage() {
  const [orders, setOrders] = useState<TransformedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [metrics, setMetrics] = useState<SalesMetrics>({
    total_orders: 0,
    total_revenue: 0,
    total_products_sold: 0,
    avg_order_value: 0,
  });
  
  const { notifyError } = useNotificationActions();

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      // Buscar dados reais da API do Mercado Livre
      const response = await fetch(`/api/admin/sales?limit=20&search=${encodeURIComponent(searchTerm)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Importante para enviar cookies de autenticação
      });

      if (response.ok) {
        const data: SalesApiResponse = await response.json();
        if (data.success && data.data?.orders) {
          setOrders(data.data.orders);
          // Atualizar métricas se disponíveis
          if (data.data.metrics) {
            setMetrics(data.data.metrics);
          }
        } else {
          throw new Error(data.error || 'Dados inválidos da API');
        }
      } else {
        throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Erro ao carregar vendas:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      notifyError(`Erro ao carregar vendas: ${errorMessage}`);
      
      // Limpar dados em caso de erro
      setOrders([]);
      setMetrics({
        total_orders: 0,
        total_revenue: 0,
        total_products_sold: 0,
        avg_order_value: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [searchTerm, notifyError]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900">Vendas</h1>
        <p className="text-gray-600 mt-1">Gerencie pedidos, pagamentos e envios</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <ShoppingBagIcon className="w-6 h-6 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Pedidos</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.total_orders}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Receita Total</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.total_revenue)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <ShoppingBagIcon className="w-6 h-6 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Produtos Vendidos</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.total_products_sold}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <CurrencyDollarIcon className="w-6 h-6 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Valor Médio Pedido</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.avg_order_value)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Pedidos Recentes</h3>
        
        <input
          type="text"
          placeholder="Buscar pedidos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-4 border border-gray-300 rounded-lg px-3 py-2 w-full max-w-md"
        />

        {loading ? (
          <div className="text-center py-8">
            <ArrowPathIcon className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Carregando pedidos...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Pedido #{order.id}</h4>
                    <p className="text-sm text-gray-500">{order.buyer}</p>
                    <p className="text-xs text-gray-500">
                      {order.quantity} produto{order.quantity !== 1 ? 's' : ''} • 
                      {order.payment_method || 'Método não informado'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatCurrency(order.total)}</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(order.date), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      order.status === 'paid' ? 'bg-green-100 text-green-800' :
                      order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'delivered' ? 'bg-purple-100 text-purple-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.status === 'paid' ? 'Pago' :
                       order.status === 'shipped' ? 'Enviado' :
                       order.status === 'delivered' ? 'Entregue' :
                       order.status}
                    </span>
                  </div>
                  <Link
                    href={`/admin/vendas/${order.id}`}
                    className="ml-4 text-green-600 hover:text-green-700 inline-flex items-center"
                  >
                    <EyeIcon className="w-4 h-4 mr-1" />
                    Ver detalhes
                  </Link>
                </div>
                
                {/* Mostrar itens do pedido */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="text-xs text-gray-500 space-y-1">
                    {order.items.slice(0, 2).map((item, index) => (
                      <div key={index} className="flex justify-between">
                        <span className="truncate flex-1">{item.title}</span>
                        <span className="ml-2">Qtd: {item.quantity}</span>
                      </div>
                    ))}
                    {order.items.length > 2 && (
                      <div className="text-gray-400">
                        +{order.items.length - 2} outros itens
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
