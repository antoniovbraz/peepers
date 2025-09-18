# Peepers + Mercado Livre - Enterprise Data Model

## 🏗️ **Core Domain Entities**

### **User Management (Multi-Tenant Ready)**

```typescript
interface MLUser {
  id: number;                    // ML user_id
  nickname: string;              // Seller nickname
  email: string;                 // Account email
  first_name: string;           // User first name
  last_name: string;            // User last name
  country_id: string;           // BR, AR, etc.
  user_type: 'normal' | 'admin'; // Account type
  tags: string[];               // User tags
  logo?: string;                // Profile logo URL
  points: number;               // Reputation points
  site_id: string;              // MLB, MLA, etc.
  permalink: string;            // Profile URL
  seller_reputation: MLSellerReputation;
  buyer_reputation: MLBuyerReputation;
  status: MLUserStatus;
  created_at: string;           // ISO date
  updated_at: string;           // ISO date
}

interface MLUserStatus {
  site_status: 'active' | 'inactive';
  list: {
    allow: boolean;
    codes: string[];
    immediate_payment: {
      required: boolean;
      reasons: string[];
    };
  };
  buy: {
    allow: boolean;
    codes: string[];
    immediate_payment: {
      required: boolean;
      reasons: string[];
    };
  };
  sell: {
    allow: boolean;
    codes: string[];
    immediate_payment: {
      required: boolean;
      reasons: string[];
    };
  };
  confirmed_email: boolean;
  user_type: string;
  required_action: string | null;
}

interface MLSellerReputation {
  level_id: string;             // 5_green, 4_light_green, etc.
  power_seller_status: string | null;
  transactions: {
    period: string;             // historic, last_60_days, etc.
    total: number;
    completed: number;
    canceled: number;
    ratings: {
      positive: number;
      negative: number;
      neutral: number;
    };
  };
  metrics: {
    sales: {
      period: string;
      completed: number;
    };
    claims: {
      period: string;
      rate: number;
      value: number;
    };
    delayed_handlings: {
      period: string;
      rate: number;
      value: number;
    };
    cancellations: {
      period: string;
      rate: number;
      value: number;
    };
  };
}
```

### **Product Catalog (Enhanced)**

```typescript
interface MLProduct {
  id: string;                   // ML item ID
  site_id: string;             // MLB
  title: string;               // Product title
  subtitle?: string;           // Optional subtitle
  seller_id: number;           // Seller ML ID
  category_id: string;         // ML category
  official_store_id?: number;  // Official store
  price: number;               // Current price
  base_price: number;          // Original price
  original_price?: number;     // Historical price
  currency_id: string;         // BRL, USD, etc.
  initial_quantity: number;    // Stock total
  available_quantity: number;  // Current stock
  sold_quantity: number;       // Units sold
  sale_terms: MLSaleTerm[];    // Payment/shipping terms
  buying_mode: 'buy_it_now' | 'auction' | 'classified';
  listing_type_id: string;     // gold_special, etc.
  condition: 'new' | 'used' | 'not_specified';
  permalink: string;           // Product URL
  thumbnail_id: string;        // Main image ID
  thumbnail: string;           // Main image URL
  secure_thumbnail: string;    // HTTPS image URL
  pictures: MLPicture[];       // All images
  video_id?: string;           // Video ID
  descriptions: MLDescription[]; // Product descriptions
  accepts_mercadopago: boolean; // MP payment
  non_mercado_pago_payment_methods: string[];
  shipping: MLShipping;        // Shipping info
  seller_address: MLAddress;   // Seller location
  seller_contact?: MLContact;  // Contact info
  location?: MLLocation;       // Geographic location
  attributes: MLAttribute[];   // Product attributes
  variations?: MLVariation[];  // Product variations
  status: 'active' | 'paused' | 'closed' | 'under_review' | 'inactive';
  sub_status: string[];        // Additional status info
  tags: string[];              // Product tags
  warranty?: string;           // Warranty info
  catalog_product_id?: string; // Catalog reference
  domain_id?: string;          // Product domain
  parent_item_id?: string;     // Parent for variations
  differential_pricing?: MLDifferentialPricing; // Special pricing
  deal_ids: string[];          // Active deals
  automatic_relist: boolean;   // Auto-relist feature
  date_created: string;        // ISO creation date
  last_updated: string;        // ISO update date
  health?: number;             // Health score (0-1)
  catalog_listing?: boolean;   // Is catalog listing
  channels?: string[];         // Sales channels
  
  // Peepers-specific extensions
  peepers_sync_status: 'synced' | 'pending' | 'error';
  peepers_last_sync: string;   // ISO sync date
  peepers_notes?: string;      // Internal notes
  peepers_tags?: string[];     // Custom tags
}

interface MLPicture {
  id: string;
  url: string;
  secure_url: string;
  size: string;                // 500x500, etc.
  max_size: string;           // Original size
  quality?: string;           // Image quality
}

interface MLAttribute {
  id: string;                 // COLOR, BRAND, etc.
  name: string;               // Color, Brand, etc.
  value_id?: string;          // Specific value ID
  value_name: string;         // Specific value
  value_struct?: any;         // Structured value
  values?: MLAttributeValue[]; // Multiple values
  attribute_group_id?: string; // Group classification
  attribute_group_name?: string; // Group name
}

interface MLVariation {
  id: number;                 // Variation ID
  price: number;              // Variation price
  attribute_combinations: MLAttribute[]; // Defining attributes
  available_quantity: number; // Stock for variation
  sold_quantity: number;      // Sold units
  picture_ids: string[];      // Variation images
  seller_custom_field?: string; // Custom SKU
}
```

