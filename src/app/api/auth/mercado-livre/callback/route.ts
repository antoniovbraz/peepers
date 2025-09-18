import { NextRequest, NextResponse } from 'next/server';
import { getKVClient } from '@/lib/cache';
import { cache } from '@/lib/cache';
import { ML_CONFIG, CACHE_KEYS, API_ENDPOINTS, PAGES } from '@/config/routes';
import { checkLoginLimit } from '@/lib/rate-limiter';
import { logSecurityEvent, SecurityEventType } from '@/lib/security-events';

/**
 * OAuth 2.0 Callback Handler com PKCE e Proteção CSRF
 * 
 * Processa retorno do Mercado Livre após autorização do usuário:
 * 1. Valida parâmetros obrigatórios (code, state)
 * 2. Implementa proteção CSRF crítica via state validation
 * 3. Verifica PKCE code verifier armazenado no cache
 * 4. Realiza troca segura de código por token
 * 5. Busca dados do usuário autorizado
 * 6. Armazena sessão segura com cookies HttpOnly
 * 
 * Validações de Segurança Críticas:
 * - State parameter DEVE existir no cache (anti-CSRF)
 * - State format validation (Base64URL, min 32 chars)
 * - PKCE verifier matching (anti-interception)
 * - Client credentials validation
 * - Session token único por sessão
 * 
 * Conformidade LGPD:
 * - Dados mínimos necessários armazenados
 * - TTL definido para todos os caches
 * - Logs estruturados sem dados sensíveis
 * - Cookie flags: httpOnly, secure, sameSite=strict
 * 
 * @param request - NextRequest contendo query parameters do ML
 * @returns {Promise<NextResponse>} Redirect para admin ou erro
 */
