import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cache } from '@/lib/cache';
import { stripeClient } from '@/lib/stripe';

/**
 * Middleware that enforces session validation and entitlements for protected routes.
 * Minimal implementation used by integration tests: checks session_token -> cache.getUser,
 * verifies session match, and calls stripeClient.checkEntitlement for admin/API protected features.
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  console.log(`🔍 Simple middleware processing: ${pathname}`);

  const sessionToken = request.cookies.get('session_token')?.value;
  const userId = request.cookies.get('user_id')?.value;

  // Attach debug headers for tests
  const response = NextResponse.next();
  response.headers.set('x-pathname', pathname);
  response.headers.set('x-url', request.nextUrl.toString());

  // If no cookies present, redirect to login for protected admin routes
  if (!sessionToken || !userId) {
    // Allow public endpoints
    if (pathname.startsWith('/api/products') || pathname.startsWith('/public')) return response;
  return NextResponse.redirect(new URL('/login', request.nextUrl), { status: 307 });
  }

  // Validate session against cache
  try {
    const user = await cache.getUser?.(userId as string);
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.nextUrl), { status: 307 });
    }

    // session token mismatch => expired/invalid session
    if (user.session_token && user.session_token !== sessionToken) {
      return NextResponse.redirect(new URL('/login', request.nextUrl), { status: 307 });
    }

    // Determine if entitlement check is required
    const isAdminPath = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
    const isProductsPublic = pathname.startsWith('/api/products-public');

    if (isAdminPath) {
      // Admin features require 'advanced_analytics' entitlement
      try {
        const result = await stripeClient.checkEntitlement?.(userId, 'advanced_analytics');
  if (result && result.allowed) return response;
  return NextResponse.redirect(new URL('/upgrade', request.nextUrl), { status: 307 });
      } catch (e) {
        // On external failure, allow access to avoid downtime
        console.warn('Stripe entitlement check failed:', e);
        return response;
      }
    }

    if (isProductsPublic) {
      try {
        const result = await stripeClient.checkEntitlement?.(userId, 'api_access');
  if (result && result.allowed) return response;
  return NextResponse.redirect(new URL('/upgrade', request.nextUrl), { status: 307 });
      } catch (e) {
        console.warn('Stripe entitlement check failed:', e);
        return response;
      }
    }

    // For other API paths (e.g., /api/products) allow basic features
    return response;
  } catch (err) {
    console.error('Middleware error validating session/entitlements', err);
    return response;
  }
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/api/products',
    '/api/products-public'
  ]
};