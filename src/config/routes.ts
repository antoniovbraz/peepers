/**
 * CONFIGURAÇÃO CENTRALIZADA DE ROTAS E ENDPOINTS
 * 
 * Este arquivo é a fonte única da verdade para todas as rotas da aplicação.
 * NUNCA use strings hardcoded - sempre importe deste arquivo.
 * 
 * Última atualização: 2025-09-13
 * Status: ✅ ATIVO E FUNCIONANDO
 */

// ==================== BASE URLS ====================
export const BASE_URLS = {
  PRODUCTION: 'https://peepers.vercel.app',
  LOCAL: 'https://eight-brooms-invent.loca.lt'
} as const;

// ==================== API ENDPOINTS - PÚBLICOS ====================
export const API_ENDPOINTS = {
  // Health & Debug
  HEALTH: '/api/health',
  DEBUG: '/api/debug', 
  CACHE_DEBUG: '/api/cache-debug',
  
  // Produtos (público)
  PRODUCTS: '/api/products',
  PRODUCTS_PUBLIC: '/api/products-public',
  PRODUCTS_V1: '/api/v1/products', // ✅ NEW: Unified products API
  PRODUCT_BY_ID: (id: string) => `/api/products/${id}`,
  
  // Autenticação OAuth (público)
  AUTH_ML: '/api/auth/mercado-livre',
  AUTH_ML_CALLBACK: '/api/auth/mercado-livre/callback',
  AUTH_ME: '/api/auth/me',
  AUTH_LOGOUT: '/api/auth/logout',
  
  // Webhook (público)
  WEBHOOK_ML: '/api/webhook/mercado-livre',
  
  // Sync (protegido)
  SYNC: '/api/sync'
} as const;

// ==================== PÁGINAS FRONTEND ====================
export const PAGES = {
  HOME: '/',
  PRODUTOS: '/produtos',
  ADMIN: '/admin',
  LOGIN: '/login',
  ACESSO_NEGADO: '/acesso-negado',
  PRODUTO_DETALHE: (id: string) => `/produtos/${id}`
} as const;

// ==================== MERCADO LIVRE CONFIG ====================
export const ML_CONFIG = {
  AUTH_URL: 'https://auth.mercadolivre.com.br/authorization',
  TOKEN_URL: 'https://api.mercadolibre.com/oauth/token',
  API_BASE: 'https://api.mercadolibre.com',
  USER_ME: 'https://api.mercadolibre.com/users/me',
  
  // Scopes necessários
  SCOPES: 'read write',
  
  // URLs completas para configuração no ML
  get REDIRECT_URI() {
    return `${BASE_URLS.PRODUCTION}${API_ENDPOINTS.AUTH_ML_CALLBACK}`;
  },
  get WEBHOOK_URL() {
    return `${BASE_URLS.PRODUCTION}${API_ENDPOINTS.WEBHOOK_ML}`;
  }
} as const;

// ==================== MIDDLEWARE CONFIG ====================
export const MIDDLEWARE_CONFIG = {
  // Rotas que NÃO precisam de autenticação
  PUBLIC_PATHS: [
    API_ENDPOINTS.PRODUCTS_PUBLIC,
    API_ENDPOINTS.PRODUCTS,
    API_ENDPOINTS.HEALTH,
    API_ENDPOINTS.CACHE_DEBUG,
    API_ENDPOINTS.DEBUG,
    API_ENDPOINTS.AUTH_ML,
    API_ENDPOINTS.AUTH_ML_CALLBACK,
    API_ENDPOINTS.AUTH_ME,
    API_ENDPOINTS.AUTH_LOGOUT,
    API_ENDPOINTS.WEBHOOK_ML,
    PAGES.ACESSO_NEGADO
  ],
  
  // Rotas que SÃO protegidas (precisam de auth)
  PROTECTED_PATHS: [
    API_ENDPOINTS.SYNC
  ],
  
  // Middleware matchers
  MATCHERS: {
    SYNC_API: '/api/sync/:path*'
  }
} as const;

// ==================== CACHE KEYS ====================
export const CACHE_KEYS = {
  PRODUCTS_ALL: 'products:all',
  PRODUCT: 'product:',
  USER_TOKEN: (userId: string) => `access_token:${userId}`,
  PKCE_VERIFIER: (state: string) => `pkce_verifier:${state}`,
  SYNC_LOCK: 'sync:lock',
  LAST_SYNC: 'sync:last'
} as const;

// ==================== VALIDAÇÃO ====================
/**
 * Valida se uma rota está na lista de rotas válidas
 */
export function isValidApiRoute(route: string): boolean {
  const validRoutes = Object.values(API_ENDPOINTS).filter(r => typeof r === 'string') as string[];
  return validRoutes.includes(route);
}

/**
 * Constrói URL completa para ambiente atual
 */
export function buildUrl(endpoint: string, isProduction: boolean = true): string {
  const baseUrl = isProduction ? BASE_URLS.PRODUCTION : BASE_URLS.LOCAL;
  return `${baseUrl}${endpoint}`;
}

// ==================== ROTAS DEPRECIADAS ⚠️ ====================
/**
 * ROTAS QUE NÃO EXISTEM MAIS - NÃO USAR!
 * 
 * ❌ /api/ml/auth
 * ❌ /api/ml/auth/callback  
 * ❌ /api/ml/webhook
 * ❌ /api/ml/sync
 * ❌ /api/ml/products
 * 
 * Substitua por:
 * ✅ /api/auth/mercado-livre
 * ✅ /api/auth/mercado-livre/callback
 * ✅ /api/webhook/mercado-livre
 * ✅ /api/sync
 * ✅ /api/products
 */

const routesConfig = {
  BASE_URLS,
  API_ENDPOINTS,
  PAGES,
  ML_CONFIG,
  MIDDLEWARE_CONFIG,
  CACHE_KEYS,
  isValidApiRoute,
  buildUrl
};

export default routesConfig;