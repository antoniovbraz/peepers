'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Hook para limpar query parameters de autenticação da URL
 * Remove ?auth_success=true&user_id=X após login bem-sucedido
 */
export function useCleanAuthUrl() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Verifica se há parâmetros de autenticação na URL
    const authSuccess = searchParams.get('auth_success');
    const userId = searchParams.get('user_id');

    if (authSuccess === 'true' && userId) {
      // Remove os query parameters mantendo a rota base
      const currentPath = window.location.pathname;
      
      // Aguarda um pequeno delay para garantir que a autenticação foi processada
      setTimeout(() => {
        router.replace(currentPath, { scroll: false });
      }, 1000);
    }
  }, [router, searchParams]);
}

export default useCleanAuthUrl;