# Contributing Guidelines

## Welcome

Thank you for considering contributing to Peepers! We're excited to collaborate with you on building the best Mercado Livre integration platform. This guide will help you understand our development process and standards.

## Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, sex characteristics, gender identity and expression, level of experience, education, socio-economic status, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

**Positive behavior includes**:
- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behavior includes**:
- The use of sexualized language or imagery
- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information without explicit permission
- Other conduct which could reasonably be considered inappropriate

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- [x] Node.js 18+ installed
- [x] Git configured with your GitHub account
- [x] Basic understanding of TypeScript and React
- [x] Familiarity with Next.js concepts

### Development Setup

1. **Fork the repository**

   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/peepers.git
   cd peepers
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your development credentials
   ```

4. **Start development server**

   ```bash
   npm run dev:mock
   ```

5. **Verify setup**

   Visit `http://localhost:3000` and ensure the application loads correctly.

## Development Workflow

### Branch Strategy

We use **GitHub Flow** with the following branch conventions:

- `main`: Production-ready code
- `feature/description`: New features
- `fix/description`: Bug fixes
- `docs/description`: Documentation updates
- `refactor/description`: Code refactoring

### Naming Conventions

**Branches**:
```bash
feature/oauth-improvements
fix/cache-connection-timeout
docs/api-documentation-update
refactor/type-definitions-cleanup
```

**Commits**: Use [Conventional Commits](https://conventionalcommits.org/)
```bash
feat: add product filtering by category
fix: resolve Redis connection timeout issue
docs: update API endpoint documentation
refactor: extract cache utilities to separate module
test: add integration tests for OAuth flow
```

### Pull Request Process

1. **Create feature branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**

   Follow our [coding standards](#coding-standards) and ensure:
   - Code is properly typed with TypeScript
   - Components follow established patterns
   - New features include tests
   - Documentation is updated

3. **Test your changes**

   ```bash
   # Run test suite
   npm run test
   
   # Run linting
   npm run lint
   
   # Test production endpoints
   npm run test:prod health
   npm run test:prod products-public
   
   # Build successfully
   npm run build
   ```

4. **Commit your changes**

   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Push and create PR**

   ```bash
   git push origin feature/your-feature-name
   ```

   Create a pull request with:
   - Clear title and description
   - Screenshots for UI changes
   - Link to related issues
   - Test results and verification steps

6. **Code review process**

   - Automated checks must pass
   - At least one maintainer review required
   - Address feedback promptly
   - Squash commits before merge

## Coding Standards

### TypeScript Standards

**Always use strict typing**:

```typescript
// ✅ Good
interface ProductCardProps {
  product: MLProduct;
  onSelect: (productId: string) => void;
  className?: string;
}

// ❌ Bad
function ProductCard(props: any) {
  // ...
}
```

**Use union types for state management**:

```typescript
type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

type AuthStatus = 'idle' | 'authenticating' | 'authenticated' | 'error';
```

**Define comprehensive API types**:

```typescript
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}
```

### React Component Standards

**Use Server Components by default**:

```typescript
// app/produtos/page.tsx
export default async function ProductsPage() {
  const products = await getProducts();
  
  return (
    <div className="container mx-auto">
      <ProductGrid products={products} />
    </div>
  );
}
```

**Client Components for interactivity**:

```typescript
'use client';

import { useState } from 'react';

export function SearchInput() {
  const [query, setQuery] = useState('');
  
  return (
    <input
      type="text"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      className="w-full px-4 py-2 border rounded-lg"
    />
  );
}
```

**Component composition patterns**:

```typescript
// Compound component pattern
export function ProductCard({ children, className }: ProductCardProps) {
  return (
    <div className={cn("bg-white rounded-lg shadow", className)}>
      {children}
    </div>
  );
}

ProductCard.Image = ProductImage;
ProductCard.Title = ProductTitle;
ProductCard.Price = ProductPrice;
ProductCard.Actions = ProductActions;
```

### API Development Standards

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
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { 
      status: error instanceof ValidationError ? 400 : 500 
    });
  }
}
```

**Input validation with Zod**:

```typescript
import { z } from 'zod';

const ProductSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(255),
  price: z.number().positive(),
  category: z.string().optional()
});

export async function POST(request: Request) {
  const body = await request.json();
  const validatedData = ProductSchema.parse(body);
  // Process validated data...
}
```

**Use centralized route configuration**:

```typescript
import { API_ENDPOINTS } from '@/config/routes';

// ✅ Good
const response = await fetch(API_ENDPOINTS.PRODUCTS_PUBLIC);

// ❌ Bad
const response = await fetch('/api/products-public');
```

### Styling Standards

**Use Tailwind CSS classes**:

```typescript
// ✅ Good
<button className="bg-peepers-green hover:bg-peepers-green-dark text-white font-semibold py-2 px-4 rounded-lg transition-colors">
  Click me
</button>

// ❌ Bad
<button style={{ backgroundColor: '#0D6832', color: 'white' }}>
  Click me
</button>
```

**Responsive design patterns**:

```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {products.map(product => (
    <ProductCard key={product.id} product={product} />
  ))}
</div>
```

**Brand consistency**:

```css
/* Use custom CSS properties for brand colors */
.text-peepers-green { color: #0D6832; }
.bg-peepers-green { background-color: #0D6832; }
.text-peepers-gold { color: #E0C81A; }
.bg-peepers-gold { background-color: #E0C81A; }
```

## Testing Standards

### Unit Testing

**Test pure functions**:

```typescript
import { formatCurrency } from '@/utils/format';

describe('formatCurrency', () => {
  it('should format Brazilian currency correctly', () => {
    expect(formatCurrency(99.99)).toBe('R$ 99,99');
    expect(formatCurrency(1000)).toBe('R$ 1.000,00');
  });
  
  it('should handle edge cases', () => {
    expect(formatCurrency(0)).toBe('R$ 0,00');
    expect(formatCurrency(-50)).toBe('-R$ 50,00');
  });
});
```

**Mock external dependencies**:

```typescript
import { vi } from 'vitest';
import { getKVClient } from '@/lib/cache';

vi.mock('@/lib/cache', () => ({
  getKVClient: vi.fn(() => ({
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1)
  }))
}));
```

### Integration Testing

**API endpoint testing**:

```typescript
describe('Products API', () => {
  it('should return products without authentication', async () => {
    const response = await fetch('/api/products-public');
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data.products)).toBe(true);
  });
  
  it('should require authentication for protected endpoints', async () => {
    const response = await fetch('/api/products');
    expect(response.status).toBe(401);
  });
});
```

### Testing Checklist

Before submitting a PR, ensure:

- [ ] All new functions have unit tests
- [ ] Integration tests cover API endpoints
- [ ] Error cases are tested
- [ ] Mock data is realistic and consistent
- [ ] Tests run successfully in CI/CD
- [ ] Coverage doesn't decrease significantly

## Documentation Standards

### Code Documentation

**JSDoc for functions**:

```typescript
/**
 * Fetches products from Mercado Livre API with caching
 * @param userId - The authenticated user ID
 * @param options - Query options for filtering
 * @returns Promise resolving to cached product data
 * @throws {Error} When user is not authenticated
 */
export async function getCachedProducts(
  userId: string,
  options: ProductQueryOptions = {}
): Promise<CachedProduct[]> {
  // Implementation...
}
```

**README updates**:

- Update README.md for new features
- Include setup instructions for new dependencies
- Add examples for new API endpoints
- Update troubleshooting section for new issues

### API Documentation

When adding new endpoints:

1. Update `docs/API.md` with:
   - Endpoint description
   - Request/response examples
   - Error codes and handling
   - Authentication requirements

2. Include cURL examples:

```bash
# Example for new endpoint
curl -X GET "https://peepers.vercel.app/api/new-endpoint" \
  -H "Authorization: Bearer token" \
  -H "Accept: application/json"
```

## Security Guidelines

### Authentication and Authorization

**Never expose secrets**:

```typescript
// ✅ Good
const clientSecret = process.env.ML_CLIENT_SECRET;

// ❌ Bad
const clientSecret = 'hardcoded-secret';
```

**Validate all inputs**:

```typescript
import { z } from 'zod';

const UserInputSchema = z.object({
  email: z.string().email(),
  userId: z.string().min(1)
});

// Validate before processing
const validatedInput = UserInputSchema.parse(userInput);
```

**Implement proper error handling**:

```typescript
// Don't expose internal errors to users
catch (error) {
  logger.error({ error }, 'Internal error');
  
  return NextResponse.json({
    success: false,
    error: 'An error occurred while processing your request'
  }, { status: 500 });
}
```

### Data Protection

**Sanitize logs**:

```typescript
// ✅ Good
logger.info({ userId, productId }, 'Product viewed');

// ❌ Bad
logger.info({ user: fullUserObject }, 'Product viewed');
```

**Secure cookie handling**:

```typescript
response.cookies.set('session_token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 60 * 60 * 24 // 24 hours
});
```

## Performance Guidelines

### Frontend Optimization

**Image optimization**:

```typescript
import Image from 'next/image';

