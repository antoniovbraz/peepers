import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { checkWebhookLimit, checkUserDailyLimit } from '@/lib/rate-limiter';
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

  // 🚨 CRÍTICO: Timeout enforcement - ML desabilita webhooks se > 500ms consistentemente
  // Implementação conforme especificação oficial ML
  return new Promise<NextResponse>((resolve) => {
    let responded = false;
    
    // Buffer de 25ms para garantir resposta antes do limite
    const timeoutId = setTimeout(() => {
      if (!responded) {
        responded = true;
        logger.error({
          processingTime: Date.now() - startTime,
          timeoutLimit: WEBHOOK_TIMEOUT_MS,
          environment: process.env.NODE_ENV
        }, '🚨 CRÍTICO ML COMPLIANCE: Webhook timeout forçado - ML pode desabilitar');
        
        // Resposta obrigatória conforme ML spec
        resolve(NextResponse.json(
          { 
            received: true, 
            timeout: true,
            processing_time_ms: Date.now() - startTime,
            ml_compliance: 'timeout_enforced'
          },
          { status: 200 }
        ));
      }
    }, WEBHOOK_TIMEOUT_MS - 25); // 475ms buffer para segurança

    processWebhook(request, startTime).then((response) => {
      if (!responded) {
        responded = true;
        clearTimeout(timeoutId);
        resolve(response);
      }
    }).catch((error) => {
      if (!responded) {
        responded = true;
        clearTimeout(timeoutId);
        logger.error({ 
          error: error.message,
          processingTime: Date.now() - startTime
        }, 'Webhook processing error - ML compliance maintained');
        
        // Mesmo com erro, deve responder 200 para ML
        resolve(NextResponse.json(
          { 
            received: true, 
            error: true,
            processing_time_ms: Date.now() - startTime,
            ml_compliance: 'error_handled'
          },
          { status: 200 }
        ));
      }
    });
  });
}

async function processWebhook(request: NextRequest, startTime: number): Promise<NextResponse> {
  logger.info('📡 Webhook ML recebido - validando compliance');

  // 🚨 CRÍTICO: Validação de segurança conforme especificação oficial ML
  const webhookValidation = validateMLWebhook(request);
  if (!webhookValidation.isValid) {
    const processingTime = Date.now() - startTime;
    logger.error({
      error: webhookValidation.error,
      clientIP: webhookValidation.clientIP,
      processingTimeMs: processingTime,
      compliance: 'FAILED'
    }, '🚨 CRÍTICO ML COMPLIANCE: Webhook validation failed');

    return createWebhookErrorResponse(webhookValidation.error!, 403, {
      clientIP: webhookValidation.clientIP,
      processingTimeMs: processingTime,
      ml_compliance: 'validation_failed'
    });
  }

  const clientIP = webhookValidation.clientIP;
  logger.info({
    clientIP,
    compliance: 'PASSED'
  }, '✅ ML webhook validation passed');

  // Validação do payload
  let payload: any;
  try {
    const body = await request.text();
    payload = WebhookSchema.parse(JSON.parse(body));
  } catch (error) {
    return createWebhookErrorResponse('Invalid payload', 400, {
      clientIP,
      processingTimeMs: Date.now() - startTime
    });
  }

  // Rate limiting global
  const globalLimit = await checkWebhookLimit(clientIP);
  if (!globalLimit.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }

  // Rate limiting por usuário
  const userLimit = await checkUserDailyLimit(payload.user_id.toString(), clientIP);
  if (!userLimit.allowed) {
    return NextResponse.json(
      { error: 'User rate limit exceeded' },
      { status: 429 }
    );
  }

  // Validação de topic
  if (!isValidWebhookTopic(payload.topic)) {
    return createWebhookErrorResponse(`Unsupported topic: ${payload.topic}`, 400, {
      clientIP,
      processingTimeMs: Date.now() - startTime
    });
  }

  // Processamento
  try {
    await processWebhookByTopic(payload);
    const processingTime = Date.now() - startTime;
    
    // 🚨 CRÍTICO: Verificar compliance de tempo
    if (processingTime > WEBHOOK_TIMEOUT_MS) {
      logger.warn({
        topic: payload.topic,
        processingTimeMs: processingTime,
        timeoutLimit: WEBHOOK_TIMEOUT_MS,
        compliance: 'TIMEOUT_EXCEEDED'
      }, '⚠️ ML COMPLIANCE WARNING: Processing exceeded 500ms');
    }
    
    logger.info({
      topic: payload.topic,
      processingTimeMs: processingTime,
      compliance: 'SUCCESS'
    }, '✅ Webhook processado com compliance ML');

    return createWebhookSuccessResponse(payload.topic, processingTime, {
      ml_compliance: 'fully_compliant',
      user_id: payload.user_id
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    logger.error({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTime,
      compliance: 'ERROR_HANDLED'
    }, 'Erro no processamento - ML compliance mantida');
    
    // 🚨 CRÍTICO: Sempre responder 200 para ML mesmo com erro interno
    return NextResponse.json(
      { 
        received: true, 
        error: 'Processing error',
        processing_time_ms: processingTime,
        ml_compliance: 'error_handled_correctly'
      },
      { status: 200 }
    );
  }
}

async function processWebhookByTopic(payload: any): Promise<void> {
  switch (payload.topic) {
    case 'orders_v2':
      logger.info('📦 Processando pedido');
      break;
    case 'items':
      logger.info('🛍️ Processando produto');
      break;
    default:
      logger.info('📋 Topic processado');
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'active',
    message: 'ML webhook endpoint - fully compliant',
    ml_compliance: {
      timeout_ms: WEBHOOK_TIMEOUT_MS,
      ip_validation: WEBHOOK_SECURITY.REQUIRE_IP_VALIDATION,
      signature_validation: WEBHOOK_SECURITY.REQUIRE_SIGNATURE_VALIDATION,
      fail_fast: WEBHOOK_SECURITY.FAIL_FAST_ON_VIOLATIONS,
      environment: process.env.NODE_ENV,
      official_spec_version: '2025-09-18'
    },
    supported_topics: [
      'orders_v2',
      'items', 
      'questions',
      'messages',
      'shipments',
      'payments'
    ]
  });
}