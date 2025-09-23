import { NextRequest, NextResponse } from 'next/server';
import { getSecurityStats } from '@/lib/security-events';
import { rateLimiter } from '@/lib/rate-limiter';
import { logger } from '@/lib/logger';
import { isSuperAdmin } from '@/config/platform-admin';

/**
 * Endpoint de Estatísticas de Segurança
 * 
 * Fornece dashboard de métricas de segurança:
 * - Eventos de segurança recentes
 * - Estatísticas de rate limiting
 * - Status de alertas
 * - Resumo de ameaças
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autorização (apenas admin pode acessar)
    const userId = request.cookies.get('user_id')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super admins can access this endpoint (platform-level)
    const userEmail = request.cookies.get('user_email')?.value;
    if (!isSuperAdmin({ email: userEmail || undefined, id: userId })) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Obter parâmetros de query
    const url = new URL(request.url);
    const timeWindow = parseInt(url.searchParams.get('window') || '3600'); // 1 hora default

    // Coletar estatísticas
    const [securityStats, rateLimitStats, ipStats, userStats, endpointStats, loginStats, webhookStats, publicStats, authStats] = await Promise.all([
      getSecurityStats(timeWindow),
      rateLimiter.getStats(),
      rateLimiter.getStats('rate_limit:ip:*'),
      rateLimiter.getStats('rate_limit:user:*'),
      rateLimiter.getStats('rate_limit:endpoint:*'),
      rateLimiter.getStats('rate_limit:login:*'),
      rateLimiter.getStats('rate_limit:webhook:*'),
      rateLimiter.getStats('rate_limit:public:*'),
      rateLimiter.getStats('rate_limit:auth:*')
    ]);

    // Métricas calculadas
    const totalEvents = securityStats.total;
    const criticalEvents = securityStats.bySeverity?.CRITICAL || 0;
    const highEvents = securityStats.bySeverity?.HIGH || 0;
    
    const csrfDetections = securityStats.byType?.['auth.csrf.detected'] || 0;
    const tokenTheftDetections = securityStats.byType?.['auth.token_theft.detected'] || 0;
    const rateLimitExceeded = securityStats.byType?.['security.rate_limit.exceeded'] || 0;
    const corsViolations = securityStats.byType?.['security.cors.violation'] || 0;
    const unauthorizedAccess = securityStats.byType?.['authz.unauthorized.access'] || 0;

    // Status geral de segurança
    const securityStatus = calculateSecurityStatus(criticalEvents, highEvents, totalEvents);

    const response = {
      timestamp: new Date().toISOString(),
      time_window_seconds: timeWindow,
      security_status: securityStatus,
      
      // Resumo executivo
      summary: {
        total_events: totalEvents,
        critical_events: criticalEvents,
        high_events: highEvents,
        medium_events: securityStats.bySeverity?.MEDIUM || 0,
        low_events: securityStats.bySeverity?.LOW || 0
      },

      // Eventos críticos
      critical_threats: {
        csrf_detections: csrfDetections,
        token_theft_detections: tokenTheftDetections,
        brute_force_attempts: securityStats.byType?.['security.brute_force.detected'] || 0
      },

      // Eventos de alta prioridade
      high_priority: {
        rate_limit_exceeded: rateLimitExceeded,
        unauthorized_access: unauthorizedAccess,
        suspicious_activity: securityStats.byType?.['security.suspicious.activity'] || 0
      },

      // Eventos médios
      medium_priority: {
        cors_violations: corsViolations,
        webhook_auth_failures: securityStats.byType?.['system.webhook.auth.failure'] || 0,
        api_errors: securityStats.byType?.['system.api.error'] || 0
      },

      // Rate limiting (computed from available data)
      rate_limiting: {
        total_keys: rateLimitStats.keys,
        active_limits: rateLimitStats.keys,
        errors: rateLimitStats.errors,
        sample: rateLimitStats.sample,
        by_type: {
          ip: ipStats.keys,
          user: userStats.keys,
          endpoint: endpointStats.keys,
          login: loginStats.keys,
          webhook: webhookStats.keys,
          public: publicStats.keys,
          auth: authStats.keys
        }
      },

      // Eventos por tipo (completo)
      events_by_type: securityStats.byType,

      // Alertas ativos
      active_alerts: getActiveAlerts(securityStats),

      // Recomendações
      recommendations: generateRecommendations({
        criticalEvents,
        highEvents,
        csrfDetections,
        tokenTheftDetections,
        rateLimitExceeded,
        unauthorizedAccess
      })
    };

    logger.info({ 
      userId, 
      timeWindow,
      totalEvents,
      criticalEvents,
      securityStatus 
    }, 'Security stats accessed');

    return NextResponse.json(response);

  } catch (error) {
    logger.error({ error }, 'Security stats endpoint error');
    return NextResponse.json({ 
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * Calcula status geral de segurança
 */
function calculateSecurityStatus(critical: number, high: number, total: number): string {
  if (critical > 0) return 'CRITICAL';
  if (high > 5) return 'HIGH_RISK';
  if (high > 0 || total > 50) return 'MODERATE';
  if (total > 10) return 'NORMAL';
  return 'SECURE';
}

/**
 * Identifica alertas ativos
 */
function getActiveAlerts(stats: any): string[] {
  const alerts: string[] = [];

  if ((stats.byType?.['auth.csrf.detected'] || 0) > 0) {
    alerts.push('CSRF attacks detected');
  }
  
  if ((stats.byType?.['auth.token_theft.detected'] || 0) > 0) {
    alerts.push('Token theft attempts detected');
  }
  
  if ((stats.byType?.['security.rate_limit.exceeded'] || 0) > 10) {
    alerts.push('High rate limit violations');
  }
  
  if ((stats.byType?.['authz.unauthorized.access'] || 0) > 3) {
    alerts.push('Multiple unauthorized access attempts');
  }

  return alerts;
}

/**
 * Gera recomendações baseadas nos eventos
 */
function generateRecommendations(metrics: any): string[] {
  const recommendations: string[] = [];

  if (metrics.criticalEvents > 0) {
    recommendations.push('Investigate critical security events immediately');
  }

  if (metrics.csrfDetections > 0) {
    recommendations.push('Review OAuth state validation and CSRF protection');
  }

  if (metrics.tokenTheftDetections > 0) {
    recommendations.push('Force re-authentication for affected users');
  }

  if (metrics.rateLimitExceeded > 20) {
    recommendations.push('Consider adjusting rate limit thresholds or blocking IPs');
  }

  if (metrics.unauthorizedAccess > 5) {
    recommendations.push('Review user authorization list and access controls');
  }

  if (recommendations.length === 0) {
    recommendations.push('Security posture is good - continue monitoring');
  }

  return recommendations;
}