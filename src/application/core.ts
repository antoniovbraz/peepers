/**
 * 🚀 APPLICATION LAYER - Use Cases & DTOs
 * 
 * Enterprise application layer implementing Clean Architecture patterns
 * Use cases orchestrate domain logic with external dependencies
 * 
 * Reference: Official ML API compliance requirements
 */

import {
  MLProduct,
  MLOrder,
  MLUser,
  MLProductRepository,
  MLOrderRepository,
  MLUserRepository,
  ProductDomainService,
  OrderDomainService,
  UserDomainService,
  MLProductId,
  MLOrderId,
  MLUserId,
  ProductFilters,
  OrderFilters,
  ProductSearchQuery,
  OrderSearchQuery,
  ProductSearchResult,
  OrderSearchResult,
  DomainEvent,
  EventBus,
  CacheService,
  LoggingService,
  ValidationResult,
  ProductMetrics,
  OrderMetrics,
  NotFoundError,
  BusinessRuleError,
  ValidationError
} from '../domain/core.js';

// ================================
// DTOs (Data Transfer Objects)
// ================================

export interface GetProductsQuery {
  readonly userId?: number;
  readonly categoryId?: string;
  readonly search?: string;
  readonly status?: string[];
  readonly minPrice?: number;
  readonly maxPrice?: number;
  readonly freeShipping?: boolean;
  readonly condition?: string[];
  readonly hasStock?: boolean;
  readonly sort?: string;
  readonly limit?: number;
  readonly offset?: number;
}

export interface GetOrdersQuery {
  readonly userId?: number;
  readonly status?: string[];
  readonly dateFrom?: string;
  readonly dateTo?: string;
  readonly minAmount?: number;
  readonly maxAmount?: number;
  readonly paymentMethod?: string[];
  readonly sort?: string;
  readonly limit?: number;
  readonly offset?: number;
}

export interface ProductResponseDTO {
  readonly id: string;
  readonly title: string;
  readonly price: number;
  readonly currency: string;
  readonly availableQuantity: number;
  readonly condition: string;
  readonly status: string;
  readonly categoryId: string;
  readonly sellerId: number;
  readonly thumbnail?: string;
  readonly pictures?: string[];
  readonly freeShipping?: boolean;
  readonly listingType: string;
  readonly dateCreated: string;
  readonly lastUpdated: string;
}

export interface OrderResponseDTO {
  readonly id: number;
  readonly status: string;
  readonly statusDetail?: string;
  readonly dateCreated: string;
  readonly dateClosed?: string;
  readonly totalAmount: number;
  readonly currencyId: string;
  readonly buyer: UserSummaryDTO;
  readonly items: OrderItemDTO[];
  readonly shipping?: ShippingSummaryDTO;
  readonly payments?: PaymentSummaryDTO[];
}

export interface UserResponseDTO {
  readonly id: number;
  readonly nickname: string;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly email?: string;
  readonly countryId: string;
  readonly userType: string;
  readonly points: number;
  readonly reputation?: ReputationDTO;
  readonly status: string;
  readonly registrationDate: string;
}

export interface UserSummaryDTO {
  readonly id: number;
  readonly nickname: string;
  readonly firstName?: string;
  readonly lastName?: string;
}

export interface OrderItemDTO {
  readonly itemId: string;
  readonly title: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly totalPrice: number;
  readonly currencyId: string;
}

export interface ShippingSummaryDTO {
  readonly id: number;
  readonly status?: string;
  readonly mode?: string;
}

export interface PaymentSummaryDTO {
  readonly id: number;
  readonly status: string;
  readonly method: string;
  readonly amount: number;
  readonly installments: number;
  readonly dateCreated: string;
  readonly dateApproved?: string;
}

export interface ReputationDTO {
  readonly level?: string;
  readonly powerSellerStatus?: string;
  readonly transactions: {
    readonly total: number;
    readonly completed: number;
    readonly canceled: number;
    readonly ratings: {
      readonly positive: number;
      readonly neutral: number;
      readonly negative: number;
    };
  };
}

export interface ProductMetricsDTO {
  readonly totalProducts: number;
  readonly activeProducts: number;
  readonly totalValue: number;
  readonly averagePrice: number;
  readonly categories: Array<{ name: string; count: number; percentage: number }>;
  readonly statuses: Array<{ name: string; count: number; percentage: number }>;
}

