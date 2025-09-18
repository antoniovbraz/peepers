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

    const products = [
      {
        id: "MLB123456789",
        title: "Camiseta Básica",
        price: 29.90,
        status: "active",
        stock: 50
      },
      {
        id: "MLB987654321",
        title: "Calça Jeans",
        price: 89.90,
        status: "paused",
        stock: 25
      }
    ];

    return NextResponse.json({
      success: true,
      products,
      total: products.length,
      message: "Produtos para administração"
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erro interno'
    }, { status: 500 });
  }
}
