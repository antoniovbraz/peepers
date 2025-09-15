'use client';

import { useEffect } from 'react';

export default function ServiceWorkerProvider() {
  useEffect(() => {
    // Só registrar SW após hydration completa e em browsers compatíveis
    if (
      typeof window !== 'undefined' && 
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      const registerSW = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
            updateViaCache: 'none'
          });

          console.log('[SW] Registered successfully:', registration.scope);

          // Update encontrado
          registration.addEventListener('updatefound', () => {
            console.log('[SW] Update found');
          });

          // SW ativo
          if (registration.active) {
            console.log('[SW] SW is active');
          }

        } catch (error) {
          console.error('[SW] Registration failed:', error);
        }
      };

      // Delay para não bloquear hydration
      setTimeout(registerSW, 1000);
    }
  }, []);

  return null; // Componente não renderiza nada
}