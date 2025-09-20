'use client';

import React from 'react';

// Design System Imports
import { Container, Section } from '@/components/ui/layout/Container';
import { VStack } from '@/components/ui/layout/Stack';

// ==================== TYPES ====================

interface ProductsLoadingProps {
  count?: number;
  title?: string;
  showTitle?: boolean;
}

// ==================== COMPONENT ====================

const ProductsLoading: React.FC<ProductsLoadingProps> = ({ 
  count = 6,
  title = "Carregando produtos...",
  showTitle = false
}) => (
  <Section>
    <Container>
      <VStack spacing="xl">
        
        {/* Optional Title */}
        {showTitle && (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            <p className="text-gray-600 mt-2">Aguarde um momento enquanto buscamos os melhores produtos.</p>
          </div>
        )}
        
        {/* Loading Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 animate-pulse">
              
              {/* Image Skeleton */}
              <div className="aspect-square bg-gray-200" />
              
              {/* Content Skeleton */}
              <VStack spacing="sm" className="p-4">
                
                {/* Title Lines */}
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
                
                {/* Rating Skeleton */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <div key={j} className="w-4 h-4 bg-gray-200 rounded" />
                  ))}
                  <div className="h-3 bg-gray-200 rounded w-12 ml-2" />
                </div>
                
                {/* Price Skeleton */}
                <div className="space-y-1">
                  <div className="h-6 bg-gray-200 rounded w-24" />
                  <div className="h-3 bg-gray-200 rounded w-32" />
                </div>
                
                {/* Button Skeleton */}
                <div className="h-9 bg-gray-200 rounded w-full mt-2" />
                
              </VStack>
            </div>
          ))}
        </div>
        
        {/* Loading Animation Indicator */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-sm text-gray-500">
            <div className="w-4 h-4 border-2 border-brand-primary-200 border-t-brand-primary-600 rounded-full animate-spin" />
            <span>Carregando produtos...</span>
          </div>
        </div>
        
      </VStack>
    </Container>
  </Section>
);

export default ProductsLoading;