export interface OrderMetricsDTO {
  readonly totalOrders: number;
  readonly totalRevenue: number;
  readonly averageOrderValue: number;
  readonly monthlyRevenue: number;
  readonly monthlyGrowth: number;
  readonly ordersByStatus: Array<{ status: string; count: number; percentage: number }>;
  readonly topProducts: Array<{ 
    readonly productId: string; 
    readonly title: string;
    readonly quantity: number; 
    readonly revenue: number; 
  }>;
}

export interface PaginatedResponse<T> {
  readonly data: T[];
  readonly pagination: {
    readonly total: number;
    readonly limit: number;
    readonly offset: number;
    readonly hasNext: boolean;
    readonly hasPrevious: boolean;
  };
}

export interface ErrorResponseDTO {
  readonly success: false;
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly details?: Record<string, any>;
  };
}

export interface SuccessResponseDTO<T = any> {
  readonly success: true;
  readonly data: T;
  readonly metadata?: Record<string, any>;
}

export type ApiResponseDTO<T = any> = SuccessResponseDTO<T> | ErrorResponseDTO;

// ================================
// USE CASES
// ================================

export class GetProductsUseCase {
  constructor(
    private readonly productRepository: MLProductRepository,
    private readonly productService: ProductDomainService,
    private readonly cacheService: CacheService,
    private readonly logger: LoggingService
  ) {}

  async execute(query: GetProductsQuery): Promise<PaginatedResponse<ProductResponseDTO>> {
    try {
      this.logger.info('GetProductsUseCase: Starting execution', { query });

      // Build search query
      const searchQuery: ProductSearchQuery = {
        query: query.search,
        categoryId: query.categoryId,
        sellerId: query.userId,
        filters: {
          status: query.status,
          minPrice: query.minPrice,
          maxPrice: query.maxPrice,
          freeShipping: query.freeShipping,
          condition: query.condition,
          hasStock: query.hasStock
        },
        sort: this.mapSortOption(query.sort),
        limit: query.limit || 50,
        offset: query.offset || 0
      };

      // Check cache first
      const cacheKey = `products:${JSON.stringify(searchQuery)}`;
      const cached = await this.cacheService.get<PaginatedResponse<ProductResponseDTO>>(cacheKey);
      
      if (cached) {
        this.logger.info('GetProductsUseCase: Cache hit', { cacheKey });
        return cached;
      }

      // Execute search
      const searchResult = await this.productRepository.search(searchQuery);

      // Transform to DTOs
      const productDTOs = searchResult.results.map(product => this.transformToProductDTO(product));

      const response: PaginatedResponse<ProductResponseDTO> = {
        data: productDTOs,
        pagination: {
          total: searchResult.total,
          limit: searchResult.limit,
          offset: searchResult.offset,
          hasNext: searchResult.hasNext,
          hasPrevious: searchResult.offset > 0
        }
      };

      // Cache the result
      await this.cacheService.set(cacheKey, response, 300); // 5 minutes

      this.logger.info('GetProductsUseCase: Successfully completed', { 
        resultCount: productDTOs.length,
        total: searchResult.total
      });

      return response;

    } catch (error) {
      this.logger.error('GetProductsUseCase: Execution failed', error as Error, { query });
      throw error;
    }
  }

  private mapSortOption(sort?: string): any {
    const sortMap: Record<string, string> = {
      'price_asc': 'price_asc',
      'price_desc': 'price_desc',
      'date_desc': 'date_desc',
      'date_asc': 'date_asc',
      'relevance': 'relevance'
    };
    return sortMap[sort || 'relevance'] || 'relevance';
  }

  private transformToProductDTO(product: MLProduct): ProductResponseDTO {
    return {
      id: product.id,
      title: product.title,
      price: product.price,
      currency: product.currency_id,
      availableQuantity: product.available_quantity,
      condition: product.condition,
      status: product.status,
      categoryId: product.category_id,
      sellerId: product.seller_id,
      thumbnail: product.thumbnail,
      pictures: product.pictures?.map(p => p.secure_url),
      freeShipping: product.shipping?.free_shipping,
      listingType: product.listing_type_id,
      dateCreated: product.date_created,
      lastUpdated: product.last_updated
    };
  }
}

