import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const format = searchParams.get('format') || 'full';

    const products = [
      {
        id: "MLB123456789",
        title: "Camiseta Básica",
        price: 29.90,
        thumbnail: "https://via.placeholder.com/300x300",
        condition: "new",
        status: "active",
        available_quantity: 50,
        category_id: "MLB5672"
      },
      {
        id: "MLB987654321",
        title: "Calça Jeans",
        price: 89.90,
        thumbnail: "https://via.placeholder.com/300x300",
        condition: "new",
        status: "active",
        available_quantity: 25,
        category_id: "MLB3530"
      },
      {
        id: "MLB111222333",
        title: "Tênis Esportivo",
        price: 159.90,
        thumbnail: "https://via.placeholder.com/300x300",
        condition: "new",
        status: "paused",
        available_quantity: 0,
        category_id: "MLB12264"
      }
    ];

    const filteredProducts = products.slice(0, limit);

    // Formato compatível com repository pattern
    return NextResponse.json({
      success: true,
      data: {
        items: filteredProducts,
        total: products.length,
        page: 1,
        per_page: limit
      },
      // Formato legado para compatibilidade
      products: filteredProducts,
      total: products.length
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erro interno'
    }, { status: 500 });
  }
}
