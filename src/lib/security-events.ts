import { logger } from '@/lib/logger';

/**
 * Sistema de Eventos de Segurança e Alertas Automáticos
 * 
 * Monitora eventos críticos de segurança e dispara alertas:
 * - CSRF detections
 * - Token theft attempts
 * - Rate limiting violations
 * - Unauthorized access attempts
 * - Multiple failed logins
 * - Suspicious patterns
 */

export interface SecurityEvent {
  type: SecurityEventType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  userId?: string;
  clientIP?: string;
  userAgent?: string;
  details: Record<string, any>;
  timestamp: string;
  path?: string;
  origin?: string;
}

export enum SecurityEventType {
  // Autenticação
  LOGIN_SUCCESS = 'auth.login.success',
  LOGIN_FAILURE = 'auth.login.failure',
  CSRF_DETECTED = 'auth.csrf.detected',
  TOKEN_THEFT_DETECTED = 'auth.token_theft.detected',
  TOKEN_REFRESH_SUCCESS = 'auth.token.refresh.success',
  TOKEN_REFRESH_FAILURE = 'auth.token.refresh.failure',
  
  // Autorização
  UNAUTHORIZED_ACCESS = 'authz.unauthorized.access',
  ADMIN_ACCESS_ATTEMPT = 'authz.admin.access.attempt',
  FORBIDDEN_RESOURCE = 'authz.forbidden.resource',
  
  // Sessão
  SESSION_CREATED = 'session.created',
  SESSION_EXPIRED = 'session.expired',
  SESSION_INVALIDATED = 'session.invalidated',
  LOGOUT_SUCCESS = 'session.logout.success',
  
  // Rate Limiting & Security
  RATE_LIMIT_EXCEEDED = 'security.rate_limit.exceeded',
  SUSPICIOUS_ACTIVITY = 'security.suspicious.activity',
  CORS_VIOLATION = 'security.cors.violation',
  BRUTE_FORCE_DETECTED = 'security.brute_force.detected',
  
  // Sistema
  WEBHOOK_AUTH_FAILURE = 'system.webhook.auth.failure',
  API_ERROR = 'system.api.error'
}

export interface AlertRule {
  eventType: SecurityEventType;
  threshold: number;
  timeWindow: number; // em segundos
  severity: SecurityEvent['severity'];
  enabled: boolean;
}

/**
 * Configuração de regras de alerta
 */
const ALERT_RULES: AlertRule[] = [
  // Alertas críticos
  {
    eventType: SecurityEventType.CSRF_DETECTED,
    threshold: 1, // Qualquer detecção CSRF é crítica
    timeWindow: 3600, // 1 hora
    severity: 'CRITICAL',
    enabled: true
  },
  {
    eventType: SecurityEventType.TOKEN_THEFT_DETECTED,
    threshold: 1, // Qualquer detecção de theft é crítica
    timeWindow: 3600,
    severity: 'CRITICAL',
    enabled: true
  },
  
  // Alertas altos
  {
    eventType: SecurityEventType.RATE_LIMIT_EXCEEDED,
    threshold: 10, // 10 violações em 15 min
    timeWindow: 900, // 15 minutos
    severity: 'HIGH',
    enabled: true
  },
  {
    eventType: SecurityEventType.LOGIN_FAILURE,
    threshold: 5, // 5 falhas em 5 min (possível brute force)
    timeWindow: 300, // 5 minutos
    severity: 'HIGH',
    enabled: true
  },
  {
    eventType: SecurityEventType.UNAUTHORIZED_ACCESS,
    threshold: 3, // 3 tentativas não autorizadas em 10 min
    timeWindow: 600, // 10 minutos
    severity: 'HIGH',
    enabled: true
  },
  
  // Alertas médios
  {
    eventType: SecurityEventType.CORS_VIOLATION,
    threshold: 20, // 20 violações CORS em 1 hora
    timeWindow: 3600,
    severity: 'MEDIUM',
    enabled: true
  },
  {
    eventType: SecurityEventType.WEBHOOK_AUTH_FAILURE,
    threshold: 5, // 5 falhas de webhook em 30 min
    timeWindow: 1800,
    severity: 'MEDIUM',
    enabled: true
  }
];

