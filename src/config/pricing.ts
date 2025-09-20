/**
 * Peepers - Configuração de Planos e Preços
 * Baseado na Estratégia de Precificação v2.0.0
 */

export const PEEPERS_PRICING = {
  // Preços em centavos (formato Stripe)
  PRICES: {
    STARTER_MONTHLY: 1990, // R$ 19,90
    BUSINESS_MONTHLY: 3490, // R$ 34,90
    ENTERPRISE_MONTHLY: 5490, // R$ 54,90
    
    // Desconto anual (15% off)
    STARTER_YEARLY: 16915, // R$ 169,15 (equivale a ~R$ 14,10/mês)
    BUSINESS_YEARLY: 29665, // R$ 296,65 (equivale a ~R$ 24,72/mês)
    ENTERPRISE_YEARLY: 46665, // R$ 466,65 (equivale a ~R$ 38,89/mês)
  },

  CURRENCY: 'BRL',
  COUNTRY: 'BR',
  TAX_BEHAVIOR: 'inclusive' as const, // Preços já incluem impostos brasileiros
};

export const PEEPERS_PLANS = {
  starter: {
    id: 'starter',
    name: 'Starter',
    tagline: 'Comece a vender com inteligência',
    price_monthly: PEEPERS_PRICING.PRICES.STARTER_MONTHLY,
    price_yearly: PEEPERS_PRICING.PRICES.STARTER_YEARLY,
    target_audience: 'Vendedores iniciantes, até 100 produtos',
    
    features: [
      'basic_analytics',
      'product_monitoring', 
      'basic_pricing',
      'basic_storefront',
      'weekly_reports',
      'chat_support'
    ] as const,
    
    limits: {
      products_limit: 100,
      users_limit: 1,
      api_calls_per_month: 10000,
      storage_gb: 1,
      update_frequency_hours: 6,
      history_days: 30,
      storefront_products: 50
    },
    
    highlights: [
      '✅ Site próprio básico (50 produtos)',
      '✅ Dashboard ML com métricas básicas',
      '✅ Monitor de estoque (sem controle)',
      '✅ Análise de precificação básica',
      '✅ Relatórios semanais por email',
      '✅ Suporte por chat (horário comercial)'
    ]
  },

  business: {
    id: 'business',
    name: 'Business',
    tagline: 'Profissionalize suas vendas',
    price_monthly: PEEPERS_PRICING.PRICES.BUSINESS_MONTHLY,
    price_yearly: PEEPERS_PRICING.PRICES.BUSINESS_YEARLY,
    target_audience: 'Vendedores estabelecidos, 100-500 produtos',
    
    features: [
      'basic_analytics',
      'product_monitoring', 
      'basic_pricing',
      'basic_storefront',
      'weekly_reports',
      'chat_support',
      'advanced_analytics',
      'ai_descriptions',
      'competitor_analysis',
      'ai_recommendations',
      'inventory_analysis',
      'smart_alerts',
      'api_access',
      'advanced_reports'
    ] as const,
    
    limits: {
      products_limit: 500,
      users_limit: 3,
      api_calls_per_month: 50000,
      storage_gb: 5,
      update_frequency_hours: 2,
      history_days: 90,
      storefront_products: 300
    },
    
    highlights: [
      '✅ Tudo do Starter +',
      '✅ Site personalizado (300 produtos)',
      '✅ IA para descrições (com aprovação)',
      '✅ Análise de concorrentes',
      '✅ Recomendações de IA',
      '✅ Análise de giro e sazonalidade',
      '✅ Alertas inteligentes',
      '✅ API básica',
      '✅ Relatórios avançados'
    ]
  },

  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'Domine seu mercado',
    price_monthly: PEEPERS_PRICING.PRICES.ENTERPRISE_MONTHLY,
    price_yearly: PEEPERS_PRICING.PRICES.ENTERPRISE_YEARLY,
    target_audience: 'Grandes vendedores, +500 produtos, equipes',
    
    features: [
      'basic_analytics',
      'product_monitoring', 
      'basic_pricing',
      'basic_storefront',
      'weekly_reports',
      'chat_support',
      'advanced_analytics',
      'ai_descriptions',
      'competitor_analysis',
      'ai_recommendations',
      'inventory_analysis',
      'smart_alerts',
      'api_access',
      'advanced_reports',
      'market_intelligence',
      'dynamic_pricing',
      'reputation_analysis',
      'executive_dashboard',
      'white_label',
      'dedicated_support'
    ] as const,
    
    limits: {
      products_limit: -1, // Ilimitado
      users_limit: -1, // Ilimitado
      api_calls_per_month: -1, // Ilimitado
      storage_gb: 50,
      update_frequency_hours: 0, // Tempo real
      history_days: -1, // Histórico completo
      storefront_products: -1 // Ilimitado
    },
    
    highlights: [
      '✅ Tudo do Business +',
      '✅ Site premium ilimitado',
      '✅ IA avançada e análises preditivas',
      '✅ Market Intelligence profunda',
      '✅ Precificação dinâmica',
      '✅ Análise de reputação',
      '✅ Dashboard executivo',
      '✅ White label completo',
      '✅ Account manager dedicado'
    ]
  }
} as const;

export type PeepersPlanId = keyof typeof PEEPERS_PLANS;
export type PeepersPlanFeature = typeof PEEPERS_PLANS[PeepersPlanId]['features'][number];

// Features detalhadas por categoria
export const FEATURE_CATEGORIES = {
  'Análise e Inteligência': {
    basic_analytics: 'Dashboard básico com métricas essenciais',
    advanced_analytics: 'Análises avançadas e comparativos de mercado',
    market_intelligence: 'Inteligência de mercado e análise de tendências',
    competitor_analysis: 'Monitoramento de concorrentes em tempo real',
    reputation_analysis: 'Análise de reputação e sugestões de melhoria'
  },
  
  'Precificação': {
    basic_pricing: 'Sugestões básicas de precificação',
    dynamic_pricing: 'Precificação dinâmica baseada em múltiplas variáveis'
  },
  
  'Inteligência Artificial': {
    ai_descriptions: 'Sugestões de melhorias para descrições (com aprovação)',
    ai_recommendations: 'Recomendações de produtos e oportunidades'
  },
  
  'Monitoramento': {
    product_monitoring: 'Monitoramento de produtos e quantidades',
    inventory_analysis: 'Análise de giro e performance por categoria',
    smart_alerts: 'Alertas inteligentes sobre mudanças importantes'
  },
  
  'Vitrine e Marketing': {
    basic_storefront: 'Site próprio básico para produtos',
    white_label: 'Personalização completa da marca'
  },
  
  'Relatórios e Comunicação': {
    weekly_reports: 'Relatórios semanais automatizados',
    advanced_reports: 'Relatórios avançados com análises preditivas',
    executive_dashboard: 'Dashboard executivo com KPIs estratégicos'
  },
  
  'Suporte e Integração': {
    chat_support: 'Suporte via chat em horário comercial',
    dedicated_support: 'Account manager dedicado',
    api_access: 'Acesso básico à API para integrações'
  }
} as const;

// ROI esperado por plano
export const EXPECTED_ROI = {
  starter: {
    time_savings_hours_per_week: 3,
    margin_improvement_percent: 5,
    roi_range_percent: [600, 2400]
  },
  business: {
    time_savings_hours_per_week: 6.5,
    margin_improvement_percent: 10,
    roi_range_percent: [600, 1800]
  },
  enterprise: {
    time_savings_hours_per_week: 15,
    margin_improvement_percent: 17.5,
    roi_range_percent: [900, 3000]
  }
} as const;