### **Order Management (Complete)**

```typescript
interface MLOrder {
  id: number;                 // Order ID
  date_created: string;       // ISO creation date
  date_closed?: string;       // ISO completion date
  last_updated: string;       // ISO last update
  mediations?: MLMediation[]; // Dispute mediations
  status: MLOrderStatus;      // Order status
  status_detail?: string;     // Additional status info
  order_items: MLOrderItem[]; // Items in order
  order_request?: MLOrderRequest; // Original request
  payments: MLPayment[];      // Payment information
  shipping: MLOrderShipping; // Shipping details
  feedback?: MLFeedback;      // Feedback info
  context?: any;              // Additional context
  buyer: MLOrderUser;         // Buyer information
  seller: MLOrderUser;        // Seller information
  tags: string[];             // Order tags
  pack_id?: number;           // Multi-order pack
  pickup_id?: number;         // Pickup point
  currency_id: string;        // BRL, USD, etc.
  manufacturing_ending_date?: string; // Manufacturing date
  
  // Totals
  total_amount: number;       // Total order value
  total_amount_with_shipping: number; // Including shipping
  paid_amount: number;        // Amount paid
  coupon?: MLCoupon;          // Applied coupon
  
  // Peepers-specific
  peepers_notes?: string;     // Internal notes
  peepers_priority?: 'low' | 'normal' | 'high' | 'urgent';
  peepers_assigned_to?: string; // Team member
  peepers_status_history: {
    status: string;
    date: string;
    notes?: string;
  }[];
}

type MLOrderStatus = 
  | 'confirmed'      // Order confirmed
  | 'payment_required' // Awaiting payment
  | 'payment_in_process' // Payment processing
  | 'partially_paid' // Partial payment
  | 'paid'          // Payment complete
  | 'partially_refunded' // Partial refund
  | 'pending_cancel' // Cancel requested
  | 'cancelled'     // Order cancelled
  | 'invalid'       // Invalid order
  | 'partially_returned' // Partial return
  | 'returned';     // Full return

interface MLOrderItem {
  item: {
    id: string;               // Product ML ID
    title: string;            // Product title
    category_id: string;      // Product category
    variation_id?: number;    // Variation ID
    seller_custom_field?: string; // SKU
    variation_attributes: MLAttribute[]; // Variation details
    warranty?: string;        // Warranty info
    condition: string;        // Product condition
    seller_sku?: string;      // Seller SKU
  };
  quantity: number;           // Ordered quantity
  unit_price: number;         // Unit price
  full_unit_price: number;    // Price before discounts
  currency_id: string;        // Currency
  manufacturing_days?: number; // Manufacturing time
  sale_fee?: number;          // ML commission
  listing_type_id: string;    // Listing type
}

interface MLPayment {
  id: number;                 // Payment ID
  order_id: number;           // Related order
  payer_id: number;           // Payer ML ID
  collector: {
    id: number;               // Collector ML ID
  };
  card_id?: number;           // Credit card ID
  site_id: string;            // MLB, etc.
  reason: string;             // Payment reason
  payment_method_id: string;  // Payment method
  payment_type: string;       // Payment type
  status: MLPaymentStatus;    // Payment status
  status_detail: string;      // Status details
  transaction_amount: number; // Amount
  taxes_amount: number;       // Taxes
  shipping_cost: number;      // Shipping cost
  coupon_amount: number;      // Coupon discount
  installments: number;       // Installment count
  date_approved?: string;     // Approval date
  date_created: string;       // Creation date
  last_modified: string;      // Last update
  amount_refunded: number;    // Refunded amount
  coupon_id?: string;         // Coupon ID
  available_actions: string[]; // Available actions
  overpaid_amount: number;    // Overpaid amount
  total_paid_amount: number;  // Total paid
  currency_id: string;        // Currency
  activation_uri?: string;    // Activation URL
  operation_type: string;     // Operation type
}

type MLPaymentStatus = 
  | 'pending'       // Payment pending
  | 'approved'      // Payment approved
  | 'authorized'    // Payment authorized
  | 'in_process'    // Payment processing
  | 'in_mediation'  // Payment disputed
  | 'rejected'      // Payment rejected
  | 'cancelled'     // Payment cancelled
  | 'refunded'      // Payment refunded
  | 'charged_back'; // Chargeback
```

