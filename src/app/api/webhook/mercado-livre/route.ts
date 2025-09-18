import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { checkWebhookLimit } from '@/lib/rate-limiter';
import {
  validateMLWebhook,
  createWebhookErrorResponse,
  createWebhookSuccessResponse
} from '@/middleware/webhook-validation';
import { isValidWebhookTopic, WEBHOOK_TIMEOUT_MS, WEBHOOK_SECURITY } from '@/config/webhook';

const WebhookSchema = z.object({
  user_id: z.number(),
  topic: z.string(),
  resource: z.string(),
  application_id: z.string(),
  attempts: z.number(),
  sent: z.string(),
  received: z.string(),
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    logger.info('📡 Webhook ML recebido');

    // ==================== CRÍTICO: VALIDAÇÃO DE SEGURANÇA ====================
    const webhookValidation = validateMLWebhook(request);

    if (!webhookValidation.isValid) {
      return createWebhookErrorResponse(webhookValidation.error!, 403, {
        clientIP: webhookValidation.clientIP,
        processingTimeMs: Date.now() - startTime
      });
    }

    if (webhookValidation.warning) {
      logger.warn({ warning: webhookValidation.warning, clientIP: webhookValidation.clientIP });
    }

    const clientIP = webhookValidation.clientIP;
    logger.info({ clientIP }, '✅ Validação de segurança do webhook passou');
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    const rateLimit = await checkWebhookLimit(clientIP, userAgent);

    if (!rateLimit.allowed) {
      logger.warn({ 
        clientIP, 
        userAgent,
        remaining: rateLimit.remaining,
        resetTime: rateLimit.resetTime 
      }, 'Rate limit exceeded for webhook');
      
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'Retry-After': rateLimit.retryAfter?.toString() || '60',
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.resetTime.toString(),
          }
        }
      );
    }

    // Autenticação: verificar header secreto
    const webhookSecret = request.headers.get('x-ml-webhook-secret');
    const expectedSecret = process.env.ML_WEBHOOK_SECRET;

    if (expectedSecret && webhookSecret !== expectedSecret) {
      logger.warn('Webhook authentication failed: invalid secret');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      logger.warn('Webhook received invalid JSON');
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    // Validar schema do payload
    const schemaValidation = WebhookSchema.safeParse(body);
    if (!schemaValidation.success) {
      logger.warn({ errors: schemaValidation.error.issues }, 'Webhook payload validation failed');
      return NextResponse.json({ error: 'Invalid payload schema' }, { status: 400 });
    }

    const payload = schemaValidation.data;

    // ==================== CRÍTICO: VALIDAÇÃO DE TOPIC ====================
    if (!isValidWebhookTopic(payload.topic)) {
      logger.warn({ topic: payload.topic }, '⚠️ Webhook com topic não suportado');
      // Mesmo com topic inválido, retornar 200 para não causar retry infinito
    }

    logger.info({
      topic: payload.topic,
      resource: payload.resource,
      user_id: payload.user_id,
      application_id: payload.application_id,
      processingTimeMs: Date.now() - startTime
    }, '✅ Webhook payload validado');

    // Processar diferentes tipos de notificação
    switch (payload.topic) {
      case 'orders_v2':
        logger.info('Processing order notification');
        // TODO: implementar processamento de pedidos
        break;
      case 'items':
        logger.info('Processing item notification');
        // TODO: implementar processamento de itens
        break;
      case 'questions':
        logger.info('Processing question notification');
        // TODO: implementar processamento de perguntas
        break;
      case 'messages':
        logger.info('Processing message notification');
        // TODO: implementar processamento de mensagens
        break;
      case 'shipments':
        logger.info('Processing shipment notification');
        // TODO: implementar processamento de envios
        break;
      default:
        logger.warn({ topic: payload.topic }, 'Unknown webhook topic');
    }

    // ==================== CRÍTICO: TIMEOUT ENFORCEMENT ====================
    const processingTime = Date.now() - startTime;

    if (WEBHOOK_SECURITY.ENFORCE_TIMEOUT && processingTime > WEBHOOK_TIMEOUT_MS) {
      logger.error({
        processingTime,
        timeoutLimit: WEBHOOK_TIMEOUT_MS,
        topic: payload.topic
      }, '🚨 CRÍTICO: Webhook excedeu timeout de 500ms - ML pode desabilitar webhooks');

      // Mesmo assim retornar 200 para evitar retry, mas logar o problema
      return createWebhookSuccessResponse(payload.topic, processingTime, {
        warning: 'Processing exceeded 500ms timeout'
      });
    }

    logger.info({
      processingTime,
      topic: payload.topic
    }, '✅ Webhook processado com sucesso dentro do timeout');

    return createWebhookSuccessResponse(payload.topic, processingTime);

  } catch (error) {
    const processingTime = Date.now() - startTime;

    logger.error({
      error,
      processingTime
    }, '❌ Erro no processamento do webhook');

    // Mesmo em erro, verificar timeout
    if (WEBHOOK_SECURITY.ENFORCE_TIMEOUT && processingTime > WEBHOOK_TIMEOUT_MS) {
      logger.error({
        processingTime,
        timeoutLimit: WEBHOOK_TIMEOUT_MS
      }, '🚨 CRÍTICO: Erro de webhook excedeu timeout de 500ms');
    }

    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to process webhook',
      processing_time_ms: processingTime
    }, { status: 500 });
  }
}

// Webhook só aceita POST
export async function GET() {
  return NextResponse.json({
    message: 'Webhook endpoint - use POST only',
    endpoint: '/api/webhook/mercado-livre'
  });
}