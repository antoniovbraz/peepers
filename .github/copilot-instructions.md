# Copilot Instructions for Peepers - Mercado Livre Integration

## Project Overview

Peepers is a Next.js 15 application integrating with Mercado Livre's e-commerce API. The app handles OAuth 2.0 + PKCE authentication, product management, and real-time webhooks for the Brazilian marketplace. Built with React 19, Tailwind CSS v4, TypeScript, and Vitest.

**Architecture**: Clean Architecture with Domain-Driven Design patterns. Features a unified API approach with `/api/v1/products` consolidating legacy endpoints.

**Evolution Status**: v2.0.0 in development - transforming from product showcase to complete ERP for Mercado Livre sellers.

## Critical Development Context

### HTTPS Requirement
- **Mercado Livre REQUIRES HTTPS for ALL operations** - OAuth redirects, webhooks, and API calls
- Local development with real ML integration is not practical due to HTTPS requirements
- **Recommended approach**: Use Vercel for all ML API testing (deploy is fast with `vercel --prod`)
- Use `npm run dev:mock` for local development without ML integration

### v2.0.0 Admin Panel Implementation (IN PROGRESS)
- **New ERP Features**: Complete seller management dashboard transforming the project scope
- **Admin Routes**: `/admin` with dashboard, products CRUD, sales management, metrics, and communication center
- **Real-time Features**: Live KPI cards, automatic data refresh, webhook processing for orders/messages
- **Component Library**: Standardized UI components with Peepers brand colors (green #0D6832, gold #E0C81A)
- **Advanced Analytics**: Performance metrics, sales reports, reputation tracking, market trends

### Project Evolution Phases
- **Phase 1 (COMPLETED)**: Endpoint consolidation, Service Layer implementation, shared utilities
- **Phase 2 (COMPLETED)**: Performance optimization, intelligent caching, code splitting, image optimization
- **Phase 3 (COMPLETED)**: Design System implementation, Storybook integration, comprehensive testing
- **Phase 4 (IN PROGRESS)**: Complete admin panel, microservices consideration, advanced monitoring

### Key Architecture Patterns

#### Clean Architecture Implementation (`src/domain/`, `src/application/`, `src/infrastructure/`)
- **Domain Layer**: `src/domain/services/ProductService.ts` contains business logic and rules
- **Application Layer**: Use cases and DTOs in `src/application/` (currently empty - add here for complex workflows)
- **Infrastructure Layer**: External concerns in `src/infrastructure/` (API clients, cache, etc.)
- **Presentation Layer**: React components and API routes maintain separation from business logic
- Follow dependency inversion: Domain/Application layers never import from Infrastructure

#### Centralized Configuration (`src/config/routes.ts`)
- **NEVER use hardcoded URLs** - always import from `API_ENDPOINTS`, `PAGES`, `ML_CONFIG`
- All routes, cache keys, and ML endpoints are centralized here
- Example: Use `API_ENDPOINTS.PRODUCTS_V1` instead of `/api/v1/products`
- Follow pattern: `BASE_URLS`, `API_ENDPOINTS`, `PAGES`, `CACHE_KEYS` for all URLs

#### Unified API Strategy (`/api/v1/products`)
- **Primary endpoint**: `/api/v1/products` replaces legacy endpoints (`/api/products-public`, `/api/products-minimal`, etc.)
- Query parameters: `format=minimal|summary|full`, `limit`, `page`, filters (`category`, `price_min`, `price_max`)
- Legacy endpoints are deprecated but active until sunset (Dec 31, 2025)
- Always use the v1 API for new features - see `src/utils/products.ts` for usage patterns

#### Cache Strategy (`src/lib/cache.ts`)
- Uses Upstash Redis via `@vercel/kv` client with singleton pattern
- All cache operations go through centralized functions
- Cache keys follow pattern: `CACHE_KEYS.PRODUCTS_ALL`, `CACHE_KEYS.USER_TOKEN(userId)`
- Implements automatic token refresh and fallback strategies
- TTL constants: `PRODUCTS: 7200s`, `USER_DATA: 1800s`, `CATEGORIES: 86400s`

#### OAuth 2.0 + PKCE Security
- **CSRF protection is critical** - always validate `state` parameter
- PKCE verifiers stored in cache with expiration
- Token refresh handled automatically in `src/lib/cache.ts`
- Middleware (`src/middleware.ts`) protects routes with cookie-based sessions
- User authorization via `ALLOWED_USER_IDS` environment variable

## Essential Commands

```bash
# Development with ML mocks (recommended for daily work)
npm run dev:mock

# Testing with real ML integration (use Vercel deployment)
vercel --prod  # Deploy to Vercel
# Test on deployed URL via curl or browser

# Production testing (comprehensive endpoint testing - VERCEL ONLY)
# ⚠️  CRITICAL: ML API requires HTTPS and pre-configured URLs
# All testing must be done on Vercel deployment, never locally
npm run test:prod all                    # Test all endpoints on Vercel
npm run test:prod products-public        # Test specific endpoint on Vercel
npm run test:prod health                 # Health check on Vercel
npm run test:prod products              # Authenticated products on Vercel
npm run test:prod auth-me               # Authentication status on Vercel

# Build and test
npm run build
npm run test                            # Vitest with coverage (low thresholds due to external APIs)
npm run lint                            # ESLint

# Development tools
# Fast deployment for ML testing
vercel --prod                           # Quick deploy for HTTPS testing with ML API

# Storybook (Design System Development)
npm run storybook                       # Start Storybook dev server on port 6006
npm run build-storybook                 # Build static Storybook for deployment

# Performance analysis
npm run build:analyze                   # Enable bundle analysis with ANALYZE=true
npm run analyze                         # Open webpack bundle analyzer (after build)

# v2.0.0 Admin Panel Development
npm run dev:admin                       # Future: Admin-specific development mode
npm run test:admin                      # Future: Admin panel testing
```

## API Structure

### Route Organization
- **Unified API**: `/api/v1/products` (primary - use for all new development)
- **Public APIs**: `/api/health`, `/api/cache-debug`
- **Protected APIs**: `/api/products`, `/api/sync` (require authentication via middleware)
- **OAuth Flow**: `/api/auth/mercado-livre` → `/api/auth/mercado-livre/callback`
- **Webhooks**: `/api/webhook/mercado-livre` (receives ML notifications)
- **Legacy APIs**: Multiple `/api/products-*` endpoints (deprecated, sunset Dec 31, 2025)
- **Debug Endpoints**: Multiple `/api/debug-*` endpoints for development troubleshooting

### Authentication Flow
1. User clicks login → redirects to `/api/auth/mercado-livre`
2. ML callback → `/api/auth/mercado-livre/callback` with code + state
3. PKCE validation + token exchange
4. User data stored in cache with session management
5. Middleware protects routes using session cookies and `ALLOWED_USER_IDS`

## File Patterns

### Type Definitions (`src/types/ml.ts`)
- Comprehensive ML API types: `MLProduct`, `MLUser`, `MLShipping`, `MLAttribute`
- Cached variants: `CachedProduct`, `CachedUser`, `CachedCategory`
- OAuth types for PKCE flow
- Always use these types for ML data handling

### Component Structure
- Pages in `src/app/*/page.tsx` follow Next.js 15 app router
- Components use Tailwind CSS v4 with custom design system
- Admin panel at `/admin` with protected routes
- Portuguese routing: `/produtos` → `/products` via rewrites in `next.config.ts`

### v2.0.0 Component Specifications
- **Design System**: Peepers brand colors (green #0D6832, gold #E0C81A, red #DC2626 for promotions)
- **Typography**: Inter font system with standardized sizes (`text-xs` to `text-4xl`)
- **Component Library**: Button variants (primary/secondary/outline/ghost), ProductCard sizes, Badge types
- **Layout Components**: Responsive header, hero section, product grids (2-5 columns based on screen)
- **Admin Components**: KPI cards, interactive charts, activity feeds, notification centers
- **Animation System**: Standard transitions (200ms), hover effects, loading states with skeletons

### Testing Strategy
- Vitest with coverage tracking (low thresholds: 4% statements due to external API dependencies)
- Production testing scripts in root: `test-prod.js`, `test-*.js`
- Mock data available for offline development with `npm run dev:mock`
- Comprehensive endpoint testing with specific error scenarios
- **Storybook Integration**: Component testing and documentation with accessibility checks
- **Future v2.0.0**: Unit tests (70%), Integration tests (20%), E2E tests (10%) with Cypress/Playwright

### Component Development Patterns
- **Storybook Stories**: Create `.stories.ts` files for all reusable components
- **Accessibility**: Use `@storybook/addon-a11y` for automated accessibility testing
- **Documentation**: Auto-generated docs with `@storybook/addon-docs`
- **Design Tokens**: Standardized Tailwind CSS v4 classes with Peepers brand colors
- **Component Library**: Located in `src/components/` with clear separation between UI and business logic

## Critical Debugging Points

### Common Issues
1. **OAuth failures**: Check HTTPS requirements and state validation
2. **Token expiration**: Handled automatically, but check cache TTL
3. **Rate limits**: ML enforces 1000 calls/hour per app, 5000/day per user
4. **Cache issues**: Use `/api/cache-debug` endpoint for diagnostics
5. **Middleware auth**: Check session cookies and `ALLOWED_USER_IDS` configuration

### v2.0.0 Development Patterns
- **Conventional Commits**: Use `feat(scope): description` format for all commits
- **Branch Strategy**: `feature/admin-*`, `bugfix/*`, `hotfix/*` with PR reviews required
- **Component Development**: Follow SRP (Single Responsibility Principle) - split large components
- **Performance Optimization**: Use React.memo, useMemo, useCallback for optimal rendering
- **Error Boundaries**: Implement per-section error boundaries for better UX
- **Cache Strategy**: L1 (memory, 5min), L2 (Redis, 30min), L3 (CDN, 1h) with intelligent invalidation
- **Storybook Development**: All UI components must have corresponding `.stories.ts` files for documentation
- **TypeScript Patterns**: Strict mode enabled, comprehensive type coverage, Zod for runtime validation

### Environment Variables Required
- `ML_CLIENT_ID`, `ML_CLIENT_SECRET` (Mercado Livre app credentials)
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (cache)
- `NEXT_PUBLIC_APP_URL` (for OAuth redirects)
- `ALLOWED_USER_IDS` (comma-separated list for user authorization)

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

When working on this codebase, prioritize HTTPS compliance, use centralized configurations, and leverage the existing cache/auth patterns. For ML API testing, always deploy to Vercel first - it's faster than setting up complex local tunneling.