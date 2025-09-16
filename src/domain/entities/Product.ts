// Domain Entities
export interface Product {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  thumbnail: string;
  availableQuantity: number;
  condition: 'new' | 'used' | 'not_specified';
  status: 'active' | 'paused' | 'closed';
  currencyId: string;
  shipping: {
    freeShipping: boolean;
  };
  sellerId: number;
  categoryId: string;
  permalink: string;
  pictures?: Array<{
    id: string;
    url: string;
    secureUrl: string;
  }>;
  attributes?: Array<{
    id: string;
    name: string;
    valueName?: string;
  }>;
  installments?: {
    quantity: number;
    amount: number;
  };
  soldQuantity: number;
  dateCreated: string;
  lastUpdated: string;
}

// Domain Value Objects
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface ProductFilters {
  categoryId?: string;
  condition?: 'new' | 'used' | 'not_specified';
  priceMin?: number;
  priceMax?: number;
  status?: 'active' | 'paused' | 'closed';
  hasFreeShipping?: boolean;
  sellerId?: number;
}

export interface ProductQuery {
  pagination: PaginationParams;
  filters: ProductFilters;
  sortBy?: 'price_asc' | 'price_desc' | 'date_desc' | 'relevance';
  includeDetails?: boolean;
}

// Domain Enums
export enum ProductStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  CLOSED = 'closed'
}

export enum ProductCondition {
  NEW = 'new',
  USED = 'used',
  NOT_SPECIFIED = 'not_specified'
}

// Domain Events
export interface ProductEvents {
  PRODUCT_CREATED: 'product_created';
  PRODUCT_UPDATED: 'product_updated';
  PRODUCT_DELETED: 'product_deleted';
  PRODUCTS_SYNCED: 'products_synced';
}</content>
<parameter name="filePath">c:\Users\anton\OneDrive\Documents\Cline\peepers\src\domain\entities\Product.ts