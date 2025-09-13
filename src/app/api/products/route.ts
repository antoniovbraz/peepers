import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Products API called - FIXED SIMPLE VERSION');
    
    // Test 1: Check cache
    const cachedProducts = await cache.getAllProducts();
    console.log('Cache check:', {
      exists: !!cachedProducts,
      length: cachedProducts?.length,
      type: typeof cachedProducts
    });
    
    if (cachedProducts && cachedProducts.length > 0) {
      console.log('✅ Returning first 3 products without transformation');
      
      // Return comprehensive response for frontend
      return NextResponse.json({
        success: true,
        total: cachedProducts.length,
        products: cachedProducts.slice(0, 50).map(p => ({ // Limit to 50 for performance
          id: p.id,
          title: p.title,
          price: p.price,
          status: p.status,
          thumbnail: p.pictures && p.pictures.length > 0 
            ? p.pictures[0].secure_url || p.pictures[0].url 
            : p.secure_thumbnail || p.thumbnail,
          available_quantity: p.available_quantity || 0,
          condition: p.condition || 'not_specified',
          currency_id: p.currency_id,
          shipping: {
            free_shipping: p.shipping?.free_shipping || false
          }
        })),
        source: 'cache',
        message: `${cachedProducts.length} produtos encontrados no cache`
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