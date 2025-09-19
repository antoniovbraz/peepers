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

interface MLItemResponse {
  code: number;
  body: MLProduct;
}

async function fetchMLProducts(accessToken: string, params: URLSearchParams, userId: string): Promise<{results: string[], paging: {total: number}}> {
  // Buscar produtos do vendedor autenticado usando o USER_ID correto
  const mlApiUrl = `https://api.mercadolibre.com/users/${userId}/items/search?${params.toString()}`;
  
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
    // Nesta implementação, retornamos só os IDs para buscar depois
    return {
      results: searchResult.results, // Array de IDs como strings
      paging: searchResult.paging
    };
  }

  return searchResult;
}

function transformMLProduct(mlProduct: MLProduct): Record<string, unknown> {
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
      // 1) Tentar recuperar token do formato USER_TOKEN(userId)
      const userTokens = await kv.get(CACHE_KEYS.USER_TOKEN(userId));
      // 2) Carregar dados do usuário para validar a sessão e, se necessário, extrair token salvo
      const userData = await kv.get(`user:${userId}`);

      // Validar sessão primeiro
      const validSession = !!(userData && typeof userData === 'object' && 'session_token' in userData && (userData.session_token === sessionToken || isSuperAdmin));

      if (!validSession) {
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

      // Fonte A: USER_TOKEN cache
      if (userTokens && typeof userTokens === 'object' && 'access_token' in userTokens) {
        accessToken = userTokens.access_token as string;
      }

      // Fonte B: user cache salvo por cache.setUser (campo token)
      if (!accessToken && userData && typeof userData === 'object' && 'token' in userData) {
        accessToken = userData.token as string;
      }

      if (accessToken) {
        console.log(`🔑 Token validado para usuário: ${userId}`);
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

      const mlResponse = await fetchMLProducts(accessToken, mlParams, userId);
      
      if (mlResponse.results && Array.isArray(mlResponse.results) && mlResponse.results.length > 0) {
        // mlResponse.results contém IDs dos produtos, não produtos completos
        // ✅ CORREÇÃO: ML API não aceita mais que 20 IDs por vez na busca de detalhes
        const productIds = mlResponse.results.slice(0, Math.min(limit, 20)); // Limitar conforme ML API
        
        console.log(`🔍 Buscando detalhes de ${productIds.length} produtos...`);
        
        // Buscar detalhes de todos os produtos de uma vez
        const itemsResponse = await fetch(`https://api.mercadolibre.com/items?ids=${productIds.join(',')}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
          },
        });

        if (!itemsResponse.ok) {
          throw new Error(`ML Items API Error: ${itemsResponse.status} ${itemsResponse.statusText}`);
        }

        const itemsData = await itemsResponse.json();
        
        // Processar os produtos retornados
        const validProducts = (itemsData as MLItemResponse[])
          .filter((item: MLItemResponse) => item.code === 200 && item.body) // Filtrar respostas válidas
          .map((item: MLItemResponse) => item.body) // Extrair o produto
          .filter((product: MLProduct) => product && product.id) // Filtrar produtos válidos
          .map(transformMLProduct);
        
        console.log(`✅ ${validProducts.length} produtos reais carregados do ML!`);

        // Formato compatível com repository pattern
        return NextResponse.json({
          success: true,
          data: {
            items: validProducts,
            total: mlResponse.paging?.total || validProducts.length,
            page: 1,
            per_page: limit
          },
          // Formato legado para compatibilidade
          products: validProducts,
          total: mlResponse.paging?.total || validProducts.length,
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
