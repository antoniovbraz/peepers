/**
 * 🏗️ ENTERPRISE ARCHITECTURE CORE
 * 
 * Clean Architecture implementation following official ML API specifications
 * Domain-Driven Design patterns for enterprise-grade SaaS platform
 * 
 * Reference: developers.mercadolivre.com.br official documentation
 */

// ================================
// DOMAIN LAYER - Business Rules
// ================================

export interface MLProduct {
  readonly id: string;
  readonly title: string;
  readonly price: number;
  readonly currency_id: 'BRL' | 'ARS' | 'MXN' | 'COP' | 'CLP' | 'PEN' | 'UYU';
  readonly available_quantity: number;
  readonly condition: 'new' | 'used' | 'not_specified';
  readonly status: 'active' | 'paused' | 'closed' | 'under_review' | 'inactive';
  readonly category_id: string;
  readonly listing_type_id: string;
  readonly site_id: string;
  readonly seller_id: number;
  readonly thumbnail?: string;
  readonly pictures?: MLPicture[];
  readonly attributes?: MLAttribute[];
  readonly variations?: MLVariation[];
  readonly shipping?: MLShipping;
  readonly tags?: string[];
  readonly date_created: string;
  readonly last_updated: string;
}

export interface MLOrder {
  readonly id: number;
  readonly status: MLOrderStatus;
  readonly status_detail?: string;
  readonly date_created: string;
  readonly date_closed?: string;
  readonly last_updated: string;
  readonly total_amount: number;
  readonly paid_amount: number;
  readonly currency_id: string;
  readonly buyer: MLUser;
  readonly seller: MLUser;
  readonly order_items: MLOrderItem[];
  readonly payments: MLPayment[];
  readonly shipping?: MLShippingInfo;
  readonly feedback?: MLFeedback;
  readonly tags: string[];
  readonly pack_id?: number;
  readonly context: MLOrderContext;
}

export interface MLUser {
  readonly id: number;
  readonly nickname: string;
  readonly first_name?: string;
  readonly last_name?: string;
  readonly email?: string;
  readonly phone?: MLPhone;
  readonly identification?: MLIdentification;
  readonly address?: MLAddress;
  readonly country_id: string;
  readonly site_id: string;
  readonly user_type: 'normal' | 'brand' | 'classified';
  readonly tags: string[];
  readonly logo?: string;
  readonly points: number;
  readonly seller_reputation?: MLSellerReputation;
  readonly buyer_reputation?: MLBuyerReputation;
  readonly status: MLUserStatus;
  readonly registration_date: string;
}

export type MLOrderStatus = 
  | 'confirmed' 
  | 'payment_required' 
  | 'payment_in_process' 
  | 'partially_paid' 
  | 'paid' 
  | 'partially_refunded' 
  | 'pending_cancel' 
  | 'cancelled' 
  | 'invalid';

export interface MLOrderItem {
  readonly item: {
    readonly id: string;
    readonly title: string;
    readonly category_id: string;
    readonly variation_id?: number;
    readonly variation_attributes?: MLAttribute[];
    readonly condition: string;
    readonly warranty?: string;
    readonly seller_custom_field?: string;
    readonly seller_sku?: string;
  };
  readonly quantity: number;
  readonly unit_price: number;
  readonly full_unit_price: number;
  readonly currency_id: string;
  readonly sale_fee?: number;
  readonly listing_type_id?: string;
}

export interface MLPayment {
  readonly id: number;
  readonly status: 'pending' | 'approved' | 'authorized' | 'in_process' | 'in_mediation' | 'rejected' | 'cancelled' | 'refunded' | 'charged_back';
  readonly status_detail: string;
  readonly payment_method_id: string;
  readonly payment_type: string;
  readonly transaction_amount: number;
  readonly currency_id: string;
  readonly date_created: string;
  readonly date_approved?: string;
  readonly date_last_modified: string;
  readonly installments: number;
  readonly collector: { id: number };
  readonly payer_id: number;
  readonly reason: string;
}

export interface MLShippingInfo {
  readonly id: number;
  readonly status?: string;
  readonly substatus?: string;
  readonly mode?: string;
  readonly tags?: string[];
}

export interface MLFeedback {
  readonly buyer?: MLFeedbackDetail;
  readonly seller?: MLFeedbackDetail;
}

export interface MLFeedbackDetail {
  readonly rating: 'positive' | 'neutral' | 'negative';
  readonly message?: string;
  readonly date_created: string;
}

export interface MLOrderContext {
  readonly channel: 'marketplace' | 'mshops' | 'proximity' | 'mp-channel';
  readonly site: string;
  readonly flows: string[];
}

