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

    // Se temos produtos, buscar detalhes dos primeiros 3
    let productDetails = [];
    if (productsData.results && productsData.results.length > 0) {
      const firstThreeProducts = productsData.results.slice(0, 3);
      
      const detailPromises = firstThreeProducts.map(async (productId: string) => {
        const detailResponse = await fetch(`https://api.mercadolibre.com/items/${productId}`, {
          headers: {
            "Authorization": `Bearer ${tokenData.access_token}`,
            "Accept": "application/json"
          }
        });
        
        if (detailResponse.ok) {
          return await detailResponse.json();
        }
        return { id: productId, error: "Failed to fetch details" };
      });

      productDetails = await Promise.all(detailPromises);
    }

    return NextResponse.json({
      success: true,
      user_id: knownUserId,
      total_products: productsData.total || 0,
      products_in_page: productsData.results?.length || 0,
      product_ids: productsData.results || [],
      sample_products: productDetails,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
