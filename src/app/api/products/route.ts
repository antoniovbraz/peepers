import { NextRequest, NextResponse } from 'next/server';
import { mlApi } from '@/lib/ml-api';
import { cache } from '@/lib/cache';
import { MLProduct } from '@/types/ml';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'active' | 'all' | null;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    // Try to get products from cache first
    let products: MLProduct[] = [];
    
    if (status === 'all') {
      products = (await cache.getAllProducts()) || [];
    } else {
      // Default to active products
      products = (await cache.getActiveProducts()) || [];
    }

    // If no cached products, try to sync
    if (products.length === 0) {
      console.log('No cached products found, attempting sync...');
      
      try {
        const freshProducts = await mlApi.syncAllProducts();
        await cache.setAllProducts(freshProducts);
        
        products = status === 'all' ? freshProducts : freshProducts.filter(p => p.status === 'active');
      } catch (error) {
        console.error('Failed to sync products:', error);
        
        return NextResponse.json(
          { 
            error: 'Products not available',
            message: 'Failed to load products from cache and API',
            products: [],
            total: 0
          },
          { status: 503 }
        );
      }
    }

    // Apply filters
    let filteredProducts = products;

    if (category) {
      filteredProducts = filteredProducts.filter(p => p.category_id === category);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredProducts = filteredProducts.filter(p => 
        p.title.toLowerCase().includes(searchLower) ||
        p.attributes.some(attr => 
          attr.name.toLowerCase().includes(searchLower) ||
          attr.value_name?.toLowerCase().includes(searchLower)
        )
      );
    }

    // Apply pagination
    const total = filteredProducts.length;
    const paginatedProducts = filteredProducts.slice(offset, offset + limit);

    // Transform products for frontend (remove sensitive data, optimize for display)
    const transformedProducts = paginatedProducts.map(product => ({
      id: product.id,
      title: product.title,
      price: product.price,
      currency_id: product.currency_id,
      available_quantity: product.available_quantity,
      condition: product.condition,
      thumbnail: product.secure_thumbnail || product.thumbnail,
      pictures: product.pictures.slice(0, 5), // Limit pictures for performance
      permalink: product.permalink,
      status: product.status,
      shipping: {
        free_shipping: product.shipping.free_shipping,
        local_pick_up: product.shipping.local_pick_up
      },
      attributes: product.attributes.filter(attr => 
        ['BRAND', 'MODEL', 'COLOR', 'SIZE'].includes(attr.id)
      ).slice(0, 5), // Only show key attributes
      category_id: product.category_id,
      last_updated: product.last_updated
    }));

    return NextResponse.json({
      products: transformedProducts,
      pagination: {
        total,
        limit,
        offset,
        has_more: offset + limit < total
      },
      filters: {
        status: status || 'active',
        category,
        search
      },
      cache_info: {
        cached: true,
        last_sync: await cache.getLastSyncTime()
      }
    });

  } catch (error) {
    console.error('Products API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
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
