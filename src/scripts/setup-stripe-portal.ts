#!/usr/bin/env node

/**
 * Setup Stripe Billing Portal Configuration
 *
 * Configura o portal de cobrança do Stripe para permitir upgrade/downgrade de planos
 * Este script deve ser executado após configurar os preços no Stripe
 */

import * as https from 'https';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

if (!STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY não configurada');
  process.exit(1);
}

console.log('🚀 Configurando portal de cobrança do Stripe...\n');

// Configuração do portal de cobrança
const portalConfig = {
  business_profile: {
    headline: 'Gerencie sua assinatura Peepers'
  },
  features: {
    customer_update: {
      allowed_updates: ['email', 'tax_id'],
      enabled: true
    },
    invoice_history: {
      enabled: true
    },
    payment_method_update: {
      enabled: true
    },
    subscription_cancel: {
      cancellation_reason: {
        enabled: true,
        options: ['too_expensive', 'missing_features', 'switched_service', 'unused', 'other']
      },
      enabled: true,
      mode: 'at_period_end' as const, // Cancela no fim do período
      proration_behavior: 'none' as const
    },
    subscription_pause: {
      enabled: false // Não permitir pausa
    },
    subscription_update: {
      default_allowed_updates: ['price'],
      enabled: true,
      proration_behavior: 'create_prorations' as const,
      products: [] // Será preenchido dinamicamente
    }
  },
  default_return_url: `${APP_URL}/admin/billing`,
  login_page: {
    enabled: true
  },
  metadata: {
    service: 'peepers',
    version: '2.0.0'
  }
};

interface StripeResponse {
  id: string;
  [key: string]: unknown;
}

function makeStripeRequest(endpoint: string, data: Record<string, unknown>): Promise<StripeResponse> {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);

    const options = {
      hostname: 'api.stripe.com',
      port: 443,
      path: `/v1${endpoint}`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          if (response.error) {
            reject(new Error(response.error.message));
          } else {
            resolve(response);
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function setupBillingPortal() {
  try {
    console.log('📋 Criando configuração do portal de cobrança...');

    const portal = await makeStripeRequest('/billing_portal/configurations', portalConfig);

    console.log('✅ Portal de cobrança configurado com sucesso!');
    console.log(`🔗 Portal ID: ${portal.id}`);
    console.log(`🔗 URL de configuração: https://dashboard.stripe.com/test/settings/billing/portal`);

    // Instruções para o usuário
    console.log('\n📝 Próximos passos:');
    console.log('1. Acesse o link acima no dashboard do Stripe');
    console.log('2. Configure os produtos disponíveis para upgrade/downgrade');
    console.log('3. Teste o portal com um customer de teste');
    console.log('4. Atualize as variáveis de ambiente com os IDs dos preços');

    console.log('\n🎉 Configuração concluída!');

  } catch (error) {
    console.error('❌ Erro ao configurar portal de cobrança:', (error as Error).message);
    process.exit(1);
  }
}

// Executar configuração
setupBillingPortal();