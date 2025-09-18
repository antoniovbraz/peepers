import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/cache';
import { MLProduct } from '@/types/ml';
import { checkPublicAPILimit } from '@/lib/rate-limiter';
import { logSecurityEvent, SecurityEventType } from '@/lib/security-events';
import { MOCK_PRODUCTS } from '@/lib/mocks';
import { createMercadoLivreAPI } from '@/lib/ml-api';

export async function GET(request: NextRequest) {
  const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                   request.headers.get('x-real-ip') || 
                   'unknown';

  try {
    // Rate limiting para API pública
    const rateLimitResult = await checkPublicAPILimit(clientIP, '/api/v1/products');
    if (!rateLimitResult.allowed) {
      await logSecurityEvent({
        type: SecurityEventType.RATE_LIMIT_EXCEEDED,
        severity: 'LOW',
        clientIP,
        details: {
          endpoint: '/api/v1/products',
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime,
          totalHits: rateLimitResult.totalHits
        }
      });

      return NextResponse.json({
        error: 'Rate limit exceeded',
        retryAfter: rateLimitResult.retryAfter || Math.ceil(rateLimitResult.resetTime / 1000)
      }, { status: 429 });
    }

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    
    // Parse pagination parameters with defaults
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '50')), 100);
    
    // Parse filter parameters
    const category = searchParams.get('category') || undefined;
    const priceMin = searchParams.get('price_min') ? parseFloat(searchParams.get('price_min')!) : undefined;
    const priceMax = searchParams.get('price_max') ? parseFloat(searchParams.get('price_max')!) : undefined;
    const condition = searchParams.get('condition') || undefined;
    const status = searchParams.get('status') || undefined;
    const freeShipping = searchParams.get('free_shipping') === 'true';
    const search = searchParams.get('search') || undefined;

    // Get response format
    const format = searchParams.get('format') || 'minimal';
    const validFormats = ['minimal', 'summary', 'full'];
    
    if (!validFormats.includes(format)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid format parameter',
        message: `Format must be one of: ${validFormats.join(', ')}`
      }, { status: 400 });
    }

    // Check authentication
    const userId = request.cookies.get('user_id')?.value;
    const isAuthenticated = !!userId;

    // Get products from cache
    let allProducts = await cache.getAllProducts();
    let usingMockData = false;
    let dataSource = 'cache';
    
    // Se não há produtos no cache, tentar buscar da API ML
    if (!allProducts || allProducts.length === 0) {
      console.log('⚠️  No products in cache, trying to fetch from ML API...');
      
      try {
        // Tentar buscar produtos reais da API ML
        const mlUserId = process.env.ML_USER_ID || '669073070';
        const tokenData = await cache.getUser(mlUserId);
        
        if (tokenData && tokenData.token) {
          const mlApi = createMercadoLivreAPI(
            { fetch },
            {
              clientId: process.env.ML_CLIENT_ID!,
              clientSecret: process.env.ML_CLIENT_SECRET!,
              accessToken: tokenData.token,
              refreshToken: tokenData.refresh_token,
              userId: mlUserId
            }
          );
          
          // Buscar TODOS os produtos (ativos e pausados) usando scan
          console.log('🔍 Fetching ALL products using scan method...');
          
          // Buscar produtos ativos
          const activeProductsResponse = await mlApi.getUserProducts(mlUserId, 'active', 200, 0, 'scan');
          const activeProductIds = activeProductsResponse.results;
          
          // Buscar produtos pausados  
          const pausedProductsResponse = await mlApi.getUserProducts(mlUserId, 'paused', 200, 0, 'scan');
          const pausedProductIds = pausedProductsResponse.results;
          
          // Combinar todos os IDs
          const allProductIds = [...activeProductIds, ...pausedProductIds];
          
          if (allProductIds.length > 0) {
            console.log(`✅ Found ${allProductIds.length} products total (${activeProductIds.length} active, ${pausedProductIds.length} paused), fetching details...`);
            
            // Buscar detalhes dos produtos
            const productDetails = [];
            for (let i = 0; i < Math.min(50, allProductIds.length); i++) {
              try {
                const product = await mlApi.getProduct(allProductIds[i]);
                productDetails.push(product);
              } catch (err) {
                console.warn(`Error fetching product ${allProductIds[i]}:`, err);
              }
            }
            
            if (productDetails.length > 0) {
              allProducts = productDetails;
              dataSource = 'ml-api-direct';
              console.log(`✅ Successfully loaded ${productDetails.length} products from ML API`);
            }
          }
        }
      } catch (error) {
        console.warn('Failed to fetch from ML API:', error);
      }
      
      // Se ainda não temos produtos, usar mocks como último recurso
      if (!allProducts || allProducts.length === 0) {
        console.log('⚠️ Using mock products as fallback');
        allProducts = MOCK_PRODUCTS as MLProduct[];
        usingMockData = true;
        dataSource = 'mock-fallback';
      }
    }

    // Apply filters
    let filteredProducts = allProducts;

    if (category) {
      filteredProducts = filteredProducts.filter(p => p.category_id === category);
    }

    if (priceMin !== undefined) {
      filteredProducts = filteredProducts.filter(p => p.price >= priceMin);
    }

    if (priceMax !== undefined) {
      filteredProducts = filteredProducts.filter(p => p.price <= priceMax);
    }

    if (condition) {
      filteredProducts = filteredProducts.filter(p => p.condition === condition);
    }

    if (status) {
      filteredProducts = filteredProducts.filter(p => p.status === status);
    }

    if (freeShipping) {
      filteredProducts = filteredProducts.filter(p => p.shipping?.free_shipping === true);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredProducts = filteredProducts.filter(p => 
        p.title?.toLowerCase().includes(searchLower) ||
        p.subtitle?.toLowerCase().includes(searchLower)
      );
    }

    // Calculate pagination
    const total = filteredProducts.length;
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;
    const offset = (page - 1) * limit;
    const paginatedProducts = filteredProducts.slice(offset, offset + limit);

    // Format products based on requested format and authentication
    const formatProduct = (product: MLProduct) => {
      const baseProduct = {
        id: product.id,
        title: product.title,
        price: product.price,
        currency_id: product.currency_id,
        thumbnail: product.secure_thumbnail || product.thumbnail, // Sempre usar HTTPS quando disponível
        condition: product.condition,
        permalink: product.permalink,
        shipping: {
          free_shipping: product.shipping?.free_shipping || false
        }
      };

      if (format === 'summary' || (format === 'full' && isAuthenticated)) {
        return {
          ...baseProduct,
          subtitle: product.subtitle,
          available_quantity: product.available_quantity,
          sold_quantity: product.sold_quantity,
          status: product.status,
          category_id: product.category_id,
          pictures: product.pictures?.slice(0, 3) || [],
          attributes: product.attributes?.slice(0, 5) || []
        };
      }

      if (format === 'full' && isAuthenticated) {
        return product; // Full product data for authenticated users
      }

      return baseProduct; // Minimal format
    };

    const formattedProducts = paginatedProducts.map(formatProduct);

    return NextResponse.json({
      success: true,
      data: {
        products: formattedProducts,
        total,
        page,
        limit,
        totalPages,
        hasNext,
        hasPrev,
        filters: { category, priceMin, priceMax, condition, status, freeShipping, search },
        format
      },
      meta: {
        source: dataSource,
        cached: dataSource === 'cache',
        usingMockData,
        authenticated: isAuthenticated,
        ip: clientIP.substring(0, 10) + '***', // Partially masked IP for privacy
        timestamp: new Date().toISOString() // Para forçar cache busting
      }
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'ETag': `"${Date.now()}"`, // ETag único para cada resposta
        'Last-Modified': new Date().toUTCString()
      }
    });

  } catch (error) {
    console.error('Products v1 API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}