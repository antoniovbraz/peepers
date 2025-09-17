'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingBagIcon,
  CurrencyDollarIcon,
  TruckIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import KPICard from '@/components/admin/dashboard/KPICard';

// Types
interface Order {
  id: string;
  buyer: {
    id: number;
    name: string;
    email: string;
  };
  items: Array<{
    id: string;
    title: string;
    quantity: number;
    unit_price: number;
    thumbnail: string;
  }>;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'ready_to_ship' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'approved' | 'rejected' | 'refunded';
  shipping: {
    mode: string;
    status: 'pending' | 'ready_to_ship' | 'shipped' | 'delivered';
    tracking_number?: string;
  };
  date_created: string;
  date_closed?: string;
}

// Mock data
const mockOrders: Order[] = [
  {
    id: 'ORD-123456789',
    buyer: {
      id: 123456,
      name: 'João Silva',
      email: 'joao.silva@email.com',
    },
    items: [
      {
        id: 'MLB123456789',
        title: 'iPhone 15 Pro Max 256GB Azul Titânio',
        quantity: 1,
        unit_price: 7899.99,
        thumbnail: 'https://http2.mlstatic.com/D_Q_NP_123456_MLA.jpg',
      },
    ],
    total_amount: 7899.99,
    status: 'ready_to_ship',
    payment_status: 'approved',
    shipping: {
      mode: 'me2',
      status: 'ready_to_ship',
    },
    date_created: '2025-09-15T10:30:00Z',
  },
  {
    id: 'ORD-987654321',
    buyer: {
      id: 987654,
      name: 'Maria Santos',
      email: 'maria.santos@email.com',
    },
    items: [
      {
        id: 'MLB987654321',
        title: 'Samsung Galaxy S24 Ultra 512GB Preto',
        quantity: 2,
        unit_price: 6299.99,
        thumbnail: 'https://http2.mlstatic.com/D_Q_NP_987654_MLA.jpg',
      },
    ],
    total_amount: 12599.98,
    status: 'shipped',
    payment_status: 'approved',
    shipping: {
      mode: 'me2',
      status: 'shipped',
      tracking_number: 'BR123456789BR',
    },
    date_created: '2025-09-14T14:20:00Z',
  },
  {
    id: 'ORD-456789123',
    buyer: {
      id: 456789,
      name: 'Carlos Oliveira',
      email: 'carlos.oliveira@email.com',
    },
    items: [
      {
        id: 'MLB456789123',
        title: 'MacBook Air M3 256GB Prateado',
        quantity: 1,
        unit_price: 9999.99,
        thumbnail: 'https://http2.mlstatic.com/D_Q_NP_456789_MLA.jpg',
      },
    ],
    total_amount: 9999.99,
    status: 'pending',
    payment_status: 'pending',
    shipping: {
      mode: 'me2',
      status: 'pending',
    },
    date_created: '2025-09-17T09:15:00Z',
  },
];

// Helper functions
const getStatusColor = (status: Order['status']) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'confirmed':
      return 'bg-blue-100 text-blue-800';
    case 'ready_to_ship':
      return 'bg-orange-100 text-orange-800';
    case 'shipped':
      return 'bg-purple-100 text-purple-800';
    case 'delivered':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusText = (status: Order['status']) => {
  switch (status) {
    case 'pending':
      return 'Pendente';
    case 'confirmed':
      return 'Confirmado';
    case 'ready_to_ship':
      return 'Pronto para Envio';
    case 'shipped':
      return 'Enviado';
    case 'delivered':
      return 'Entregue';
    case 'cancelled':
      return 'Cancelado';
    default:
      return 'Desconhecido';
  }
};