class SecurityEventManager {
  private events: SecurityEvent[] = [];
  private maxEvents = 1000; // Manter últimos 1000 eventos em memória

  /**
   * Registra um evento de segurança
   */
  async logEvent(event: Omit<SecurityEvent, 'timestamp'>): Promise<void> {
    const fullEvent: SecurityEvent = {
      ...event,
      timestamp: new Date().toISOString()
    };

    // Adicionar à lista de eventos
    this.events.push(fullEvent);
    
    // Manter apenas os últimos N eventos
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Log estruturado
    logger.info({
      event_type: 'security',
      event_name: event.type,
      severity: event.severity,
      user_id: event.userId,
      client_ip: event.clientIP,
      path: event.path,
      origin: event.origin,
      details: event.details,
      timestamp: fullEvent.timestamp
    }, `Security event: ${event.type}`);

    // Verificar se deve disparar alerta
    await this.checkAlertRules(fullEvent);
  }

  /**
   * Verifica regras de alerta e dispara se necessário
   */
  private async checkAlertRules(event: SecurityEvent): Promise<void> {
    const applicableRules = ALERT_RULES.filter(rule => 
      rule.enabled && rule.eventType === event.type
    );

    for (const rule of applicableRules) {
      const shouldAlert = await this.shouldTriggerAlert(event, rule);
      
      if (shouldAlert) {
        await this.triggerAlert(event, rule);
      }
    }
  }

