// Rewritten clean admin sales route - uses only real Mercado Livre data
import { NextRequest, NextResponse } from 'next/server';
import { getKVClient } from '@/lib/cache';
import { CACHE_KEYS } from '@/config/routes';
import { checkAuthAPILimit } from '@/lib/rate-limiter';
import { logSecurityEvent, SecurityEventType } from '@/lib/security-events';

interface MLOrder {
  id: number;
  status: string;
  date_created: string;
  total_amount: number;
  currency_id: string;
  buyer: { id: number; nickname?: string };
  order_items: Array<{ item: { id: string; title: string }; quantity: number; unit_price: number }>;
  payments?: Array<{ status: string; payment_method_id: string }>;
  shipping?: { status?: string };
}

interface MLOrderSearchResponse {
  results: MLOrder[];
  paging?: { total: number; offset: number; limit: number };
}

interface TransformedOrder {
  id: string;
  status: string;
  date: string;
  total: number;
  currency: string;
  buyer: string;
  quantity: number;
  items: Array<{ id: string; title: string; quantity: number; price: number }>;
  payment_method?: string;
  payment_status?: string;
  shipping_status?: string;
}

interface SalesMetrics {
  total_orders: number;
  total_revenue: number;
  total_products_sold: number;
  avg_order_value: number;
}

async function fetchMLOrders(accessToken: string, params: URLSearchParams, sellerId: string): Promise<MLOrderSearchResponse> {
  // Usar os parâmetros passados corretamente
  const limit = params.get('limit') || '20';
  const offset = params.get('offset') || '0';
  const mlApiUrl = `https://api.mercadolibre.com/orders/search?seller=${sellerId}&limit=${limit}&offset=${offset}`;

  console.log('🔄 Buscando pedidos do ML:', mlApiUrl);

  const res = await fetch(mlApiUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json'
    }
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('❌ Erro na API do ML:', res.status, errorText);
    throw new Error(`ML Orders API Error: ${res.status} ${res.statusText} - ${errorText}`);
  }

  const data = await res.json();
  console.log('✅ Dados recebidos do ML:', data);

  return data;
}

function transformMLOrderToOrder(mlOrder: MLOrder): TransformedOrder {
  return {
    id: String(mlOrder.id),
    status: mlOrder.status,
    date: mlOrder.date_created,
    total: mlOrder.total_amount,
    currency: mlOrder.currency_id,
    buyer: mlOrder.buyer.nickname || `Usuário ${mlOrder.buyer.id}`,
    quantity: mlOrder.order_items.reduce((s, it) => s + (it.quantity || 0), 0),
    items: mlOrder.order_items.map(it => ({ id: it.item.id, title: it.item.title, quantity: it.quantity, price: it.unit_price })),
    payment_method: mlOrder.payments?.[0]?.payment_method_id,
    payment_status: mlOrder.payments?.[0]?.status,
    shipping_status: mlOrder.shipping?.status,
  };
}

function calculateSalesMetrics(orders: TransformedOrder[]): SalesMetrics {
  const completed = orders.filter(o => ['paid', 'shipped', 'delivered', 'completed'].includes(o.status));
  const totalOrders = completed.length;
  const totalRevenue = completed.reduce((s, o) => s + (o.total || 0), 0);
  const totalProducts = completed.reduce((s, o) => s + (o.quantity || 0), 0);
  return {
    total_orders: totalOrders,
    total_revenue: Math.round(totalRevenue * 100) / 100,
    total_products_sold: totalProducts,
    avg_order_value: totalOrders ? Math.round((totalRevenue / totalOrders) * 100) / 100 : 0,
  };
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const search = searchParams.get('search') || '';

    const clientIP = (request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown') as string;
    const rate = await checkAuthAPILimit('admin', clientIP, '/api/admin/sales');
    if (!rate.allowed) {
      await logSecurityEvent({ type: SecurityEventType.RATE_LIMIT_EXCEEDED, severity: 'MEDIUM', clientIP, details: { endpoint: '/api/admin/sales' }, path: '/api/admin/sales' });
      return NextResponse.json({ error: 'Rate limit exceeded', retry_after: rate.retryAfter }, { status: 429 });
    }

    const kv = getKVClient();
    const sessionToken = request.cookies.get('session_token')?.value;
    const userId = request.cookies.get('user_id')?.value;

    if (!sessionToken || !userId) {
      return NextResponse.json({ success: false, error: 'Usuário não autenticado', data: { orders: [], metrics: null } }, { status: 401 });
    }

    let accessToken: string | null = null;
    try {
      const tokens = await kv.get(CACHE_KEYS.USER_TOKEN(userId)) as Record<string, unknown> | null;
      if (tokens?.access_token) accessToken = tokens.access_token as string;
      const userData = await kv.get(`user:${userId}`) as Record<string, unknown> | null;
      if (!accessToken && userData?.token) accessToken = userData.token as string;
    } catch (err) {
      console.warn('KV read error', err);
    }

    if (!accessToken) {
      return NextResponse.json({ success: false, error: 'Token de acesso não encontrado', data: { orders: [], metrics: null } }, { status: 401 });
    }

    // Simplificar parâmetros - usar apenas limit e offset por enquanto
    const params = new URLSearchParams({
      limit: String(Math.min(limit, 20)), // Limitar a 20 para evitar rate limits
      offset: String(offset)
    });

    // Não usar filtros complexos por enquanto para evitar erros da API
    // if (status) params.append('order.status', status);

    // Buscar todos os pedidos para calcular métricas corretas
    const allOrdersParams = new URLSearchParams({
      limit: '200', // Buscar mais pedidos para métricas mais precisas
      offset: '0'
    });

    const allOrdersResp = await fetchMLOrders(accessToken, allOrdersParams, userId);
    const allOrders = (allOrdersResp.results || []).map(transformMLOrderToOrder);
    const globalMetrics = calculateSalesMetrics(allOrders);

    const mlResp = await fetchMLOrders(accessToken, params, userId);
    const transformed = (mlResp.results || []).map(transformMLOrderToOrder);

    const filtered = search
      ? transformed.filter(o => o.buyer.toLowerCase().includes(search.toLowerCase()) || o.items.some(it => it.title.toLowerCase().includes(search.toLowerCase())))
      : transformed;

    return NextResponse.json({
      success: true,
      data: {
        orders: filtered,
        metrics: globalMetrics,
        pagination: {
          total: mlResp.paging?.total ?? transformed.length,
          offset: mlResp.paging?.offset ?? offset,
          limit: mlResp.paging?.limit ?? limit,
          has_more: (mlResp.paging?.offset ?? 0) + (mlResp.paging?.limit ?? limit) < (mlResp.paging?.total ?? transformed.length),
        },
      },
      source: 'mercado_livre_real',
    });
  } catch (error) {
    console.error('sales route error', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Erro desconhecido', data: { orders: [], metrics: null } }, { status: 500 });
  }
}