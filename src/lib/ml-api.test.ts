import { describe, it, expect } from 'vitest';
import { MercadoLivreAPI, HttpClient } from './ml-api';

class MockResponse {
  constructor(private data: unknown, public ok = true) {}
  async json() {
    return this.data;
  }
}

class MockClient implements HttpClient {
  lastUrl?: string;
  lastInit?: RequestInit;
  constructor(private response: MockResponse) {}
  async fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    this.lastUrl = String(input);
    this.lastInit = init;
    return this.response as unknown as Response;
  }
}

describe('MercadoLivreAPI', () => {
  it('fetches product with auth header', async () => {
    const mockData = { id: '123', title: 'Test Product' };
    const client = new MockClient(new MockResponse(mockData));
    const api = new MercadoLivreAPI(client, 'id', 'secret', { accessToken: 'token' });

    const product = await api.getProduct('123');

    expect(product).toEqual(mockData);
    expect(client.lastUrl).toBe('https://api.mercadolibre.com/items/123');
    const headers = client.lastInit?.headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer token');
  });
});
