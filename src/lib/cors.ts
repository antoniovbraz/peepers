import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * Configuração CORS Segura para APIs
 * 
 * Implementa política CORS restritiva baseada em whitelist:
 * - Apenas domínios autorizados podem fazer requests
 * - Configuração específica por ambiente (dev/prod)
 * - Headers de segurança adicionais
 * - Logging de tentativas de acesso cross-origin
 */

// Domínios autorizados por ambiente
const ALLOWED_ORIGINS = {
  production: [
    'https://peepers.vercel.app',
    'https://auth.mercadolivre.com.br',
    'https://api.mercadolibre.com'
  ],
  development: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://eight-brooms-invent.loca.lt',
    'https://auth.mercadolivre.com.br',
    'https://api.mercadolibre.com'
  ]
} as const;

// Métodos HTTP permitidos
const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] as const;

// Headers permitidos
const ALLOWED_HEADERS = [
  'Content-Type',
  'Authorization',
  'X-Requested-With',
  'X-ML-Webhook-Secret',
  'User-Agent',
  'Accept',
  'Cache-Control'
] as const;

// Headers expostos para o cliente
const EXPOSED_HEADERS = [
  'X-RateLimit-Remaining',
  'X-RateLimit-Reset',
  'Retry-After'
] as const;

export class CORSHandler {
  private getAllowedOrigins(): string[] {
    const env = process.env.NODE_ENV as 'production' | 'development';
    return [...(ALLOWED_ORIGINS[env] || ALLOWED_ORIGINS.development)];
  }

  /**
   * Verifica se a origem é permitida
   */
  private isOriginAllowed(origin: string | null): boolean {
    if (!origin) return false;
    
    const allowedOrigins = this.getAllowedOrigins();
    return allowedOrigins.includes(origin);
  }

  /**
   * Aplica headers CORS à resposta
   */
  public async applyCORSHeaders(request: NextRequest, response: NextResponse): Promise<NextResponse> {
    const origin = request.headers.get('origin');
    const method = request.method;

    // Log tentativas de cross-origin para auditoria
    if (origin && !this.isOriginAllowed(origin)) {
      logger.warn({ 
        origin, 
        method, 
        path: request.nextUrl.pathname,
        userAgent: request.headers.get('user-agent')
      }, 'Blocked cross-origin request');
      
      // Log evento de segurança
      await import('@/lib/security-events').then(m => m.logSecurityEvent({
        type: m.SecurityEventType.CORS_VIOLATION,
        severity: 'MEDIUM',
        clientIP: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        origin,
        details: {
          blocked_origin: origin,
          attempted_method: method,
          attempted_path: request.nextUrl.pathname
        },
        path: request.nextUrl.pathname
      }));
      
      return new NextResponse('CORS policy violation', { status: 403 });
    }

    // Aplicar headers CORS apenas para origens autorizadas
    if (origin && this.isOriginAllowed(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    // Headers para requisições OPTIONS (preflight)
    if (method === 'OPTIONS') {
      response.headers.set('Access-Control-Allow-Methods', ALLOWED_METHODS.join(', '));
      response.headers.set('Access-Control-Allow-Headers', ALLOWED_HEADERS.join(', '));
      response.headers.set('Access-Control-Expose-Headers', EXPOSED_HEADERS.join(', '));
      response.headers.set('Access-Control-Max-Age', '86400'); // 24 horas
    }

    // Headers de segurança adicionais
    response.headers.set('Vary', 'Origin');
    response.headers.set('X-Content-Type-Options', 'nosniff');

    return response;
  }

  /**
   * Middleware para rotas API
   */
  public handleAPIRequest(request: NextRequest): NextResponse | null {
    const origin = request.headers.get('origin');
    const method = request.method;

    // Permitir requests same-origin (sem header Origin)
    if (!origin) {
      return null; // Continue processamento normal
    }

    // Bloquear origens não autorizadas
    if (!this.isOriginAllowed(origin)) {
      logger.warn({ 
        origin, 
        method, 
        path: request.nextUrl.pathname 
      }, 'CORS violation: Unauthorized origin');
      
      return new NextResponse(
        JSON.stringify({ 
          error: 'CORS policy violation',
          message: 'Origin not allowed'
        }), 
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Tratar requisições OPTIONS (preflight)
    if (method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 204 });
      
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      response.headers.set('Access-Control-Allow-Methods', ALLOWED_METHODS.join(', '));
      response.headers.set('Access-Control-Allow-Headers', ALLOWED_HEADERS.join(', '));
      response.headers.set('Access-Control-Expose-Headers', EXPOSED_HEADERS.join(', '));
      response.headers.set('Access-Control-Max-Age', '86400');
      
      return response;
    }

    // Continue processamento normal para requests válidos
    return null;
  }
}

// Singleton instance
export const corsHandler = new CORSHandler();