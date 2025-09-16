import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/cache';
import { MLProduct } from '@/types/ml';

export async function GET(_request: NextRequest) {
  try {
    // ⚠️ DEPRECATION WARNING - Added Phase 3
    console.warn('⚠️ [DEPRECATED] /api/products-simple is deprecated. Use /api/v1/products?format=minimal instead');
    
    console.log('🚀 Simple Products API called');
    
    // Simply try to get cache and return basic info
    const cachedProducts = await cache.getAllProducts();
    
    if (cachedProducts && cachedProducts.length > 0) {
      console.log(`✅ Cache found: ${cachedProducts.length} products`);
      
      // Ultra simple transformation - just return basic data
      const basicProducts = cachedProducts.slice(0, 10).map((p: MLProduct) => ({
        id: p.id,
        title: p.title,
        price: p.price,
        status: p.status
      }));
      
      return NextResponse.json({
        success: true,
        source: 'cache',
        count: cachedProducts.length,
        sample: basicProducts,
        message: 'Products loaded from cache successfully',
        // ⚠️ DEPRECATION WARNING - Added Phase 3
        deprecation: {
          warning: "This endpoint is deprecated. Use /api/v1/products?format=minimal&limit=10 instead",
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
    
    return NextResponse.json({
      success: false,
      message: 'No cache found',
      source: 'none'
    });
    
  } catch (error) {
    console.error('Simple products error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}