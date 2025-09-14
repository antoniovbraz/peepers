const CACHE_NAME = 'peepers-v1.0.0';
const STATIC_CACHE = 'peepers-static-v1.0.0';
const DYNAMIC_CACHE = 'peepers-dynamic-v1.0.0';

// Recursos críticos para cache imediato
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/globals.css',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Padrões de URLs para cache dinâmico
const CACHE_PATTERNS = [
  /^\/api\/products/,  // Cache de produtos
  /^\/_next\/static/,  // Recursos Next.js
  /^\/_next\/image/    // Imagens otimizadas
];

// Recursos que nunca devem ser cacheados
const NO_CACHE_PATTERNS = [
  /^\/api\/auth/,      // Endpoints de autenticação
  /^\/api\/sync/,      // Sincronização
  /^\/api\/webhook/    // Webhooks
];

self.addEventListener('install', (event) => {
  console.log('[SW] Install event');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );

  // Ativar imediatamente
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  // Tomar controle imediatamente
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Não interceptar requests não-GET
  if (request.method !== 'GET') return;

  // Não cachear recursos que não devem ser cacheados
  if (NO_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    return;
  }

  // Estratégia Cache First para recursos estáticos
  if (STATIC_ASSETS.includes(url.pathname) || url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            return response;
          }

          return fetch(request).then((response) => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(STATIC_CACHE)
              .then((cache) => {
                cache.put(request, responseToCache);
              });

            return response;
          });
        })
    );
    return;
  }

  // Estratégia Network First para APIs
  if (CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (!response || response.status !== 200) {
            throw new Error('Network response was not ok');
          }

          const responseToCache = response.clone();
          caches.open(DYNAMIC_CACHE)
            .then((cache) => {
              cache.put(request, responseToCache);
            });

          return response;
        })
        .catch(() => {
          // Fallback para cache se network falhar
          return caches.match(request);
        })
    );
    return;
  }

  // Estratégia Stale While Revalidate para páginas
  event.respondWith(
    caches.match(request)
      .then((response) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                cache.put(request, responseToCache);
              });
          }
          return networkResponse;
        });

        return response || fetchPromise;
      })
  );
});

// Limpeza periódica de cache
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAN_CACHE') {
    cleanOldCache();
  }
});

async function cleanOldCache() {
  const cache = await caches.open(DYNAMIC_CACHE);
  const keys = await cache.keys();

  // Remove entradas antigas (mais de 1 hora)
  const oneHourAgo = Date.now() - (60 * 60 * 1000);

  for (const request of keys) {
    const response = await cache.match(request);
    if (response) {
      const date = response.headers.get('date');
      if (date && new Date(date).getTime() < oneHourAgo) {
        await cache.delete(request);
      }
    }
  }
}