import { describe, it, expect } from 'vitest';
import { COOKIE_CATEGORIES, COOKIE_CONSENT_VERSION } from '@/types/cookies';

/**
 * Testes básicos de conformidade LGPD para tipos e constantes
 * Valida estrutura de dados e configurações críticas
 */
describe('LGPD Compliance - Cookie Types', () => {
  describe('Configuração de Categorias', () => {
    it('deve ter categoria essencial obrigatória', () => {
      const essential = COOKIE_CATEGORIES.find(cat => cat.id === 'essential');
      
      expect(essential).toBeDefined();
      expect(essential?.required).toBe(true);
      expect(essential?.name).toContain('Essenciais');
      expect(essential?.cookies).toContain('session_token');
      expect(essential?.cookies).toContain('user_id');
    });

    it('deve ter categorias opcionais bem definidas', () => {
      const optionalCategories = COOKIE_CATEGORIES.filter(cat => !cat.required);
      
      expect(optionalCategories.length).toBeGreaterThan(0);
      
      optionalCategories.forEach(category => {
        expect(category.id).toBeDefined();
        expect(category.name).toBeDefined();
        expect(category.description).toBeDefined();
        expect(category.cookies).toBeInstanceOf(Array);
        expect(category.cookies.length).toBeGreaterThan(0);
      });
    });

    it('deve ter IDs únicos para cada categoria', () => {
      const ids = COOKIE_CATEGORIES.map(cat => cat.id);
      const uniqueIds = [...new Set(ids)];
      
      expect(ids.length).toBe(uniqueIds.length);
    });

    it('deve incluir descrições adequadas para LGPD', () => {
      COOKIE_CATEGORIES.forEach(category => {
        expect(category.description.length).toBeGreaterThan(20);
        expect(category.name.length).toBeGreaterThan(5);
      });
    });
  });

  describe('Versioning de Política', () => {
    it('deve ter versão definida para controle de mudanças', () => {
      expect(COOKIE_CONSENT_VERSION).toBeDefined();
      expect(typeof COOKIE_CONSENT_VERSION).toBe('string');
      expect(COOKIE_CONSENT_VERSION.length).toBeGreaterThan(0);
    });

    it('deve seguir padrão de versionamento', () => {
      // Deve ser formato x.y ou x.y.z
      const versionPattern = /^\d+\.\d+(\.\d+)?$/;
      expect(COOKIE_CONSENT_VERSION).toMatch(versionPattern);
    });
  });

  describe('Estrutura de Cookies por Categoria', () => {
    it('categoria essencial deve incluir cookies de segurança', () => {
      const essential = COOKIE_CATEGORIES.find(cat => cat.id === 'essential');
      
      expect(essential?.cookies).toContain('session_token');
      expect(essential?.cookies).toContain('user_id');
    });

    it('categoria funcional deve ter cookies de UX', () => {
      const functional = COOKIE_CATEGORIES.find(cat => cat.id === 'functional');
      
      expect(functional).toBeDefined();
      expect(functional?.cookies).toContain('ui_preferences');
    });

    it('não deve ter cookies duplicados entre categorias', () => {
      const allCookies = COOKIE_CATEGORIES.flatMap(cat => cat.cookies);
      const uniqueCookies = [...new Set(allCookies)];
      
      expect(allCookies.length).toBe(uniqueCookies.length);
    });
  });
});

/**
 * Testes de validação de compliance LGPD
 */