export async function GET(request: NextRequest) {
  const clientIP = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown';

  try {
    // Rate limiting para callback de autenticação
    const rateLimitResult = await checkLoginLimit(clientIP);
    if (!rateLimitResult.allowed) {
      await logSecurityEvent({
        type: SecurityEventType.RATE_LIMIT_EXCEEDED,
        severity: 'MEDIUM',
        clientIP,
        details: {
          endpoint: '/api/auth/mercado-livre/callback',
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime,
          totalHits: rateLimitResult.totalHits
        }
      });

      return NextResponse.redirect(
        `${request.nextUrl.origin}${PAGES.ADMIN}?auth_error=rate_limit_exceeded`
      );
    }

    console.log('🔄 Callback OAuth ML iniciado');

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    console.log('Parâmetros recebidos:', { code: !!code, state: !!state, error });

    // Verificar se houve erro na autorização
    if (error) {
      console.error('❌ Erro na autorização:', error);
      return NextResponse.redirect(`${request.nextUrl.origin}${PAGES.ADMIN}?auth_error=${error}`);
    }

    // Verificar se temos código e state
    if (!code || !state) {
      console.error('❌ Código ou state ausente');
      return NextResponse.redirect(`${request.nextUrl.origin}${PAGES.ADMIN}?auth_error=missing_params`);
    }

    // Verificar credenciais
    const clientId = process.env.ML_CLIENT_ID;
    const clientSecret = process.env.ML_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      console.error('❌ Credenciais ML não configuradas');
      return NextResponse.redirect(`${request.nextUrl.origin}${PAGES.ADMIN}?auth_error=missing_credentials`);
    }

    // SEGURANÇA CRÍTICA: Validar state para prevenir ataques CSRF
    const kv = getKVClient();
    
    // 1. Verificar se o state existe no cache (prova que foi gerado por nós)
    const storedVerifier = await kv.get<string>(CACHE_KEYS.PKCE_VERIFIER(state));
    
    if (!storedVerifier) {
      console.error('❌ CSRF DETECTED: State inválido ou expirado:', state);
      
      // Log evento de segurança crítico
      await import('@/lib/security-events').then(m => m.logSecurityEvent({
        type: m.SecurityEventType.CSRF_DETECTED,
        severity: 'CRITICAL',
        clientIP: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        details: {
          provided_state: state,
          error: 'State not found in cache or expired',
          callback_url: request.nextUrl.toString()
        },
        path: request.nextUrl.pathname
      }));
      
      await kv.del(CACHE_KEYS.PKCE_VERIFIER(state)); // Limpar por segurança
      return NextResponse.redirect(`${request.nextUrl.origin}${PAGES.ADMIN}?auth_error=invalid_state`);
    }

    // 2. Validar formato do state (deve ser string base64url válida)
    if (!/^[A-Za-z0-9_-]+$/.test(state) || state.length < 32) {
      console.error('❌ CSRF DETECTED: State com formato inválido:', state);
      
      // Log evento de segurança crítico
      await import('@/lib/security-events').then(m => m.logSecurityEvent({
        type: m.SecurityEventType.CSRF_DETECTED,
        severity: 'CRITICAL',
        clientIP: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        details: {
          provided_state: state,
          state_length: state.length,
          error: 'Malformed state parameter',
          callback_url: request.nextUrl.toString()
        },
        path: request.nextUrl.pathname
      }));
      
      await kv.del(CACHE_KEYS.PKCE_VERIFIER(state));
      return NextResponse.redirect(`${request.nextUrl.origin}${PAGES.ADMIN}?auth_error=malformed_state`);
    }

    const codeVerifier = storedVerifier;
    console.log('✅ State validado com sucesso - CSRF protection OK');

    // Trocar código por token
    const tokenData = {
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      code_verifier: codeVerifier,
      redirect_uri: `${request.nextUrl.origin}${API_ENDPOINTS.AUTH_ML_CALLBACK}`
    };

    console.log('🔄 Trocando código por token...');
    
    const tokenResponse = await fetch(ML_CONFIG.TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams(tokenData).toString()
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ Erro ao trocar código por token:', errorText);
      return NextResponse.redirect(`${request.nextUrl.origin}${PAGES.ADMIN}?auth_error=token_exchange_failed`);
    }

    const tokenResult = await tokenResponse.json();
    console.log('✅ Token obtido com sucesso');

    // Buscar informações do usuário
    const userResponse = await fetch(ML_CONFIG.USER_ME, {
      headers: {
        'Authorization': `Bearer ${tokenResult.access_token}`
      }
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error('❌ Erro ao buscar dados do usuário:', errorText);
      
      // Tratamento específico para invalid_operator_user_id
      if (errorText.includes('invalid_operator_user_id') || userResponse.status === 403) {
        console.error('❌ ERRO: Usuario operador tentando login - apenas administradores são permitidos');
        return NextResponse.redirect(`${request.nextUrl.origin}${PAGES.ADMIN}?auth_error=operator_not_allowed&message=${encodeURIComponent('Apenas usuários administradores podem acessar o painel admin. Operadores devem usar outras ferramentas.')}`);
      }
      
      return NextResponse.redirect(`${request.nextUrl.origin}${PAGES.ADMIN}?auth_error=user_data_failed`);
    }

    const userData = await userResponse.json();
    console.log('✅ Dados do usuário obtidos:', { user_id: userData.id, nickname: userData.nickname, user_type: userData.user_type });

    // Verificar se é usuário administrador (não operador)
    if (userData.user_type === 'operator') {
      console.error('❌ ERRO: Usuario operador detectado após autenticação - apenas administradores são permitidos');
      return NextResponse.redirect(`${request.nextUrl.origin}${PAGES.ADMIN}?auth_error=operator_not_allowed&message=${encodeURIComponent('Apenas usuários administradores podem acessar o painel admin.')}`);
    }

    // Armazenar tokens no cache usando o método correto
    const userId = userData.id.toString();
    await cache.setUser(userId, {
      token: tokenResult.access_token,
      refresh_token: tokenResult.refresh_token,
      expires_at: new Date(Date.now() + (tokenResult.expires_in * 1000)).toISOString(),
      user_id: parseInt(userId, 10), // Converter para number
      scope: tokenResult.scope,
      token_type: tokenResult.token_type,
      // Adicionar dados da empresa
      company: userData.company || {},
      nickname: userData.nickname,
      name: userData.first_name + ' ' + userData.last_name,
      email: userData.email,
      country: userData.country_id,
      user_type: userData.user_type,
      site_id: userData.site_id,
      permalink: userData.permalink,
      seller_reputation: userData.seller_reputation || {},
      status: userData.status || {},
      connected_at: new Date().toISOString(),
      last_sync: new Date().toISOString()
    });

    // Limpar code verifier usado
    await kv.del(CACHE_KEYS.PKCE_VERIFIER(state));

    console.log('✅ Autenticação OAuth concluída com sucesso');

    // Criar resposta com cookies seguros
    const response = NextResponse.redirect(`${request.nextUrl.origin}${PAGES.ADMIN}?auth_success=true&user_id=${userId}`);

    // Cookie de sessão (token aleatório para validar sessão)
    const sessionToken = crypto.randomUUID();
    response.cookies.set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 horas
      path: '/'
    });

    // Cookie com user_id
    response.cookies.set('user_id', userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 horas
      path: '/'
    });

    // Armazenar session token no cache para validação
    const existingUserData = await cache.getUser(userId) || { user_id: parseInt(userId, 10) };
    await cache.setUser(userId, {
      ...existingUserData,
      session_token: sessionToken
    });

    return response;

  } catch (error) {
    console.error('❌ Erro no callback OAuth:', error);
    return NextResponse.redirect(`${request.nextUrl.origin}${PAGES.ADMIN}?auth_error=callback_failed`);
  }
}