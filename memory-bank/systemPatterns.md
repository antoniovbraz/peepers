---
title: "System Patterns - Peepers.com.br"
schema_version: 1
owner: "Antonio Henrique Vanucci"
last_review: "2025-09-11"
status: "active"
---

# System Patterns - Peepers.com.br

## Arquitetura Geral

### Camadas da Aplicação
```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                       │
│  Next.js App Router + TailwindCSS + PWA                     │
├─────────────────────────────────────────────────────────────┤
│                    API LAYER                                │
│  Vercel Edge Functions + API Routes                         │
├─────────────────────────────────────────────────────────────┤
│                    CACHE LAYER                              │
│  Redis (Products, Q&A) + ISR (Static Pages)                │
├─────────────────────────────────────────────────────────────┤
│                    DATA LAYER                               │
│  ML API + PostgreSQL (Config/Logs/Blog)                     │
└─────────────────────────────────────────────────────────────┘
```

## Padrões de Integração

### OAuth 2.0 Flow Pattern
```typescript
// Fluxo de autenticação com Mercado Livre
1. User → /api/ml/auth → Redirect to ML
2. ML → /api/ml/auth/callback → Exchange code for token
3. Store tokens → Discover User ID via /users/me
4. Setup webhooks → Configure notification topics
```

### Cache-First Pattern
```typescript
// Estratégia de cache para produtos
async function getProducts() {
  // 1. Try Redis cache first
  const cached = await redis.get('products:all');
  if (cached && !isExpired(cached)) return cached;
  
  // 2. Fallback to ML API
  const fresh = await mlApi.getProducts();
  
  // 3. Update cache with TTL
  await redis.setex('products:all', 7200, fresh); // 2h TTL
  
  return fresh;
}
```

### Webhook Processing Pattern
```typescript
// Pattern para processar webhooks ML
async function processWebhook(payload: MLWebhook) {
  // 1. Validate webhook signature
  if (!validateSignature(payload)) throw new Error('Invalid webhook');
  
  // 2. Process by topic
  switch (payload.topic) {
    case 'items':
      await invalidateProductCache(payload.resource);
      await revalidateISR(`/produtos/${payload.resource}`);
      break;
    case 'questions':
      await invalidateQACache(payload.resource);
      break;
  }
  
  // 3. Log for debugging
  await logWebhook(payload);
  
  // 4. Always return 200 within 500ms
  return { status: 'processed' };
}
```

## Padrões de Performance

### ISR (Incremental Static Regeneration)
```typescript
// Páginas de produto com ISR
export async function generateStaticParams() {
  const products = await getProductsFromCache();
  return products.map(product => ({
    id: product.id
  }));
}

export const revalidate = 3600; // 1 hour
```

### Edge Function Pattern
```typescript
// API Routes otimizadas para Edge
export const runtime = 'edge';

export async function GET(request: Request) {
  // Minimal processing on edge
  const cached = await getFromCache(key);
  if (cached) return Response.json(cached);
  
  // Fallback to origin if needed
  return await fetchFromOrigin();
}
```

## Padrões de Dados

### Product Data Structure
```typescript
interface MLProduct {
  id: string;
  title: string;
  price: number;
  currency_id: string;
  available_quantity: number;
  condition: 'new' | 'used';
  category_id: string;
  pictures: MLPicture[];
  attributes: MLAttribute[];
  permalink: string;
  status: 'active' | 'paused' | 'closed';
  last_updated: string;
}

interface CachedProduct extends MLProduct {
  cached_at: string;
  cache_ttl: number;
}
```

### Q&A Data Structure
```typescript
interface MLQuestion {
  id: number;
  text: string;
  status: 'UNANSWERED' | 'ANSWERED';
  date_created: string;
  item_id: string;
  from: {
    id: number;
    nickname: string;
  };
  answer?: {
    text: string;
    status: string;
    date_created: string;
  };
}
```

## Padrões de Segurança

### Environment Variables Pattern
```typescript
// Configuração segura de variáveis
const config = {
  ml: {
    clientId: process.env.ML_CLIENT_ID!,
    clientSecret: process.env.ML_CLIENT_SECRET!,
    accessToken: process.env.ML_ACCESS_TOKEN,
    refreshToken: process.env.ML_REFRESH_TOKEN,
  },
  redis: {
    url: process.env.REDIS_URL!,
  },
  database: {
    url: process.env.DATABASE_URL!,
  }
};
```

### Token Refresh Pattern
```typescript
// Auto-refresh de tokens ML
async function ensureValidToken() {
  const token = await getStoredToken();
  
  if (isTokenExpired(token)) {
    const refreshed = await refreshMLToken(token.refresh_token);
    await storeToken(refreshed);
    return refreshed.access_token;
  }
  
  return token.access_token;
}
```

## Padrões de Error Handling

### Retry Pattern with Exponential Backoff
```typescript
async function callMLAPI(endpoint: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetch(`https://api.mercadolibre.com${endpoint}`);
    } catch (error) {
      if (i === retries - 1) throw error;
      
      // Exponential backoff: 1s, 2s, 4s
      await sleep(Math.pow(2, i) * 1000);
    }
  }
}
```

### Graceful Degradation Pattern
```typescript
// Fallback quando ML API falha
async function getProductsWithFallback() {
  try {
    return await getProductsFromML();
  } catch (error) {
    // Log error but don't break the site
    console.error('ML API failed:', error);
    
    // Return cached data even if expired
    return await getProductsFromCache(true); // ignoreExpiry = true
  }
}
```

## Padrões de Monitoramento

### Logging Pattern
```typescript
interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  source: 'ml-api' | 'webhook' | 'cache' | 'user';
  message: string;
  metadata?: Record<string, any>;
}

async function log(entry: LogEntry) {
  // Store in PostgreSQL for analysis
  await db.logs.create({ data: entry });
  
  // Also log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(entry);
  }
}
```

## Padrões de Deployment

### Vercel Configuration Pattern
```json
{
  "functions": {
    "app/api/ml/webhook/route.ts": {
      "maxDuration": 10
    }
  },
  "crons": [
    {
      "path": "/api/ml/sync",
      "schedule": "0 */2 * * *"
    }
  ]
}
```

### Environment-Specific Patterns
```typescript
// Different behavior per environment
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.VERCEL_ENV === 'production';

const config = {
  cache: {
    ttl: isDevelopment ? 60 : 7200, // 1min dev, 2h prod
  },
  ml: {
    baseUrl: isDevelopment 
      ? 'https://api.mercadolibre.com' 
      : 'https://api.mercadolibre.com'
  }
};
