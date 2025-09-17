/**
 * Tipos para gerenciamento de cookies e consent LGPD
 */

export interface CookieCategory {
  id: string;
  name: string;
  description: string;
  required: boolean;
  cookies: string[];
}

export interface CookieConsent {
  hasConsented: boolean;
  consentDate: string;
  categories: Record<string, boolean>;
  version: string;
}

export interface CookiePreferences {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

export const COOKIE_CATEGORIES: CookieCategory[] = [
  {
    id: 'essential',
    name: 'Cookies Essenciais',
    description: 'Necessários para o funcionamento básico da aplicação. Não podem ser desabilitados.',
    required: true,
    cookies: ['session_token', 'user_id', 'csrf_token']
  },
  {
    id: 'functional',
    name: 'Cookies Funcionais',
    description: 'Melhoram a funcionalidade e personalização da aplicação.',
    required: false,
    cookies: ['ui_preferences', 'language_preference', 'theme_preference']
  },
  {
    id: 'analytics',
    name: 'Cookies de Análise',
    description: 'Ajudam a entender como você usa a aplicação para melhorias.',
    required: false,
    cookies: ['analytics_session', 'performance_metrics']
  },
  {
    id: 'marketing',
    name: 'Cookies de Marketing',
    description: 'Usados para personalizar conteúdo e anúncios relevantes.',
    required: false,
    cookies: ['marketing_preferences', 'ad_tracking']
  }
];

export const COOKIE_CONSENT_VERSION = '1.0';
export const COOKIE_CONSENT_KEY = 'peepers_cookie_consent';
export const COOKIE_CONSENT_DURATION = 365; // dias