import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/cache';
import { createMercadoLivreAPI } from '@/lib/ml-api';

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Products API called - Enhanced version with API fallback');
    
    // Test 1: Check cache first
    const cachedProducts = await cache.getAllProducts();
    console.log('Cache check:', {
      exists: !!cachedProducts,
      length: cachedProducts?.length,
      type: typeof cachedProducts
    });
    
    if (cachedProducts && cachedProducts.length > 0) {
      console.log('✅ Returning products from cache');
      
      return NextResponse.json({
        success: true,
        total: cachedProducts.length,
        products: cachedProducts.slice(0, 50).map(p => ({
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
    
    // Test 2: Cache is empty, check if user is authenticated
    console.log('📭 Cache is empty, checking authentication...');
    
    const userId = '669073070'; // Known user ID
    const tokenData = await cache.getUser(userId);
    
    if (!tokenData || !tokenData.token) {
      return NextResponse.json({
        success: false,
        error: "Authentication required",
        message: "Você precisa se autenticar com o Mercado Livre primeiro.",
        auth_url: "/api/auth/mercado-livre",
        products: [],
        total: 0
      }, { status: 401 });
    }
    
    console.log('✅ User is authenticated, fetching products from ML API...');
    
    // Test 3: Fetch products from Mercado Livre API
    try {
      const mlApi = createMercadoLivreAPI(
        { fetch: (input, init) => fetch(input, init || {}) }, // HTTP client wrapper
        {
          clientId: process.env.ML_CLIENT_ID!,
          clientSecret: process.env.ML_CLIENT_SECRET!,
          accessToken: tokenData.token,
          refreshToken: tokenData.refresh_token,
          userId: userId
        }
      );
      
      const products = await mlApi.syncAllProducts();
      
      if (products && products.length > 0) {
        // Save to cache for future requests
        await cache.setAllProducts(products);
        
        console.log(`✅ Fetched and cached ${products.length} products from ML API`);
        
        return NextResponse.json({
          success: true,
          total: products.length,
          products: products.slice(0, 50).map(p => ({
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
          source: 'ml_api',
          message: `${products.length} produtos buscados da API do Mercado Livre`
        });
      } else {
        return NextResponse.json({
          success: true,
          total: 0,
          products: [],
          source: 'ml_api',
          message: "Nenhum produto encontrado na sua conta do Mercado Livre"
        });
      }
      
    } catch (apiError) {
      console.error('❌ Error fetching from ML API:', apiError);
      return NextResponse.json({
        success: false,
        error: "Failed to fetch products from Mercado Livre",
        message: apiError instanceof Error ? apiError.message : 'Unknown API error',
        products: [],
        total: 0
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Minimal Products API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}