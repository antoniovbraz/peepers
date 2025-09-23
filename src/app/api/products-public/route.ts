import { NextRequest, NextResponse } from 'next/server';
import { getKVClient } from '@/lib/cache';
import { CACHE_KEYS } from '@/config/routes';
import { checkAuthAPILimit } from '@/lib/rate-limiter';
import { logSecurityEvent, SecurityEventType } from '@/lib/security-events';

interface MLProduct {
  id: string;
  title: string;
  price: number;
  thumbnail: string;
  condition: string;
  status: string;
  available_quantity: number;
  category_id: string;
  permalink: string;
  sold_quantity: number;
  pictures?: Array<{url: string}>;
}

/**
 * API pública de produtos - busca do cache sem autenticação
 * Usada pela homepage e página /produtos
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Iniciando requisição GET /api/products-public');
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const page = parseInt(searchParams.get('page') || '1');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const format = searchParams.get('format') || 'default';

    console.log('📋 Parâmetros da requisição:', { limit, offset, page, status, search, format });

    // Obter informações do cliente para rate limiting
    const clientIP = request.headers.get('x-forwarded-for') ||
                    request.headers.get('x-real-ip') ||
                    'unknown';

    // Rate limiting mais permissivo para API pública
    const rateLimitResult = await checkAuthAPILimit('public', clientIP, '/api/products-public');
    if (!rateLimitResult.allowed) {
      await logSecurityEvent({
        type: SecurityEventType.RATE_LIMIT_EXCEEDED,
        severity: 'LOW',
        clientIP,
        details: {
          endpoint: '/api/products-public',
          limit: 1000,
          window_ms: 60 * 60 * 1000, // 1 hora
          total_hits: rateLimitResult.totalHits,
          retry_after: rateLimitResult.retryAfter
        },
        path: '/api/products-public'
      });

      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          retry_after: rateLimitResult.retryAfter,
          limit: 1000,
          window_seconds: 3600
        },
        {
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter?.toString() || '3600',
            'X-RateLimit-Limit': '1000',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
          }
        }
      );
    }

    // Buscar produtos do cache
    const kv = getKVClient();
    console.log('🔧 Cliente KV inicializado');

    try {
      // Buscar produtos do cache
      const cacheKey = CACHE_KEYS.PRODUCTS_ALL;
      console.log('🔑 Buscando produtos no cache com chave:', cacheKey);

      const cachedProducts = await kv.get(cacheKey);
      console.log('📦 Dados do cache:', {
        found: !!cachedProducts,
        type: typeof cachedProducts,
        isArray: Array.isArray(cachedProducts),
        length: Array.isArray(cachedProducts) ? cachedProducts.length : 'N/A'
      });

      let products: MLProduct[] = [];

      if (cachedProducts && Array.isArray(cachedProducts) && cachedProducts.length > 0) {
        products = cachedProducts as MLProduct[];
        console.log(`✅ ${products.length} produtos encontrados no cache`);
      } else {
        console.log('⚠️ Nenhum produto encontrado no cache - retornando lista vazia');
        return NextResponse.json({
          success: true,
          data: {
            items: [],
            total: 0,
            page: 1,
            per_page: limit,
            total_pages: 0,
            offset: offset,
            has_more: false
          },
          products: [],
          total: 0,
          message: 'Nenhum produto encontrado. Tente sincronizar os produtos primeiro.',
          source: 'cache_empty'
        });
      }

      // Filtrar por status se especificado
      if (status) {
        products = products.filter(product => product.status === status);
        console.log(`🔍 Filtrados ${products.length} produtos com status: ${status}`);
      }

      // Filtrar por busca se especificada
      if (search) {
        const searchLower = search.toLowerCase();
        products = products.filter(product =>
          (product.title || '').toLowerCase().includes(searchLower) ||
          product.id.includes(search)
        );
        console.log(`🔍 Filtrados ${products.length} produtos com busca: ${search}`);
      }

      // Aplicar paginação
      const totalProducts = products.length;
      const startIndex = offset;
      const endIndex = startIndex + limit;
      const paginatedProducts = products.slice(startIndex, endIndex);

      console.log(`📄 Pagina ${page}: ${paginatedProducts.length} produtos (${startIndex}-${endIndex} de ${totalProducts})`);

      // Transformar produtos baseado no formato solicitado
      let transformedProducts: any[] = paginatedProducts;

      if (format === 'summary') {
        // Formato summary inclui pictures array para melhores imagens
        transformedProducts = paginatedProducts.map(product => ({
          id: product.id,
          title: product.title,
          price: product.price,
          thumbnail: product.thumbnail,
          pictures: product.pictures || [],
          condition: product.condition,
          status: product.status,
          available_quantity: product.available_quantity,
          category_id: product.category_id,
          permalink: product.permalink,
          sold_quantity: product.sold_quantity || 0
        }));
      }

      // Estatísticas dos produtos
      const activeProducts = products.filter(p => p.status === 'active').length;
      const pausedProducts = products.filter(p => p.status === 'paused').length;

      console.log(`📊 Estatísticas: ${activeProducts} ativos, ${pausedProducts} pausados, ${products.length} total`);

      // Formato compatível com repository pattern
      return NextResponse.json({
        success: true,
        data: {
          items: transformedProducts,
          total: totalProducts,
          page: page,
          per_page: limit,
          total_pages: Math.ceil(totalProducts / limit),
          offset: offset,
          has_more: endIndex < totalProducts
        },
        // Formato legado para compatibilidade
        products: transformedProducts,
        total: totalProducts,
        statistics: {
          total_products: totalProducts,
          active_products: activeProducts,
          paused_products: pausedProducts
        },
        source: 'cache'
      });

    } catch (cacheError) {
      console.error('❌ Erro ao buscar produtos do cache:', cacheError);
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao acessar cache de produtos',
          data: {
            items: [],
            total: 0,
            page: 1,
            per_page: limit
          }
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Erro geral no endpoint products-public:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
        data: {
          items: [],
          total: 0,
          page: 1,
          per_page: 20
        }
      },
      { status: 500 }
    );
  }
}