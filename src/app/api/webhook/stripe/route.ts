/**
 * Stripe Webhook Handler - Processamento de eventos de billing
 * 
 * CRITICAL: Este endpoint deve processar webhooks do Stripe de forma rápida e confiável
 * Eventos principais: subscription changes, payment success/failure, customer events
 * 
 * Arquivo: /app/api/webhook/stripe/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripeClient } from '@/lib/stripe';
import { logger } from '@/lib/logger';
import { WebhookSecurityValidator } from '@/middleware/webhook-security';

const WEBHOOK_TIMEOUT_MS = 10000; // 10s para webhooks do Stripe (mais flexível que ML)

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // 1. Implementar timeout para o webhook
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Webhook timeout exceeded'));
      }, WEBHOOK_TIMEOUT_MS);
    });

    // 2. Processar webhook com timeout
    const result = await Promise.race([
      processStripeWebhook(request),
      timeoutPromise
    ]);

    const duration = Date.now() - startTime;
    logger.info({ duration }, 'Stripe webhook processed successfully');

    return result;

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error({ 
      error: error instanceof Error ? error.message : String(error),
      duration 
    }, 'Stripe webhook processing failed');

    // Sempre retornar 200 para webhooks do Stripe para evitar retries desnecessários
    return NextResponse.json({ error: 'Internal error' }, { status: 200 });
  }
}

async function processStripeWebhook(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Extrair body e signature
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      logger.warn('Missing Stripe signature header');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // 2. Validar webhook signature
    const validator = new WebhookSecurityValidator();
    if (!validator.validateStripeSignature(body, signature)) {
      logger.warn({ signature }, 'Invalid Stripe webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // 3. Processar evento via Stripe client
    await stripeClient.processWebhook(body, signature);

    logger.info('Stripe webhook processed successfully');
    return NextResponse.json({ received: true });

  } catch (error) {
    logger.error({ error }, 'Failed to process Stripe webhook');
    throw error;
  }
}

// Metadata da API
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';