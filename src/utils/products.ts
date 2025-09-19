import type { MLProduct } from '@/types/ml';
import { getApplicationService } from '@/infrastructure/container';
import type { ProductResponseDTO } from '@/application/core';

/**
 * Converts ProductResponseDTO back to MLProduct format
 * Necessary for backward compatibility with existing code
 */
function transformDTOToMLProduct(dto: ProductResponseDTO): MLProduct {
  return {
    id: dto.id,
    title: dto.title,
    price: dto.price,
    currency_id: dto.currency,
    available_quantity: dto.availableQuantity,
    condition: (dto.condition as 'new' | 'used' | 'not_specified') || 'not_specified',
    status: (dto.status as 'active' | 'paused' | 'closed' | 'under_review' | 'inactive') || 'active',
    category_id: dto.categoryId,
    seller_id: dto.sellerId,
    thumbnail: dto.thumbnail || '',
    pictures: dto.pictures?.map(url => ({ 
      id: '', 
      url, 
      secure_url: url, 
      size: '0x0', 
      max_size: '0x0',
      quality: '' 
    })) || [],
    shipping: {
      free_shipping: dto.freeShipping || false,
      mode: 'not_specified',
      methods: [],
      tags: [],
      dimensions: undefined,
      local_pick_up: false,
      logistic_type: 'not_specified',
      store_pick_up: false
    },
    date_created: dto.dateCreated,
    last_updated: dto.lastUpdated,
    // Required fields with defaults for backward compatibility
    site_id: 'MLB',
    permalink: '',
    secure_thumbnail: dto.thumbnail || '',
    initial_quantity: dto.availableQuantity,
    sold_quantity: 0,
    tags: [],
    warranty: '',
    catalog_product_id: undefined,
    domain_id: '',
    parent_item_id: undefined,
    accepts_mercadopago: true,
    non_mercado_pago_payment_methods: [],
    seller_address: {
      city: { id: '', name: '' },
      state: { id: '', name: '' },
      country: { id: 'BR', name: 'Brasil' },
      search_location: {
        neighborhood: { id: '', name: '' },
        city: { id: '', name: '' },
        state: { id: '', name: '' }
      }
    },
    seller_contact: null,
    location: {},
    attributes: [],
    warnings: [],
    listing_source: 'manual',
    variations: [],
    sub_status: [],
    deal_ids: [],
    automatic_relist: false,
    international_delivery_mode: 'none',
    catalog_listing: false
  };
}

/**
 * Enterprise Products API - Clean Architecture
 * Real ML API integration with zero mock fallbacks
 */
export async function fetchProducts(limit?: number): Promise<MLProduct[]> {
  try {
    const applicationService = getApplicationService();
    
    const result = await applicationService.getProducts({ limit });
    
    if (!result.success) {
      throw new Error(`Failed to fetch products: ${result.error.message}`);
    }
    
    return result.data.data.map(transformDTOToMLProduct);
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}

export async function fetchProductById(productId: string): Promise<MLProduct | null> {
  try {
    const applicationService = getApplicationService();
    
    const result = await applicationService.getProductById(productId);
    
    if (!result.success) {
      if (result.error.code === 'NOT_FOUND') {
        return null;
      }
      throw new Error(`Failed to fetch product: ${result.error.message}`);
    }
    
    return transformDTOToMLProduct(result.data);
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    throw error;
  }
}
