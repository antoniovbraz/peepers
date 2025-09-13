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
    this.accessToken = tokenData.access_token;
    this.refreshToken = tokenData.refresh_token;
    this.tokenExpiry = Date.now() + tokenData.expires_in * 1000;

    return tokenData;
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

        if (!response.ok) {
          const error = await response
            .json()
            .catch(() => ({ message: `HTTP ${response.status}`, error: response.statusText }));
          throw new Error(`API request failed: ${error.message || error.error}`);
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
    offset = 0
  ): Promise<{ results: string[]; paging: Paging }> {
    const targetUserId = userId || this.userId;
    if (!targetUserId) {
      throw new Error('User ID is required');
    }

    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      ...(status && { status })
    });

    return this.makeRequest<{ results: string[]; paging: Paging }>(
      `/users/${targetUserId}/items/search?${params.toString()}`
    );
  }

  async getProduct(productId: string): Promise<MLProduct> {
    return this.makeRequest<MLProduct>(`/items/${productId}`);
  }

  async getMultipleProducts(productIds: string[]): Promise<MLProduct[]> {
    if (productIds.length === 0) return [];

    const ids = productIds.join(',');
    const response = await this.makeRequest<MLProduct[]>(`/items?ids=${ids}`);

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
      logger.info('Starting product sync...');

      // Get all product IDs
      const productIds: string[] = [];
      let offset = 0;
      const limit = 50;

      while (true) {
        const response = await this.getUserProducts(this.userId, 'active', limit, offset);
        productIds.push(...response.results);

        if (response.results.length < limit) break;
        offset += limit;
      }

      logger.info({ count: productIds.length }, 'Found products');

      // Get product details in batches
      const products: MLProduct[] = [];
      const batchSize = 20; // ML API limit for multiget

      for (let i = 0; i < productIds.length; i += batchSize) {
        const batch = productIds.slice(i, i + batchSize);
        const batchProducts = await this.getMultipleProducts(batch);
        products.push(...batchProducts);

        // Rate limiting - wait between batches
        if (i + batchSize < productIds.length) {
          await this.sleep(100);
        }
      }

      logger.info({ count: products.length }, 'Synced products');
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
