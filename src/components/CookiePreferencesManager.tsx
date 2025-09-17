'use client';

import { useState } from 'react';
import { useCookieConsent } from '@/hooks/useCookieConsent';
import { COOKIE_CATEGORIES } from '@/types/cookies';

/**
 * Componente para gerenciar preferências de cookies no painel admin
 * Permite ao usuário visualizar e alterar suas preferências a qualquer momento
 */
export default function CookiePreferencesManager() {
  const {
    consent,
    saveConsent,
    resetConsent,
    isCategoryAccepted
  } = useCookieConsent();

  const [preferences, setPreferences] = useState({
    essential: true,
    functional: isCategoryAccepted('functional'),
    analytics: isCategoryAccepted('analytics'),
    marketing: isCategoryAccepted('marketing')
  });

  const [showSuccess, setShowSuccess] = useState(false);

  const handleSavePreferences = () => {
    saveConsent(preferences);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleTogglePreference = (category: string, value: boolean) => {
    if (category === 'essential') return; // Não pode ser alterado
    
    setPreferences(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const handleResetConsent = () => {
    if (confirm('Tem certeza que deseja resetar suas preferências de cookies? Isso irá limpar todos os cookies não essenciais.')) {
      resetConsent();
      setPreferences({
        essential: true,
        functional: false,
        analytics: false,
        marketing: false
      });
    }
  };

  if (!consent) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Preferências de Cookies
        </h3>
        <p className="text-gray-600">
          Você ainda não definiu suas preferências de cookies. 
          Elas aparecerão aqui após você interagir com o banner de cookies.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Preferências de Cookies
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Gerencie suas preferências de cookies conforme LGPD
        </p>
      </div>

      <div className="p-6">
        {/* Status Atual */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Status Atual</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Consentimento dado em:</strong> {new Date(consent.consentDate).toLocaleString('pt-BR')}</p>
            <p><strong>Versão da política:</strong> {consent.version}</p>
          </div>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm">
              ✅ Preferências salvas com sucesso!
            </p>
          </div>
        )}

        {/* Lista de Categorias */}
        <div className="space-y-4 mb-6">
          {COOKIE_CATEGORIES.map((category) => {
            const isChecked = preferences[category.id as keyof typeof preferences];
            const isDisabled = category.required;
            
            return (
              <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex items-center h-5 mt-1">
                    <input
                      id={`admin-cookie-${category.id}`}
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
                      htmlFor={`admin-cookie-${category.id}`}
                      className={`font-medium text-gray-900 block ${
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
                    <p className="text-sm text-gray-600 mt-1 mb-2">
                      {category.description}
                    </p>
                    
                    {/* Lista de Cookies */}
                    <div className="mt-2">
                      <h5 className="text-xs font-medium text-gray-700 mb-1">
                        Cookies incluídos:
                      </h5>
                      <div className="flex flex-wrap gap-1">
                        {category.cookies.map((cookie, index) => (
                          <code key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {cookie}
                          </code>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={handleSavePreferences}
            className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-md text-sm font-medium transition-colors"
          >
            Salvar Preferências
          </button>
          
          <button
            onClick={() => {
              setPreferences({
                essential: true,
                functional: false,
                analytics: false,
                marketing: false
              });
            }}
            className="px-4 py-2 text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md text-sm font-medium transition-colors"
          >
            Apenas Essenciais
          </button>
          
          <button
            onClick={() => {
              setPreferences({
                essential: true,
                functional: true,
                analytics: true,
                marketing: true
              });
            }}
            className="px-4 py-2 text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md text-sm font-medium transition-colors"
          >
            Aceitar Todos
          </button>
          
          <button
            onClick={handleResetConsent}
            className="px-4 py-2 text-red-700 bg-white hover:bg-red-50 border border-red-300 rounded-md text-sm font-medium transition-colors"
          >
            Resetar Tudo
          </button>
        </div>

        {/* Links Úteis */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-2">Links Úteis</h4>
          <div className="space-y-1">
            <a 
              href="/privacidade"
              className="text-sm text-blue-600 hover:text-blue-800 underline block"
              target="_blank"
              rel="noopener noreferrer"
            >
              📋 Política de Privacidade Completa
            </a>
            <a 
              href="https://www.gov.br/anpd"
              className="text-sm text-blue-600 hover:text-blue-800 underline block"
              target="_blank"
              rel="noopener noreferrer"
            >
              🏛️ ANPD - Autoridade Nacional de Proteção de Dados
            </a>
          </div>
        </div>

        {/* Nota Legal */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>Conformidade LGPD:</strong> Você pode alterar suas preferências a qualquer momento. 
            Cookies essenciais são necessários para o funcionamento da aplicação e não podem ser desabilitados.
            Para exercer outros direitos previstos na LGPD, consulte nossa Política de Privacidade.
          </p>
        </div>
      </div>
    </div>
  );
}