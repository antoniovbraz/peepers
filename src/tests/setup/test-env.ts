/**
 * Configuração de Environment Variables para Testes
 * 
 * Define variáveis obrigatórias para evitar falhas nos testes
 */

import { vi } from 'vitest';

// Environment variables obrigatórias para testes
const TEST_ENV_VARS = {
  // Redis/Cache
  UPSTASH_REDIS_REST_URL: 'https://test-redis.upstash.io',
  UPSTASH_REDIS_REST_TOKEN: 'test-token',
  
  // Mercado Livre
  ML_CLIENT_ID: 'test-ml-client-id',
  ML_CLIENT_SECRET: 'test-ml-client-secret',
  
  // App URLs  
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  
  // Auth
  // Deprecated: ALLOWED_USER_IDS
  SUPER_ADMIN_EMAIL: 'antonio@peepers.com',
  SUPER_ADMIN_USER_IDS: '468424240,123456789',
  
  // Stripe
  STRIPE_SECRET_KEY: 'sk_test_test',
  STRIPE_PUBLISHABLE_KEY: 'pk_test_test',
  WEBHOOK_SECRET: 'whsec_test',
  
  // Node Environment
  NODE_ENV: 'test'
};

// Configurar environment variables para testes
Object.entries(TEST_ENV_VARS).forEach(([key, value]) => {
  process.env[key] = value;
});

// Mock para Redis/KV client que não requer conexão real
vi.mock('@vercel/kv', () => ({
  kv: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1),
    incr: vi.fn().mockResolvedValue(1),
    expire: vi.fn().mockResolvedValue(1),
    ttl: vi.fn().mockResolvedValue(-1),
    exists: vi.fn().mockResolvedValue(0),
    pipeline: vi.fn(() => ({
      get: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([null, null])
    }))
  }
}));

// Mock para Upstash Redis
vi.mock('@upstash/redis', () => ({
  Redis: vi.fn(() => ({
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1),
    incr: vi.fn().mockResolvedValue(1),
    expire: vi.fn().mockResolvedValue(1),
    ttl: vi.fn().mockResolvedValue(-1),
    exists: vi.fn().mockResolvedValue(0),
    pipeline: vi.fn(() => ({
      get: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([null, null])
    }))
  }))
}));

export { TEST_ENV_VARS };