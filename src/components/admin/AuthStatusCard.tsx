import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '@/config/routes';

interface AuthStatus {
  authenticated: boolean;
  authorized: boolean;
  user?: {
    id: string;
    nickname: string;
    email: string;
  };
  token?: {
    expires_at: string;
    hours_until_expiry: number;
    needs_refresh: boolean;
  };
  session?: {
    session_token: string;
    user_id: string;
  };
}

interface TokenRefreshResponse {
  success: boolean;
  message: string;
  refresh_status?: {
    user_id: string;
    status: string;
    new_expires_at?: string;
  }[];
}

export default function AuthStatusCard() {
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      setAuthStatus(data);
    } catch (error) {
      console.error('Error checking auth status:', error);
      setAuthStatus(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshToken = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/auth/refresh-token', { method: 'POST' });
      const data: TokenRefreshResponse = await response.json();
      
      if (data.success) {
        setLastRefresh(new Date().toLocaleTimeString('pt-BR'));
        // Recheck auth status after refresh
        await checkAuthStatus();
      }
      
      return data;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return { success: false, message: 'Erro ao renovar token' };
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
    // Check auth status every 30 seconds
    const interval = setInterval(checkAuthStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="card-peepers p-4 sm:p-6 mb-6 sm:mb-8">
        <div className="flex items-center space-x-2">
          <span className="text-lg">⏳</span>
          <span className="text-sm text-gray-600">Verificando status de autenticação...</span>
        </div>
      </div>
    );
  }

  if (!authStatus?.authenticated) {
    return (
      <div className="card-peepers p-4 sm:p-6 mb-6 sm:mb-8 border-l-4 border-red-500">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-red-900 flex items-center">
              <span className="text-xl mr-2">🔐</span>
              Não Autenticado
            </h3>
            <p className="text-sm text-red-700 mt-1">
              É necessário fazer login no Mercado Livre para acessar o admin.
            </p>
          </div>
          <a
            href={API_ENDPOINTS.AUTH_ML}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            🔑 Fazer Login
          </a>
        </div>
      </div>
    );
  }

  const { user, token } = authStatus;
  const isTokenExpiringSoon = token?.needs_refresh || false;
  const hoursLeft = token?.hours_until_expiry || 0;

  return (
    <div className={`card-peepers p-4 sm:p-6 mb-6 sm:mb-8 border-l-4 ${
      isTokenExpiringSoon ? 'border-orange-500' : 'border-green-500'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <span className="text-xl mr-2">{isTokenExpiringSoon ? '⚠️' : '✅'}</span>
          Status de Autenticação
        </h3>
        <button
          onClick={checkAuthStatus}
          className="text-sm text-gray-500 hover:text-gray-700"
          title="Atualizar status"
        >
          🔄
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* User Info */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-800">👤 Usuário</h4>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">ID:</span>
              <span className="font-mono text-xs">{user?.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Nome:</span>
              <span>{user?.nickname}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="text-xs">{user?.email}</span>
            </div>
          </div>
        </div>

        {/* Token Info */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-800">🔑 Token ML</h4>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Expira em:</span>
              <span className={`font-medium ${hoursLeft < 1 ? 'text-red-600' : hoursLeft < 2 ? 'text-orange-600' : 'text-green-600'}`}>
                {hoursLeft.toFixed(1)}h
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className={`font-medium ${isTokenExpiringSoon ? 'text-orange-600' : 'text-green-600'}`}>
                {isTokenExpiringSoon ? 'Precisa renovar' : 'Válido'}
              </span>
            </div>
            {lastRefresh && (
              <div className="flex justify-between">
                <span className="text-gray-600">Último refresh:</span>
                <span className="text-xs">{lastRefresh}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
        <button
          onClick={refreshToken}
          disabled={isRefreshing}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            isRefreshing 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isRefreshing ? '🔄 Renovando...' : '🔄 Renovar Token'}
        </button>
        
        <a
          href={API_ENDPOINTS.AUTH_ML}
          className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium text-center"
        >
          🔑 Re-autenticar
        </a>
      </div>

      {/* Auto-refresh indicator */}
      {isTokenExpiringSoon && (
        <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center text-sm text-orange-800">
            <span className="mr-2">⚡</span>
            <span>Token será renovado automaticamente quando necessário.</span>
          </div>
        </div>
      )}
    </div>
  );
}