export class GetProductByIdUseCase {
  constructor(
    private readonly productRepository: MLProductRepository,
    private readonly cacheService: CacheService,
    private readonly logger: LoggingService
  ) {}

  async execute(productId: string): Promise<ProductResponseDTO> {
    try {
      this.logger.info('GetProductByIdUseCase: Starting execution', { productId });

      const id = new MLProductId(productId);
      
      // Check cache first
      const cacheKey = `product:${productId}`;
      const cached = await this.cacheService.get<ProductResponseDTO>(cacheKey);
      
      if (cached) {
        this.logger.info('GetProductByIdUseCase: Cache hit', { productId });
        return cached;
      }

      // Get from repository
      const product = await this.productRepository.findById(id);
      
      if (!product) {
        throw new NotFoundError('Product', productId);
      }

      // Transform to DTO
      const productDTO = this.transformToProductDTO(product);

      // Cache the result
      await this.cacheService.set(cacheKey, productDTO, 600); // 10 minutes

      this.logger.info('GetProductByIdUseCase: Successfully completed', { productId });

      return productDTO;

    } catch (error) {
      this.logger.error('GetProductByIdUseCase: Execution failed', error as Error, { productId });
      throw error;
    }
  }

  private transformToProductDTO(product: MLProduct): ProductResponseDTO {
    return {
      id: product.id,
      title: product.title,
      price: product.price,
      currency: product.currency_id,
      availableQuantity: product.available_quantity,
      condition: product.condition,
      status: product.status,
      categoryId: product.category_id,
      sellerId: product.seller_id,
      thumbnail: product.thumbnail,
      pictures: product.pictures?.map(p => p.secure_url),
      freeShipping: product.shipping?.free_shipping,
      listingType: product.listing_type_id,
      dateCreated: product.date_created,
      lastUpdated: product.last_updated
    };
  }
}

export class GetOrdersUseCase {
  constructor(
    private readonly orderRepository: MLOrderRepository,
    private readonly orderService: OrderDomainService,
    private readonly cacheService: CacheService,
    private readonly logger: LoggingService
  ) {}

  async execute(query: GetOrdersQuery): Promise<PaginatedResponse<OrderResponseDTO>> {
    try {
      this.logger.info('GetOrdersUseCase: Starting execution', { query });

      // Build search query
      const searchQuery: OrderSearchQuery = {
        sellerId: query.userId,
        filters: {
          status: query.status as any[],
          dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
          dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
          minAmount: query.minAmount,
          maxAmount: query.maxAmount,
          paymentMethod: query.paymentMethod
        },
        sort: this.mapSortOption(query.sort),
        limit: query.limit || 50,
        offset: query.offset || 0
      };

      // Check cache first
      const cacheKey = `orders:${JSON.stringify(searchQuery)}`;
      const cached = await this.cacheService.get<PaginatedResponse<OrderResponseDTO>>(cacheKey);
      
      if (cached) {
        this.logger.info('GetOrdersUseCase: Cache hit', { cacheKey });
        return cached;
      }

      // Execute search
      const searchResult = await this.orderRepository.search(searchQuery);

      // Transform to DTOs
      const orderDTOs = searchResult.results.map(order => this.transformToOrderDTO(order));

      const response: PaginatedResponse<OrderResponseDTO> = {
        data: orderDTOs,
        pagination: {
          total: searchResult.total,
          limit: searchResult.limit,
          offset: searchResult.offset,
          hasNext: searchResult.hasNext,
          hasPrevious: searchResult.offset > 0
        }
      };

      // Cache the result
      await this.cacheService.set(cacheKey, response, 180); // 3 minutes

      this.logger.info('GetOrdersUseCase: Successfully completed', { 
        resultCount: orderDTOs.length,
        total: searchResult.total
      });

      return response;

    } catch (error) {
      this.logger.error('GetOrdersUseCase: Execution failed', error as Error, { query });
      throw error;
    }
  }

  private mapSortOption(sort?: string): any {
    const sortMap: Record<string, string> = {
      'date_desc': 'date_desc',
      'date_asc': 'date_asc',
      'amount_desc': 'amount_desc',
      'amount_asc': 'amount_asc',
      'status': 'status'
    };
    return sortMap[sort || 'date_desc'] || 'date_desc';
  }

