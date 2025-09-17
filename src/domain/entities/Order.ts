/**
 * Order Entity - Core business entity for Mercado Livre orders
 * 
 * This entity encapsulates all business logic related to orders,
 * following Clean Architecture principles in the domain layer.
 */

export interface OrderBuyer {
  id: number;
  nickname: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: {
    area_code: string;
    number: string;
  };
}

export interface OrderPayment {
  id: number;
  order_id: string;
  payer_id: number;
  collector_id: number;
  card_id?: string;
  site_id: string;
  date_created: Date;
  date_approved?: Date;
  date_last_updated: Date;
  money_release_schema?: string;
  money_release_date?: Date;
  operation_type: string;
  issuer_id?: string;
  payment_method_id: string;
  payment_type: string;
  status: 'pending' | 'approved' | 'authorized' | 'in_process' | 'in_mediation' | 'rejected' | 'cancelled' | 'refunded' | 'charged_back';
  status_detail: string;
  currency_id: string;
  description?: string;
  installments: number;
  installment_amount?: number;
  deferred_period?: string;
  coupon_amount: number;
  net_received_amount: number;
  overpaid_amount: number;
  total_paid_amount: number;
  marketplace_fee: number;
  coupon_fee: number;
  financing_fee: number;
  shipping_cost: number;
  pos_id?: string;
  store_id?: string;
  external_reference?: string;
  merchant_account_id?: string;
  merchant_number?: string;
}

export interface OrderItem {
  item: {
    id: string;
    title: string;
    category_id: string;
    variation_id?: string;
    seller_custom_field?: string;
    variation_attributes: Array<{
      id: string;
      name: string;
      value_id: string;
      value_name: string;
    }>;
  };
  quantity: number;
  unit_price: number;
  currency_id: string;
  full_unit_price: number;
  seller_sku?: string;
}

export interface OrderShipping {
  id: number;
  mode: string;
  created_by: string;
  order_id: string;
  order_cost: number;
  base_cost: number;
  site_id: string;
  status: 'ready_to_ship' | 'shipped' | 'delivered' | 'not_delivered' | 'cancelled' | 'handling' | 'pending';
  substatus?: string;
  date_created: Date;
  last_updated: Date;
  tracking_number?: string;
  tracking_method?: string;
  service_id?: number;
  carrier_info?: {
    name: string;
    tracking_url?: string;
  };
  receiver_address: {
    id: number;
    address_line: string;
    street_name?: string;
    street_number?: string;
    comment?: string;
    zip_code?: string;
    city: {
      id: string;
      name: string;
    };
    state: {
      id: string;
      name: string;
    };
    country: {
      id: string;
      name: string;
    };
    neighborhood?: {
      id: string;
      name: string;
    };
    municipality?: {
      id: string;
      name: string;
    };
    agency?: string;
    types: string[];
    latitude?: number;
    longitude?: number;
    receiver_name: string;
    receiver_phone: string;
  };
}

export class Order {
  constructor(
    public readonly id: string,
    public readonly status: 'confirmed' | 'payment_required' | 'payment_in_process' | 'paid' | 'shipped' | 'delivered' | 'cancelled',
    public readonly status_detail?: string,
    public readonly date_created: Date = new Date(),
    public readonly date_closed?: Date,
    public readonly last_updated: Date = new Date(),
    public readonly currency_id: string = 'BRL',
    public readonly total_amount: number = 0,
    public readonly total_amount_with_shipping: number = 0,
    public readonly paid_amount: number = 0,
    public readonly expiration_date?: Date,
    public readonly order_items: OrderItem[] = [],
    public readonly buyer: OrderBuyer | null = null,
    public readonly seller_id: number = 0,
    public readonly payments: OrderPayment[] = [],
    public readonly feedback?: {
      sale?: {
        rating: 'positive' | 'neutral' | 'negative';
        message?: string;
      };
      purchase?: {
        rating: 'positive' | 'neutral' | 'negative';
        message?: string;
      };
    },
    public readonly shipping: OrderShipping | null = null,
    public readonly coupon?: {
      id: string;
      amount: number;
    },
    public readonly context?: {
      channel: string;
      site: string;
      flows: string[];
    },
    public readonly tags: string[] = []
  ) {
    this.validateOrder();
  }

  /**
   * Business Logic: Validates order data
   */
  private validateOrder(): void {
    if (!this.id || this.id.trim() === '') {
      throw new Error('Order ID is required');
    }

    if (this.total_amount < 0) {
      throw new Error('Total amount cannot be negative');
    }

    if (this.paid_amount < 0) {
      throw new Error('Paid amount cannot be negative');
    }

    if (this.seller_id <= 0) {
      throw new Error('Valid seller ID is required');
    }

    if (this.order_items.length === 0) {
      throw new Error('Order must have at least one item');
    }
  }

