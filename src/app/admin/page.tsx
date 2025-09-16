'use client';

import { Suspense, useState, useEffect, useCallback, lazy } from 'react';
import Link from 'next/link';
import { PAGES, API_ENDPOINTS } from '@/config/routes';
import AuthCheck from '@/components/AuthCheck';

// Lazy load heavy admin components
const BackupManager = lazy(() => import('@/components/BackupManager'));
const CompanyProfileCard = lazy(() => import('@/components/admin/CompanyProfileCard'));
const AuthStatusCard = lazy(() => import('@/components/admin/AuthStatusCard'));

interface EndpointStatus {
  name: string;
  url: string;
  status: 'loading' | 'success' | 'error';
  data?: Record<string, unknown>;
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

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isTestingAll, setIsTestingAll] = useState(false);
  const [urlProcessed, setUrlProcessed] = useState(false);
  const [authSuccessMessage, setAuthSuccessMessage] = useState<string | null>(null);

  // Processar parâmetros da URL apenas uma vez
  useEffect(() => {
    if (urlProcessed) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const authSuccess = urlParams.get('auth_success');
    const userId = urlParams.get('user_id');
    const authError = urlParams.get('auth_error');
    
    if (authSuccess === 'true' && userId) {
      console.log('✅ Autenticação bem-sucedida detectada, limpando URL...');
      setAuthSuccessMessage(`✅ Autenticação realizada com sucesso! Usuário ID: ${userId}`);
      // Limpar parâmetros da URL sem recarregar a página
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      setUrlProcessed(true);
      
      // Esconder mensagem após 5 segundos
      setTimeout(() => setAuthSuccessMessage(null), 5000);
    } else if (authError) {
      console.error('❌ Erro de autenticação detectado:', authError);
      setAuthSuccessMessage(`❌ Erro na autenticação: ${authError}`);
      // Limpar parâmetros da URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      setUrlProcessed(true);
      
      // Esconder mensagem após 5 segundos
      setTimeout(() => setAuthSuccessMessage(null), 5000);
    }
  }, [urlProcessed]);

  const testEndpoint = async (endpoint: EndpointStatus) => {
    // Prevenir testes simultâneos do mesmo endpoint
    if (endpoint.status === 'loading') return;
    
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

  const testAllEndpoints = useCallback(async () => {
    // Prevenir múltiplas execuções simultâneas
    if (isTestingAll) {
      console.log('⏳ Teste já em andamento, ignorando...');
      return;
    }
    
    console.log('🚀 Iniciando teste de todos os endpoints...');
    setIsTestingAll(true);
    
    try {
      const endpointsCopy = [...endpoints]; // Copiar para evitar mudanças durante iteração
      
      for (let i = 0; i < endpointsCopy.length; i++) {
        const endpoint = endpointsCopy[i];
        console.log(`📡 Testando endpoint ${i + 1}/${endpointsCopy.length}: ${endpoint.name}`);
        
        await testEndpoint(endpoint);
        
        // Pequeno delay para não sobrecarregar
        if (i < endpointsCopy.length - 1) { // Não fazer delay no último
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      console.log('✅ Todos os endpoints testados com sucesso!');
    } catch (error) {
      console.error('❌ Erro durante teste de endpoints:', error);
    } finally {
      setIsTestingAll(false);
    }
  }, [endpoints, isTestingAll]);

  // Executar teste inicial apenas uma vez após processamento da URL
  useEffect(() => {
    if (!urlProcessed) return; // Aguardar processamento da URL
    
    // Prevenir execução se já estiver testando
    if (isTestingAll) return;
    
    console.log('⏰ Agendando teste inicial dos endpoints...');
    const timer = setTimeout(() => {
      // Verificação adicional antes de executar
      if (!isTestingAll && urlProcessed) {
        testAllEndpoints();
      }
    }, 1500); // Delay maior para permitir carregamento completo
    
    return () => clearTimeout(timer);
  }, [urlProcessed, isTestingAll, testAllEndpoints]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Alt + T: Test all endpoints
      if (e.altKey && e.key === 't') {
        e.preventDefault();
        if (!isTestingAll) {
          testAllEndpoints();
        }
      }

      // Alt + 1-4: Switch tabs
      if (e.altKey && ['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault();
        const tabs = ['dashboard', 'endpoints', 'backup', 'settings'];
        setActiveTab(tabs[parseInt(e.key) - 1]);
      }

      // Alt + R: Reload page
      if (e.altKey && e.key === 'r') {
        e.preventDefault();
        window.location.reload();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isTestingAll, testAllEndpoints]); // Incluir dependências necessárias

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'loading': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'success': return 'bg-green-50 border-green-200 text-green-800';
      case 'error': return 'bg-red-50 border-red-200 text-red-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
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

  const formatData = (data: Record<string, unknown>, endpointName: string): React.ReactElement => {
    if (!data || typeof data !== 'object') return <span className="text-gray-500">Sem dados</span>;
    
    // Para produtos
    if (endpointName.includes('Produtos') && data.products && Array.isArray(data.products)) {
      const activeProducts = (data.products as { status?: string }[]).filter((p) => p.status === 'active').length;
      const pausedProducts = (data.products as { status?: string }[]).filter((p) => p.status === 'paused').length;
      const totalProducts = (data.products as unknown[]).length;
      
      return (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-medium text-green-600">📦 {totalProducts} produtos</span>
            <span className="text-sm text-gray-500">Total</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-600">✅ Ativos:</span>
              <span className="font-medium">{activeProducts}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-orange-600">⏸️ Pausados:</span>
              <span className="font-medium">{pausedProducts}</span>
            </div>
          </div>
        </div>
      );
    }
    
    // Para health check
    if (endpointName.includes('Health') && data.status) {
      return (
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className={`text-lg ${data.status === 'ok' ? 'text-green-500' : 'text-red-500'}`}>
              {data.status === 'ok' ? '💚' : '💔'}
            </span>
            <span className="font-medium capitalize">{String(data.status)}</span>
          </div>
          {data.timestamp ? (
            <div className="text-xs text-gray-500">
              Última verificação: {new Date(String(data.timestamp)).toLocaleString('pt-BR')}
            </div>
          ) : null}
        </div>
      );
    }
    
    // Para cache debug
    if (endpointName.includes('Cache') && data.cache_status) {
      return (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className={`text-lg ${data.cache_status === 'connected' ? 'text-green-500' : 'text-red-500'}`}>
              {data.cache_status === 'connected' ? '🔗' : '❌'}
            </span>
            <span className="font-medium capitalize">{String(data.cache_status)}</span>
          </div>
          {data.keys_count !== undefined ? (
            <div className="text-sm">
              <span className="text-gray-600">Chaves no cache:</span>
              <span className="font-medium ml-1">{String(data.keys_count)}</span>
            </div>
          ) : null}
        </div>
      );
    }
    
    // Para debug info
    if (endpointName.includes('Debug') && data.environment) {
      return (
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Ambiente:</span>
            <span className="font-medium">{String(data.environment)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Versão:</span>
            <span className="font-medium">{String(data.version || 'N/A')}</span>
          </div>
        </div>
      );
    }
    
    // Fallback para outros tipos de dados
    if (data.message) {
      return <span className="text-gray-700">{String(data.message)}</span>;
    }
    
    if (data.total_products) {
      return <span className="text-gray-700">{String(data.total_products)} produtos encontrados</span>;
    }
    
    return <span className="text-gray-500 text-sm">Dados complexos - verifique o endpoint diretamente</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notification Banner */}
      {authSuccessMessage && (
        <div className={`fixed top-0 left-0 right-0 z-50 p-4 ${
          authSuccessMessage.includes('✅') 
            ? 'bg-green-600 text-white' 
            : 'bg-red-600 text-white'
        }`}>
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-lg">ℹ️</span>
              <span className="font-medium">{authSuccessMessage}</span>
            </div>
            <button
              onClick={() => setAuthSuccessMessage(null)}
              className="text-white hover:text-gray-200 text-xl font-bold"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Navigation Bar */}
      <nav className={`bg-white border-b border-gray-100 ${authSuccessMessage ? 'mt-16' : ''}`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center space-x-4 sm:space-x-8">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">Peepers Admin</h1>
              <div className="hidden md:flex space-x-6">
                <button 
                  onClick={() => setActiveTab('dashboard')}
                  className={`font-medium text-sm transition-colors ${
                    activeTab === 'dashboard' 
                      ? 'text-blue-600 border-b-2 border-blue-600 pb-1' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Dashboard
                </button>
                <button 
                  onClick={() => setActiveTab('endpoints')}
                  className={`font-medium text-sm transition-colors ${
                    activeTab === 'endpoints' 
                      ? 'text-blue-600 border-b-2 border-blue-600 pb-1' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Endpoints
                </button>
                <button 
                  onClick={() => setActiveTab('backup')}
                  className={`font-medium text-sm transition-colors ${
                    activeTab === 'backup' 
                      ? 'text-blue-600 border-b-2 border-blue-600 pb-1' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Backup
                </button>
                <button 
                  onClick={() => setActiveTab('settings')}
                  className={`font-medium text-sm transition-colors ${
                    activeTab === 'settings' 
                      ? 'text-blue-600 border-b-2 border-blue-600 pb-1' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Config
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="text-xs sm:text-sm text-gray-600 hidden sm:block">Produção</span>
              <button
                onClick={async () => {
                  await fetch('/api/auth/logout', { method: 'POST' });
                  window.location.href = '/';
                }}
                className="bg-red-600 text-white px-2 py-1 sm:px-4 sm:py-2 rounded-lg hover:bg-red-700 transition-colors text-xs sm:text-sm font-medium"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            🔧 Dashboard Administrativo
          </h2>
          <p className="text-gray-600 mb-4 text-sm sm:text-base">
            Monitoramento completo dos endpoints da API • Produção: https://peepers.vercel.app/
          </p>
          <button
            onClick={testAllEndpoints}
            disabled={isTestingAll}
            className={`py-2 rounded-lg font-medium text-sm sm:text-base w-full sm:w-auto px-4 sm:px-6 transition-colors ${
              isTestingAll 
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isTestingAll ? '⏳ Testando...' : '🔄 Testar Todos os Endpoints'}
          </button>
        </div>

        {/* Authentication Status */}
        <Suspense fallback={<div className="card-peepers p-4 animate-pulse"><div className="h-32 bg-gray-200 rounded"></div></div>}>
          <AuthStatusCard />
        </Suspense>

        {/* Company Profile Card */}
        <div className="mb-6 sm:mb-8">
          <Suspense fallback={<div className="card-peepers p-4 animate-pulse"><div className="h-48 bg-gray-200 rounded"></div></div>}>
            <CompanyProfileCard />
          </Suspense>
        </div>

        {/* Endpoints Grid */}
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {endpoints.map((endpoint) => (
            <div key={endpoint.url} className="card-peepers p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
                  <span className="text-xl sm:text-2xl mr-2">{endpoint.icon}</span>
                  <span className="hidden sm:inline">{endpoint.name}</span>
                  <span className="sm:hidden">{endpoint.name.split(' ')[0]}</span>
                </h3>
                <span className="text-lg sm:text-xl">{getStatusIcon(endpoint.status)}</span>
              </div>
              
              <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">{endpoint.description}</p>
              
              <div className={`p-2 sm:p-3 rounded-lg border mb-3 sm:mb-4 ${getStatusColor(endpoint.status)}`}>
                <div className="font-mono text-xs mb-1 sm:mb-2 break-all">
                  {endpoint.url}
                </div>
                {endpoint.status === 'loading' && (
                  <div className="text-xs sm:text-sm">Testando endpoint...</div>
                )}
                {endpoint.status === 'success' && endpoint.data && (
                  <div className="text-xs sm:text-sm">
                    <strong>✅ Funcionando:</strong>
                    <div className="mt-1">{formatData(endpoint.data, endpoint.name)}</div>
                  </div>
                )}
                {endpoint.status === 'error' && (
                  <div className="text-xs sm:text-sm">
                    <strong>❌ Erro:</strong>
                    <div className="mt-1 break-words">{endpoint.error}</div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => testEndpoint(endpoint)}
                  className="flex-1 bg-gray-600 text-white py-1.5 sm:py-2 px-2 sm:px-3 rounded text-xs sm:text-sm hover:bg-gray-700 transition-colors"
                >
                  🧪 Testar
                </button>
                <a
                  href={`https://peepers.vercel.app${endpoint.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-blue-600 text-white py-1.5 sm:py-2 px-2 sm:px-3 rounded text-xs sm:text-sm hover:bg-blue-700 transition-colors text-center"
                >
                  🔗 Abrir
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Section */}
        <div className="card-peepers p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 flex items-center">
            📊 Resumo do Sistema
          </h2>
          
          <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
              <h3 className="font-semibold text-green-900 mb-2 flex items-center text-sm sm:text-base">
                <span className="text-lg mr-2">✅</span>
                Funcionando
              </h3>
              <div className="text-green-800 text-xs sm:text-sm space-y-1">
                {endpoints.filter(ep => ep.status === 'success').map(ep => (
                  <div key={ep.url}>• {ep.name}</div>
                ))}
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
              <h3 className="font-semibold text-red-900 mb-2 flex items-center text-sm sm:text-base">
                <span className="text-lg mr-2">❌</span>
                Com Problemas
              </h3>
              <div className="text-red-800 text-xs sm:text-sm space-y-1">
                {endpoints.filter(ep => ep.status === 'error').map(ep => (
                  <div key={ep.url}>• {ep.name}</div>
                ))}
                {endpoints.filter(ep => ep.status === 'error').length === 0 && (
                  <div>Nenhum problema detectado!</div>
                )}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center text-sm sm:text-base">
                <span className="text-lg mr-2">ℹ️</span>
                Informações
              </h3>
              <div className="text-blue-800 text-xs sm:text-sm space-y-1">
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
        <div className="card-peepers p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">⚡ Ações Rápidas</h2>
          <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
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
        <div className="card-peepers p-4 sm:p-6">
          <Suspense fallback={<div className="h-64 bg-gray-200 animate-pulse rounded"></div>}>
            <BackupManager />
          </Suspense>
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