'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { PAGES, API_ENDPOINTS } from '@/config/routes';

interface AuthCheckProps {
  children: React.ReactNode;
}

function AuthCheck({ children }: AuthCheckProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    checkAuthentication();
    
    // Verifica autenticação a cada 5 minutos para manter sessão ativa
    intervalRef.current = setInterval(() => {
      checkAuthentication(false); // false = não mostrar loading
    }, 5 * 60 * 1000); // 5 minutos

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const checkAuthentication = async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      }
      
      const response = await fetch('/api/auth/me', {
        cache: 'no-store', // Sempre buscar dados frescos
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated) {
          setIsAuthenticated(true);
          
          // Verificar se token precisa ser renovado (menos de 1 hora)
          if (data.token?.needs_refresh) {
            try {
              const refreshResponse = await fetch('/api/auth/refresh', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                }
              });
              
              if (refreshResponse.ok) {
                console.log('Token refreshed automatically');
              }
            } catch (refreshError) {
              console.warn('Token refresh failed:', refreshError);
            }
          }
        } else {
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      setIsAuthenticated(false);
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-6">
            <svg className="mx-auto h-16 w-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h2>
          <p className="text-gray-600 mb-6">
            Você precisa estar autenticado para acessar o painel administrativo.
          </p>
          <div className="space-y-3">
            <a
              href={API_ENDPOINTS.AUTH_ML}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors inline-block"
            >
              Fazer Login com Mercado Livre
            </a>
            <br />
            <Link
              href={PAGES.HOME}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              ← Voltar para a página inicial
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default AuthCheck;