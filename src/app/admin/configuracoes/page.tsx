'use client';

import React, { useState } from 'react';
import { 
  CogIcon, 
  ShieldCheckIcon, 
  BellIcon, 
  GlobeAltIcon,
  KeyIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import LGPDConfigurationPanel from '@/components/admin/LGPDConfigurationPanel';
import { 
  mockCompanySettings, 
  mockOAuthStatus, 
  mockWebhookConfig, 
  mockNotificationSettings, 
  mockAPIMonitoring 
} from '@/data/mockConfiguration';

interface ConfigurationSection {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  component: React.ComponentType;
}

// Componentes das seções de configuração
const GeneralSettings = () => {
  const [settings, setSettings] = useState(mockCompanySettings);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome da Empresa
          </label>
          <input
            type="text"
            value={settings.name}
            onChange={(e) => setSettings(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email de Contato
          </label>
          <input
            type="email"
            value={settings.contactEmail}
            onChange={(e) => setSettings(prev => ({ ...prev, contactEmail: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Telefone
          </label>
          <input
            type="tel"
            value={settings.phone}
            onChange={(e) => setSettings(prev => ({ ...prev, phone: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fuso Horário
          </label>
          <select
            value={settings.timezone}
            onChange={(e) => setSettings(prev => ({ ...prev, timezone: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="America/Sao_Paulo">São Paulo (GMT-3)</option>
            <option value="America/Manaus">Manaus (GMT-4)</option>
            <option value="America/Rio_Branco">Rio Branco (GMT-5)</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Moeda Padrão
          </label>
          <select
            value={settings.currency}
            onChange={(e) => setSettings(prev => ({ ...prev, currency: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="BRL">Real Brasileiro (BRL)</option>
            <option value="USD">Dólar Americano (USD)</option>
            <option value="EUR">Euro (EUR)</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Idioma
          </label>
          <select
            value={settings.language}
            onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="pt-BR">Português (Brasil)</option>
            <option value="en-US">English (US)</option>
            <option value="es-ES">Español</option>
          </select>
        </div>
      </div>
      
      {/* Endereço da Empresa */}
      <div className="border-t border-gray-200 pt-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Endereço da Empresa</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rua/Avenida
            </label>
            <input
              type="text"
              value={settings.address.street}
              onChange={(e) => setSettings(prev => ({ 
                ...prev, 
                address: { ...prev.address, street: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número
            </label>
            <input
              type="text"
              value={settings.address.number}
              onChange={(e) => setSettings(prev => ({ 
                ...prev, 
                address: { ...prev.address, number: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Complemento
            </label>
            <input
              type="text"
              value={settings.address.complement || ''}
              onChange={(e) => setSettings(prev => ({ 
                ...prev, 
                address: { ...prev.address, complement: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bairro
            </label>
            <input
              type="text"
              value={settings.address.neighborhood}
              onChange={(e) => setSettings(prev => ({ 
                ...prev, 
                address: { ...prev.address, neighborhood: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cidade
            </label>
            <input
              type="text"
              value={settings.address.city}
              onChange={(e) => setSettings(prev => ({ 
                ...prev, 
                address: { ...prev.address, city: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={settings.address.state}
              onChange={(e) => setSettings(prev => ({ 
                ...prev, 
                address: { ...prev.address, state: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="SP">São Paulo</option>
              <option value="RJ">Rio de Janeiro</option>
              <option value="MG">Minas Gerais</option>
              <option value="RS">Rio Grande do Sul</option>
              <option value="PR">Paraná</option>
              <option value="SC">Santa Catarina</option>
              {/* Add more states as needed */}
            </select>
          </div>
        </div>
      </div>
      
      {/* Informações Legais */}
      <div className="border-t border-gray-200 pt-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Informações Legais</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CNPJ
            </label>
            <input
              type="text"
              value={settings.legalInfo.cnpj || ''}
              onChange={(e) => setSettings(prev => ({ 
                ...prev, 
                legalInfo: { ...prev.legalInfo, cnpj: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="00.000.000/0000-00"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Inscrição Estadual
            </label>
            <input
              type="text"
              value={settings.legalInfo.stateRegistration || ''}
              onChange={(e) => setSettings(prev => ({ 
                ...prev, 
                legalInfo: { ...prev.legalInfo, stateRegistration: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Inscrição Municipal
            </label>
            <input
              type="text"
              value={settings.legalInfo.municipalRegistration || ''}
              onChange={(e) => setSettings(prev => ({ 
                ...prev, 
                legalInfo: { ...prev.legalInfo, municipalRegistration: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
      
      <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
        Salvar Configurações Gerais
      </button>
    </div>
  );
};

const APISettings = () => {
  const [oauthStatus, setOauthStatus] = useState(mockOAuthStatus);
  const [rateLimits] = useState(mockAPIMonitoring.rateLimits);

  const getScopeColor = (scope: string) => {
    switch (scope) {
      case 'read': return 'bg-blue-100 text-blue-800';
      case 'write': return 'bg-green-100 text-green-800';
      case 'offline_access': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRateLimitColor = (used: number, limit: number) => {
    const percentage = (used / limit) * 100;
    if (percentage > 90) return 'bg-red-500';
    if (percentage > 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-6">
      {/* Status de Conexão OAuth */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <KeyIcon className="h-5 w-5 mr-2" />
          Status do OAuth 2.0 + PKCE
        </h3>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            {oauthStatus.connected ? (
              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
            ) : (
              <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
            )}
            <span className={`font-medium ${oauthStatus.connected ? 'text-green-700' : 'text-red-700'}`}>
              {oauthStatus.connected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
          
          <button className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors flex items-center">
            <ArrowPathIcon className="h-4 w-4 mr-1" />
            Renovar Token
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">
              Último refresh: {oauthStatus.lastRefresh.toLocaleString('pt-BR')}
            </p>
            <p className="text-sm text-gray-600">
              Expira em: {oauthStatus.tokenExpiry.toLocaleString('pt-BR')}
            </p>
            <p className="text-sm text-gray-600">
              User ID: {oauthStatus.userId}
            </p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600 mb-2">Escopos autorizados:</p>
            <div className="flex flex-wrap gap-1">
              {oauthStatus.scopes.map((scope) => (
                <span
                  key={scope}
                  className={`px-2 py-1 text-xs rounded-full ${getScopeColor(scope)}`}
                >
                  {scope}
                </span>
              ))}
            </div>
          </div>
        </div>
        
        {/* Application Info */}
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Informações da Aplicação</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <p className="text-sm text-gray-600">
              <strong>Nome:</strong> {oauthStatus.application.name}
            </p>
            <p className="text-sm text-gray-600">
              <strong>ID:</strong> {oauthStatus.application.id}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Status:</strong> 
              <span className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
                oauthStatus.application.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {oauthStatus.application.status}
              </span>
            </p>
          </div>
        </div>
      </div>
      
      {/* Rate Limits */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <ChartBarIcon className="h-5 w-5 mr-2" />
          Rate Limits da API
        </h3>
        
        <div className="space-y-4">
          {rateLimits.map((rateLimit) => (
            <div key={rateLimit.endpoint} className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium capitalize">
                    {rateLimit.endpoint.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}
                  </span>
                  <span className="text-gray-600">
                    {rateLimit.used}/{rateLimit.limit} ({Math.round((rateLimit.used / rateLimit.limit) * 100)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getRateLimitColor(rateLimit.used, rateLimit.limit)}`}
                    style={{ width: `${(rateLimit.used / rateLimit.limit) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Reset às {rateLimit.resetTime} ({rateLimit.timeWindow})
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Configurações de Callback */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          URLs de Callback
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              OAuth Redirect URI
            </label>
            <input
              type="url"
              value="https://peepers.vercel.app/api/auth/mercado-livre/callback"
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Webhook Notification URL
            </label>
            <input
              type="url"
              value="https://peepers.vercel.app/api/webhook/mercado-livre"
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const WebhookSettings = () => {
  const [webhookConfig, setWebhookConfig] = useState(mockWebhookConfig);

  const toggleTopic = (topicName: string) => {
    setWebhookConfig(prev => ({
      ...prev,
      topics: prev.topics.map(topic =>
        topic.name === topicName
          ? { ...topic, enabled: !topic.enabled }
          : topic
      )
    }));
  };

  const averageSuccessRate = webhookConfig.topics
    .filter(topic => topic.enabled)
    .reduce((sum, topic) => sum + topic.deliveryRate, 0) / 
    webhookConfig.topics.filter(topic => topic.enabled).length;

  const totalFailed = webhookConfig.topics
    .filter(topic => topic.enabled)
    .reduce((sum, topic) => sum + topic.failedNotifications, 0);

  const lastNotification = webhookConfig.topics
    .filter(topic => topic.enabled && topic.lastNotification)
    .sort((a, b) => (b.lastNotification?.getTime() || 0) - (a.lastNotification?.getTime() || 0))[0]
    ?.lastNotification;

  return (
    <div className="space-y-6">
      {/* Status dos Webhooks */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <BellIcon className="h-5 w-5 mr-2" />
          Status dos Webhooks
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-700">
              {averageSuccessRate ? averageSuccessRate.toFixed(1) : '0.0'}%
            </p>
            <p className="text-sm text-green-600">Taxa de Sucesso</p>
          </div>
          
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-700">
              {lastNotification ? lastNotification.toLocaleTimeString('pt-BR') : '--:--'}
            </p>
            <p className="text-sm text-blue-600">Última Notificação</p>
          </div>
          
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-700">
              {totalFailed}
            </p>
            <p className="text-sm text-red-600">Falhas (24h)</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-700 mr-2">
              Webhooks Ativos
            </span>
            {webhookConfig.enabled ? (
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
            ) : (
              <XCircleIcon className="h-5 w-5 text-red-500" />
            )}
          </div>
          
          <button
            onClick={() => setWebhookConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              webhookConfig.enabled
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {webhookConfig.enabled ? 'Desativar' : 'Ativar'} Webhooks
          </button>
        </div>
      </div>
      
      {/* Configuração de Tópicos */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Tópicos de Notificação
        </h3>
        
        <div className="space-y-3">
          {webhookConfig.topics.map((topic) => (
            <div key={topic.name} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-gray-900">{topic.name}</h4>
                  {topic.enabled && (
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>{topic.deliveryRate.toFixed(1)}% sucesso</span>
                      <span>•</span>
                      <span>{topic.totalNotifications} total</span>
                      {topic.failedNotifications > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-red-600">{topic.failedNotifications} falhas</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600">{topic.description}</p>
                {topic.lastNotification && topic.enabled && (
                  <p className="text-xs text-gray-500 mt-1">
                    Última: {topic.lastNotification.toLocaleString('pt-BR')}
                  </p>
                )}
              </div>
              
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  checked={topic.enabled}
                  onChange={() => toggleTopic(topic.name)}
                  className="sr-only"
                />
                <div className={`w-11 h-6 rounded-full transition-colors ${
                  topic.enabled ? 'bg-green-600' : 'bg-gray-300'
                }`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                    topic.enabled ? 'translate-x-5' : 'translate-x-0'
                  } mt-0.5 ml-0.5`} />
                </div>
              </label>
            </div>
          ))}
        </div>
      </div>
      
      {/* Configurações Avançadas */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Configurações de Entrega
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Timeout de Resposta (ms)
            </label>
            <input
              type="number"
              value={webhookConfig.responseTimeout}
              onChange={(e) => setWebhookConfig(prev => ({ 
                ...prev, 
                responseTimeout: parseInt(e.target.value) 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Máximo: 500ms conforme documentação ML
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Máximo de Tentativas
            </label>
            <input
              type="number"
              value={webhookConfig.retryPolicy.maxRetries}
              onChange={(e) => setWebhookConfig(prev => ({ 
                ...prev, 
                retryPolicy: { 
                  ...prev.retryPolicy, 
                  maxRetries: parseInt(e.target.value) 
                }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
      
      {/* IPs Autorizados */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          IPs Autorizados do Mercado Livre
        </h3>
        
        <div className="bg-gray-50 rounded-md p-4">
          <p className="text-sm text-gray-600 mb-2">
            Certifique-se de que seu firewall permite requisições destes IPs:
          </p>
          
          <div className="grid grid-cols-2 gap-2 font-mono text-sm">
            {webhookConfig.ipWhitelist.map((ip) => (
              <div key={ip} className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                {ip}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const NotificationSettings = () => {
  const [notifications, setNotifications] = useState(mockNotificationSettings);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Notificações por Email
        </h3>
        
        <div className="space-y-3">
          {Object.entries(notifications.email).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm text-gray-700">
                {key === 'newOrders' && 'Novos pedidos'}
                {key === 'stockAlerts' && 'Alertas de estoque'}
                {key === 'systemUpdates' && 'Atualizações do sistema'}
                {key === 'weeklyReports' && 'Relatórios semanais'}
                {key === 'dailyDigest' && 'Resumo diário'}
                {key === 'errorAlerts' && 'Alertas de erro'}
              </span>
              
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => setNotifications(prev => ({
                    ...prev,
                    email: { ...prev.email, [key]: e.target.checked }
                  }))}
                  className="sr-only"
                />
                <div className={`w-11 h-6 rounded-full transition-colors ${
                  value ? 'bg-green-600' : 'bg-gray-300'
                }`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                    value ? 'translate-x-5' : 'translate-x-0'
                  } mt-0.5 ml-0.5`} />
                </div>
              </label>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Notificações do Navegador
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Notificações em tempo real</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.browser.realTime}
                onChange={(e) => setNotifications(prev => ({
                  ...prev,
                  browser: { ...prev.browser, realTime: e.target.checked }
                }))}
                className="sr-only"
              />
              <div className={`w-11 h-6 rounded-full transition-colors ${
                notifications.browser.realTime ? 'bg-green-600' : 'bg-gray-300'
              }`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                  notifications.browser.realTime ? 'translate-x-5' : 'translate-x-0'
                } mt-0.5 ml-0.5`} />
              </div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Som de notificação</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.browser.sound}
                onChange={(e) => setNotifications(prev => ({
                  ...prev,
                  browser: { ...prev.browser, sound: e.target.checked }
                }))}
                className="sr-only"
              />
              <div className={`w-11 h-6 rounded-full transition-colors ${
                notifications.browser.sound ? 'bg-green-600' : 'bg-gray-300'
              }`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                  notifications.browser.sound ? 'translate-x-5' : 'translate-x-0'
                } mt-0.5 ml-0.5`} />
              </div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Notificações desktop</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.browser.desktop}
                onChange={(e) => setNotifications(prev => ({
                  ...prev,
                  browser: { ...prev.browser, desktop: e.target.checked }
                }))}
                className="sr-only"
              />
              <div className={`w-11 h-6 rounded-full transition-colors ${
                notifications.browser.desktop ? 'bg-green-600' : 'bg-gray-300'
              }`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                  notifications.browser.desktop ? 'translate-x-5' : 'translate-x-0'
                } mt-0.5 ml-0.5`} />
              </div>
            </label>
          </div>
        </div>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Frequência de Notificações
        </h3>
        
        <div className="space-y-3">
          {Object.entries(notifications.frequency).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm text-gray-700">
                {key === 'immediateAlerts' && 'Alertas imediatos'}
                {key === 'hourlyDigest' && 'Resumo por hora'}
                {key === 'dailyDigest' && 'Resumo diário'}
                {key === 'weeklyReports' && 'Relatórios semanais'}
              </span>
              
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => setNotifications(prev => ({
                    ...prev,
                    frequency: { ...prev.frequency, [key]: e.target.checked }
                  }))}
                  className="sr-only"
                />
                <div className={`w-11 h-6 rounded-full transition-colors ${
                  value ? 'bg-green-600' : 'bg-gray-300'
                }`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                    value ? 'translate-x-5' : 'translate-x-0'
                  } mt-0.5 ml-0.5`} />
                </div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const APIMonitoring = () => {
  const [monitoring] = useState(mockAPIMonitoring);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'healthy': return 'Saudável';
      case 'warning': return 'Atenção';
      case 'error': return 'Erro';
      default: return 'Desconhecido';
    }
  };

  return (
    <div className="space-y-6">
      {/* Métricas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-blue-700">
            {monitoring.totalRequests.toLocaleString()}
          </p>
          <p className="text-sm text-blue-600">Total de Requisições</p>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-red-700">
            {monitoring.totalErrors}
          </p>
          <p className="text-sm text-red-600">Total de Erros</p>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-700">
            {monitoring.averageResponseTime}ms
          </p>
          <p className="text-sm text-green-600">Tempo Médio</p>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-purple-700">
            {monitoring.uptime}%
          </p>
          <p className="text-sm text-purple-600">Uptime</p>
        </div>
      </div>
      
      {/* Performance por Endpoint */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Performance por Endpoint
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Endpoint</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Método</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Requisições</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Erros</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Tempo Médio</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {monitoring.endpoints.map((endpoint, index) => (
                <tr key={index} className="border-t border-gray-200">
                  <td className="px-4 py-2 font-mono text-xs">{endpoint.path}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 text-xs rounded ${
                      endpoint.method === 'GET' ? 'bg-blue-100 text-blue-800' :
                      endpoint.method === 'POST' ? 'bg-green-100 text-green-800' :
                      endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                      endpoint.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {endpoint.method}
                    </span>
                  </td>
                  <td className="px-4 py-2">{endpoint.requests.toLocaleString()}</td>
                  <td className="px-4 py-2">
                    {endpoint.errors > 0 ? (
                      <span className="text-red-600 font-medium">{endpoint.errors}</span>
                    ) : (
                      <span className="text-green-600">0</span>
                    )}
                  </td>
                  <td className="px-4 py-2">{endpoint.avgResponse}ms</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(endpoint.status)}`}>
                      {getStatusText(endpoint.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Principais Erros */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Principais Erros (24h)
        </h3>
        
        <div className="space-y-3">
          {monitoring.topErrors.map((error, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-sm font-medium text-red-700">
                    {error.code}
                  </span>
                  <span className="text-sm text-red-600">
                    {error.message}
                  </span>
                </div>
                <p className="text-xs text-red-500 mt-1">
                  Última ocorrência: {error.lastOccurrence.toLocaleString('pt-BR')}
                </p>
              </div>
              
              <div className="text-right">
                <p className="text-lg font-bold text-red-700">{error.count}</p>
                <p className="text-xs text-red-600">ocorrências</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Erros por Código HTTP */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Distribuição de Erros por Código HTTP
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(monitoring.errorsByCode).map(([code, count]) => (
            <div key={code} className="text-center p-4 border border-gray-200 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <p className="text-sm text-gray-600">
                {code} - {
                  code === '400' ? 'Bad Request' :
                  code === '401' ? 'Unauthorized' :
                  code === '403' ? 'Forbidden' :
                  code === '404' ? 'Not Found' :
                  code === '429' ? 'Rate Limited' :
                  code === '451' ? 'Legal Reasons' :
                  code === '500' ? 'Server Error' :
                  code === '502' ? 'Bad Gateway' :
                  code === '503' ? 'Unavailable' : 'Outros'
                }
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function ConfiguracoesPage() {
  const [activeSection, setActiveSection] = useState('geral');

  const sections: ConfigurationSection[] = [
    {
      id: 'geral',
      title: 'Configurações Gerais',
      description: 'Informações da empresa, fuso horário e preferências',
      icon: BuildingOfficeIcon,
      component: GeneralSettings
    },
    {
      id: 'api',
      title: 'API e OAuth',
      description: 'Configurações do Mercado Livre, tokens e rate limits',
      icon: KeyIcon,
      component: APISettings
    },
    {
      id: 'webhooks',
      title: 'Webhooks',
      description: 'Notificações automáticas e tópicos configurados',
      icon: GlobeAltIcon,
      component: WebhookSettings
    },
    {
      id: 'notificacoes',
      title: 'Notificações',
      description: 'Alertas por email, navegador e dispositivos móveis',
      icon: BellIcon,
      component: NotificationSettings
    },
    {
      id: 'monitoramento',
      title: 'Monitoramento',
      description: 'Performance da API e análise de erros',
      icon: ChartBarIcon,
      component: APIMonitoring
    },
    {
      id: 'lgpd',
      title: 'LGPD',
      description: 'Configurações de proteção de dados e privacidade',
      icon: DocumentTextIcon,
      component: LGPDConfigurationPanel
    }
  ];

  const currentSection = sections.find(s => s.id === activeSection);
  const CurrentComponent = currentSection?.component || GeneralSettings;

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <CogIcon className="h-8 w-8 mr-3 text-green-600" />
          Configurações
        </h1>
        <p className="text-gray-600 mt-2">
          Gerencie as configurações do sistema, API do Mercado Livre e preferências
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Menu lateral */}
        <div className="lg:col-span-1">
          <nav className="space-y-2">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors flex items-center ${
                    activeSection === section.id
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  <div>
                    <div className="font-medium">{section.title}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {section.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Conteúdo principal */}
        <div className="lg:col-span-3">
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {currentSection?.title}
            </h2>
            
            <CurrentComponent />
          </div>
        </div>
      </div>
    </div>
  );
}