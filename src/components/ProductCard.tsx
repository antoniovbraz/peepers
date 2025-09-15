'use client';

import Image from 'next/image';
import Link from 'next/link';
import { StarIcon, HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { useState } from 'react';

interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating?: number;
  reviewCount?: number;
  mercadoLivreLink: string;
  badge?: string;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
}

export default function ProductCard({
  id,
  title,
  price,
  originalPrice,
  image,
  rating = 0,
  reviewCount = 0,
  mercadoLivreLink,
  badge,
  isFavorite = false,
  onToggleFavorite
}: ProductCardProps) {
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const calculateDiscount = () => {
    if (originalPrice && originalPrice > price) {
      const discount = ((originalPrice - price) / originalPrice) * 100;
      return Math.round(discount);
    }
    return 0;
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onToggleFavorite) {
      onToggleFavorite(id);
    }
  };

  const handleImageLoad = () => {
    setIsImageLoading(false);
  };

  const handleImageError = () => {
    setIsImageLoading(false);
    setImageError(true);
  };

  return (
    <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-primary/20">
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        {/* Badges */}
        {badge && (
          <div className="absolute top-3 left-3 z-10">
            <span className="bg-accent text-white text-xs font-semibold px-2 py-1 rounded-full">
              {badge}
            </span>
          </div>
        )}
        
        {calculateDiscount() > 0 && (
          <div className="absolute top-3 right-3 z-10">
            <span className="bg-secondary text-black text-xs font-bold px-2 py-1 rounded-full">
              -{calculateDiscount()}%
            </span>
          </div>
        )}
        
        {/* Favorite Button */}
        <button
          onClick={handleFavoriteClick}
          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors"
          style={{ marginTop: calculateDiscount() > 0 ? '32px' : '0' }}
        >
          {isFavorite ? (
            <HeartSolidIcon className="w-5 h-5 text-accent" />
          ) : (
            <HeartIcon className="w-5 h-5 text-gray-600 hover:text-accent transition-colors" />
          )}
        </button>
        
        {/* Product Image */}
        <div className="relative w-full h-full">
          {!imageError ? (
            <>
              <Image
                src={image}
                alt={title}
                fill
                className={`object-cover group-hover:scale-105 transition-transform duration-300 ${
                  isImageLoading ? 'opacity-0' : 'opacity-100'
                }`}
                onLoad={handleImageLoad}
                onError={handleImageError}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              {isImageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-center text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm">Imagem não disponível</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Product Info */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {title}
        </h3>
        
        {/* Rating */}
        {rating > 0 && (
          <div className="flex items-center space-x-1 mb-3">
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <StarIcon
                  key={star}
                  className={`w-4 h-4 ${
                    star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600">({reviewCount})</span>
          </div>
        )}
        
        {/* Price */}
        <div className="mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-gray-900">
              {formatPrice(price)}
            </span>
            {originalPrice && originalPrice > price && (
              <span className="text-sm text-gray-500 line-through">
                {formatPrice(originalPrice)}
              </span>
            )}
          </div>
          
          {/* Payment Options */}
          <p className="text-sm text-gray-600 mt-1">
            ou até 12x de {formatPrice(price / 12)}
          </p>
        </div>
        
        {/* CTA Button */}
        <a
          href={mercadoLivreLink}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full"
        >
          <button className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2">
            <span>Comprar no ML</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>
        </a>
      </div>
    </div>
  );
}