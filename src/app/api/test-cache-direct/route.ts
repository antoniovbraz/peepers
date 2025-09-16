import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/cache';

export async function GET(_request: NextRequest) {
  try {
    console.log('🔍 Testing cache getAllProducts() directly...');
    
    const cachedProducts = await cache.getAllProducts();
    
    console.log('Cache result:', {
      hasProducts: !!cachedProducts,
      count: cachedProducts?.length || 0,
      type: typeof cachedProducts,
      firstProduct: cachedProducts?.[0]?.id || 'none'
    });
    
    return NextResponse.json({
      success: true,
      cache_test: {
        has_products: !!cachedProducts,
        count: cachedProducts?.length || 0,
        type: typeof cachedProducts,
        first_product_id: cachedProducts?.[0]?.id || null,
        first_product_title: cachedProducts?.[0]?.title || null,
        sample_ids: cachedProducts?.slice(0, 5).map(p => p.id) || []
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Cache test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}