// Supporting interfaces
export interface MLPicture {
  readonly id: string;
  readonly url: string;
  readonly secure_url: string;
  readonly size: string;
  readonly max_size: string;
  readonly quality: string;
}

export interface MLAttribute {
  readonly id: string;
  readonly name: string;
  readonly value_id?: string;
  readonly value_name?: string;
  readonly value_struct?: any;
  readonly values?: MLAttributeValue[];
  readonly attribute_group_id?: string;
  readonly attribute_group_name?: string;
}

export interface MLAttributeValue {
  readonly id: string;
  readonly name: string;
  readonly struct?: any;
  readonly source?: string;
}

export interface MLVariation {
  readonly id: number;
  readonly price: number;
  readonly attribute_combinations: MLAttribute[];
  readonly available_quantity: number;
  readonly sold_quantity: number;
  readonly picture_ids?: string[];
  readonly seller_custom_field?: string;
}

export interface MLShipping {
  readonly mode: string;
  readonly methods?: MLShippingMethod[];
  readonly tags?: string[];
  readonly dimensions?: string;
  readonly local_pick_up?: boolean;
  readonly free_shipping?: boolean;
  readonly logistic_type?: string;
}

export interface MLShippingMethod {
  readonly id: number;
  readonly name: string;
  readonly type: string;
  readonly currency_id: string;
  readonly cost: number;
  readonly list_cost?: number;
  readonly free?: boolean;
  readonly tags?: string[];
}

export interface MLPhone {
  readonly area_code: string;
  readonly number: string;
  readonly extension?: string;
  readonly verified: boolean;
}

export interface MLIdentification {
  readonly type: string;
  readonly number: string;
}

export interface MLAddress {
  readonly address: string;
  readonly city: string;
  readonly state: string;
  readonly zip_code: string;
  readonly country: string;
  readonly neighborhood?: string;
  readonly street_number?: string;
  readonly comment?: string;
}

export interface MLSellerReputation {
  readonly level_id?: string;
  readonly power_seller_status?: string;
  readonly transactions: MLReputationTransactions;
  readonly metrics?: MLReputationMetrics;
}

export interface MLBuyerReputation {
  readonly tags: string[];
  readonly canceled_transactions?: number;
}

export interface MLReputationTransactions {
  readonly canceled: number;
  readonly completed: number;
  readonly period: string;
  readonly ratings: {
    readonly negative: number;
    readonly neutral: number;
    readonly positive: number;
  };
  readonly total: number;
}

export interface MLReputationMetrics {
  readonly claims?: MLReputationClaims;
  readonly delayed_handling_time?: MLReputationDelayedHandling;
  readonly sales?: MLReputationSales;
}

export interface MLReputationClaims {
  readonly period: string;
  readonly rate: number;
  readonly value: number;
}

export interface MLReputationDelayedHandling {
  readonly period: string;
  readonly rate: number;
  readonly value: number;
}

export interface MLReputationSales {
  readonly period: string;
  readonly completed: number;
}

export interface MLUserStatus {
  readonly site_status: 'active' | 'inactive' | 'guest' | 'under_review';
  readonly list?: {
    readonly allow: boolean;
    readonly codes: string[];
    readonly immediate_payment?: {
      readonly reasons: string[];
      readonly required: boolean;
    };
  };
  readonly buy?: {
    readonly allow: boolean;
    readonly codes: string[];
    readonly immediate_payment?: {
      readonly reasons: string[];
      readonly required: boolean;
    };
  };
  readonly sell?: {
    readonly allow: boolean;
    readonly codes: string[];
    readonly immediate_payment?: {
      readonly reasons: string[];
      readonly required: boolean;
    };
  };
  readonly billing?: {
    readonly allow: boolean;
    readonly codes: string[];
  };
  readonly mercadopago_tc_accepted?: boolean;
  readonly mercadopago_account_type?: string;
  readonly mercadoenvios?: string;
  readonly immediate_payment?: boolean;
  readonly confirmed_email?: boolean;
  readonly user_type?: string;
  readonly required_action?: string;
}

// ================================
// VALUE OBJECTS
// ================================

export class MLProductId {
  constructor(private readonly value: string) {
    if (!value || !value.match(/^ML[A-Z]\d+$/)) {
      throw new Error('Invalid ML Product ID format');
    }
  }

  toString(): string {
    return this.value;
  }

  equals(other: MLProductId): boolean {
    return this.value === other.value;
  }
}

export class MLOrderId {
  constructor(private readonly value: number) {
    if (!value || value <= 0) {
      throw new Error('Invalid ML Order ID');
    }
  }

  toNumber(): number {
    return this.value;
  }

  equals(other: MLOrderId): boolean {
    return this.value === other.value;
  }
}

export class MLUserId {
  constructor(private readonly value: number) {
    if (!value || value <= 0) {
      throw new Error('Invalid ML User ID');
    }
  }

