/**
 * Tenant Context - Peepers Enterprise v2.0.0
 *
 * Contexto React para gerenciamento de estado multi-tenant
 */

'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { PeepersTenant, PeepersUser, TenantContext as TenantContextType } from '@/types/tenant';

interface TenantProviderProps {
  children: ReactNode;
}

interface TenantState {
  tenant: PeepersTenant | null;
  user: PeepersUser | null;
  context: TenantContextType | null;
  isLoading: boolean;
  error: string | null;
}

const TenantContext = createContext<{
  state: TenantState;
  refreshTenant: () => Promise<void>;
  updateUsage: (operation: string, increment?: number) => Promise<void>;
} | null>(null);

export function TenantProvider({ children }: TenantProviderProps) {
  const [state, setState] = useState<TenantState>({
    tenant: null,
    user: null,
    context: null,
    isLoading: true,
    error: null,
  });

  /**
   * Busca dados do tenant do servidor
   */
  const fetchTenantData = async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch('/api/tenant/current', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        if (response.status === 403) {
          throw new Error('Access denied');
        }
        throw new Error('Failed to fetch tenant data');
      }

      const data = await response.json();

      setState({
        tenant: data.tenant,
        user: data.user,
        context: data.context,
        isLoading: false,
        error: null,
      });

    } catch (error) {
      console.error('Error fetching tenant data:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  };

  /**
   * Atualiza o uso do tenant
   */
  const updateUsage = async (operation: string, increment: number = 1): Promise<void> => {
    try {
      const response = await fetch('/api/tenant/usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ operation, increment }),
      });

      if (!response.ok) {
        throw new Error('Failed to update usage');
      }

      // Atualizar estado local
      const updatedData = await response.json();
      setState(prev => ({
        ...prev,
        tenant: updatedData.tenant,
        context: updatedData.context,
      }));

    } catch (error) {
      console.error('Error updating usage:', error);
      // Em caso de erro, tentar refresh dos dados
      await fetchTenantData();
    }
  };

  /**
   * Refresh dos dados do tenant
   */
  const refreshTenant = async (): Promise<void> => {
    await fetchTenantData();
  };

  // Carregar dados na inicialização
  useEffect(() => {
    fetchTenantData();
  }, []);

  const value = {
    state,
    refreshTenant,
    updateUsage,
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

/**
 * Hook para usar o contexto do tenant
 */
export function useTenant(): {
  state: TenantState;
  refreshTenant: () => Promise<void>;
  updateUsage: (operation: string, increment?: number) => Promise<void>;
} {
  const context = useContext(TenantContext);

  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }

  return context;
}

/**
 * Hook para obter apenas o contexto do tenant (dados já processados)
 */
export function useTenantContext(): TenantContextType | null {
  const { state } = useTenant();
  return state.context;
}

/**
 * Hook para verificar permissões
 */
export function usePermissions(): {
  hasPermission: (permission: string) => boolean;
  isOwner: boolean;
  isAdmin: boolean;
  canAccessFeature: (feature: string) => boolean;
} {
  const context = useTenantContext();

  return {
    hasPermission: (permission: string) => {
      return context?.permissions.includes(permission) || false;
    },
    isOwner: context?.isOwner || false,
    isAdmin: context?.isAdmin || false,
    canAccessFeature: (feature: string) => {
      return context?.canAccessFeature(feature) || false;
    },
  };
}

/**
 * Hook para obter dados do tenant
 */
export function useTenantData(): {
  tenant: PeepersTenant | null;
  user: PeepersUser | null;
  isLoading: boolean;
  error: string | null;
} {
  const { state } = useTenant();

  return {
    tenant: state.tenant,
    user: state.user,
    isLoading: state.isLoading,
    error: state.error,
  };
}