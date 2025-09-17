/**
 * Sales Types - v2.0
 * 
 * Type definitions for sales management module
 * Based on Mercado Livre Orders API and business requirements
 */

import { z } from 'zod';

// Order Status Types
export type OrderStatus = 
  | 'confirmed'     // Confirmado
  | 'payment_required' // Aguardando pagamento
  | 'payment_in_process' // Processando pagamento
  | 'paid'          // Pago
  | 'shipped'       // Enviado
  | 'delivered'     // Entregue
  | 'cancelled'     // Cancelado
  | 'not_delivered'; // Não entregue

export type PaymentStatus = 
  | 'pending'       // Pendente
  | 'in_process'    // Em processamento
  | 'approved'      // Aprovado
  | 'rejected'      // Rejeitado
  | 'cancelled'     // Cancelado
  | 'refunded'      // Reembolsado
  | 'charged_back'; // Chargeback

export type ShippingStatus =
  | 'pending'       // Pendente
  | 'handling'      // Preparando
  | 'shipped'       // Enviado
  | 'delivered'     // Entregue
  | 'not_delivered' // Não entregue
  | 'cancelled'     // Cancelado
  | 'returned';     // Devolvido

// Core Order Types
export interface OrderItem {
  id: string;
  title: string;
  categoryId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currencyId: string;
  thumbnail: string;
  permalink: string;
  variationId?: string;
  variationAttributes?: Array<{
    id: string;
    name: string;
    valueName: string;
  }>;
}

export interface OrderBuyer {
  id: number;
  nickname: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: {
    areaCode: string;
    number: string;
  };
  alternativePhone?: {
    areaCode: string;
    number: string;
  };
  identificationType?: string;
  identificationNumber?: string;
}

export interface OrderAddress {
  id?: number;
  streetName: string;
  streetNumber: string;
  complement?: string;
  zipCode: string;
  city: string;
  state: string;
  country: string;
  neighborhood?: string;
  comment?: string;
  contactName?: string;
  contactPhone?: string;
}

export interface OrderPayment {
  id: number;
  paymentMethodId: string;
  paymentTypeId: string;
  status: PaymentStatus;
  statusDetail: string;
  currencyId: string;
  totalPaidAmount: number;
  taxesAmount: number;
  shippingCost: number;
  overpaidAmount: number;
  transactionAmount: number;
  installments: number;
  dateCreated: string;
  dateLastModified: string;
  dateApproved?: string;
  dateLastUpdate?: string;
  orderValue: number;
  paidAmount: number;
}

export interface OrderShipping {
  id: number;
  shipmentType: string;
  pickupId?: string;
  status: ShippingStatus;
  substatus?: string;
  items?: Array<{
    id: string;
    quantity: number;
  }>;
  dateCreated: string;
  lastUpdated: string;
  trackingNumber?: string;
  trackingMethod?: string;
  estimatedDeliveryTime?: {
    date: string;
    timeFrom: string;
    timeTo: string;
  };
  estimatedDeliveryLimit?: {
    date: string;
  };
  estimatedHandlingLimit?: {
    date: string;
  };
  receiverAddress: OrderAddress;
  cost: number;
  mode: string;
  logisticType?: string;
  shippingOption?: {
    id: number;
    name: string;
    cost: number;
    estimatedDeliveryTime: string;
  };
}

export interface OrderFeedback {
  sale?: {
    id: number;
    rating: number;
    message: string;
    fulfilled: boolean;
    dateCreated: string;
  };
  purchase?: {
    id: number;
    rating: number;
    message: string;
    fulfilled: boolean;
    dateCreated: string;
  };
}

export interface Order {
  id: number;
  status: OrderStatus;
  statusDetail?: string;
  dateCreated: string;
  dateLastUpdated: string;
  dateClosed?: string;
  orderItems: OrderItem[];
  totalAmount: number;
  currencyId: string;
  buyer: OrderBuyer;
  seller: {
    id: number;
    nickname: string;
  };
  payments: OrderPayment[];
  shipping: OrderShipping;
  feedback?: OrderFeedback;
  context?: {
    channel: string;
    site: string;
    flows: string[];
  };
  tags: string[];
  manufacturingEnding?: string;
  pack?: {
    id: string;
    mode: string;
  };
  manufacturingEndingDate?: string;
  orderRequest?: {
    return?: {
      returnId: number;
      status: string;
    };
    change?: {
      changeId: number;
      status: string;
    };
  };
}

// Validation Schemas
export const OrderItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  categoryId: z.string(),
  quantity: z.number().min(1),
  unitPrice: z.number().min(0),
  totalPrice: z.number().min(0),
  currencyId: z.string(),
  thumbnail: z.string().url(),
  permalink: z.string().url(),
  variationId: z.string().optional(),
  variationAttributes: z.array(z.object({
    id: z.string(),
    name: z.string(),
    valueName: z.string(),
  })).optional(),
});

export const OrderBuyerSchema = z.object({
  id: z.number(),
  nickname: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.object({
    areaCode: z.string(),
    number: z.string(),
  }).optional(),
  alternativePhone: z.object({
    areaCode: z.string(),
    number: z.string(),
  }).optional(),
  identificationType: z.string().optional(),
  identificationNumber: z.string().optional(),
});

export const OrderSchema = z.object({
  id: z.number(),
  status: z.enum([
    'confirmed', 'payment_required', 'payment_in_process', 
    'paid', 'shipped', 'delivered', 'cancelled', 'not_delivered'
  ]),
  statusDetail: z.string().optional(),
  dateCreated: z.string(),
  dateLastUpdated: z.string(),
  dateClosed: z.string().optional(),
  orderItems: z.array(OrderItemSchema),
  totalAmount: z.number().min(0),
  currencyId: z.string(),
  buyer: OrderBuyerSchema,
  seller: z.object({
    id: z.number(),
    nickname: z.string(),
  }),
  payments: z.array(z.any()), // Simplified for now
  shipping: z.any(), // Simplified for now
  feedback: z.any().optional(),
  context: z.object({
    channel: z.string(),
    site: z.string(),
    flows: z.array(z.string()),
  }).optional(),
  tags: z.array(z.string()),
  manufacturingEnding: z.string().optional(),
  pack: z.object({
    id: z.string(),
    mode: z.string(),
  }).optional(),
  manufacturingEndingDate: z.string().optional(),
  orderRequest: z.any().optional(),
});

// Filter and Search Types
export interface OrderFilters {
  status?: OrderStatus[];
  paymentStatus?: PaymentStatus[];
  shippingStatus?: ShippingStatus[];
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  buyerQuery?: string;
  itemQuery?: string;
}

export interface OrderSortOption {
  field: 'dateCreated' | 'dateLastUpdated' | 'totalAmount' | 'buyerName';
  direction: 'asc' | 'desc';
}

// Analytics Types
export interface SalesMetrics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  conversionRate: number;
  pendingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  revenueGrowth: number;
  orderGrowth: number;
  topSellingProducts: Array<{
    productId: string;
    title: string;
    quantity: number;
    revenue: number;
  }>;
  salesByPeriod: Array<{
    date: string;
    orders: number;
    revenue: number;
  }>;
  paymentMethodDistribution: Array<{
    method: string;
    count: number;
    percentage: number;
  }>;
  shippingMethodDistribution: Array<{
    method: string;
    count: number;
    percentage: number;
  }>;
}