  toNumber(): number {
    return this.value;
  }

  equals(other: MLUserId): boolean {
    return this.value === other.value;
  }
}

// ================================
// DOMAIN SERVICES
// ================================

export interface ProductDomainService {
  validateProductData(product: Partial<MLProduct>): Promise<ValidationResult>;
  calculateProductMetrics(products: MLProduct[]): ProductMetrics;
  categorizeProduct(title: string, category: string): Promise<CategorySuggestion>;
}

export interface OrderDomainService {
  validateOrderStatus(order: MLOrder): Promise<ValidationResult>;
  calculateOrderMetrics(orders: MLOrder[]): OrderMetrics;
  determineOrderPriority(order: MLOrder): OrderPriority;
}

export interface UserDomainService {
  validateUserPermissions(user: MLUser, action: string): Promise<boolean>;
  calculateUserReputation(user: MLUser): UserReputationScore;
  determineUserTrustLevel(user: MLUser): UserTrustLevel;
}

export interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: ValidationErrorInfo[];
  readonly warnings: ValidationWarning[];
}

export interface ValidationErrorInfo {
  readonly field: string;
  readonly code: string;
  readonly message: string;
}

export interface ValidationWarning {
  readonly field: string;
  readonly code: string;
  readonly message: string;
  readonly suggestion?: string;
}

export interface ProductMetrics {
  readonly totalProducts: number;
  readonly activeProducts: number;
  readonly totalValue: number;
  readonly averagePrice: number;
  readonly categoriesDistribution: Record<string, number>;
  readonly statusDistribution: Record<string, number>;
}

export interface OrderMetrics {
  readonly totalOrders: number;
  readonly totalRevenue: number;
  readonly averageOrderValue: number;
  readonly ordersByStatus: Record<MLOrderStatus, number>;
  readonly monthlyGrowth: number;
  readonly topProducts: Array<{ productId: string; quantity: number; revenue: number }>;
}

export type OrderPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface UserReputationScore {
  readonly score: number; // 0-100
  readonly level: 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT';
  readonly factors: Record<string, number>;
}

export type UserTrustLevel = 'UNTRUSTED' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERIFIED';

export interface CategorySuggestion {
  readonly suggestedCategoryId: string;
  readonly suggestedCategoryName: string;
  readonly confidence: number; // 0-1
  readonly alternativeCategories: Array<{
    readonly categoryId: string;
    readonly categoryName: string;
    readonly confidence: number;
  }>;
}

// ================================
// DOMAIN EVENTS
// ================================

export interface DomainEvent {
  readonly id: string;
  readonly aggregateId: string;
  readonly eventType: string;
  readonly version: number;
  readonly occurredOn: Date;
  readonly userId?: number;
}

export interface ProductUpdatedEvent extends DomainEvent {
  readonly eventType: 'PRODUCT_UPDATED';
  readonly productId: string;
  readonly changes: ProductChanges;
}

export interface OrderCreatedEvent extends DomainEvent {
  readonly eventType: 'ORDER_CREATED';
  readonly orderId: number;
  readonly orderData: MLOrder;
}

export interface OrderStatusChangedEvent extends DomainEvent {
  readonly eventType: 'ORDER_STATUS_CHANGED';
  readonly orderId: number;
  readonly previousStatus: MLOrderStatus;
  readonly newStatus: MLOrderStatus;
  readonly reason?: string;
}

export interface ProductChanges {
  readonly priceChanged?: { from: number; to: number };
  readonly quantityChanged?: { from: number; to: number };
  readonly statusChanged?: { from: string; to: string };
  readonly titleChanged?: { from: string; to: string };
}

// ================================
// REPOSITORIES (INTERFACES)
// ================================

export interface MLProductRepository {
  findById(id: MLProductId): Promise<MLProduct | null>;
  findByUserId(userId: MLUserId, filters?: ProductFilters): Promise<MLProduct[]>;
  findByCategory(categoryId: string, filters?: ProductFilters): Promise<MLProduct[]>;
  search(query: ProductSearchQuery): Promise<ProductSearchResult>;
  save(product: MLProduct): Promise<void>;
  delete(id: MLProductId): Promise<void>;
}

export interface MLOrderRepository {
  findById(id: MLOrderId): Promise<MLOrder | null>;
  findByUserId(userId: MLUserId, filters?: OrderFilters): Promise<MLOrder[]>;
  findByStatus(status: MLOrderStatus, filters?: OrderFilters): Promise<MLOrder[]>;
  search(query: OrderSearchQuery): Promise<OrderSearchResult>;
  save(order: MLOrder): Promise<void>;
}

