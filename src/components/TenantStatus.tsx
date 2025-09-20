/**
 * Tenant Status Component - Peepers Enterprise v2.0.0
 *
 * Componente para exibir status e informações do tenant atual
 */

'use client';

import React from 'react';
import { useTenantData, usePermissions } from '@/contexts/TenantContext';
import { Shield, Users, Package, Zap, Database, AlertTriangle } from 'lucide-react';

export function TenantStatus() {
  const { tenant, user, isLoading, error } = useTenantData();
  const { isOwner, isAdmin } = usePermissions();

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-800">
          <AlertTriangle className="h-4 w-4" />
          <span>Erro ao carregar dados do tenant: {error}</span>
        </div>
      </div>
    );
  }

  if (!tenant || !user) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-yellow-800">
          <AlertTriangle className="h-4 w-4" />
          <span>Dados do tenant não encontrados. Verifique sua autenticação.</span>
        </div>
      </div>
    );
  }

  const usagePercentages = {
    products: Math.round((tenant.usage.products_count / tenant.limits.products) * 100),
    orders: Math.round((tenant.usage.orders_this_month / tenant.limits.orders_per_month) * 100),
    api_calls: Math.round((tenant.usage.api_calls_today / tenant.limits.api_calls_per_hour) * 100),
    storage: Math.round((tenant.usage.storage_used_gb / tenant.limits.storage_gb) * 100),
    team_members: Math.round((tenant.usage.team_members_count / tenant.limits.team_members) * 100),
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'trial': return 'bg-blue-500';
      case 'suspended': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'starter': return 'bg-gray-500';
      case 'business': return 'bg-blue-500';
      case 'enterprise': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Informações Básicas do Tenant */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5" />
          {tenant.name}
        </h3>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded-full text-white text-sm ${getStatusColor(tenant.subscription.status)}`}>
              {tenant.subscription.status === 'active' ? 'Ativo' :
               tenant.subscription.status === 'trial' ? 'Trial' :
               tenant.subscription.status === 'suspended' ? 'Suspenso' :
               tenant.subscription.status === 'cancelled' ? 'Cancelado' : 'Desconhecido'}
            </span>
            <span className={`px-3 py-1 rounded-full text-white text-sm ${getPlanColor(tenant.subscription.plan)}`}>
              {tenant.subscription.plan === 'starter' ? 'Starter' :
               tenant.subscription.plan === 'business' ? 'Professional' :
               tenant.subscription.plan === 'enterprise' ? 'Enterprise' : tenant.subscription.plan}
            </span>
            {isOwner && (
              <span className="px-3 py-1 rounded border border-green-500 text-green-700 text-sm">
                Proprietário
              </span>
            )}
            {isAdmin && !isOwner && (
              <span className="px-3 py-1 rounded border border-blue-500 text-blue-700 text-sm">
                Administrador
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Usuário:</span> {user.first_name} {user.last_name}
            </div>
            <div>
              <span className="font-medium">Email:</span> {user.email}
            </div>
            <div>
              <span className="font-medium">Timezone:</span> {tenant.settings.timezone}
            </div>
            <div>
              <span className="font-medium">Moeda:</span> {tenant.settings.currency}
            </div>
          </div>
        </div>
      </div>

      {/* Uso dos Recursos */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Uso dos Recursos
        </h3>

        <div className="space-y-4">
          {/* Produtos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Produtos
              </div>
              <span>{tenant.usage.products_count} / {tenant.limits.products}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${Math.min(usagePercentages.products, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Pedidos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Pedidos (mês atual)
              </div>
              <span>{tenant.usage.orders_this_month} / {tenant.limits.orders_per_month}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{ width: `${Math.min(usagePercentages.orders, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Chamadas API */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Chamadas API (hoje)
              </div>
              <span>{tenant.usage.api_calls_today} / {tenant.limits.api_calls_per_hour}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-yellow-600 h-2 rounded-full"
                style={{ width: `${Math.min(usagePercentages.api_calls, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Armazenamento */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Armazenamento
              </div>
              <span>{tenant.usage.storage_used_gb}GB / {tenant.limits.storage_gb}GB</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full"
                style={{ width: `${Math.min(usagePercentages.storage, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Membros da Equipe */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Membros da Equipe
              </div>
              <span>{tenant.usage.team_members_count} / {tenant.limits.team_members}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full"
                style={{ width: `${Math.min(usagePercentages.team_members, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Alertas de Limite */}
      {Object.entries(usagePercentages).some(([_, percentage]) => percentage > 80) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertTriangle className="h-4 w-4" />
            <span>Alguns recursos estão próximos do limite. Considere fazer upgrade do plano.</span>
          </div>
        </div>
      )}
    </div>
  );
}