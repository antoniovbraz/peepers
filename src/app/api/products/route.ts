import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Products API called - unified endpoint');
    
    // Always try cache first for better performance
    console.log('📦 Checking cache for products...');
    const cachedProducts = await cache.getAllProducts();
    
    if (cachedProducts && cachedProducts.length > 0) {
      console.log(`✅ Found ${cachedProducts.length} products in cache, returning cached data`);
      
      // Transform cached products for frontend display
      const transformedProducts = cachedProducts.map((product: any) => {
        return {
          id: product.id,
          title: product.title,
          price: product.price,
          currency_id: product.currency_id,
          available_quantity: product.available_quantity,
          condition: product.condition,
          thumbnail: product.secure_thumbnail || product.thumbnail,
          permalink: product.permalink,
          status: product.status,
          shipping: {
            free_shipping: product.shipping?.free_shipping || false,
            local_pick_up: product.shipping?.local_pick_up || false
          },
          category_id: product.category_id,
          sold_quantity: product.sold_quantity || 0,
          warranty: product.warranty,
          tags: product.tags || []
        };
      });

      // Separate by status for statistics
      const activeProducts = transformedProducts.filter(p => p.status === 'active');
      const pausedProducts = transformedProducts.filter(p => p.status === 'paused');

      return NextResponse.json({
        success: true,
        products: transformedProducts,
        total: transformedProducts.length,
        statistics: {
          total_products: transformedProducts.length,
          active_products: activeProducts.length,
          paused_products: pausedProducts.length,
        },
        source: 'cache',
        message: `${transformedProducts.length} produtos carregados do cache (${activeProducts.length} ativos, ${pausedProducts.length} pausados)`,
        timestamp: new Date().toISOString()
      });
    }
    
    // If no cache, fetch from Mercado Livre API
    console.log('🌐 No cache found, fetching from Mercado Livre API...');
    
    const knownUserId = "669073070";
    const tokenData = await cache.getUser(`access_token:${knownUserId}`);
    
    if (!tokenData?.access_token) {
      return NextResponse.json({
        success: false,
        error: "Unauthorized",
        message: "Você precisa se autenticar com o Mercado Livre primeiro.",
        login_url: "/api/ml/auth",
        products: [],
        total: 0
      }, { status: 401 });
    }

    console.log('🔑 Token found, fetching ALL products with pagination...');

    // Fetch ALL products using pagination
    let allProductIds: string[] = [];
    let offset = 0;
    const limit = 50; // ML max per request
    let totalProducts = 0;

    // First request to get total count
    const firstResponse = await fetch(`https://api.mercadolibre.com/users/${knownUserId}/items/search?limit=${limit}&offset=${offset}`, {
      headers: {
        "Authorization": `Bearer ${tokenData.access_token}`,
        "Accept": "application/json"
      }
    });

    if (!firstResponse.ok) {
      const errorData = await firstResponse.json();
      return NextResponse.json({
        success: false,
        error: "Failed to fetch products",
        message: "Erro ao buscar produtos do Mercado Livre",
        details: errorData,
        products: [],
        total: 0
      }, { status: firstResponse.status });
    }

    const firstData = await firstResponse.json();
    totalProducts = firstData.paging?.total || firstData.results?.length || 0;
    allProductIds.push(...(firstData.results || []));
    
    console.log(`📊 Found ${totalProducts} total products. Fetching all pages...`);

    // Fetch remaining pages if there are more products
    if (totalProducts > limit) {
      const totalPages = Math.ceil(totalProducts / limit);
      console.log(`📄 Fetching ${totalPages - 1} additional pages...`);
      
      const pagePromises = [];
      for (let page = 1; page < totalPages; page++) {
        const pageOffset = page * limit;
        pagePromises.push(
          fetch(`https://api.mercadolibre.com/users/${knownUserId}/items/search?limit=${limit}&offset=${pageOffset}`, {
            headers: {
              "Authorization": `Bearer ${tokenData.access_token}`,
              "Accept": "application/json"
            }
          }).then(res => res.json())
        );
      }

      const pageResults = await Promise.all(pagePromises);
      pageResults.forEach(pageData => {
        if (pageData.results) {
          allProductIds.push(...pageData.results);
        }
      });
    }

    console.log(`📋 Total product IDs collected: ${allProductIds.length}`);

    // Fetch product details in batches to avoid API limits
    let allProductDetails = [];
    const batchSize = 20; // ML allows up to 20 IDs per request with /items?ids=
    
    for (let i = 0; i < allProductIds.length; i += batchSize) {
      const batch = allProductIds.slice(i, i + batchSize);
      console.log(`🔄 Fetching batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(allProductIds.length/batchSize)} (${batch.length} items)`);
      
      try {
        const batchResponse = await fetch(`https://api.mercadolibre.com/items?ids=${batch.join(',')}`, {
          headers: {
            "Authorization": `Bearer ${tokenData.access_token}`,
            "Accept": "application/json"
          }
        });
        
        if (batchResponse.ok) {
          const batchData = await batchResponse.json();
          // ML returns array of objects with code/body when multiple IDs
          const validProducts = batchData
            .filter((item: any) => item.code === 200 && item.body)
            .map((item: any) => item.body);
          
          allProductDetails.push(...validProducts);
        } else {
          console.warn(`⚠️ Failed to fetch batch starting at index ${i}`);
        }
      } catch (err) {
        console.warn(`❌ Error fetching batch starting at index ${i}:`, err);
      }
      
      // Small delay to avoid rate limiting
      if (i + batchSize < allProductIds.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`✅ Successfully fetched ${allProductDetails.length} product details out of ${allProductIds.length} total`);

    // Store ALL products in cache for future requests
    if (allProductDetails.length > 0) {
      console.log(`💾 Storing ${allProductDetails.length} products in cache...`);
      await cache.setAllProducts(allProductDetails);
      console.log('✅ Products stored in cache successfully');
    }

    // Transform products for frontend
    const transformedProducts = allProductDetails.map((product: any) => {
      return {
        id: product.id,
        title: product.title,
        price: product.price,
        currency_id: product.currency_id,
        available_quantity: product.available_quantity,
        condition: product.condition,
        thumbnail: product.secure_thumbnail || product.thumbnail,
        permalink: product.permalink,
        status: product.status,
        shipping: {
          free_shipping: product.shipping?.free_shipping || false,
          local_pick_up: product.shipping?.local_pick_up || false
        },
        category_id: product.category_id,
        sold_quantity: product.sold_quantity || 0,
        warranty: product.warranty,
        tags: product.tags || []
      };
    });

    // Statistics
    const activeProducts = transformedProducts.filter(p => p.status === 'active');
    const pausedProducts = transformedProducts.filter(p => p.status === 'paused');

    console.log(`📈 Returning ${transformedProducts.length} total products:`);
    console.log(`   - ${activeProducts.length} active`);
    console.log(`   - ${pausedProducts.length} paused`);

    return NextResponse.json({
      success: true,
      products: transformedProducts,
      total: transformedProducts.length,
      statistics: {
        total_products: transformedProducts.length,
        active_products: activeProducts.length,
        paused_products: pausedProducts.length,
        fetched_from_api: allProductDetails.length,
        total_found: totalProducts
      },
      source: 'api',
      message: `${transformedProducts.length} produtos carregados da API (${activeProducts.length} ativos, ${pausedProducts.length} pausados)`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Products API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to load products',
      message: error instanceof Error ? error.message : 'Unknown error',
      products: [],
      total: 0
    }, { status: 500 });
  }
}
