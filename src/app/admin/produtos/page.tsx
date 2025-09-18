/**
 * Admin Products Page - v2.0
 * 
 * Lista e gerenciamento de produtos do Mercado Livre
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { API_ENDPOINTS } from '@/config/routes';
import { handleImageError } from '@/lib/utils';

// Mock data para fallback
const mockProducts = [
  {
    id: 'MLB123456789',
    title: 'iPhone 15 Pro Max 256GB Azul Titânio',
    price: 7899.99,
    thumbnail: 'https://http2.mlstatic.com/D_Q_NP_123456_MLA.jpg',
    status: 'active' as ProductStatus,
    available_quantity: 5,
    condition: 'new',
    visits: 1247,
    questions: 8,
    sold_quantity: 23,
  },
  {
    id: 'MLB987654321',
    title: 'Samsung Galaxy S24 Ultra 512GB Preto',
    price: 6299.99,
    thumbnail: 'https://http2.mlstatic.com/D_Q_NP_987654_MLA.jpg',
    status: 'paused' as ProductStatus,
    available_quantity: 0,
    condition: 'new',
    visits: 892,
    questions: 3,
    sold_quantity: 15,
  },
];

type ProductStatus = 'active' | 'paused' | 'closed';
type SortOption = 'title' | 'price' | 'visits' | 'status';

export default function AdminProductsPage() {
  const [products, setProducts] = useState(mockProducts);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProductStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('title');
  const [isRealData, setIsRealData] = useState(false);

  // Função para carregar produtos reais da API
  const loadRealProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        format: 'summary',
        limit: '50',
        ...(searchQuery && { q: searchQuery }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
      });

      const response = await fetch(`${API_ENDPOINTS.PRODUCTS_V1}?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('ml_access_token')}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.products) {
          // Transformar dados da API para o formato esperado
          const transformedProducts = data.data.products.map((product: any) => ({
            id: product.id,
            title: product.title,
            price: product.price,
            thumbnail: product.thumbnail,
            status: product.status,
            available_quantity: product.available_quantity,
            condition: product.condition,
            visits: product.visits || 0,
            questions: product.questions || 0,
            sold_quantity: product.sold_quantity || 0,
          }));
          
          setProducts(transformedProducts);
          setIsRealData(true);
        } else {
          throw new Error('Dados inválidos da API');
        }
      } else {
        throw new Error(`API Error: ${response.status}`);
      }
    } catch (error) {
      console.warn('Erro ao carregar produtos reais, usando mock:', error);
      setProducts(mockProducts);
      setIsRealData(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Tentar carregar dados reais primeiro
    loadRealProducts();
  }, [searchQuery, statusFilter]);

  const getStatusBadge = (status: ProductStatus) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'closed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: ProductStatus) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'paused':
        return 'Pausado';
      case 'closed':
        return 'Finalizado';
      default:
        return status;
    }
  };

  const filteredProducts = products
    .filter(product => {
      const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return b.price - a.price;
        case 'visits':
          return b.visits - a.visits;
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return a.title.localeCompare(b.title);
      }
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gerencie seus produtos do Mercado Livre
          </p>
        </div>
        
        <Link
          href="/admin/produtos/novo"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Novo Produto
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {products.filter(p => p.status === 'active').length}
                  </span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Produtos Ativos
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {products.filter(p => p.status === 'active').length} de {products.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {products.filter(p => p.status === 'paused').length}
                  </span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Produtos Pausados
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {products.filter(p => p.status === 'paused').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {products.reduce((sum, p) => sum + p.sold_quantity, 0)}
                  </span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Vendido
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {products.reduce((sum, p) => sum + p.sold_quantity, 0)} unidades
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ProductStatus | 'all')}
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 rounded-md"
              >
                <option value="all">Todos os status</option>
                <option value="active">Ativos</option>
                <option value="paused">Pausados</option>
                <option value="closed">Finalizados</option>
              </select>
            </div>

            {/* Sort */}
            <div className="sm:w-48">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 rounded-md"
              >
                <option value="title">Ordenar por Título</option>
                <option value="price">Ordenar por Preço</option>
                <option value="visits">Ordenar por Visitas</option>
                <option value="status">Ordenar por Status</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredProducts.map((product) => (
            <li key={product.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-16 w-16">
                      <img
                        className="h-16 w-16 rounded-md object-cover bg-gray-100"
                        src={product.thumbnail}
                        alt={product.title}
                        onError={handleImageError}
                      />
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {product.title}
                        </p>
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(product.status)}`}>
                          {getStatusText(product.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        ID: {product.id}
                      </p>
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <span>R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        <span className="mx-2">•</span>
                        <span>{product.available_quantity} disponíveis</span>
                        <span className="mx-2">•</span>
                        <span>{product.visits} visualizações</span>
                        <span className="mx-2">•</span>
                        <span>{product.sold_quantity} vendidos</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/admin/produtos/${product.id}`}
                      className="text-gray-400 hover:text-gray-500"
                      title="Visualizar"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </Link>
                    <Link
                      href={`/admin/produtos/${product.id}/editar`}
                      className="text-gray-400 hover:text-gray-500"
                      title="Editar"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </Link>
                    <button
                      className="text-gray-400 hover:text-red-500"
                      title="Excluir"
                      onClick={() => {
                        if (confirm('Tem certeza que deseja excluir este produto?')) {
                          setProducts(products.filter(p => p.id !== product.id));
                        }
                      }}
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum produto encontrado</h3>
          <p className="mt-1 text-sm text-gray-500">
            Tente ajustar os filtros ou criar um novo produto.
          </p>
        </div>
      )}
    </div>
  );
}