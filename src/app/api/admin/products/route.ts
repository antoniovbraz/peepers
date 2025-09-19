import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Este endpoint é protegido pelo middleware
    const userId = request.cookies.get('user_id')?.value;
    
    if (!userId) {
      return NextResponse.json({
        error: 'Unauthorized'
      }, { status: 401 });
    }

    // Mock data para demonstração do admin panel
    const products = [
      {
        id: "MLB123456789",
        title: "Camiseta Básica Premium",
        price: 29.90,
        currency_id: "BRL",
        status: "active",
        available_quantity: 50,
        sold_quantity: 15,
        condition: "new",
        listing_type_id: "gold_special",
        category_id: "MLB1246",
        domain_id: "MLB-T_SHIRTS",
        thumbnail: "https://http2.mlstatic.com/mock-image-1.jpg",
        secure_thumbnail: "https://http2.mlstatic.com/mock-image-1.jpg",
        seller_id: 669073070,
        permalink: "https://produto.mercadolivre.com.br/MLB123456789",
        date_created: "2025-01-15T10:30:00Z",
        last_updated: "2025-09-15T14:20:00Z",
        pictures: [],
        attributes: [],
        variations: [],
        shipping: {
          mode: "me2",
          methods: [],
          tags: ["self_service_in"],
          local_pick_up: true,
          free_shipping: false
        },
        tags: ["good_quality_picture", "good_quality_thumbnail"],
        warranty: "Garantia do vendedor: 30 dias",
        catalog_listing: false
      },
      {
        id: "MLB987654321", 
        title: "Calça Jeans Masculina",
        price: 89.90,
        currency_id: "BRL",
        status: "paused",
        available_quantity: 25,
        sold_quantity: 8,
        condition: "new",
        listing_type_id: "gold_pro",
        category_id: "MLB1247",
        domain_id: "MLB-PANTS",
        thumbnail: "https://http2.mlstatic.com/mock-image-2.jpg",
        secure_thumbnail: "https://http2.mlstatic.com/mock-image-2.jpg",
        seller_id: 669073070,
        permalink: "https://produto.mercadolivre.com.br/MLB987654321",
        date_created: "2025-02-10T09:15:00Z",
        last_updated: "2025-09-10T16:45:00Z",
        pictures: [],
        attributes: [],
        variations: [],
        shipping: {
          mode: "me2",
          methods: [],
          tags: ["self_service_in"],
          local_pick_up: true,
          free_shipping: true
        },
        tags: ["good_quality_picture", "good_quality_thumbnail"],
        warranty: "Garantia do vendedor: 30 dias",
        catalog_listing: false
      },
      {
        id: "MLB555444333",
        title: "Tênis Esportivo Unissex",
        price: 159.99,
        currency_id: "BRL",
        status: "active", 
        available_quantity: 0,
        sold_quantity: 22,
        condition: "new",
        listing_type_id: "gold_special",
        category_id: "MLB1248",
        domain_id: "MLB-SNEAKERS",
        thumbnail: "https://http2.mlstatic.com/mock-image-3.jpg",
        secure_thumbnail: "https://http2.mlstatic.com/mock-image-3.jpg",
        seller_id: 669073070,
        permalink: "https://produto.mercadolivre.com.br/MLB555444333",
        date_created: "2025-03-05T11:20:00Z",
        last_updated: "2025-09-12T13:30:00Z",
        pictures: [],
        attributes: [],
        variations: [],
        shipping: {
          mode: "me2",
          methods: [],
          tags: ["self_service_in"],
          local_pick_up: false,
          free_shipping: true
        },
        tags: ["good_quality_picture", "good_quality_thumbnail"],
        warranty: "Garantia do vendedor: 90 dias",
        catalog_listing: false
      },
      {
        id: "MLB777888999",
        title: "Mochila Executiva",
        price: 120.00,
        currency_id: "BRL",
        status: "active",
        available_quantity: 3,
        sold_quantity: 12,
        condition: "new", 
        listing_type_id: "gold_pro",
        category_id: "MLB1249",
        domain_id: "MLB-BACKPACKS",
        thumbnail: "https://http2.mlstatic.com/mock-image-4.jpg",
        secure_thumbnail: "https://http2.mlstatic.com/mock-image-4.jpg",
        seller_id: 669073070,
        permalink: "https://produto.mercadolivre.com.br/MLB777888999",
        date_created: "2025-04-12T08:45:00Z",
        last_updated: "2025-09-14T10:15:00Z",
        pictures: [],
        attributes: [],
        variations: [],
        shipping: {
          mode: "me2",
          methods: [],
          tags: ["self_service_in"],
          local_pick_up: true,
          free_shipping: false
        },
        tags: ["good_quality_picture", "good_quality_thumbnail"],
        warranty: "Garantia do vendedor: 60 dias",
        catalog_listing: false
      },
      {
        id: "MLB111222333",
        title: "Relógio Digital",
        price: 45.50,
        currency_id: "BRL",
        status: "closed",
        available_quantity: 0,
        sold_quantity: 18,
        condition: "new",
        listing_type_id: "gold_special",
        category_id: "MLB1250",
        domain_id: "MLB-WATCHES",
        thumbnail: "https://http2.mlstatic.com/mock-image-5.jpg",
        secure_thumbnail: "https://http2.mlstatic.com/mock-image-5.jpg",
        seller_id: 669073070,
        permalink: "https://produto.mercadolivre.com.br/MLB111222333",
        date_created: "2025-05-08T12:10:00Z",
        last_updated: "2025-08-20T15:25:00Z",
        pictures: [],
        attributes: [],
        variations: [],
        shipping: {
          mode: "me2",
          methods: [],
          tags: ["self_service_in"],
          local_pick_up: false,
          free_shipping: false
        },
        tags: ["good_quality_picture", "good_quality_thumbnail"],
        warranty: "Garantia do vendedor: 30 dias",
        catalog_listing: false
      }
    ];

    // Format response to match expected structure
    const response = {
      success: true,
      data: {
        items: products,
        total: products.length,
        page: 1,
        limit: 1000,
        hasMore: false
      },
      message: "Admin products data loaded successfully"
    };

    return NextResponse.json(response);

  } catch {
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}