  private transformToOrderDTO(order: MLOrder): OrderResponseDTO {
    return {
      id: order.id,
      status: order.status,
      statusDetail: order.status_detail,
      dateCreated: order.date_created,
      dateClosed: order.date_closed,
      totalAmount: order.total_amount,
      currencyId: order.currency_id,
      buyer: {
        id: order.buyer.id,
        nickname: order.buyer.nickname,
        firstName: order.buyer.first_name,
        lastName: order.buyer.last_name
      },
      items: order.order_items.map(item => ({
        itemId: item.item.id,
        title: item.item.title,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        totalPrice: item.unit_price * item.quantity,
        currencyId: item.currency_id
      })),
      shipping: order.shipping ? {
        id: order.shipping.id,
        status: order.shipping.status,
        mode: order.shipping.mode
      } : undefined,
      payments: order.payments?.map(payment => ({
        id: payment.id,
        status: payment.status,
        method: payment.payment_method_id,
        amount: payment.transaction_amount,
        installments: payment.installments,
        dateCreated: payment.date_created,
        dateApproved: payment.date_approved
      }))
    };
  }
}

export class GetUserUseCase {
  constructor(
    private readonly userRepository: MLUserRepository,
    private readonly userService: UserDomainService,
    private readonly cacheService: CacheService,
    private readonly logger: LoggingService
  ) {}

  async execute(userId: number): Promise<UserResponseDTO> {
    try {
      this.logger.info('GetUserUseCase: Starting execution', { userId });

      const id = new MLUserId(userId);
      
      // Check cache first
      const cacheKey = `user:${userId}`;
      const cached = await this.cacheService.get<UserResponseDTO>(cacheKey);
      
      if (cached) {
        this.logger.info('GetUserUseCase: Cache hit', { userId });
        return cached;
      }

      // Get from repository
      const user = await this.userRepository.findById(id);
      
      if (!user) {
        throw new NotFoundError('User', userId);
      }

      // Transform to DTO
      const userDTO = this.transformToUserDTO(user);

      // Cache the result
      await this.cacheService.set(cacheKey, userDTO, 1800); // 30 minutes

      this.logger.info('GetUserUseCase: Successfully completed', { userId });

      return userDTO;

    } catch (error) {
      this.logger.error('GetUserUseCase: Execution failed', error as Error, { userId });
      throw error;
    }
  }

  private transformToUserDTO(user: MLUser): UserResponseDTO {
    return {
      id: user.id,
      nickname: user.nickname,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      countryId: user.country_id,
      userType: user.user_type,
      points: user.points,
      reputation: user.seller_reputation ? {
        level: user.seller_reputation.level_id,
        powerSellerStatus: user.seller_reputation.power_seller_status,
        transactions: {
          total: user.seller_reputation.transactions.total,
          completed: user.seller_reputation.transactions.completed,
          canceled: user.seller_reputation.transactions.canceled,
          ratings: user.seller_reputation.transactions.ratings
        }
      } : undefined,
      status: user.status.site_status,
      registrationDate: user.registration_date
    };
  }
}

export class GetProductMetricsUseCase {
  constructor(
    private readonly productRepository: MLProductRepository,
    private readonly productService: ProductDomainService,
    private readonly cacheService: CacheService,
    private readonly logger: LoggingService
  ) {}

  async execute(userId: number): Promise<ProductMetricsDTO> {
    try {
      this.logger.info('GetProductMetricsUseCase: Starting execution', { userId });

      const cacheKey = `product-metrics:${userId}`;
      const cached = await this.cacheService.get<ProductMetricsDTO>(cacheKey);
      
      if (cached) {
        this.logger.info('GetProductMetricsUseCase: Cache hit', { userId });
        return cached;
      }

      const userIdVO = new MLUserId(userId);
      const products = await this.productRepository.findByUserId(userIdVO);
      
      const metrics = await this.productService.calculateProductMetrics(products);
      
      const metricsDTO = this.transformToProductMetricsDTO(metrics);

      // Cache for 1 hour
      await this.cacheService.set(cacheKey, metricsDTO, 3600);

      this.logger.info('GetProductMetricsUseCase: Successfully completed', { 
        userId, 
        totalProducts: metrics.totalProducts 
      });

      return metricsDTO;

    } catch (error) {
      this.logger.error('GetProductMetricsUseCase: Execution failed', error as Error, { userId });
      throw error;
    }
  }

