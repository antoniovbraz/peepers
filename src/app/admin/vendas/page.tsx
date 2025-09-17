'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowPathIcon, CurrencyDollarIcon, ClockIcon, EyeIcon } from '@heroicons/react/24/outline';

import { Order } from '@/types/sales';
import { getMockOrders, getMockSalesMetrics } from '@/data/mockSales';
import { useNotificationActions } from '@/contexts/NotificationContext';

export default function SalesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { notifyError } = useNotificationActions();

  const loadOrders = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const { orders: newOrders } = getMockOrders(10, 0, { search: searchTerm });
      setOrders(newOrders);
    } catch (error) {
      notifyError('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [searchTerm]);

  const metrics = getMockSalesMetrics();

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
            <CurrencyDollarIcon className="w-6 h-6 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Pedidos</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalOrders}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Receita Total</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.totalRevenue)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <ClockIcon className="w-6 h-6 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pendentes</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.pendingOrders}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Entregues</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.deliveredOrders}</p>
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
                    <p className="text-sm text-gray-500">{order.buyer.firstName} {order.buyer.lastName}</p>
                    <p className="text-xs text-gray-500">{order.buyer.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatCurrency(order.totalAmount)}</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(order.dateCreated), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {order.status}
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
