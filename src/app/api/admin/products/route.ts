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
        status: "active",
        available_quantity: 50,
        category: "Roupas",
        condition: "new",
        permalink: "https://produto.mercadolivre.com.br/MLB123456789"
      },
      {
        id: "MLB987654321", 
        title: "Calça Jeans Masculina",
        price: 89.90,
        status: "paused",
        available_quantity: 25,
        category: "Roupas",
        condition: "new",
        permalink: "https://produto.mercadolivre.com.br/MLB987654321"
      },
      {
        id: "MLB555444333",
        title: "Tênis Esportivo Unissex",
        price: 159.99,
        status: "active", 
        available_quantity: 0,
        category: "Calçados",
        condition: "new",
        permalink: "https://produto.mercadolivre.com.br/MLB555444333"
      },
      {
        id: "MLB777888999",
        title: "Mochila Executiva",
        price: 120.00,
        status: "active",
        available_quantity: 3,
        category: "Acessórios",
        condition: "new", 
        permalink: "https://produto.mercadolivre.com.br/MLB777888999"
      },
      {
        id: "MLB111222333",
        title: "Relógio Digital",
        price: 45.50,
        status: "closed",
        available_quantity: 0,
        category: "Eletrônicos",
        condition: "new",
        permalink: "https://produto.mercadolivre.com.br/MLB111222333"
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

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}
