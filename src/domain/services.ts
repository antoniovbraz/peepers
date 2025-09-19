/**
 * 🎯 DOMAIN SERVICES - Business Logic Implementation
 * 
 * Enterprise domain services implementing complex business rules
 * Domain-driven design patterns for ML integration
 * 
 * Reference: Official ML API business rules and validation logic
 */

import {
  MLProduct,
  MLOrder,
  MLUser,
  ProductDomainService,
  OrderDomainService,
  UserDomainService,
  ValidationResult,
  ValidationErrorInfo,
  ValidationWarning,
  ProductMetrics,
  OrderMetrics,
  OrderPriority,
  UserReputationScore,
  UserTrustLevel,
  CategorySuggestion,
  MLOrderStatus,
  BusinessRuleError,
  LoggingService
} from '../domain/core.js';

// ================================
// PRODUCT DOMAIN SERVICE
// ================================

export class ProductDomainServiceImpl implements ProductDomainService {
  constructor(private readonly logger: LoggingService) {}

  async validateProductData(product: Partial<MLProduct>): Promise<ValidationResult> {
    const errors: ValidationErrorInfo[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      this.logger.debug('ProductDomainService: Validating product data', { productId: product.id });

      // Title validation
      if (!product.title) {
        errors.push({
          field: 'title',
          code: 'REQUIRED',
          message: 'Product title is required'
        });
      } else if (product.title.length < 5) {
        errors.push({
          field: 'title',
          code: 'MIN_LENGTH',
          message: 'Product title must be at least 5 characters long'
        });
      } else if (product.title.length > 60) {
        errors.push({
          field: 'title',
          code: 'MAX_LENGTH',
          message: 'Product title cannot exceed 60 characters'
        });
      }

      // Price validation
      if (product.price === undefined || product.price === null) {
        errors.push({
          field: 'price',
          code: 'REQUIRED',
          message: 'Product price is required'
        });
      } else if (product.price <= 0) {
        errors.push({
          field: 'price',
          code: 'INVALID_VALUE',
          message: 'Product price must be greater than 0'
        });
      } else if (product.price < 1) {
        warnings.push({
          field: 'price',
          code: 'LOW_PRICE',
          message: 'Very low price may affect visibility',
          suggestion: 'Consider if this price is correct'
        });
      }

      // Currency validation
      const validCurrencies = ['BRL', 'ARS', 'MXN', 'COP', 'CLP', 'PEN', 'UYU'];
      if (product.currency_id && !validCurrencies.includes(product.currency_id)) {
        errors.push({
          field: 'currency_id',
          code: 'INVALID_VALUE',
          message: `Invalid currency. Supported: ${validCurrencies.join(', ')}`
        });
      }

      // Quantity validation
      if (product.available_quantity !== undefined) {
        if (product.available_quantity < 0) {
          errors.push({
            field: 'available_quantity',
            code: 'INVALID_VALUE',
            message: 'Available quantity cannot be negative'
          });
        } else if (product.available_quantity === 0 && product.status === 'active') {
          warnings.push({
            field: 'available_quantity',
            code: 'OUT_OF_STOCK',
            message: 'Product is active but has no stock',
            suggestion: 'Consider pausing the listing'
          });
        }
      }

      // Condition validation
      const validConditions = ['new', 'used', 'not_specified'];
      if (product.condition && !validConditions.includes(product.condition)) {
        errors.push({
          field: 'condition',
          code: 'INVALID_VALUE',
          message: `Invalid condition. Supported: ${validConditions.join(', ')}`
        });
      }

      // Status validation
      const validStatuses = ['active', 'paused', 'closed', 'under_review', 'inactive'];
      if (product.status && !validStatuses.includes(product.status)) {
        errors.push({
          field: 'status',
          code: 'INVALID_VALUE',
          message: `Invalid status. Supported: ${validStatuses.join(', ')}`
        });
      }

      // Category validation
      if (!product.category_id) {
        errors.push({
          field: 'category_id',
          code: 'REQUIRED',
          message: 'Product category is required'
        });
      }

      // Pictures validation
      if (product.pictures && product.pictures.length > 12) {
        errors.push({
          field: 'pictures',
          code: 'TOO_MANY',
          message: 'Maximum 12 pictures allowed per product'
        });
      } else if (product.pictures && product.pictures.length === 0) {
        warnings.push({
          field: 'pictures',
          code: 'NO_PICTURES',
          message: 'Products without pictures have lower visibility',
          suggestion: 'Add at least one high-quality image'
        });
      }

      // Variations validation
      if (product.variations && product.variations.length > 200) {
        errors.push({
          field: 'variations',
          code: 'TOO_MANY',
          message: 'Maximum 200 variations allowed per product'
        });
      }

      // Business rules validation
      await this.validateBusinessRules(product, errors, warnings);

      const isValid = errors.length === 0;

      this.logger.debug('ProductDomainService: Validation completed', {
        productId: product.id,
        isValid,
        errorsCount: errors.length,
        warningsCount: warnings.length
      });

      return { isValid, errors, warnings };

    } catch (error) {
      this.logger.error('ProductDomainService: Validation failed', error as Error, { productId: product.id });
      throw error;
    }
  }

