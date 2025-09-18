/**
 * ENDPOINT DE TESTE PARA VALIDAÇÃO DE WEBHOOK SECURITY
 *
 * Permite testar as validações críticas de IP whitelist e timeout enforcement
 * sem depender do Mercado Livre real.
 *
 * USO: Para desenvolvimento e testes de segurança
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import {
  validateMLWebhook,
  createWebhookErrorResponse,
  createWebhookSuccessResponse
} from '@/middleware/webhook-validation';
import { isValidWebhookTopic, WEBHOOK_TIMEOUT_MS } from '@/config/webhook';

const TestWebhookSchema = z.object({
  topic: z.string(),
  test_ip: z.string().optional(), // Para simular diferentes IPs
  simulate_delay: z.number().optional(), // Para testar timeout
  force_error: z.boolean().optional() // Para testar tratamento de erros
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    logger.info('🧪 Test Webhook endpoint chamado');

    // ==================== SIMULAÇÃO DE IP PARA TESTES ====================
    let testRequest = request;

    // Se foi fornecido um IP de teste, simular headers
    const body = await request.json().catch(() => ({}));
    const testValidation = TestWebhookSchema.safeParse(body);

    if (testValidation.success && testValidation.data.test_ip) {
      // Criar novo request com IP simulado
      const simulatedHeaders = new Headers(request.headers);
      simulatedHeaders.set('x-forwarded-for', testValidation.data.test_ip);

      testRequest = new NextRequest(request.url, {
        method: request.method,
        headers: simulatedHeaders,
        body: JSON.stringify({
          ...body,
          test_ip: undefined // Remover para não interferir na validação
        })
      });

      logger.info({ simulatedIP: testValidation.data.test_ip }, '🔄 Simulando IP para teste');
    }

    // ==================== VALIDAÇÃO DE SEGURANÇA ====================
    const webhookValidation = validateMLWebhook(testRequest);

    if (!webhookValidation.isValid) {
      return createWebhookErrorResponse(webhookValidation.error!, 403, {
        clientIP: webhookValidation.clientIP,
        processingTimeMs: Date.now() - startTime,
        testMode: true
      });
    }

    if (webhookValidation.warning) {
      logger.warn({ warning: webhookValidation.warning, clientIP: webhookValidation.clientIP });
    }

    // ==================== SIMULAÇÃO DE DELAY PARA TESTE ====================
    if (testValidation.success && testValidation.data.simulate_delay) {
      const delay = Math.min(testValidation.data.simulate_delay, 1000); // Máximo 1s para segurança
      logger.info({ delay }, '⏱️ Simulando delay para teste de timeout');
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    // ==================== SIMULAÇÃO DE ERRO ====================
    if (testValidation.success && testValidation.data.force_error) {
      logger.info('💥 Forçando erro para teste');
      throw new Error('Simulated error for testing');
    }

    // ==================== VALIDAÇÃO DE TOPIC ====================
    const topic = testValidation.success ? testValidation.data.topic : 'test';
    if (!isValidWebhookTopic(topic)) {
      logger.warn({ topic }, '⚠️ Topic de teste não suportado');
    }

    // ==================== TIMEOUT ENFORCEMENT ====================
    const processingTime = Date.now() - startTime;

    if (processingTime > WEBHOOK_TIMEOUT_MS) {
      logger.error({
        processingTime,
        timeoutLimit: WEBHOOK_TIMEOUT_MS,
        topic
      }, '🚨 Test webhook excedeu timeout');

      return createWebhookSuccessResponse(topic, processingTime, {
        warning: 'Test exceeded 500ms timeout',
        testMode: true
      });
    }

    logger.info({
      processingTime,
      topic,
      clientIP: webhookValidation.clientIP
    }, '✅ Test webhook processado com sucesso');

    return createWebhookSuccessResponse(topic, processingTime, {
      testMode: true,
      validationPassed: true,
      simulatedIP: testValidation.success ? testValidation.data.test_ip : undefined
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;

    logger.error({
      error,
      processingTime
    }, '❌ Erro no teste de webhook');

    return NextResponse.json({
      error: 'Test webhook error',
      message: error instanceof Error ? error.message : 'Unknown error',
      processing_time_ms: processingTime,
      testMode: true
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Test Webhook Security Endpoint',
    description: 'Test IP whitelist validation and timeout enforcement',
    usage: {
      method: 'POST',
      body: {
        topic: 'orders_v2',
        test_ip: '54.88.218.97', // IP válido do ML
        simulate_delay: 100, // ms para testar timeout
        force_error: false
      }
    },
    test_cases: {
      valid_ip: '54.88.218.97',
      invalid_ip: '192.168.1.1',
      timeout_test: { simulate_delay: 600 },
      error_test: { force_error: true }
    }
  });
}