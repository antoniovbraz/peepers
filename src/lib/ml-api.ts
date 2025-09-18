import {
  MLUser,
  MLProduct,
  MLQuestion,
  MLOrder,
  MLCategory,
  MLTokenResponse,
  MLTokenRefreshResponse,
  MLSearchResult,
  AnswerResponse,
  Paging
} from '@/types/ml';
import { logger } from './logger';

export interface HttpClient {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

interface TokenConfig {
  accessToken?: string;
  refreshToken?: string;
  userId?: string;
}

export class MercadoLivreAPI {
  private baseUrl = 'https://api.mercadolibre.com';
  private clientId: string;
  private clientSecret: string;
  private accessToken?: string;
  private refreshToken?: string;
  private userId?: string;
  private tokenExpiry?: number;
  private httpClient: HttpClient;

  constructor(httpClient: HttpClient, clientId: string, clientSecret: string, tokens: TokenConfig = {}) {
    this.httpClient = httpClient;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;
    this.userId = tokens.userId;
  }

  // Method to set access token dynamically
  setAccessToken(accessToken: string, userId: string, refreshToken?: string): void {
    this.accessToken = accessToken;
    this.userId = userId;
    if (refreshToken) {
      this.refreshToken = refreshToken;
    }
  }

  hasAccessToken(): boolean {
    return !!this.accessToken;
  }

  // OAuth Methods
  getAuthUrl(redirectUri: string, state?: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: redirectUri,
      ...(state && { state })
    });

