/**
 * Missed Feeds Recovery Service - Peepers Enterprise v2.0.0
 *
 * Serviço para recuperação de notificações perdidas do Mercado Livre
 * Implementa estratégia de recuperação automática conforme especificação oficial
 */

import { MercadoLivreAPI } from '@/lib/ml-api';
import { getKVClient } from '@/lib/cache';
import { logger } from '@/lib/logger';

export interface MissedFeed {
  id: string;
  resource: string;
  user_id: number;
  topic: string;
  application_id: number;
  attempts: number;
  sent: string;
  received?: string;
  processed_at?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface RecoveryResult {
  processed: number;
  failed: number;
  skipped: number;
  total: number;
  duration_ms: number;
}

export class MissedFeedsRecoveryService {
  private static readonly CACHE_TTL = 3600; // 1 hour
  private static readonly MAX_RECOVERY_ATTEMPTS = 3;
  private static readonly RECOVERY_BATCH_SIZE = 50;

  /**
   * Executa recuperação completa de feeds perdidos
   */
  static async recoverAllMissedFeeds(
    tenantId: string,
    options: {
      topics?: string[];
      maxAgeHours?: number;
      dryRun?: boolean;
    } = {}
  ): Promise<RecoveryResult> {
    const startTime = Date.now();
    const kv = getKVClient();

    try {
      logger.info({ tenantId, options }, '🚀 Iniciando recuperação de feeds perdidos');

      // Buscar tokens do tenant
      const tokens = await getMLTokens(tenantId);
      if (!tokens?.access_token) {
        throw new Error('No valid ML tokens found for tenant');
      }

      const mlApi = new MercadoLivreAPI(
        { fetch } as any,
        process.env.ML_CLIENT_ID!,
        process.env.ML_CLIENT_SECRET!,
        {
          accessToken: tokens.access_token,
          userId: tokens.user_id?.toString()
        }
      );

      const appId = process.env.ML_CLIENT_ID!;
      let totalProcessed = 0;
      let totalFailed = 0;
      let totalSkipped = 0;
      let hasMore = true;
      let offset = 0;

      while (hasMore) {
        // Buscar lote de feeds perdidos
        const missedFeedsResponse = await mlApi.getMissedFeeds(appId, tokens.access_token, {
          limit: this.RECOVERY_BATCH_SIZE,
          offset,
          ...(options.topics?.length === 1 && { topic: options.topics[0] })
        });

        const { feeds, paging } = missedFeedsResponse;

        if (feeds.length === 0) {
          hasMore = false;
          break;
        }

        logger.info({
          batch: feeds.length,
          offset,
          total: paging.total
        }, '📦 Processando lote de feeds perdidos');

        // Filtrar por tópicos se especificado
        let filteredFeeds = feeds;
        if (options.topics && options.topics.length > 0) {
          filteredFeeds = feeds.filter(feed => options.topics!.includes(feed.topic));
        }

        // Filtrar por idade máxima se especificado
        if (options.maxAgeHours) {
          const maxAgeMs = options.maxAgeHours * 60 * 60 * 1000;
          const cutoffTime = new Date(Date.now() - maxAgeMs);
          filteredFeeds = filteredFeeds.filter(feed =>
            new Date(feed.sent) > cutoffTime
          );
        }

        // Processar feeds filtrados
        for (const feed of filteredFeeds) {
          try {
            if (options.dryRun) {
              logger.info({ feedId: feed.id, topic: feed.topic }, '🔍 [DRY RUN] Feed seria processado');
              totalProcessed++;
              continue;
            }

            await this.processMissedFeed(feed, tenantId);
            totalProcessed++;
          } catch (error) {
            logger.error({ error, feedId: feed.id }, '❌ Falha ao processar feed perdido');
            totalFailed++;
          }
        }

        totalSkipped += feeds.length - filteredFeeds.length;
        offset += this.RECOVERY_BATCH_SIZE;

        // Evitar sobrecarga - pausa entre lotes
        if (hasMore && offset < paging.total) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      const result: RecoveryResult = {
        processed: totalProcessed,
        failed: totalFailed,
        skipped: totalSkipped,
        total: totalProcessed + totalFailed + totalSkipped,
        duration_ms: Date.now() - startTime
      };

      logger.info(result, '✅ Recuperação de feeds perdidos concluída');

      // Cache do resultado para monitoramento
      await kv.set(
        `missed_feeds_recovery:${tenantId}:${Date.now()}`,
        result,
        { ex: this.CACHE_TTL }
      );

      return result;

    } catch (error) {
      logger.error({ error, tenantId }, '❌ Erro na recuperação de feeds perdidos');
      throw error;
    }
  }

  /**
   * Processa um feed perdido individualmente
   */
  private static async processMissedFeed(
    feed: any,
    tenantId: string
  ): Promise<void> {
    const kv = getKVClient();
    const feedKey = `processed_feed:${feed.id}`;

    // Verificar se já foi processado
    const alreadyProcessed = await kv.get(feedKey);
    if (alreadyProcessed) {
      logger.info({ feedId: feed.id }, '⏭️ Feed já foi processado anteriormente');
      return;
    }

    logger.info({
      feedId: feed.id,
      topic: feed.topic,
      resource: feed.resource
    }, '🔄 Processando feed perdido');

    try {
      // Simular processamento baseado no tópico
      switch (feed.topic) {
        case 'orders_v2':
          await this.processOrderFeed(feed, tenantId);
          break;
        case 'items':
          await this.processItemFeed(feed, tenantId);
          break;
        case 'questions':
          await this.processQuestionFeed(feed, tenantId);
          break;
        case 'messages':
          await this.processMessageFeed(feed, tenantId);
          break;
        default:
          logger.warn({ topic: feed.topic }, '⚠️ Tópico não suportado para recuperação');
      }

      // Marcar como processado
      await kv.set(feedKey, {
        processed_at: new Date().toISOString(),
        status: 'completed',
        topic: feed.topic,
        resource: feed.resource
      }, { ex: this.CACHE_TTL * 24 }); // 24 horas

    } catch (error) {
      logger.error({ error, feedId: feed.id }, '❌ Erro ao processar feed perdido');

      // Marcar como falha (para retry posterior)
      await kv.set(feedKey, {
        processed_at: new Date().toISOString(),
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        attempts: (alreadyProcessed as any)?.attempts || 0 + 1
      }, { ex: this.CACHE_TTL });
    }
  }

  /**
   * Processa feed de pedido perdido
   */
  private static async processOrderFeed(feed: any, tenantId: string): Promise<void> {
    // Extrair order ID do resource
    const orderId = feed.resource.split('/').pop();

    logger.info({ orderId, feedId: feed.id }, '📦 Reprocessando pedido perdido');

    try {
      // Buscar tokens do tenant
      const tokens = await getMLTokens(tenantId);
      if (!tokens?.access_token) {
        throw new Error('No valid ML tokens found for tenant');
      }

      // Criar instância da API do ML
      const mlApi = new MercadoLivreAPI(
        { fetch } as any,
        process.env.ML_CLIENT_ID!,
        process.env.ML_CLIENT_SECRET!,
        {
          accessToken: tokens.access_token,
          userId: tokens.user_id
        }
      );

      // Buscar dados atualizados do pedido
      const orderData = await mlApi.getOrder(orderId);

      // Atualizar cache local se necessário
      const kv = getKVClient();
      await kv.set(
        `order:${orderId}`,
        {
          ...orderData,
          last_updated: new Date().toISOString(),
          source: 'missed_feed_recovery'
        },
        { ex: 3600 } // 1 hora
      );

      logger.info({
        orderId,
        status: orderData.status,
        totalAmount: orderData.total_amount
      }, '✅ Pedido recuperado e cache atualizado');

    } catch (error) {
      logger.error({ error, orderId, feedId: feed.id }, '❌ Falha ao recuperar pedido');
      throw error; // Re-throw para marcar como falha
    }
  }

  /**
   * Processa feed de produto perdido
   */
  private static async processItemFeed(feed: any, tenantId: string): Promise<void> {
    // Extrair item ID do resource
    const itemId = feed.resource.split('/').pop();

    logger.info({ itemId, feedId: feed.id }, '📦 Reprocessando produto perdido');

    try {
      // Buscar tokens do tenant
      const tokens = await getMLTokens(tenantId);
      if (!tokens?.access_token) {
        throw new Error('No valid ML tokens found for tenant');
      }

      // Criar instância da API do ML
      const mlApi = new MercadoLivreAPI(
        { fetch } as any,
        process.env.ML_CLIENT_ID!,
        process.env.ML_CLIENT_SECRET!,
        {
          accessToken: tokens.access_token,
          userId: tokens.user_id
        }
      );

      // Buscar dados atualizados do produto
      const productData = await mlApi.getProduct(itemId);

      // Atualizar cache local
      const kv = getKVClient();
      await kv.set(
        `product:${itemId}`,
        {
          ...productData,
          last_updated: new Date().toISOString(),
          source: 'missed_feed_recovery'
        },
        { ex: 21600 } // 6 horas (CACHE_TTL.PRODUCTS)
      );

      // Invalidar cache de produtos geral para forçar refresh
      await kv.del('products:all');
      await kv.del('products:active');

      logger.info({
        itemId,
        title: productData.title,
        status: productData.status,
        price: productData.price
      }, '✅ Produto recuperado e cache atualizado');

    } catch (error) {
      logger.error({ error, itemId, feedId: feed.id }, '❌ Falha ao recuperar produto');
      throw error; // Re-throw para marcar como falha
    }
  }

  /**
   * Processa feed de pergunta perdido
   */
  private static async processQuestionFeed(feed: any, tenantId: string): Promise<void> {
    // Extrair question ID do resource
    const questionId = feed.resource.split('/').pop();

    logger.info({ questionId, feedId: feed.id }, '❓ Reprocessando pergunta perdida');

    try {
      // Buscar tokens do tenant
      const tokens = await getMLTokens(tenantId);
      if (!tokens?.access_token) {
        throw new Error('No valid ML tokens found for tenant');
      }

      // Criar instância da API do ML
      const mlApi = new MercadoLivreAPI(
        { fetch } as any,
        process.env.ML_CLIENT_ID!,
        process.env.ML_CLIENT_SECRET!,
        {
          accessToken: tokens.access_token,
          userId: tokens.user_id
        }
      );

      // Buscar dados atualizados da pergunta
      const questionData = await mlApi.getQuestion(questionId);

      // Atualizar cache local
      const kv = getKVClient();
      await kv.set(
        `question:${questionId}`,
        {
          ...questionData,
          last_updated: new Date().toISOString(),
          source: 'missed_feed_recovery'
        },
        { ex: 3600 } // 1 hora (CACHE_TTL.QUESTIONS)
      );

      logger.info({
        questionId,
        itemId: questionData.item_id,
        status: questionData.status,
        text: questionData.text?.substring(0, 50) + '...'
      }, '✅ Pergunta recuperada e cache atualizado');

    } catch (error) {
      logger.error({ error, questionId, feedId: feed.id }, '❌ Falha ao recuperar pergunta');
      throw error; // Re-throw para marcar como falha
    }
  }

  /**
   * Processa feed de mensagem perdido
   */
  private static async processMessageFeed(feed: any, tenantId: string): Promise<void> {
    logger.info({ feedId: feed.id }, '💬 Reprocessando mensagem perdida');

    try {
      // Buscar tokens do tenant
      const tokens = await getMLTokens(tenantId);
      if (!tokens?.access_token) {
        throw new Error('No valid ML tokens found for tenant');
      }

      // Criar instância da API do ML
      const mlApi = new MercadoLivreAPI(
        { fetch } as any,
        process.env.ML_CLIENT_ID!,
        process.env.ML_CLIENT_SECRET!,
        {
          accessToken: tokens.access_token,
          userId: tokens.user_id
        }
      );

      // Para mensagens, precisamos buscar as mensagens recentes
      // Como não temos um ID específico no resource, buscamos mensagens recentes
      const recentMessages = await mlApi.getReceivedQuestions('UNANSWERED', 10, 0);

      // Atualizar cache com mensagens recentes
      const kv = getKVClient();
      for (const message of recentMessages.questions) {
        await kv.set(
          `message:${message.id}`,
          {
            ...message,
            last_updated: new Date().toISOString(),
            source: 'missed_feed_recovery'
          },
          { ex: 3600 } // 1 hora
        );
      }

      logger.info({
        feedId: feed.id,
        messagesRecovered: recentMessages.questions.length,
        totalAvailable: recentMessages.paging.total
      }, '✅ Mensagens recuperadas e cache atualizado');

    } catch (error) {
      logger.error({ error, feedId: feed.id }, '❌ Falha ao recuperar mensagens');
      throw error; // Re-throw para marcar como falha
    }
  }

  /**
   * Obtém estatísticas de recuperação
   */
  static async getRecoveryStats(tenantId: string): Promise<{
    lastRecovery?: RecoveryResult;
    totalProcessed: number;
    totalFailed: number;
    recentFeeds: MissedFeed[];
  }> {
    const kv = getKVClient();

    try {
      // Buscar último resultado de recuperação
      const recoveryKeys = await kv.keys(`missed_feeds_recovery:${tenantId}:*`);
      let lastRecovery: RecoveryResult | undefined;

      if (recoveryKeys.length > 0) {
        // Pegar o mais recente
        const latestKey = recoveryKeys.sort().pop()!;
        lastRecovery = await kv.get(latestKey) as RecoveryResult;
      }

      // Contar feeds processados
      const processedKeys = await kv.keys('processed_feed:*');
      let totalProcessed = 0;
      let totalFailed = 0;

      for (const key of processedKeys.slice(0, 100)) { // Limitar para performance
        const feed = await kv.get(key) as any;
        if (feed?.status === 'completed') {
          totalProcessed++;
        } else if (feed?.status === 'failed') {
          totalFailed++;
        }
      }

      return {
        lastRecovery,
        totalProcessed,
        totalFailed,
        recentFeeds: [] // TODO: implementar busca de feeds recentes
      };

    } catch (error) {
      logger.error({ error, tenantId }, 'Erro ao buscar estatísticas de recuperação');
      return {
        totalProcessed: 0,
        totalFailed: 0,
        recentFeeds: []
      };
    }
  }
}

/**
 * Busca tokens do Mercado Livre para um tenant específico
 */
async function getMLTokens(tenantId: string): Promise<{
  access_token: string;
  refresh_token?: string;
  user_id?: string;
  expires_at?: string;
} | null> {
  const kv = getKVClient();

  try {
    // Buscar dados do usuário no cache
    const userData = await kv.get(`user:${tenantId}`) as {
      token?: string;
      refresh_token?: string;
      user_id?: number;
      expires_at?: string;
    } | null;

    if (!userData) {
      logger.warn({ tenantId }, 'No user data found in cache for tenant');
      return null;
    }

    // Verificar se tem token válido
    if (!userData.token) {
      logger.warn({ tenantId }, 'No access token found for tenant');
      return null;
    }

    // Verificar se o token não expirou
    if (userData.expires_at) {
      const expiresAt = new Date(userData.expires_at);
      if (expiresAt <= new Date()) {
        logger.warn({ tenantId, expiresAt }, 'Access token expired for tenant');
        return null;
      }
    }

    return {
      access_token: userData.token,
      refresh_token: userData.refresh_token,
      user_id: userData.user_id?.toString(),
      expires_at: userData.expires_at
    };

  } catch (error) {
    logger.error({ error, tenantId }, 'Error retrieving ML tokens for tenant');
    return null;
  }
}