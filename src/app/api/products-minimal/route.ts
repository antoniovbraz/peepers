import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/cache';

export async function GET(_request: NextRequest) {
  try {
    // ⚠️ DEPRECATION WARNING - Added Phase 3
    console.warn('⚠️ [DEPRECATED] /api/products-minimal is deprecated. Use /api/v1/products?format=minimal instead');
    
    console.log('🚀 MINIMAL Products API called');
    
    // Test 1: Check cache
    const cachedProducts = await cache.getAllProducts();
    console.log('Cache check:', {
      exists: !!cachedProducts,
      length: cachedProducts?.length,
      type: typeof cachedProducts
    });
    
    if (cachedProducts && cachedProducts.length > 0) {
      console.log('✅ Returning first 3 products without transformation');
      
      // Return raw cache data without any transformation
      return NextResponse.json({
        success: true,
        total: cachedProducts.length,
        products: cachedProducts.slice(0, 3), // Just first 3 without transformation
        source: 'cache_raw',
        message: `Found ${cachedProducts.length} products in cache`,
        // ⚠️ DEPRECATION WARNING - Added Phase 3
        deprecation: {
          warning: "This endpoint is deprecated. Use /api/v1/products?format=minimal&limit=3 instead",
          migration_url: "/api/v1/products",
          sunset_date: "2025-12-31"
        }
      }, {
        headers: {
          'Deprecation': 'true',
          'Sunset': '2025-12-31',
          'Link': '</api/v1/products>; rel="successor-version"'
        }
      });
    }
    
    // If no cache, return simple error
    return NextResponse.json({
      success: false,
      error: "No cached products found",
      message: "Cache is empty - would need to sync products first"
    }, { status: 404 });
    
  } catch (error) {
    console.error('Minimal Products API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}