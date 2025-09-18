import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'minimal';
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '50')), 100);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    
    // Dados mock expandidos para teste
    const mockProducts = [
      {
        id: "MLB123456789",
        title: "Produto Teste 1 - Camiseta Básica",
        price: 29.90,
        status: "active",
        thumbnail: "https://http2.mlstatic.com/D_NQ_NP_123456-MLA12345678_012023-W.webp",
        available_quantity: 50,
        condition: "new",
        currency_id: "BRL",
        shipping: { free_shipping: true }
      },
      {
        id: "MLB987654321", 
        title: "Produto Teste 2 - Calça Jeans",
        price: 89.90,
        status: "active",
        thumbnail: "https://http2.mlstatic.com/D_NQ_NP_987654-MLA98765432_012023-W.webp",
        available_quantity: 25,
        condition: "new",
        currency_id: "BRL",
        shipping: { free_shipping: false }
      },
      {
        id: "MLB456789123",
        title: "Produto Teste 3 - Tênis Esportivo",
        price: 149.90,
        status: "active",
        thumbnail: "https://http2.mlstatic.com/D_NQ_NP_456789-MLA45678912_012023-W.webp",
        available_quantity: 15,
        condition: "new",
        currency_id: "BRL",
        shipping: { free_shipping: true }
      }
    ];

    // Filtros básicos
    let filteredProducts = mockProducts;
    
    // Filtro por status
    const statusFilter = searchParams.get('status');
    if (statusFilter) {
      filteredProducts = filteredProducts.filter(p => p.status === statusFilter);
    }
    
    // Paginação
    const startIndex = (page - 1) * limit;
    const products = filteredProducts.slice(startIndex, startIndex + limit);
    const total = filteredProducts.length;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      products,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      format,
      api_version: "v1",
      message: `${products.length} produtos encontrados (página ${page} de ${totalPages})`,
      source: "mock-v1-fixed",
      cache_status: "bypassed",
      timestamp: new Date().toISOString(),
      note: "Temporary endpoint while fixing v1/products structure"
    });

  } catch (error) {
    console.error('V1 Products API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}