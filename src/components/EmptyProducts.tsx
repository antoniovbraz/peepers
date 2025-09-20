'use client';

import React from 'react';

// Design System Imports
import { Button } from '@/components/ui/primitives/Button';
import { Container, Section } from '@/components/ui/layout/Container';
import { VStack } from '@/components/ui/layout/Stack';

// ==================== TYPES ====================

interface EmptyProductsProps {
  title?: string;
  description?: string;
  ctaText?: string;
  ctaLink?: string;
  onAction?: () => void;
  showCTA?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

// ==================== COMPONENT ====================

const EmptyProducts: React.FC<EmptyProductsProps> = ({
  title = "Produtos chegando em breve",
  description = "Nossa equipe está trabalhando para adicionar novos produtos incríveis.",
  ctaText = "Visitar nossa loja ML",
  ctaLink = "https://www.mercadolivre.com.br/pagina/peepersshop",
  onAction,
  showCTA = true,
  icon,
  className = ''
}) => {
  
  const handleAction = () => {
    if (onAction) {
      onAction();
    } else if (ctaLink) {
      window.open(ctaLink, '_blank', 'noopener,noreferrer');
    }
  };

  const defaultIcon = (
    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );

  return (
    <Section className={className}>
      <Container>
        <div className="flex justify-center py-12">
          <VStack spacing="lg" align="center" className="max-w-md text-center">
            
            {/* Icon */}
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
              {icon || defaultIcon}
            </div>
            
            {/* Content */}
            <VStack spacing="sm" align="center">
              <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
              <p className="text-gray-600 leading-relaxed">{description}</p>
            </VStack>
            
            {/* Call to Action */}
            {showCTA && (
              <Button
                variant="primary"
                onClick={handleAction}
                rightIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                }
              >
                {ctaText}
              </Button>
            )}
            
          </VStack>
        </div>
      </Container>
    </Section>
  );
};

export default EmptyProducts;