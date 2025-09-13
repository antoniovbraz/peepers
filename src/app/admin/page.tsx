import { Suspense } from 'react';

function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Peepers Admin Dashboard
        </h1>
        
        <div className="grid gap-6 md:grid-cols-2">
          {/* Authentication Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              Status da Autenticação ML
            </h2>
            <div className="space-y-3">
              <a 
                href="/api/debug" 
                target="_blank"
                className="block w-full text-center bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
              >
                🔍 Verificar Status
              </a>
              <a 
                href="/api/ml/auth" 
                className="block w-full text-center bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors"
              >
                🔐 Fazer Login ML
              </a>
            </div>
          </div>

          {/* Sync Controls */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              Controles de Sincronização
            </h2>
            <div className="space-y-3">
              <a 
                href="/api/ml/sync" 
                target="_blank"
                className="block w-full text-center bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 transition-colors"
              >
                🔄 Sincronizar Produtos
              </a>
              <a 
                href="/api/force-sync" 
                target="_blank"
                className="block w-full text-center bg-orange-600 text-white py-2 px-4 rounded hover:bg-orange-700 transition-colors"
              >
                ⚡ Sincronização Forçada
              </a>
            </div>
          </div>

          {/* Diagnostics */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              Diagnósticos
            </h2>
            <div className="space-y-3">
              <a 
                href="/api/ml/test-permissions" 
                target="_blank"
                className="block w-full text-center bg-yellow-600 text-white py-2 px-4 rounded hover:bg-yellow-700 transition-colors"
              >
                🧪 Testar Permissões
              </a>
              <a 
                href="/api/health" 
                target="_blank"
                className="block w-full text-center bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition-colors"
              >
                ❤️ Health Check
              </a>
            </div>
          </div>

          {/* Products */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              Produtos
            </h2>
            <div className="space-y-3">
              <a 
                href="/api/products" 
                target="_blank"
                className="block w-full text-center bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition-colors"
              >
                📦 Ver Produtos API
              </a>
              <a 
                href="/produtos" 
                className="block w-full text-center bg-teal-600 text-white py-2 px-4 rounded hover:bg-teal-700 transition-colors"
              >
                🛍️ Página de Produtos
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            🎉 Status: Integração Funcionando!
          </h2>
          <div className="bg-green-50 border border-green-200 rounded p-4">
            <p className="text-green-800">
              ✅ <strong>Problema resolvido:</strong> A Vercel Deployment Protection foi desabilitada<br/>
              ✅ <strong>Endpoints funcionando:</strong> Todos os endpoints da API estão acessíveis<br/>
              🔄 <strong>Próximo passo:</strong> Refazer a autenticação OAuth com o Mercado Livre
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <AdminDashboard />
    </Suspense>
  );
}