  private transformToProductMetricsDTO(metrics: ProductMetrics): ProductMetricsDTO {
    const total = metrics.totalProducts;
    
    return {
      totalProducts: metrics.totalProducts,
      activeProducts: metrics.activeProducts,
      totalValue: metrics.totalValue,
      averagePrice: metrics.averagePrice,
      categories: Object.entries(metrics.categoriesDistribution).map(([name, count]) => ({
        name,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      })),
      statuses: Object.entries(metrics.statusDistribution).map(([name, count]) => ({
        name,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      }))
    };
  }
}

export class GetOrderMetricsUseCase {
  constructor(
    private readonly orderRepository: MLOrderRepository,
    private readonly orderService: OrderDomainService,
    private readonly cacheService: CacheService,
    private readonly logger: LoggingService
  ) {}

  async execute(userId: number): Promise<OrderMetricsDTO> {
    try {
      this.logger.info('GetOrderMetricsUseCase: Starting execution', { userId });

      const cacheKey = `order-metrics:${userId}`;
      const cached = await this.cacheService.get<OrderMetricsDTO>(cacheKey);
      
      if (cached) {
        this.logger.info('GetOrderMetricsUseCase: Cache hit', { userId });
        return cached;
      }

      const userIdVO = new MLUserId(userId);
      const orders = await this.orderRepository.findByUserId(userIdVO);
      
      const metrics = await this.orderService.calculateOrderMetrics(orders);
      
      const metricsDTO = this.transformToOrderMetricsDTO(metrics);

      // Cache for 30 minutes
      await this.cacheService.set(cacheKey, metricsDTO, 1800);

      this.logger.info('GetOrderMetricsUseCase: Successfully completed', { 
        userId, 
        totalOrders: metrics.totalOrders 
      });

      return metricsDTO;

    } catch (error) {
      this.logger.error('GetOrderMetricsUseCase: Execution failed', error as Error, { userId });
      throw error;
    }
  }

  private transformToOrderMetricsDTO(metrics: OrderMetrics): OrderMetricsDTO {
    const total = metrics.totalOrders;
    
    return {
      totalOrders: metrics.totalOrders,
      totalRevenue: metrics.totalRevenue,
      averageOrderValue: metrics.averageOrderValue,
      monthlyRevenue: 0, // TODO: Calculate from date range
      monthlyGrowth: metrics.monthlyGrowth,
      ordersByStatus: Object.entries(metrics.ordersByStatus).map(([status, count]) => ({
        status,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      })),
      topProducts: metrics.topProducts.map(product => ({
        productId: product.productId,
        title: '', // TODO: Get from product repository
        quantity: product.quantity,
        revenue: product.revenue
      }))
    };
  }
}

// ================================
// COMMAND USE CASES
// ================================

export interface CreateProductCommand {
  readonly title: string;
  readonly categoryId: string;
  readonly price: number;
  readonly currencyId: string;
  readonly availableQuantity: number;
  readonly condition: 'new' | 'used' | 'not_specified';
  readonly listingTypeId: string;
  readonly description?: string;
  readonly pictures?: string[];
  readonly attributes?: any[];
  readonly variations?: any[];
  readonly shipping?: any;
}

export class CreateProductUseCase {
  constructor(
    private readonly productRepository: MLProductRepository,
    private readonly productService: ProductDomainService,
    private readonly eventBus: EventBus,
    private readonly logger: LoggingService
  ) {}

  async execute(command: CreateProductCommand, userId: number): Promise<string> {
    try {
      this.logger.info('CreateProductUseCase: Starting execution', { command, userId });

      // Validate command
      const validation = await this.validateCommand(command);
      if (!validation.isValid) {
        throw new ValidationError(
          `Product validation failed: ${validation.errors.map(e => e.message).join(', ')}`
        );
      }

      // Create product entity (would be implemented based on ML API)
      // This is a placeholder for the actual ML product creation
      const productId = `MLB${Date.now()}`;

      this.logger.info('CreateProductUseCase: Successfully completed', { 
        productId, 
        userId 
      });

      return productId;

    } catch (error) {
      this.logger.error('CreateProductUseCase: Execution failed', error as Error, { command, userId });
      throw error;
    }
  }

