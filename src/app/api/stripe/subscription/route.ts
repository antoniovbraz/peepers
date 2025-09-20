/**
 * API Route - Stripe Subscription Management
 *
 * Gerencia upgrades, downgrades e cancelamentos de subscriptions
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripeClient } from '@/lib/stripe';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { action, subscriptionId, newPriceId } = await request.json();

    if (!action || !subscriptionId) {
      return NextResponse.json(
        { error: 'Action and subscriptionId are required' },
        { status: 400 }
      );
    }

    let result;
    const actionType = action;

    switch (actionType) {
      case 'upgrade':
        if (!newPriceId) {
          return NextResponse.json(
            { error: 'newPriceId is required for upgrade' },
            { status: 400 }
          );
        }
        result = await stripeClient.upgradeSubscription(subscriptionId, newPriceId);
        logger.info({ subscriptionId, newPriceId }, 'Subscription upgraded');
        break;

      case 'schedule_downgrade':
        if (!newPriceId) {
          return NextResponse.json(
            { error: 'newPriceId is required for downgrade' },
            { status: 400 }
          );
        }
        result = await stripeClient.scheduleDowngrade(subscriptionId, newPriceId);
        logger.info({ subscriptionId, newPriceId }, 'Downgrade scheduled');
        break;

      case 'cancel_scheduled_downgrade':
        result = await stripeClient.cancelScheduledDowngrade(subscriptionId);
        logger.info({ subscriptionId }, 'Scheduled downgrade cancelled');
        break;

      case 'cancel':
        result = await stripeClient.cancelSubscription(subscriptionId, true); // Cancel at period end
        logger.info({ subscriptionId }, 'Subscription cancelled');
        break;

      case 'reactivate':
        result = await stripeClient.reactivateSubscription(subscriptionId);
        logger.info({ subscriptionId }, 'Subscription reactivated');
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action: actionType,
      subscription: result
    });

  } catch (error) {
    logger.error({ error }, 'Failed to manage subscription');

    return NextResponse.json(
      {
        error: 'Failed to manage subscription',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Busca subscription details
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get('subscriptionId');
    const customerId = searchParams.get('customerId');

    if (!subscriptionId && !customerId) {
      return NextResponse.json(
        { error: 'subscriptionId or customerId is required' },
        { status: 400 }
      );
    }

    let subscription;

    if (subscriptionId) {
      subscription = await stripeClient.getSubscription(subscriptionId);
    } else if (customerId) {
      subscription = await stripeClient.getActiveSubscription(customerId);
    }

    if (!subscription) {
      return NextResponse.json({
        has_subscription: false,
        message: 'No subscription found'
      });
    }

    return NextResponse.json({
      has_subscription: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        items: subscription.items.data.map(item => ({
          id: item.id,
          price: {
            id: item.price.id,
            currency: item.price.currency,
            unit_amount: item.price.unit_amount,
            recurring: item.price.recurring
          }
        }))
      }
    });

  } catch (error) {
    logger.error({ error }, 'Failed to get subscription details');

    return NextResponse.json(
      {
        error: 'Failed to get subscription details',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}