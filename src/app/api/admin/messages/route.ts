import { NextRequest, NextResponse } from 'next/server';
import { getKVClient } from '@/lib/cache';
import { CACHE_KEYS } from '@/config/routes';
import { checkAuthAPILimit } from '@/lib/rate-limiter';
import { logSecurityEvent, SecurityEventType } from '@/lib/security-events';

interface MLMessage {
  id: string;
  type: 'question' | 'complaint' | 'post_sale';
  subject: string;
  text: string;
  status: 'unanswered' | 'answered' | 'closed';
  date_created: string;
  from: {
    user_id: number;
    nickname?: string;
    email?: string;
  };
  item?: {
    id: string;
    title: string;
  };
}

async function fetchMLMessages(accessToken: string): Promise<any> {
  const mlApiUrl = 'https://api.mercadolibre.com/messages/packs/me';
  
  const response = await fetch(mlApiUrl, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`ML API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

function transformMLMessageToMessage(mlMessage: any): any {
  return {
    id: mlMessage.id || `MSG-${Date.now()}`,
    type: mlMessage.moderation?.reason || 'question',
    subject: mlMessage.subject || 'Mensagem',
    content: mlMessage.text || mlMessage.messages?.[0]?.text || '',
    buyer: {
      id: mlMessage.from?.user_id || 0,
      name: mlMessage.from?.nickname || `Usuário ${mlMessage.from?.user_id}`,
      email: mlMessage.from?.email || '',
    },
    product: mlMessage.item ? {
      id: mlMessage.item.id,
      title: mlMessage.item.title,
    } : undefined,
    status: mlMessage.status === 'read' ? 'answered' : 'pending',
    priority: 'medium',
    created_at: mlMessage.date_created || new Date().toISOString(),
    answered_at: mlMessage.status === 'read' ? mlMessage.date_read : undefined,
  };
}

// Mock messages baseadas em produtos reais
function generateMockMessages(products: any[], limit: number = 20) {
  const messageTypes = ['question', 'complaint', 'post_sale', 'contact'];
  const subjects = [
    'Disponibilidade de cores',
    'Prazo de entrega',
    'Problema com o produto',
    'Dúvida sobre garantia',
    'Solicitação de troca',
    'Informações técnicas',
    'Status do pedido',
    'Reclamação de qualidade',
  ];

  return Array.from({ length: limit }, (_, index) => {
    const product = products[Math.floor(Math.random() * products.length)];
    const daysAgo = Math.floor(Math.random() * 15);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    
    return {
      id: `MSG-${Date.now()}-${index}`,
      type: messageTypes[Math.floor(Math.random() * messageTypes.length)],
      subject: subjects[Math.floor(Math.random() * subjects.length)],
      content: `Mensagem sobre ${product.title}...`,
      buyer: {
        id: 100000 + index,
        name: `Cliente ${index + 1}`,
        email: `cliente${index + 1}@email.com`,
      },
      product: {
        id: product.id,
        title: product.title,
      },
      status: Math.random() > 0.3 ? 'pending' : 'answered',
      priority: Math.random() > 0.8 ? 'high' : 'medium',
      created_at: date.toISOString(),
      answered_at: Math.random() > 0.5 ? date.toISOString() : undefined,
    };
  });
}

/**
 * API de mensagens integrada com Mercado Livre
 * Tenta usar dados reais do ML, com fallback para simulação
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type') || '';

    // Obter informações do cliente para rate limiting
    const clientIP = request.headers.get('x-forwarded-for') ||
                    request.headers.get('x-real-ip') ||
                    'unknown';
    
    // Obter userId dos cookies para autenticação
    const sessionToken = request.cookies.get('session_token')?.value;
    const userId = request.cookies.get('user_id')?.value;
    
    if (!sessionToken || !userId) {
      return NextResponse.json({
        success: false,
        error: 'Usuário não autenticado. Faça login no Mercado Livre.',
        data: { messages: [] }
      }, { status: 401 });
    }

    // Rate limiting para endpoints administrativos
    const rateLimitResult = await checkAuthAPILimit(userId, clientIP, '/api/admin/messages');
    if (!rateLimitResult.allowed) {
      // Log evento de segurança
      await logSecurityEvent({
        type: SecurityEventType.RATE_LIMIT_EXCEEDED,
        severity: 'HIGH',
        userId,
        clientIP,
        details: {
          endpoint: '/api/admin/messages',
          limit: 500,
          window_ms: 60 * 1000,
          total_hits: rateLimitResult.totalHits,
          retry_after: rateLimitResult.retryAfter
        },
        path: '/api/admin/messages'
      });

      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          retry_after: rateLimitResult.retryAfter,
          limit: 500,
          window_seconds: 60
        },
        {
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
            'X-RateLimit-Limit': '500',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
          }
        }
      );
    }
    
    // Tentar obter token de acesso do cache
    const kv = getKVClient();
    let accessToken: string | null = null;
    
    try {
      // Buscar token no formato USER_TOKEN(userId)
      const userTokens = await kv.get(CACHE_KEYS.USER_TOKEN(userId));
      if (userTokens && typeof userTokens === 'object' && 'access_token' in userTokens) {
        accessToken = userTokens.access_token as string;
      }
      
      // Fallback: buscar no cache do usuário
      if (!accessToken) {
        const userData = await kv.get(`user:${userId}`);
        if (userData && typeof userData === 'object' && 'token' in userData) {
          accessToken = userData.token as string;
        }
      }
    } catch (error) {
      console.warn('Erro ao buscar token do cache:', error);
    }

    if (!accessToken) {
      return NextResponse.json({
        success: false,
        error: 'Token de acesso não encontrado. Faça login novamente.',
        data: { messages: [] }
      }, { status: 401 });
    }

    // TENTATIVA 1: Dados reais do Mercado Livre
    if (accessToken) {
      try {
        console.log('🔄 Buscando mensagens reais do Mercado Livre...');
        
        const mlResponse = await fetchMLMessages(accessToken);
        
        if (mlResponse.results && Array.isArray(mlResponse.results)) {
          const transformedMessages = mlResponse.results
            .map(transformMLMessageToMessage)
            .slice(0, limit);
          
          console.log('✅ Mensagens reais do ML carregadas com sucesso!');

          return NextResponse.json({
            success: true,
            data: {
              messages: transformedMessages,
              total: mlResponse.paging?.total || transformedMessages.length,
            },
            meta: {
              source: 'mercado_livre_real',
              timestamp: new Date().toISOString(),
              message: 'Mensagens reais do Mercado Livre'
            }
          });
        }
      } catch (mlError) {
        console.error('❌ Erro ao buscar mensagens do ML:', mlError);
        // Continuar para fallback
      }
    }

    // TENTATIVA 2: Simulação baseada em produtos reais
    console.log('🔄 Gerando mensagens simuladas baseadas em produtos reais...');
    
    const productsResponse = await fetch(`${request.nextUrl.origin}/api/products-public?format=summary&limit=20`);
    
    if (productsResponse.ok) {
      const productsData = await productsResponse.json();
      const products = productsData.data?.products || [];
      
      if (products.length > 0) {
        const messages = generateMockMessages(products, limit);
        
        console.log('✅ Mensagens simuladas baseadas em produtos reais!');
        
        return NextResponse.json({
          success: true,
          data: {
            messages: type ? messages.filter(m => m.type === type) : messages,
            total: messages.length,
          },
          meta: {
            source: 'products-based-simulation',
            timestamp: new Date().toISOString(),
            message: accessToken 
              ? 'Erro no ML - usando simulação baseada em produtos reais'
              : 'Faça login para ver mensagens reais - usando simulação baseada em produtos reais'
          }
        });
      }
    }

    // TENTATIVA 3: Fallback básico
    console.log('⚠️ Usando mensagens mockadas básicas');
    
    return NextResponse.json({
      success: true,
      data: {
        messages: [],
        total: 0,
      },
      meta: {
        source: 'mock_fallback',
        timestamp: new Date().toISOString(),
        message: 'Nenhuma mensagem encontrada - faça login com Mercado Livre'
      }
    });

  } catch (error) {
    console.error('❌ Erro crítico na API de mensagens:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}