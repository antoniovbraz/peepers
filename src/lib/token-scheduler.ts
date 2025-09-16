import { logger } from '@/lib/logger';

// Função para verificar e renovar tokens automaticamente
export async function checkTokensAndRefresh() {
  try {
    logger.info('Starting automatic token refresh check...');
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/refresh-token`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const result = await response.json();
      logger.info(result, 'Token refresh check completed');
      return result;
    } else {
      logger.error('Failed to check tokens');
      return null;
    }
  } catch (error) {
    logger.error({ error }, 'Error in automatic token refresh');
    return null;
  }
}

// Agendar verificação de tokens a cada 30 minutos
if (typeof window === 'undefined') { // Só executar no servidor
  const THIRTY_MINUTES = 30 * 60 * 1000;
  
  // Verificar tokens imediatamente ao iniciar
  setTimeout(() => {
    checkTokensAndRefresh();
  }, 5000); // 5 segundos após inicialização

  // Depois verificar a cada 30 minutos
  setInterval(() => {
    checkTokensAndRefresh();
  }, THIRTY_MINUTES);
  
  logger.info('Token auto-refresh scheduler initialized');
}