### **Messaging System**

```typescript
interface MLMessage {
  id: string;                 // Message ID
  site_id: string;            // MLB, etc.
  client_id: number;          // App ID
  user_id: string;            // User ID
  resource: string;           // Resource URL
  resource_id: string;        // Resource ID
  text: {
    plain: string;            // Plain text
    html?: string;            // HTML content
  };
  from: {
    user_id: string;          // Sender ID
    email?: string;           // Sender email
    first_name?: string;      // Sender name
    last_name?: string;       // Sender surname
  };
  to: {
    user_id: string;          // Recipient ID
    email?: string;           // Recipient email
    first_name?: string;      // Recipient name
    last_name?: string;       // Recipient surname
  };
  attachments: MLAttachment[]; // File attachments
  conversation_first_message: boolean; // First in conversation
  message_date: {
    created: string;          // ISO creation date
    available: string;        // ISO available date
    notified: string;         // ISO notification date
    read?: string;            // ISO read date
  };
  moderation: {
    status: 'clean' | 'pending_review' | 'blocked';
    reason?: string;          // Moderation reason
  };
  status: 'available' | 'not_available' | 'hidden';
  subject?: string;           // Message subject
  
  // Peepers-specific
  peepers_priority?: 'low' | 'normal' | 'high' | 'urgent';
  peepers_assigned_to?: string; // Team member
  peepers_response_required: boolean;
  peepers_response_deadline?: string; // ISO date
  peepers_tags?: string[];    // Custom tags
  peepers_internal_notes?: string; // Internal notes
}

interface MLAttachment {
  id: string;                 // Attachment ID
  name: string;               // File name
  size: number;               // File size (bytes)
  content_type: string;       // MIME type
  download_url: string;       // Download URL
}
```

### **Question & Answer System**

```typescript
interface MLQuestion {
  id: number;                 // Question ID
  text: string;               // Question text
  status: 'UNANSWERED' | 'ANSWERED' | 'CLOSED_UNANSWERED' | 'UNDER_REVIEW';
  item_id: string;            // Product ID
  seller_id: number;          // Seller ML ID
  date_created: string;       // ISO creation date
  hold: boolean;              // On hold flag
  deleted_from_listing: boolean; // Deleted flag
  answer?: {
    text: string;             // Answer text
    status: 'ACTIVE' | 'DISABLED' | 'BANNED';
    date_created: string;     // ISO answer date
  };
  from: {
    id: number;               // Asker ID
    answered_questions: number; // Questions answered
  };
  
  // Peepers-specific
  peepers_priority?: 'low' | 'normal' | 'high' | 'urgent';
  peepers_assigned_to?: string; // Team member
  peepers_response_deadline?: string; // ISO date
  peepers_auto_response?: boolean; // Auto-generated flag
  peepers_tags?: string[];    // Custom tags
  peepers_internal_notes?: string; // Internal notes
}
```

---

## 🏢 **Enterprise Extensions**

### **Multi-Tenant Architecture**

```typescript
interface PeepersTenant {
  id: string;                 // Tenant UUID
  name: string;               // Company name
  slug: string;               // URL slug
  ml_user_id: number;         // Primary ML user
  ml_users: number[];         // All associated ML users
  subscription: {
    plan: 'starter' | 'professional' | 'enterprise';
    status: 'active' | 'suspended' | 'cancelled';
    billing_cycle: 'monthly' | 'quarterly' | 'yearly';
    current_period_start: string; // ISO date
    current_period_end: string;   // ISO date
    stripe_customer_id?: string;  // Stripe customer
    stripe_subscription_id?: string; // Stripe subscription
  };
  settings: {
    timezone: string;         // Tenant timezone
    currency: string;         // Default currency
    language: string;         // Interface language
    business_type: 'individual' | 'small_business' | 'enterprise';
    industry?: string;        // Business industry
    webhook_url?: string;     // Custom webhook
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
  };
  limits: {
    products: number;         // Product limit
    orders_per_month: number; // Order limit
    api_calls_per_hour: number; // API limit
    storage_gb: number;       // Storage limit
    team_members: number;     // User limit
  };
  usage: {
    products_count: number;
    orders_this_month: number;
    api_calls_today: number;
    storage_used_gb: number;
    team_members_count: number;
  };
  created_at: string;         // ISO creation date
  updated_at: string;         // ISO update date
  status: 'active' | 'suspended' | 'deleted';
}

interface PeepersUser {
  id: string;                 // User UUID
  tenant_id: string;          // Tenant ID
  ml_user_id?: number;        // ML user (if linked)
  email: string;              // User email
  first_name: string;         // User first name
  last_name: string;          // User last name
  role: 'owner' | 'admin' | 'manager' | 'operator' | 'viewer';
  permissions: string[];      // Granular permissions
  preferences: {
    timezone: string;
    language: string;
    notifications: {
      orders: boolean;
      messages: boolean;
      questions: boolean;
      products: boolean;
    };
    dashboard_layout?: any;   // Custom layout
  };
  last_login?: string;        // ISO last login
  status: 'active' | 'invited' | 'suspended';
  created_at: string;         // ISO creation date
  updated_at: string;         // ISO update date
}
```

