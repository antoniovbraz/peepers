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

    // Buscar produtos do usuário
    const productsResponse = await fetch(`https://api.mercadolibre.com/users/${knownUserId}/items/search?limit=10`, {
      headers: {
        "Authorization": `Bearer ${tokenData.access_token}`,
        "Accept": "application/json"
      }
    });

    if (!productsResponse.ok) {
      const errorData = await productsResponse.json();
      return NextResponse.json({
        success: false,
        status: productsResponse.status,
        error: errorData
      }, { status: productsResponse.status });
    }

    const productsData = await productsResponse.json();

    // Se temos produtos, buscar detalhes dos primeiros 3 para exibição
    let productDetails = [];
    let allProductDetails = []; // Para armazenar no cache
    
    if (productsData.results && productsData.results.length > 0) {
      // Buscar detalhes de todos os produtos para o cache
      console.log(`Fetching details for ${productsData.results.length} products...`);
      
      const allDetailPromises = productsData.results.map(async (productId: string) => {
        try {
          const detailResponse = await fetch(`https://api.mercadolibre.com/items/${productId}`, {
            headers: {
              "Authorization": `Bearer ${tokenData.access_token}`,
              "Accept": "application/json"
            }
          });
          
          if (detailResponse.ok) {
            return await detailResponse.json();
          }
          console.warn(`Failed to fetch details for product ${productId}`);
          return null;
        } catch (err) {
          console.warn(`Error fetching product ${productId}:`, err);
          return null;
        }
      });

      const allResults = await Promise.all(allDetailPromises);
      allProductDetails = allResults.filter(product => product !== null);
      
      // Armazenar todos os produtos no cache
      if (allProductDetails.length > 0) {
        console.log(`Storing ${allProductDetails.length} products in cache...`);
        await cache.setAllProducts(allProductDetails);
        console.log('Products stored in cache successfully');
      }
      
      // Pegar apenas os primeiros 3 para mostrar na resposta
      productDetails = allProductDetails.slice(0, 3);
    }

    return NextResponse.json({
      success: true,
      user_id: knownUserId,
      total_products: productsData.total || 0,
      products_in_page: productsData.results?.length || 0,
      products_cached: allProductDetails.length,
      product_ids: productsData.results || [],
      sample_products: productDetails,
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
