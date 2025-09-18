/**
 * API Endpoint para Recuperação de Feeds Perdidos - Peepers Enterprise v2.0.0
 *
 * Endpoint para acionar manualmente a recuperação de notificações perdidas do ML
 * CRÍTICO: Ajuda a manter a consistência dos dados quando webhooks falham
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { MissedFeedsRecoveryService } from '@/domain/services/MissedFeedsRecoveryService';
import { logger } from '@/lib/logger';

// Schema de validação para os parâmetros da requisição
const RecoveryRequestSchema = z.object({
  tenantId: z.string().min(1, 'Tenant ID é obrigatório'),
  topics: z.array(z.string()).optional(),
  maxAgeHours: z.number().min(1).max(168).optional(), // Máximo 1 semana
  dryRun: z.boolean().optional()
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    logger.info('🔄 Solicitação de recuperação de feeds perdidos recebida');

    // Parse do body da requisição
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    // Validar schema
    const validation = RecoveryRequestSchema.safeParse(body);
    if (!validation.success) {
      logger.warn({ errors: validation.error.issues }, 'Parâmetros de recuperação inválidos');
      return NextResponse.json(
        {
          error: 'Parâmetros inválidos',
          details: validation.error.issues
        },
        { status: 400 }
      );
    }

    const { tenantId, topics, maxAgeHours, dryRun } = validation.data;

    logger.info({
      tenantId,
      topics: topics || 'all',
      maxAgeHours: maxAgeHours || 'unlimited',
      dryRun: dryRun || false
    }, '🚀 Iniciando recuperação de feeds perdidos');

    // Executar recuperação
    const result = await MissedFeedsRecoveryService.recoverAllMissedFeeds(
      tenantId,
      {
        topics,
        maxAgeHours,
        dryRun
      }
    );

    const processingTime = Date.now() - startTime;

    logger.info({
      ...result,
      processingTimeMs: processingTime
    }, '✅ Recuperação de feeds perdidos concluída');

    return NextResponse.json({
      success: true,
      data: result,
      processing_time_ms: processingTime,
      message: dryRun
        ? 'Dry run completed - no changes made'
        : `Recovered ${result.processed} feeds, ${result.failed} failed, ${result.skipped} skipped`
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;

    logger.error({
      error,
      processingTimeMs: processingTime
    }, '❌ Erro na recuperação de feeds perdidos');

    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to recover missed feeds',
      processing_time_ms: processingTime
    }, { status: 500 });
  }
}

// Método GET para obter estatísticas de recuperação
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId parameter is required' },
        { status: 400 }
      );
    }

    logger.info({ tenantId }, '📊 Solicitando estatísticas de recuperação');

    const stats = await MissedFeedsRecoveryService.getRecoveryStats(tenantId);

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error({ error }, '❌ Erro ao buscar estatísticas de recuperação');

    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to get recovery stats'
    }, { status: 500 });
  }
}