/**
 * Multi-Tenant Authentication Middleware
 * 
 * Substitui o sistema ALLOWED_USER_IDS por Organizations
 * Cada usuário pode pertencer a múltiplas organizações
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cache } from '@/lib/cache';
import { logger } from '@/lib/logger';

// Interfaces
interface OrganizationMembership {
  organization_id: string;
  organization_slug: string;
  organization_name: string;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'pending' | 'suspended';
  joined_at: string;
}

interface UserSession {
  user_id: string;
  email: string;
  name: string;
  organizations: OrganizationMembership[];
  current_organization?: string; // org_id
  created_at: string;
  last_seen: string;
}

// Cache keys for multi-tenant
const MT_CACHE_KEYS = {
  USER_SESSION: (token: string) => `session:${token}`,
  USER_ORGANIZATIONS: (userId: string) => `user:${userId}:organizations`,
  ORGANIZATION: (orgId: string) => `organization:${orgId}`,
} as const;

// Routes que não precisam de autenticação
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/termos',
  '/privacidade',
  '/api/health',
  '/api/webhook/stripe',
  '/api/webhook/mercado-livre',
  '/api/auth/signup',
  '/api/auth/mercado-livre',
  '/api/auth/mercado-livre/callback',
  '/produtos'
];

// Routes de admin que precisam de role específica
const ADMIN_ROUTES = [
  '/admin'
];

/**
 * Verifica se uma rota é pública
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => {
    if (route === pathname) return true;
    if (route.endsWith('*') && pathname.startsWith(route.slice(0, -1))) return true;
    return false;
  });
}

/**
 * Verifica se uma rota precisa de permissões admin
 */
function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Extrai session token do cookie ou header
 */
function extractSessionToken(request: NextRequest): string | null {
  // Cookie first (para web app)
  const cookieToken = request.cookies.get('session-token')?.value;
  if (cookieToken) return cookieToken;

  // Authorization header (para API)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

/**
 * Verifica se usuário tem acesso à organização
 */
function hasOrganizationAccess(
  userSession: UserSession,
  organizationId?: string,
  requiredRole?: 'owner' | 'admin' | 'member'
): boolean {
  if (!organizationId) return true; // Sem restrição específica

  const membership = userSession.organizations.find(
    (org: OrganizationMembership) => org.organization_id === organizationId
  );

  if (!membership || membership.status !== 'active') {
    return false;
  }

  if (!requiredRole) return true;

  // Hierarquia: owner > admin > member
  const roleHierarchy = { owner: 3, admin: 2, member: 1 };
  return roleHierarchy[membership.role] >= roleHierarchy[requiredRole];
}

/**
 * Extrai organization_id da URL ou header
 */
function extractOrganizationContext(request: NextRequest): string | null {
  // Header X-Organization-ID (para API)
  const orgHeader = request.headers.get('x-organization-id');
  if (orgHeader) return orgHeader;

  // Query parameter ?org=slug
  const url = new URL(request.url);
  const orgSlug = url.searchParams.get('org');
  if (orgSlug) {
    // Aqui precisaríamos converter slug para ID
    // Por simplicidade, assumimos que org query é o ID
    return orgSlug;
  }

  // Subdomain (futuro): org.peepers.com
  const hostname = request.headers.get('host') || '';
  if (hostname.includes('.') && !hostname.includes('localhost')) {
    const subdomain = hostname.split('.')[0];
    if (subdomain !== 'www' && subdomain !== 'api') {
      return subdomain; // Assumimos que subdomain é org slug
    }
  }

  return null;
}

/**
 * Simula busca de sessão de usuário por enquanto
 */
async function getUserSession(sessionToken: string): Promise<UserSession | null> {
  try {
    // Por enquanto, vamos criar uma sessão mock simples para desenvolvimento
    // TODO: Implementar busca real no banco quando migrarmos
    
    // Simular uma sessão válida baseada no token
    const userSession: UserSession = {
      user_id: 'dev_user_' + sessionToken.substring(0, 8),
      email: 'dev@peepers.com',
      name: 'Developer User',
      organizations: [
        {
          organization_id: 'org_dev_1',
          organization_slug: 'dev-organization',
          organization_name: 'Development Organization',
          role: 'owner',
          status: 'active',
          joined_at: new Date().toISOString()
        }
      ],
      current_organization: 'org_dev_1',
      created_at: new Date().toISOString(),
      last_seen: new Date().toISOString()
    };
    
    return userSession;
    
  } catch (error) {
    logger.error('Error getting user session');
    return null;
  }
}

/**
 * Middleware principal
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files e API internos
  if (pathname.startsWith('/_next/') || 
      pathname.startsWith('/static/') ||
      pathname.includes('.')) {
    return NextResponse.next();
  }

  logger.info(`Processing request: ${request.method} ${pathname}`);

  // Routes públicas passam direto
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Extrair token de sessão
  const sessionToken = extractSessionToken(request);
  if (!sessionToken) {
    logger.warn(`No session token found for ${pathname}`);
    
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    // Buscar sessão do usuário
    const userSession = await getUserSession(sessionToken);
    
    if (!userSession) {
      throw new Error('Invalid session token');
    }

    // Verificar se usuário tem organizações
    if (userSession.organizations.length === 0) {
      // Usuário sem organizações - redirecionar para onboarding
      if (pathname !== '/onboarding') {
        const onboardingUrl = new URL('/onboarding', request.url);
        return NextResponse.redirect(onboardingUrl);
      }
    }

    // Extrair contexto da organização
    const organizationId = extractOrganizationContext(request);

    // Verificar acesso admin se necessário
    if (isAdminRoute(pathname)) {
      const hasAccess = hasOrganizationAccess(
        userSession,
        organizationId || undefined,
        'admin'
      );

      if (!hasAccess) {
        logger.warn(`Admin access denied for user ${userSession.user_id} on ${pathname}`);

        if (pathname.startsWith('/api/')) {
          return NextResponse.json(
            { error: 'Admin access required' },
            { status: 403 }
          );
        }

        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    // Verificar acesso à organização específica
    if (organizationId) {
      const hasAccess = hasOrganizationAccess(userSession, organizationId);

      if (!hasAccess) {
        logger.warn(`Organization access denied for user ${userSession.user_id} to org ${organizationId}`);

        if (pathname.startsWith('/api/')) {
          return NextResponse.json(
            { error: 'Organization access denied' },
            { status: 403 }
          );
        }

        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    // Adicionar headers para a aplicação
    const response = NextResponse.next();
    response.headers.set('x-user-id', userSession.user_id);
    response.headers.set('x-user-email', userSession.email);
    
    if (organizationId) {
      response.headers.set('x-organization-id', organizationId);
    }

    // Adicionar organização padrão se não especificada
    if (!organizationId && userSession.organizations.length > 0) {
      const defaultOrg = userSession.current_organization || 
                         userSession.organizations[0].organization_id;
      response.headers.set('x-organization-id', defaultOrg);
    }

    logger.info(`Request authorized for user ${userSession.user_id} (${userSession.email})`);

    return response;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Authentication error on ${pathname}: ${errorMessage}`);

    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    loginUrl.searchParams.set('error', 'session_expired');
    
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('session-token');
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /_next/ (Next.js internals)
     * 2. /static/ (static files)
     * 3. favicon.ico, sitemap.xml, robots.txt (static files)
     * 4. Files with extensions (.js, .css, etc.)
     */
    '/((?!_next/|static/|favicon.ico|sitemap.xml|robots.txt|.*\\.).*)',
  ],
};