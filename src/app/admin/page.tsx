'use client';

import { Suspense } from 'react';

function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Peepers Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Gerencie a integração com o Mercado Livre e monitore produtos
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Authentication Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
              Status da Autenticação
            </h2>
            <div className="space-y-3">
              <div className="text-sm text-gray-600 mb-4">
                <p>🔐 User ID: 669073070</p>
                <p>👤 PEEPERS SHOP</p>
                <p>⭐ Status: Gold Seller</p>
              </div>
              <a 
                href="/api/ml/test" 
                target="_blank"
                className="block w-full text-center bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors text-sm"
              >
                🧪 Verificar Conexão ML
              </a>
              <a 
                href="/api/ml/auth" 
                className="block w-full text-center bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors text-sm"
              >
                🔐 Renovar Autenticação
              </a>
            </div>
          </div>

          {/* Products Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              Produtos ML
            </h2>
            <div className="space-y-3">
              <div className="text-sm text-gray-600 mb-4">
                <p>📦 Total: 10 produtos encontrados</p>
                <p>✅ Ativos: Verificando...</p>
                <p>⏸️ Pausados: Alguns produtos</p>
              </div>
              <a 
                href="/api/ml/products" 
                target="_blank"
                className="block w-full text-center bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors text-sm"
              >
                � Ver Dados Brutos ML
              </a>
              <a 
                href="/api/products" 
                target="_blank"
                className="block w-full text-center bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition-colors text-sm"
              >
                🎯 API Produtos Frontend
              </a>
            </div>
          </div>

          {/* System Health */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <span className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></span>
              Sistema
            </h2>
            <div className="space-y-3">
              <div className="text-sm text-gray-600 mb-4">
                <p>🚀 Deploy: Vercel</p>
                <p>💾 Cache: Redis (Upstash)</p>
                <p>🔄 Status: Online</p>
              </div>
              <a 
                href="/api/health" 
                target="_blank"
                className="block w-full text-center bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition-colors text-sm"
              >
                ❤️ Health Check
              </a>
              <a 
                href="/api/debug" 
                target="_blank"
                className="block w-full text-center bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 transition-colors text-sm"
              >
                🔍 Debug Info
              </a>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6">⚡ Ações Rápidas</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <a 
              href="/produtos" 
              className="flex items-center justify-center bg-teal-600 text-white py-3 px-4 rounded hover:bg-teal-700 transition-colors"
            >
              <span className="mr-2">🛍️</span>
              Ver Loja
            </a>
            <a 
              href="/" 
              className="flex items-center justify-center bg-blue-600 text-white py-3 px-4 rounded hover:bg-blue-700 transition-colors"
            >
              <span className="mr-2">🏠</span>
              Homepage
            </a>
            <button 
              onClick={() => window.location.reload()}
              className="flex items-center justify-center bg-orange-600 text-white py-3 px-4 rounded hover:bg-orange-700 transition-colors"
            >
              <span className="mr-2">🔄</span>
              Reload Dashboard
            </button>
            <a 
              href="https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=6829614190686807"
              target="_blank"
              className="flex items-center justify-center bg-yellow-600 text-white py-3 px-4 rounded hover:bg-yellow-700 transition-colors"
            >
              <span className="mr-2">🔗</span>
              ML Direct
            </a>
          </div>
        </div>

        {/* Current Status */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            📊 Status Atual da Integração
          </h2>
          <div className="bg-blue-50 border border-blue-200 rounded p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">✅ Funcionando:</h3>
                <ul className="text-blue-800 text-sm space-y-1">
                  <li>• OAuth PKCE implementado</li>
                  <li>• Token armazenado corretamente</li>
                  <li>• API ML retornando produtos</li>
                  <li>• User verificado: PEEPERS SHOP</li>
                  <li>• 10 produtos encontrados no ML</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">🔧 Em investigação:</h3>
                <ul className="text-blue-800 text-sm space-y-1">
                  <li>• Sincronização cache ↔ frontend</li>
                  <li>• Filtros de produtos ativos</li>
                  <li>• Página de produtos individuais</li>
                  <li>• Auto-refresh de tokens</li>
                </ul>
              </div>
            </div>
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