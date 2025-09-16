'use client';

// Force cache invalidation - Updated: 2025-09-15T19:30:00Z
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import PeepersLogo from '@/components/PeepersLogo';
import ProductFilters from '@/components/ProductFilters';
import ProductSort from '@/components/ProductSort';
import FeaturedProducts from '@/components/FeaturedProducts';
import ProductCategorySection from '@/components/ProductCategorySection';
import ProductBadges from '@/components/ProductBadges';
import type { ProductSummary } from '@/types/product';
import { PAGES, API_ENDPOINTS } from '@/config/routes';
import { 
  categorizeProduct,
  getProductCategories,
  filterProducts,
  sortProducts,
  getRecommendedProducts,
  ProductFilters as IProductFilters,
  CategorizedProduct
} from '@/utils/productCategories';

interface ProductsResponse {
  products: ProductSummary[];
  total: number;
  statistics?: {
    total_products: number;
    active_products: number;
    paused_products: number;
  };
  message?: string;
}

export default function ProductsClient() {
  const [rawProducts, setRawProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [filters, setFilters] = useState<IProductFilters>({});
  const [sortBy, setSortBy] = useState('relevance');
  const [viewMode, setViewMode] = useState<'sections' | 'grid'>('sections');

  // Processar produtos em versão categorizada
  const categorizedProducts = useMemo(() => {
    return rawProducts.map(product => categorizeProduct(product));
  }, [rawProducts]);

  // Obter categorias baseadas nos produtos
  const categories = useMemo(() => {
    return getProductCategories(categorizedProducts);
  }, [categorizedProducts]);

  // Filtrar e ordenar produtos
  const filteredProducts = useMemo(() => {
    const filtered = filterProducts(categorizedProducts, filters);
    return sortProducts(filtered, sortBy);
  }, [categorizedProducts, filters, sortBy]);

  // Produtos destacados
  const featuredProducts = useMemo(() => {
    return getRecommendedProducts(categorizedProducts);
  }, [categorizedProducts]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(API_ENDPOINTS.PRODUCTS_PUBLIC, {
        cache: 'no-store',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Falha ao carregar produtos (${response.status})`);
      }
      
      const data: ProductsResponse = await response.json();
      
      if (!data || typeof data !== 'object') {
        throw new Error('Resposta inválida do servidor');
      }
      
      setRawProducts(Array.isArray(data.products) ? data.products : []);
      setNeedsAuth(false);
      
    } catch (err) {
      console.error('[ProductsClient] Fetch error:', err);
      
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setError('Tempo limite excedido. Verifique sua conexão.');
        } else if (err.message.includes('NetworkError') || err.message.includes('Failed to fetch')) {
          setError('Erro de conexão. Verifique sua internet.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Erro desconhecido ao carregar produtos');
      }
      
      setRawProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAllCategory = (categoryId: string, subcategoryId?: string) => {
    const newFilters: IProductFilters = {
      category: categoryId,
      subcategory: subcategoryId
    };
    setFilters(newFilters);
    setViewMode('grid');
    
    // Scroll para o topo da página
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    let isMounted = true;
    
    const loadProducts = async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (isMounted) {
        await fetchProducts();
      }
    };
    
    if (typeof window !== 'undefined') {
      loadProducts().catch(err => {
        console.error('[ProductsClient] useEffect error:', err);
        if (isMounted) {
          setError('Erro ao inicializar produtos');
          setLoading(false);
        }
      });
    }
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="flex gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-8 w-24 bg-gray-200 rounded-full"></div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card-peepers animate-pulse">
              <div className="aspect-square bg-peepers-neutral-200 rounded-t-lg"></div>
              <div className="p-4">
                <div className="h-4 bg-peepers-neutral-200 rounded mb-2"></div>
                <div className="h-4 bg-peepers-neutral-200 rounded w-2/3 mb-2"></div>
                <div className="h-6 bg-peepers-neutral-200 rounded w-1/2 mb-3"></div>
                <div className="h-10 bg-peepers-neutral-200 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Authentication needed
  if (needsAuth) {
    return (
      <div className="text-center py-12">
        <div className="mb-6">
          <PeepersLogo variant="icon" size="xl" className="mx-auto opacity-20 mb-4" />
        </div>
        <p className="text-peepers-neutral-600 mb-4 text-lg">Autenticação necessária</p>
        <p className="text-sm text-peepers-neutral-500 mb-6">
          Faça login com sua conta do Mercado Livre para sincronizar os produtos.
        </p>
        <a 
          href={API_ENDPOINTS.AUTH_ML}
          className="btn-primary inline-flex items-center mr-4"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
          Fazer Login ML
        </a>
        <a 
          href={PAGES.ADMIN}
          className="btn-secondary inline-flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Painel Admin
        </a>
      </div>
    );
  }

  // Error state
  if (error && !needsAuth) {
    return (
      <div className="text-center py-12">
        <div className="mb-6">
          <PeepersLogo variant="icon" size="xl" className="mx-auto opacity-20 mb-4" />
        </div>
        <p className="text-peepers-neutral-600 mb-4 text-lg">Erro ao carregar produtos.</p>
        <p className="text-sm text-peepers-neutral-500 mb-6">
          {error}
        </p>
        <button 
          onClick={fetchProducts}
          className="btn-primary inline-flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Tentar Novamente
        </button>
      </div>
    );
  }

  // No products found
  if (rawProducts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mb-6">
          <PeepersLogo variant="icon" size="xl" className="mx-auto opacity-20 mb-4" />
        </div>
        <p className="text-peepers-neutral-600 mb-4 text-lg">Nenhum produto encontrado.</p>
        <p className="text-sm text-peepers-neutral-500 mb-6">
          Os produtos podem ainda estar sendo sincronizados do Mercado Livre.
        </p>
        <a 
          href="/api/sync"
          className="btn-primary inline-flex items-center mr-4"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Sincronizar Produtos
        </a>
        <button 
          onClick={fetchProducts}
          className="btn-secondary inline-flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Atualizar
        </button>
      </div>
    );
  }

  // Layout em seções (modo padrão)
  if (viewMode === 'sections' && Object.keys(filters).length === 0) {
    return (
      <div className="space-y-6">
        {/* Controles principais */}
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Nossos Produtos
            </h1>
            <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
              {categorizedProducts.length} produtos
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <ProductSort 
              currentSort={sortBy}
              onSortChange={setSortBy}
            />
            
            <button
              onClick={() => setViewMode('grid')}
              className="btn-secondary text-sm"
            >
              Ver Todos em Lista
            </button>
          </div>
        </div>

        {/* Produtos destacados */}
        {featuredProducts.length > 0 && (
          <FeaturedProducts products={featuredProducts} />
        )}

        {/* Seções por categoria */}
        {categories
          .sort((a, b) => b.count - a.count) // Ordenar por quantidade de produtos
          .map(category => {
            const categoryProducts = categorizedProducts.filter(p => p.category === category.id);
            return (
              <ProductCategorySection
                key={category.id}
                category={category}
                products={categoryProducts}
                onViewAll={handleViewAllCategory}
              />
            );
          })}
      </div>
    );
  }

  // Layout em grid (com filtros ou quando solicitado)
  return (
    <div className="space-y-6">
      {/* Filtros */}
      <ProductFilters
        categories={categories}
        filters={filters}
        onFiltersChange={setFilters}
        totalProducts={categorizedProducts.length}
        filteredCount={filteredProducts.length}
      />

      {/* Controles da lista */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setViewMode('sections');
              setFilters({});
            }}
            className="btn-secondary text-sm"
          >
            ← Voltar para Seções
          </button>
          
          <h2 className="text-xl font-bold text-gray-900">
            {Object.keys(filters).length > 0 ? 'Produtos Filtrados' : 'Todos os Produtos'}
          </h2>
        </div>
        
        <ProductSort 
          currentSort={sortBy}
          onSortChange={setSortBy}
        />
      </div>

      {/* Grid de produtos */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <div className="mb-6">
            <PeepersLogo variant="icon" size="xl" className="mx-auto opacity-20 mb-4" />
          </div>
          <p className="text-gray-600 mb-4 text-lg">
            Nenhum produto encontrado com os filtros aplicados.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Tente ajustar os filtros ou remover algumas opções.
          </p>
          <button
            onClick={() => setFilters({})}
            className="btn-primary"
          >
            Limpar Filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product: CategorizedProduct) => (
            <div key={product.id} className="card-peepers group">
              <div className="aspect-square bg-peepers-neutral-100 relative overflow-hidden rounded-t-lg">
                {product.thumbnail ? (
                  <Image
                    src={product.thumbnail}
                    alt={product.title}
                    fill
                    className="object-contain group-hover:scale-105 transition-transform duration-300 p-2"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <PeepersLogo variant="icon" size="lg" className="opacity-20" />
                  </div>
                )}
                
                {/* Badges posicionadas */}
                <div className="absolute top-2 left-2">
                  <ProductBadges 
                    badges={product.badges.filter(badge => badge.type === 'new')} 
                  />
                </div>
                
                <div className="absolute top-2 right-2">
                  <ProductBadges 
                    badges={product.badges.filter(badge => badge.type === 'free-shipping')} 
                  />
                </div>
                
                <div className="absolute bottom-2 left-2 right-2">
                  <ProductBadges 
                    badges={product.badges.filter(badge => 
                      ['turbo', 'ultra', 'gaming', 'premium'].includes(badge.type)
                    )} 
                  />
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold text-peepers-neutral-900 mb-2 line-clamp-2 min-h-[3rem] group-hover:text-peepers-primary-600 transition-colors">
                  {product.title}
                </h3>
                
                <p className="text-2xl font-bold text-peepers-primary-600 mb-2">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(product.price || 0)}
                </p>
                
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-peepers-neutral-600">
                    {product.available_quantity} disponíveis
                  </span>
                  {product.installments && (
                    <span className="text-xs text-peepers-secondary-600 font-medium">
                      {product.installments.quantity}x sem juros
                    </span>
                  )}
                </div>
                
                {/* Características específicas */}
                <div className="mb-3 space-y-1">
                  {product.length && (
                    <p className="text-xs text-peepers-neutral-500">
                      {product.length === 'short' && '📏 Cabo curto (≤30cm)'}
                      {product.length === 'medium' && '📏 Cabo médio (1m)'}
                      {product.length === 'long' && '📏 Cabo longo (≥2m)'}
                    </p>
                  )}
                  {product.powerRating && product.powerRating >= 30 && (
                    <p className="text-xs text-peepers-neutral-500">
                      ⚡ {product.powerRating}W de potência
                    </p>
                  )}
                </div>
                
                {/* Badges de estoque baixo */}
                <div className="mb-3">
                  <ProductBadges 
                    badges={product.badges.filter(badge => badge.type === 'low-stock')} 
                  />
                </div>
                
                <Link
                  href={PAGES.PRODUTO_DETALHE(product.id)}
                  className="btn-primary w-full text-center group relative overflow-hidden"
                >
                  <span className="relative z-10">Comprar no Mercado Livre</span>
                  <div className="absolute inset-0 bg-peepers-primary-700 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                </Link>
                
                {/* Botão de notificação para produtos fora de estoque */}
                {product.available_quantity === 0 && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      alert(`🔔 Notificação configurada! Você será avisado quando "${product.title}" estiver disponível novamente.`);
                      // Aqui você pode implementar a lógica para salvar a notificação no backend
                    }}
                    className="btn-secondary w-full text-center mt-2 group relative overflow-hidden"
                    title="Receber notificação quando o produto estiver disponível"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7v5l-5 5V7h5z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2a10 10 0 100 20 10 10 0 000-20z" />
                      </svg>
                      Avisar quando chegar
                    </span>
                    <div className="absolute inset-0 bg-peepers-secondary-700 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                  </button>
                )}
                
                {/* Compatibilidade */}
                {product.compatibility && product.compatibility.length > 0 && (
                  <p className="text-xs text-center text-peepers-neutral-500 mt-2">
                    {product.compatibility.slice(0, 2).join(', ')}
                    {product.compatibility.length > 2 && ' +'}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}