'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ArrowLeftIcon, 
  CurrencyDollarIcon, 
  TruckIcon,
  UserIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

import { handleImageError } from '@/lib/utils';
import { getMockOrders } from '@/data/mockSales';

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        
        // TODO: Implement actual API call to fetch order details
        // const response = await fetch(`/api/admin/sales/${orderId}`, {
        //   method: 'GET',
        //   headers: { 'Content-Type': 'application/json' },
        //   credentials: 'include',
        // });
        
        // if (!response.ok) {
        //   throw new Error('Failed to fetch order details');
        // }
        
        // const data = await response.json();
        // setOrder(data);
        
        // For now, simulate loading and show error
        setTimeout(() => {
          setError('Funcionalidade de detalhes do pedido ainda não implementada. Use dados mock por enquanto.');
          setLoading(false);
        }, 1000);
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(errorMessage);
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando detalhes do pedido...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Erro ao carregar pedido</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link 
            href="/admin/vendas"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Voltar para vendas
          </Link>
        </div>
      </div>
    );
  }

  // Fallback to mock data if API not implemented yet
  const { orders } = getMockOrders(100, 0, {});
  const mockOrder = orders.find(o => o.id.toString() === orderId);

  if (!mockOrder) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Pedido não encontrado</h1>
          <Link 
            href="/admin/vendas"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Voltar para vendas
          </Link>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      confirmed: 'bg-blue-100 text-blue-800',
      payment_required: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-emerald-100 text-emerald-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link 
              href="/admin/vendas"
              className="text-gray-400 hover:text-gray-600"
            >
              <ArrowLeftIcon className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Pedido #{mockOrder.id}</h1>
              <p className="text-gray-600 mt-1">
                Criado em {format(new Date(mockOrder.dateCreated), 'dd/MM/yyyy "às" HH:mm', { locale: ptBR })}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {getStatusBadge(mockOrder.status)}
            <div className="text-right">
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(mockOrder.totalAmount)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Produtos</h3>
            <div className="space-y-4">
              {mockOrder.orderItems.map((item) => (
                <div key={item.id} className="flex items-center space-x-4 border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                  <Image
                    src={item.thumbnail}
                    alt={item.title}
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded object-cover"
                    onError={handleImageError}
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{item.title}</h4>
                    <p className="text-sm text-gray-500">Quantidade: {item.quantity}</p>
                    <p className="text-sm text-gray-500">Preço unitário: {formatCurrency(item.unitPrice)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <TruckIcon className="w-5 h-5 mr-2" />
              Informações de Envio
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Status do envio:</span>
                <span className="font-medium">{mockOrder.shipping.status}</span>
              </div>
              {mockOrder.shipping.trackingNumber && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Código de rastreamento:</span>
                  <span className="font-medium font-mono">{mockOrder.shipping.trackingNumber}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Custo do frete:</span>
                <span className="font-medium">{formatCurrency(mockOrder.shipping.cost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Endereço:</span>
                <div className="text-right">
                  <p className="font-medium">{mockOrder.shipping.receiverAddress.streetName} {mockOrder.shipping.receiverAddress.streetNumber}</p>
                  <p className="text-sm text-gray-600">
                    {mockOrder.shipping.receiverAddress.city}, {mockOrder.shipping.receiverAddress.state}
                  </p>
                  <p className="text-sm text-gray-600">{mockOrder.shipping.receiverAddress.zipCode}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <UserIcon className="w-5 h-5 mr-2" />
              Cliente
            </h3>
            <div className="space-y-3">
              <div>
                <p className="font-medium text-gray-900">
                  {mockOrder.buyer.firstName} {mockOrder.buyer.lastName}
                </p>
                <p className="text-sm text-gray-600">{mockOrder.buyer.email}</p>
                {mockOrder.buyer.phone && (
                  <p className="text-sm text-gray-600">
                    ({mockOrder.buyer.phone.areaCode}) {mockOrder.buyer.phone.number}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <CurrencyDollarIcon className="w-5 h-5 mr-2" />
              Pagamento
            </h3>
            <div className="space-y-3">
              {mockOrder.payments.map((payment, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-medium">{payment.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Método:</span>
                    <span className="font-medium">{payment.paymentMethodId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Valor:</span>
                    <span className="font-medium">{formatCurrency(payment.totalPaidAmount)}</span>
                  </div>
                  {payment.installments && payment.installments > 1 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Parcelas:</span>
                      <span className="font-medium">{payment.installments}x</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <ClockIcon className="w-5 h-5 mr-2" />
              Histórico
            </h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Pedido criado</p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(mockOrder.dateCreated), 'dd/MM/yyyy "às" HH:mm', { locale: ptBR })}
                  </p>
                </div>
              </div>
              
              {mockOrder.status !== 'confirmed' && (
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Status atualizado</p>
                    <p className="text-xs text-gray-500">Status atual: {mockOrder.status}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
