import { NextRequest, NextResponse } from 'next/server';
import { getKVClient } from '@/lib/cache';
import { ML_CONFIG, CACHE_KEYS, API_ENDPOINTS } from '@/config/routes';
import { randomBytes, sha256, base64UrlEncode } from '@/lib/crypto-utils';
import { checkLoginLimit } from '@/lib/rate-limiter';
import { logSecurityEvent, SecurityEventType } from '@/lib/security-events';

/**
 * Gerar Code Verifier para PKCE (Proof Key for Code Exchange)
 * 
 * Implementa RFC 7636 para OAuth 2.0 PKCE:
 * - Gera 32 bytes criptograficamente seguros
 * - Codifica em Base64URL (sem padding)
 * - Usado para prevenir ataques de interceptação de código
 * 
 * Segurança:
 * - crypto.getRandomValues() - geração segura de entropy
 * - Base64URL encoding conforme RFC 4648
 * - Tamanho mínimo 43 caracteres (recomendação RFC 7636)
 * 
 * @returns {string} Code verifier Base64URL de 43 caracteres
 */
// Node/browser-safe Base64URL encode helpers
function generateCodeVerifier(): string {
  return base64UrlEncode(randomBytes(32));
}

/**
 * Gerar Code Challenge para PKCE
 * 
 * Implementa transformação SHA-256 do code verifier:
 * - Hash SHA-256 do verifier original
 * - Codificação Base64URL do hash
 * - Enviado na URL de autorização (público)
 * 
 * Fluxo de segurança:
 * 1. Code verifier (secreto) armazenado no cache
 * 2. Code challenge (público) enviado para ML
 * 3. ML valida verifier == SHA256(challenge) no callback
 * 
 * @param verifier - Code verifier original (43+ chars)
 * @returns {Promise<string>} Code challenge SHA-256 Base64URL
 */
function generateCodeChallenge(verifier: string): string {
  const hash = sha256(verifier);
  return base64UrlEncode(hash);
}

/**
 * Endpoint de Inicialização OAuth 2.0 + PKCE
 * 
 * Inicia fluxo de autorização seguro com Mercado Livre:
 * 1. Gera parâmetros PKCE (verifier + challenge)
 * 2. Cria state único para proteção CSRF
 * 3. Armazena verifier no cache com TTL de 10min
 * 4. Redireciona usuário para ML com parâmetros seguros
 * 
 * Proteções implementadas:
 * - PKCE RFC 7636 (previne code interception)
 * - State parameter (previne CSRF attacks)
 * - TTL curto no cache (minimiza janela de ataque)
 * - Validação de client_id obrigatória
 * 
 * @param request - NextRequest contendo origin para redirect_uri
 * @returns {Promise<NextResponse>} Redirect para autorização ML
 */
export async function GET(request: NextRequest) {
  const clientIP = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown';

  try {
    // Rate limiting para autenticação
    const rateLimitResult = await checkLoginLimit(clientIP);
    if (!rateLimitResult.allowed) {
      await logSecurityEvent({
        type: SecurityEventType.RATE_LIMIT_EXCEEDED,
        severity: 'MEDIUM',
        clientIP,
        details: {
          endpoint: '/api/auth/mercado-livre',
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime,
          totalHits: rateLimitResult.totalHits
        }
      });

      return NextResponse.json({
        error: 'Rate limit exceeded',
        retryAfter: rateLimitResult.retryAfter || Math.ceil(rateLimitResult.resetTime / 1000)
      }, { status: 429 });
    }

    console.log('🔐 Iniciando processo de autenticação OAuth com Mercado Livre');

    const clientId = process.env.ML_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json({ 
        error: 'ML_CLIENT_ID não configurado',
        message: 'Configure a variável de ambiente ML_CLIENT_ID'
      }, { status: 500 });
    }

    // Gerar parâmetros PKCE
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = generateCodeVerifier(); // usar como state também

    // Armazenar code verifier no cache (expira em 10 minutos)
    const kv = getKVClient();
    await kv.set(CACHE_KEYS.PKCE_VERIFIER(state), codeVerifier, { ex: 600 });
    
    console.log('✅ PKCE parâmetros gerados e armazenados');

    // Construir URL de autorização
    const baseUrl = request.nextUrl.origin;
    const authUrl = new URL(ML_CONFIG.AUTH_URL);
    
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', `${baseUrl}${API_ENDPOINTS.AUTH_ML_CALLBACK}`);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('scope', ML_CONFIG.SCOPES);

    console.log('🔗 URL de autorização gerada:', authUrl.toString());

    // Redirecionar para o Mercado Livre
    return NextResponse.redirect(authUrl.toString());

  } catch (error) {
    console.error('❌ Erro na inicialização OAuth:', error);
    return NextResponse.json({
      error: 'Falha na inicialização OAuth',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}