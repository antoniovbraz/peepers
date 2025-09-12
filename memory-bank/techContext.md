---
title: "Tech Context - Peepers.com.br"
schema_version: 1
owner: "Antonio Henrique Vanucci"
last_review: "2025-09-11"
status: "active"
---

# Tech Context - Peepers.com.br

## Stack Principal
- **Framework:** Next.js 14+ (App Router)
- **Linguagem:** TypeScript
- **Styling:** TailwindCSS
- **Hosting:** Vercel
- **Cache:** Redis (Upstash)
- **Database:** PostgreSQL (Neon)
- **API Integration:** Mercado Livre API

## Dependências Principais

### Core Dependencies
```json
{
  "next": "^14.0.0",
  "react": "^18.0.0",
  "react-dom": "^18.0.0",
  "typescript": "^5.0.0"
}
```

### Styling & UI
```json
{
  "tailwindcss": "^3.3.0",
  "autoprefixer": "^10.4.0",
  "postcss": "^8.4.0",
  "@tailwindcss/typography": "^0.5.0",
  "@tailwindcss/forms": "^0.5.0",
  "lucide-react": "^0.292.0",
  "clsx": "^2.0.0",
  "tailwind-merge": "^2.0.0"
}
```

### Data & API
```json
{
  "redis": "^4.6.0",
  "@vercel/kv": "^1.0.0",
  "pg": "^8.11.0",
  "@types/pg": "^8.10.0",
  "prisma": "^5.6.0",
  "@prisma/client": "^5.6.0"
}
```

### Utilities
```json
{
  "zod": "^3.22.0",
  "date-fns": "^2.30.0",
  "jose": "^5.1.0",
  "nanoid": "^5.0.0"
}
```

### Development
```json
{
  "@types/node": "^20.0.0",
  "@types/react": "^18.0.0",
  "@types/react-dom": "^18.0.0",
  "eslint": "^8.0.0",
  "eslint-config-next": "^14.0.0",
  "@typescript-eslint/eslint-plugin": "^6.0.0",
  "@typescript-eslint/parser": "^6.0.0"
}
```

## Estrutura de Diretórios

```
peepers-website/
├── src/
│   ├── app/                    # App Router pages
│   │   ├── (marketing)/        # Marketing pages group
│   │   │   ├── page.tsx        # Homepage
│   │   │   ├── sobre/          # About page
│   │   │   └── contato/        # Contact page
│   │   ├── produtos/           # Products pages
│   │   │   ├── page.tsx        # Products listing
│   │   │   └── [id]/           # Individual product
│   │   ├── blog/               # Blog pages
│   │   │   ├── page.tsx        # Blog listing
│   │   │   └── [slug]/         # Individual post
│   │   ├── admin/              # Admin pages
│   │   │   ├── page.tsx        # Admin dashboard
│   │   │   └── layout.tsx      # Admin layout
│   │   ├── api/                # API routes
│   │   │   ├── ml/             # Mercado Livre integration
│   │   │   │   ├── auth/       # OAuth flow
│   │   │   │   ├── webhook/    # Webhook handler
│   │   │   │   └── sync/       # Manual sync
│   │   │   ├── products/       # Products API
│   │   │   └── questions/      # Q&A API
│   │   ├── globals.css         # Global styles
│   │   ├── layout.tsx          # Root layout
│   │   └── loading.tsx         # Global loading
│   ├── components/             # React components
│   │   ├── ui/                 # Base UI components
│   │   ├── layout/             # Layout components
│   │   ├── products/           # Product components
│   │   ├── blog/               # Blog components
│   │   └── admin/              # Admin components
│   ├── lib/                    # Utility functions
│   │   ├── ml-api.ts           # ML API client
│   │   ├── cache.ts            # Cache utilities
│   │   ├── db.ts               # Database client
│   │   ├── auth.ts             # Auth utilities
│   │   └── utils.ts            # General utilities
│   ├── types/                  # TypeScript types
│   │   ├── ml.ts               # ML API types
│   │   ├── product.ts          # Product types
│   │   └── global.ts           # Global types
│   └── hooks/                  # Custom React hooks
│       ├── use-products.ts     # Products hook
│       └── use-questions.ts    # Questions hook
├── public/                     # Static assets
│   ├── icons/                  # App icons
│   ├── images/                 # Images
│   └── manifest.json           # PWA manifest
├── prisma/                     # Database schema
│   ├── schema.prisma           # Prisma schema
│   └── migrations/             # DB migrations
├── .env.local                  # Environment variables
├── .env.example                # Environment template
├── next.config.js              # Next.js config
├── tailwind.config.js          # Tailwind config
├── tsconfig.json               # TypeScript config
├── vercel.json                 # Vercel config
└── package.json                # Dependencies
```

## Configurações Específicas

### Next.js Configuration
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pg']
  },
  images: {
    domains: [
      'http2.mlstatic.com',
      'mla-s1-p.mlstatic.com',
      'mla-s2-p.mlstatic.com'
    ]
  },
  async rewrites() {
    return [
      {
        source: '/produtos/:path*',
        destination: '/products/:path*'
      }
    ];
  }
};
```

### Vercel Configuration
```json
{
  "functions": {
    "src/app/api/ml/webhook/route.ts": {
      "maxDuration": 10
    }
  },
  "crons": [
    {
      "path": "/api/ml/sync",
      "schedule": "0 */2 * * *"
    }
  ],
  "env": {
    "ML_CLIENT_ID": "@ml_client_id",
    "ML_CLIENT_SECRET": "@ml_client_secret",
    "REDIS_URL": "@redis_url",
    "DATABASE_URL": "@database_url"
  }
}
```

### Environment Variables
```bash
# .env.example
# Mercado Livre API
ML_CLIENT_ID=your_client_id
ML_CLIENT_SECRET=your_client_secret
ML_ACCESS_TOKEN=your_access_token
ML_REFRESH_TOKEN=your_refresh_token
ML_USER_ID=your_user_id

# Database
DATABASE_URL=postgresql://user:pass@host:port/db
REDIS_URL=redis://user:pass@host:port

# App
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=https://peepers.com.br

# Vercel (auto-populated)
VERCEL_URL=
VERCEL_ENV=
```

## PWA Configuration

### Manifest
```json
{
  "name": "Peepers - Produtos de Qualidade",
  "short_name": "Peepers",
  "description": "Vitrine oficial da Peepers com produtos do Mercado Livre",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

## Performance Targets
- **First Contentful Paint:** < 1.5s
- **Largest Contentful Paint:** < 2.5s
- **Cumulative Layout Shift:** < 0.1
- **First Input Delay:** < 100ms
- **Time to Interactive:** < 3s

## Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari 14+, Chrome Mobile 90+)

## Development Workflow
1. **Local Development:** `npm run dev`
2. **Type Checking:** `npm run type-check`
3. **Linting:** `npm run lint`
4. **Building:** `npm run build`
5. **Testing:** `npm run test` (future)
6. **Deploy:** Git push to main → Vercel auto-deploy
