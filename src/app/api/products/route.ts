import { NextRequest, NextResponse } from 'next/server';
import { mlApi, cache } from '@/lib/services';
import { withRateLimit } from '@/core/middleware/rate-limit';
import { handleError } from '@/core/error';

export const runtime = 'edge';

async function handler(request: NextRequest) {
  try {
    const products = await cache.getActiveProducts();
    
    if (!products || products.length === 0) {
      console.log('No cached products found, trying ML API fallback...');
      
      const accessToken = await cache.getUser('access_token');
      const userId = await cache.getUser('user_id');
      const refreshToken = await cache.getUser('refresh_token');

      if (accessToken && userId && refreshToken) {
        mlApi.setAccessToken(accessToken, userId, refreshToken);
        const mlProducts = await mlApi.syncAllProducts();
        
        if (mlProducts.length > 0) {
          await cache.setAllProducts(mlProducts);
          return NextResponse.json({
            products: mlProducts.filter(p => p.status === 'active'),
            total: mlProducts.length,
            last_sync: Date.now()
          });
        }
      }
      
      return NextResponse.json({
        products: [],
        total: 0,
        message: 'No products found. Please sync products first.',
        last_sync: await cache.getLastSyncTime()
      });
    }
    
    return NextResponse.json({
      products,
      total: products.length,
      last_sync: await cache.getLastSyncTime()
    });

  } catch (error) {
    const { error: errorCode, message, status } = handleError(error);
    return NextResponse.json({ error: errorCode, message }, { status });
  }
}

export const GET = withRateLimit(handler);