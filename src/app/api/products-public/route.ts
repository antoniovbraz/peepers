import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/cache';
import { MLProduct } from '@/types/ml';
import { MOCK_PRODUCTS } from '@/lib/mocks';
import { checkRateLimit } from '@/lib/utils';
import { validateInput, PaginationSchema, ProductFilterSchema } from '@/lib/validation';

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

    // Validate query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams);
    const paginationValidation = validateInput(PaginationSchema, queryParams);
    const filterValidation = validateInput(ProductFilterSchema, queryParams);

    if (!paginationValidation.success) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters', details: paginationValidation.error },
        { status: 400 }
      );
    }

    if (!filterValidation.success) {
      return NextResponse.json(
        { error: 'Invalid filter parameters', details: filterValidation.error },
        { status: 400 }
      );
    }

    const { page, limit, sort } = paginationValidation.data;
    const filters = filterValidation.data;

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
        page,
        limit,
        message: 'Nenhum produto em cache'
      });
    }

    // Apply filters
    let filteredProducts = cachedProducts;

    if (filters.status) {
      filteredProducts = filteredProducts.filter(p => p.status === filters.status);
    }

    if (filters.condition) {
      filteredProducts = filteredProducts.filter(p => p.condition === filters.condition);
    }

    if (filters.min_price !== undefined) {
      filteredProducts = filteredProducts.filter(p => (p.price || 0) >= filters.min_price!);
    }

    if (filters.max_price !== undefined) {
      filteredProducts = filteredProducts.filter(p => (p.price || 0) <= filters.max_price!);
    }

    if (filters.category) {
      filteredProducts = filteredProducts.filter(p =>
        p.category_id === filters.category
      );
    }

    // Apply sorting
    if (sort) {
      filteredProducts.sort((a, b) => {
        const priceA = a.price || 0;
        const priceB = b.price || 0;

        switch (sort) {
          case 'price_asc':
            return priceA - priceB;
          case 'price_desc':
            return priceB - priceA;
          case 'date_asc':
            return new Date(a.date_created || 0).getTime() - new Date(b.date_created || 0).getTime();
          case 'date_desc':
            return new Date(b.date_created || 0).getTime() - new Date(a.date_created || 0).getTime();
          default:
            return 0;
        }
      });
    }

    // Apply pagination
    const total = filteredProducts.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    // Retornar produtos públicos com paginação e filtros aplicados
    const publicProducts = paginatedProducts.map((p: MLProduct) => ({
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
      total,
      products: publicProducts,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: endIndex < total,
      hasPrev: page > 1,
      message: `${paginatedProducts.length} produtos encontrados (página ${page} de ${Math.ceil(total / limit)})`,
      source: cachedProducts === MOCK_PRODUCTS ? 'development-mock' : 'production-cache',
      filters: Object.keys(filters).length > 0 ? filters : undefined
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