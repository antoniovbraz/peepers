import { Product, ProductQuestion } from '@/types/product';
import { AppError } from '../error';

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
        productIds.map(id => this.getProduct(id))
      );

      return products;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to sync products');
    }
  }
}