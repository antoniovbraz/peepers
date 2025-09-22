/**
 * Stripe Setup Script - Peepers Enterprise v2.0.0
 *
 * Script para configurar produtos e preços no Stripe
 * Execute este script uma vez para configurar o Stripe dashboard
 */

import Stripe from 'stripe';
import { PEEPERS_PLANS } from '../config/entitlements';
import { logger } from '../lib/logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil'
});

interface StripeProduct {
  id: string;
  name: string;
  description: string;
}

interface StripePrice {
  id: string;
  product: string;
  unit_amount: number;
  currency: string;
  recurring: {
    interval: 'month' | 'year';
  };
  metadata: {
    plan_type: string;
    billing_cycle: string;
  };
}

async function setupStripeProducts() {
  logger.info('🚀 Iniciando configuração de produtos no Stripe...');

  const products: Record<string, StripeProduct> = {};
  const prices: StripePrice[] = [];

  try {
    // Criar produtos para cada plano
    for (const [planKey, plan] of Object.entries(PEEPERS_PLANS)) {
      logger.info(`📦 Criando produto para plano ${plan.name}...`);

      const product = await stripe.products.create({
        name: plan.name,
        description: `Plano ${plan.name} - Peepers Enterprise`,
        metadata: {
          plan_type: planKey,
          features: plan.features.join(',')
        }
      });

      products[planKey] = {
        id: product.id,
        name: product.name!,
        description: product.description!
      };

      logger.info(`✅ Produto criado: ${product.name} (${product.id})`);

      // Criar preços para cada ciclo de cobrança
      const priceMap = {
        monthly: plan.price_monthly,
        yearly: plan.price_yearly
      };

      for (const [cycle, price] of Object.entries(priceMap)) {
        logger.info(`💰 Criando preço ${cycle} para ${plan.name}: R$ ${(price / 100).toFixed(2)}`);

        const stripePrice = await stripe.prices.create({
          product: product.id,
          unit_amount: price,
          currency: 'brl',
          recurring: {
            interval: cycle.includes('year') ? 'year' : 'month',
            interval_count: cycle.includes('quarter') ? 3 : 1
          },
          metadata: {
            plan_type: planKey,
            billing_cycle: cycle
          }
        });

        prices.push({
          id: stripePrice.id,
          product: product.id,
          unit_amount: stripePrice.unit_amount!,
          currency: stripePrice.currency,
          recurring: {
            interval: stripePrice.recurring!.interval as 'month' | 'year'
          },
          metadata: {
            plan_type: stripePrice.metadata!.plan_type || '',
            billing_cycle: stripePrice.metadata!.billing_cycle || ''
          }
        });

        logger.info(`✅ Preço criado: ${stripePrice.id} - R$ ${(stripePrice.unit_amount! / 100).toFixed(2)}/${stripePrice.recurring?.interval}`);
      }
    }

    // Exibir resumo
    console.log('\n🎉 Configuração concluída!');
    console.log('\n📋 Produtos criados:');
    Object.entries(products).forEach(([key, product]) => {
      console.log(`  ${key}: ${product.name} (${product.id})`);
    });

    console.log('\n💰 Preços criados:');
    prices.forEach(price => {
      const plan = Object.values(PEEPERS_PLANS).find(p =>
        p.stripe_price_ids.monthly === price.product ||
        p.stripe_price_ids.quarterly === price.product ||
        p.stripe_price_ids.yearly === price.product
      );
      console.log(`  ${price.id}: ${plan?.name} - R$ ${(price.unit_amount / 100).toFixed(2)}/${price.recurring.interval}`);
    });

    console.log('\n⚠️  IMPORTANTE: Adicione estes IDs ao seu arquivo .env:');
    console.log('# Stripe Price IDs');
    prices.forEach(price => {
      const planType = price.metadata.plan_type;
      const cycle = price.metadata.billing_cycle;
      const envVar = `STRIPE_PRICE_${planType.toUpperCase()}_${cycle.toUpperCase()}`;
      console.log(`${envVar}=${price.id}`);
    });

  } catch (error) {
    logger.error({ error }, '❌ Erro durante configuração do Stripe');
    throw error;
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  setupStripeProducts()
    .then(() => {
      logger.info('✅ Configuração do Stripe concluída com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      logger.error({ error }, '❌ Falha na configuração do Stripe');
      process.exit(1);
    });
}

export { setupStripeProducts };