/**
 * LGPD Configuration Component - Specific LGPD/GDPR settings
 * 
 * Implements comprehensive data protection configuration
 * based on Brazilian LGPD requirements
 */

'use client';

import React, { useState } from 'react';
import { 
  ShieldCheckIcon, 
  DocumentTextIcon, 
  UserIcon, 
  ClockIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { mockLGPDSettings } from '@/data/mockConfiguration';
import type { LGPDSettings } from '@/types/configuration';

export default function LGPDConfigurationPanel() {
  const [settings, setSettings] = useState<LGPDSettings>(mockLGPDSettings);
  const [isEditing, setIsEditing] = useState(false);

  const updateSettings = (updates: Partial<LGPDSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const updateDPO = (field: keyof LGPDSettings['dataProtectionOfficer'], value: string) => {
    setSettings(prev => ({
      ...prev,
      dataProtectionOfficer: {
        ...prev.dataProtectionOfficer,
        [field]: value
      }
    }));
  };

  const updateCookieSettings = (field: keyof LGPDSettings['cookieSettings'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      cookieSettings: {
        ...prev.cookieSettings,
        [field]: value
      }
    }));
  };

  const saveSettings = async () => {
    // TODO: Implement API call to save LGPD settings
    console.log('Saving LGPD settings:', settings);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <ShieldCheckIcon className="h-6 w-6 mr-2 text-green-600" />
            Configurações LGPD
          </h2>
          
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              isEditing
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isEditing ? 'Cancelar' : 'Editar'}
          </button>
        </div>
        
        <p className="text-gray-600">
          Configure as políticas de proteção de dados conforme a Lei Geral de Proteção de Dados (LGPD).
        </p>
      </div>

      {/* Data Retention */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <ClockIcon className="h-5 w-5 mr-2" />
          Retenção de Dados
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Período de Retenção (dias)
            </label>
            <input
              type="number"
              value={settings.dataRetentionDays}
              onChange={(e) => updateSettings({ dataRetentionDays: parseInt(e.target.value) })}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50"
            />
            <p className="text-xs text-gray-500 mt-1">
              Tempo que os dados pessoais são mantidos no sistema
            </p>
          </div>
          
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.automaticDeletion}
                onChange={(e) => updateSettings({ automaticDeletion: e.target.checked })}
                disabled={!isEditing}
                className="mr-2 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded disabled:opacity-50"
              />
              <span className="text-sm text-gray-700">Exclusão automática</span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-6">
              Remove automaticamente dados vencidos
            </p>
          </div>
        </div>
      </div>

      {/* Data Rights */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <UserIcon className="h-5 w-5 mr-2" />
          Direitos dos Titulares
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700">Rastreamento de Consentimento</span>
              <p className="text-xs text-gray-500">Registra quando e como o consentimento foi obtido</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.consentTracking}
                onChange={(e) => updateSettings({ consentTracking: e.target.checked })}
                disabled={!isEditing}
                className="sr-only"
              />
              <div className={`w-11 h-6 rounded-full transition-colors ${
                settings.consentTracking ? 'bg-green-600' : 'bg-gray-300'
              } ${!isEditing ? 'opacity-50' : ''}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                  settings.consentTracking ? 'translate-x-5' : 'translate-x-0'
                } mt-0.5 ml-0.5`} />
              </div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700">Exportação de Dados</span>
              <p className="text-xs text-gray-500">Permite que usuários baixem seus dados pessoais</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.dataExportEnabled}
                onChange={(e) => updateSettings({ dataExportEnabled: e.target.checked })}
                disabled={!isEditing}
                className="sr-only"
              />
              <div className={`w-11 h-6 rounded-full transition-colors ${
                settings.dataExportEnabled ? 'bg-green-600' : 'bg-gray-300'
              } ${!isEditing ? 'opacity-50' : ''}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                  settings.dataExportEnabled ? 'translate-x-5' : 'translate-x-0'
                } mt-0.5 ml-0.5`} />
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Privacy Policy */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <DocumentTextIcon className="h-5 w-5 mr-2" />
          Política de Privacidade
        </h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            URL da Política de Privacidade
          </label>
          <input
            type="url"
            value={settings.privacyPolicyUrl}
            onChange={(e) => updateSettings({ privacyPolicyUrl: e.target.value })}
            disabled={!isEditing}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50"
            placeholder="https://exemplo.com/privacidade"
          />
          <p className="text-xs text-gray-500 mt-1">
            Link para a política de privacidade pública do site
          </p>
        </div>
      </div>

      {/* Data Protection Officer */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <UserIcon className="h-5 w-5 mr-2" />
          Encarregado de Proteção de Dados (DPO)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome Completo
            </label>
            <input
              type="text"
              value={settings.dataProtectionOfficer.name}
              onChange={(e) => updateDPO('name', e.target.value)}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={settings.dataProtectionOfficer.email}
              onChange={(e) => updateDPO('email', e.target.value)}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefone
            </label>
            <input
              type="tel"
              value={settings.dataProtectionOfficer.phone}
              onChange={(e) => updateDPO('phone', e.target.value)}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50"
            />
          </div>
        </div>
      </div>

      {/* Cookie Settings */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <CogIcon className="h-5 w-5 mr-2" />
          Configurações de Cookies
        </h3>
        
        <div className="space-y-4">
          {Object.entries(settings.cookieSettings).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-700">
                  {key === 'essential' && 'Cookies Essenciais'}
                  {key === 'analytics' && 'Cookies de Analytics'}
                  {key === 'marketing' && 'Cookies de Marketing'}
                  {key === 'preferences' && 'Cookies de Preferências'}
                </span>
                <p className="text-xs text-gray-500">
                  {key === 'essential' && 'Necessários para o funcionamento básico'}
                  {key === 'analytics' && 'Para análise de uso e melhorias'}
                  {key === 'marketing' && 'Para personalização de anúncios'}
                  {key === 'preferences' && 'Para lembrar configurações do usuário'}
                </p>
              </div>
              
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => updateCookieSettings(key as keyof LGPDSettings['cookieSettings'], e.target.checked)}
                  disabled={!isEditing || key === 'essential'} // Essential cookies cannot be disabled
                  className="sr-only"
                />
                <div className={`w-11 h-6 rounded-full transition-colors ${
                  value ? 'bg-green-600' : 'bg-gray-300'
                } ${(!isEditing || key === 'essential') ? 'opacity-50' : ''}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                    value ? 'translate-x-5' : 'translate-x-0'
                  } mt-0.5 ml-0.5`} />
                </div>
              </label>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            <strong>Nota:</strong> Cookies essenciais não podem ser desabilitados pois são necessários para o funcionamento básico do sistema.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      {isEditing && (
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setIsEditing(false)}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          
          <button
            onClick={saveSettings}
            className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
          >
            Salvar Configurações LGPD
          </button>
        </div>
      )}

      {/* Compliance Status */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-green-900 mb-2 flex items-center">
          <ShieldCheckIcon className="h-5 w-5 mr-2" />
          Status de Conformidade
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm text-green-800">Política de Privacidade: Ativa</span>
          </div>
          
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm text-green-800">DPO Designado: Configurado</span>
          </div>
          
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm text-green-800">Consentimento: Rastreado</span>
          </div>
          
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm text-green-800">Retenção: {settings.dataRetentionDays} dias</span>
          </div>
        </div>
      </div>
    </div>
  );
}