  private async validateCommand(command: CreateProductCommand): Promise<ValidationResult> {
    const errors: any[] = [];

    if (!command.title || command.title.length < 5) {
      errors.push({ field: 'title', code: 'MIN_LENGTH', message: 'Title must be at least 5 characters' });
    }

    if (!command.price || command.price <= 0) {
      errors.push({ field: 'price', code: 'INVALID_VALUE', message: 'Price must be greater than 0' });
    }

    if (!command.categoryId) {
      errors.push({ field: 'categoryId', code: 'REQUIRED', message: 'Category ID is required' });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  }
}

// ================================
// APPLICATION SERVICE
// ================================

export class MLApplicationService {
  constructor(
    private readonly getProductsUseCase: GetProductsUseCase,
    private readonly getProductByIdUseCase: GetProductByIdUseCase,
    private readonly getOrdersUseCase: GetOrdersUseCase,
    private readonly getUserUseCase: GetUserUseCase,
    private readonly getProductMetricsUseCase: GetProductMetricsUseCase,
    private readonly getOrderMetricsUseCase: GetOrderMetricsUseCase,
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly logger: LoggingService
  ) {}

  // Product operations
  async getProducts(query: GetProductsQuery): Promise<ApiResponseDTO<PaginatedResponse<ProductResponseDTO>>> {
    try {
      const result = await this.getProductsUseCase.execute(query);
      return { success: true, data: result };
    } catch (error) {
      this.logger.error('MLApplicationService.getProducts failed', error as Error);
      return this.handleError(error as Error);
    }
  }

  async getProductById(productId: string): Promise<ApiResponseDTO<ProductResponseDTO>> {
    try {
      const result = await this.getProductByIdUseCase.execute(productId);
      return { success: true, data: result };
    } catch (error) {
      this.logger.error('MLApplicationService.getProductById failed', error as Error);
      return this.handleError(error as Error);
    }
  }

  // Order operations
  async getOrders(query: GetOrdersQuery): Promise<ApiResponseDTO<PaginatedResponse<OrderResponseDTO>>> {
    try {
      const result = await this.getOrdersUseCase.execute(query);
      return { success: true, data: result };
    } catch (error) {
      this.logger.error('MLApplicationService.getOrders failed', error as Error);
      return this.handleError(error as Error);
    }
  }

  // User operations
  async getUser(userId: number): Promise<ApiResponseDTO<UserResponseDTO>> {
    try {
      const result = await this.getUserUseCase.execute(userId);
      return { success: true, data: result };
    } catch (error) {
      this.logger.error('MLApplicationService.getUser failed', error as Error);
      return this.handleError(error as Error);
    }
  }

  // Metrics operations
  async getProductMetrics(userId: number): Promise<ApiResponseDTO<ProductMetricsDTO>> {
    try {
      const result = await this.getProductMetricsUseCase.execute(userId);
      return { success: true, data: result };
    } catch (error) {
      this.logger.error('MLApplicationService.getProductMetrics failed', error as Error);
      return this.handleError(error as Error);
    }
  }

  async getOrderMetrics(userId: number): Promise<ApiResponseDTO<OrderMetricsDTO>> {
    try {
      const result = await this.getOrderMetricsUseCase.execute(userId);
      return { success: true, data: result };
    } catch (error) {
      this.logger.error('MLApplicationService.getOrderMetrics failed', error as Error);
      return this.handleError(error as Error);
    }
  }

  // Command operations
  async createProduct(command: CreateProductCommand, userId: number): Promise<ApiResponseDTO<{ productId: string }>> {
    try {
      const productId = await this.createProductUseCase.execute(command, userId);
      return { success: true, data: { productId } };
    } catch (error) {
      this.logger.error('MLApplicationService.createProduct failed', error as Error);
      return this.handleError(error as Error);
    }
  }

  private handleError(error: Error): ErrorResponseDTO {
    if (error instanceof NotFoundError) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: error.message,
          details: (error as any).details
        }
      };
    }

    if (error instanceof ValidationError) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
          details: (error as any).details
        }
      };
    }

    if (error instanceof BusinessRuleError) {
      return {
        success: false,
        error: {
          code: 'BUSINESS_RULE_VIOLATION',
          message: error.message,
          details: (error as any).details
        }
      };
    }

    // Generic error
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An internal error occurred',
        details: { originalMessage: error.message }
      }
    };
  }
}