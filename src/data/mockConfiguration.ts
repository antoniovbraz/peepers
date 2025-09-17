/**
 * Mock Configuration Data - Realistic data for development and testing
 * 
 * Based on Mercado Livre API documentation and real-world scenarios
 */

import { 
  SystemConfiguration, 
  WebhookConfig, 
  NotificationSettings, 
  APIMonitoringMetrics,
  LGPDSettings,
  CompanySettings,
  OAuthStatus
} from '@/types/configuration';

export const mockCompanySettings: CompanySettings = {
  name: 'Peepers Store Ltda.',
  contactEmail: 'contato@peepers.com.br',
  phone: '+55 11 99876-5432',
  timezone: 'America/Sao_Paulo',
  currency: 'BRL',
  language: 'pt-BR',
  address: {
    street: 'Rua das Flores',
    number: '123',
    complement: 'Sala 456',
    neighborhood: 'Vila Madalena',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '05433-020',
    country: 'BR'
  },
  legalInfo: {
    cnpj: '12.345.678/0001-90',
    stateRegistration: '123.456.789.012',
    municipalRegistration: '1234567-8'
  }
};

export const mockOAuthStatus: OAuthStatus = {
  connected: true,
  userId: '123456789',
  lastRefresh: new Date('2024-01-15T10:30:00'),
  tokenExpiry: new Date('2024-01-15T16:30:00'),
  scopes: ['read', 'write', 'offline_access'],
  application: {
    id: '1234567890123456',
    name: 'Peepers Integration',
    status: 'active'
  }
};

export const mockWebhookConfig: WebhookConfig = {
  enabled: true,
  callbackUrl: 'https://peepers.vercel.app/api/webhook/mercado-livre',
  topics: [
    {
      name: 'orders_v2',
      enabled: true,
      description: 'Novos pedidos e mudanças de status',
      lastNotification: new Date('2024-01-15T14:25:00'),
      deliveryRate: 98.5,
      totalNotifications: 1247,
      failedNotifications: 18
    },
    {
      name: 'items',
      enabled: true,
      description: 'Mudanças em produtos publicados',
      lastNotification: new Date('2024-01-15T13:45:00'),
      deliveryRate: 97.2,
      totalNotifications: 892,
      failedNotifications: 25
    },
    {
      name: 'messages',
      enabled: false,
      description: 'Mensagens pós-venda entre comprador e vendedor',
      deliveryRate: 0,
      totalNotifications: 0,
      failedNotifications: 0
    },
    {
      name: 'shipments',
      enabled: true,
      description: 'Mudanças em status de envio',
      lastNotification: new Date('2024-01-15T12:15:00'),
      deliveryRate: 99.1,
      totalNotifications: 675,
      failedNotifications: 6
    },
    {
      name: 'questions',
      enabled: false,
      description: 'Perguntas feitas pelos compradores',
      deliveryRate: 0,
      totalNotifications: 0,
      failedNotifications: 0
    },
    {
      name: 'marketplace_items',
      enabled: true,
      description: 'Mudanças em itens do marketplace',
      lastNotification: new Date('2024-01-15T11:30:00'),
      deliveryRate: 96.8,
      totalNotifications: 445,
      failedNotifications: 14
    }
  ],
  retryPolicy: {
    maxRetries: 3,
    retryInterval: 60, // 1 minute
    backoffMultiplier: 2
  },
  ipWhitelist: [
    '54.88.218.97',
    '18.215.140.160', 
    '18.213.114.129',
    '18.206.34.84'
  ],
  responseTimeout: 500 // 500ms as per ML documentation
};

export const mockNotificationSettings: NotificationSettings = {
  email: {
    newOrders: true,
    stockAlerts: true,
    systemUpdates: false,
    weeklyReports: true,
    dailyDigest: false,
    errorAlerts: true
  },
  browser: {
    realTime: true,
    sound: false,
    desktop: true
  },
  mobile: {
    push: true,
    sms: false
  },
  frequency: {
    immediateAlerts: true,
    hourlyDigest: false,
    dailyDigest: true,
    weeklyReports: true
  }
};

