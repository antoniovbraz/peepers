import { Product, ProductQuestion } from '@/types/product';
import { AppError } from '@/core/error';

export class MLApiService {
  private accessToken: string | null = null;
  private userId: string | null = null;
  private readonly baseUrl = 'https://api.mercadolibre.com';

  constructor() {
    this.accessToken = process.env.ML_ACCESS_TOKEN || null;
    this.userId = process.env.ML_USER_ID || null;
  }

  setAccessToken(token: string, userId: string) {
    this.accessToken = token;
    this.userId = userId;
  }

  async exchangeCode(code: string) {
    const clientId = process.env.ML_CLIENT_ID;
    const clientSecret = process.env.ML_CLIENT_SECRET;
    const redirectUri = process.env.NEXTAUTH_URL + '/api/ml/auth/callback';

    if (!clientId || !clientSecret) {
      throw AppError.internal('ML_CLIENT_ID or ML_CLIENT_SECRET not configured');
    }

    const response = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      throw AppError.unauthorized('Failed to exchange code for token');
    }

    const data = await response.json();

    return {
      token: data.access_token,
      user_id: data.user_id,
      expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
    };
  }

  private async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    if (!this.accessToken) {
      throw AppError.unauthorized('No access token available');
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${this.accessToken}`,
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw AppError.unauthorized('Invalid or expired access token');
      }
      throw AppError.internal(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getProduct(id: string): Promise<Product> {
    try {
      const data = await this.fetchWithAuth(`/items/${id}`);
      return data;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal(`Failed to fetch product ${id}`);
    }
  }

  async getProductQuestions(id: string): Promise<{ questions: ProductQuestion[] }> {
    try {
      const data = await this.fetchWithAuth(`/questions/search?item_id=${id}`);
      return data;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal(`Failed to fetch questions for product ${id}`);
    }
  }

  async syncAllProducts(): Promise<Product[]> {
    if (!this.userId) {
      throw AppError.unauthorized('User ID not available');
    }

    try {
      const data = await this.fetchWithAuth(`/users/${this.userId}/items/search`);
      const productIds = data.results;
      
      const products = await Promise.all(
        productIds.map((id: string) => this.getProduct(id))
      );

      return products;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to sync products');
    }
  }
}