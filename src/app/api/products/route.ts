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

  console.log('🔗 Fazendo chamada para ML API:', mlApiUrl);
  console.log('🔑 Usando token (primeiros 10 chars):', accessToken.substring(0, 10) + '...');

  const response = await fetch(mlApiUrl, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  });

  console.log('📡 Resposta ML API - Status:', response.status, response.statusText);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Erro na resposta ML API:', errorText);
    throw new Error(`ML API Error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const searchResult = await response.json();
  console.log('📦 Dados recebidos da ML API:', {
    hasResults: !!searchResult.results,
    resultsCount: searchResult.results?.length || 0,
    hasPaging: !!searchResult.paging,
    total: searchResult.paging?.total || 0
  });
  
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

function ensureHttps(url: string): string {
  if (!url) return url;
  return url.replace(/^http:\/\//, 'https://');
}

function transformMLProduct(mlProduct: MLProduct): Record<string, unknown> {
  return {
    id: mlProduct.id,
    title: mlProduct.title,
    price: mlProduct.price,
    thumbnail: ensureHttps(mlProduct.thumbnail || (mlProduct.pictures?.[0]?.url || 'https://via.placeholder.com/300x300')),
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
    console.log('🚀 Iniciando requisição GET /api/products');
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const page = parseInt(searchParams.get('page') || '1');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    console.log('📋 Parâmetros da requisição:', { limit, offset, page, status, search });

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
    console.log('🔧 Cliente KV inicializado');

    // 🚀 MULTI-TENANT: Dynamic authentication based on session cookies
    const sessionToken = request.cookies.get('session_token')?.value;
    const userId = request.cookies.get('user_id')?.value;
    const userEmail = request.cookies.get('user_email')?.value?.toLowerCase();

    console.log('🍪 Cookies recebidos:', {
      hasSessionToken: !!sessionToken,
      hasUserId: !!userId,
      hasUserEmail: !!userEmail,
      userId: userId,
      userEmail: userEmail?.substring(0, 10) + '...'
    });

    if (!sessionToken || !userId) {
      console.log('❌ Falta autenticação - retornando 401');
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
      const cacheKey = CACHE_KEYS.USER_TOKEN(userId);
      console.log('🔑 Buscando token no cache com chave:', cacheKey);

      const userTokens = await kv.get(cacheKey);
      console.log('📦 Dados do cache USER_TOKEN:', {
        found: !!userTokens,
        type: typeof userTokens,
        hasAccessToken: userTokens && typeof userTokens === 'object' && 'access_token' in userTokens
      });

      // 2) Carregar dados do usuário para validar a sessão e, se necessário, extrair token salvo
      const userDataKey = `user:${userId}`;
      console.log('👤 Buscando dados do usuário no cache com chave:', userDataKey);

      const userData = await kv.get(userDataKey);
      console.log('📦 Dados do usuário no cache:', {
        found: !!userData,
        type: typeof userData,
        hasSessionToken: userData && typeof userData === 'object' && 'session_token' in userData,
        hasToken: userData && typeof userData === 'object' && 'token' in userData
      });

      // Validar sessão primeiro
      const validSession = !!(userData && typeof userData === 'object' && 'session_token' in userData && (userData.session_token === sessionToken || isSuperAdmin));
      console.log('🔐 Validação de sessão:', {
        validSession,
        hasUserData: !!userData,
        userDataType: typeof userData,
        hasSessionTokenInData: userData && typeof userData === 'object' && 'session_token' in userData,
        sessionTokensMatch: userData && typeof userData === 'object' && 'session_token' in userData && userData.session_token === sessionToken,
        isSuperAdmin
      });

      if (!validSession) {
        console.log('❌ Sessão inválida - retornando 401');
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
        console.log('✅ Token encontrado na fonte A (USER_TOKEN cache)');
      }

      // Fonte B: user cache salvo por cache.setUser (campo token)
      if (!accessToken && userData && typeof userData === 'object' && 'token' in userData) {
        accessToken = userData.token as string;
        console.log('✅ Token encontrado na fonte B (user cache)');
      }

      if (accessToken) {
        console.log(`🔑 Token validado para usuário: ${userId}`);
      } else {
        console.log('❌ Nenhum token de acesso encontrado');
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
      console.log('📊 Parâmetros:', { limit, offset, page, status, search });
      console.log('👤 User ID:', userId);
      console.log('🔑 Token presente:', !!accessToken);

      // Configurar parâmetros para buscar produtos
      const mlParams = new URLSearchParams({
        limit: Math.min(limit, 50).toString(), // ML limita a 50
        offset: offset.toString()
      });

      if (status) {
        mlParams.append('status', status);
      }

      if (search) {
        mlParams.append('q', search);
      }

      console.log('🌐 ML API URL:', `https://api.mercadolibre.com/users/${userId}/items/search?${mlParams.toString()}`);

      const mlResponse = await fetchMLProducts(accessToken, mlParams, userId);
      
      if (mlResponse.results && Array.isArray(mlResponse.results) && mlResponse.results.length > 0) {
        // mlResponse.results contém IDs dos produtos, não produtos completos
        // ✅ CORREÇÃO: ML API não aceita mais que 100 IDs por vez na busca de detalhes
        const productIds = mlResponse.results.slice(0, Math.min(limit, 100)); // Limitar conforme ML API

        console.log(`🔍 Buscando detalhes de ${productIds.length} produtos...`);
        console.log('📋 IDs dos produtos:', productIds.slice(0, 5), productIds.length > 5 ? `...e mais ${productIds.length - 5}` : '');

        // Buscar detalhes de todos os produtos de uma vez
        const itemsUrl = `https://api.mercadolibre.com/items?ids=${productIds.join(',')}`;
        console.log('🔗 URL para buscar detalhes:', itemsUrl);

        const itemsResponse = await fetch(itemsUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
          },
        });

        console.log('📡 Resposta detalhes produtos - Status:', itemsResponse.status, itemsResponse.statusText);

        if (!itemsResponse.ok) {
          const errorText = await itemsResponse.text();
          console.error('❌ Erro na resposta detalhes produtos:', errorText);
          throw new Error(`ML Items API Error: ${itemsResponse.status} ${itemsResponse.statusText} - ${errorText}`);
        }

        const itemsData = await itemsResponse.json();

        console.log('📦 Dados brutos dos produtos recebidos:', {
          totalItems: itemsData.length,
          firstItem: itemsData[0] ? {
            code: itemsData[0].code,
            hasBody: !!itemsData[0].body,
            bodyId: itemsData[0].body?.id
          } : null
        });

        // Processar os produtos retornados
        const validProducts = (itemsData as MLItemResponse[])
          .filter((item: MLItemResponse) => item.code === 200 && item.body) // Filtrar respostas válidas
          .map((item: MLItemResponse) => item.body) // Extrair o produto
          .filter((product: MLProduct) => product && product.id) // Filtrar produtos válidos
          .map(transformMLProduct);

        console.log(`✅ ${validProducts.length} produtos válidos processados`);
        console.log('📊 Primeiro produto processado:', validProducts[0] ? {
          id: validProducts[0].id,
          title: typeof validProducts[0].title === 'string' ? validProducts[0].title.substring(0, 50) : 'N/A',
          price: validProducts[0].price
        } : 'Nenhum produto');

        // Formato compatível com repository pattern
        return NextResponse.json({
          success: true,
          data: {
            items: validProducts,
            total: mlResponse.paging?.total || validProducts.length,
            page: Math.floor(offset / limit) + 1,
            per_page: limit,
            total_pages: Math.ceil((mlResponse.paging?.total || validProducts.length) / limit),
            offset: offset,
            has_more: offset + limit < (mlResponse.paging?.total || 0)
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
      console.error('❌ Detalhes do erro:', {
        message: mlError instanceof Error ? mlError.message : 'Erro desconhecido',
        stack: mlError instanceof Error ? mlError.stack : undefined,
        name: mlError instanceof Error ? mlError.name : undefined
      });

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