const getPaymentStatusColor = (status: Order['payment_status']) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'approved':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    case 'refunded':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getPaymentStatusText = (status: Order['payment_status']) => {
  switch (status) {
    case 'pending':
      return 'Pendente';
    case 'approved':
      return 'Aprovado';
    case 'rejected':
      return 'Rejeitado';
    case 'refunded':
      return 'Reembolsado';
    default:
      return 'Desconhecido';
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function VendasPage() {
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>(mockOrders);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // Calculate metrics
  const metrics = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    readyToShip: orders.filter(o => o.status === 'ready_to_ship').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    totalRevenue: orders
      .filter(o => o.payment_status === 'approved')
      .reduce((sum, o) => sum + o.total_amount, 0),
  };

  // Filter orders
  useEffect(() => {
    let filtered = orders;

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(order => order.status === selectedStatus);
    }

    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.buyer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items.some(item => 
          item.title.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    setFilteredOrders(filtered);
  }, [orders, selectedStatus, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendas</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gerencie pedidos, pagamentos e envios
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
            <TruckIcon className="h-4 w-4 mr-2" />
            Sincronizar Pedidos
          </button>
          <Link
            href="/admin/vendas/relatorios"
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <EyeIcon className="h-4 w-4 mr-2" />
            Ver Relatórios
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total de Pedidos"
          value={metrics.total}
          subtitle="todos os pedidos"
          icon={<ShoppingBagIcon className="h-full w-full" />}
          status="neutral"
        />
        
        <KPICard
          title="Receita Total"
          value={`R$ ${metrics.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitle="pagamentos aprovados"
          trend={{
            value: 15.3,
            isPositive: true,
            period: 'vs mês anterior',
          }}
          icon={<CurrencyDollarIcon className="h-full w-full" />}
          status="success"
        />
        
        <KPICard
          title="Prontos para Envio"
          value={metrics.readyToShip}
          subtitle="requerem ação"
          icon={<ClockIcon className="h-full w-full" />}
          status={metrics.readyToShip > 0 ? 'warning' : 'success'}
        />
        
        <KPICard
          title="Pedidos Enviados"
          value={metrics.shipped}
          subtitle="em trânsito"
          icon={<TruckIcon className="h-full w-full" />}
          status="neutral"
        />
      </div>

      {/* Filters and Search */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4">
            {/* Search */}
            <div className="flex-1 max-w-lg">
              <label htmlFor="search" className="sr-only">
                Buscar pedidos
              </label>
              <input
                type="text"
                name="search"
                id="search"
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="Buscar por ID, comprador ou produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-4">
              <label htmlFor="status" className="text-sm font-medium text-gray-700">
                Status:
              </label>
              <select
                id="status"
                name="status"
                className="border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">Todos</option>
                <option value="pending">Pendente</option>
                <option value="confirmed">Confirmado</option>
                <option value="ready_to_ship">Pronto para Envio</option>
                <option value="shipped">Enviado</option>
                <option value="delivered">Entregue</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Pedidos ({filteredOrders.length})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pedido
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Comprador
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produtos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pagamento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {order.id}
                    </div>
                    {order.shipping.tracking_number && (
                      <div className="text-sm text-gray-500">
                        Rastreio: {order.shipping.tracking_number}
                      </div>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {order.buyer.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {order.buyer.email}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img
                          className="h-10 w-10 rounded object-cover"
                          src={order.items[0]?.thumbnail || '/placeholder.jpg'}
                          alt={order.items[0]?.title || 'Produto'}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {order.items[0]?.title}
                        </div>
                        {order.items.length > 1 && (
                          <div className="text-sm text-gray-500">
                            +{order.items.length - 1} produto(s)
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      R$ {order.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={clsx(
                      'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                      getStatusColor(order.status)
                    )}>
                      {getStatusText(order.status)}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={clsx(
                      'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                      getPaymentStatusColor(order.payment_status)
                    )}>
                      {getPaymentStatusText(order.payment_status)}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(order.date_created)}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/admin/vendas/${order.id}`}
                      className="text-green-600 hover:text-green-900"
                    >
                      Ver Detalhes
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Nenhum pedido encontrado
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Tente ajustar os filtros ou o termo de busca.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}