### **Analytics & Reporting**

```typescript
interface PeepersAnalytics {
  tenant_id: string;          // Tenant ID
  date: string;               // YYYY-MM-DD
  metrics: {
    sales: {
      total_orders: number;
      total_revenue: number;
      average_order_value: number;
      conversion_rate: number;
      refund_rate: number;
    };
    products: {
      total_listings: number;
      active_listings: number;
      views: number;
      clicks: number;
      questions_received: number;
    };
    performance: {
      response_time_avg: number; // seconds
      response_rate: number;    // percentage
      satisfaction_score: number; // 1-5
      claim_rate: number;       // percentage
    };
    traffic: {
      unique_visitors: number;
      page_views: number;
      bounce_rate: number;
      session_duration: number; // seconds
    };
  };
  trends: {
    sales_growth: number;       // percentage
    product_performance: number; // percentage
    customer_satisfaction: number; // percentage
  };
  top_products: {
    product_id: string;
    title: string;
    revenue: number;
    units_sold: number;
    views: number;
  }[];
  created_at: string;         // ISO timestamp
}
```

### **Automation Rules**

```typescript
interface PeepersAutomationRule {
  id: string;                 // Rule UUID
  tenant_id: string;          // Tenant ID
  name: string;               // Rule name
  description?: string;       // Rule description
  enabled: boolean;           // Rule status
  trigger: {
    type: 'webhook' | 'schedule' | 'manual';
    event: string;            // ML event type
    conditions: {
      field: string;          // Field to check
      operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
      value: any;             // Comparison value
    }[];
  };
  actions: {
    type: 'email' | 'sms' | 'webhook' | 'api_call' | 'update_product';
    config: any;              // Action configuration
  }[];
  statistics: {
    executions: number;       // Total executions
    successes: number;        // Successful executions
    failures: number;         // Failed executions
    last_execution?: string;  // ISO last run
    last_success?: string;    // ISO last success
  };
  created_at: string;         // ISO creation date
  updated_at: string;         // ISO update date
}
```

---

## 🔄 **Data Synchronization Model**

### **Sync Status Tracking**

```typescript
interface PeepersSyncStatus {
  tenant_id: string;          // Tenant ID
  entity_type: 'products' | 'orders' | 'messages' | 'questions';
  entity_id: string;          // ML entity ID
  sync_status: 'pending' | 'syncing' | 'success' | 'error' | 'conflict';
  last_sync_attempt: string;  // ISO timestamp
  last_successful_sync?: string; // ISO timestamp
  sync_attempts: number;      // Retry count
  error_message?: string;     // Last error
  ml_last_updated: string;    // ML entity last update
  peepers_last_updated: string; // Local last update
  conflict_fields?: string[]; // Conflicting fields
  retry_after?: string;       // ISO next retry time
}

interface PeepersSyncQueue {
  id: string;                 // Queue item UUID
  tenant_id: string;          // Tenant ID
  priority: 'low' | 'normal' | 'high' | 'urgent';
  operation: 'create' | 'update' | 'delete' | 'bulk_sync';
  entity_type: string;        // Entity type
  entity_id: string;          // Entity ID
  payload?: any;              // Operation data
  scheduled_for: string;      // ISO execution time
  created_at: string;         // ISO creation time
  attempts: number;           // Retry count
  max_attempts: number;       // Max retries
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  error_message?: string;     // Last error
  processing_started_at?: string; // ISO start time
  completed_at?: string;      // ISO completion time
}
```

---

**🎯 PRÓXIMA ETAPA**: Implementar as entidades base do modelo de dados com migrations e validações TypeScript/Zod para garantir integridade dos dados ML.