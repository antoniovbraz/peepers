import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/cache';
import { createMercadoLivreAPI } from '@/lib/ml-api';
import logger from '@/lib/logger';

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
    logger.info('Products API called');
    
    // Try to get products from cache first
    let products = await cache.getActiveProducts();
    logger.info('Products from cache:', products ? products.length : 0);

    // If no cached products, try to fetch from ML API as fallback
    if (!products || products.length === 0) {
      logger.info('No cached products found, trying ML API fallback...');
      
      try {
        // Get access token from cache
        const userId = process.env.ML_USER_ID!;
        const tokenData = await cache.getUser(`access_token:${userId}`);
        
        if (tokenData && tokenData.token) {
          // Check if token is not expired
          if (!tokenData.expires_at || new Date(tokenData.expires_at) > new Date()) {
            logger.info('Using ML API fallback with valid token');
            
            // Set token in ML API instance
            mlApi.setAccessToken(tokenData.token, tokenData.user_id.toString());
            
            // Fetch products directly from ML API
            const mlProducts = await mlApi.syncAllProducts();
            
            if (mlProducts.length > 0) {
              logger.info(`Fallback successful: fetched ${mlProducts.length} products from ML API`);
              
              // Cache the products for future requests
              await cache.setAllProducts(mlProducts);
              
              // Use the fetched products
              products = mlProducts.filter(p => p.status === 'active');
            }
          }
        }
      } catch (fallbackError) {
        logger.error('ML API fallback failed:', fallbackError);
      }
      
      // If still no products after fallback, return empty with sync suggestion
      if (!products || products.length === 0) {
        return NextResponse.json({
          products: [],
          total: 0,
          message: 'No products found. Please sync products first.',
          last_sync: await cache.getLastSyncTime(),
          fallback_attempted: true
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
        tags: product.tags || []
      };
    });

    logger.info('Returning', transformedProducts.length, 'transformed products');

    return NextResponse.json({
      products: transformedProducts,
      total: transformedProducts.length,
      last_sync: await cache.getLastSyncTime()
    });

  } catch (error) {
    logger.error('Products API error:', error);
    
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
    logger.error('Products POST API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
