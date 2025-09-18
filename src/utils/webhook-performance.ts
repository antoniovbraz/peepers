/**
 * UTILITÁRIOS DE PERFORMANCE PARA WEBHOOKS
 *
 * Monitora e alerta sobre performance crítica de webhooks do ML.
 * CRÍTICO: ML desabilita webhooks se > 500ms consistentemente
 */

import { logger } from '@/lib/logger';
import { WEBHOOK_TIMEOUT_MS } from '@/config/webhook';

export interface WebhookPerformanceMetrics {
  startTime: number;
  processingTime: number;
  topic: string;
  clientIP: string;
  isWithinTimeout: boolean;
  warningThreshold: number; // 80% do timeout
}

/**
 * Inicia medição de performance do webhook
 */
export function startWebhookPerformance(): number {
  return Date.now();
}

/**
 * Finaliza medição e valida performance crítica
 */
export function validateWebhookPerformance(
  startTime: number,
  topic: string,
  clientIP: string
): WebhookPerformanceMetrics {
  const processingTime = Date.now() - startTime;
  const isWithinTimeout = processingTime <= WEBHOOK_TIMEOUT_MS;
  const warningThreshold = WEBHOOK_TIMEOUT_MS * 0.8; // 80% do timeout

  const metrics: WebhookPerformanceMetrics = {
    startTime,
    processingTime,
    topic,
    clientIP,
    isWithinTimeout,
    warningThreshold
  };

  // ==================== ALERTAS DE PERFORMANCE ====================
  if (!isWithinTimeout) {
    logger.error({
      processingTime,
      timeoutLimit: WEBHOOK_TIMEOUT_MS,
      exceededBy: processingTime - WEBHOOK_TIMEOUT_MS,
      topic,
      clientIP
    }, '🚨 CRÍTICO: Webhook excedeu timeout de 500ms - ML pode desabilitar webhooks');

    // TODO: Implementar alerta para equipe (Slack, email, etc.)
    // triggerCriticalAlert('WEBHOOK_TIMEOUT_EXCEEDED', metrics);

  } else if (processingTime >= warningThreshold) {
    logger.warn({
      processingTime,
      timeoutLimit: WEBHOOK_TIMEOUT_MS,
      warningThreshold,
      topic,
      clientIP
    }, '⚠️ Webhook próximo do limite de timeout (80%+)');
  } else {
    logger.info({
      processingTime,
      topic,
      clientIP
    }, '✅ Webhook processado dentro dos limites de performance');
  }

  return metrics;
}

/**
 * Wrapper para operações críticas com timeout
 */
export async function withTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number,
  operationName: string
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      logger.error({
        timeoutMs,
        operationName
      }, `🚨 Timeout excedido na operação: ${operationName}`);
      reject(new Error(`Operation ${operationName} timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    operation()
      .then((result) => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

/**
 * Valida se uma operação pode ser executada sem exceder o timeout
 */
export function canExecuteWithinTimeout(
  currentProcessingTime: number,
  estimatedOperationTime: number,
  bufferMs: number = 50
): boolean {
  const remainingTime = WEBHOOK_TIMEOUT_MS - currentProcessingTime - bufferMs;
  return remainingTime >= estimatedOperationTime;
}

/**
 * Log estruturado de performance para análise
 */
export function logWebhookPerformance(metrics: WebhookPerformanceMetrics): void {
  const logData = {
    timestamp: new Date().toISOString(),
    processingTime: metrics.processingTime,
    timeoutLimit: WEBHOOK_TIMEOUT_MS,
    utilizationPercent: (metrics.processingTime / WEBHOOK_TIMEOUT_MS) * 100,
    isWithinTimeout: metrics.isWithinTimeout,
    topic: metrics.topic,
    clientIP: metrics.clientIP,
    warningTriggered: metrics.processingTime >= metrics.warningThreshold
  };

  if (!metrics.isWithinTimeout) {
    logger.error(logData, 'WEBHOOK_PERFORMANCE_CRITICAL');
  } else if (metrics.processingTime >= metrics.warningThreshold) {
    logger.warn(logData, 'WEBHOOK_PERFORMANCE_WARNING');
  } else {
    logger.info(logData, 'WEBHOOK_PERFORMANCE_OK');
  }
}