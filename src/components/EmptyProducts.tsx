import React from 'react';

interface EmptyProductsProps {
  title?: string;
  description?: string;
  ctaText?: string;
  ctaLink?: string;
}

const EmptyProducts: React.FC<EmptyProductsProps> = ({
  title = "Produtos chegando em breve",
  description = "Nossa equipe está trabalhando para adicionar novos produtos incríveis.",
  ctaText = "Visitar nossa loja ML",
  ctaLink = "https://www.mercadolivre.com.br/pagina/peepersshop"
}) => (
  <div className="text-center py-12">
    <div className="max-w-md mx-auto">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      <a
        href={ctaLink}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
      >
        {ctaText}
        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </div>
  </div>
);

export default EmptyProducts;