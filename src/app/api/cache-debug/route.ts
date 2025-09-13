import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const userId = process.env.ML_USER_ID || '669073070';
    
    // Check different cache keys
    const checks = {
      user_token: await cache.getUser(userId),
      cached_products_all: await cache.getAllProducts(),
      cached_products_active: await cache.getActiveProducts(),
      last_sync: await cache.getLastSyncTime()
    };
    
    return NextResponse.json({
      success: true,
      user_id: userId,
      cache_checks: {
        user_token_exists: !!checks.user_token,
        user_token_data: checks.user_token ? {
          user_id: checks.user_token.user_id,
          token_length: checks.user_token.token?.length || 0,
          has_refresh_token: !!checks.user_token.refresh_token
        } : null,
        cached_products_all_count: checks.cached_products_all?.length || 0,
        cached_products_active_count: checks.cached_products_active?.length || 0,
        last_sync: checks.last_sync
      },
      environment: {
        ML_CLIENT_ID: process.env.ML_CLIENT_ID ? 'Set' : 'Missing',
        ML_CLIENT_SECRET: process.env.ML_CLIENT_SECRET ? 'Set' : 'Missing',
        ML_USER_ID: process.env.ML_USER_ID || 'Using default: 669073070',
        UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL ? 'Set' : 'Missing'
      }
    });
    
  } catch (error) {
    console.error('Cache debug error:', error);
    
    return NextResponse.json(
      { 
        error: 'Cache debug failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}