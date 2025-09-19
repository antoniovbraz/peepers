/**
 * Página de teste de autenticação - Debug Auth
 */

'use client';

declare global {
  interface Window {
    testAuth?: () => void;
    testProducts?: () => void;
    goToAuth?: () => void;
    clearServiceWorker?: () => void;
  }
}

export default function DebugAuthPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            🔐 Teste de Autenticação Peepers
          </h1>
          
          <div id="status" className="mb-4 p-3 bg-blue-50 rounded">
            Aguardando testes...
          </div>
          
          <div className="space-x-4 mb-6">
            <button 
              onClick={() => window.testAuth?.()}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              1. Testar Autenticação
            </button>
            <button 
              onClick={() => window.testProducts?.()}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              2. Testar Produtos
            </button>
            <button 
              onClick={() => window.goToAuth?.()}
              className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
            >
              3. Fazer Login ML
            </button>
            <button 
              onClick={() => window.clearServiceWorker?.()}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
              4. Limpar SW
            </button>
          </div>
          
          <pre 
            id="results" 
            className="bg-gray-100 p-4 rounded text-sm overflow-auto h-96"
          ></pre>
        </div>
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            const log = (msg) => {
              const results = document.getElementById('results');
              results.textContent += new Date().toLocaleTimeString() + ': ' + msg + '\\n';
              console.log(msg);
            };

            const updateStatus = (msg) => {
              const statusEl = document.getElementById('status');
              statusEl.textContent = msg;
              
              // Color coding
              if (msg.includes('✅')) {
                statusEl.className = 'mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-800';
              } else if (msg.includes('❌')) {
                statusEl.className = 'mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-800';
              } else if (msg.includes('💥')) {
                statusEl.className = 'mb-4 p-3 bg-orange-50 border border-orange-200 rounded text-orange-800';
              } else {
                statusEl.className = 'mb-4 p-3 bg-blue-50 rounded';
              }
            };

            window.testAuth = async function() {
              try {
                updateStatus('🔄 Testando autenticação...');
                const response = await fetch('/api/auth/me', {
                  method: 'GET',
                  credentials: 'include',
                  headers: {
                    'Content-Type': 'application/json'
                  }
                });
                
                const data = await response.json();
                
                if (response.ok) {
                  updateStatus('✅ Autenticado! User: ' + (data.user?.id || 'unknown'));
                  log('✅ Autenticação OK: ' + JSON.stringify(data, null, 2));
                } else {
                  updateStatus('❌ Não autenticado (Status: ' + response.status + ')');
                  log('❌ Auth failed (' + response.status + '): ' + JSON.stringify(data, null, 2));
                }
              } catch (error) {
                updateStatus('💥 Erro de rede: ' + error.message);
                log('💥 Erro na autenticação: ' + error.message);
              }
            };

            window.testProducts = async function() {
              try {
                updateStatus('🔄 Testando produtos...');
                const response = await fetch('/api/products?format=summary&limit=5', {
                  method: 'GET',
                  credentials: 'include',
                  headers: {
                    'Content-Type': 'application/json'
                  }
                });
                
                const data = await response.json();
                
                if (response.ok && data.success) {
                  updateStatus('✅ Produtos carregados! Total: ' + data.data.items.length);
                  log('✅ Produtos OK (' + data.data.items.length + ' items):');
                  data.data.items.forEach((item, i) => {
                    log('  ' + (i+1) + '. ' + item.title + ' - R$ ' + item.price);
                  });
                } else {
                  updateStatus('❌ Falha nos produtos (Status: ' + response.status + ')');
                  log('❌ Products failed (' + response.status + '): ' + JSON.stringify(data, null, 2));
                }
              } catch (error) {
                updateStatus('💥 Erro de rede: ' + error.message);
                log('💥 Erro nos produtos: ' + error.message);
              }
            };

            window.goToAuth = function() {
              window.open('/api/auth/mercado-livre', '_blank');
            };

            window.clearServiceWorker = async function() {
              try {
                if ('serviceWorker' in navigator) {
                  const registrations = await navigator.serviceWorker.getRegistrations();
                  for (let registration of registrations) {
                    await registration.unregister();
                    log('🧹 Service Worker removido: ' + registration.scope);
                  }
                  updateStatus('🧹 Service Workers limpos');
                  // Recarregar página após limpar SW
                  setTimeout(() => {
                    window.location.reload();
                  }, 1000);
                } else {
                  log('ℹ️ Service Worker não suportado neste navegador');
                }
              } catch (error) {
                log('❌ Erro ao limpar SW: ' + error.message);
              }
            };

            // Auto-test ao carregar
            window.addEventListener('load', () => {
              log('🚀 Página carregada, testando autenticação...');
              setTimeout(() => {
                window.testAuth();
              }, 500);
            });
          `
        }}
      />
    </div>
  );
}