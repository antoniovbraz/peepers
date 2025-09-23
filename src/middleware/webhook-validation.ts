/**
 * MIDDLEWARE DE VALIDAÇÃO DE WEBHOOK - MERCADO LIVRE
 *
 * Middleware específico para validação crítica de webhooks do ML.
 * Implementa IP whitelist e timeout enforcement obrigatórios.
 *
 * CRÍTICO: Conforme especificação oficial do ML
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import {
  isValidMLWebhookIP,
  extractRealIP,
  WEBHOOK_TIMEOUT_MS,
  WEBHOOK_SECURITY,
  ML_WEBHOOK_IPS
} from '@/config/webhook';
import {
  startWebhookPerformance,
  validateWebhookPerformance,
  logWebhookPerformance
} from '@/utils/webhook-performance';

export interface WebhookValidationResult {
  isValid: boolean;
  clientIP: string;
  error?: string;
  warning?: string;
  performanceMetrics?: unknown;
}

/**
 * Valida webhook do Mercado Livre com monitoramento de performance
 * CRÍTICO: Deve ser chamado no início de todo handler de webhook
 */
export function validateMLWebhook(request: NextRequest): WebhookValidationResult {
  const performanceStart = startWebhookPerformance();
  const clientIP = extractRealIP(request);

  // ==================== VALIDAÇÃO DE IP WHITELIST ====================
  // 🚨 CRÍTICO: Conforme especificação oficial ML - IPs obrigatórios em produção
  if (WEBHOOK_SECURITY.REQUIRE_IP_VALIDATION && !isValidMLWebhookIP(clientIP)) {
    const error = `IP ${clientIP} not in ML official whitelist`;
    logger.error({
      clientIP,
      allowedIPs: ML_WEBHOOK_IPS,
      userAgent: request.headers.get('user-agent'),
      headers: {
        'x-forwarded-for': request.headers.get('x-forwarded-for'),
        'x-real-ip': request.headers.get('x-real-ip'),
        'cf-connecting-ip': request.headers.get('cf-connecting-ip')
      },
      environment: process.env.NODE_ENV,
      processingTimeMs: Date.now() - performanceStart
    }, `🚨 CRÍTICO ML COMPLIANCE: ${error}`);

    // Em produção, fail fast conforme compliance
    if (WEBHOOK_SECURITY.FAIL_FAST_ON_VIOLATIONS) {
      return {
        isValid: false,
        clientIP,
        error: 'Unauthorized IP - ML compliance violation'
      };
    }

    return {
      isValid: false,
      clientIP,
      error
    };
  }

  // ==================== VERIFICAÇÃO DE TIMEOUT ====================
  const currentTime = Date.now();
  const processingTime = currentTime - performanceStart;

  if (WEBHOOK_SECURITY.ENFORCE_TIMEOUT && processingTime > WEBHOOK_TIMEOUT_MS) {
    const warning = `Processing exceeded ${WEBHOOK_TIMEOUT_MS}ms timeout`;
    logger.warn({
      processingTime,
      timeoutLimit: WEBHOOK_TIMEOUT_MS,
      clientIP
    }, `⚠️ ${warning}`);

    return {
      isValid: true,
      clientIP,
      warning
    };
  }

  logger.info({
    clientIP,
    processingTimeMs: Date.now() - performanceStart
  }, '✅ Webhook validation passed');

  return {
    isValid: true,
    clientIP
  };
}

/**
 * Wrapper completo para processamento de webhook com performance monitoring
 */
export async function processWebhookWithPerformance<T>(
  request: NextRequest,
  topic: string,
  processor: () => Promise<T>
): Promise<{ result: T; performanceMetrics: any }> {
  const performanceStart = startWebhookPerformance();
  const clientIP = extractRealIP(request);

  try {
    // Executar processamento
    const result = await processor();

    // Validar performance
    const metrics = validateWebhookPerformance(performanceStart, topic, clientIP);
    logWebhookPerformance(metrics);

    return { result, performanceMetrics: metrics };
  } catch (error) {
    // Mesmo em erro, logar performance
    const metrics = validateWebhookPerformance(performanceStart, topic, clientIP);
    logWebhookPerformance(metrics);

    throw error;
  }
}

/**
 * Cria resposta de erro padronizada para webhooks
 */
export function createWebhookErrorResponse(
  error: string,
  status: number = 403,
  details?: unknown
): NextResponse {
  logger.error({ error, details }, 'Webhook error response');

  return NextResponse.json(
    Object.assign({
      error,
      message: 'Webhook validation failed',
      timestamp: new Date().toISOString(),
    }, details as Record<string, unknown> || {}),
    { status }
  );
}

/**
 * Cria resposta de sucesso padronizada para webhooks
 */
export function createWebhookSuccessResponse(
  topic: string,
  processingTimeMs: number,
  additionalData?: unknown,
  timeoutId?: NodeJS.Timeout
): NextResponse {
  // Limpar timeout se fornecido
  if (timeoutId) {
    clearTimeout(timeoutId);
  }

  const response = Object.assign({
    success: true,
    message: 'Webhook processed successfully',
    received: true,
    received_at: new Date().toISOString(),
    topic,
    processing_time_ms: processingTimeMs
  }, additionalData as Record<string, unknown> || {});

  // Log warning se excedeu timeout
  if (WEBHOOK_SECURITY.ENFORCE_TIMEOUT && processingTimeMs > WEBHOOK_TIMEOUT_MS) {
    logger.warn({
      processingTimeMs,
      timeoutLimit: WEBHOOK_TIMEOUT_MS,
      topic
    }, '🚨 Webhook processing exceeded timeout limit');
  } else {
    logger.info({
      processingTimeMs,
      topic
    }, '✅ Webhook processed within timeout limits');
  }

  return NextResponse.json(response);
}

/**
 * Wrapper para handlers de webhook com validação automática
 */
export function withWebhookValidation(
  handler: (request: NextRequest, validation: WebhookValidationResult) => Promise<NextResponse>
) {
  return async function(request: NextRequest): Promise<NextResponse> {
    const validation = validateMLWebhook(request);

    if (!validation.isValid) {
      return createWebhookErrorResponse(validation.error!, 403, { clientIP: validation.clientIP });
    }

    // Passar resultado da validação para o handler
    return handler(request, validation);
  };
}