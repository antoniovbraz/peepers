'use client';

import { useState } from 'react';
import { useCookieConsent } from '@/hooks/useCookieConsent';
import { COOKIE_CATEGORIES } from '@/types/cookies';
import { PAGES } from '@/config/routes';

/**
 * Banner de Consent de Cookies conforme LGPD
 * 
 * Features:
 * - Controle granular por categoria de cookies
 * - Persistência das preferências
 * - Links para política de privacidade
 * - Design responsivo e acessível
 * - Compliance total com LGPD
 */
export default function CookieConsentBanner() {
  const {
    showBanner,
    acceptAll,
    acceptEssential,
    saveConsent,
    isLoading
  } = useCookieConsent();

  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true,
    functional: true,
    analytics: false,
    marketing: false
  });

  // Não renderizar durante o loading para evitar flash
  if (isLoading || !showBanner) {
    return null;
  }

  const handleSavePreferences = () => {
    saveConsent(preferences);
  };

  const handleTogglePreference = (category: string, value: boolean) => {
    if (category === 'essential') return; // Não pode ser alterado
    
    setPreferences(prev => ({
      ...prev,
      [category]: value
    }));
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" />
      
      {/* Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-7xl mx-auto p-4 sm:p-6">
          {!showDetails ? (
            /* Versão Simples */
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  🍪 Utilizamos cookies para melhorar sua experiência
                </h3>
                <p className="text-gray-600 text-sm">
                  Utilizamos cookies essenciais para o funcionamento da aplicação e cookies opcionais 
                  para análises e personalização. Você pode escolher quais categorias aceitar.
                  {' '}
                  <a 
                    href={PAGES.PRIVACIDADE}
                    className="text-blue-600 hover:text-blue-800 underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Veja nossa Política de Privacidade
                  </a>
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                <button
                  onClick={() => setShowDetails(true)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md text-sm font-medium transition-colors"
                >
                  Personalizar
                </button>
                <button
                  onClick={acceptEssential}
                  className="px-4 py-2 text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md text-sm font-medium transition-colors"
                >
                  Apenas Essenciais
                </button>
                <button
                  onClick={acceptAll}
                  className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-md text-sm font-medium transition-colors"
                >
                  Aceitar Todos
                </button>
              </div>
            </div>
          ) : (
            /* Versão Detalhada */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Personalize suas preferências de cookies
                </h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Fechar detalhes"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className="text-gray-600 text-sm mb-4">
                Escolha quais tipos de cookies você permite. Cookies essenciais são necessários 
                para o funcionamento básico e não podem ser desabilitados.
              </p>

              {/* Lista de Categorias */}
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {COOKIE_CATEGORIES.map((category) => {
                  const isChecked = preferences[category.id as keyof typeof preferences];
                  const isDisabled = category.required;
                  
                  return (
                    <div key={category.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center h-5">
                        <input
                          id={`cookie-${category.id}`}
                          type="checkbox"
                          checked={isChecked}
                          disabled={isDisabled}
                          onChange={(e) => handleTogglePreference(category.id, e.target.checked)}
                          className={`w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 ${
                            isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <label 
                          htmlFor={`cookie-${category.id}`}
                          className={`font-medium text-gray-900 ${
                            isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'
                          }`}
                        >
                          {category.name}
                          {category.required && (
                            <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                              Obrigatório
                            </span>
                          )}
                        </label>
                        <p className="text-sm text-gray-600 mt-1">
                          {category.description}
                        </p>
                        <div className="mt-2">
                          <details className="text-xs">
                            <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                              Ver cookies ({category.cookies.length})
                            </summary>
                            <div className="mt-1 ml-4">
                              {category.cookies.map((cookie, index) => (
                                <code key={index} className="inline-block bg-gray-200 px-1 rounded mr-1 mb-1">
                                  {cookie}
                                </code>
                              ))}
                            </div>
                          </details>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Ações */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t border-gray-200">
                <div className="flex-1">
                  <a 
                    href={PAGES.PRIVACIDADE}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    📋 Política de Privacidade Completa
                  </a>
                </div>
                <div className="flex gap-2 sm:gap-3">
                  <button
                    onClick={acceptEssential}
                    className="px-4 py-2 text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md text-sm font-medium transition-colors"
                  >
                    Apenas Essenciais
                  </button>
                  <button
                    onClick={handleSavePreferences}
                    className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-md text-sm font-medium transition-colors"
                  >
                    Salvar Preferências
                  </button>
                </div>
              </div>
              
              {/* Nota Legal */}
              <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                <p>
                  ⚖️ Este banner está em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018). 
                  Suas preferências são armazenadas localmente e podem ser alteradas a qualquer momento.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}