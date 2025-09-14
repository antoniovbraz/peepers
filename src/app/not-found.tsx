'use client';

import Link from 'next/link';
import PeepersLogo from '@/components/PeepersLogo';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="mb-8">
          <Link href="/" className="inline-block">
            <PeepersLogo size="lg" variant="full" />
          </Link>
        </div>

        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="text-9xl font-bold text-blue-600 mb-4">404</div>
          <div className="w-32 h-32 mx-auto mb-4">
            <svg className="w-full h-full text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-.966-5.5-2.5m13.5-9a2 2 0 11-4 0 2 2 0 014 0zm-6 0a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>

        {/* Content */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Página não encontrada
        </h1>

        <p className="text-lg text-gray-600 mb-8">
          Ops! A página que você está procurando não existe ou foi movida.
        </p>

        {/* Search/Product Suggestions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Talvez você esteja procurando por:
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            <Link
              href="/produtos"
              className="flex items-center p-3 rounded-md border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="flex-shrink-0 mr-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-gray-900">Ver Produtos</div>
                <div className="text-sm text-gray-500">Explorar nossa coleção</div>
              </div>
            </Link>

            <Link
              href="/contato"
              className="flex items-center p-3 rounded-md border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="flex-shrink-0 mr-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-gray-900">Falar Conosco</div>
                <div className="text-sm text-gray-500">Suporte e dúvidas</div>
              </div>
            </Link>

            <Link
              href="/"
              className="flex items-center p-3 rounded-md border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="flex-shrink-0 mr-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-gray-900">Voltar ao Início</div>
                <div className="text-sm text-gray-500">Página principal</div>
              </div>
            </Link>

            <Link
              href="#como-funciona"
              className="flex items-center p-3 rounded-md border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="flex-shrink-0 mr-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-gray-900">Como Funciona</div>
                <div className="text-sm text-gray-500">Entenda nosso processo</div>
              </div>
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="max-w-sm mx-auto">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Ou pesquise por produtos:
            </label>
            <div className="flex">
              <input
                type="text"
                id="search"
                placeholder="Buscar produtos..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const query = (e.target as HTMLInputElement).value;
                    if (query.trim()) {
                      window.location.href = `/produtos?q=${encodeURIComponent(query)}`;
                    } else {
                      window.location.href = '/produtos';
                    }
                  }
                }}
              />
              <button
                onClick={() => {
                  const input = document.getElementById('search') as HTMLInputElement;
                  const query = input?.value;
                  if (query?.trim()) {
                    window.location.href = `/produtos?q=${encodeURIComponent(query)}`;
                  } else {
                    window.location.href = '/produtos';
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Error Details */}
        <div className="text-sm text-gray-500 mb-8">
          <p>Se você acredita que isso é um erro, entre em contato conosco.</p>
        </div>

        {/* Primary CTA */}
        <Link
          href="/"
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Voltar ao Início
        </Link>
      </div>
    </div>
  );
}