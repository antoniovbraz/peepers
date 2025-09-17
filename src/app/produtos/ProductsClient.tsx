'use client';

// Force cache invalidation - Updated: 2025-09-15T19:30:00Z
import { useState, useEffect, useMemo } from 'react';
import PeepersLogo from '@/components/PeepersLogo';
import ProductFiltersNew from '@/components/ProductFiltersNew';
import ProductSortNew from '@/components/ProductSortNew';
import FeaturedProductsNew from '@/components/FeaturedProductsNew';
import ProductCategorySectionNew from '@/components/ProductCategorySectionNew';
import ProductBadgesNew from '@/components/ProductBadgesNew';
import ProductsLoadingNew from '@/components/ProductsLoadingNew';
import ProductsErrorNew from '@/components/ProductsErrorNew';
import EmptyProductsNew from '@/components/EmptyProductsNew';
import ProductCardNew from '@/components/ProductCardNew';
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
  // Old format support
  products?: ProductSummary[];
  total?: number;
  statistics?: {
    total_products: number;
    active_products: number;
    paused_products: number;
  };
  message?: string;
  
  // New v1 format support
  success?: boolean;
  data?: {
    products: ProductSummary[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
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
      
      // ✅ NEW: Use unified v1 endpoint with summary format for high-quality images
      const url = new URL(API_ENDPOINTS.PRODUCTS_V1, window.location.origin);
      url.searchParams.set('format', 'summary'); // Summary format includes pictures array
      url.searchParams.set('limit', '100'); // Get more products
      
      const response = await fetch(url.toString(), {
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

      // ✅ NEW: Handle v1 API response format
      const products = data.data?.products || data.products || [];
      setRawProducts(Array.isArray(products) ? products : []);
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
            <ProductSortNew 
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
          <FeaturedProductsNew limit={6} />
        )}

        {/* Seções por categoria */}
        {categories
          .sort((a, b) => b.count - a.count) // Ordenar por quantidade de produtos
          .map(category => {
            const categoryProducts = categorizedProducts.filter(p => p.category === category.id);
            return (
              <ProductCategorySectionNew
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
      <ProductFiltersNew
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
        
        <ProductSortNew 
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
            <ProductCardNew
              key={product.id}
              id={product.id}
              title={product.title}
              price={product.price || 0}
              image={product.thumbnail || '/api/placeholder/300/300'}
              availableQuantity={product.available_quantity}
              mercadoLivreLink={PAGES.PRODUTO_DETALHE(product.id)}
              imageFit="contain"
              showDetails={true}
              length={product.length}
              powerRating={product.powerRating}
              compatibility={product.compatibility}
              size="default"
              product={{
                thumbnail: product.thumbnail,
                pictures: product.pictures
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}