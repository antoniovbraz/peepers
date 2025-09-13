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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id: productId } = await params;
  try {
    
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Try to get product from cache first
    let product = await cache.getProduct(productId);
    
    // If not in cache, fetch from ML API
    if (!product) {
      console.log(`Product ${productId} not in cache, fetching from ML API...`);
      
      try {
        product = await mlApi.getProduct(productId);
        
        // Cache the product
        await cache.setProduct(product);
        
        console.log(`Cached product: ${productId}`);
      } catch (error) {
        console.error(`Failed to fetch product ${productId}:`, error);
        
        return NextResponse.json(
          { 
            error: 'Product not found',
            message: `Product ${productId} could not be loaded`,
            product_id: productId
          },
          { status: 404 }
        );
      }
    }

    // Get questions for this product
    let questions = await cache.getProductQuestions(productId);
    
    if (!questions) {
      try {
        const questionsResponse = await mlApi.getProductQuestions(productId);
        questions = questionsResponse.questions;
        
        // Cache the questions
        await cache.setProductQuestions(productId, questions);
      } catch (error) {
        console.error(`Failed to fetch questions for ${productId}:`, error);
        questions = []; // Default to empty array
      }
    }

    // Transform product for frontend
    const transformedProduct = {
      id: product.id,
      title: product.title,
      subtitle: product.subtitle,
      price: product.price,
      original_price: product.original_price,
      currency_id: product.currency_id,
      available_quantity: product.available_quantity,
      sold_quantity: product.sold_quantity,
      condition: product.condition,
      permalink: product.permalink,
      pictures: product.pictures,
      video_id: product.video_id,
      shipping: {
        free_shipping: product.shipping.free_shipping,
        local_pick_up: product.shipping.local_pick_up,
        store_pick_up: product.shipping.store_pick_up,
        methods: product.shipping.methods
      },
      seller_address: {
        city: product.seller_address.city,
        state: product.seller_address.state
      },
      attributes: product.attributes.map(attr => ({
        id: attr.id,
        name: attr.name,
        value_name: attr.value_name,
        value_struct: attr.value_struct
      })),
      warranty: product.warranty,
      status: product.status,
      category_id: product.category_id,
      tags: product.tags,
      last_updated: product.last_updated,
      // Q&A data
      questions: questions.map(q => ({
        id: q.id,
        text: q.text,
        status: q.status,
        date_created: q.date_created,
        from: {
          nickname: q.from.nickname
        },
        answer: q.answer ? {
          text: q.answer.text,
          date_created: q.answer.date_created
        } : null
      }))
    };

    return NextResponse.json({
      product: transformedProduct,
      cache_info: {
        product_cached: true,
        questions_cached: true,
        last_updated: product.last_updated
      }
    });

  } catch (error) {
    console.error('Product API error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        product_id: productId
      },
      { status: 500 }
    );
  }
}

// Update product cache (for admin use)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id: productId } = await params;
  // Require admin token for cache updates
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { action } = await request.json();
    
    if (action === 'refresh_cache') {
      // Force refresh product from ML API
      const product = await mlApi.getProduct(productId);
      await cache.setProduct(product);
      
      // Also refresh questions
      const questionsResponse = await mlApi.getProductQuestions(productId);
      await cache.setProductQuestions(productId, questionsResponse.questions);
      
      return NextResponse.json({
        success: true,
        message: `Cache refreshed for product ${productId}`,
        timestamp: new Date().toISOString()
      });
    }
    
    if (action === 'invalidate_cache') {
      // Invalidate product cache
      await cache.invalidateProduct(productId);
      await cache.invalidateProductQuestions(productId);
      
      return NextResponse.json({
        success: true,
        message: `Cache invalidated for product ${productId}`,
        timestamp: new Date().toISOString()
      });
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Product POST API error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        product_id: productId
      },
      { status: 500 }
    );
  }
}