  private async validateBusinessRules(
    product: Partial<MLProduct>,
    errors: ValidationErrorInfo[],
    warnings: ValidationWarning[]
  ): Promise<void> {
    // Free shipping with high price rule
    if (product.shipping?.free_shipping && product.price && product.price < 79) {
      warnings.push({
        field: 'shipping',
        code: 'FREE_SHIPPING_LOW_PRICE',
        message: 'Free shipping with low price may reduce profit margins',
        suggestion: 'Consider minimum purchase value for free shipping'
      });
    }

    // Listing type vs price validation
    if (product.listing_type_id === 'gold_premium' && product.price && product.price < 50) {
      warnings.push({
        field: 'listing_type_id',
        code: 'PREMIUM_LOW_PRICE',
        message: 'Premium listing may not be cost-effective for low-price items',
        suggestion: 'Consider using free listing type'
      });
    }

    // Stock vs status consistency
    if (product.status === 'active' && product.available_quantity === 0) {
      errors.push({
        field: 'status',
        code: 'INCONSISTENT_STATE',
        message: 'Cannot have active product with zero stock'
      });
    }
  }

  calculateProductMetrics(products: MLProduct[]): ProductMetrics {
    try {
      this.logger.debug('ProductDomainService: Calculating metrics', { productCount: products.length });

      const totalProducts = products.length;
      const activeProducts = products.filter(p => p.status === 'active').length;
      const totalValue = products.reduce((sum, p) => sum + (p.price * p.available_quantity), 0);
      const averagePrice = totalProducts > 0 ? products.reduce((sum, p) => sum + p.price, 0) / totalProducts : 0;

      // Categories distribution
      const categoriesDistribution: Record<string, number> = {};
      products.forEach(product => {
        categoriesDistribution[product.category_id] = (categoriesDistribution[product.category_id] || 0) + 1;
      });

      // Status distribution
      const statusDistribution: Record<string, number> = {};
      products.forEach(product => {
        statusDistribution[product.status] = (statusDistribution[product.status] || 0) + 1;
      });

      const metrics: ProductMetrics = {
        totalProducts,
        activeProducts,
        totalValue,
        averagePrice,
        categoriesDistribution,
        statusDistribution
      };

      this.logger.debug('ProductDomainService: Metrics calculated', {
        totalProducts,
        activeProducts,
        totalValue,
        averagePrice
      });

      return metrics;

    } catch (error) {
      this.logger.error('ProductDomainService: Metrics calculation failed', error as Error, {
        productCount: products.length
      });
      throw error;
    }
  }

  async categorizeProduct(title: string, category: string): Promise<CategorySuggestion> {
    try {
      this.logger.debug('ProductDomainService: Categorizing product', { title, currentCategory: category });

      // Simple categorization logic based on title keywords
      // In production, this would use ML algorithms or external services
      const titleLower = title.toLowerCase();
      
      let suggestedCategoryId = category;
      let confidence = 0.5;
      const alternativeCategories: Array<{ categoryId: string; categoryName: string; confidence: number }> = [];

      // Electronics detection
      if (titleLower.includes('smartphone') || titleLower.includes('celular') || titleLower.includes('iphone')) {
        suggestedCategoryId = 'MLB1055';
        confidence = 0.9;
        alternativeCategories.push({
          categoryId: 'MLB1000',
          categoryName: 'Eletrônicos',
          confidence: 0.7
        });
      }
      // Fashion detection
      else if (titleLower.includes('camisa') || titleLower.includes('vestido') || titleLower.includes('roupa')) {
        suggestedCategoryId = 'MLB1430';
        confidence = 0.8;
        alternativeCategories.push({
          categoryId: 'MLB1431',
          categoryName: 'Roupas Femininas',
          confidence: 0.6
        });
      }
      // Books detection
      else if (titleLower.includes('livro') || titleLower.includes('book') || titleLower.includes('literatura')) {
        suggestedCategoryId = 'MLB3025';
        confidence = 0.9;
      }

      const suggestion: CategorySuggestion = {
        suggestedCategoryId,
        suggestedCategoryName: this.getCategoryName(suggestedCategoryId),
        confidence,
        alternativeCategories
      };

      this.logger.debug('ProductDomainService: Category suggestion generated', {
        title,
        suggestion: suggestedCategoryId,
        confidence
      });

      return suggestion;

    } catch (error) {
      this.logger.error('ProductDomainService: Categorization failed', error as Error, { title, category });
      throw error;
    }
  }

