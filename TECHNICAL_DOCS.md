# PEEPERS - Documentação Técnica Completa

## 📋 Visão Geral do Projeto

**Peepers** é uma aplicação Next.js para integração e gestão de produtos do Mercado Livre, com funcionalidades de sincronização, cache inteligente e dashboard administrativo.

## 🏗️ Arquitetura Técnica

### Stack Principal
- **Framework**: Next.js 15.5.3 (App Router)
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 4.x
- **Cache**: Upstash Redis via @vercel/kv
- **Deploy**: Vercel Platform
- **Testing**: Vitest + Coverage

### Estrutura de Diretórios
```
src/
├── app/
│   ├── api/
│   │   ├── ml/                    # Mercado Livre API routes
│   │   │   ├── auth/              # OAuth flow
│   │   │   ├── products/          # ML product sync
│   │   │   ├── sync/              # Force sync
│   │   │   └── webhook/           # ML notifications
│   │   └── products/              # Public product API
│   ├── produtos/                  # Product listing page
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Home page
├── components/                    # React components
├── lib/                          # Utilities and configurations
│   ├── cache.ts                  # Redis cache manager
│   ├── ml-api.ts                 # ML API client
│   └── utils.ts                  # Helper functions
└── types/
    └── ml.ts                     # TypeScript definitions
```

## 🌐 URLs e Endpoints

### Domínios
- **Produção**: `https://peepers.vercel.app`
- **Desenvolvimento**: `http://localhost:3000`
- **Futuro**: `https://peepers.com.br` (planejado)

### API Endpoints Principais
```
# Autenticação Mercado Livre
GET  /api/ml/auth                 # Iniciar OAuth
GET  /api/ml/auth/callback        # Callback OAuth
POST /api/ml/webhook              # Notificações ML

# Produtos
GET  /api/products                # Lista produtos (público)
GET  /api/ml/products             # Sync ML produtos (admin)
POST /api/ml/sync                 # Force sync (auth required)

# Debug e Utilities
GET  /api/cache-debug             # Debug cache state
```

### OAuth Configuration
```
Authorization URL: https://auth.mercadolivre.com.br/authorization
Token URL: https://api.mercadolibre.com/oauth/token
Redirect URI: https://peepers.vercel.app/api/ml/auth/callback
```

## 🔐 Sistema de Autenticação

### Fluxo OAuth 2.0 com Mercado Livre
1. **Início**: `GET /api/ml/auth`
   - Gera state para segurança
   - Redireciona para ML OAuth

2. **Callback**: `GET /api/ml/auth/callback`
   - Valida state OAuth
   - Troca code por tokens
   - Armazena tokens no cache

3. **Cache Pattern**:
   ```typescript
   // Key: access_token:{userId}
   {
     token: string,           // Bearer token
     expires_at: string,      // ISO datetime
     user_id: number,         // 669073070
     refresh_token?: string   // Para renovação
   }
   ```

### Permissões Necessárias (ML App)
- **Usuários** (default): Informações básicas
- **Publicação e sincronização**: CRUD produtos
- **Comunicação pré e pós-venda**: Mensagens
- **Vendas e envios**: Pedidos e tracking

## 💾 Sistema de Cache

### Tecnologia
- **Provider**: Upstash Redis
- **Client**: @vercel/kv
- **Padrão**: TTL-based expiration

### Cache Keys e TTLs
```typescript
const CACHE_TTL = {
  PRODUCTS: 7200,      // 2 horas
  QUESTIONS: 3600,     // 1 hora  
  USER_DATA: 1800,     // 30 minutos
  CATEGORIES: 86400,   // 24 horas
}

const CACHE_KEYS = {
  PRODUCTS_ALL: 'products:all',
  PRODUCTS_ACTIVE: 'products:active', 
  PRODUCT: 'product:',
  USER: 'user:',       // Para tokens: user:access_token:{userId}
  SYNC_LOCK: 'sync:lock',
  LAST_SYNC: 'sync:last',
}
```

### Cache Strategies
- **Products**: Full cache + individual cache
- **Users/Tokens**: Session-based storage
- **Sync Lock**: Prevents concurrent syncs
- **Auto-expiration**: TTL-based cleanup

## 🔗 Integração Mercado Livre

### API Endpoints Used
```
# Produtos
GET /users/{userId}/items/search          # Lista IDs produtos
GET /items?ids={id1},{id2}                # Batch product details
GET /items/{itemId}                       # Single product detail

# Usuário  
GET /users/me                             # User profile
GET /users/{userId}                       # User by ID

# Categorias
GET /sites/{siteId}/categories            # Categories list
GET /categories/{categoryId}              # Category details
```

### Pagination Handling
```typescript
// Para +100 produtos
const limit = 50;  // Max ML allows
let offset = 0;
let hasMore = true;

while (hasMore) {
  const response = await fetch(
    `https://api.mercadolibre.com/users/${userId}/items/search?limit=${limit}&offset=${offset}`
  );
  // Process batch...
  offset += limit;
  hasMore = results.length === limit;
}
```

### Product Status Handling
- **active**: Produto ativo no ML
- **paused**: Produto pausado (incluído na API)
- **closed**: Produto encerrado
- **available_quantity**: Estoque disponível

## 🛠️ Environment Variables

### Required (.env.local)
```bash
# Mercado Livre API
ML_CLIENT_ID=your_app_id_from_ml
ML_CLIENT_SECRET=your_client_secret_from_ml
ML_USER_ID=669073070

