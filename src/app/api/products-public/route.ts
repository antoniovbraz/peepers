import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/cache';
import { MLProduct } from '@/types/ml';
import { MOCK_PRODUCTS } from '@/lib/mocks';
import { checkRateLimit } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Public Products API called');

    // Rate limiting: 500 requests per 15 minutes per IP
    const clientIP = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';
    const rateLimit = await checkRateLimit(`public-products:${clientIP}`, 500, 15 * 60 * 1000);

    if (!rateLimit.allowed) {
      console.warn(`Rate limit exceeded for ${clientIP}`);
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.resetTime.toString(),
          }
        }
      );
    }

    // Buscar apenas produtos do cache (não requer autenticação)
    let cachedProducts = await cache.getActiveProducts();

    // Se não há produtos no cache, usar mocks para desenvolvimento
    if (!cachedProducts || cachedProducts.length === 0) {
      console.log('⚠️  No products in cache, using mocks for development');
      cachedProducts = MOCK_PRODUCTS as MLProduct[];
    }

    console.log('Cache check:', {
      exists: !!cachedProducts,
      length: cachedProducts?.length,
      type: typeof cachedProducts,
      source: (!cachedProducts || cachedProducts.length === 0) ? 'mocks' : 'cache'
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
    const publicProducts = cachedProducts.slice(0, 50).map((p: MLProduct) => ({
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
      message: `${publicProducts.length} produtos encontrados`,
      source: cachedProducts === MOCK_PRODUCTS ? 'development-mock' : 'production-cache'
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