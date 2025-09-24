import { cache } from '@/lib/cache';
import { createMercadoLivreAPI } from '@/lib/ml-api';
import type { MLProduct } from '@/types/ml';

interface ProductStats {
  total: number;
  active: number;
  paused: number;
  closed: number;
  outOfStock: number;
  lowStock: number;
  totalValue: number;
  averagePrice: number;
}

/**
 * ML Data Service - Serviço Unificado para Dados do Mercado Livre
 *
 * Centraliza todo acesso aos dados do ML seguindo a arquitetura:
 * 1. Cache-first: Sempre tenta buscar do cache primeiro
 * 2. Sync on demand: Sincroniza apenas quando necessário
 * 3. Single source of truth: Cache como fonte única de dados
 */
export class MLDataService {
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
   * Busca produtos - sempre do cache primeiro
   */
  async getProducts(): Promise<MLProduct[]> {
    console.log('🔄 MLDataService: Buscando produtos do cache...');

    const products = await cache.getAllProducts();

    if (!products || products.length === 0) {
      console.log('⚠️ MLDataService: Cache vazio, retornando array vazio');
      return [];
    }

    console.log(`✅ MLDataService: ${products.length} produtos encontrados no cache`);
    return products;
  }

  /**
   * Calcula estatísticas dos produtos do cache
   */
  async getProductStats(): Promise<ProductStats> {
    console.log('🔄 MLDataService: Calculando estatísticas do cache...');

    const products = await this.getProducts();

    const stats: ProductStats = {
      total: products.length,
      active: products.filter(p => p.status === 'active').length,
      paused: products.filter(p => p.status === 'paused').length,
      closed: products.filter(p => p.status === 'closed').length,
      outOfStock: products.filter(p => (p.available_quantity || 0) === 0).length,
      lowStock: products.filter(p => (p.available_quantity || 0) < 5 && (p.available_quantity || 0) > 0).length,
      totalValue: products.reduce((sum, p) => sum + ((p.price || 0) * (p.available_quantity || 0)), 0),
      averagePrice: products.length > 0 ? products.reduce((sum, p) => sum + (p.price || 0), 0) / products.length : 0
    };

    console.log('✅ MLDataService: Estatísticas calculadas:', stats);
    return stats;
  }

  /**
   * Sincroniza produtos com ML API e atualiza cache
   */
  async syncProducts(userId?: number): Promise<{ synced: number; errors: string[] }> {
    console.log('🔄 MLDataService: Iniciando sincronização com ML API...');

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

      // Buscar produtos da API
      console.log('📡 MLDataService: Buscando produtos da API ML...');
      const mlProducts = await this.mlApi.syncAllProducts();
      console.log(`✅ MLDataService: ${mlProducts.length} produtos obtidos da API`);

      // Salvar no cache
      if (mlProducts.length > 0) {
        console.log('💾 MLDataService: Salvando no cache...');
        await cache.setAllProducts(mlProducts);
        console.log('✅ MLDataService: Produtos salvos no cache');
      }

      return { synced: mlProducts.length, errors };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('❌ MLDataService: Erro na sincronização:', errorMsg);
      errors.push(errorMsg);

      return { synced: 0, errors };
    }
  }

  /**
   * Verifica se o cache precisa de sincronização
   */
  async needsSync(): Promise<boolean> {
    const products = await cache.getAllProducts();
    return !products || products.length === 0;
  }

  /**
   * Limpa o cache de produtos
   */
  async clearCache(): Promise<void> {
    console.log('🗑️ MLDataService: Limpando cache de produtos...');
    await cache.invalidateProductsCache();
    console.log('✅ MLDataService: Cache limpo');
  }
}

// Singleton instance
export const mlDataService = new MLDataService();