// Backup do middleware atual antes da simplificação
import { PAGES } from '@/config/routes';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cache } from '@/lib/cache';
import { logger } from '@/lib/logger';
import { MIDDLEWARE_CONFIG } from '@/config/routes';
import { corsHandler } from '@/lib/cors';
import { stripeClient } from '@/lib/stripe';
import { entitlementsManager } from '@/lib/entitlements';
import { PREMIUM_FEATURES } from '@/config/entitlements';
import type { PeepersFeature } from '@/types/stripe';
import { TenantMiddleware } from '@/infrastructure/middleware/TenantMiddleware';
import { isSuperAdmin } from '@/config/platform-admin';

// ... resto do código atual