export interface MLUserRepository {
  findById(id: MLUserId): Promise<MLUser | null>;
  findByEmail(email: string): Promise<MLUser | null>;
  findByNickname(nickname: string): Promise<MLUser | null>;
  save(user: MLUser): Promise<void>;
}

export interface ProductFilters {
  readonly status?: string[];
  readonly categoryId?: string;
  readonly minPrice?: number;
  readonly maxPrice?: number;
  readonly freeShipping?: boolean;
  readonly condition?: string[];
  readonly listingType?: string[];
  readonly hasStock?: boolean;
}

export interface OrderFilters {
  readonly status?: MLOrderStatus[];
  readonly dateFrom?: Date;
  readonly dateTo?: Date;
  readonly minAmount?: number;
  readonly maxAmount?: number;
  readonly paymentMethod?: string[];
  readonly shippingMethod?: string[];
}

export interface ProductSearchQuery {
  readonly query?: string;
  readonly categoryId?: string;
  readonly sellerId?: number;
  readonly filters?: ProductFilters;
  readonly sort?: ProductSortOption;
  readonly limit?: number;
  readonly offset?: number;
}

export interface OrderSearchQuery {
  readonly query?: string;
  readonly sellerId?: number;
  readonly buyerId?: number;
  readonly filters?: OrderFilters;
  readonly sort?: OrderSortOption;
  readonly limit?: number;
  readonly offset?: number;
}

export interface ProductSearchResult {
  readonly results: MLProduct[];
  readonly total: number;
  readonly limit: number;
  readonly offset: number;
  readonly hasNext: boolean;
  readonly availableFilters?: ProductAvailableFilters;
  readonly availableSorts?: ProductSortOption[];
}

export interface OrderSearchResult {
  readonly results: MLOrder[];
  readonly total: number;
  readonly limit: number;
  readonly offset: number;
  readonly hasNext: boolean;
  readonly availableFilters?: OrderAvailableFilters;
  readonly availableSorts?: OrderSortOption[];
}

export type ProductSortOption = 
  | 'relevance' 
  | 'price_asc' 
  | 'price_desc' 
  | 'date_desc' 
  | 'date_asc'
  | 'available_quantity_desc'
  | 'available_quantity_asc';

export type OrderSortOption = 
  | 'date_desc' 
  | 'date_asc' 
  | 'amount_desc' 
  | 'amount_asc'
  | 'status';

export interface ProductAvailableFilters {
  readonly categories: Array<{ id: string; name: string; count: number }>;
  readonly priceRanges: Array<{ min: number; max: number; count: number }>;
  readonly conditions: Array<{ id: string; name: string; count: number }>;
  readonly shippingOptions: Array<{ id: string; name: string; count: number }>;
}

export interface OrderAvailableFilters {
  readonly statuses: Array<{ id: MLOrderStatus; name: string; count: number }>;
  readonly paymentMethods: Array<{ id: string; name: string; count: number }>;
  readonly dateRanges: Array<{ from: Date; to: Date; name: string; count: number }>;
}

// ================================
// EXTERNAL SERVICES (INTERFACES)
// ================================

export interface MLAPIClient {
  get<T>(endpoint: string, headers?: Record<string, string>): Promise<T>;
  post<T>(endpoint: string, data: any, headers?: Record<string, string>): Promise<T>;
  put<T>(endpoint: string, data: any, headers?: Record<string, string>): Promise<T>;
  delete<T>(endpoint: string, headers?: Record<string, string>): Promise<T>;
}

export interface CacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

export interface LoggingService {
  info(message: string, metadata?: Record<string, any>): void;
  warn(message: string, metadata?: Record<string, any>): void;
  error(message: string, error?: Error, metadata?: Record<string, any>): void;
  debug(message: string, metadata?: Record<string, any>): void;
}

export interface EventBus {
  publish(event: DomainEvent): Promise<void>;
  subscribe(eventType: string, handler: EventHandler): void;
  unsubscribe(eventType: string, handler: EventHandler): void;
}

export type EventHandler = (event: DomainEvent) => Promise<void>;

// ================================
// ERROR TYPES
// ================================

export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, field?: string, value?: any) {
    super(message, 'VALIDATION_ERROR', { field, value });
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string, id: string | number) {
    super(`${resource} not found with id: ${id}`, 'NOT_FOUND', { resource, id });
    this.name = 'NotFoundError';
  }
}

export class BusinessRuleError extends DomainError {
  constructor(message: string, rule: string) {
    super(message, 'BUSINESS_RULE_VIOLATION', { rule });
    this.name = 'BusinessRuleError';
  }
}

export class ExternalServiceError extends Error {
  constructor(
    message: string,
    public readonly service: string,
    public readonly statusCode?: number,
    public readonly response?: any
  ) {
    super(message);
    this.name = 'ExternalServiceError';
  }
}