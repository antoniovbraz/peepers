import { cache } from '@/lib/cache';
import { createMercadoLivreAPI } from '@/lib/ml-api';
import { Order } from '@/domain/entities/Order';

interface MLOrderData {
  id: string | number;
  status: string;
  status_detail?: string;
  date_created: string;
  date_closed?: string;
  date_last_updated?: string;
  last_updated?: string;
  currency_id?: string;
  total_amount: number;
  total_amount_with_shipping?: number;
  paid_amount: number;
  expiration_date?: string;
  order_items?: unknown[];
  buyer?: {
    id: number;
    nickname: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    phone?: unknown;
  };
  seller?: {
    id: number;
  };
  payments?: unknown[];
  feedback?: unknown;
  shipping?: unknown;
  coupon?: unknown;
  context?: unknown;
  tags?: string[];
}

interface OrderStats {
  total: number;
  byStatus: Record<Order['status'], number>;
  totalRevenue: number;
  totalProfit: number;
  averageOrderValue: number;
  conversionRate: number;
}

/**
 * ML Order Data Service - Serviço Unificado para Dados de Pedidos do Mercado Livre
 *
 * Centraliza todo acesso aos dados de pedidos do ML seguindo a arquitetura:
 * 1. Cache-first: Sempre tenta buscar do cache primeiro
 * 2. Sync on demand: Sincroniza apenas quando necessário
 * 3. Single source of truth: Cache como fonte única de dados
 */
export class MLOrderDataService {
  private mlApi = createMercadoLivreAPI(
    { fetch },
    {
      clientId: process.env.ML_CLIENT_ID!,
      clientSecret: process.env.ML_CLIENT_SECRET!,
      accessToken: process.env.ML_ACCESS_TOKEN,
      refreshToken: process.env.ML_REFRESH_TOKEN,
      userId: process.env.ML_USER_ID
    }
  );

  /**
   * Busca pedidos - sempre do cache primeiro
   */
  async getOrders(): Promise<Order[]> {
    console.log('🔄 MLOrderDataService: Buscando pedidos do cache...');

    // Buscar do cache primeiro
    const cachedOrders = await cache.getAllOrders();

    if (cachedOrders && cachedOrders.length > 0) {
      console.log(`✅ MLOrderDataService: ${cachedOrders.length} pedidos encontrados no cache`);
      return cachedOrders;
    }

    console.log('⚠️ MLOrderDataService: Cache vazio, retornando array vazio');
    return [];
  }

  /**
   * Calcula estatísticas dos pedidos do cache
   */
  async getOrderStats(): Promise<OrderStats> {
    console.log('🔄 MLOrderDataService: Calculando estatísticas do cache...');

    const orders = await this.getOrders();

    const byStatus: Record<Order['status'], number> = {
      confirmed: orders.filter(o => o.status === 'confirmed').length,
      payment_required: orders.filter(o => o.status === 'payment_required').length,
      payment_in_process: orders.filter(o => o.status === 'payment_in_process').length,
      paid: orders.filter(o => o.status === 'paid').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length
    };

    const completedOrders = orders.filter(o => ['paid', 'shipped', 'delivered'].includes(o.status));
    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total_amount, 0);

    const stats: OrderStats = {
      total: orders.length,
      byStatus,
      totalRevenue,
      totalProfit: totalRevenue * 0.1, // 10% margem de lucro
      averageOrderValue: completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0,
      conversionRate: 0.15 // 15% taxa de conversão (mock por enquanto)
    };

    console.log('✅ MLOrderDataService: Estatísticas calculadas:', stats);
    return stats;
  }

  /**
   * Sincroniza pedidos com ML API e atualiza cache
   */
  async syncOrders(userId?: number): Promise<{ synced: number; errors: string[] }> {
    console.log('🔄 MLOrderDataService: Iniciando sincronização de pedidos com ML API...');

    const errors: string[] = [];

    try {
      // Buscar token do usuário
      const targetUserId = userId || parseInt(process.env.ML_USER_ID || '669073070', 10);
      const tokenData = await cache.getUser(targetUserId.toString());

      if (!tokenData?.token) {
        throw new Error('Token de acesso não encontrado. Faça login no ML primeiro.');
      }

      // Configurar API com token
      this.mlApi.setAccessToken(
        tokenData.token,
        targetUserId.toString(),
        tokenData.refresh_token
      );

      // Buscar pedidos da API
      console.log('📡 MLOrderDataService: Buscando pedidos da API ML...');

      // Buscar pedidos recentes (últimos 30 dias)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const ordersResponse = await fetch(
        `https://api.mercadolibre.com/orders/search?seller=${targetUserId}&limit=50&sort=date_desc`,
        {
          headers: {
            'Authorization': `Bearer ${tokenData.token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!ordersResponse.ok) {
        throw new Error(`ML API error: ${ordersResponse.status} ${ordersResponse.statusText}`);
      }

      const ordersData = await ordersResponse.json();
      const mlOrders = ordersData.results || [];

      console.log(`✅ MLOrderDataService: ${mlOrders.length} pedidos obtidos da API`);

      // Converter para formato interno e salvar no cache
      if (mlOrders.length > 0) {
        console.log('💾 MLOrderDataService: Salvando pedidos no cache...');

        // Converter dados da API ML para entidades Order
        const orders: Order[] = mlOrders.map((mlOrder: Record<string, unknown>) => {
          return this.convertMLOrderToEntity(mlOrder);
        });

        // Salvar no cache
        await cache.setAllOrders(orders);

        console.log('✅ MLOrderDataService: Pedidos salvos no cache');
      }

      return { synced: mlOrders.length, errors };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('❌ MLOrderDataService: Erro na sincronização:', errorMsg);
      errors.push(errorMsg);

      return { synced: 0, errors };
    }
  }

  /**
   * Verifica se o cache de pedidos precisa de sincronização
   */
  async needsSync(): Promise<boolean> {
    const orders = await this.getOrders();
    return orders.length === 0;
  }

  /**
   * Limpa o cache de pedidos
   */
  async clearCache(): Promise<void> {
    console.log('🗑️ MLOrderDataService: Limpando cache de pedidos...');
    await cache.invalidateOrdersCache();
    console.log('✅ MLOrderDataService: Cache limpo');
  }

  /**
   * Converte dados da API ML para entidade Order
   */
  private convertMLOrderToEntity(mlOrder: Record<string, unknown>): Order {
    const order = mlOrder as unknown as MLOrderData;
    return new Order(
      String(order.id),
      (order.status as Order['status']) || 'confirmed',
      order.status_detail,
      new Date(order.date_created),
      order.date_closed ? new Date(order.date_closed) : undefined,
      new Date(order.date_last_updated || order.last_updated || order.date_created),
      order.currency_id || 'BRL',
      order.total_amount || 0,
      order.total_amount_with_shipping || order.total_amount || 0,
      order.paid_amount || 0,
      order.expiration_date ? new Date(order.expiration_date) : undefined,
      [], // order_items - será implementado depois
      null, // buyer - será implementado depois
      order.seller?.id || 0,
      [], // payments - será implementado depois
      undefined, // feedback
      undefined, // shipping
      undefined, // coupon
      undefined, // context
      order.tags || []
    );
  }
}

// Singleton instance
export const mlOrderDataService = new MLOrderDataService();