'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CookieConsent,
  CookiePreferences,
  COOKIE_CONSENT_KEY,
  COOKIE_CONSENT_VERSION,
  COOKIE_CONSENT_DURATION
} from '@/types/cookies';

/**
 * Hook para gerenciamento de consent de cookies conforme LGPD
 * 
 * Implementa:
 * - Persistência do consentimento no localStorage
 * - Versioning para mudanças na política
 * - Categorização de cookies (essenciais vs funcionais)
 * - Controle granular por categoria
 * 
 * @returns {Object} Estado e funções para gerenciar cookies
 */
export function useCookieConsent() {
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar consent existente do localStorage
  useEffect(() => {
    const loadConsent = () => {
      try {
        const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
        if (stored) {
          const parsed: CookieConsent = JSON.parse(stored);
          
          // Verificar se a versão ainda é válida
          if (parsed.version === COOKIE_CONSENT_VERSION) {
            setConsent(parsed);
            setShowBanner(false);
          } else {
            // Nova versão da política - mostrar banner novamente
            setShowBanner(true);
          }
        } else {
          // Primeiro acesso - mostrar banner
          setShowBanner(true);
        }
      } catch (error) {
        console.warn('Erro ao carregar consent de cookies:', error);
        setShowBanner(true);
      } finally {
        setIsLoading(false);
      }
    };

    // Delay para evitar hidration mismatch
    const timer = setTimeout(loadConsent, 100);
    return () => clearTimeout(timer);
  }, []);

  /**
   * Salvar preferências de cookies
   */
  const saveConsent = useCallback((preferences: CookiePreferences) => {
    const newConsent: CookieConsent = {
      hasConsented: true,
      consentDate: new Date().toISOString(),
      categories: {
        essential: true, // Sempre true
        functional: preferences.functional,
        analytics: preferences.analytics,
        marketing: preferences.marketing,
      },
      version: COOKIE_CONSENT_VERSION
    };

    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(newConsent));
      setConsent(newConsent);
      setShowBanner(false);

      // Aplicar preferências aos cookies existentes
      applyCookiePreferences(newConsent);
      
      console.log('Preferências de cookies salvas:', newConsent);
    } catch (error) {
      console.error('Erro ao salvar consent de cookies:', error);
    }
  }, []);

  /**
   * Aceitar todos os cookies
   */
  const acceptAll = useCallback(() => {
    saveConsent({
      essential: true,
      functional: true,
      analytics: true,
      marketing: true
    });
  }, [saveConsent]);

  /**
   * Aceitar apenas cookies essenciais
   */
  const acceptEssential = useCallback(() => {
    saveConsent({
      essential: true,
      functional: false,
      analytics: false,
      marketing: false
    });
  }, [saveConsent]);

  /**
   * Rejeitar todos os cookies não essenciais
   */
  const rejectAll = useCallback(() => {
    acceptEssential();
  }, [acceptEssential]);

  /**
   * Resetar preferências (para testing ou nova versão)
   */
  const resetConsent = useCallback(() => {
    try {
      localStorage.removeItem(COOKIE_CONSENT_KEY);
      setConsent(null);
      setShowBanner(true);
      
      // Limpar cookies não essenciais
      clearNonEssentialCookies();
    } catch (error) {
      console.error('Erro ao resetar consent:', error);
    }
  }, []);

  /**
   * Aplicar preferências aos cookies existentes
   */
  const applyCookiePreferences = (consentData: CookieConsent) => {
    // Se analytics não foi aceito, limpar cookies de analytics
    if (!consentData.categories.analytics) {
      clearCookiesByCategory(['analytics_session', 'performance_metrics']);
    }

    // Se marketing não foi aceito, limpar cookies de marketing
    if (!consentData.categories.marketing) {
      clearCookiesByCategory(['marketing_preferences', 'ad_tracking']);
    }

    // Se functional não foi aceito, limpar cookies funcionais
    if (!consentData.categories.functional) {
      clearCookiesByCategory(['ui_preferences', 'language_preference', 'theme_preference']);
    }
  };

  /**
   * Limpar cookies por categoria
   */
  const clearCookiesByCategory = (cookieNames: string[]) => {
    cookieNames.forEach(name => {
      // Limpar do localStorage se existir
      try {
        localStorage.removeItem(name);
      } catch (error) {
        console.warn(`Erro ao limpar localStorage ${name}:`, error);
      }

      // Limpar cookies HTTP se existir
      try {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      } catch (error) {
        console.warn(`Erro ao limpar cookie ${name}:`, error);
      }
    });
  };

  /**
   * Limpar todos os cookies não essenciais
   */
  const clearNonEssentialCookies = () => {
    const nonEssentialCookies = [
      'ui_preferences', 'language_preference', 'theme_preference',
      'analytics_session', 'performance_metrics',
      'marketing_preferences', 'ad_tracking'
    ];
    
    clearCookiesByCategory(nonEssentialCookies);
  };

  /**
   * Verificar se uma categoria específica foi aceita
   */
  const isCategoryAccepted = useCallback((category: string): boolean => {
    if (!consent) return false;
    return consent.categories[category] === true;
  }, [consent]);

  /**
   * Verificar se o usuário já deu consent
   */
  const hasConsented = consent?.hasConsented === true;

  return {
    // Estado
    consent,
    showBanner: showBanner && !isLoading,
    isLoading,
    hasConsented,
    
    // Ações
    acceptAll,
    acceptEssential,
    rejectAll,
    saveConsent,
    resetConsent,
    
    // Verificações
    isCategoryAccepted,
    
    // Utilities
    applyCookiePreferences
  };
}