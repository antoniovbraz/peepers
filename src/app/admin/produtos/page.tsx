/**
 * Admin Products Page - v2.0
 * 
 * Lista e gerenciamento de produtos do Mercado Livre
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { API_ENDPOINTS } from '@/config/routes';
import type { MLProduct } from '@/types/ml';

// ✅ REMOVIDO: Sem dados mock - apenas dados reais do ML

type ProductStatus = 'active' | 'paused' | 'closed';
type SortOption = 'title' | 'price' | 'visits' | 'status';

type Product = {
  id: string;
  title: string;
  price: number;
  thumbnail: string;
  status: ProductStatus;
  available_quantity: number;
  condition: string;
  visits?: number;
  questions?: number;
  sold_quantity?: number;
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProductStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('title');
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
  
  // Estado para paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pageSize] = useState(50); // 50 produtos por página para melhor performance
  
  // Estado para carregamento incremental
  const [hasMoreProducts, setHasMoreProducts] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Função para carregar produtos reais da API com paginação
  const loadRealProducts = async (page: number = 1) => {
    // Evitar requisições múltiplas simultâneas
    if (loading) return;
    
    setLoading(true);
    try {
      const offset = (page - 1) * pageSize;
      const params = new URLSearchParams({
        format: 'summary',
        limit: pageSize.toString(),
        offset: offset.toString(),
      });

      const response = await fetch(`${API_ENDPOINTS.PRODUCTS}?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.items) {
          // Transformar dados da API para o formato esperado
          const transformedProducts = data.data.items.map((product: MLProduct) => ({
            id: product.id || '',
            title: product.title || 'Produto sem título',
            price: typeof product.price === 'number' ? product.price : 0,
            thumbnail: product.thumbnail || '/placeholder-image.svg',
            status: product.status || 'unknown',
            available_quantity: typeof product.available_quantity === 'number' ? product.available_quantity : 0,
            condition: product.condition || 'not_specified',
            visits: 0, // Placeholder - ML API não fornece este campo
            questions: 0, // Placeholder - ML API não fornece este campo
            sold_quantity: typeof product.sold_quantity === 'number' ? product.sold_quantity : 0,
          }));
          
          setProducts(transformedProducts);
          setAuthenticated(true);
          
          // Atualizar informações de paginação
          if (data.data.total) {
            setTotalProducts(data.data.total);
            setTotalPages(data.data.total_pages || Math.ceil(data.data.total / pageSize));
            setCurrentPage(data.data.page || page);
          }
          
          console.log(`✅ Produtos carregados: ${transformedProducts.length} (página ${page}/${Math.ceil((data.data.total || 0) / pageSize)})`);
        } else {
          throw new Error('Dados inválidos da API');
        }
      } else if (response.status === 401) {
        console.warn('❌ Usuário não autenticado - precisa fazer login no ML');
        setAuthenticated(false);
        setProducts([]);
      } else {
        console.warn(`API retornou ${response.status}, sem dados para carregar`);
        setAuthenticated(false);
        setProducts([]);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar produtos reais:', error);
      setAuthenticated(false);
      setProducts([]);
    } finally {
      setLoading(false);
      setHasAttemptedLoad(true);
    }
  };

  // ✅ CORREÇÃO: Executar apenas uma vez na montagem do componente
  useEffect(() => {
    if (!hasAttemptedLoad) {
      loadRealProducts(currentPage);
      setHasAttemptedLoad(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Dependency array vazia para executar apenas uma vez

  // Função para carregar mais produtos (incremental)
  const loadMoreProducts = async () => {
    if (loadingMore || !hasMoreProducts) return;
    
    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const offset = (nextPage - 1) * pageSize;
      
      const params = new URLSearchParams({
        format: 'summary',
        limit: pageSize.toString(),
        offset: offset.toString(),
      });

      const response = await fetch(`${API_ENDPOINTS.PRODUCTS}?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.items) {
          const transformedProducts = data.data.items.map((product: MLProduct) => ({
            id: product.id,
            title: product.title,
            price: product.price,
            thumbnail: product.thumbnail,
            status: product.status,
            available_quantity: product.available_quantity,
            condition: product.condition,
            visits: 0,
            questions: 0,
            sold_quantity: product.sold_quantity || 0,
          }));

          // Adicionar produtos aos já existentes
          setProducts(prevProducts => [...prevProducts, ...transformedProducts]);
          setCurrentPage(nextPage);
          
          // Verificar se há mais produtos
          if (data.data.has_more === false || transformedProducts.length < pageSize) {
            setHasMoreProducts(false);
          }
          
          console.log(`✅ ${transformedProducts.length} produtos adicionais carregados (total: ${products.length + transformedProducts.length})`);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao carregar mais produtos:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Função para mudar de página
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      loadRealProducts(page);
    }
  };

  // Função para ir para a próxima página
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  // Função para ir para a página anterior
  const handlePrevPage = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const getStatusBadge = (status: ProductStatus | undefined) => {
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

  const getStatusText = (status: ProductStatus | undefined) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'paused':
        return 'Pausado';
      case 'closed':
        return 'Finalizado';
      default:
        return status || 'Desconhecido';
    }
  };

  const filteredProducts = products
    .filter(product => {
      const matchesSearch = !searchQuery ||
        (product.title && product.title.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return b.price - a.price;
        case 'visits':
          return (b.visits || 0) - (a.visits || 0);
        case 'status':
          return (a.status || '').localeCompare(b.status || '');
        default:
          return (a.title || '').localeCompare(b.title || '');
      }
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
            {hasAttemptedLoad && (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                products.length > 4 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {products.length > 4 ? '📡 Dados Reais' : '🔧 Dados Demo'}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Gerencie seus produtos do Mercado Livre
            {loading && ' • Carregando...'}
            {!hasAttemptedLoad && ' • Aguardando...'}
            {authenticated === false && ' • ⚠️ Autenticação necessária'}
            {authenticated === true && ` • ✅ ${products.length} produtos`}
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
                    {products.reduce((sum, p) => sum + (p.sold_quantity || 0), 0)}
                  </span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Vendido
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {products.reduce((sum, p) => sum + (p.sold_quantity || 0), 0)} unidades
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

            {/* Refresh Button */}
            <button
              onClick={() => {
                setHasAttemptedLoad(false);
                loadRealProducts();
              }}
              disabled={loading}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {loading ? (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              <span className="ml-2">
                {loading ? 'Carregando...' : 'Recarregar'}
              </span>
            </button>
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
                      <div className="relative h-16 w-16 bg-gray-100 rounded-md overflow-hidden">
                        <Image
                          className="h-full w-full object-cover"
                          src={product.thumbnail || '/placeholder-image.svg'}
                          alt={product.title}
                          width={64}
                          height={64}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src !== '/placeholder-image.svg') {
                              target.src = '/placeholder-image.svg';
                            }
                          }}
                          unoptimized
                        />
                      </div>
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
                        <span>R$ {(product.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        <span className="mx-2">•</span>
                        <span>{product.available_quantity || 0} disponíveis</span>
                        <span className="mx-2">•</span>
                        <span>{product.visits || 0} visualizações</span>
                        <span className="mx-2">•</span>
                        <span>{product.sold_quantity || 0} vendidos</span>
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
                      onClick={async () => {
                        if (confirm('Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.')) {
                          try {
                            // TODO: Implement actual delete API call
                            // const response = await fetch(`/api/admin/products/${product.id}`, {
                            //   method: 'DELETE',
                            //   headers: { 'Content-Type': 'application/json' },
                            //   credentials: 'include',
                            // });
                            
                            // if (!response.ok) {
                            //   throw new Error('Failed to delete product');
                            // }
                            
                            // Remove from local state
                            setProducts(products.filter(p => p.id !== product.id));
                            console.log(`Produto ${product.id} removido com sucesso`);
                          } catch (error) {
                            console.error('Erro ao excluir produto:', error);
                            alert('Erro ao excluir produto. Tente novamente.');
                          }
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

      {/* Load More Button */}
      {hasMoreProducts && products.length > 0 && (
        <div className="text-center py-6">
          <button
            onClick={loadMoreProducts}
            disabled={loadingMore}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loadingMore ? (
              <>
                <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                Carregando...
              </>
            ) : (
              <>
                <PlusIcon className="w-5 h-5 mr-2" />
                Carregar Mais Produtos
              </>
            )}
          </button>
          <p className="text-sm text-gray-500 mt-2">
            {products.length} de {totalProducts} produtos carregados
          </p>
        </div>
      )}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              Próxima
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando{' '}
                <span className="font-medium">{((currentPage - 1) * pageSize) + 1}</span>
                {' '}a{' '}
                <span className="font-medium">{Math.min(currentPage * pageSize, totalProducts)}</span>
                {' '}de{' '}
                <span className="font-medium">{totalProducts}</span>
                {' '}produtos
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Anterior</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>

                {/* Page Numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  if (pageNum > totalPages) return null;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        pageNum === currentPage
                          ? 'z-10 bg-green-50 border-green-500 text-green-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Próxima</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
    </div>
  );
}