    return `https://auth.mercadolivre.com.br/authorization?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string, redirectUri: string, codeVerifier?: string): Promise<MLTokenResponse> {
    const params: Record<string, string> = {
      grant_type: 'authorization_code',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code,
      redirect_uri: redirectUri
    };

    // Add PKCE code_verifier if provided
    if (codeVerifier) {
      params.code_verifier = codeVerifier;
    }

    const response = await this.httpClient.fetch(`${this.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json'
      },
      body: new URLSearchParams(params)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Token exchange failed: ${error.message || error.error}`);
    }

    const tokenData = await response.json();
    this.accessToken = tokenData.access_token;
    this.refreshToken = tokenData.refresh_token;
    this.userId = tokenData.user_id.toString();
    this.tokenExpiry = Date.now() + tokenData.expires_in * 1000;

    return tokenData;
  }

  async refreshAccessToken(): Promise<MLTokenRefreshResponse> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await this.httpClient.fetch(`${this.baseUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: this.refreshToken
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Token refresh failed: ${error.message || error.error}`);
      }

      const tokenData = await response.json();
      
      // Atualizar instância local
      this.accessToken = tokenData.access_token;
      this.refreshToken = tokenData.refresh_token;
      this.tokenExpiry = Date.now() + tokenData.expires_in * 1000;

      // CRÍTICO: Atualizar cache automaticamente com tokens renovados
      if (this.userId) {
        try {
          const { cache } = await import('@/lib/cache');
          const { CACHE_KEYS } = await import('@/config/routes');
          
          await cache.setUser(this.userId, {
            token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_at: new Date(this.tokenExpiry).toISOString(),
            user_id: parseInt(this.userId, 10), // Converter para number
            scope: tokenData.scope || 'read write',
            token_type: tokenData.token_type || 'Bearer'
          });
          
          console.log('✅ Cache atualizado automaticamente após refresh de token');
        } catch (cacheError) {
          console.error('⚠️ Erro ao atualizar cache após refresh:', cacheError);
          // Não falhar o refresh por causa do cache
        }
      }

      return tokenData;
    } catch (error) {
      console.error('❌ Erro no refresh de token:', error);
      
      // Fallback: limpar tokens inválidos e forçar re-autenticação
      this.accessToken = undefined;
      this.refreshToken = undefined;
      this.tokenExpiry = undefined;
      
      throw new Error(`Token refresh failed. Re-authentication required: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // API Request Helper with retry logic
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    retries = 3
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    for (let i = 0; i < retries; i++) {
      try {
        // Ensure we have a valid token
        if (this.accessToken && this.isTokenExpired()) {
          await this.refreshAccessToken();
        }

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...(options.headers as Record<string, string> | undefined)
        };

        if (this.accessToken) {
          headers['Authorization'] = `Bearer ${this.accessToken}`;
        }

        const response = await this.httpClient.fetch(url, {
          ...options,
          headers
        });

        if (response.status === 401 && i < retries - 1) {
          // Token might be expired, try to refresh
          await this.refreshAccessToken();
          continue;
        }

        // SEGURANÇA CRÍTICA: Tratamento específico para Rate Limiting (HTTP 429)
        if (response.status === 429) {
          // Extrair tempo de retry do header Retry-After (se disponível)
          const retryAfterHeader = response.headers.get('Retry-After');
          let retryAfterMs = Math.pow(2, i + 1) * 1000; // Backoff padrão: 2s, 4s, 8s, 16s
          
          if (retryAfterHeader) {
            const retryAfterSeconds = parseInt(retryAfterHeader, 10);
            if (!isNaN(retryAfterSeconds) && retryAfterSeconds > 0) {
              retryAfterMs = retryAfterSeconds * 1000;
            }
          }
          
          if (i < retries - 1) {
            console.warn(`⚠️ Rate limit hit (429) - retry ${i + 1}/${retries} after ${retryAfterMs}ms`);
            await this.sleep(retryAfterMs);
            continue;
          } else {
            // Circuit breaker: falhar definitivamente após esgotar tentativas
            console.error(`❌ Rate limit exceeded - circuit breaker activated after ${retries} attempts`);
            throw new Error(`Rate limit exceeded: Too many requests. Try again later. (HTTP 429)`);
          }
        }

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ message: `HTTP ${response.status}`, error: response.statusText }));
          
          // Specific error handling based on ML documentation
          switch (response.status) {
            case 400:
              throw new Error(`Bad Request: ${errorData.message || 'Invalid parameters'}`);
            case 401:
              if (errorData.error === 'invalid_operator_user_id') {
                throw new Error('OPERATOR_NOT_ALLOWED: Only administrator users can access this resource');
              }
              throw new Error(`Unauthorized: ${errorData.message || 'Invalid or expired token'}`);
            case 403:
              if (errorData.message?.includes('operator')) {
                throw new Error('OPERATOR_NOT_ALLOWED: Only administrator users can access this resource');
              }
              throw new Error(`Forbidden: ${errorData.message || 'Access denied'}`);
            case 404:
              throw new Error(`Not Found: ${errorData.message || 'Resource not found'}`);
            case 500:
              throw new Error(`Internal Server Error: ${errorData.message || 'ML API error'}`);
            case 502:
            case 503:
            case 504:
              throw new Error(`Service Unavailable: ${errorData.message || 'ML API temporarily unavailable'}`);
            default:
              throw new Error(`API request failed: ${errorData.message || errorData.error}`);
          }
        }

        return await response.json();
      } catch (error) {
        if (i === retries - 1) throw error;

        // Exponential backoff: 1s, 2s, 4s
        await this.sleep(Math.pow(2, i) * 1000);
      }
    }

    throw new Error('Max retries exceeded');
  }

  private isTokenExpired(): boolean {
    if (!this.tokenExpiry) return false;
    return Date.now() >= this.tokenExpiry;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // User Methods
  async getCurrentUser(): Promise<MLUser> {
    return this.makeRequest<MLUser>('/users/me');
  }

  async getUser(userId: string): Promise<MLUser> {
    return this.makeRequest<MLUser>(`/users/${userId}`);
  }

  // Product Methods
  async getUserProducts(
    userId?: string,
    status?: 'active' | 'paused' | 'closed',
    limit = 50,
    offset = 0,
    searchType?: 'scan' // Para volumes +1000 produtos
  ): Promise<{ results: string[]; paging: Paging }> {
    const targetUserId = userId || this.userId;
    if (!targetUserId) {
      throw new Error('User ID is required');
    }

    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      ...(status && { status }),
      ...(searchType && { search_type: searchType })
    });

    // OTIMIZAÇÃO: Para grandes volumes, usar search_type=scan que permite +1000 produtos
    const endpoint = `/users/${targetUserId}/items/search?${params.toString()}`;
    
    if (searchType === 'scan') {
      console.log(`🔍 Using search_type=scan for large volume (${limit} products, offset: ${offset})`);
    }

    return this.makeRequest<{ results: string[]; paging: Paging }>(endpoint);
  }

  async getProduct(productId: string): Promise<MLProduct> {
    return this.makeRequest<MLProduct>(`/items/${productId}`);
  }

  async getMultipleProducts(productIds: string[]): Promise<MLProduct[]> {
    if (productIds.length === 0) return [];

    // Use multiget endpoint as recommended by ML documentation
    // Maximum 20 items per request for optimal performance
    if (productIds.length > 20) {
      console.warn(`⚠️  getMultipleProducts recebeu ${productIds.length} IDs, limitando a 20 para performance`);
      productIds = productIds.slice(0, 20);
    }

    const ids = productIds.join(',');
    const response = await this.makeRequest<MLProduct[]>(`/items?ids=${ids}&attributes=id,title,price,currency_id,available_quantity,sold_quantity,status,pictures,permalink,listing_type_id,condition`);

    // Handle both array and object responses
    return Array.isArray(response) ? response : [response];
  }

  async searchProducts(
    sellerId?: string,
    category?: string,
    query?: string,
    limit = 50,
    offset = 0
  ): Promise<MLSearchResult> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      ...(sellerId && { seller_id: sellerId }),
      ...(category && { category }),
      ...(query && { q: query })
    });

    return this.makeRequest<MLSearchResult>(`/sites/MLB/search?${params.toString()}`);
  }

  // Questions Methods
  async getProductQuestions(
    productId: string,
    status?: 'UNANSWERED' | 'ANSWERED',
    limit = 50,
    offset = 0
  ): Promise<{ questions: MLQuestion[]; total: number }> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      ...(status && { status })
    });

    return this.makeRequest<{ questions: MLQuestion[]; total: number }>(
      `/questions/search?item_id=${productId}&${params.toString()}`
    );
  }

  async getQuestion(questionId: string): Promise<MLQuestion> {
    return this.makeRequest<MLQuestion>(`/questions/${questionId}`);
  }

  async answerQuestion(questionId: string, answer: string): Promise<AnswerResponse> {
    return this.makeRequest<AnswerResponse>(`/answers`, {
      method: 'POST',
      body: JSON.stringify({
        question_id: parseInt(questionId),
        text: answer
      })
    });
  }

  async getReceivedQuestions(
    status?: 'UNANSWERED' | 'ANSWERED',
    limit = 50,
    offset = 0
  ): Promise<{ questions: MLQuestion[]; paging: Paging }> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      ...(status && { status })
    });

    return this.makeRequest<{ questions: MLQuestion[]; paging: Paging }>(
      `/my/received_questions/search?${params.toString()}`
    );
  }

  // Orders Methods
  async getUserOrders(
    userId?: string,
    status?: string,
    limit = 50,
    offset = 0
  ): Promise<{ results: MLOrder[]; paging: Paging }> {
    const targetUserId = userId || this.userId;
    if (!targetUserId) {
      throw new Error('User ID is required');
    }

    const params = new URLSearchParams({
      seller: targetUserId,
      limit: limit.toString(),
      offset: offset.toString(),
      ...(status && { 'order.status': status })
    });

    return this.makeRequest<{ results: MLOrder[]; paging: Paging }>(
      `/orders/search?${params.toString()}`
    );
  }

  async getOrder(orderId: string): Promise<MLOrder> {
    return this.makeRequest<MLOrder>(`/orders/${orderId}`);
  }

  // Categories Methods
  async getCategories(siteId = 'MLB'): Promise<MLCategory[]> {
    return this.makeRequest<MLCategory[]>(`/sites/${siteId}/categories`);
  }

  async getCategory(categoryId: string): Promise<MLCategory> {
    return this.makeRequest<MLCategory>(`/categories/${categoryId}`);
  }

  // Utility Methods
  async validateWebhook(payload: unknown, signature?: string): Promise<boolean> {
    // In production, implement proper webhook signature validation
    return true;
  }

  // Batch operations for better performance
  async syncAllProducts(): Promise<MLProduct[]> {
    try {
      logger.info('Starting optimized product sync...');

      // OTIMIZAÇÃO: Buscar TODOS os produtos (ativos + pausados) em paralelo
      const productIdsActive: string[] = [];
      const productIdsPaused: string[] = [];
      
      // Função para buscar todos os produtos de um status específico
      const getAllProductsByStatus = async (status: 'active' | 'paused'): Promise<string[]> => {
        const allIds: string[] = [];
        let offset = 0;
        const limit = 50;
        let hasMore = true;
        let useSearchTypeScan = false;

        while (hasMore) {
          // Para volumes > 1000, usar search_type=scan
          const searchType = useSearchTypeScan ? 'scan' : undefined;
          
          const response = await this.getUserProducts(
            this.userId, 
            status, 
            limit, 
            offset, 
            searchType
          );
          
          allIds.push(...response.results);
          
          // Se obtivemos menos resultados que o limite, terminamos
          if (response.results.length < limit) {
            hasMore = false;
          } else {
            offset += limit;
            
            // OTIMIZAÇÃO: Se temos >1000 produtos, ativar scan mode
            if (offset >= 1000 && !useSearchTypeScan) {
              console.log('🚀 Ativando search_type=scan para grandes volumes');
              useSearchTypeScan = true;
            }
          }
        }
        
        return allIds;
      };

      // Buscar produtos ativos e pausados em paralelo
      console.log('🔄 Buscando produtos ativos e pausados em paralelo...');
      const [activeIds, pausedIds] = await Promise.all([
        getAllProductsByStatus('active'),
        getAllProductsByStatus('paused')
      ]);

      productIdsActive.push(...activeIds);
      productIdsPaused.push(...pausedIds);
      
      const allProductIds = [...productIdsActive, ...productIdsPaused];
      
      logger.info({ 
        active: productIdsActive.length, 
        paused: productIdsPaused.length,
        total: allProductIds.length 
      }, 'Found products by status');

      // Get product details in batches
      const products: MLProduct[] = [];
      const batchSize = 20; // ML API limit for multiget

      for (let i = 0; i < allProductIds.length; i += batchSize) {
        const batch = allProductIds.slice(i, i + batchSize);
        const batchProducts = await this.getMultipleProducts(batch);
        products.push(...batchProducts);

        // Rate limiting - wait between batches
        if (i + batchSize < allProductIds.length) {
          await this.sleep(100);
        }
      }

      logger.info({ 
        count: products.length,
        active: products.filter(p => p.status === 'active').length,
        paused: products.filter(p => p.status === 'paused').length 
      }, 'Synced products with status breakdown');
      
      return products;
    } catch (error) {
      logger.error({ err: error }, 'Product sync failed');
      throw error;
    }
  }
}

export function createMercadoLivreAPI(httpClient: HttpClient, config: {
  clientId: string;
  clientSecret: string;
  accessToken?: string;
  refreshToken?: string;
  userId?: string;
}): MercadoLivreAPI {
  return new MercadoLivreAPI(httpClient, config.clientId, config.clientSecret, {
    accessToken: config.accessToken,
    refreshToken: config.refreshToken,
    userId: config.userId
  });
}

export default MercadoLivreAPI;