# Cache (Upstash Redis)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# App URLs  
NEXTAUTH_URL=https://peepers.vercel.app
NEXT_PUBLIC_APP_URL=https://peepers.vercel.app

# Security
NEXTAUTH_SECRET=your_random_secret
ADMIN_SECRET=your_admin_bearer_token
```

### Vercel Auto-populated
```bash
VERCEL_URL=auto_populated_in_vercel
VERCEL_ENV=production|preview|development
VERCEL_REGION=iad1
```

## 🚀 Deployment

### Vercel Configuration (vercel.json)
```json
{
  "env": {
    "NEXT_PUBLIC_APP_URL": "https://peepers.vercel.app"
  },
  "functions": {
    "src/app/api/ml/webhook/route.ts": { "maxDuration": 10 },
    "src/app/api/ml/sync/route.ts": { "maxDuration": 30 }
  },
  "rewrites": [
    { "source": "/api/ml/(.*)", "destination": "/api/ml/$1" },
    { "source": "/api/products(.*)", "destination": "/api/products$1" }
  ]
}
```

### Deploy Commands
```bash
# Development
npm run dev

# Production Build  
npm run build

# Deploy to Vercel
npx vercel --prod
```

## 🔒 Security

### API Authentication
- **Bearer Token**: Required for sensitive endpoints
- **Header**: `Authorization: Bearer {ADMIN_SECRET}`
- **Protected Routes**: 
  - `POST /api/ml/sync`
  - `POST /api/products/[id]`

### OAuth Security
- **State Parameter**: CSRF protection
- **HTTPS Only**: Required for ML OAuth
- **Token Rotation**: Refresh token support
- **Secure Storage**: Redis with expiration

## 🐛 Error Handling

### Common Patterns
```typescript
// API Response Pattern
return NextResponse.json({
  success: boolean,
  data?: any,
  error?: string,
  message?: string,
  timestamp: string
}, { status: number });

// Cache Error Handling
try {
  const result = await cache.get(key);
  return result || fallbackValue;
} catch (error) {
  logger.error({ err: error }, 'Cache operation failed');
  return fallbackValue;
}
```

### HTTP Status Codes
- **200**: Success
- **401**: Unauthorized (missing/invalid token)
- **404**: Resource not found
- **429**: Rate limit exceeded
- **500**: Internal server error

## 📊 Monitoring & Logs

### Logging Strategy
- **Library**: Pino (structured logging)
- **Levels**: error, warn, info, debug
- **Context**: Include request IDs, user IDs
- **Destination**: Vercel logs + external if needed

### Performance Monitoring
- **Cache Hit Rates**: Monitor Redis performance
- **API Response Times**: Track ML API latency
- **Error Rates**: Monitor 4xx/5xx responses
- **Sync Success**: Track sync job completions

## 🧪 Testing

### Test Configuration
- **Framework**: Vitest
- **Coverage**: @vitest/coverage-v8
- **Commands**:
  ```bash
  npm run test        # Run tests
  npm run test:watch  # Watch mode
  ```

### Test Categories
- **Unit**: Individual functions
- **Integration**: API endpoints
- **Cache**: Redis operations
- **OAuth**: Authentication flows

## 📈 Performance Optimizations

### Caching Strategy
- **Products**: 2-hour TTL
- **Batch Requests**: ML multi-get APIs
- **Conditional Requests**: ETag support
- **Background Sync**: Webhook-triggered updates

### Database Strategy
- **Primary**: Redis (fast cache)
- **Future**: PostgreSQL (persistent data)
- **Sync Pattern**: Cache-first with fallback

## 🔄 Data Flow

### Product Sync Flow
```
1. Webhook/Manual Trigger
2. Acquire Sync Lock (Redis)
3. Fetch All Product IDs (paginated)
4. Batch Fetch Product Details
5. Transform for Frontend
6. Update Cache (atomic)
7. Release Sync Lock
8. Return Response
```

### User Authentication Flow
```
1. User clicks "Login with ML"
2. Redirect to ML OAuth
3. User authorizes app
4. ML redirects to callback
5. Exchange code for tokens
6. Store tokens in Redis
7. Redirect to dashboard
```

## 🛣️ Roadmap

### Phase 1: Core Integration ✅
- [x] OAuth setup
- [x] Product sync
- [x] Cache system
- [x] Basic UI

### Phase 2: Enhanced Features
- [ ] Real-time webhooks
- [ ] Advanced filtering
- [ ] Bulk operations
- [ ] Analytics dashboard

### Phase 3: Scale & Optimize
- [ ] PostgreSQL integration
- [ ] Advanced caching
- [ ] Multi-tenant support
- [ ] Custom domain (peepers.com.br)

---

## ⚠️ Known Issues & Solutions

### Token Expiration
- **Issue**: ML tokens expire after 6 hours
- **Solution**: Implement refresh token rotation
- **Monitor**: Check token expiry before API calls

### Rate Limiting
- **Issue**: ML API has rate limits
- **Solution**: Implement exponential backoff
- **Cache**: Aggressive caching to reduce calls

### Large Product Catalogs
- **Issue**: 100+ products = slow sync
- **Solution**: Parallel batch processing
- **Optimization**: Incremental sync with timestamps

---

**Última atualização**: 2025-09-13  
**Versão**: 0.1.0  
**Maintainer**: Peepers Team