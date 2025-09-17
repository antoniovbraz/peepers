/**
 * Configuration Types - Types for admin configuration module
 * 
 * Based on Mercado Livre API documentation and OAuth 2.0 + PKCE flows
 */

export interface CompanySettings {
  name: string;
  contactEmail: string;
  phone: string;
  timezone: string;
  currency: string;
  language: string;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  legalInfo: {
    cnpj?: string;
    stateRegistration?: string;
    municipalRegistration?: string;
  };
}

export interface OAuthStatus {
  connected: boolean;
  userId?: string;
  lastRefresh: Date;
  tokenExpiry: Date;
  scopes: OAuthScope[];
  application: {
    id: string;
    name: string;
    status: 'active' | 'disabled' | 'pending';
  };
}

export type OAuthScope = 'read' | 'write' | 'offline_access';

export interface RateLimit {
  endpoint: string;
  used: number;
  limit: number;
  resetTime: string;
  timeWindow: string; // '1h', '1d', etc.
}

export interface APIEndpointMonitoring {
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  requests: number;
  errors: number;
  avgResponse: number;
  status: 'healthy' | 'warning' | 'error';
  lastError?: {
    code: number;
    message: string;
    timestamp: Date;
  };
}

export interface WebhookTopic {
  name: WebhookTopicName;
  enabled: boolean;
  description: string;
  lastNotification?: Date;
  deliveryRate: number; // Success rate percentage
  totalNotifications: number;
  failedNotifications: number;
}

export type WebhookTopicName = 
  | 'orders_v2'
  | 'items' 
  | 'messages' 
  | 'shipments' 
  | 'questions'
  | 'marketplace_items'
  | 'marketplace_orders'
  | 'marketplace_questions'
  | 'marketplace_messages'
  | 'marketplace_shipments'
  | 'marketplace_claims'
  | 'marketplace_fbm_stock'
  | 'marketplace_item_competition'
  | 'public_offers'
  | 'public_candidates';

export interface WebhookConfig {
  enabled: boolean;
  callbackUrl: string;
  topics: WebhookTopic[];
  retryPolicy: {
    maxRetries: number;
    retryInterval: number; // seconds
    backoffMultiplier: number;
  };
  ipWhitelist: string[]; // ML notification IPs
  responseTimeout: number; // milliseconds
}

export interface NotificationSettings {
  email: {
    newOrders: boolean;
    stockAlerts: boolean;
    systemUpdates: boolean;
    weeklyReports: boolean;
    dailyDigest: boolean;
    errorAlerts: boolean;
  };
  browser: {
    realTime: boolean;
    sound: boolean;
    desktop: boolean;
  };
  mobile: {
    push: boolean;
    sms: boolean;
  };
  frequency: {
    immediateAlerts: boolean;
    hourlyDigest: boolean;
    dailyDigest: boolean;
    weeklyReports: boolean;
  };
}

export interface APIMonitoringMetrics {
  totalRequests: number;
  totalErrors: number;
  averageResponseTime: number;
  uptime: number; // percentage
  errorsByCode: Record<string, number>;
  topErrors: Array<{
    code: number;
    message: string;
    count: number;
    lastOccurrence: Date;
  }>;
  rateLimits: RateLimit[];
  endpoints: APIEndpointMonitoring[];
}

export interface LGPDSettings {
  dataRetentionDays: number;
  automaticDeletion: boolean;
  consentTracking: boolean;
  dataExportEnabled: boolean;
  privacyPolicyUrl: string;
  dataProtectionOfficer: {
    name: string;
    email: string;
    phone: string;
  };
  cookieSettings: {
    essential: boolean;
    analytics: boolean;
    marketing: boolean;
    preferences: boolean;
  };
}

export interface SystemConfiguration {
  company: CompanySettings;
  oauth: OAuthStatus;
  webhooks: WebhookConfig;
  notifications: NotificationSettings;
  monitoring: APIMonitoringMetrics;
  lgpd: LGPDSettings;
  backup: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    retention: number; // days
    lastBackup: Date;
    nextBackup: Date;
  };
  maintenance: {
    scheduledDowntime: Date | null;
    backupInProgress: boolean;
    systemHealth: 'healthy' | 'warning' | 'critical';
  };
}

// API Configuration interfaces based on ML documentation
export interface MLSiteConfig {
  id: string; // 'MLB' for Brazil
  name: string;
  defaultCurrency: string;
  countryId: string;
  timeZone: string;
}

export interface MLApplicationConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: OAuthScope[];
  environment: 'sandbox' | 'production';
}

export interface MLWebhookIPs {
  production: string[];
  sandbox: string[];
}

// Webhook notification payload structure
export interface WebhookNotification {
  _id: string;
  resource: string;
  user_id: number;
  topic: WebhookTopicName;
  application_id: number;
  attempts: number;
  sent: string; // ISO date
  received: string; // ISO date
}

// Error codes mapping based on ML API documentation
export const ML_ERROR_CODES = {
  400: 'Bad Request - Parâmetros inválidos',
  401: 'Unauthorized - Token inválido ou expirado',
  403: 'Forbidden - Sem permissão para o recurso',
  404: 'Not Found - Recurso não encontrado',
  429: 'Rate Limited - Limite de requisições excedido',
  451: 'Unavailable for Legal Reasons - Usuário restrito',
  500: 'Internal Server Error - Erro interno do ML',
  502: 'Bad Gateway - Erro de conectividade',
  503: 'Service Unavailable - Serviço temporariamente indisponível'
} as const;

export type MLErrorCode = keyof typeof ML_ERROR_CODES;