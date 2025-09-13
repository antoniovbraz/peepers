import { NextRequest, NextResponse } from 'next/server';import { NextRequest, NextResponse } from 'next/server';import { NextRequest, NextResponse } from 'next/server';import { NextRequest, NextResponse } from 'next/server';import { NextResponse } from "next/server";

import { cache } from '@/lib/cache';

import { cache } from '@/lib/cache';

export async function GET(request: NextRequest) {

  try {import { cache } from '@/lib/cache';

    console.log('ML Products API called');

    export async function GET(request: NextRequest) {

    const knownUserId = "669073070";

    const tokenData = await cache.getUser(`access_token:${knownUserId}`);  try {import { cache } from '@/lib/cache';import { cache } from "@/lib/cache";

    

    if (!tokenData?.access_token) {    console.log('ML Products API called');

      return NextResponse.json({

        error: "Unauthorized",    export async function GET(request: NextRequest) {

        message: "Você precisa se autenticar com o Mercado Livre primeiro.",

        login_url: "/api/ml/auth",    const knownUserId = "669073070";

        suggestion: "Faça login em /api/ml/auth e tente novamente."

      }, { status: 401 });    const tokenData = await cache.getUser(`access_token:${knownUserId}`);  try {

    }

    

    console.log('Token found, fetching products...');

        if (!tokenData?.access_token) {    console.log('ML Products API called');

    const productsResponse = await fetch(`https://api.mercadolibre.com/users/${knownUserId}/items/search?limit=10`, {

      headers: {      return NextResponse.json({

        "Authorization": `Bearer ${tokenData.access_token}`,

        "Accept": "application/json"        error: "Unauthorized",    export async function GET(request: NextRequest) {export async function GET() {

      }

    });        message: "Você precisa se autenticar com o Mercado Livre primeiro.",



    if (!productsResponse.ok) {        login_url: "/api/ml/auth",    const knownUserId = "669073070";

      throw new Error(`ML API error: ${productsResponse.status}`);

    }        suggestion: "Faça login em /api/ml/auth e tente novamente."



    const data = await productsResponse.json();      }, { status: 401 });    const tokenData = await cache.getUser(`access_token:${knownUserId}`);  try {  try {

    console.log(`Found ${data.results?.length || 0} products`);

    }

    return NextResponse.json({

      success: true,    

      message: "Produtos obtidos diretamente da API do ML",

      products: data.results || [],    console.log('Token found, fetching products...');

      total: data.paging?.total || 0,

      limit: data.paging?.limit || 10        if (!tokenData?.access_token) {    console.log('ML Products API called');    const knownUserId = "669073070";

    });

    const productsResponse = await fetch(`https://api.mercadolibre.com/users/${knownUserId}/items/search?limit=10`, {

  } catch (error) {

    console.error('Error in ML Products API:', error);      headers: {      return NextResponse.json({

    return NextResponse.json({

      success: false,        "Authorization": `Bearer ${tokenData.access_token}`,

      error: "Internal server error",

      details: error instanceof Error ? error.message : "Unknown error"        "Accept": "application/json"        error: "Unauthorized",        const tokenData = await cache.getUser(`access_token:${knownUserId}`);

    }, { status: 500 });

  }      }

}
    });        message: "Você precisa se autenticar com o Mercado Livre primeiro.",



    if (!productsResponse.ok) {        login_url: "/api/ml/auth",    const knownUserId = "669073070";    

      throw new Error(`ML API error: ${productsResponse.status}`);

    }        suggestion: "Faça login em /api/ml/auth e tente novamente."



    const data = await productsResponse.json();      }, { status: 401 });    const tokenData = await cache.getUser(`access_token:${knownUserId}`);    if (!tokenData?.access_token) {

    console.log(`Found ${data.results?.length || 0} products`);

    }

    return NextResponse.json({

      success: true,          return NextResponse.json({

      message: "Produtos obtidos diretamente da API do ML",

      products: data.results || [],    console.log('Token found, fetching products...');

      total: data.paging?.total || 0,

      limit: data.paging?.limit || 10    if (!tokenData?.access_token) {        success: false,

    });

    const productsResponse = await fetch(`https://api.mercadolibre.com/users/${knownUserId}/items/search?limit=10`, {

  } catch (error) {

    console.error('Error in ML Products API:', error);      headers: {      return NextResponse.json({        error: "No access token found"

    return NextResponse.json({

      success: false,        "Authorization": `Bearer ${tokenData.access_token}`,

      error: "Internal server error",

      details: error instanceof Error ? error.message : "Unknown error"        "Accept": "application/json"        error: "Unauthorized",      }, { status: 401 });

    }, { status: 500 });

  }      }

}
    });        message: "Você precisa se autenticar com o Mercado Livre primeiro.",    }



    if (!productsResponse.ok) {        login_url: "/api/ml/auth",

      const errorData = await productsResponse.json();

      return NextResponse.json({        suggestion: "Faça login em /api/ml/auth e tente novamente."    console.log('Fetching ALL products from ML API with pagination...');

        error: "Failed to fetch products",

        message: "Erro ao buscar produtos do Mercado Livre",      }, { status: 401 });

        details: errorData

      }, { status: productsResponse.status });    }    // Buscar TODOS os produtos usando paginação

    }

    let allProductIds: string[] = [];

    const productsData = await productsResponse.json();

        console.log('Token found, fetching products...');    let offset = 0;

    console.log(`Found ${productsData.results?.length || 0} product IDs`);

        const limit = 50; // ML permite até 50 por requisição

    let productDetails = [];

        const productsResponse = await fetch(`https://api.mercadolibre.com/users/${knownUserId}/items/search?limit=10`, {    let totalProducts = 0;

    if (productsData.results && productsData.results.length > 0) {

      // Fetch product details      headers: {

      const detailPromises = productsData.results.map(async (productId: string) => {

        try {        "Authorization": `Bearer ${tokenData.access_token}`,    // Primeira requisição para descobrir total

          const detailResponse = await fetch(`https://api.mercadolibre.com/items/${productId}`, {

            headers: {        "Accept": "application/json"    console.log('Fetching first page to determine total products...');

              "Authorization": `Bearer ${tokenData.access_token}`,

              "Accept": "application/json"      }    const firstResponse = await fetch(`https://api.mercadolibre.com/users/${knownUserId}/items/search?limit=${limit}&offset=${offset}`, {

            }

          });    });      headers: {

          

          if (detailResponse.ok) {        "Authorization": `Bearer ${tokenData.access_token}`,

            return await detailResponse.json();

          }    if (!productsResponse.ok) {        "Accept": "application/json"

          return null;

        } catch (err) {      const errorData = await productsResponse.json();      }

          console.warn(`Error fetching product ${productId}:`, err);

          return null;      return NextResponse.json({    });

        }

      });        error: "Failed to fetch products",



      const results = await Promise.all(detailPromises);        message: "Erro ao buscar produtos do Mercado Livre",    if (!firstResponse.ok) {

      productDetails = results.filter(product => product !== null);

              details: errorData      const errorData = await firstResponse.json();

      // Store in cache

      if (productDetails.length > 0) {      }, { status: productsResponse.status });      return NextResponse.json({

        await cache.setAllProducts(productDetails);

      }    }        success: false,

    }

        status: firstResponse.status,

    // Transform products for frontend

    const transformedProducts = productDetails.map((product: any) => {    const productsData = await productsResponse.json();        error: errorData

      return {

        id: product.id,          }, { status: firstResponse.status });

        title: product.title,

        price: product.price,    console.log(`Found ${productsData.results?.length || 0} product IDs`);    }

        currency_id: product.currency_id,

        available_quantity: product.available_quantity,    

        condition: product.condition,

        thumbnail: product.secure_thumbnail || product.thumbnail,    let productDetails = [];    const firstData = await firstResponse.json();

        permalink: product.permalink,

        status: product.status,        totalProducts = firstData.paging?.total || firstData.results?.length || 0;

        shipping: {

          free_shipping: product.shipping?.free_shipping || false,    if (productsData.results && productsData.results.length > 0) {    allProductIds.push(...(firstData.results || []));

          local_pick_up: product.shipping?.local_pick_up || false

        },      // Fetch product details    

        category_id: product.category_id,

        sold_quantity: product.sold_quantity || 0,      const detailPromises = productsData.results.map(async (productId: string) => {    console.log(`Found ${totalProducts} total products. First page has ${firstData.results?.length || 0} items.`);

        warranty: product.warranty,

        tags: product.tags || []        try {

      };

    });          const detailResponse = await fetch(`https://api.mercadolibre.com/items/${productId}`, {    // Se há mais produtos, buscar páginas restantes



    return NextResponse.json({            headers: {    if (totalProducts > limit) {

      products: transformedProducts,

      total: transformedProducts.length,              "Authorization": `Bearer ${tokenData.access_token}`,      const totalPages = Math.ceil(totalProducts / limit);

      source: 'ml-api',

      message: `Carregados ${transformedProducts.length} produtos da API ML (primeiros 10)`,              "Accept": "application/json"      console.log(`Fetching remaining ${totalPages - 1} pages...`);

      timestamp: new Date().toISOString()

    });            }      



  } catch (error) {          });      const pagePromises = [];

    console.error('ML Products API error:', error);

                    for (let page = 1; page < totalPages; page++) {

    return NextResponse.json(

      {           if (detailResponse.ok) {        const pageOffset = page * limit;

        error: 'Failed to load products',

        message: error instanceof Error ? error.message : 'Unknown error'            return await detailResponse.json();        pagePromises.push(

      },

      { status: 500 }          }          fetch(`https://api.mercadolibre.com/users/${knownUserId}/items/search?limit=${limit}&offset=${pageOffset}`, {

    );

  }          return null;            headers: {

}
        } catch (err) {              "Authorization": `Bearer ${tokenData.access_token}`,

          console.warn(`Error fetching product ${productId}:`, err);              "Accept": "application/json"

          return null;            }

        }          }).then(res => res.json())

      });        );

      }

      const results = await Promise.all(detailPromises);

      productDetails = results.filter(product => product !== null);      const pageResults = await Promise.all(pagePromises);

            pageResults.forEach(pageData => {

      // Store in cache        if (pageData.results) {

      if (productDetails.length > 0) {          allProductIds.push(...pageData.results);

        await cache.setAllProducts(productDetails);        }

      }      });

    }    }



    // Transform products for frontend    console.log(`Total product IDs collected: ${allProductIds.length}`);

    const transformedProducts = productDetails.map((product: any) => {

      return {    // Buscar detalhes de todos os produtos em lotes menores para evitar timeout

        id: product.id,    let allProductDetails = [];

        title: product.title,    const batchSize = 20; // Processar 20 por vez

        price: product.price,    

        currency_id: product.currency_id,    for (let i = 0; i < allProductIds.length; i += batchSize) {

        available_quantity: product.available_quantity,      const batch = allProductIds.slice(i, i + batchSize);

        condition: product.condition,      console.log(`Fetching details for batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(allProductIds.length/batchSize)} (${batch.length} items)`);

        thumbnail: product.secure_thumbnail || product.thumbnail,      

        permalink: product.permalink,      try {

        status: product.status,        // Usar endpoint /items?ids= para buscar múltiplos de uma vez

        shipping: {        const batchResponse = await fetch(`https://api.mercadolibre.com/items?ids=${batch.join(',')}`, {

          free_shipping: product.shipping?.free_shipping || false,          headers: {

          local_pick_up: product.shipping?.local_pick_up || false            "Authorization": `Bearer ${tokenData.access_token}`,

        },            "Accept": "application/json"

        category_id: product.category_id,          }

        sold_quantity: product.sold_quantity || 0,        });

        warranty: product.warranty,        

        tags: product.tags || []        if (batchResponse.ok) {

      };          const batchData = await batchResponse.json();

    });          // ML retorna array de objetos com code/body quando multiple IDs

          const validProducts = batchData

    return NextResponse.json({            .filter((item: any) => item.code === 200 && item.body)

      products: transformedProducts,            .map((item: any) => item.body);

      total: transformedProducts.length,          

      source: 'ml-api',          allProductDetails.push(...validProducts);

      message: `Carregados ${transformedProducts.length} produtos da API ML (primeiros 10)`,        } else {

      timestamp: new Date().toISOString()          console.warn(`Failed to fetch batch starting at index ${i}`);

    });        }

        

  } catch (error) {        // Small delay to avoid rate limiting

    console.error('ML Products API error:', error);        if (i + batchSize < allProductIds.length) {

              await new Promise(resolve => setTimeout(resolve, 200));

    return NextResponse.json(        }

      {       } catch (err) {

        error: 'Failed to load products',        console.warn(`Error fetching batch starting at index ${i}:`, err);

        message: error instanceof Error ? error.message : 'Unknown error'      }

      },    }

      { status: 500 }

    );    console.log(`Successfully fetched ${allProductDetails.length} product details out of ${allProductIds.length} total`);

  }

}    // Se temos produtos, armazenar no cache
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
