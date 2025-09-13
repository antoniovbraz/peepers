import assert from 'node:assert/strict';
import { MercadoLivreAPI, HttpClient } from './ml-api';

class MockResponse {
  constructor(private data: unknown, public ok = true, public status = 200, public statusText = 'OK') {}
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

(async () => {
  const mockData = { id: '123', title: 'Test Product' };
  const client = new MockClient(new MockResponse(mockData));
  const api = new MercadoLivreAPI(client, 'id', 'secret', { accessToken: 'token' });

  const product = await api.getProduct('123');

  assert.deepEqual(product, mockData);
  assert.equal(client.lastUrl, 'https://api.mercadolibre.com/items/123');
  const headers = client.lastInit?.headers as Record<string, string>;
  assert.equal(headers['Authorization'], 'Bearer token');

  console.log('MercadoLivreAPI HTTP client tests passed');
})();
