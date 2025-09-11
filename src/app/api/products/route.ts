import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/cache';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    console.log('Products API called');
    
    // Try to get products from cache first
    const products = await cache.getActiveProducts();
    console.log('Products from cache:', products ? products.length : 0);

    // If no cached products, return empty with sync suggestion
    if (!products || products.length === 0) {
      console.log('No cached products found');
      
      return NextResponse.json({
        products: [],
        total: 0,
        message: 'No products found. Please sync products first.',
        last_sync: await cache.getLastSyncTime()
      });
    }

    // Transform products for frontend display
    const transformedProducts = products.map(product => ({
      id: product.id,
      title: product.title,
      price: product.price,
      currency_id: product.currency_id,
      available_quantity: product.available_quantity,
      condition: product.condition,
      thumbnail: product.secure_thumbnail || product.thumbnail,
      pictures: product.pictures?.slice(0, 3) || [], // Limit pictures for performance
      permalink: product.permalink,
      status: product.status,
      shipping: {
        free_shipping: product.shipping?.free_shipping || false,
        local_pick_up: product.shipping?.local_pick_up || false
      },
      attributes: product.attributes?.filter(attr => 
        ['BRAND', 'MODEL', 'COLOR', 'SIZE'].includes(attr.id)
      ).slice(0, 3) || [], // Only show key attributes
      category_id: product.category_id
    }));

    console.log('Returning', transformedProducts.length, 'transformed products');

    return NextResponse.json({
      products: transformedProducts,
      total: transformedProducts.length,
      last_sync: await cache.getLastSyncTime()
    });

  } catch (error) {
    console.error('Products API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to load products',
        message: error instanceof Error ? error.message : 'Unknown error',
        products: [],
        total: 0
      },
      { status: 500 }
    );
  }
}

// Get product categories for filtering
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    if (action === 'get_categories') {
      // Get unique categories from cached products
      const products = (await cache.getActiveProducts()) || [];
      
      const categoryMap = new Map();
      
      for (const product of products) {
        if (!categoryMap.has(product.category_id)) {
          categoryMap.set(product.category_id, {
            id: product.category_id,
            count: 1
          });
        } else {
          const existing = categoryMap.get(product.category_id);
          existing.count++;
        }
      }
      
      const categories = Array.from(categoryMap.values());
      
      return NextResponse.json({
        categories,
        total_categories: categories.length
      });
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Products POST API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
