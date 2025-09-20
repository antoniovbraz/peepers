'use client';

import React from 'react';

// Design System Imports
import { Button } from '@/components/ui/primitives/Button';
import { Container, Section } from '@/components/ui/layout/Container';
import { VStack } from '@/components/ui/layout/Stack';

// ==================== TYPES ====================

interface ProductsErrorProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  showRetryButton?: boolean;
  className?: string;
}

// ==================== COMPONENT ====================

const ProductsError: React.FC<ProductsErrorProps> = ({
  title = "Erro ao carregar produtos",
  description = "Ocorreu um problema ao buscar os produtos. Tente novamente em alguns instantes.",
  onRetry,
  showRetryButton = true,
  className = ''
}) => {
  
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      // Default behavior: reload page
      window.location.reload();
    }
  };

  return (
    <Section className={className}>
      <Container>
        <div className="flex justify-center py-12">
          <VStack spacing="lg" align="center" className="max-w-md text-center">
            
            {/* Error Icon */}
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            {/* Error Content */}
            <VStack spacing="sm" align="center">
              <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
              <p className="text-gray-600 leading-relaxed">{description}</p>
            </VStack>
            
            {/* Action Buttons */}
            {showRetryButton && (
              <VStack spacing="sm" align="center">
                <Button
                  variant="primary"
                  onClick={handleRetry}
                  leftIcon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  }
                >
                  Tentar Novamente
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.location.href = '/'}
                >
                  Voltar à página inicial
                </Button>
              </VStack>
            )}
            
          </VStack>
        </div>
      </Container>
    </Section>
  );
};

export default ProductsError;