import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    console.log('Products API called');
    
    // First, try to get products from cache
    console.log('Checking cache for products...');
    const cachedProducts = await cache.getAllProducts();
    
    console.log('Cache result:', { 
      hasProducts: !!cachedProducts, 
      count: cachedProducts?.length || 0,
      type: typeof cachedProducts 
    });
    
    if (cachedProducts && cachedProducts.length > 0) {
      console.log(`Found ${cachedProducts.length} products in cache, returning cached data`);
      
      // Transform cached products for frontend display
      const transformedProducts = cachedProducts.map((product: any) => {
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
          status: product.status,
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
          installments: product.sale_terms?.find((term: any) => term.id === 'FINANCING')
        };
      });

      return NextResponse.json({
        products: transformedProducts,
        total: transformedProducts.length,
        source: 'cache',
        message: `Carregados ${transformedProducts.length} produtos do cache`,
        timestamp: new Date().toISOString()
      });
    }
    
    // If no cache, fall back to API call but use simpler logic like /api/ml/products
    console.log('No products in cache, fetching from ML API...');
    
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

    // Simple fetch like the working /api/ml/products endpoint
    const productsResponse = await fetch(`https://api.mercadolibre.com/users/${knownUserId}/items/search?limit=50`, {
      headers: {
        "Authorization": `Bearer ${tokenData.access_token}`,
        "Accept": "application/json"
      }
    });

    if (!productsResponse.ok) {
      const errorData = await productsResponse.json();
      return NextResponse.json({
        error: "Failed to fetch products",
        message: "Erro ao buscar produtos do Mercado Livre",
        details: errorData
      }, { status: productsResponse.status });
    }

    const productsData = await productsResponse.json();
    
    // Fetch details in smaller batches to avoid timeouts
    let allProductDetails = [];
    
    if (productsData.results && productsData.results.length > 0) {
      console.log(`Fetching details for ${productsData.results.length} products...`);
      
      // Process in smaller batches to avoid timeouts
      const batchSize = 10;
      for (let i = 0; i < productsData.results.length; i += batchSize) {
        const batch = productsData.results.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (productId: string) => {
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
            return null;
          } catch (err) {
            console.warn(`Error fetching product ${productId}:`, err);
            return null;
          }
        });

        const batchResults = await Promise.all(batchPromises);
        const validProducts = batchResults.filter(product => product !== null);
        allProductDetails.push(...validProducts);
        
        // Small delay between batches to avoid rate limiting
        if (i + batchSize < productsData.results.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      // Store in cache for next time
      if (allProductDetails.length > 0) {
        await cache.setAllProducts(allProductDetails);
      }
    }

    // Transform products for frontend
    const transformedProducts = allProductDetails.map((product: any) => {
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
        status: product.status,
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
        tags: product.tags || []
      };
    });

    return NextResponse.json({
      products: transformedProducts,
      total: transformedProducts.length,
      source: 'api',
      message: `Carregados ${transformedProducts.length} produtos da API`,
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