export const mockAPIMonitoring: APIMonitoringMetrics = {
  totalRequests: 15683,
  totalErrors: 247,
  averageResponseTime: 156, // ms
  uptime: 99.7,
  errorsByCode: {
    '400': 45,
    '401': 12,
    '403': 8,
    '404': 89,
    '429': 15,
    '451': 2,
    '500': 58,
    '502': 12,
    '503': 6
  },
  topErrors: [
    {
      code: 404,
      message: 'Item not found',
      count: 89,
      lastOccurrence: new Date('2024-01-15T14:30:00')
    },
    {
      code: 500,
      message: 'Internal server error',
      count: 58,
      lastOccurrence: new Date('2024-01-15T13:45:00')
    },
    {
      code: 400,
      message: 'Invalid listing_type_id',
      count: 45,
      lastOccurrence: new Date('2024-01-15T12:20:00')
    }
  ],
  rateLimits: [
    {
      endpoint: 'orders_search',
      used: 78,
      limit: 100,
      resetTime: '15:00',
      timeWindow: '1h'
    },
    {
      endpoint: 'items_get',
      used: 445,
      limit: 1000,
      resetTime: '16:00',
      timeWindow: '1h'
    },
    {
      endpoint: 'global_daily',
      used: 2834,
      limit: 5000,
      resetTime: '23:59',
      timeWindow: '1d'
    }
  ],
  endpoints: [
    {
      name: 'GET /orders/search',
      method: 'GET',
      path: '/orders/search',
      requests: 1234,
      errors: 12,
      avgResponse: 178,
      status: 'healthy'
    },
    {
      name: 'GET /items/{id}',
      method: 'GET', 
      path: '/items/{id}',
      requests: 3456,
      errors: 23,
      avgResponse: 89,
      status: 'healthy'
    },
    {
      name: 'PUT /items/{id}',
      method: 'PUT',
      path: '/items/{id}',
      requests: 234,
      errors: 8,
      avgResponse: 267,
      status: 'warning',
      lastError: {
        code: 400,
        message: 'Invalid listing_type_id',
        timestamp: new Date('2024-01-15T12:20:00')
      }
    },
    {
      name: 'POST /items',
      method: 'POST',
      path: '/items',
      requests: 156,
      errors: 15,
      avgResponse: 445,
      status: 'error',
      lastError: {
        code: 403,
        message: 'Forbidden category for user',
        timestamp: new Date('2024-01-15T11:45:00')
      }
    }
  ]
};

export const mockLGPDSettings: LGPDSettings = {
  dataRetentionDays: 365,
  automaticDeletion: true,
  consentTracking: true,
  dataExportEnabled: true,
  privacyPolicyUrl: 'https://peepers.com.br/privacidade',
  dataProtectionOfficer: {
    name: 'Maria Silva',
    email: 'dpo@peepers.com.br',
    phone: '+55 11 98765-4321'
  },
  cookieSettings: {
    essential: true,
    analytics: true,
    marketing: false,
    preferences: true
  }
};

export const mockSystemConfiguration: SystemConfiguration = {
  company: mockCompanySettings,
  oauth: mockOAuthStatus,
  webhooks: mockWebhookConfig,
  notifications: mockNotificationSettings,
  monitoring: mockAPIMonitoring,
  lgpd: mockLGPDSettings,
  backup: {
    enabled: true,
    frequency: 'daily',
    retention: 30,
    lastBackup: new Date('2024-01-15T02:00:00'),
    nextBackup: new Date('2024-01-16T02:00:00')
  },
  maintenance: {
    scheduledDowntime: null,
    backupInProgress: false,
    systemHealth: 'healthy'
  }
};

// Mercado Livre specific configuration data
export const mlSiteConfig = {
  id: 'MLB',
  name: 'Brasil',
  defaultCurrency: 'BRL',
  countryId: 'BR',
  timeZone: 'America/Sao_Paulo'
};

export const mlApplicationConfig = {
  clientId: process.env.ML_CLIENT_ID || '',
  redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/mercado-livre/callback`,
  scopes: ['read', 'write', 'offline_access'] as const,
  environment: process.env.NODE_ENV === 'production' ? 'production' as const : 'sandbox' as const
};

// Rate limit configurations based on ML API documentation
export const mlRateLimits = {
  orders_search: {
    limit: 100,
    timeWindow: '1m', // 100 per minute
    description: 'Busca de pedidos'
  },
  items_get: {
    limit: 1000,
    timeWindow: '1h', // 1000 per hour
    description: 'Consulta de produtos'
  },
  global_hourly: {
    limit: 1000,
    timeWindow: '1h', // 1000 per hour per app
    description: 'Limite global por aplicação'
  },
  global_daily: {
    limit: 5000,
    timeWindow: '1d', // 5000 per day per user
    description: 'Limite global por usuário'
  }
};

// Webhook notification examples based on documentation
export const mockWebhookNotifications = [
  {
    _id: '12345678901234567890abcd',
    resource: '/orders/123456789',
    user_id: 123456789,
    topic: 'orders_v2' as const,
    application_id: 1234567890123456,
    attempts: 1,
    sent: '2024-01-15T14:25:32.000Z',
    received: '2024-01-15T14:25:32.156Z'
  },
  {
    _id: '12345678901234567890abce',
    resource: '/items/MLB123456789',
    user_id: 123456789,
    topic: 'items' as const,
    application_id: 1234567890123456,
    attempts: 2,
    sent: '2024-01-15T13:45:15.000Z',
    received: '2024-01-15T13:45:15.234Z'
  }
];

export default mockSystemConfiguration;