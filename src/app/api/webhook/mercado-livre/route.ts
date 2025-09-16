import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/utils';

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
  try {
    logger.info('📡 Webhook ML recebido');

    // Rate limiting: 1000 requests per 15 minutes per IP
    const clientIP = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';
    const rateLimit = await checkRateLimit(`webhook:${clientIP}`, 1000, 15 * 60 * 1000);

    if (!rateLimit.allowed) {
      logger.warn({ clientIP, remaining: rateLimit.remaining }, 'Rate limit exceeded for webhook');
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
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
    const validation = WebhookSchema.safeParse(body);
    if (!validation.success) {
      logger.warn({ errors: validation.error.issues }, 'Webhook payload validation failed');
      return NextResponse.json({ error: 'Invalid payload schema' }, { status: 400 });
    }

    const payload = validation.data;
    logger.info({
      topic: payload.topic,
      resource: payload.resource,
      user_id: payload.user_id,
      application_id: payload.application_id
    }, 'Webhook payload validated');

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

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      received_at: new Date().toISOString(),
      topic: payload.topic
    });

  } catch (error) {
    logger.error({ error }, 'Webhook processing error');
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to process webhook'
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