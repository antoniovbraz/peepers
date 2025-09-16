# Developer Guide

## Getting Started

This guide provides everything you need to contribute to Peepers effectively, from initial setup to advanced development patterns.

## Prerequisites

### Required Software

- **Node.js 18+** and npm
- **Git** for version control
- **VS Code** (recommended) with extensions:
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense
  - ESLint
  - Prettier

### Required Accounts

- **Mercado Livre Developer Account**: [developers.mercadolivre.com.br](https://developers.mercadolivre.com.br/)
- **Upstash Account**: For Redis hosting
- **Vercel Account**: For deployment (optional)

## Environment Setup

### 1. Clone and Install

```bash
git clone https://github.com/antoniovbraz/peepers.git
cd peepers
npm install
```

### 2. Environment Configuration

Create your environment file:

```bash
cp .env.example .env.local
```

Configure the following variables:

```env
# Mercado Livre API Credentials
ML_CLIENT_ID=your_app_id_from_ml
ML_CLIENT_SECRET=your_app_secret_from_ml

# Redis Cache (Upstash)
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# Application Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
ALLOWED_USER_IDS=123456789,987654321

# Development (optional)
LOG_LEVEL=debug
NODE_ENV=development
```

### 3. Mercado Livre App Configuration

1. **Create Application**:
   - Go to [ML DevCenter](https://developers.mercadolivre.com.br/)
   - Create new application
   - Use administrator account (not operator)

2. **Configure URLs**:
   ```text
   Redirect URI: https://your-domain.com/api/auth/mercado-livre/callback
   Webhook URL: https://your-domain.com/api/webhook/mercado-livre
   ```

3. **Enable PKCE**: ✅ Always enable for security

4. **Set Scopes**: Read and Write permissions

## Development Modes

### Mock Development (Recommended)

For daily UI/UX development without ML integration:

```bash
npm run dev:mock
```

**Benefits**:
- No HTTPS setup required
- Consistent test data
- Faster development cycle
- Works offline

### Real Integration Development

⚠️ **CRITICAL**: Mercado Livre API **ONLY** accepts HTTPS URLs that are pre-configured in your ML Developer Console. Local development with real ML integration is **IMPOSSIBLE**.

**Required Steps for ML Integration Testing:**

1. **Deploy to Vercel** (required for HTTPS):

   ```bash
   vercel --prod
   ```

2. **Configure ML Developer Console**:
   - Add your Vercel domain to allowed redirect URIs
   - Configure webhook URLs in ML settings

3. **Test ONLY on Vercel** (never locally):

   ```bash
   # Test all endpoints on Vercel production
   npm run test:prod all

   # Test specific endpoints on Vercel
   npm run test:prod products-public
   npm run test:prod auth-me
   ```

4. **Local Development**:
   - Use `npm run dev:mock` for development
   - Mock data simulates ML responses
   - No real API calls to ML

**🚨 REMEMBER**: Any attempt to test ML integration locally will fail because:

- ML requires HTTPS (local is HTTP)
- ML requires pre-configured URLs
- ML blocks unknown domains

## Project Structure

### Directory Overview

```text
peepers/
├── src/
│   ├── app/                    # Next.js 15 App Router
│   │   ├── api/               # API routes
│   │   ├── produtos/          # Product pages
│   │   ├── admin/             # Protected admin area
│   │   └── globals.css        # Global styles
│   ├── components/            # React components
│   │   ├── ui/               # Base UI components
│   │   ├── layout/           # Layout components
│   │   └── features/         # Feature-specific components
│   ├── config/               # Configuration files
│   │   └── routes.ts         # Centralized route definitions
│   ├── lib/                  # Utilities and core logic
│   │   ├── cache.ts          # Redis cache management
│   │   ├── logger.ts         # Logging configuration
│   │   └── ml-api.ts         # ML API client
│   ├── types/                # TypeScript definitions
│   │   └── ml.ts            # Mercado Livre API types
│   └── utils/               # Helper functions
├── docs/                     # Documentation
├── public/                   # Static assets
└── tests/                    # Test files
```

### Key Files

- `src/config/routes.ts`: **NEVER hardcode URLs** - always import from here
- `src/lib/cache.ts`: Redis operations with automatic retry
- `src/middleware.ts`: Authentication and route protection
- `src/types/ml.ts`: Complete ML API type definitions

## Development Workflows

### Daily Development

1. **Start development**:
   ```bash
   npm run dev:mock
   ```

2. **Make changes**: Edit components, styles, or logic

3. **Test locally**: Visit `http://localhost:3000`

4. **Run tests**:
   ```bash
   npm run test
   npm run lint
   ```

### Feature Development

1. **Create feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Implement feature** following project patterns

3. **Add tests** for new functionality

4. **Test production endpoints** (REQUIRED - Vercel only):
   ```bash
   # ⚠️  IMPORTANT: ML integration ONLY works on Vercel
   # Local testing will ALWAYS fail for ML API calls
   npm run test:prod health
   npm run test:prod products-public
   ```

5. **Commit and push**:
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   git push origin feature/your-feature-name
   ```

### ML Integration Testing

1. **Setup HTTPS tunnel**:
   ```bash
   npm run tunnel
   ```

2. **Update ML app configuration** with tunnel URL

3. **Test OAuth flow**:
   ```bash
   npm run dev
   # Visit tunnel URL and test login
   ```

4. **Test webhooks**:
   ```bash
   # Trigger events in ML seller dashboard
   # Check logs for webhook notifications
   ```

## Code Standards

### TypeScript Guidelines

**Always use strict typing**:
```typescript
// ✅ Good
interface ProductProps {
  product: MLProduct;
  onSelect: (id: string) => void;
}

// ❌ Bad
function ProductCard(props: any) {
  // ...
}
```

**Use union types for state**:
```typescript
type LoadingState = 'idle' | 'loading' | 'success' | 'error';
```

**Define API responses**:
```typescript
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}
```

### React Patterns

**Use Server Components by default**:
```typescript
// app/produtos/page.tsx
export default async function ProductsPage() {
  const products = await getProducts();
  return <ProductGrid products={products} />;
}
```

**Client Components for interactivity**:
```typescript
'use client';

export function AuthButton() {
  const [isLoading, setIsLoading] = useState(false);
  // Interactive logic here
}
```

**Error boundaries**:
```typescript
export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary fallback={<ErrorPage />}>
      {children}
    </ErrorBoundary>
  );
}
```

### API Development

**Consistent error handling**:
```typescript
export async function GET(request: Request) {
  try {
    const data = await fetchData();
    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error({ error }, 'API error');
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
```

**Use centralized routes**:
```typescript
import { API_ENDPOINTS } from '@/config/routes';

// ✅ Good
fetch(API_ENDPOINTS.PRODUCTS_PUBLIC)

// ❌ Bad
fetch('/api/products-public')
```

### Styling Guidelines

**Use Tailwind classes**:
```typescript
export function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <h3 className="text-lg font-semibold text-gray-900">
        {product.title}
      </h3>
      <p className="text-green-600 font-bold text-xl">
        R$ {product.price}
      </p>
    </div>
  );
}
```

**Brand color utilities**:
```css
/* globals.css */
.text-peepers-green { color: #0D6832; }
.bg-peepers-green { background-color: #0D6832; }
.text-peepers-gold { color: #E0C81A; }
.bg-peepers-gold { background-color: #E0C81A; }
```

## Testing

### Unit Testing

**Test pure functions**:
```typescript
import { formatPrice } from '@/utils/format';

describe('formatPrice', () => {
  it('should format Brazilian currency correctly', () => {
    expect(formatPrice(99.99)).toBe('R$ 99,99');
  });
});
```

**Mock external dependencies**:
```typescript
import { vi } from 'vitest';
import { getKVClient } from '@/lib/cache';

vi.mock('@/lib/cache', () => ({
  getKVClient: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
  }))
}));
```

### Integration Testing

**API endpoint testing**:
```typescript
describe('/api/products-public', () => {
  it('should return products without authentication', async () => {
    const response = await fetch('/api/products-public');
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });
});
```

### Production Testing

**Automated endpoint testing**:
```bash
# Test all endpoints
npm run test:prod all

# Test specific endpoints
npm run test:prod health
npm run test:prod products-public
npm run test:prod products
npm run test:prod auth-me
```

**Manual testing checklist**:
- [ ] OAuth flow completes successfully
- [ ] Products load on homepage
- [ ] Admin area requires authentication
- [ ] Webhooks receive notifications
- [ ] Cache invalidation works

## Debugging

### Development Debugging

**Enable debug logging**:
```env
LOG_LEVEL=debug
```

**Use debug endpoints**:
```bash
# Cache status
curl http://localhost:3000/api/cache-debug

# Health check
curl http://localhost:3000/api/health
```

**Browser DevTools**:
- Network tab for API calls
- Console for client-side errors
- Application tab for localStorage/cookies

### Production Debugging

**Check production health**:
```bash
curl https://peepers.vercel.app/api/health
```

**Monitor cache performance**:
```bash
curl https://peepers.vercel.app/api/cache-debug
```

**Common issues and solutions**:

**OAuth "redirect_uri mismatch"**:
- Verify URL in ML app matches exactly
- Ensure HTTPS is used
- Check for trailing slashes

**"invalid_operator_user_id"**:
- Use administrator account (not operator)
- Verify account has required permissions

**Cache connection errors**:
- Check Redis URL and token
- Verify network connectivity
- Check Upstash dashboard

### Logging

**Use structured logging**:
```typescript
import { logger } from '@/lib/logger';

logger.info({ userId, productId }, 'Product viewed');
logger.error({ error, context }, 'Operation failed');
```

**Log levels**:
- `error`: Critical errors requiring attention
- `warn`: Warnings and recoverable errors
- `info`: General application flow
- `debug`: Detailed debugging information

## Performance

### Frontend Optimization

**Image optimization**:
```typescript
import Image from 'next/image';

<Image
  src={product.thumbnail}
  alt={product.title}
  width={300}
  height={300}
  className="object-cover"
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

**Code splitting**:
```typescript
import dynamic from 'next/dynamic';

const AdminDashboard = dynamic(() => import('@/components/AdminDashboard'), {
  loading: () => <AdminSkeleton />,
  ssr: false
});
```

### Backend Optimization

**Cache frequently accessed data**:
```typescript
export async function getProducts(): Promise<MLProduct[]> {
  // Try cache first
  const cached = await cache.getProducts();
  if (cached) return cached;
  
  // Fetch and cache
  const fresh = await mlApi.getProducts();
  await cache.setProducts(fresh);
  
  return fresh;
}
```

**Optimize API responses**:
```typescript
// Return minimal data for lists
export function toProductSummary(product: MLProduct): ProductSummary {
  return {
    id: product.id,
    title: product.title,
    price: product.price,
    thumbnail: product.thumbnail
  };
}
```

## Security

### Environment Security

**Never commit secrets**:
```gitignore
.env*
!.env.example
```

**Use environment validation**:
```typescript
if (!process.env.ML_CLIENT_SECRET) {
  throw new Error('ML_CLIENT_SECRET is required');
}
```

### Authentication Security

**Validate all inputs**:
```typescript
import { z } from 'zod';

const ProductSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  price: z.number().positive()
});
```

**Protect sensitive routes**:
```typescript
export const config = {
  matcher: ['/admin/:path*', '/api/sync', '/api/products']
};
```

## Deployment

### Vercel Deployment

1. **Connect repository** to Vercel

2. **Configure environment variables** in Vercel dashboard

3. **Set up custom domain**:
   - Add domain in Vercel
   - Configure DNS records
   - Update `NEXT_PUBLIC_APP_URL`

4. **Monitor deployment**:
   - Check build logs
   - Test all endpoints
   - Verify environment variables

### Manual Deployment

```bash
# Build application
npm run build

# Start production server
npm start
```

## Contributing

### Pull Request Process

1. **Fork the repository**

2. **Create feature branch**:
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make changes** following code standards

4. **Add tests** for new functionality

5. **Run quality checks**:
   ```bash
   npm run test
   npm run lint
   npm run build
   ```

6. **Commit with conventional commits**:
   ```bash
   git commit -m "feat: add amazing feature"
   ```

7. **Push and create PR**:
   ```bash
   git push origin feature/amazing-feature
   ```

### Code Review Guidelines

**For reviewers**:
- Check test coverage
- Verify security implications
- Test functionality locally
- Review performance impact

**For contributors**:
- Keep PRs focused and small
- Include screenshots for UI changes
- Update documentation
- Respond to feedback promptly

## Common Patterns

### Data Fetching

**Server Components**:
```typescript
export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id);
  return <ProductDetail product={product} />;
}
```

**Client Components**:
```typescript
'use client';

export function ProductSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  
  useEffect(() => {
    if (query) {
      searchProducts(query).then(setResults);
    }
  }, [query]);
  
  return (
    <SearchInput 
      value={query} 
      onChange={setQuery}
      results={results}
    />
  );
}
```

### Error Handling

**API error handling**:
```typescript
export async function apiHandler<T>(
  operation: () => Promise<T>
): Promise<APIResponse<T>> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    logger.error({ error }, 'API operation failed');
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
```

**Component error boundaries**:
```typescript
export function withErrorBoundary<P>(Component: React.ComponentType<P>) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={<ErrorFallback />}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
```

This guide should help you become productive with the Peepers codebase quickly. Remember to always prioritize security, follow the established patterns, and test thoroughly before deployment.