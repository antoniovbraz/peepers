import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    console.log('Products API called');
    
    // Use the same exact logic as /api/ml/products that we know works
    const knownUserId = "669073070";
    const tokenData = await cache.getUser(`access_token:${knownUserId}`);
    
    if (!tokenData?.access_token) {
      return NextResponse.json({
        error: "Unauthorized",
        message: "Você precisa se autenticar com o Mercado Livre primeiro.",
        login_url: "/api/ml/auth",
        suggestion: "Faça login em /api/ml/auth e tente novamente."
      }, { status: 401 });
    }

    console.log('Token found, fetching ALL products from ML API with pagination...');

    // Buscar TODOS os produtos usando paginação (não apenas 10)
    let allProductIds: string[] = [];
    let offset = 0;
    const limit = 50; // ML permite até 50 por requisição
    let totalProducts = 0;

    // Primeira requisição para descobrir total
    console.log('Fetching first page to determine total products...');
    const firstResponse = await fetch(`https://api.mercadolibre.com/users/${knownUserId}/items/search?limit=${limit}&offset=${offset}`, {
      headers: {
        "Authorization": `Bearer ${tokenData.access_token}`,
        "Accept": "application/json"
      }
    });

    if (!firstResponse.ok) {
      const errorData = await firstResponse.json();
      return NextResponse.json({
        error: "Failed to fetch products",
        message: "Erro ao buscar produtos do Mercado Livre",
        details: errorData
      }, { status: firstResponse.status });
    }

    const firstData = await firstResponse.json();
    totalProducts = firstData.paging?.total || firstData.results?.length || 0;
    allProductIds.push(...(firstData.results || []));
    
    console.log(`Found ${totalProducts} total products. First page has ${firstData.results?.length || 0} items.`);

    // Se há mais produtos, buscar páginas restantes
    if (totalProducts > limit) {
      const totalPages = Math.ceil(totalProducts / limit);
      console.log(`Fetching remaining ${totalPages - 1} pages...`);
      
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

    console.log(`Total product IDs collected: ${allProductIds.length}`);

    // Buscar detalhes de todos os produtos em lotes (ML permite até 20 por vez no /items?ids=)
    let allProductDetails = [];
    const batchSize = 20;
    
    for (let i = 0; i < allProductIds.length; i += batchSize) {
      const batch = allProductIds.slice(i, i + batchSize);
      console.log(`Fetching details for batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(allProductIds.length/batchSize)} (${batch.length} items)`);
      
      try {
        const batchResponse = await fetch(`https://api.mercadolibre.com/items?ids=${batch.join(',')}`, {
          headers: {
            "Authorization": `Bearer ${tokenData.access_token}`,
            "Accept": "application/json"
          }
        });
        
        if (batchResponse.ok) {
          const batchData = await batchResponse.json();
          // ML retorna array de objetos com code/body quando multiple IDs
          const validProducts = batchData
            .filter((item: any) => item.code === 200 && item.body)
            .map((item: any) => item.body);
          
          allProductDetails.push(...validProducts);
        } else {
          console.warn(`Failed to fetch batch starting at index ${i}`);
        }
      } catch (err) {
        console.warn(`Error fetching batch starting at index ${i}:`, err);
      }
    }

    console.log(`Successfully fetched ${allProductDetails.length} product details out of ${allProductIds.length} total`);

    // Transform products for frontend display - INCLUDE PAUSED PRODUCTS
    const transformedProducts = allProductDetails.map(product => {
      // Get high-quality image
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
        const firstPicture = product.pictures[0];
        highQualityImage = firstPicture.secure_url || firstPicture.url || highQualityImage;
        
        allPictures = product.pictures.slice(0, 5).map((pic: any) => ({
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
        status: product.status, // Include status (paused/active)
        shipping: {
          free_shipping: product.shipping?.free_shipping || false,
          local_pick_up: product.shipping?.local_pick_up || false
        },
        attributes: product.attributes?.filter((attr: any) => 
          ['BRAND', 'MODEL', 'COLOR', 'SIZE'].includes(attr.id)
        ).slice(0, 4) || [],
        category_id: product.category_id,
        sold_quantity: product.sold_quantity || 0,
        warranty: product.warranty,
        tags: product.tags || [],
        // Add status info for admin
        is_active: product.status === 'active',
        is_paused: product.status === 'paused',
        sub_status: product.sub_status || []
      };
    });

    // Separate active and paused for statistics
    const activeProducts = transformedProducts.filter(p => p.status === 'active');
    const pausedProducts = transformedProducts.filter(p => p.status === 'paused');
    const outOfStockProducts = transformedProducts.filter(p => p.available_quantity === 0);
    const inStockProducts = transformedProducts.filter(p => p.available_quantity > 0);

    console.log(`Returning ${transformedProducts.length} total products:`);
    console.log(`- ${activeProducts.length} active`);
    console.log(`- ${pausedProducts.length} paused`);
    console.log(`- ${inStockProducts.length} in stock`);
    console.log(`- ${outOfStockProducts.length} out of stock`);

    return NextResponse.json({
      products: transformedProducts, // Return ALL products (active + paused)
      total: transformedProducts.length,
      statistics: {
        total_products: transformedProducts.length,
        active_products: activeProducts.length,
        paused_products: pausedProducts.length,
        in_stock_products: inStockProducts.length,
        out_of_stock_products: outOfStockProducts.length,
        fetched_details: allProductDetails.length,
        total_found: totalProducts
      },
      message: `Carregados ${transformedProducts.length} produtos (${activeProducts.length} ativos, ${pausedProducts.length} pausados)`,
      timestamp: new Date().toISOString()
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
