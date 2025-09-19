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

async function fetchMLProducts(accessToken: string, params: URLSearchParams): Promise<any> {
  // Buscar produtos do vendedor autenticado
  const mlApiUrl = `https://api.mercadolibre.com/users/me/items/search?${params.toString()}`;
  
  const response = await fetch(mlApiUrl, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`ML API Error: ${response.status} ${response.statusText}`);
  }

  const searchResult = await response.json();
  
  // Se temos IDs de produtos, buscar detalhes completos
  if (searchResult.results && searchResult.results.length > 0) {
    const ids = searchResult.results.slice(0, 50); // Limitar a 50 por performance
    const itemsResponse = await fetch(`https://api.mercadolibre.com/items?ids=${ids.join(',')}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (itemsResponse.ok) {
      const itemsData = await itemsResponse.json();
      return {
        results: itemsData.map((item: any) => item.body || item),
        paging: searchResult.paging
      };
    }
  }

  return searchResult;
}

function transformMLProduct(mlProduct: MLProduct): any {
  return {
    id: mlProduct.id,
    title: mlProduct.title,
    price: mlProduct.price,
    thumbnail: mlProduct.thumbnail || (mlProduct.pictures?.[0]?.url || 'https://via.placeholder.com/300x300'),
    condition: mlProduct.condition,
    status: mlProduct.status,
    available_quantity: mlProduct.available_quantity,
    category_id: mlProduct.category_id,
    permalink: mlProduct.permalink,
    sold_quantity: mlProduct.sold_quantity || 0
  };
}

/**
 * API de produtos integrada com Mercado Livre
 * APENAS dados reais - sem fallback para mock
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const format = searchParams.get('format') || 'full';
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Obter informações do cliente para rate limiting
    const clientIP = request.headers.get('x-forwarded-for') ||
                    request.headers.get('x-real-ip') ||
                    'unknown';

    // Rate limiting
    const rateLimitResult = await checkAuthAPILimit('public', clientIP, '/api/products');
    if (!rateLimitResult.allowed) {
      await logSecurityEvent({
        type: SecurityEventType.RATE_LIMIT_EXCEEDED,
        severity: 'MEDIUM',
        clientIP,
        details: {
          endpoint: '/api/products',
          limit: 1000,
          window_ms: 60 * 60 * 1000, // 1 hora
          total_hits: rateLimitResult.totalHits,
          retry_after: rateLimitResult.retryAfter
        },
        path: '/api/products'
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
    
    // Buscar token de acesso no cache
    const kv = getKVClient();
    // 🚀 MULTI-TENANT: Dynamic authentication based on session cookies
    const sessionToken = request.cookies.get('session_token')?.value;
    const userId = request.cookies.get('user_id')?.value;
    const userEmail = request.cookies.get('user_email')?.value?.toLowerCase();

    if (!sessionToken || !userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Usuário não autenticado. Faça login no Mercado Livre para ver seus produtos.',
          redirect: '/api/auth/mercado-livre',
          data: {
            items: [],
            total: 0,
            page: 1,
            per_page: limit
          }
        },
        { status: 401 }
      );
    }

    // Check if user is super admin (platform owner)
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL?.toLowerCase();
    const isSuperAdmin = superAdminEmail && userEmail && userEmail === superAdminEmail;

    let accessToken: string | null = null;
    
    try {
      // Get token for the authenticated user
      const userTokens = await kv.get(CACHE_KEYS.USER_TOKEN(userId));
      if (userTokens && typeof userTokens === 'object' && 'access_token' in userTokens) {
        // Validate session token
        const userData = await kv.get(`user:${userId}`);
        if (userData && typeof userData === 'object' && 'session_token' in userData) {
          if (userData.session_token === sessionToken || isSuperAdmin) {
            accessToken = userTokens.access_token as string;
            console.log(`🔑 Token validado para usuário: ${userId}`);
          } else {
            return NextResponse.json(
              {
                success: false,
                error: 'Sessão inválida. Faça login novamente.',
                redirect: '/api/auth/mercado-livre',
                data: { items: [], total: 0, page: 1, per_page: limit }
              },
              { status: 401 }
            );
          }
        }
      }
    } catch (error) {
      console.warn('Erro ao buscar token do cache:', error);
    }

    // APENAS dados reais - sem fallback
    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Usuário não autenticado. Faça login no Mercado Livre para ver seus produtos.',
          data: {
            items: [],
            total: 0,
            page: 1,
            per_page: limit
          }
        },
        { status: 401 }
      );
    }

    try {
      console.log('🔄 Buscando produtos reais do Mercado Livre...');
      
      // Configurar parâmetros para buscar produtos
      const mlParams = new URLSearchParams({
        limit: Math.min(limit, 50).toString(), // ML limita a 50
        offset: '0'
      });

      if (status) {
        mlParams.append('status', status);
      }

      if (search) {
        mlParams.append('q', search);
      }

      const mlResponse = await fetchMLProducts(accessToken, mlParams);
      
      if (mlResponse.results && Array.isArray(mlResponse.results)) {
        const transformedProducts = mlResponse.results
          .filter((product: any) => product && product.id) // Filtrar produtos válidos
          .map(transformMLProduct);
        
        console.log(`✅ ${transformedProducts.length} produtos reais carregados do ML!`);

        // Formato compatível com repository pattern
        return NextResponse.json({
          success: true,
          data: {
            items: transformedProducts,
            total: mlResponse.paging?.total || transformedProducts.length,
            page: 1,
            per_page: limit
          },
          // Formato legado para compatibilidade
          products: transformedProducts,
          total: mlResponse.paging?.total || transformedProducts.length,
          source: 'mercado_livre_real'
        });
      } else {
        // Sem produtos encontrados
        return NextResponse.json({
          success: true,
          data: {
            items: [],
            total: 0,
            page: 1,
            per_page: limit
          },
          products: [],
          total: 0,
          message: 'Nenhum produto encontrado na sua conta do Mercado Livre.'
        });
      }

    } catch (mlError) {
      console.error('❌ Erro ao buscar produtos do ML:', mlError);
      
      return NextResponse.json(
        {
          success: false,
          error: `Erro ao conectar com Mercado Livre: ${mlError instanceof Error ? mlError.message : 'Erro desconhecido'}`,
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
    console.error('❌ Erro geral no endpoint products:', error);
    
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
