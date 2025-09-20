'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CategorizedProduct, ProductCategory } from '@/utils/productCategories';
import ProductBadges from './ProductBadges';
import PeepersLogo from './PeepersLogo';
import { PAGES } from '@/config/routes';

// Design System Imports
import { Button } from '@/components/ui/primitives/Button';
import { Badge } from '@/components/ui/primitives/Badge';
import { Container, Section } from '@/components/ui/layout/Container';
import { VStack, HStack } from '@/components/ui/layout/Stack';

// ==================== TYPES ====================

interface ProductCategorySectionProps {
  category: ProductCategory;
  products: CategorizedProduct[];
  onViewAll: (categoryId: string, subcategoryId?: string) => void;
  className?: string;
}

// ==================== COMPONENT ====================

export default function ProductCategorySection({ 
  category, 
  products, 
  onViewAll,
  className = '' 
}: ProductCategorySectionProps) {
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  
  const displayProducts = selectedSubcategory
    ? products.filter(p => p.subcategory === selectedSubcategory)
    : products;
  
  const visibleProducts = displayProducts.slice(0, 4);
  const hasMoreProducts = displayProducts.length > 4;

  if (products.length === 0) return null;

  const formatPrice = (price: number) => {
    try {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(price || 0);
    } catch (error) {
      return `R$ ${(price || 0).toFixed(2)}`;
    }
  };

  return (
    <Section className={className}>
      <Container>
        <VStack spacing="lg">
          
          {/* Header da seção */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <VStack spacing="xs">
              <HStack spacing="sm" align="center">
                <span className="text-2xl">{category.icon}</span>
                <h2 className="text-xl font-bold text-gray-900">{category.name}</h2>
                <Badge variant="secondary" size="sm">
                  {category.count}
                </Badge>
              </HStack>
              <p className="text-sm text-gray-600">{category.description}</p>
            </VStack>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onViewAll(category.id)}
              className="self-start sm:self-center"
              rightIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              }
            >
              Ver Todos
            </Button>
          </div>
          
          {/* Subcategorias */}
          {category.subcategories && category.subcategories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={selectedSubcategory === null ? 'primary' : 'secondary'}
                className="cursor-pointer"
                onClick={() => setSelectedSubcategory(null)}
              >
                Todas
              </Badge>
              {category.subcategories.map(sub => (
                <Badge
                  key={sub.id}
                  variant={selectedSubcategory === sub.id ? 'primary' : 'secondary'}
                  className="cursor-pointer"
                  onClick={() => setSelectedSubcategory(sub.id)}
                >
                  {sub.name} ({sub.count})
                </Badge>
              ))}
            </div>
          )}
          
          {/* Grid de produtos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {visibleProducts.map((product) => (
              <article
                key={product.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-all duration-300 group"
              >
                
                {/* Product Image */}
                <div className="aspect-square bg-gray-50 relative overflow-hidden">
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
                
                {/* Product Content */}
                <VStack spacing="md" className="p-4">
                  
                  {/* Title */}
                  <h3 className="font-semibold text-gray-900 line-clamp-2 min-h-[3rem] group-hover:text-brand-primary-600 transition-colors text-sm">
                    {product.title}
                  </h3>
                  
                  {/* Price */}
                  <VStack spacing="xs">
                    <p className="text-lg font-bold text-brand-primary-600">
                      {formatPrice(product.price)}
                    </p>
                    
                    <HStack spacing="sm" align="center" justify="between" className="text-xs text-gray-600">
                      <span>{product.available_quantity} disponíveis</span>
                      {product.installments && (
                        <span className="text-brand-secondary-600 font-medium">
                          {product.installments.quantity}x sem juros
                        </span>
                      )}
                    </HStack>
                  </VStack>
                  
                  {/* Características específicas */}
                  {(product.length || (product.powerRating && product.powerRating >= 30)) && (
                    <VStack spacing="xs" className="text-xs text-gray-500">
                      {product.length && (
                        <p>
                          {product.length === 'short' && '📏 Cabo curto (≤30cm)'}
                          {product.length === 'medium' && '📏 Cabo médio (1m)'}
                          {product.length === 'long' && '📏 Cabo longo (≥2m)'}
                        </p>
                      )}
                      {product.powerRating && product.powerRating >= 30 && (
                        <p>⚡ {product.powerRating}W de potência</p>
                      )}
                    </VStack>
                  )}
                  
                  {/* Badges de estoque baixo */}
                  <ProductBadges 
                    badges={product.badges.filter(badge => badge.type === 'low-stock')} 
                  />
                  
                  {/* Action Button */}
                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth
                    onClick={() => window.location.href = PAGES.PRODUTO_DETALHE(product.id)}
                  >
                    Comprar no ML
                  </Button>
                  
                  {/* Compatibilidade */}
                  {product.compatibility && product.compatibility.length > 0 && (
                    <p className="text-xs text-center text-gray-500">
                      {product.compatibility.slice(0, 2).join(', ')}
                      {product.compatibility.length > 2 && ' +'}
                    </p>
                  )}
                  
                </VStack>
              </article>
            ))}
          </div>
          
          {/* Ver mais produtos */}
          {hasMoreProducts && (
            <div className="text-center">
              <Button
                variant="outline"
                onClick={() => onViewAll(category.id, selectedSubcategory || undefined)}
                rightIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                }
              >
                Ver mais {displayProducts.length - 4} produtos em {category.name}
              </Button>
            </div>
          )}
          
        </VStack>
      </Container>
    </Section>
  );
}