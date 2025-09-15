'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { PAGES, API_ENDPOINTS } from '@/config/routes';
import BackupManager from '@/components/BackupManager';
import CompanyProfileCard from '@/components/admin/CompanyProfileCard';
import AuthCheck from '@/components/AuthCheck';

interface EndpointStatus {
  name: string;
  url: string;
  status: 'loading' | 'success' | 'error';
  data?: any;
  error?: string;
  description: string;
  icon: string;
}

function AdminDashboard() {
  const [endpoints, setEndpoints] = useState<EndpointStatus[]>([
    {
      name: 'Health Check',
      url: API_ENDPOINTS.HEALTH,
      status: 'loading',
      description: 'Verifica se a aplicação está funcionando',
      icon: '❤️'
    },
    {
      name: 'Produtos (Principal)',
      url: API_ENDPOINTS.PRODUCTS,
      status: 'loading', 
      description: 'Endpoint principal com paginação completa (100+ produtos)',
      icon: '🛍️'
    },
    {
      name: 'Debug Info',
      url: API_ENDPOINTS.DEBUG,
      status: 'loading',
      description: 'Informações técnicas e debugging',
      icon: '🔍'
    },
    {
      name: 'Cache Debug',
      url: API_ENDPOINTS.CACHE_DEBUG,
      status: 'loading',
      description: 'Estado do cache Redis e chaves armazenadas',
      icon: '💾'
    }
  ]);

  const testEndpoint = async (endpoint: EndpointStatus) => {
    try {
      setEndpoints(prev => prev.map(ep => 
        ep.url === endpoint.url ? { ...ep, status: 'loading' } : ep
      ));

      const response = await fetch(`https://peepers.vercel.app${endpoint.url}`);
      const data = await response.json();

      setEndpoints(prev => prev.map(ep => 
        ep.url === endpoint.url ? { 
          ...ep, 
          status: response.ok ? 'success' : 'error',
          data: data,
          error: response.ok ? undefined : `${response.status}: ${data.message || 'Erro desconhecido'}`
        } : ep
      ));
    } catch (error) {
      setEndpoints(prev => prev.map(ep => 
        ep.url === endpoint.url ? { 
          ...ep, 
          status: 'error',
          error: `Erro de rede: ${error instanceof Error ? error.message : 'Desconhecido'}`
        } : ep
      ));
    }
  };

  const testAllEndpoints = async () => {
    for (const endpoint of endpoints) {
      await testEndpoint(endpoint);
      // Pequeno delay para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  useEffect(() => {
    testAllEndpoints();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'loading': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'success': return 'bg-green-100 border-green-300 text-green-800';
      case 'error': return 'bg-red-100 border-red-300 text-red-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'loading': return '⏳';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '⚪';
    }
  };

  const formatData = (data: any): string => {
    if (!data) return '';
    
    if (data.products && Array.isArray(data.products)) {
      const activeProducts = data.products.filter((p: any) => p.status === 'active').length;
      const pausedProducts = data.products.filter((p: any) => p.status === 'paused').length;
      return `${data.products.length} produtos total (${activeProducts} ativos, ${pausedProducts} pausados)`;
    }
    
    if (data.message) {
      return data.message;
    }
    
    if (data.total_products) {
      return `${data.total_products} produtos encontrados`;
    }
    
    return JSON.stringify(data).substring(0, 100) + '...';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-gray-900">Peepers Admin</h1>
              <div className="hidden md:flex space-x-6">
                <button className="text-blue-600 border-b-2 border-blue-600 pb-1 font-medium">
                  Dashboard
                </button>
                <button className="text-gray-500 hover:text-gray-700 font-medium">
                  Sincronizar Produtos
                </button>
                <button className="text-gray-500 hover:text-gray-700 font-medium">
                  Gerenciar Backup
                </button>
                <button className="text-gray-500 hover:text-gray-700 font-medium">
                  Perfil da Loja
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Produção</span>
              <button
                onClick={async () => {
                  await fetch('/api/auth/logout', { method: 'POST' });
                  window.location.href = '/';
                }}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            🔧 Dashboard Administrativo
          </h2>
          <p className="text-gray-600 mb-4">
            Monitoramento completo dos endpoints da API • Produção: https://peepers.vercel.app/
          </p>
          <button
            onClick={testAllEndpoints}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            🔄 Testar Todos os Endpoints
          </button>
        </div>

        {/* Company Profile Card */}
        <div className="mb-8">
          <CompanyProfileCard />
        </div>

        {/* Endpoints Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {endpoints.map((endpoint) => (
            <div key={endpoint.url} className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <span className="text-2xl mr-2">{endpoint.icon}</span>
                  {endpoint.name}
                </h3>
                <span className="text-xl">{getStatusIcon(endpoint.status)}</span>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">{endpoint.description}</p>
              
              <div className={`p-3 rounded-lg border mb-4 ${getStatusColor(endpoint.status)}`}>
                <div className="font-mono text-xs mb-2">
                  {endpoint.url}
                </div>
                {endpoint.status === 'loading' && (
                  <div className="text-sm">Testando endpoint...</div>
                )}
                {endpoint.status === 'success' && endpoint.data && (
                  <div className="text-sm">
                    <strong>✅ Funcionando:</strong>
                    <div className="mt-1">{formatData(endpoint.data)}</div>
                  </div>
                )}
                {endpoint.status === 'error' && (
                  <div className="text-sm">
                    <strong>❌ Erro:</strong>
                    <div className="mt-1">{endpoint.error}</div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => testEndpoint(endpoint)}
                  className="flex-1 bg-gray-600 text-white py-2 px-3 rounded text-sm hover:bg-gray-700 transition-colors"
                >
                  🧪 Testar
                </button>
                <a
                  href={`https://peepers.vercel.app${endpoint.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700 transition-colors text-center"
                >
                  🔗 Abrir
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            📊 Resumo do Sistema
          </h2>
          
          <div className="grid gap-6 md:grid-cols-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2 flex items-center">
                <span className="text-lg mr-2">✅</span>
                Funcionando
              </h3>
              <div className="text-green-800 text-sm space-y-1">
                {endpoints.filter(ep => ep.status === 'success').map(ep => (
                  <div key={ep.url}>• {ep.name}</div>
                ))}
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-900 mb-2 flex items-center">
                <span className="text-lg mr-2">❌</span>
                Com Problemas
              </h3>
              <div className="text-red-800 text-sm space-y-1">
                {endpoints.filter(ep => ep.status === 'error').map(ep => (
                  <div key={ep.url}>• {ep.name}</div>
                ))}
                {endpoints.filter(ep => ep.status === 'error').length === 0 && (
                  <div>Nenhum problema detectado!</div>
                )}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
                <span className="text-lg mr-2">ℹ️</span>
                Informações
              </h3>
              <div className="text-blue-800 text-sm space-y-1">
                <div>• Ambiente: Produção</div>
                <div>• URL: peepers.vercel.app</div>
                <div>• Cache: Redis (Upstash)</div>
                <div>• User ID: 669073070</div>
                <div>• Loja: PEEPERS SHOP</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-6">⚡ Ações Rápidas</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <a 
              href={PAGES.PRODUTOS} 
              className="flex items-center justify-center bg-teal-600 text-white py-3 px-4 rounded-lg hover:bg-teal-700 transition-colors font-medium"
            >
              <span className="mr-2">🛍️</span>
              Ver Loja
            </a>
            <Link 
              href="/" 
              className="flex items-center justify-center bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <span className="mr-2">🏠</span>
              Homepage
            </Link>
            <a 
              href={API_ENDPOINTS.AUTH_ML} 
              className="flex items-center justify-center bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <span className="mr-2">🔐</span>
              Autenticar Mercado Livre
            </a>
            <a 
              href={API_ENDPOINTS.SYNC} 
              className="flex items-center justify-center bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <span className="mr-2">🔄</span>
              Sincronizar Produtos
            </a>
            <a 
              href="https://github.com/antoniovbraz/peepers"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center bg-gray-800 text-white py-3 px-4 rounded-lg hover:bg-gray-900 transition-colors font-medium"
            >
              <span className="mr-2">�</span>
              GitHub
            </a>
          </div>
        </div>

        {/* Backup Manager */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <BackupManager />
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <AuthCheck>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-4">⏳</div>
            <div className="text-lg">Carregando Dashboard...</div>
          </div>
        </div>
      }>
        <AdminDashboard />
      </Suspense>
    </AuthCheck>
  );
}