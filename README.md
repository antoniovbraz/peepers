# Peepers - Mercado Livre Integration

This is a **single-tenant e-commerce platform** for Mercado Livre sellers, bootstrapped with [`create-next-app`](https://next.js.org/docs/app/api-reference/cli/create-next-app).

## Business Model

**Single-Tenant Architecture**: Each instance serves exactly one Mercado Livre seller account. This ensures:

- Complete data isolation between sellers
- Customized configurations per store
- Enhanced security and performance
- Dedicated support and maintenance

**Access Control**:

- **Public**: Product catalog (`/produtos`) - accessible to all visitors
- **Restricted**: Admin panel (`/admin`) - only the configured seller account
- **Sales Funnel**: Unauthorized sellers see professional sales page with contact info

## Current Configuration

This instance is configured exclusively for **Mercado Livre seller ID: 669073070**.
Other sellers will see an "Access Denied" page with sales information.his is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Limitations

This project uses [Vercel KV](https://vercel.com/docs/storage/vercel-kv) to cache data. Operations that need to inspect or clear
the cache rely on iterating over keys with `scan`. Scanning is appropriate for small and medium datasets but it requires reading
through all matching keys and cannot efficiently paginate very large key sets.

## Environment Variables

Set the following variable to configure absolute URLs used in API calls and OAuth redirects:

- `NEXT_PUBLIC_APP_URL` – Base URL of the application (e.g., `https://peepers.vercel.app`).

## API Authentication

### Authentication Flow

1. **Login**: Users authenticate via Mercado Livre OAuth at `/api/auth/mercado-livre`
2. **Callback**: OAuth tokens are exchanged and stored securely at `/api/auth/mercado-livre/callback`
3. **Session**: Secure HTTP-only cookies are created for session management
4. **Verification**: All protected routes verify session cookies via middleware

### Protected Routes

The following routes require authentication:

- `/admin` - Administrative dashboard
- `/api/sync/*` - Product synchronization
- `/api/products` - Product data access
- `/api/auth/logout` - Session termination

### Security Features

- **HTTP-only Cookies**: Session tokens cannot be accessed via JavaScript
- **Secure Cookies**: HTTPS-only in production
- **Session Validation**: Server-side session verification
- **User Authorization**: Configurable allowed user IDs via `ALLOWED_USER_IDS` env var
- **Token Expiration**: Automatic session cleanup

### Required Environment Variables

Set the following variables for authentication:

```bash
# Mercado Livre OAuth
ML_CLIENT_ID=your_client_id
ML_CLIENT_SECRET=your_client_secret
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Security (optional)
ALLOWED_USER_IDS=123456789,987654321
```

### Admin Routes

**Note**: Routes mentioned in the original documentation that don't exist:

- ❌ `POST /api/ml/sync` (use `POST /api/sync` instead)
- ❌ `POST /api/products/[id]` (use `GET /api/products` for listing)

**Correct admin routes**:

- ✅ `GET /api/products-public` - Public product catalog (homepage)
- ✅ `POST /api/sync` - Synchronize products
- ✅ `GET /api/products` - Authenticated product management
- ✅ `GET /api/auth/me` - Get current user session

## Runtime Requirements

The `/api/ml/webhook` endpoint uses `revalidatePath` to update ISR pages and therefore runs on the Node.js runtime rather than the Edge runtime.

## 🔒 Security Architecture

### OAuth 2.0 with PKCE Flow

- **Secure Authorization**: Code flow with PKCE protection
- **HTTP-only Cookies**: Session management without client-side access
- **Middleware Protection**: Route-level access control
- **Single User Architecture**: Exclusive admin access with sales funnel

### Access Control Model

- **Public Routes**: Homepage, product catalog, login page
- **Protected Routes**: Admin dashboard, authenticated APIs
- **API Separation**: Public vs authenticated endpoints
- **Session Validation**: Automatic token refresh and validation

### Security Features Implemented

- ✅ CSRF Protection via HTTP-only cookies
- ✅ XSS Prevention with proper sanitization
- ✅ Secure redirect handling
- ✅ Rate limiting on sensitive endpoints
- ✅ Input validation and sanitization

## 🔧 Troubleshooting & Maintenance

### Common Issues

**Products not loading on homepage:**

```bash
# Check public API endpoint
curl -X GET http://localhost:3000/api/products-public

# Verify middleware configuration
npm run build
```

**Authentication issues:**

```bash
# Clear cookies and retry login
# Check OAuth configuration in Mercado Livre
# Verify environment variables
```

**Build failures:**

```bash
# Clean install dependencies
rm -rf node_modules package-lock.json
npm install

# Clear Next.js cache
rm -rf .next
npm run build
```

### Maintenance Tasks

**Weekly:**

- Monitor error logs in Vercel dashboard
- Check Mercado Livre API rate limits
- Review authentication success rates

**Monthly:**

- Update dependencies: `npm audit fix`
- Review and rotate API credentials
- Backup configuration and data

**Security:**

- Monitor for OAuth token leaks
- Review access logs for suspicious activity
- Update security dependencies promptly
