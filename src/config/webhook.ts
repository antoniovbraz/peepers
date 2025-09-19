/**
 * CONFIGURAÇÃO DE WEBHOOK - MERCADO LIVRE
 *
 * Configurações críticas para conformidade com especificação oficial do ML.
 * Última atualização: 2025-09-18
 * Status: ✅ CRÍTICO - Implementar validação obrigatória
 */

import { logger } from '@/lib/logger';
import { logSecurityEvent, SecurityEventType } from '@/lib/security-events';

// ==================== IPs OFICIAIS MERCADO LIVRE ====================
/**
 * 🚨 CRÍTICO: IPs oficiais do Mercado Livre - OBRIGATÓRIO validar
 * 
 * Conforme especificação oficial ML v2.0:
 * - DEVE rejeitar requests de IPs não listados em produção
 * - Apenas para teste local: aceitar 127.0.0.1, ::1
 * 
 * Referência: https://developers.mercadolivre.com.br/pt_br/produto-receba-notificacoes
 */
export const ML_WEBHOOK_IPS = [
  '54.88.218.97',
  '18.215.140.160', 
  '18.213.114.129',
  '18.206.34.84'
] as const;

// IPs para desenvolvimento local
export const DEV_ALLOWED_IPS = [
  '127.0.0.1',
  '::1',
  'localhost'
] as const;

// ==================== TIMEOUT CONFIGURAÇÃO ====================
export const WEBHOOK_TIMEOUT_MS = 500;

// ==================== RATE LIMITING ====================
/**
 * Rate limiting para webhooks
 * ML permite até 1000 calls/hora por app + 5000 calls/dia por usuário
 */
export const WEBHOOK_RATE_LIMITS = {
  PER_HOUR_APP: 1000,
  PER_DAY_USER: 5000,
  WINDOW_MS: 60 * 60 * 1000, // 1 hora
  DAILY_WINDOW_MS: 24 * 60 * 60 * 1000 // 24 horas
} as const;

// ==================== TOPICS SUPORTADOS ====================
/**
 * Topics de webhook suportados pelo Mercado Livre
 */
export const SUPPORTED_WEBHOOK_TOPICS = [
  'orders_v2',
  'items',
  'questions',
  'messages',
  'shipments',
  'payments'
] as const;

// ==================== VALIDAÇÃO DE IP ====================
/**
 * 🚨 CRÍTICO: Valida se um IP está na whitelist oficial do ML
 * DEVE ser usado obrigatoriamente em produção
 */
export function isValidMLWebhookIP(ip: string): boolean {
  // Produção: apenas IPs oficiais ML
  if (process.env.NODE_ENV === 'production') {
    const isValid = ML_WEBHOOK_IPS.includes(ip as any);
    
    if (!isValid) {
      // Log crítico de segurança para IP inválido
      logSecurityEvent({
        type: SecurityEventType.SUSPICIOUS_ACTIVITY,
        severity: 'CRITICAL',
        clientIP: ip,
        details: {
          violation: 'INVALID_WEBHOOK_IP',
          allowedIPs: ML_WEBHOOK_IPS,
          attemptedIP: ip,
          environment: 'production'
        },
        path: '/api/webhook/mercado-livre'
      });
    }
    
    return isValid;
  }
  
  // Desenvolvimento: ML IPs + localhost
  return ML_WEBHOOK_IPS.includes(ip as any) || DEV_ALLOWED_IPS.includes(ip as any);
}

/**
 * Extrai IP real do request (considerando proxies)
 */
export function extractRealIP(request: Request): string {
  // Headers comuns para IP real atrás de proxy
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');

  // Prioridade: CF > X-Real-IP > primeiro IP do X-Forwarded-For
  if (cfConnectingIP) return cfConnectingIP;
  if (realIP) return realIP;
  if (forwardedFor) {
    // X-Forwarded-For pode conter múltiplos IPs separados por vírgula
    return forwardedFor.split(',')[0].trim();
  }

  return 'unknown';
}

/**
 * Valida assinatura HMAC do webhook do Mercado Livre
 * CRÍTICO: Deve ser implementado conforme documentação oficial do ML
 */
export async function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBytes = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payload)
    );

    const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    return signature === expectedSignature;
  } catch (error) {
    logger.error({ error }, 'Failed to validate webhook signature');
    return false;
  }
}

// ==================== VALIDAÇÃO ====================
/**
 * Valida se um topic é suportado
 */
export function isValidWebhookTopic(topic: string): boolean {
  return SUPPORTED_WEBHOOK_TOPICS.includes(topic as any);
}

// ==================== CONFIGURAÇÃO DE SEGURANÇA ====================
export const WEBHOOK_SECURITY = {
  // 🚨 CRÍTICO: Validação obrigatória de IP conforme spec oficial ML
  // SEMPRE ativa em produção - ML exige IP whitelist obrigatório
  REQUIRE_IP_VALIDATION: process.env.NODE_ENV === 'production' ? true : 
    (process.env.FORCE_IP_VALIDATION === 'true'), // Forçar em dev se necessário

  // Validação de assinatura (opcional mas recomendado para v2.0)
  REQUIRE_SIGNATURE_VALIDATION: process.env.ML_WEBHOOK_SECRET ? true : false,

  // Log detalhado para debugging
  ENABLE_DETAILED_LOGGING: process.env.NODE_ENV === 'development',

  // 🚨 CRÍTICO: Timeout enforcement obrigatório - ML desabilita se > 500ms
  ENFORCE_TIMEOUT: true,

  // 🚨 CRÍTICO: Fail fast em produção para compliance
  FAIL_FAST_ON_VIOLATIONS: process.env.NODE_ENV === 'production'
} as const;

export default {
  ML_WEBHOOK_IPS,
  WEBHOOK_TIMEOUT_MS,
  WEBHOOK_RATE_LIMITS,
  SUPPORTED_WEBHOOK_TOPICS,
  WEBHOOK_SECURITY,
  isValidMLWebhookIP,
  extractRealIP,
  isValidWebhookTopic
};