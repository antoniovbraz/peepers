import { Product, ProductQuery } from '../entities/Product';
import { ProductRepository } from '../repositories/ProductRepository';

export class ProductService {
  constructor(private productRepository: ProductRepository) {}

  async getProducts(query: ProductQuery = this.getDefaultQuery()) {
    try {
      // Validate query parameters
      this.validateQuery(query);

      // Get products from repository
      const result = await this.productRepository.findAll(query);

      // Apply business rules
      const processedProducts = this.applyBusinessRules(result.products);

      return {
        ...result,
        products: processedProducts
      };
    } catch (error) {
      throw new Error(`Failed to get products: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPublicProducts(query: ProductQuery = this.getDefaultQuery()) {
    try {
      // For public access, we might have different business rules
      const result = await this.productRepository.findPublic(query);

      // Apply public-specific business rules
      const processedProducts = this.applyPublicBusinessRules(result.products);

      return {
        ...result,
        products: processedProducts
      };
    } catch (error) {
      throw new Error(`Failed to get public products: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getProductById(id: string) {
    try {
      const product = await this.productRepository.findById(id);

      if (!product) {
        throw new Error('Product not found');
      }

      return this.applyBusinessRules([product])[0];
    } catch (error) {
      throw new Error(`Failed to get product: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private validateQuery(query: ProductQuery): void {
    if (query.pagination.limit > 100) {
      throw new Error('Limit cannot exceed 100');
    }

    if (query.pagination.page < 1) {
      throw new Error('Page must be greater than 0');
    }
  }

  private applyBusinessRules(products: Product[]): Product[] {
    // Products are already Product class instances with business logic
    // Apply any additional transformations here if needed
    return products;
  }

  private applyPublicBusinessRules(products: Product[]): Product[] {
    // Products are already Product class instances with business logic
    // Apply any public-specific transformations here if needed
    return products;
  }

  private getDefaultQuery(): ProductQuery {
    return {
      pagination: {
        page: 1,
        limit: 50,
        offset: 0
      },
      filters: {},
      sortBy: 'relevance',
      includeDetails: false
    };
  }
}