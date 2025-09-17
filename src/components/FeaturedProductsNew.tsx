'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { API_ENDPOINTS } from '@/config/routes';
import type { MLProduct } from '@/types/ml';
import { Button } from '@/components/ui/primitives/Button';
import { Badge } from '@/components/ui/primitives/Badge';
import { Container, Section } from '@/components/ui/layout/Container';
import { VStack, HStack } from '@/components/ui/layout/Stack';
import { getBestImageUrl } from '@/lib/utils';

// ==================== TYPES ====================

interface FeaturedProductsNewProps {
  limit?: number;
  title?: string;
  className?: string;
}

interface ProductCardProps {
  product: MLProduct;
}

// ==================== PRODUCT CARD ====================

function ProductCard({ product }: ProductCardProps) {
  const formatPrice = (price: number) => {
    try {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(price);
    } catch (error) {
      console.error('Format price error:', error);
      return `R$ ${price.toFixed(2)}`;
    }
  };

  return (
    <article className="bg-white rounded-lg border border-gray-200 hover:border-brand-primary-300 hover:shadow-lg transition-all duration-200 group overflow-hidden">
      <VStack spacing="none" align="stretch">
        
        {/* Image Section */}
        <div className="relative aspect-square bg-gray-50 overflow-hidden">
          
          {/* Badges */}
          {product.category_id && (
            <div className="absolute top-2 left-2 z-10">
              <Badge variant="primary" size="sm">
                {product.category_id}
              </Badge>
            </div>
          )}
          
          {/* Shipping Badge */}
          {product.shipping?.free_shipping && (
            <div className="absolute top-2 right-2 z-10">
              <Badge variant="success" size="sm">
                Frete Grátis
              </Badge>
            </div>
          )}
          
          {/* Image */}
          {product.thumbnail || (product.pictures && product.pictures.length > 0) ? (
            <Image
              src={getBestImageUrl(product)}
              alt={product.title}
              fill
              className="object-contain group-hover:scale-105 transition-transform duration-300 p-4"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <span className="text-gray-400 text-4xl">📷</span>
            </div>
          )}
        </div>
        
        {/* Content Section */}
        <VStack spacing="md" align="stretch" className="p-4">
          
          {/* Title */}
          <h3 className="font-medium text-gray-900 line-clamp-2 group-hover:text-brand-primary-600 transition-colors">
            {product.title}
          </h3>
          
          {/* Price */}
          <VStack spacing="xs">
            <span className="text-lg font-bold text-brand-primary-600">
              {formatPrice(product.price)}
            </span>
            
            {product.condition === 'new' && (
              <p className="text-sm text-green-600 font-medium">
                ✓ Produto Novo
              </p>
            )}
          </VStack>
          
          {/* Stock Info */}
          {product.available_quantity <= 5 && product.available_quantity > 0 && (
            <Badge variant="warning" size="sm">
              Restam apenas {product.available_quantity}
            </Badge>
          )}
          
          {/* Action Button */}
          <Button
            variant="primary"
            size="sm"
            fullWidth
            onClick={() => {
              // Navigate to product detail or ML page
              console.log('View product:', product.id);
            }}
          >
            🛒 Ver Produto
          </Button>
          
        </VStack>
      </VStack>
    </article>
  );
}

// ==================== MAIN COMPONENT ====================

export default function FeaturedProductsNew({ 
  limit = 6,
  title = "🔥 Produtos em Destaque",
  className = ''
}: FeaturedProductsNewProps) {
  const [products, setProducts] = useState<MLProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        setError(null);

        // Use unified v1 endpoint with public format
        const baseUrl = typeof window !== 'undefined' 
          ? window.location.origin 
          : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        
        const url = new URL(API_ENDPOINTS.PRODUCTS_V1, baseUrl);
        url.searchParams.set('format', 'minimal');
        url.searchParams.set('limit', limit.toString());
        
        const response = await fetch(url.toString(), {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Falha ao carregar produtos: ${response.status}`);
        }
        
        const data = await response.json();
        const productsList = data.data?.products || data.products || [];
        
        // Filtrar produtos válidos
        const validProducts = productsList.filter((product: MLProduct) => {
          return product && 
                 product.id && 
                 product.title && 
                 typeof product.price === 'number' && 
                 product.price > 0;
        });
        
        setProducts(validProducts.slice(0, limit));
      } catch (err) {
        console.error('[FeaturedProductsNew] Error:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [limit]);

  // Loading state
  if (loading) {
    return (
      <Section className={className}>
        <Container>
          <VStack spacing="xl">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
              <p className="text-gray-600">Carregando produtos...</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: limit }).map((_, index) => (
                <div key={index} className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
                  <div className="aspect-square bg-gray-200" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-6 bg-gray-200 rounded w-1/2" />
                    <div className="h-8 bg-gray-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </VStack>
        </Container>
      </Section>
    );
  }

  // Error state
  if (error) {
    return (
      <Section className={className}>
        <Container>
          <VStack spacing="lg" align="center" className="py-12 max-w-md mx-auto text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-500 text-2xl">❌</span>
            </div>
            <VStack spacing="sm" align="center">
              <h3 className="text-lg font-semibold text-gray-900">Erro ao carregar produtos</h3>
              <p className="text-gray-600">{error}</p>
            </VStack>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
            >
              Tentar Novamente
            </Button>
          </VStack>
        </Container>
      </Section>
    );
  }

  // Empty state
  if (products.length === 0) {
    return (
      <Section className={className}>
        <Container>
          <VStack spacing="lg" align="center" className="py-12 max-w-md mx-auto text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-gray-400 text-4xl">📦</span>
            </div>
            <VStack spacing="sm" align="center">
              <h3 className="text-lg font-semibold text-gray-900">Produtos chegando em breve</h3>
              <p className="text-gray-600">
                Nossa equipe está trabalhando para adicionar novos produtos incríveis.
              </p>
            </VStack>
            <Button 
              variant="primary"
              onClick={() => window.open('https://www.mercadolivre.com.br/pagina/peepersshop', '_blank')}
            >
              Visitar nossa loja ML
            </Button>
          </VStack>
        </Container>
      </Section>
    );
  }

  // Success state with products
  return (
    <Section className={className}>
      <Container>
        <VStack spacing="xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
            <p className="text-gray-600">Confira alguns dos nossos produtos mais populares.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product, index) => (
              <ProductCard key={product.id || `product-${index}`} product={product} />
            ))}
          </div>
        </VStack>
      </Container>
    </Section>
  );
}