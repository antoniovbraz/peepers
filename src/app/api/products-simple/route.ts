import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/cache';

export async function GET(_request: NextRequest) {
  try {
    console.log('🚀 Simple Products API called');
    
    // Simply try to get cache and return basic info
    const cachedProducts = await cache.getAllProducts();
    
    if (cachedProducts && cachedProducts.length > 0) {
      console.log(`✅ Cache found: ${cachedProducts.length} products`);
      
      // Ultra simple transformation - just return basic data
      const basicProducts = cachedProducts.slice(0, 10).map((p: any) => ({
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
        message: 'Products loaded from cache successfully'
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