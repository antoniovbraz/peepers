/**
 * Webhook Security Validator
 * 
 * Validação de assinaturas para webhooks do Stripe e Mercado Livre
 * Implementa verificação criptográfica de integridade das mensagens
 */

import crypto from 'crypto';
import { logger } from '@/lib/logger';

export class WebhookSecurityValidator {
  
  /**
   * Valida assinatura do webhook do Stripe
   */
  validateStripeSignature(body: string, signature: string): boolean {
    try {
      const secret = process.env.STRIPE_WEBHOOK_SECRET;
      
      if (!secret) {
        logger.warn('STRIPE_WEBHOOK_SECRET not configured');
        // Durante desenvolvimento, permitir sem validação
        return process.env.NODE_ENV === 'development';
      }

      // Parse da assinatura do Stripe (formato: t=timestamp,v1=signature)
      const elements = signature.split(',');
      const signatureElements = elements.reduce((acc: Record<string, string>, element) => {
        const [key, value] = element.split('=');
        acc[key] = value;
        return acc;
      }, {});

      const timestamp = signatureElements.t;
      const expectedSignature = signatureElements.v1;

      if (!timestamp || !expectedSignature) {
        logger.warn('Invalid Stripe signature format');
        return false;
      }

      // Verificar timestamp (tolerância de 5 minutos)
      const timestampMs = parseInt(timestamp) * 1000;
      const now = Date.now();
      const tolerance = 5 * 60 * 1000; // 5 minutos

      if (Math.abs(now - timestampMs) > tolerance) {
        logger.warn({ timestamp, now }, 'Stripe webhook timestamp too old');
        return false;
      }

      // Calcular signature esperada
      const payload = timestamp + '.' + body;
      const computedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload, 'utf8')
        .digest('hex');

      // Comparação segura
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(computedSignature, 'hex')
      );

    } catch (error) {
      logger.error({ error }, 'Error validating Stripe signature');
      return false;
    }
  }

  /**
   * Valida assinatura do webhook do Mercado Livre
   */
  validateMLSignature(body: string, signature: string): boolean {
    try {
      const secret = process.env.ML_WEBHOOK_SECRET;
      
      if (!secret) {
        logger.warn('ML_WEBHOOK_SECRET not configured');
        // Durante desenvolvimento, permitir sem validação
        return process.env.NODE_ENV === 'development';
      }

      // ML usa HMAC-SHA1
      const computedSignature = crypto
        .createHmac('sha1', secret)
        .update(body, 'utf8')
        .digest('hex');

      const expectedSignature = signature.replace('sha1=', '');

      // Comparação segura
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(computedSignature, 'hex')
      );

    } catch (error) {
      logger.error({ error }, 'Error validating ML signature');
      return false;
    }
  }

  /**
   * Valida origem do request por IP (usado para ML)
   */
  validateOriginIP(clientIP: string, allowedIPs: string[]): boolean {
    try {
      // Normalizar IP (remover prefixos IPv6 para IPv4)
      const normalizedIP = clientIP.replace(/^::ffff:/, '');
      
      return allowedIPs.includes(normalizedIP);

    } catch (error) {
      logger.error({ error, clientIP }, 'Error validating origin IP');
      return false;
    }
  }
}

export const webhookSecurityValidator = new WebhookSecurityValidator();