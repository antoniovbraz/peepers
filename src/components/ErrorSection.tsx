'use client';

import ReloadButton from './ReloadButton';

export default function ErrorSection() {
  return (
    <div className="text-center py-12">
      <div className="max-w-md mx-auto">
        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Erro ao carregar produtos</h3>
        <p className="text-gray-600 mb-4">
          Ocorreu um problema ao buscar os produtos. Tente novamente em alguns instantes.
        </p>
        <ReloadButton className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
          Tentar novamente
        </ReloadButton>
      </div>
    </div>
  );
}