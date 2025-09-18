'use client';

// Force cache invalidation - Updated: 2025-09-15T20:00:00Z
import React from 'react';
import Image from 'next/image';
import { useState } from 'react';
import { getPlaceholderImage } from '@/lib/utils';

interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating?: number;
  reviewCount?: number;
  badge?: string;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  mercadoLivreLink?: string;
  imageFit?: 'cover' | 'contain';
  availableQuantity?: number;
  onNotifyWhenAvailable?: (id: string) => void;
  showDetails?: boolean; // Para mostrar mais informações na página de produtos
  length?: string;
  powerRating?: number;
  compatibility?: string[];
  installments?: {
    quantity: number;
    amount: number;
  };
}

export default function ProductCard({
  id,
  title,
  price,
  originalPrice,
  image,
  rating = 4.5,
  reviewCount = 0,
  badge,
  isFavorite = false,
  onToggleFavorite,
  mercadoLivreLink,
  imageFit = 'contain', // Default to contain for better product image display
  availableQuantity,
  onNotifyWhenAvailable,
  showDetails = false,
  length,
  powerRating,
  compatibility,
  installments
}: ProductCardProps) {
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Safe handlers para evitar crashes
  const handleImageLoad = () => {
    try {
      setIsImageLoading(false);
    } catch (error) {
      console.error('[ProductCard] Image load error:', error);
    }
  };

  const handleImageError = () => {
    try {
      setImageError(true);
      setIsImageLoading(false);
    } catch (error) {
      console.error('[ProductCard] Image error handler failed:', error);
    }
  };

  // Validações de segurança
  const safeTitle = title || 'Produto indisponível';
  const safePrice = typeof price === 'number' && price >= 0 ? price : 0;
  const safeImage = image || getPlaceholderImage();
  const safeId = id || 'unknown';
  
  // Determinar o fit da imagem de forma segura
  const imageFitClass = imageFit === 'cover' ? 'object-cover' : 'object-contain';
  
  const formatPrice = (price: number) => {
    try {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(price);
    } catch (error) {
      console.error('[ProductCard] Format price error:', error);
      return `R$ ${price.toFixed(2)}`;
    }
  };

  const calculateDiscount = () => {
    try {
      if (originalPrice && originalPrice > safePrice) {
        const discount = ((originalPrice - safePrice) / originalPrice) * 100;
        return Math.round(discount);
      }
      return 0;
    } catch (error) {
      console.error('[ProductCard] Calculate discount error:', error);
      return 0;
    }
  };

  const handleToggleFavorite = () => {
    try {
      if (onToggleFavorite) {
        onToggleFavorite(safeId);
      }
    } catch (error) {
      console.error('[ProductCard] Toggle favorite error:', error);
    }
  };

  const handleMercadoLivreClick = () => {
    try {
      if (mercadoLivreLink) {
        window.open(mercadoLivreLink, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('[ProductCard] Mercado Livre click error:', error);
    }
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
        {onToggleFavorite && (
          <button
            onClick={handleToggleFavorite}
            className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white"
            aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          >
            <svg 
              className={`w-4 h-4 ${isFavorite ? 'text-red-500 fill-current' : 'text-gray-400'}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
              />
            </svg>
          </button>
        )}

        {/* Loading Overlay */}
        {isImageLoading && (
          <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Image */}
        {!imageError ? (
          <Image
            src={safeImage}
            alt={safeTitle}
            fill
            className={`${imageFitClass} group-hover:scale-105 transition-transform duration-300 ${isImageLoading ? 'opacity-0' : 'opacity-100'}`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            priority={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-xs text-gray-500">Imagem indisponível</p>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-sm">
          {safeTitle}
        </h3>

        {/* Rating */}
        {rating && (
          <div className="flex items-center mb-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-3 h-3 ${i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-xs text-gray-500 ml-1">({reviewCount})</span>
          </div>
        )}

        {/* Price */}
        <div className="mb-3">
          {originalPrice && originalPrice > safePrice && (
            <span className="text-xs text-gray-500 line-through mr-2">
              {formatPrice(originalPrice)}
            </span>
          )}
          <span className="text-lg font-bold text-primary">
            {formatPrice(safePrice)}
          </span>
        </div>

        {/* Additional Details (when showDetails is true) */}
        {showDetails && (
          <div className="mb-3 space-y-1">
            {/* Available Quantity */}
            {availableQuantity !== undefined && (
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>Disponíveis:</span>
                <span className={availableQuantity === 0 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                  {availableQuantity === 0 ? 'Esgotado' : availableQuantity}
                </span>
              </div>
            )}

            {/* Length */}
            {length && (
              <p className="text-xs text-gray-500">
                {length === 'short' && '📏 Cabo curto (≤30cm)'}
                {length === 'medium' && '📏 Cabo médio (1m)'}
                {length === 'long' && '📏 Cabo longo (≥2m)'}
              </p>
            )}

            {/* Power Rating */}
            {powerRating && powerRating >= 30 && (
              <p className="text-xs text-gray-500">
                ⚡ {powerRating}W de potência
              </p>
            )}

            {/* Installments */}
            {installments && (
              <p className="text-xs text-gray-600">
                {installments.quantity}x sem juros
              </p>
            )}
          </div>
        )}

        {/* Notify Button for Out of Stock */}
        {availableQuantity === 0 && onNotifyWhenAvailable && (
          <button
            onClick={() => onNotifyWhenAvailable(safeId)}
            className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-orange-700 transition-colors duration-200 text-sm mb-2"
          >
            🔔 Avisar quando chegar
          </button>
        )}

        {/* Mercado Livre Button */}
        <button
          onClick={handleMercadoLivreClick}
          className="w-full bg-primary text-white py-2 px-4 rounded-lg font-semibold hover:bg-primary-dark transition-colors duration-200 text-sm"
          disabled={!mercadoLivreLink}
        >
          Ver no Mercado Livre
        </button>

        {/* Compatibility */}
        {showDetails && compatibility && compatibility.length > 0 && (
          <p className="text-xs text-center text-gray-500 mt-2">
            {compatibility.slice(0, 2).join(', ')}
            {compatibility.length > 2 && ' +' + (compatibility.length - 2)}
          </p>
        )}
      </div>
    </div>
  );
}