import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Public Products API called');

    // Buscar apenas produtos do cache (não requer autenticação)
    const cachedProducts = await cache.getAllProducts();
    console.log('Cache check:', {
      exists: !!cachedProducts,
      length: cachedProducts?.length,
      type: typeof cachedProducts
    });

    if (!cachedProducts || cachedProducts.length === 0) {
      return NextResponse.json({
        success: true,
        products: [],
        total: 0,
        message: 'Nenhum produto em cache'
      });
    }

    // Retornar produtos públicos (limitados para performance)
    const publicProducts = cachedProducts.slice(0, 50).map(p => ({
      id: p.id,
      title: p.title,
      price: p.price || 0,
      status: p.status,
      thumbnail: p.pictures && p.pictures.length > 0
        ? p.pictures[0].secure_url || p.pictures[0].url
        : p.secure_thumbnail || p.thumbnail,
      available_quantity: p.available_quantity || 0,
      condition: p.condition || 'not_specified',
      currency_id: p.currency_id || 'BRL',
      shipping: {
        free_shipping: p.shipping?.free_shipping || false
      }
    }));

    return NextResponse.json({
      success: true,
      total: publicProducts.length,
      products: publicProducts,
      message: `${publicProducts.length} produtos encontrados`
    });

  } catch (error) {
    console.error('Erro na API de produtos públicos:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      products: [],
      total: 0
    }, { status: 500 });
  }
}