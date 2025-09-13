'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PeepersLogo from '@/components/PeepersLogo';
import type { ProductSummary } from '@/types/product';

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
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/products', {
        cache: 'no-store'
      });
      
      if (response.status === 401) {
        setNeedsAuth(true);
        setError('Você precisa se autenticar com o Mercado Livre primeiro.');
        setProducts([]);
        return;
      }
      
      if (!response.ok) {
        throw new Error('Falha ao carregar produtos');
      }
      
      const data: ProductsResponse = await response.json();
      setProducts(data.products || []);
      setNeedsAuth(false);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Loading state
  if (loading) {
    return (
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
          Configure as credenciais ML_ACCESS_TOKEN e ML_REFRESH_TOKEN nas variáveis de ambiente.
        </p>
        <a 
          href="/admin"
          className="btn-primary inline-flex items-center mr-4"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
          Ir para Admin
        </a>
        <button 
          onClick={fetchProducts}
          className="btn-secondary inline-flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Tentar Novamente
        </button>
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
  if (products.length === 0) {
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
          href="/api/ml/sync?action=sync"
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

  // Products grid
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product: ProductSummary) => (
        <div key={product.id} className="card-peepers group">
          <div className="aspect-square bg-peepers-neutral-100 relative overflow-hidden rounded-t-lg">
            {product.thumbnail ? (
              <img
                src={product.thumbnail}
                alt={product.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <PeepersLogo variant="icon" size="lg" className="opacity-20" />
              </div>
            )}
            {product.condition === 'new' && (
              <div className="absolute top-3 left-3">
                <span className="badge-new">Novo</span>
              </div>
            )}
            {product.shipping?.free_shipping && (
              <div className="absolute top-3 right-3">
                <span className="badge-shipping">Frete Grátis</span>
              </div>
            )}
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-peepers-neutral-900 mb-2 line-clamp-2 min-h-[3rem] group-hover:text-peepers-primary-600 transition-colors">
              {product.title}
            </h3>
            <p className="text-2xl font-bold text-peepers-primary-600 mb-2">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(product.price)}
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
            <Link
              href={`/produtos/${product.id}`}
              className="btn-primary w-full text-center group relative overflow-hidden"
            >
              <span className="relative z-10">Comprar no Mercado Livre</span>
              <div className="absolute inset-0 bg-peepers-primary-700 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
            </Link>
            <p className="text-xs text-center text-peepers-neutral-500 mt-2">
              Você será redirecionado com segurança
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}