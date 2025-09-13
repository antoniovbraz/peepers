import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing getAllProducts vs cache behavior...');
    
    // Test 1: Direct getAllProducts (like cache-debug does)
    const cachedProducts = await cache.getAllProducts();
    console.log('Test 1 - getAllProducts result:', {
      type: typeof cachedProducts,
      isArray: Array.isArray(cachedProducts),
      length: cachedProducts?.length || 0,
      hasData: !!cachedProducts
    });
    
    // Test 2: Same conditional logic as products endpoint
    if (cachedProducts && cachedProducts.length > 0) {
      console.log('Test 2 - Would return cache:', true);
    } else {
      console.log('Test 2 - Would bypass cache:', { cachedProducts: !!cachedProducts, length: cachedProducts?.length });
    }
    
    // Test 3: Check the token separately
    const knownUserId = "669073070";
    const tokenData = await cache.getUser(`access_token:${knownUserId}`);
    console.log('Test 3 - Token check:', {
      hasToken: !!tokenData,
      hasAccessToken: !!tokenData?.access_token,
      tokenLength: (tokenData?.access_token as string)?.length || 0
    });
    
    return NextResponse.json({
      success: true,
      results: {
        cached_products_available: !!cachedProducts,
        cached_products_count: cachedProducts?.length || 0,
        would_use_cache: !!(cachedProducts && cachedProducts.length > 0),
        token_available: !!tokenData?.access_token,
        cache_sample: cachedProducts?.slice(0, 2) || null
      }
    });
    
  } catch (error) {
    console.error('Debug test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}