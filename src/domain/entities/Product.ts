/**
 * Product Entity - Core business entity for Mercado Livre products
 * 
 * This entity encapsulates all business logic related to products,
 * following Clean Architecture principles in the domain layer.
 */

export interface ProductVariation {
  id: string;
  price: number;
  available_quantity: number;
  sold_quantity: number;
  attributes: ProductAttribute[];
}

export interface ProductAttribute {
  id: string;
  name: string;
  value_id?: string;
  value_name?: string;
  value_struct?: {
    number: number;
    unit: string;
  };
}

export interface ProductPicture {
  id: string;
  url: string;
  secure_url: string;
  size: string;
  max_size: string;
  quality: string;
}

export interface ProductShipping {
  mode: string;
  methods: Array<{
    id: number;
    name: string;
  }>;
  tags: string[];
  dimensions?: {
    width: string;
    height: string;
    length: string;
    weight: string;
  };
  local_pick_up: boolean;
  free_shipping: boolean;
  logistic_type: string;
  store_pick_up: boolean;
}

export class Product {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly price: number,
    public readonly currency_id: string,
    public readonly available_quantity: number,
    public readonly sold_quantity: number,
    public readonly condition: 'new' | 'used' | 'not_specified',
    public readonly listing_type_id: string,
    public readonly category_id: string,
    public readonly domain_id: string,
    public readonly thumbnail: string,
    public readonly secure_thumbnail: string,
    public readonly pictures: ProductPicture[],
    public readonly attributes: ProductAttribute[],
    public readonly variations: ProductVariation[],
    public readonly shipping: ProductShipping,
    public readonly seller_id: number,
    public readonly catalog_product_id?: string,
    public readonly tags: string[] = [],
    public readonly warranty?: string,
    public readonly catalog_listing: boolean = false,
    public readonly status: 'active' | 'paused' | 'closed' | 'under_review' = 'active',
    public readonly date_created: Date = new Date(),
    public readonly last_updated: Date = new Date()
  ) {
    this.validateProduct();
  }

  /**
   * Business Logic: Validates product data according to Mercado Livre rules
   */
  private validateProduct(): void {
    if (!this.id || this.id.trim() === '') {
      throw new Error('Product ID is required');
    }

    if (!this.title || this.title.trim() === '') {
      throw new Error('Product title is required');
    }

    if (this.title.length > 60) {
      throw new Error('Product title cannot exceed 60 characters');
    }

    if (this.price <= 0) {
      throw new Error('Product price must be greater than 0');
    }

    if (this.available_quantity < 0) {
      throw new Error('Available quantity cannot be negative');
    }

    if (this.sold_quantity < 0) {
      throw new Error('Sold quantity cannot be negative');
    }

    if (!['new', 'used', 'not_specified'].includes(this.condition)) {
      throw new Error('Invalid product condition');
    }

    if (!this.currency_id || !['BRL', 'USD', 'ARS'].includes(this.currency_id)) {
      throw new Error('Invalid currency ID');
    }
  }

  /**
   * Business Logic: Check if product has stock available
   */
  public hasStock(): boolean {
    return this.available_quantity > 0;
  }

  /**
   * Business Logic: Check if product is new condition
   */
  public isNew(): boolean {
    return this.condition === 'new';
  }

  /**
   * Business Logic: Check if product has free shipping
   */
  public hasFreeShipping(): boolean {
    return this.shipping.free_shipping;
  }

  /**
   * Business Logic: Check if product is a catalog listing
   */
  public isCatalogListing(): boolean {
    return this.catalog_listing;
  }

  /**
   * Business Logic: Get main category from attributes
   */
  public getMainCategory(): string | null {
    const categoryAttr = this.attributes.find(attr => 
      attr.id === 'CATEGORY' || attr.name.toLowerCase().includes('categoria')
    );
    return categoryAttr?.value_name || null;
  }

  /**
   * Business Logic: Get brand from attributes
   */
  public getBrand(): string | null {
    const brandAttr = this.attributes.find(attr => 
      attr.id === 'BRAND' || attr.name.toLowerCase().includes('marca')
    );
    return brandAttr?.value_name || null;
  }

  /**
   * Business Logic: Calculate conversion rate
   */
  public getConversionRate(): number {
    const totalViews = this.sold_quantity + this.available_quantity;
    if (totalViews === 0) return 0;
    return (this.sold_quantity / totalViews) * 100;
  }

  /**
   * Business Logic: Check if product needs attention (low stock)
   */
  public needsAttention(): boolean {
    return this.available_quantity <= 5 && this.available_quantity > 0;
  }

  /**
   * Business Logic: Check if product is out of stock
   */
  public isOutOfStock(): boolean {
    return this.available_quantity === 0;
  }

  /**
   * Business Logic: Get price formatted for display
   */
  public getFormattedPrice(): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: this.currency_id === 'BRL' ? 'BRL' : 'USD',
    }).format(this.price);
  }

  /**
   * Business Logic: Get primary picture URL
   */
  public getPrimaryPictureUrl(secure: boolean = true): string {
    if (this.pictures.length === 0) {
      return secure ? this.secure_thumbnail : this.thumbnail;
    }
    
    const primaryPicture = this.pictures[0];
    return secure ? primaryPicture.secure_url : primaryPicture.url;
  }

  /**
   * Business Logic: Check if product has variations
   */
  public hasVariations(): boolean {
    return this.variations.length > 0;
  }

  /**
   * Business Logic: Get total stock (including variations)
   */
  public getTotalStock(): number {
    if (!this.hasVariations()) {
      return this.available_quantity;
    }

    return this.variations.reduce((total, variation) => {
      return total + variation.available_quantity;
    }, 0);
  }

  /**
   * Factory method to create Product from Mercado Livre API response
   */
  static fromMLResponse(mlProduct: Record<string, unknown>): Product {
    return new Product(
      mlProduct.id as string,
      mlProduct.title as string,
      mlProduct.price as number,
      mlProduct.currency_id as string,
      mlProduct.available_quantity as number,
      mlProduct.sold_quantity as number,
      mlProduct.condition as 'new' | 'used' | 'not_specified',
      mlProduct.listing_type_id as string,
      mlProduct.category_id as string,
      mlProduct.domain_id as string,
      mlProduct.thumbnail as string,
      mlProduct.secure_thumbnail as string,
      mlProduct.pictures as ProductPicture[] || [],
      mlProduct.attributes as ProductAttribute[] || [],
      mlProduct.variations as ProductVariation[] || [],
      mlProduct.shipping as ProductShipping || {} as ProductShipping,
      mlProduct.seller_id as number,
      mlProduct.catalog_product_id as string,
      mlProduct.tags as string[] || [],
      mlProduct.warranty as string,
      mlProduct.catalog_listing as boolean || false,
      mlProduct.status as 'active' | 'paused' | 'closed' | 'under_review' || 'active',
      mlProduct.date_created ? new Date(mlProduct.date_created as string) : new Date(),
      mlProduct.last_updated ? new Date(mlProduct.last_updated as string) : new Date()
    );
  }

  /**
   * Convert to ML API format for updates
   */
  public toMLFormat(): Record<string, unknown> {
    return {
      id: this.id,
      title: this.title,
      price: this.price,
      currency_id: this.currency_id,
      available_quantity: this.available_quantity,
      condition: this.condition,
      listing_type_id: this.listing_type_id,
      category_id: this.category_id,
      pictures: this.pictures,
      attributes: this.attributes,
      shipping: this.shipping,
      warranty: this.warranty,
      status: this.status
    };
  }
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
}