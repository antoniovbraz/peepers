import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
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
        message: `Found ${cachedProducts.length} products in cache`
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