  private getCategoryName(categoryId: string): string {
    // Simplified category mapping
    const categoryMap: Record<string, string> = {
      'MLB1055': 'Celulares e Smartphones',
      'MLB1000': 'Eletrônicos',
      'MLB1430': 'Roupas e Calçados',
      'MLB1431': 'Roupas Femininas',
      'MLB3025': 'Livros'
    };

    return categoryMap[categoryId] || 'Categoria não identificada';
  }
}

// ================================
// ORDER DOMAIN SERVICE
// ================================

export class OrderDomainServiceImpl implements OrderDomainService {
  constructor(private readonly logger: LoggingService) {}

  async validateOrderStatus(order: MLOrder): Promise<ValidationResult> {
    const errors: ValidationErrorInfo[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      this.logger.debug('OrderDomainService: Validating order status', { orderId: order.id });

      // Status consistency validation
      if (order.status === 'paid' && order.paid_amount < order.total_amount) {
        errors.push({
          field: 'status',
          code: 'INCONSISTENT_PAYMENT',
          message: 'Order marked as paid but payment amount is insufficient'
        });
      }

      // Date consistency validation
      if (order.date_closed && new Date(order.date_closed) < new Date(order.date_created)) {
        errors.push({
          field: 'date_closed',
          code: 'INVALID_DATE',
          message: 'Order close date cannot be before creation date'
        });
      }

      // Payment validation
      if (order.payments && order.payments.length > 0) {
        const totalPaid = order.payments
          .filter(p => p.status === 'approved')
          .reduce((sum, p) => sum + p.transaction_amount, 0);

        if (Math.abs(totalPaid - order.paid_amount) > 0.01) {
          warnings.push({
            field: 'payments',
            code: 'PAYMENT_MISMATCH',
            message: 'Sum of approved payments does not match paid amount',
            suggestion: 'Verify payment reconciliation'
          });
        }
      }

      // Status transition validation
      await this.validateStatusTransitions(order, errors, warnings);

      const isValid = errors.length === 0;

      this.logger.debug('OrderDomainService: Status validation completed', {
        orderId: order.id,
        isValid,
        errorsCount: errors.length,
        warningsCount: warnings.length
      });

      return { isValid, errors, warnings };

    } catch (error) {
      this.logger.error('OrderDomainService: Status validation failed', error as Error, { orderId: order.id });
      throw error;
    }
  }

  private async validateStatusTransitions(
    order: MLOrder,
    errors: ValidationErrorInfo[],
    warnings: ValidationWarning[]
  ): Promise<void> {
    // Valid status transitions based on ML business rules
    const validTransitions: Record<MLOrderStatus, MLOrderStatus[]> = {
      'confirmed': ['payment_required', 'payment_in_process', 'cancelled'],
      'payment_required': ['payment_in_process', 'paid', 'cancelled'],
      'payment_in_process': ['paid', 'cancelled', 'partially_paid'],
      'partially_paid': ['paid', 'cancelled', 'partially_refunded'],
      'paid': ['partially_refunded', 'cancelled'],
      'partially_refunded': ['cancelled'],
      'pending_cancel': ['cancelled'],
      'cancelled': [], // Terminal state
      'invalid': [] // Terminal state
    };

    // This would require order history to validate transitions
    // For now, just validate current state consistency
    if (order.status === 'cancelled' && order.date_closed && new Date(order.date_closed) > new Date()) {
      warnings.push({
        field: 'date_closed',
        code: 'FUTURE_CLOSE_DATE',
        message: 'Order close date is in the future',
        suggestion: 'Verify close date accuracy'
      });
    }
  }

