import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { cache } from '@/lib/cache';
import { checkRateLimit } from '@/lib/utils';
import { validateInput } from '@/lib/validation';

// Mock dependencies
vi.mock('@/lib/cache');
vi.mock('@/lib/utils');
vi.mock('@/lib/validation');

describe('/api/v1/products', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/products', () => {
    it('should return products successfully', async () => {
      const mockProducts = [
        {
          id: '1',
          site_id: 'MLB',
          title: 'Test Product',
          seller_id: 123,
          category_id: 'test-cat',
          price: 100,
          base_price: 100,
          currency_id: 'BRL',
          initial_quantity: 10,
          available_quantity: 10,
          sold_quantity: 5,
          condition: 'new' as const,
          permalink: 'https://mercado-livre.com/product/1',
          thumbnail: 'https://example.com/thumbnail.jpg',
          secure_thumbnail: 'https://example.com/thumbnail.jpg',
          pictures: [{ id: 'pic1', url: 'https://example.com/image.jpg', secure_url: 'https://example.com/image.jpg', size: '500x500', max_size: '1000x1000', quality: '90' }],
          accepts_mercadopago: true,
          non_mercado_pago_payment_methods: [],
          shipping: {
            mode: 'me2',
            methods: [],
            tags: [],
            local_pick_up: false,
            free_shipping: true,
            logistic_type: 'drop_off',
            store_pick_up: false
          },
          international_delivery_mode: 'none',
          seller_address: {
            city: { id: 'city1', name: 'Test City' },
            state: { id: 'state1', name: 'Test State' },
            country: { id: 'BR', name: 'Brasil' },
            search_location: {
              neighborhood: { id: 'nb1', name: 'Test Neighborhood' },
              city: { id: 'city1', name: 'Test City' },
              state: { id: 'state1', name: 'Test State' }
            }
          },
          location: {},
          attributes: [],
          warnings: [],
          listing_source: '',
          variations: [],
          status: 'active' as const,
          sub_status: [],
          tags: [],
          deal_ids: [],
          date_created: '2024-01-01T00:00:00.000Z',
          last_updated: '2024-01-02T00:00:00.000Z',
          automatic_relist: false,
        }
      ];

      const mockCache = vi.mocked(cache);
      const mockRateLimit = vi.mocked(checkRateLimit);
      const mockValidate = vi.mocked(validateInput);

      mockCache.getAllProducts.mockResolvedValue(mockProducts);
      mockRateLimit.mockResolvedValue({ allowed: true, remaining: 499, resetTime: Date.now() + 900000 });
      mockValidate.mockReturnValue({ success: true, data: { page: 1, limit: 50 } });

      const request = {
        url: 'http://localhost:3000/api/v1/products',
        headers: { get: () => null },
        cookies: { get: () => undefined }
      };
      const response = await GET(request as any);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data.products).toHaveLength(1);
      expect(result.data.products[0].id).toBe('1');
    });
  });
});