<Image
  src={product.thumbnail}
  alt={product.title}
  width={300}
  height={300}
  className="object-cover rounded-lg"
  loading="lazy"
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

**Efficient caching**:

```typescript
export async function getCachedData<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = CACHE_TTL.DEFAULT
): Promise<T> {
  // Try cache first
  const cached = await kv.get<T>(key);
  if (cached) return cached;
  
  // Fetch and cache
  const fresh = await fetchFn();
  await kv.setex(key, ttl, fresh);
  
  return fresh;
}
```

**Database query optimization**:

```typescript
// Batch requests when possible
const [products, categories, user] = await Promise.all([
  getProducts(),
  getCategories(),
  getUser(userId)
]);
```

## Release Process

### Version Management

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0): Breaking changes
- **MINOR** (0.1.0): New features, backward compatible
- **PATCH** (0.0.1): Bug fixes

### Release Workflow

1. **Prepare release**

   ```bash
   # Update version in package.json
   npm version minor
   
   # Update CHANGELOG.md
   # Update documentation if needed
   ```

2. **Create release PR**

   ```bash
   git checkout -b release/v0.2.0
   git commit -m "chore: prepare release v0.2.0"
   git push origin release/v0.2.0
   ```

3. **Review and merge**

   - Code review by maintainers
   - All tests pass
   - Documentation updated
   - Merge to main

4. **Tag and deploy**

   ```bash
   git tag v0.2.0
   git push origin v0.2.0
   ```

5. **Deploy to production**

   - Automatic deployment via Vercel
   - Monitor deployment health
   - Rollback if issues detected

### Changelog

Maintain `CHANGELOG.md` with:

```markdown
## [0.2.0] - 2025-09-15

### Added
- Product filtering by category
- Enhanced error handling for OAuth flow
- Performance monitoring dashboard

### Changed
- Improved cache invalidation strategy
- Updated UI components for better accessibility

### Fixed
- Redis connection timeout issues
- OAuth state validation edge cases

### Security
- Enhanced input validation
- Updated dependencies for security patches
```

## Issue and Bug Reports

### Bug Reports

Use the bug report template:

```markdown
**Bug Description**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

**Expected Behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment**
- OS: [e.g. Windows 10, macOS 12.0]
- Browser: [e.g. Chrome 91, Firefox 89]
- Version: [e.g. 0.1.1]

**Additional Context**
Any other context about the problem.
```

### Feature Requests

Use the feature request template:

```markdown
**Feature Description**
A clear description of what you want to happen.

**Use Case**
Describe the problem you're trying to solve.

**Proposed Solution**
A clear description of what you want to happen.

**Alternatives Considered**
Other solutions you've considered.

**Additional Context**
Any other context or screenshots about the feature request.
```

## Community

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Questions and general discussion
- **Code Reviews**: Technical discussions on PRs

### Getting Help

1. **Check existing documentation**
2. **Search GitHub issues**
3. **Ask in GitHub Discussions**
4. **Create a new issue if needed**

### Recognition

Contributors will be recognized:

- In the project README
- In release notes for significant contributions
- GitHub contributor metrics

## License

By contributing to Peepers, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Peepers! Your efforts help make this project better for everyone. 🚀