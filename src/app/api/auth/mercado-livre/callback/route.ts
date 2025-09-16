import { NextRequest, NextResponse } from 'next/server';
import { getKVClient } from '@/lib/cache';
import { cache } from '@/lib/cache';
import { ML_CONFIG, CACHE_KEYS, API_ENDPOINTS, PAGES } from '@/config/routes';

export async function GET(request: NextRequest) {
  try {
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
      await kv.del(CACHE_KEYS.PKCE_VERIFIER(state)); // Limpar por segurança
      return NextResponse.redirect(`${request.nextUrl.origin}${PAGES.ADMIN}?auth_error=invalid_state`);
    }

    // 2. Validar formato do state (deve ser string base64url válida)
    if (!/^[A-Za-z0-9_-]+$/.test(state) || state.length < 32) {
      console.error('❌ CSRF DETECTED: State com formato inválido:', state);
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
      console.error('❌ Erro ao buscar dados do usuário');
      return NextResponse.redirect(`${request.nextUrl.origin}${PAGES.ADMIN}?auth_error=user_data_failed`);
    }

    const userData = await userResponse.json();
    console.log('✅ Dados do usuário obtidos:', userData.id);

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