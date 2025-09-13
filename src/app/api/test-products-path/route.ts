import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    console.log('=== PRODUCTS ENDPOINT LOGIC TEST ===');
    
    // Replicate the exact same logic as products endpoint
    console.log('📦 Checking cache for products...');
    const cachedProducts = await cache.getAllProducts();
    
    console.log('Cache result analysis:', {
      raw_type: typeof cachedProducts,
      is_null: cachedProducts === null,
      is_undefined: cachedProducts === undefined,
      is_array: Array.isArray(cachedProducts),
      length: cachedProducts?.length,
      boolean_check: !!cachedProducts,
      length_check: (cachedProducts?.length || 0) > 0,
      combined_check: !!(cachedProducts && cachedProducts.length > 0)
    });
    
    if (cachedProducts && cachedProducts.length > 0) {
      console.log('✅ WOULD USE CACHE PATH');
      return NextResponse.json({
        success: true,
        path_taken: 'cache',
        cached_products_count: cachedProducts.length,
        first_product_id: cachedProducts[0]?.id,
        message: 'Would return cached products'
      });
    } else {
      console.log('❌ WOULD GO TO API PATH - Why?');
      console.log('Debug values:', {
        cachedProducts_truthy: !!cachedProducts,
        length_exists: cachedProducts?.length !== undefined,
        length_value: cachedProducts?.length,
        length_greater_than_zero: (cachedProducts?.length || 0) > 0
      });
      
      return NextResponse.json({
        success: false,
        path_taken: 'api_fallback',
        reason: 'Cache conditional failed',
        debug: {
          cachedProducts_exists: !!cachedProducts,
          length: cachedProducts?.length,
          type: typeof cachedProducts,
          is_array: Array.isArray(cachedProducts)
        },
        message: 'Would try to fetch from ML API (and fail with 401)'
      });
    }
    
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}