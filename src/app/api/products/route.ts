import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/cache';
import { createMercadoLivreAPI } from '@/lib/ml-api';

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

// Removed edge runtime - incompatible with Redis operations

export async function GET(request: NextRequest) {
  try {
    console.log('Products API called');
    
    // Try to get products from cache first
    let products = await cache.getActiveProducts();
    console.log('Products from cache:', products ? products.length : 0);

    // If no cached products, try to fetch directly from ML API using the working endpoint logic
    if (!products || products.length === 0) {
      console.log('No cached products found, fetching from ML API...');
      
      try {
        // Use the same logic as /api/ml/products which is working
        const userId = process.env.ML_USER_ID || '669073070';
        console.log('Using user ID:', userId);
        
        // Get token from cache
        const tokenData = await cache.getUser(`access_token:${userId}`);
        console.log('Token data found:', !!tokenData);
        
        if (tokenData && tokenData.token) {
          console.log('Token exists, setting up ML API');
          
          // Set token in ML API instance
          mlApi.setAccessToken(
            tokenData.token, 
            tokenData.user_id.toString(),
            tokenData.refresh_token
          );
          
          // Fetch products directly from ML API
          const mlProducts = await mlApi.syncAllProducts();
          console.log(`Fetched ${mlProducts.length} products from ML API`);
          
          if (mlProducts.length > 0) {
            // Cache the products for future requests
            await cache.setAllProducts(mlProducts);
            
            // Don't filter by active only - show paused products too for now
            // Filter only products that have basic info (not failed/deleted)
            products = mlProducts.filter(p => p.id && p.title && p.price);
            console.log(`Filtered to ${products.length} valid products (including paused)`);
          }
        } else {
          console.log('No token found in cache for user:', userId);
          
          return NextResponse.json(
            { 
              error: 'Unauthorized',
              message: 'Você precisa se autenticar com o Mercado Livre primeiro. Vá para /api/ml/auth para fazer login.',
              login_url: '/api/ml/auth'
            },
            { status: 401 }
          );
        }
      } catch (fallbackError) {
        console.error('ML API fetch failed:', fallbackError);
        
        return NextResponse.json(
          { 
            error: 'Failed to fetch products',
            message: 'Erro ao buscar produtos do Mercado Livre: ' + (fallbackError instanceof Error ? fallbackError.message : 'Unknown error'),
            suggestion: 'Tente se autenticar novamente em /api/ml/auth'
          },
          { status: 500 }
        );
      }
      
      // If still no products after ML API call
      if (!products || products.length === 0) {
        return NextResponse.json({
          products: [],
          total: 0,
          message: 'Nenhum produto ativo encontrado.',
          last_sync: await cache.getLastSyncTime(),
          suggestion: 'Verifique se há produtos ativos na sua conta do Mercado Livre.'
        });
      }
    }

    // Transform products for frontend display with high-quality images
    const transformedProducts = products.map(product => {
      // Get high-quality image - prefer secure_url from pictures array
      let highQualityImage = product.secure_thumbnail || product.thumbnail;
      let allPictures: Array<{
        id: string;
        url: string;
        secure_url: string;
        size: string;
        max_size: string;
        quality: string;
      }> = [];
      
      if (product.pictures && product.pictures.length > 0) {
        // Use the first high-quality image as main thumbnail
        const firstPicture = product.pictures[0];
        highQualityImage = firstPicture.secure_url || firstPicture.url || highQualityImage;
        
        // Prepare all pictures with high-quality URLs
        allPictures = product.pictures.slice(0, 5).map(pic => ({
          id: pic.id || '',
          url: pic.url || '',
          secure_url: pic.secure_url || '',
          size: pic.size || '',
          max_size: pic.max_size || '',
          quality: pic.quality || 'standard'
        }));
      }

      return {
        id: product.id,
        title: product.title,
        price: product.price,
        currency_id: product.currency_id,
        available_quantity: product.available_quantity,
        condition: product.condition,
        thumbnail: highQualityImage,
        pictures: allPictures,
        permalink: product.permalink,
        status: product.status,
        shipping: {
          free_shipping: product.shipping?.free_shipping || false,
          local_pick_up: product.shipping?.local_pick_up || false
        },
        attributes: product.attributes?.filter(attr => 
          ['BRAND', 'MODEL', 'COLOR', 'SIZE'].includes(attr.id)
        ).slice(0, 4) || [], // Show more key attributes
        category_id: product.category_id,
        // Add additional useful fields
        sold_quantity: product.sold_quantity || 0,
        warranty: product.warranty,
        tags: product.tags || [],
        // Status indicators for admin
        is_active: product.status === 'active',
        is_paused: product.status === 'paused',
        needs_reactivation: product.available_quantity === 0
      };
    });

    console.log('Returning', transformedProducts.length, 'transformed products');

    // Calculate statistics for admin
    const activeCount = transformedProducts.filter(p => p.is_active).length;
    const pausedCount = transformedProducts.filter(p => p.is_paused).length;
    const needsReactivationCount = transformedProducts.filter(p => p.needs_reactivation).length;

    return NextResponse.json({
      products: transformedProducts,
      total: transformedProducts.length,
      last_sync: await cache.getLastSyncTime(),
      statistics: {
        total: transformedProducts.length,
        active: activeCount,
        paused: pausedCount,
        needs_reactivation: needsReactivationCount,
        status_summary: `${activeCount} ativos, ${pausedCount} pausados, ${needsReactivationCount} precisam reativação`
      }
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