  calculateOrderMetrics(orders: MLOrder[]): OrderMetrics {
    try {
      this.logger.debug('OrderDomainService: Calculating metrics', { orderCount: orders.length });

      const totalOrders = orders.length;
      const totalRevenue = orders
        .filter(o => ['paid', 'partially_paid'].includes(o.status))
        .reduce((sum, o) => sum + o.paid_amount, 0);
      
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Calculate monthly growth (simplified - would need date range analysis)
      const now = new Date();
      const thisMonth = orders.filter(o => {
        const orderDate = new Date(o.date_created);
        return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
      }).length;

      const lastMonth = orders.filter(o => {
        const orderDate = new Date(o.date_created);
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return orderDate.getMonth() === lastMonthDate.getMonth() && 
               orderDate.getFullYear() === lastMonthDate.getFullYear();
      }).length;

      const monthlyGrowth = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

      // Orders by status
      const ordersByStatus: Record<MLOrderStatus, number> = {} as Record<MLOrderStatus, number>;
      orders.forEach(order => {
        ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;
      });

      // Top products by revenue
      const productRevenue: Record<string, { quantity: number; revenue: number }> = {};
      orders.forEach(order => {
        order.order_items.forEach(item => {
          const key = item.item.id;
          if (!productRevenue[key]) {
            productRevenue[key] = { quantity: 0, revenue: 0 };
          }
          productRevenue[key].quantity += item.quantity;
          productRevenue[key].revenue += item.unit_price * item.quantity;
        });
      });

      const topProducts = Object.entries(productRevenue)
        .sort(([, a], [, b]) => b.revenue - a.revenue)
        .slice(0, 10)
        .map(([productId, data]) => ({
          productId,
          quantity: data.quantity,
          revenue: data.revenue
        }));

      const metrics: OrderMetrics = {
        totalOrders,
        totalRevenue,
        averageOrderValue,
        ordersByStatus,
        monthlyGrowth,
        topProducts
      };

      this.logger.debug('OrderDomainService: Metrics calculated', {
        totalOrders,
        totalRevenue,
        averageOrderValue,
        monthlyGrowth
      });

      return metrics;

    } catch (error) {
      this.logger.error('OrderDomainService: Metrics calculation failed', error as Error, {
        orderCount: orders.length
      });
      throw error;
    }
  }

  determineOrderPriority(order: MLOrder): OrderPriority {
    try {
      this.logger.debug('OrderDomainService: Determining order priority', { orderId: order.id });

      let priority: OrderPriority = 'LOW';

      // High value orders
      if (order.total_amount > 1000) {
        priority = 'HIGH';
      } else if (order.total_amount > 500) {
        priority = 'MEDIUM';
      }

      // Payment issues
      if (order.status === 'payment_required' || order.status === 'payment_in_process') {
        if (priority === 'LOW') priority = 'MEDIUM';
      }

      // Urgent cases
      if (order.status === 'pending_cancel' || order.tags.includes('urgent')) {
        priority = 'URGENT';
      }

      // Expedited shipping
      if (order.shipping && order.tags.includes('express_shipping')) {
        if (priority === 'LOW') priority = 'MEDIUM';
        if (priority === 'MEDIUM') priority = 'HIGH';
      }

      // VIP customers (simplified logic)
      if (order.buyer.points > 10000) {
        if (priority === 'LOW') priority = 'MEDIUM';
      }

      this.logger.debug('OrderDomainService: Priority determined', {
        orderId: order.id,
        priority,
        amount: order.total_amount,
        status: order.status
      });

      return priority;

    } catch (error) {
      this.logger.error('OrderDomainService: Priority determination failed', error as Error, { orderId: order.id });
      return 'LOW';
    }
  }
}

// ================================
// USER DOMAIN SERVICE
// ================================

export class UserDomainServiceImpl implements UserDomainService {
  constructor(private readonly logger: LoggingService) {}

  async validateUserPermissions(user: MLUser, action: string): Promise<boolean> {
    try {
      this.logger.debug('UserDomainService: Validating permissions', { 
        userId: user.id, 
        action 
      });

      // Check user status first
      if (user.status.site_status !== 'active') {
        this.logger.warn('UserDomainService: User not active', { 
          userId: user.id, 
          status: user.status.site_status 
        });
        return false;
      }

      // Action-specific permissions
      switch (action) {
        case 'sell':
          return user.status.sell?.allow ?? false;
        
        case 'buy':
          return user.status.buy?.allow ?? false;
        
        case 'list':
          return user.status.list?.allow ?? false;
        
        case 'billing':
          return user.status.billing?.allow ?? false;
        
        case 'manage_listings':
          return user.user_type !== 'normal' || (user.status.list?.allow ?? false);
        
        case 'manage_orders':
          return user.status.sell?.allow ?? false;
        
        case 'access_reports':
          return user.user_type === 'brand' || user.points > 1000;
        
        default:
          this.logger.warn('UserDomainService: Unknown action', { userId: user.id, action });
          return false;
      }

    } catch (error) {
      this.logger.error('UserDomainService: Permission validation failed', error as Error, { 
        userId: user.id, 
        action 
      });
      return false;
    }
  }

