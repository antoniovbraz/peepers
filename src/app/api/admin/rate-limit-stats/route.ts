/**
 * Rate Limiting Stats API - Peepers Enterprise v2.0.0
 *
 * Endpoint para monitoramento de estatísticas de rate limiting
 * Fornece insights sobre uso da API e detecção de abusos
 */

import { NextRequest, NextResponse } from 'next/server';
import { rateLimiter } from '@/lib/rate-limiter';
import { checkAuthAPILimit } from '@/lib/rate-limiter';
import { logSecurityEvent, SecurityEventType } from '@/lib/security-events';

export async function GET(request: NextRequest) {
  try {
    // Obter informações do cliente para rate limiting
    const clientIP = request.headers.get('x-forwarded-for') ||
                    request.headers.get('x-real-ip') ||
                    'unknown';
    const userId = 'admin'; // Apenas admin pode acessar estatísticas

    // Rate limiting para endpoint de monitoramento (mais permissivo)
    const rateLimitResult = await checkAuthAPILimit(userId, clientIP, '/api/admin/rate-limit-stats');
    if (!rateLimitResult.allowed) {
      await logSecurityEvent({
        type: SecurityEventType.RATE_LIMIT_EXCEEDED,
        severity: 'HIGH',
        userId,
        clientIP,
        details: {
          endpoint: '/api/admin/rate-limit-stats',
          limit: 500,
          window_ms: 60 * 1000,
          total_hits: rateLimitResult.totalHits
        },
        path: '/api/admin/rate-limit-stats'
      });

      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Obter estatísticas de rate limiting
    const stats = await rateLimiter.getStats();

    // Obter estatísticas detalhadas por tipo
    const detailedStats = {
      timestamp: new Date().toISOString(),
      summary: stats,
      breakdown: {
        ip_limits: await rateLimiter.getStats('rate_limit:ip:*'),
        user_limits: await rateLimiter.getStats('rate_limit:user:*'),
        endpoint_limits: await rateLimiter.getStats('rate_limit:endpoint:*'),
        login_limits: await rateLimiter.getStats('rate_limit:login:*'),
        webhook_limits: await rateLimiter.getStats('rate_limit:webhook:*'),
        public_api_limits: await rateLimiter.getStats('rate_limit:public:*'),
        auth_api_limits: await rateLimiter.getStats('rate_limit:auth:*')
      },
      health: {
        status: stats.errors ? 'error' : 'healthy',
        last_check: new Date().toISOString()
      }
    };

    return NextResponse.json(detailedStats, {
      headers: {
        'X-RateLimit-Limit': '500',
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
      }
    });

  } catch (error) {
    console.error('Erro ao obter estatísticas de rate limiting:', error);

    await logSecurityEvent({
      type: SecurityEventType.API_ERROR,
      severity: 'MEDIUM',
      details: {
        endpoint: '/api/admin/rate-limit-stats',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      path: '/api/admin/rate-limit-stats'
    });

    return NextResponse.json(
      {
        error: 'Failed to retrieve rate limiting statistics',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Método POST para reset manual de limites (apenas emergências)
export async function POST(request: NextRequest) {
  try {
    const { key } = await request.json();

    if (!key || typeof key !== 'string') {
      return NextResponse.json(
        { error: 'Key parameter is required' },
        { status: 400 }
      );
    }

    // Reset do limite específico
    await rateLimiter.resetLimit(key);

    // Log evento de segurança
    await logSecurityEvent({
      type: SecurityEventType.ADMIN_ACCESS_ATTEMPT,
      severity: 'HIGH',
      userId: 'admin',
      clientIP: request.headers.get('x-forwarded-for') || 'unknown',
      details: {
        action: 'rate_limit_reset',
        key,
        timestamp: new Date().toISOString()
      },
      path: '/api/admin/rate-limit-stats'
    });

    return NextResponse.json({
      success: true,
      message: `Rate limit reset for key: ${key}`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao resetar limite:', error);

    return NextResponse.json(
      { error: 'Failed to reset rate limit' },
      { status: 500 }
    );
  }
}