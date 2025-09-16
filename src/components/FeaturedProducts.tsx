'use client';

import Image from 'next/image';
import Link from 'next/link';
import { CategorizedProduct } from '@/utils/productCategories';
import ProductBadges from './ProductBadges';
import PeepersLogo from './PeepersLogo';
import { PAGES } from '@/config/routes';

interface FeaturedProductsProps {
  products: CategorizedProduct[];
  title?: string;
  className?: string;
}

export default function FeaturedProducts({ 
  products, 
  title = "🔥 Produtos em Destaque",
  className = '' 
}: FeaturedProductsProps) {
  if (products.length === 0) return null;

  return (
    <section className={`mb-8 ${className}`}>
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          {title}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="card-peepers group"
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
                  <p className="text-xl font-bold text-peepers-primary-600">
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
                
                {/* Informações adicionais */}
                {product.compatibility && product.compatibility.length > 0 && (
                  <p className="text-xs text-center text-peepers-neutral-500 mt-2">
                    Compatible: {product.compatibility.slice(0, 2).join(', ')}
                    {product.compatibility.length > 2 && ' +'}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Call to action para ver mais produtos destacados */}
        <div className="text-center mt-6">
          <p className="text-sm text-peepers-neutral-600 mb-2">
            Produtos selecionados por qualidade, performance e valor
          </p>
          <div className="flex justify-center gap-2 text-xs text-peepers-neutral-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              Frete Grátis
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
              Alta Performance
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
              Premium
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}