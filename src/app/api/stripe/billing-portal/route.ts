/**
 * API Route - Stripe Billing Portal
 *
 * Cria sessão do portal de cobrança do Stripe para gerenciamento de subscriptions
 * Permite upgrade/downgrade de planos diretamente na interface do Stripe
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripeClient } from '@/lib/stripe';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { customerId, returnUrl } = await request.json();

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    // Criar sessão do portal de cobrança
    const session = await stripeClient.createBillingPortalSession(
      customerId,
      returnUrl
    );

    logger.info({
      customerId,
      sessionUrl: session.url
    }, 'Billing portal session created');

    return NextResponse.json({
      success: true,
      portal_url: session.url
    });

  } catch (error) {
    logger.error({ error }, 'Failed to create billing portal session');

    return NextResponse.json(
      {
        error: 'Failed to create billing portal session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Busca informações de cobrança do customer
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    // Buscar subscription ativa
    const subscription = await stripeClient.getActiveSubscription(customerId);

    if (!subscription) {
      return NextResponse.json({
        has_subscription: false,
        message: 'No active subscription found'
      });
    }

    // Buscar preços disponíveis para upgrade/downgrade
    const availablePrices = await stripeClient.getAvailablePrices();

    // Calcular preview de upgrade para cada preço disponível
    const upgradeOptions = await Promise.all(
      availablePrices.map(async (price) => {
        try {
          const preview = await stripeClient.calculateUpgradePreview(
            subscription.id,
            price.id
          );
          return {
            price_id: price.id,
            currency: price.currency,
            unit_amount: price.unit_amount,
            interval: price.recurring?.interval,
            preview
          };
        } catch (error) {
          logger.warn({ error, priceId: price.id }, 'Failed to calculate upgrade preview');
          return null;
        }
      })
    );

    return NextResponse.json({
      has_subscription: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        current_price: subscription.items.data[0]?.price
      },
      upgrade_options: upgradeOptions.filter(Boolean)
    });

  } catch (error) {
    logger.error({ error }, 'Failed to get billing information');

    return NextResponse.json(
      {
        error: 'Failed to get billing information',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}