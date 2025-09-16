'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CategorizedProduct, ProductCategory } from '@/utils/productCategories';
import ProductBadges from './ProductBadges';
import PeepersLogo from './PeepersLogo';
import { PAGES } from '@/config/routes';

interface ProductCategorySectionProps {
  category: ProductCategory;
  products: CategorizedProduct[];
  onViewAll: (categoryId: string, subcategoryId?: string) => void;
  className?: string;
}

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

  return (
    <section className={`mb-8 ${className}`}>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header da seção */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-peepers-neutral-900 flex items-center gap-2">
                <span className="text-2xl">{category.icon}</span>
                {category.name}
                <span className="text-sm font-normal text-peepers-neutral-600">
                  ({category.count} produtos)
                </span>
              </h2>
              <p className="text-sm text-peepers-neutral-600 mt-1">
                {category.description}
              </p>
            </div>
            
            <button
              onClick={() => onViewAll(category.id)}
              className="btn-secondary text-sm"
            >
              Ver Todos
            </button>
          </div>
          
          {/* Subcategorias */}
          {category.subcategories && category.subcategories.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              <button
                onClick={() => setSelectedSubcategory(null)}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  selectedSubcategory === null
                    ? 'bg-peepers-primary-100 text-peepers-primary-700 border border-peepers-primary-200'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                Todas
              </button>
              {category.subcategories.map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubcategory(sub.id)}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    selectedSubcategory === sub.id
                      ? 'bg-peepers-primary-100 text-peepers-primary-700 border border-peepers-primary-200'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  {sub.name} ({sub.count})
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Grid de produtos */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {visibleProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-all duration-300 group"
              >
                <div className="aspect-square bg-peepers-neutral-100 relative overflow-hidden">
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
                  <h3 className="font-semibold text-peepers-neutral-900 mb-2 line-clamp-2 min-h-[3rem] group-hover:text-peepers-primary-600 transition-colors text-sm">
                    {product.title}
                  </h3>
                  
                  <div className="mb-3">
                    <p className="text-lg font-bold text-peepers-primary-600">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(product.price || 0)}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-peepers-neutral-600 mt-1">
                      <span>{product.available_quantity} disponíveis</span>
                      {product.installments && (
                        <span className="text-peepers-secondary-600 font-medium">
                          {product.installments.quantity}x sem juros
                        </span>
                      )}
                    </div>
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
                    className="btn-primary w-full text-center text-sm group relative overflow-hidden"
                  >
                    <span className="relative z-10">Comprar no ML</span>
                    <div className="absolute inset-0 bg-peepers-primary-700 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                  </Link>
                  
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
          
          {/* Call to action para ver mais */}
          {hasMoreProducts && (
            <div className="text-center mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-peepers-neutral-600 mb-3">
                Mostrando {visibleProducts.length} de {displayProducts.length} produtos
                {selectedSubcategory && ` em ${category.subcategories?.find(s => s.id === selectedSubcategory)?.name}`}
              </p>
              <button
                onClick={() => onViewAll(category.id, selectedSubcategory || undefined)}
                className="btn-secondary"
              >
                Ver todos os {displayProducts.length} produtos
                {selectedSubcategory && ` em ${category.subcategories?.find(s => s.id === selectedSubcategory)?.name}`}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}