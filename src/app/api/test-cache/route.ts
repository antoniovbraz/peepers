import { NextResponse } from "next/server";
import { cache } from "@/lib/cache";

export async function GET() {
  try {
    console.log('Testing cache.getAllProducts()...');
    
    const allProducts = await cache.getAllProducts();
    const activeProducts = await cache.getActiveProducts();
    
    console.log('Cache test results:', {
      allProducts: {
        hasResult: !!allProducts,
        count: allProducts?.length || 0,
        firstProduct: allProducts?.[0]?.id || 'none'
      },
      activeProducts: {
        hasResult: !!activeProducts,
        count: activeProducts?.length || 0,
        firstProduct: activeProducts?.[0]?.id || 'none'
      }
    });
    
    return NextResponse.json({
      success: true,
      test: 'cache.getAllProducts()',
      results: {
        allProducts: {
          hasResult: !!allProducts,
          count: allProducts?.length || 0,
          sample: allProducts?.slice(0, 2) || []
        },
        activeProducts: {
          hasResult: !!activeProducts,
          count: activeProducts?.length || 0,
          sample: activeProducts?.slice(0, 2) || []
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Cache test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      test: 'cache.getAllProducts()'
    }, { status: 500 });
  }
}