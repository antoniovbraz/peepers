import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/cache';
import { createMercadoLivreAPI } from '@/lib/ml-api';
import { PAGES } from '@/config/routes';
import { validateInput, SyncOptionsSchema } from '@/lib/validation';

const mlApi = createMercadoLivreAPI(
  { fetch },
  {
    clientId: process.env.ML_CLIENT_ID!,
    clientSecret: process.env.ML_CLIENT_SECRET!,
    accessToken: process.env.ML_ACCESS_TOKEN,
    refreshToken: process.env.ML_REFRESH_TOKEN,
    userId: process.env.ML_USER_ID
  }
);

export async function GET(request: NextRequest) {
  try {
    console.log('Sync API called');

    // Validate query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams);
    const validation = validateInput(SyncOptionsSchema, queryParams);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid sync parameters', details: validation.error },
        { status: 400 }
      );
    }

    const { clear_cache, max_products } = validation.data;
    
    // Get user ID and token from cache
    const userId = process.env.ML_USER_ID || '669073070';
    const tokenData = await cache.getUser(userId);
    
    if (!tokenData || !tokenData.token) {
      return NextResponse.json(
        { 
          error: 'No authentication found',
          message: 'Configure ML_ACCESS_TOKEN e ML_REFRESH_TOKEN nas variáveis de ambiente',
          docs_url: PAGES.ADMIN
        },
        { status: 401 }
      );
    }
    
    console.log('Setting up ML API with token');
    
    // Set token in ML API instance
    mlApi.setAccessToken(
      tokenData.token, 
      tokenData.user_id.toString(),
      tokenData.refresh_token
    );
    
    // Clear cache if requested
    if (clear_cache) {
      console.log('Clearing existing cache...');
      await cache.invalidateProductsCache();
    }

    // Fetch products from ML API
    console.log('Fetching products from ML API...');
    const mlProducts = await mlApi.syncAllProducts();
    console.log(`Fetched ${mlProducts.length} products from ML API`);

    // Limit products if specified
    const limitedProducts = max_products ? mlProducts.slice(0, max_products) : mlProducts;
    if (max_products && mlProducts.length > max_products) {
      console.log(`Limiting to ${max_products} products as requested`);
    }
    
    if (limitedProducts.length > 0) {
      // Store products in cache
      console.log('Storing products in cache...');
      await cache.setAllProducts(limitedProducts);
      
      console.log('Products stored successfully');
    }
    
    // Get active products for response
    const activeProducts = limitedProducts.filter(p => p.status === 'active');
    const pausedProducts = limitedProducts.filter(p => p.status === 'paused');
    
    return NextResponse.json({
      success: true,
      message: 'Sincronização realizada com sucesso',
      total_fetched: mlProducts.length,
      total_stored: limitedProducts.length,
      active_products: activeProducts.length,
      paused_products: pausedProducts.length,
      last_sync: new Date().toISOString(),
      sample_products: mlProducts.slice(0, 3).map(p => ({
        id: p.id,
        title: p.title,
        price: p.price,
        status: p.status,
        available_quantity: p.available_quantity
      }))
    });
    
  } catch (error) {
    console.error('Sync API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Sync failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Force sync endpoint
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    if (action === 'force_sync') {
      console.log('Force sync requested');
      
      // Clear cache first
      await cache.clearAllCache();
      console.log('Cache cleared');
      
      // Then call the GET endpoint logic
      return GET(request);
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Force sync error:', error);
    
    return NextResponse.json(
      { 
        error: 'Force sync failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}