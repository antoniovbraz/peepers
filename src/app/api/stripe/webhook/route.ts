/**
 * Stripe Webhooks Handler - Peepers Enterprise v2.0.0
 *
 * Processa webhooks do Stripe para eventos de cobrança
 * Atualiza entitlements em tempo real
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripeClient } from '@/lib/stripe';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      logger.warn('Stripe webhook received without signature');
      return NextResponse.json(
        { error: 'Missing Stripe signature' },
        { status: 400 }
      );
    }

    // Processar webhook
    await stripeClient.processWebhook(rawBody, signature);

    // Responder imediatamente (conforme spec Stripe)
    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error) {
    logger.error({ error }, 'Failed to process Stripe webhook');

    // Retornar erro para Stripe tentar novamente
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Webhooks do Stripe não precisam de autenticação
export async function GET() {
  return NextResponse.json(
    { message: 'Stripe webhook endpoint' },
    { status: 200 }
  );
}