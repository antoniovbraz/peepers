// Mercado Livre API Types

export interface MLUser {
  id: number;
  nickname: string;
  first_name: string;
  last_name: string;
  email: string;
  country_id: string;
  site_id: string;
  permalink: string;
  seller_reputation: {
    level_id: string;
    power_seller_status: string;
    transactions: {
      completed: number;
      canceled: number;
      period: string;
    };
  };
}

export interface MLPicture {
  id: string;
  url: string;
  secure_url: string;
  size: string;
  max_size: string;
  quality: string;
}

export interface MLAttribute {
  id: string;
  name: string;
  value_id?: string;
  value_name?: string;
  value_struct?: {
    number: number;
    unit: string;
  };
  values?: Array<{
    id: string;
    name: string;
    struct?: {
      number: number;
      unit: string;
    };
  }>;
  attribute_group_id?: string;
  attribute_group_name?: string;
}

export interface MLShipping {
  mode: string;
  methods: Array<{
    id: number;
    name: string;
  }>;
  tags: string[];
  dimensions?: string;
  local_pick_up: boolean;
  free_shipping: boolean;
  logistic_type: string;
  store_pick_up: boolean;
}

export interface MLProduct {
  id: string;
  site_id: string;
  title: string;
  subtitle?: string;
  seller_id: number;
  category_id: string;
  official_store_id?: number;
  price: number;
  base_price?: number;
  original_price?: number;
  currency_id: string;
  initial_quantity: number;
  available_quantity: number;
  sold_quantity: number;
  condition: 'new' | 'used' | 'not_specified';
  permalink: string;
  thumbnail: string;
  secure_thumbnail: string;
  pictures: MLPicture[];
  video_id?: string;
  descriptions?: Array<{
    id: string;
    text: string;
    plain_text: string;
  }>;
  accepts_mercadopago: boolean;
  non_mercado_pago_payment_methods: any[];
  shipping: MLShipping;
  international_delivery_mode: string;
  seller_address: {
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
    search_location: {
      neighborhood: {
        id: string;
        name: string;
      };
      city: {
        id: string;
        name: string;
      };
      state: {
        id: string;
        name: string;
      };
    };
  };
  seller_contact?: any;
  location: any;
  attributes: MLAttribute[];
  warnings: any[];
  listing_source: string;
  variations: any[];
  status: 'active' | 'paused' | 'closed' | 'under_review' | 'inactive';
  sub_status: any[];
  tags: string[];
  warranty?: string;
  catalog_product_id?: string;
  domain_id?: string;
  parent_item_id?: string;
  differential_pricing?: any;
  deal_ids: any[];
  automatic_relist: boolean;
  date_created: string;
  last_updated: string;
  health?: number;
  catalog_listing?: boolean;
}

export interface MLQuestion {
  id: number;
  text: string;
  status: 'UNANSWERED' | 'ANSWERED' | 'BANNED' | 'DELETED' | 'UNDER_REVIEW';
  date_created: string;
  item_id: string;
  seller_id: number;
  from: {
    id: number;
    nickname: string;
  };
  answer?: {
    text: string;
    status: string;
    date_created: string;
  };
  deleted_from_listing: boolean;
  hold: boolean;
  tags: string[];
}

export interface MLOrder {
  id: number;
  status: 'confirmed' | 'payment_required' | 'payment_in_process' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  status_detail?: string;
  date_created: string;
  date_closed?: string;
  order_items: Array<{
    item: {
      id: string;
      title: string;
      category_id: string;
      variation_id?: string;
      seller_custom_field?: string;
    };
    quantity: number;
    unit_price: number;
    full_unit_price: number;
  }>;
  total_amount: number;
  currency_id: string;
  buyer: {
    id: number;
    nickname: string;
    email: string;
    phone: {
      area_code: string;
      number: string;
      extension?: string;
    };
    first_name: string;
    last_name: string;
  };
  seller: {
    id: number;
    nickname: string;
    email: string;
    phone: {
      area_code: string;
      number: string;
      extension?: string;
    };
    first_name: string;
    last_name: string;
  };
  payments: Array<{
    id: number;
    status: string;
    status_detail: string;
    payment_method_id: string;
    payment_type_id: string;
    total_paid_amount: number;
    currency_id: string;
    date_created: string;
    date_last_modified: string;
  }>;
  feedback: {
    buyer?: any;
    seller?: any;
  };
  shipping: {
    id: number;
    shipment_type: string;
    status: string;
    date_created: string;
    receiver_address: {
      id: number;
      address_line: string;
      street_name: string;
      street_number: string;
      comment?: string;
      zip_code: string;
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
      neighborhood: {
        id: string;
        name: string;
      };
      municipality: {
        id: string;
        name: string;
      };
    };
  };
  tags: string[];
}

export interface MLWebhook {
  resource: string;
  user_id: number;
  topic: 'items' | 'orders_v2' | 'questions' | 'messages' | 'price_suggestion';
  application_id: number;
  attempts: number;
  sent: string;
  received: string;
  actions?: string[];
}

export interface MLCategory {
  id: string;
  name: string;
  picture?: string;
  permalink?: string;
  total_items_in_this_category?: number;
  path_from_root?: Array<{
    id: string;
    name: string;
  }>;
  children_categories?: Array<{
    id: string;
    name: string;
    total_items_in_this_category: number;
  }>;
  attribute_types?: string;
  settings?: {
    adult_content: boolean;
    buying_allowed: boolean;
    buying_modes: string[];
    catalog_domain: string;
    coverage_areas: string;
    currencies: string[];
    fragile: boolean;
    immediate_payment: string;
    item_conditions: string[];
    items_reviews_allowed: boolean;
    listing_allowed: boolean;
    max_description_length: number;
    max_pictures_per_item: number;
    max_pictures_per_item_var: number;
    max_sub_title_length: number;
    max_title_length: number;
    maximum_price?: number;
    maximum_price_currency?: string;
    minimum_price?: number;
    minimum_price_currency?: string;
    mirror_category?: string;
    mirror_master_category?: string;
    mirror_slave_categories?: string[];
    price?: string;
    reservation_allowed?: string;
    restrictions?: string[];
    rounded_address?: boolean;
    seller_contact?: string;
    shipping_modes?: string[];
    shipping_options?: string[];
    shipping_profile?: string;
    show_contact_information?: boolean;
    simple_shipping?: string;
    stock?: string;
    sub_vertical?: string;
    subscribable?: boolean;
    tags?: string[];
    vertical?: string;
    vip_subdomain?: string;
    buyer_protection_programs?: string[];
    status?: string;
  };
}

export interface MLSearchResult {
  site_id: string;
  country_default_time_zone: string;
  query?: string;
  paging: {
    total: number;
    primary_results: number;
    offset: number;
    limit: number;
  };
  results: MLProduct[];
  sort: {
    id: string;
    name: string;
  };
  available_sorts: Array<{
    id: string;
    name: string;
  }>;
  filters: any[];
  available_filters: any[];
}

// Cache Types
export interface CachedProduct extends MLProduct {
  cached_at: string;
  cache_ttl: number;
}

export interface CachedQuestions {
  item_id: string;
  questions: MLQuestion[];
  cached_at: string;
  cache_ttl: number;
}

// API Response Types
export interface MLApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    error: string;
    status: number;
    cause?: any[];
  };
}

// OAuth Types
export interface MLTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  user_id: number;
  refresh_token: string;
}

export interface MLTokenRefreshResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  user_id: number;
  refresh_token: string;
}
