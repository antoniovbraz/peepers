'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/primitives/Badge';
import { Button } from '@/components/ui/primitives/Button';
import { VStack, HStack } from '@/components/ui/layout/Stack';
import { Container } from '@/components/ui/layout/Container';

// ==================== TYPES ====================

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
  showDetails?: boolean;
  length?: string;
  powerRating?: number;
  compatibility?: string[];
  installments?: {
    quantity: number;
    amount: number;
  };
  size?: 'compact' | 'default' | 'detailed';
}

// ==================== UTILITIES ====================

const formatPrice = (price: number): string => {
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

const calculateDiscount = (originalPrice: number, currentPrice: number): number => {
  try {
    if (originalPrice && originalPrice > currentPrice) {
      const discount = ((originalPrice - currentPrice) / originalPrice) * 100;
      return Math.round(discount);
    }
    return 0;
  } catch (error) {
    console.error('[ProductCard] Calculate discount error:', error);
    return 0;
  }
};

// ==================== MAIN COMPONENT ====================

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
  imageFit = 'contain',
  availableQuantity,
  onNotifyWhenAvailable,
  showDetails = false,
  length,
  powerRating,
  compatibility,
  installments,
  size = 'default'
}: ProductCardProps) {
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Safe values
  const safeTitle = title || 'Produto indisponível';
  const safePrice = typeof price === 'number' && price >= 0 ? price : 0;
  const safeImage = image || '/api/placeholder/300/300';
  const safeId = id || 'unknown';
  
  const imageFitClass = imageFit === 'cover' ? 'object-cover' : 'object-contain';
  const discount = originalPrice ? calculateDiscount(originalPrice, safePrice) : 0;
  const isOutOfStock = availableQuantity === 0;

  // Event handlers
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

  const handleToggleFavorite = () => {
    try {
      onToggleFavorite?.(safeId);
    } catch (error) {
      console.error('[ProductCard] Toggle favorite error:', error);
    }
  };

  const handleNotifyWhenAvailable = () => {
    try {
      onNotifyWhenAvailable?.(safeId);
    } catch (error) {
      console.error('[ProductCard] Notify when available error:', error);
    }
  };

  // ==================== SIZE VARIANTS ====================

  const sizeConfig = {
    compact: {
      container: 'p-3',
      image: 'h-32',
      title: 'text-sm',
      price: 'text-base',
      spacing: 'sm' as const,
    },
    default: {
      container: 'p-4',
      image: 'h-48',
      title: 'text-base',
      price: 'text-lg',
      spacing: 'md' as const,
    },
    detailed: {
      container: 'p-6',
      image: 'h-64',
      title: 'text-lg',
      price: 'text-xl',
      spacing: 'lg' as const,
    },
  };

  const config = sizeConfig[size];

  // ==================== RENDER ====================

  return (
    <Container
      as="article"
      className={`
        relative bg-white rounded-lg border border-gray-200 
        hover:border-brand-primary-300 hover:shadow-lg 
        transition-all duration-200 group cursor-pointer
        ${config.container}
      `}
      padding="none"
      centered={false}
    >
      <VStack spacing={config.spacing} align="stretch">
        {/* Image Section */}
        <div className={`relative ${config.image} overflow-hidden rounded-md bg-gray-50`}>
          {/* Badges */}
          {(badge || discount > 0 || isOutOfStock) && (
            <div className="absolute top-2 left-2 z-10">
              <VStack spacing="xs">
                {badge && (
                  <Badge variant="primary" size="sm">
                    {badge}
                  </Badge>
                )}
                {discount > 0 && (
                  <Badge variant="error" size="sm">
                    -{discount}%
                  </Badge>
                )}
                {isOutOfStock && (
                  <Badge variant="warning" size="sm">
                    Esgotado
                  </Badge>
                )}
              </VStack>
            </div>
          )}

          {/* Favorite Button */}
          <div className="absolute top-2 right-2 z-10">
            <Button
              size="icon"
              variant="ghost"
              onClick={handleToggleFavorite}
              className={`
                bg-white/80 backdrop-blur-sm hover:bg-white/90
                ${isFavorite ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}
              `}
            >
              {isFavorite ? '❤️' : '🤍'}
            </Button>
          </div>

          {/* Image */}
          {!imageError ? (
            <Image
              src={safeImage}
              alt={safeTitle}
              fill
              className={`${imageFitClass} transition-transform duration-200 group-hover:scale-105`}
              onLoad={handleImageLoad}
              onError={handleImageError}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-100 text-gray-400">
              📷 Imagem indisponível
            </div>
          )}

          {/* Loading State */}
          {isImageLoading && !imageError && (
            <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-brand-primary-200 border-t-brand-primary-500 rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Content Section */}
        <VStack spacing={config.spacing} align="stretch">
          {/* Title */}
          <h3 className={`font-medium text-gray-900 line-clamp-2 group-hover:text-brand-primary-600 transition-colors ${config.title}`}>
            {safeTitle}
          </h3>

          {/* Rating */}
          {rating && reviewCount > 0 && (
            <HStack spacing="xs" align="center">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`text-sm ${
                      star <= rating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  >
                    ⭐
                  </span>
                ))}
              </div>
              <span className="text-sm text-gray-500">
                ({reviewCount.toLocaleString('pt-BR')})
              </span>
            </HStack>
          )}

          {/* Details (for detailed size) */}
          {showDetails && size === 'detailed' && (
            <VStack spacing="xs">
              {length && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Comprimento:</span> {length}
                </div>
              )}
              {powerRating && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Potência:</span> {powerRating}W
                </div>
              )}
              {compatibility && compatibility.length > 0 && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Compatível com:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {compatibility.slice(0, 3).map((item, index) => (
                      <Badge key={index} variant="secondary" size="sm">
                        {item}
                      </Badge>
                    ))}
                    {compatibility.length > 3 && (
                      <Badge variant="secondary" size="sm">
                        +{compatibility.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </VStack>
          )}

          {/* Price Section */}
          <VStack spacing="xs">
            <HStack spacing="sm" align="center">
              <span className={`font-bold text-brand-primary-600 ${config.price}`}>
                {formatPrice(safePrice)}
              </span>
              {originalPrice && originalPrice > safePrice && (
                <span className="text-sm text-gray-500 line-through">
                  {formatPrice(originalPrice)}
                </span>
              )}
            </HStack>

            {installments && (
              <div className="text-sm text-gray-600">
                até {installments.quantity}x de {formatPrice(installments.amount)}
              </div>
            )}
          </VStack>

          {/* Action Buttons */}
          <VStack spacing="xs">
            {isOutOfStock ? (
              <Button
                variant="outline"
                size={size === 'compact' ? 'sm' : 'md'}
                fullWidth
                onClick={handleNotifyWhenAvailable}
              >
                🔔 Avisar quando disponível
              </Button>
            ) : (
              <Button
                variant="primary"
                size={size === 'compact' ? 'sm' : 'md'}
                fullWidth
                onClick={() => mercadoLivreLink && window.open(mercadoLivreLink, '_blank')}
              >
                🛒 Ver no Mercado Livre
              </Button>
            )}
          </VStack>
        </VStack>
      </VStack>
    </Container>
  );
}