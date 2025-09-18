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

  // CRÍTICO: Timeout enforcement - ML desabilita webhooks se > 500ms
  return new Promise<NextResponse>((resolve) => {
    let responded = false;
    
    const timeoutId = setTimeout(() => {
      if (!responded) {
        responded = true;
        logger.error({
          processingTime: Date.now() - startTime,
          timeoutLimit: WEBHOOK_TIMEOUT_MS
        }, '🚨 CRÍTICO: Webhook timeout forçado em 500ms');
        
        resolve(NextResponse.json(
          { received: true, timeout: true },
          { status: 200 }
        ));
      }
    }, WEBHOOK_TIMEOUT_MS - 50);

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
        logger.error({ error }, 'Webhook processing error');
        resolve(NextResponse.json(
          { received: true, error: true },
          { status: 200 }
        ));
      }
    });
  });
}

async function processWebhook(request: NextRequest, startTime: number): Promise<NextResponse> {
  logger.info('📡 Webhook ML recebido');

  // Validação de segurança
  const webhookValidation = validateMLWebhook(request);
  if (!webhookValidation.isValid) {
    return createWebhookErrorResponse(webhookValidation.error!, 403, {
      clientIP: webhookValidation.clientIP,
      processingTimeMs: Date.now() - startTime
    });
  }

  const clientIP = webhookValidation.clientIP;

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
    
    logger.info({
      topic: payload.topic,
      processingTimeMs: processingTime
    }, '✅ Webhook processado');

    return createWebhookSuccessResponse(payload.topic, processingTime);
  } catch (error) {
    logger.error({ error }, 'Erro no processamento');
    return NextResponse.json(
      { received: true, error: 'Processing error' },
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
    message: 'ML webhook endpoint',
    timeout_ms: WEBHOOK_TIMEOUT_MS
  });
}