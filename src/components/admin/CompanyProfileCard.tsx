'use client';

import { useCompany } from '@/hooks/useCompany';

export default function CompanyProfileCard() {
  const {
    company,
    session,
    loading,
    error,
    logout,
    getSellerLevelColor,
    getPowerSellerBadge
  } = useCompany();

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
        <div className="animate-pulse">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
            <div className="flex-1">
              <div className="h-6 bg-gray-300 rounded mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-2/3"></div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-300 rounded"></div>
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-red-500">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Erro ao Carregar Perfil
          </h3>
          <p className="text-gray-600 mb-4">
            {error || 'Não foi possível carregar as informações da empresa.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border-l-4 border-green-500">
      {/* Header com Logo e Status */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
              <span className="text-2xl">🏪</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold">{company.company.brand_name}</h2>
              <p className="text-green-100">@{company.nickname}</p>
            </div>
          </div>
          <div className="text-right">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getSellerLevelColor(company.seller_reputation.level_id)}`}>
              {getPowerSellerBadge(company.seller_reputation.power_seller_status)}
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="p-6">
        {/* Informações da Empresa */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <span className="text-xl mr-2">🏢</span>
              Informações da Empresa
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Razão Social:</span>
                <span className="font-medium">{company.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">CNPJ:</span>
                <span className="font-medium">{company.company.company_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Localização:</span>
                <span className="font-medium">{company.company.city}, {company.company.state}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">País:</span>
                <span className="font-medium">🇧🇷 {company.country}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <span className="text-xl mr-2">📊</span>
              Estatísticas de Vendas
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total de Vendas:</span>
                <span className="font-medium text-green-600">{company.seller_reputation.transactions.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Vendas Concluídas:</span>
                <span className="font-medium text-blue-600">{company.seller_reputation.transactions.completed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Cancelamentos:</span>
                <span className="font-medium text-red-600">{company.seller_reputation.transactions.canceled}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Taxa de Sucesso:</span>
                <span className="font-medium">
                  {((company.seller_reputation.transactions.completed / company.seller_reputation.transactions.total) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Status da Conta */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <span className="text-xl mr-2">🔐</span>
            Status da Conta
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                company.status.site_status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {company.status.site_status === 'active' ? '✅ Ativa' : '❌ Inativa'}
              </div>
              <p className="text-xs text-gray-600 mt-1">Status da Conta</p>
            </div>
            <div className="text-center">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                company.status.list.allow
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {company.status.list.allow ? '✅ Permitido' : '❌ Bloqueado'}
              </div>
              <p className="text-xs text-gray-600 mt-1">Listagem de Produtos</p>
            </div>
            <div className="text-center">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                company.status.list.immediate_payment.required
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {company.status.list.immediate_payment.required ? '💳 Obrigatório' : '💰 Opcional'}
              </div>
              <p className="text-xs text-gray-600 mt-1">Pagamento Imediato</p>
            </div>
          </div>
        </div>

        {/* Sessão e Logout */}
        {session && (
          <div className="border-t pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-900">Sessão Ativa</h4>
                <p className="text-sm text-gray-600">
                  Expira em: {new Date(session.expires_at).toLocaleString('pt-BR')}
                </p>
                <p className="text-sm text-gray-600">
                  Última sincronização: {new Date(session.last_sync).toLocaleString('pt-BR')}
                </p>
              </div>
              <button
                onClick={logout}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center"
              >
                <span className="mr-2">🚪</span>
                Sair
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}