  /**
   * Business Logic: Check if order is paid
   */
  public isPaid(): boolean {
    return this.status === 'paid' || this.paid_amount >= this.total_amount;
  }

  /**
   * Business Logic: Check if order is shipped
   */
  public isShipped(): boolean {
    return this.status === 'shipped' || this.status === 'delivered';
  }

  /**
   * Business Logic: Check if order is delivered
   */
  public isDelivered(): boolean {
    return this.status === 'delivered';
  }

  /**
   * Business Logic: Check if order is cancelled
   */
  public isCancelled(): boolean {
    return this.status === 'cancelled';
  }

  /**
   * Business Logic: Check if order needs attention
   */
  public needsAttention(): boolean {
    const daysSinceCreated = Math.floor((Date.now() - this.date_created.getTime()) / (1000 * 60 * 60 * 24));
    
    // Payment pending for more than 2 days
    if (['confirmed', 'payment_required', 'payment_in_process'].includes(this.status) && daysSinceCreated > 2) {
      return true;
    }

    // Shipped but not delivered for more than 7 days
    if (this.status === 'shipped' && daysSinceCreated > 7) {
      return true;
    }

    return false;
  }

  /**
   * Business Logic: Get primary payment
   */
  public getPrimaryPayment(): OrderPayment | null {
    if (this.payments.length === 0) return null;
    return this.payments.find(p => p.status === 'approved') || this.payments[0];
  }

  /**
   * Business Logic: Get shipping status
   */
  public getShippingStatus(): string {
    if (!this.shipping) return 'not_shipped';
    return this.shipping.status;
  }

  /**
   * Business Logic: Calculate total profit (after fees)
   */
  public getTotalProfit(): number {
    const primaryPayment = this.getPrimaryPayment();
    if (!primaryPayment) return 0;

    return primaryPayment.net_received_amount - primaryPayment.shipping_cost;
  }

  /**
   * Business Logic: Get order age in days
   */
  public getAgeInDays(): number {
    return Math.floor((Date.now() - this.date_created.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Business Logic: Get formatted total amount
   */
  public getFormattedTotal(): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: this.currency_id === 'BRL' ? 'BRL' : 'USD',
    }).format(this.total_amount);
  }

  /**
   * Business Logic: Get buyer name
   */
  public getBuyerName(): string {
    if (!this.buyer) return 'Cliente';
    
    if (this.buyer.first_name && this.buyer.last_name) {
      return `${this.buyer.first_name} ${this.buyer.last_name}`;
    }
    
    return this.buyer.nickname || 'Cliente';
  }

  /**
   * Business Logic: Check if order has tracking
   */
  public hasTracking(): boolean {
    return !!(this.shipping?.tracking_number);
  }

  /**
   * Factory method to create Order from Mercado Livre API response
   */
  static fromMLResponse(mlOrder: Record<string, unknown>): Order {
    return new Order(
      mlOrder.id as string,
      mlOrder.status as Order['status'],
      mlOrder.status_detail as string,
      mlOrder.date_created ? new Date(mlOrder.date_created as string) : new Date(),
      mlOrder.date_closed ? new Date(mlOrder.date_closed as string) : undefined,
      mlOrder.last_updated ? new Date(mlOrder.last_updated as string) : new Date(),
      mlOrder.currency_id as string || 'BRL',
      mlOrder.total_amount as number || 0,
      mlOrder.total_amount_with_shipping as number || 0,
      mlOrder.paid_amount as number || 0,
      mlOrder.expiration_date ? new Date(mlOrder.expiration_date as string) : undefined,
      mlOrder.order_items as OrderItem[] || [],
      mlOrder.buyer as OrderBuyer || null,
      (mlOrder.seller as Record<string, unknown>)?.id as number || 0,
      mlOrder.payments as OrderPayment[] || [],
      mlOrder.feedback as Order['feedback'],
      mlOrder.shipping as OrderShipping || null,
      mlOrder.coupon as Order['coupon'],
      mlOrder.context as Order['context'],
      mlOrder.tags as string[] || []
    );
  }

  /**
   * Convert to summary format for lists
   */
  public toSummary(): Record<string, unknown> {
    return {
      id: this.id,
      status: this.status,
      total_amount: this.total_amount,
      buyer_name: this.getBuyerName(),
      date_created: this.date_created,
      needs_attention: this.needsAttention(),
      items_count: this.order_items.length,
      shipping_status: this.getShippingStatus(),
      has_tracking: this.hasTracking()
    };
  }
}