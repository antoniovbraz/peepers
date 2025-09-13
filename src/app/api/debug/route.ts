import { NextResponse } from 'next/server';
import { cache } from '@/lib/cache';

// Endpoint de debug para verificar o status da autenticação
export async function GET() {
  try {
    const debug: any = {
      timestamp: new Date().toISOString(),
      environment: {
        ML_CLIENT_ID: !!process.env.ML_CLIENT_ID,
        ML_CLIENT_SECRET: !!process.env.ML_CLIENT_SECRET,
        ADMIN_SECRET: !!process.env.ADMIN_SECRET,
        NODE_ENV: process.env.NODE_ENV,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL
      },
      cache_check: {
        cache_available: !!cache,
      }
    };

    // Tentar verificar usuários no cache
    try {
      const knownUserId = '669073070';
      const tokenData = await cache.getUser(`access_token:${knownUserId}`);
      debug.cache_check.user_token = !!tokenData;
      debug.cache_check.token_has_refresh = !!(tokenData && tokenData.refresh_token);
      debug.cache_check.token_expires_at = tokenData ? tokenData.expires_at : null;
      
      if (tokenData && tokenData.expires_at) {
        const expiryDate = new Date(tokenData.expires_at);
        const now = new Date();
        debug.cache_check.token_expired = expiryDate <= now;
        debug.cache_check.time_until_expiry = expiryDate.getTime() - now.getTime();
      }
    } catch (cacheError: any) {
      debug.cache_check.error = cacheError?.message || 'Unknown cache error';
    }

    // Verificar produtos no cache
    try {
      const products = await cache.getActiveProducts();
      debug.cache_check.products_count = products ? products.length : 0;
    } catch (error: any) {
      debug.cache_check.products_error = error?.message || 'Unknown products error';
    }

    return NextResponse.json(debug, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      error: 'Debug failed',
      message: error?.message || 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}