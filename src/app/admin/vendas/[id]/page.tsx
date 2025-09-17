'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ArrowLeftIcon, 
  CurrencyDollarIcon, 
  TruckIcon,
  UserIcon,
  MapPinIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

import { getMockOrders } from '@/data/mockSales';

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id;
  
  // Get specific order (in real app, fetch from API)
  const { orders } = getMockOrders(100, 0, {});
  const order = orders.find(o => o.id.toString() === orderId);

  if (!order) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Pedido não encontrado</h1>
          <Link 
            href="/admin/vendas"
            className="text-green-600 hover:text-green-700"
          >
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
              <h1 className="text-2xl font-bold text-gray-900">Pedido #{order.id}</h1>
              <p className="text-gray-600 mt-1">
                Criado em {format(new Date(order.dateCreated), 'dd/MM/yyyy "às" HH:mm', { locale: ptBR })}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {getStatusBadge(order.status)}
            <div className="text-right">
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(order.totalAmount)}</p>
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
              {order.orderItems.map((item) => (
                <div key={item.id} className="flex items-center space-x-4 border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-16 h-16 rounded object-cover"
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
                <span className="font-medium">{order.shipping.status}</span>
              </div>
              {order.shipping.trackingNumber && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Código de rastreamento:</span>
                  <span className="font-medium font-mono">{order.shipping.trackingNumber}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Custo do frete:</span>
                <span className="font-medium">{formatCurrency(order.shipping.cost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Endereço:</span>
                <div className="text-right">
                  <p className="font-medium">{order.shipping.receiverAddress.streetName} {order.shipping.receiverAddress.streetNumber}</p>
                  <p className="text-sm text-gray-600">
                    {order.shipping.receiverAddress.city}, {order.shipping.receiverAddress.state}
                  </p>
                  <p className="text-sm text-gray-600">{order.shipping.receiverAddress.zipCode}</p>
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
                  {order.buyer.firstName} {order.buyer.lastName}
                </p>
                <p className="text-sm text-gray-600">{order.buyer.email}</p>
                {order.buyer.phone && (
                  <p className="text-sm text-gray-600">
                    ({order.buyer.phone.areaCode}) {order.buyer.phone.number}
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
              {order.payments.map((payment, index) => (
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
                  {payment.installments > 1 && (
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
                    {format(new Date(order.dateCreated), 'dd/MM/yyyy "às" HH:mm', { locale: ptBR })}
                  </p>
                </div>
              </div>
              
              {order.status !== 'confirmed' && (
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Status atualizado</p>
                    <p className="text-xs text-gray-500">Status atual: {order.status}</p>
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