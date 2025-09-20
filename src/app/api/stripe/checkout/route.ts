/**
 * Stripe Checkout API - Criação de sessões de pagamento
 * 
 * Endpoint para criar sessões do Stripe Checkout para subscriptions
 * Suporta upgrade, downgrade e nova subscription
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripeClient } from '@/lib/stripe';
import { logger } from '@/lib/logger';
import { getKVClient } from '@/lib/cache';
import { PeepersPlanType } from '@/types/stripe';
import { PEEPERS_PLANS } from '@/config/entitlements';

// Map dos price IDs do Stripe (devem estar nas variáveis de ambiente)
const STRIPE_PRICE_IDS: Record<PeepersPlanType, string> = {
  starter: process.env.STRIPE_PRICE_STARTER_MONTHLY || 'price_starter_dev',
  business: process.env.STRIPE_PRICE_BUSINESS_MONTHLY || 'price_business_dev',
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || 'price_enterprise_dev'
};

export async function POST(request: NextRequest) {
  try {
    // 1. Verificar autenticação
    const userId = request.cookies.get('user_id')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse do body
    const body = await request.json();
    const { plan_type, success_url, cancel_url } = body;

    if (!plan_type || !PEEPERS_PLANS[plan_type as PeepersPlanType]) {
      return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 });
    }

    if (!success_url || !cancel_url) {
      return NextResponse.json({ 
        error: 'success_url and cancel_url are required' 
      }, { status: 400 });
    }

    // 3. Buscar dados do usuário
    const cache = getKVClient();
    const userData = await cache.get(`user:${userId}`);
    
    if (!userData) {
      return NextResponse.json({ error: 'User data not found' }, { status: 404 });
    }

    const user = JSON.parse(userData as string);
    const userEmail = user.email;

    if (!userEmail) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 });
    }

    // 4. Buscar ou criar customer no Stripe
    const customer = await stripeClient.getOrCreateCustomer(
      userEmail,
      user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : undefined,
      {
        tenant_id: userId,
        ml_user_id: user.id?.toString() || userId
      }
    );

    // 5. Verificar subscription existente
    const existingSubscription = await stripeClient.getActiveSubscription(customer.id);
    
    const planTypeTyped = plan_type as PeepersPlanType;
    const priceId = STRIPE_PRICE_IDS[planTypeTyped];

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID not configured for plan' }, { status: 500 });
    }

    // 6. Criar sessão do Stripe Checkout
    let checkoutSession;

    if (existingSubscription) {
      // Subscription change - usar portal do cliente para mudanças
      checkoutSession = await createPortalSession(customer.id, success_url);
    } else {
      // Nova subscription
      checkoutSession = await createCheckoutSession({
        customerId: customer.id,
        priceId,
        successUrl: success_url,
        cancelUrl: cancel_url,
        metadata: {
          tenant_id: userId,
          plan_type: planTypeTyped,
          ml_user_id: user.id?.toString() || userId
        }
      });
    }

    logger.info({
      userId,
      planType: planTypeTyped,
      customerId: customer.id,
      sessionId: checkoutSession.id
    }, 'Created Stripe checkout session');

    return NextResponse.json({
      checkout_url: checkoutSession.url,
      session_id: checkoutSession.id
    });

  } catch (error) {
    logger.error({ error }, 'Failed to create checkout session');
    return NextResponse.json({ 
      error: 'Failed to create checkout session' 
    }, { status: 500 });
  }
}

async function createCheckoutSession({
  customerId,
  priceId,
  successUrl,
  cancelUrl,
  metadata
}: {
  customerId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  metadata: Record<string, string>;
}) {
  // Usar Stripe SDK diretamente para checkout session
  const stripe = new (await import('stripe')).default(
    process.env.STRIPE_SECRET_KEY!,
    { apiVersion: '2025-08-27.basil' }
  );

  return await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
    subscription_data: {
      metadata,
      trial_period_days: 14, // 14 dias de trial
    },
    allow_promotion_codes: true, // Permitir códigos promocionais
  });
}

async function createPortalSession(customerId: string, returnUrl: string) {
  // Portal do cliente para gerenciar subscriptions existentes
  const stripe = new (await import('stripe')).default(
    process.env.STRIPE_SECRET_KEY!,
    { apiVersion: '2025-08-27.basil' }
  );

  return await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

// Metadata da API
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';