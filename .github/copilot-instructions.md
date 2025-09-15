# Copilot Instructions for Peepers - Mercado Livre Integration

## Project Overview

Peepers is a Next.js 15 application that integrates with Mercado Livre's e-commerce API. The app handles OAuth 2.0 + PKCE authentication, product management, and real-time webhooks for a Brazilian marketplace.

## Critical Development Context

### HTTPS Requirement
- **Mercado Livre REQUIRES HTTPS for ALL operations** - OAuth redirects, webhooks, and API calls
- Local development uses `npm run tunnel` (localtunnel) to expose HTTPS endpoints
- Production URLs must be configured in Mercado Livre DevCenter before testing
- Use `npm run dev:mock` for local development without ML integration

### Key Architecture Patterns

#### Centralized Configuration (`src/config/routes.ts`)
- **NEVER use hardcoded URLs** - always import from `API_ENDPOINTS`, `PAGES`, `ML_CONFIG`
- All routes, cache keys, and ML endpoints are centralized here
- Example: Use `API_ENDPOINTS.PRODUCTS_PUBLIC` instead of `/api/products-public`

#### Cache Strategy (`src/lib/cache.ts`)
- Uses Upstash Redis via `@vercel/kv` client
- All cache operations go through centralized functions
- Cache keys follow pattern: `CACHE_KEYS.PRODUCTS`, `CACHE_KEYS.USER_TOKEN(userId)`
- Implements automatic token refresh and fallback strategies

#### OAuth 2.0 + PKCE Security
- **CSRF protection is critical** - always validate `state` parameter
- PKCE verifiers stored in cache with expiration
- Token refresh handled automatically in `src/lib/cache.ts`
- See `src/app/api/auth/mercado-livre/callback/route.ts` for implementation

## Essential Commands

```bash
# Development with ML mocks (recommended for daily work)
npm run dev:mock

# Development with real ML integration (requires tunnel)
npm run dev
npm run tunnel  # In separate terminal

# Production testing
npm run test:prod all           # Test all endpoints
npm run test:prod products-public # Test specific endpoint

# Build and test
npm run build
npm run test
```

## API Structure

### Route Organization
- **Public APIs**: `/api/products-public`, `/api/health`
- **Protected APIs**: `/api/products`, `/api/sync` (require authentication)
- **OAuth Flow**: `/api/auth/mercado-livre` → `/api/auth/mercado-livre/callback`
- **Webhooks**: `/api/webhook/mercado-livre` (receives ML notifications)

### Authentication Flow
1. User clicks login → redirects to `/api/auth/mercado-livre`
2. ML callback → `/api/auth/mercado-livre/callback` with code + state
3. PKCE validation + token exchange
4. User data stored in cache with session management

## File Patterns

### Type Definitions (`src/types/ml.ts`)
- Comprehensive ML API types: `MLProduct`, `MLUser`, `MLShipping`
- Cached variants: `CachedProduct`, `CachedUser`
- Always use these types for ML data handling

### Component Structure
- Pages in `src/app/*/page.tsx` follow Next.js 15 app router
- Components use Tailwind CSS v4 with custom design system
- Admin panel at `/admin` with protected routes

### Testing Strategy
- Vitest with coverage tracking (low thresholds due to external API dependencies)
- Production testing scripts in root: `test-prod.js`, `test-*.js`
- Mock data available for offline development

## Critical Debugging Points

### Common Issues
1. **OAuth failures**: Check HTTPS requirements and state validation
2. **Token expiration**: Handled automatically, but check cache TTL
3. **Rate limits**: ML enforces 1000 calls/hour per app, 5000/day per user
4. **Cache issues**: Use `/api/cache-debug` endpoint for diagnostics

### Environment Variables Required
- `ML_CLIENT_ID`, `ML_CLIENT_SECRET` (Mercado Livre app credentials)
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (cache)
- `NEXT_PUBLIC_APP_URL` (for OAuth redirects)

## Integration Specifics

### Mercado Livre API
- Brazilian marketplace with specific user types (administrators vs operators)
- Webhook topics: `orders_v2`, `items`, `messages`, `shipments`
- Product images hosted on ML CDN (configured in `next.config.ts`)
- Rate limiting and token management built into cache layer

### Data Flow
1. **Products**: ML API → Cache → Frontend (with fallback to public endpoint)
2. **Authentication**: OAuth flow → Token storage → API protection
3. **Webhooks**: ML notifications → Background processing → Cache updates

When working on this codebase, prioritize HTTPS compliance, use centralized configurations, and leverage the existing cache/auth patterns.