import { cache } from '@/lib/cache';
import { createMercadoLivreAPI } from '@/lib/ml-api';
import type { Order } from '@/domain/entities/Order';

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

    // Por enquanto, retorna array vazio até implementarmos cache de pedidos
    // TODO: Implementar cache de pedidos
    console.log('⚠️ MLOrderDataService: Cache de pedidos ainda não implementado, retornando vazio');
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

        // TODO: Implementar conversão e cache de pedidos
        // Por enquanto, apenas log
        console.log('✅ MLOrderDataService: Pedidos salvos no cache (simulado)');
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
    // TODO: Implementar limpeza do cache de pedidos
    console.log('✅ MLOrderDataService: Cache limpo (simulado)');
  }
}

// Singleton instance
export const mlOrderDataService = new MLOrderDataService();