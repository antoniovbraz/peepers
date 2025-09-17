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
   * This method creates a read-only representation without strict validations
   */
  static fromMLResponse(mlProduct: Record<string, unknown>): Product {
    // Create instance without calling validateProduct for read-only data
    const product = Object.create(Product.prototype);
    
    // Set properties directly to bypass constructor validation
    product.id = mlProduct.id as string;
    product.title = mlProduct.title as string; // Keep original title from ML
    product.price = mlProduct.price as number;
    product.currency_id = mlProduct.currency_id as string;
    product.available_quantity = mlProduct.available_quantity as number;
    product.sold_quantity = mlProduct.sold_quantity as number;
    product.condition = mlProduct.condition as 'new' | 'used' | 'not_specified';
    product.listing_type_id = mlProduct.listing_type_id as string;
    product.category_id = mlProduct.category_id as string;
    product.domain_id = mlProduct.domain_id as string;
    product.thumbnail = mlProduct.thumbnail as string;
    product.secure_thumbnail = mlProduct.secure_thumbnail as string;
    product.pictures = mlProduct.pictures as ProductPicture[] || [];
    product.attributes = mlProduct.attributes as ProductAttribute[] || [];
    product.variations = mlProduct.variations as ProductVariation[] || [];
    product.shipping = mlProduct.shipping as ProductShipping || {} as ProductShipping;
    product.seller_id = mlProduct.seller_id as number;
    product.catalog_product_id = mlProduct.catalog_product_id as string;
    product.tags = mlProduct.tags as string[] || [];
    product.warranty = mlProduct.warranty as string;
    product.catalog_listing = mlProduct.catalog_listing as boolean || false;
    product.status = mlProduct.status as 'active' | 'paused' | 'closed' | 'under_review' || 'active';
    product.date_created = mlProduct.date_created ? new Date(mlProduct.date_created as string) : new Date();
    product.last_updated = mlProduct.last_updated ? new Date(mlProduct.last_updated as string) : new Date();
    
    return product;
  }

  /**
   * Factory method to create a new Product (with validations)
   * Use this when creating products to be sent to ML API
   */
  static createNew(
    id: string,
    title: string,
    price: number,
    currency_id: string,
    available_quantity: number,
    sold_quantity: number,
    condition: 'new' | 'used' | 'not_specified',
    listing_type_id: string,
    category_id: string,
    domain_id: string,
    thumbnail: string,
    secure_thumbnail: string,
    pictures: ProductPicture[],
    attributes: ProductAttribute[],
    variations: ProductVariation[],
    shipping: ProductShipping,
    seller_id: number,
    catalog_product_id?: string,
    tags: string[] = [],
    warranty?: string,
    catalog_listing: boolean = false,
    status: 'active' | 'paused' | 'closed' | 'under_review' = 'active'
  ): Product {
    return new Product(
      id, title, price, currency_id, available_quantity, sold_quantity,
      condition, listing_type_id, category_id, domain_id, thumbnail,
      secure_thumbnail, pictures, attributes, variations, shipping,
      seller_id, catalog_product_id, tags, warranty, catalog_listing,
      status
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