  /**
   * Verifica se deve disparar alerta baseado na regra
   */
  private async shouldTriggerAlert(event: SecurityEvent, rule: AlertRule): Promise<boolean> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - (rule.timeWindow * 1000));

    // Contar eventos do mesmo tipo na janela de tempo
    const eventsInWindow = this.events.filter(e => 
      e.type === rule.eventType &&
      new Date(e.timestamp) >= windowStart &&
      // Opcionalmente filtrar por mesmo IP/usuário para alguns tipos de evento
      (this.shouldGroupByUser(rule.eventType) ? e.userId === event.userId : true) &&
      (this.shouldGroupByIP(rule.eventType) ? e.clientIP === event.clientIP : true)
    );

    return eventsInWindow.length >= rule.threshold;
  }

  /**
   * Determina se evento deve ser agrupado por usuário
   */
  private shouldGroupByUser(eventType: SecurityEventType): boolean {
    return [
      SecurityEventType.LOGIN_FAILURE,
      SecurityEventType.TOKEN_THEFT_DETECTED,
      SecurityEventType.UNAUTHORIZED_ACCESS
    ].includes(eventType);
  }

  /**
   * Determina se evento deve ser agrupado por IP
   */
  private shouldGroupByIP(eventType: SecurityEventType): boolean {
    return [
      SecurityEventType.RATE_LIMIT_EXCEEDED,
      SecurityEventType.CORS_VIOLATION,
      SecurityEventType.BRUTE_FORCE_DETECTED
    ].includes(eventType);
  }

  /**
   * Dispara alerta
   */
  private async triggerAlert(event: SecurityEvent, rule: AlertRule): Promise<void> {
    const alertData = {
      rule,
      triggeringEvent: event,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      app: 'Peepers'
    };

    // Log do alerta
    logger.error({
      alert_triggered: true,
      severity: rule.severity,
      event_type: event.type,
      threshold: rule.threshold,
      time_window: rule.timeWindow,
      user_id: event.userId,
      client_ip: event.clientIP,
      details: event.details
    }, `SECURITY ALERT: ${event.type} threshold exceeded`);

    // Enviar alerta (implementar conforme necessidade)
    await this.sendAlert(alertData);
  }

  /**
   * Envia alerta via diferentes canais
   */
  private async sendAlert(alertData: any): Promise<void> {
    try {
      // 1. Email (se configurado)
      if (process.env.ALERT_EMAIL_WEBHOOK) {
        await this.sendEmailAlert(alertData);
      }

      // 2. Webhook (se configurado)
      if (process.env.ALERT_WEBHOOK_URL) {
        await this.sendWebhookAlert(alertData);
      }

      // 3. Slack (se configurado)
      if (process.env.SLACK_WEBHOOK_URL) {
        await this.sendSlackAlert(alertData);
      }

    } catch (error) {
      logger.error({ error, alertData }, 'Failed to send security alert');
    }
  }

  /**
   * Envia alerta por email
   */
  private async sendEmailAlert(alertData: any): Promise<void> {
    const emailPayload = {
      to: process.env.ALERT_EMAIL_TO,
      subject: `🚨 Peepers Security Alert - ${alertData.rule.severity}`,
      body: `
        Security Alert Triggered
        
        Type: ${alertData.triggeringEvent.type}
        Severity: ${alertData.rule.severity}
        Time: ${alertData.timestamp}
        User: ${alertData.triggeringEvent.userId || 'N/A'}
        IP: ${alertData.triggeringEvent.clientIP || 'N/A'}
        
        Details: ${JSON.stringify(alertData.triggeringEvent.details, null, 2)}
        
        Threshold: ${alertData.rule.threshold} events in ${alertData.rule.timeWindow} seconds
      `
    };

    await fetch(process.env.ALERT_EMAIL_WEBHOOK!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emailPayload)
    });
  }

  /**
   * Envia alerta via webhook genérico
   */
  private async sendWebhookAlert(alertData: any): Promise<void> {
    await fetch(process.env.ALERT_WEBHOOK_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alertData)
    });
  }

  /**
   * Envia alerta para Slack
   */
  private async sendSlackAlert(alertData: any): Promise<void> {
    const slackPayload = {
      text: `🚨 Peepers Security Alert`,
      attachments: [{
        color: this.getSeverityColor(alertData.rule.severity),
        fields: [
          {
            title: 'Event Type',
            value: alertData.triggeringEvent.type,
            short: true
          },
          {
            title: 'Severity',
            value: alertData.rule.severity,
            short: true
          },
          {
            title: 'User ID',
            value: alertData.triggeringEvent.userId || 'N/A',
            short: true
          },
          {
            title: 'Client IP',
            value: alertData.triggeringEvent.clientIP || 'N/A',
            short: true
          },
          {
            title: 'Threshold',
            value: `${alertData.rule.threshold} events in ${alertData.rule.timeWindow}s`,
            short: false
          }
        ],
        timestamp: Math.floor(Date.now() / 1000)
      }]
    };

    await fetch(process.env.SLACK_WEBHOOK_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackPayload)
    });
  }

  /**
   * Obtém cor para severity no Slack
   */
  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'CRITICAL': return 'danger';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return '#ffaa00';
      case 'LOW': return 'good';
      default: return '#cccccc';
    }
  }

  /**
   * Obtém estatísticas dos eventos
   */
  getEventStats(timeWindow: number = 3600): any {
    const now = new Date();
    const windowStart = new Date(now.getTime() - (timeWindow * 1000));

    const eventsInWindow = this.events.filter(e => 
      new Date(e.timestamp) >= windowStart
    );

    const statsByType = eventsInWindow.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statsBySeverity = eventsInWindow.reduce((acc, event) => {
      acc[event.severity] = (acc[event.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: eventsInWindow.length,
      byType: statsByType,
      bySeverity: statsBySeverity,
      timeWindow,
      periodStart: windowStart.toISOString(),
      periodEnd: now.toISOString()
    };
  }
}

// Singleton instance
export const securityEventManager = new SecurityEventManager();

// Helper functions para uso em outros módulos
export const logSecurityEvent = (event: Omit<SecurityEvent, 'timestamp'>) => 
  securityEventManager.logEvent(event);

export const getSecurityStats = (timeWindow?: number) => 
  securityEventManager.getEventStats(timeWindow);