  calculateUserReputation(user: MLUser): UserReputationScore {
    try {
      this.logger.debug('UserDomainService: Calculating reputation', { userId: user.id });

      let score = 50; // Base score
      const factors: Record<string, number> = {};

      // Points contribution (max 20 points)
      const pointsScore = Math.min(user.points / 1000, 20);
      score += pointsScore;
      factors.points = pointsScore;

      // Seller reputation contribution
      if (user.seller_reputation) {
        const rep = user.seller_reputation;
        
        // Transaction volume (max 15 points)
        const volumeScore = Math.min(rep.transactions.total / 100, 15);
        score += volumeScore;
        factors.volume = volumeScore;

        // Positive ratings (max 25 points)
        const totalRatings = rep.transactions.ratings.positive + 
                           rep.transactions.ratings.neutral + 
                           rep.transactions.ratings.negative;
        
        if (totalRatings > 0) {
          const positiveRate = rep.transactions.ratings.positive / totalRatings;
          const ratingScore = positiveRate * 25;
          score += ratingScore;
          factors.ratings = ratingScore;
        }

        // Completion rate (max 10 points)
        const totalTransactions = rep.transactions.completed + rep.transactions.canceled;
        if (totalTransactions > 0) {
          const completionRate = rep.transactions.completed / totalTransactions;
          const completionScore = completionRate * 10;
          score += completionScore;
          factors.completion = completionScore;
        }

        // Power seller bonus (max 10 points)
        if (rep.power_seller_status === 'gold') {
          score += 10;
          factors.powerSeller = 10;
        } else if (rep.power_seller_status === 'silver') {
          score += 5;
          factors.powerSeller = 5;
        }
      }

      // Account age bonus (simplified)
      const accountAge = new Date().getTime() - new Date(user.registration_date).getTime();
      const ageInYears = accountAge / (1000 * 60 * 60 * 24 * 365);
      const ageScore = Math.min(ageInYears * 2, 10);
      score += ageScore;
      factors.age = ageScore;

      // Cap at 100
      score = Math.min(score, 100);

      // Determine level
      let level: 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT';
      if (score >= 80) level = 'EXCELLENT';
      else if (score >= 60) level = 'GOOD';
      else if (score >= 40) level = 'FAIR';
      else level = 'POOR';

      const reputationScore: UserReputationScore = {
        score: Math.round(score),
        level,
        factors
      };

      this.logger.debug('UserDomainService: Reputation calculated', {
        userId: user.id,
        score: reputationScore.score,
        level: reputationScore.level
      });

      return reputationScore;

    } catch (error) {
      this.logger.error('UserDomainService: Reputation calculation failed', error as Error, { userId: user.id });
      
      // Return default score on error
      return {
        score: 50,
        level: 'FAIR',
        factors: { error: 0 }
      };
    }
  }

  determineUserTrustLevel(user: MLUser): UserTrustLevel {
    try {
      this.logger.debug('UserDomainService: Determining trust level', { userId: user.id });

      // Start with base level
      let trustLevel: UserTrustLevel = 'LOW';

      // Calculate reputation score
      const reputation = this.calculateUserReputation(user);

      // Base trust on reputation score
      if (reputation.score >= 80) {
        trustLevel = 'HIGH';
      } else if (reputation.score >= 60) {
        trustLevel = 'MEDIUM';
      } else if (reputation.score >= 40) {
        trustLevel = 'LOW';
      } else {
        trustLevel = 'UNTRUSTED';
      }

      // Verification factors
      if (user.status.confirmed_email && user.identification) {
        if (trustLevel === 'HIGH' && user.seller_reputation?.power_seller_status) {
          trustLevel = 'VERIFIED';
        }
      }

      // Risk factors that can downgrade trust
      if (user.buyer_reputation?.canceled_transactions && user.buyer_reputation.canceled_transactions > 10) {
        if (trustLevel === 'HIGH') trustLevel = 'MEDIUM';
        else if (trustLevel === 'MEDIUM') trustLevel = 'LOW';
      }

      // Account status issues
      if (user.status.site_status !== 'active') {
        trustLevel = 'UNTRUSTED';
      }

      this.logger.debug('UserDomainService: Trust level determined', {
        userId: user.id,
        trustLevel,
        reputationScore: reputation.score
      });

      return trustLevel;

    } catch (error) {
      this.logger.error('UserDomainService: Trust level determination failed', error as Error, { userId: user.id });
      return 'UNTRUSTED';
    }
  }
}