describe('LGPD Compliance - Data Protection', () => {
  describe('Princípios LGPD', () => {
    it('deve respeitar princípio da minimização', () => {
      // Categorias essenciais devem ter apenas cookies necessários
      const essential = COOKIE_CATEGORIES.find(cat => cat.id === 'essential');
      
      // Máximo de 5 cookies essenciais (princípio da minimização)
      expect(essential?.cookies.length).toBeLessThanOrEqual(5);
    });

    it('deve ter finalidade específica para cada categoria', () => {
      COOKIE_CATEGORIES.forEach(category => {
        expect(category.description).toBeDefined();
        expect(category.description.length).toBeGreaterThan(30);
        
        // Deve explicar o propósito (verificando palavras-chave em português)
        const hasValidPurpose = 
          category.description.toLowerCase().includes('funcionamento') ||
          category.description.toLowerCase().includes('melhoram') ||
          category.description.toLowerCase().includes('entender') ||
          category.description.toLowerCase().includes('personalizar') ||
          category.description.toLowerCase().includes('usados') ||
          category.description.toLowerCase().includes('ajudam');
        
        expect(hasValidPurpose).toBe(true);
      });
    });

    it('deve permitir controle granular do titular', () => {
      const optionalCategories = COOKIE_CATEGORIES.filter(cat => !cat.required);
      
      // Deve haver pelo menos 2 categorias opcionais para controle granular
      expect(optionalCategories.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Transparência de Dados', () => {
    it('deve listar todos os cookies claramente', () => {
      COOKIE_CATEGORIES.forEach(category => {
        expect(category.cookies).toBeInstanceOf(Array);
        expect(category.cookies.length).toBeGreaterThan(0);
        
        category.cookies.forEach(cookie => {
          expect(typeof cookie).toBe('string');
          expect(cookie.length).toBeGreaterThan(2);
          // Deve seguir padrão snake_case ou camelCase
          expect(cookie).toMatch(/^[a-z][a-z0-9_]*$/);
        });
      });
    });

    it('deve explicar propósito de cada categoria', () => {
      const purposeKeywords = [
        'funcionamento', 'necessários', // Essenciais
        'funcionalidade', 'personalização', 'melhoram', // Funcionais
        'entender', 'análise', 'melhorias', // Analytics
        'marketing', 'anúncios', 'conteúdo' // Marketing
      ];

      COOKIE_CATEGORIES.forEach(category => {
        const hasValidPurpose = purposeKeywords.some(keyword => 
          category.description.toLowerCase().includes(keyword.toLowerCase())
        );
        expect(hasValidPurpose).toBe(true);
      });
    });
  });

  describe('Base Legal', () => {
    it('categoria essencial deve ter base legal de interesse legítimo', () => {
      const essential = COOKIE_CATEGORIES.find(cat => cat.id === 'essential');
      
      expect(essential?.required).toBe(true);
      expect(essential?.description.toLowerCase()).toContain('necessários');
    });

    it('categorias opcionais devem basear-se em consentimento', () => {
      const optionalCategories = COOKIE_CATEGORIES.filter(cat => !cat.required);
      
      optionalCategories.forEach(category => {
        expect(category.required).toBe(false);
      });
    });
  });
});

/**
 * Testes de segurança e integridade
 */
describe('Security & Data Integrity', () => {
  describe('Configuração Segura', () => {
    it('não deve expor informações sensíveis em cookies', () => {
      const allCookies = COOKIE_CATEGORIES.flatMap(cat => cat.cookies);
      
      // Cookies que NÃO devem existir (dados sensíveis)
      const forbiddenCookies = [
        'password', 'pwd', 'secret', 'token_raw', 'api_key',
        'private_key', 'client_secret', 'auth_token'
      ];
      
      forbiddenCookies.forEach(forbidden => {
        expect(allCookies).not.toContain(forbidden);
      });
    });

    it('deve usar nomes de cookies seguros', () => {
      const allCookies = COOKIE_CATEGORIES.flatMap(cat => cat.cookies);
      
      allCookies.forEach(cookie => {
        // Não deve conter caracteres especiais perigosos
        expect(cookie).not.toMatch(/[<>\"\'&]/);
        // Deve seguir convenção segura
        expect(cookie).toMatch(/^[a-z][a-z0-9_]*$/);
      });
    });
  });

  describe('Integridade dos Dados', () => {
    it('deve manter consistência na estrutura de categorias', () => {
      const requiredFields = ['id', 'name', 'description', 'required', 'cookies'];
      
      COOKIE_CATEGORIES.forEach(category => {
        requiredFields.forEach(field => {
          expect(category).toHaveProperty(field);
        });
      });
    });

    it('deve ter pelo menos uma categoria essencial', () => {
      const essentialCount = COOKIE_CATEGORIES.filter(cat => cat.required).length;
      expect(essentialCount).toBeGreaterThanOrEqual(1);
    });

    it('deve ter categorias opcionais para compliance LGPD', () => {
      const optionalCount = COOKIE_CATEGORIES.filter(cat => !cat.required).length;
      expect(optionalCount).toBeGreaterThanOrEqual(1);
    });
  });
});