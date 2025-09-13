import { NextResponse } from "next/server";
import { cache } from "@/lib/cache";

export async function GET() {
  try {
    const knownUserId = "669073070";
    const tokenData = await cache.getUser(`access_token:${knownUserId}`);
    
    if (!tokenData?.access_token) {
      return NextResponse.json({
        success: false,
        error: "No access token found"
      }, { status: 401 });
    }

    console.log('Fetching ALL products from ML API with pagination...');

    // Buscar TODOS os produtos usando paginação
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
        success: false,
        status: firstResponse.status,
        error: errorData
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

    // Buscar detalhes de todos os produtos em lotes menores para evitar timeout
    let allProductDetails = [];
    const batchSize = 20; // Processar 20 por vez
    
    for (let i = 0; i < allProductIds.length; i += batchSize) {
      const batch = allProductIds.slice(i, i + batchSize);
      console.log(`Fetching details for batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(allProductIds.length/batchSize)} (${batch.length} items)`);
      
      try {
        // Usar endpoint /items?ids= para buscar múltiplos de uma vez
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
        
        // Small delay to avoid rate limiting
        if (i + batchSize < allProductIds.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } catch (err) {
        console.warn(`Error fetching batch starting at index ${i}:`, err);
      }
    }

    console.log(`Successfully fetched ${allProductDetails.length} product details out of ${allProductIds.length} total`);

    // Se temos produtos, armazenar no cache
    if (allProductDetails.length > 0) {
      console.log(`Storing ${allProductDetails.length} products in cache...`);
      await cache.setAllProducts(allProductDetails);
      console.log('Products stored in cache successfully');
    }
    
    // Pegar apenas os primeiros 3 para mostrar na resposta
    const sampleProducts = allProductDetails.slice(0, 3);

    return NextResponse.json({
      success: true,
      user_id: knownUserId,
      total_products: totalProducts,
      products_in_page: allProductIds.length,
      products_cached: allProductDetails.length,
      product_ids: allProductIds,
      sample_products: sampleProducts,
      cache_updated: allProductDetails.length > 0,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
