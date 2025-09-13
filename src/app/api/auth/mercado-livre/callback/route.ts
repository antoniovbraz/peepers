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

    // Recuperar code verifier do cache
    const kv = getKVClient();
    const codeVerifier = await kv.get<string>(CACHE_KEYS.PKCE_VERIFIER(state));
    
    if (!codeVerifier) {
      console.error('❌ Code verifier não encontrado ou expirado');
      return NextResponse.redirect(`${request.nextUrl.origin}${PAGES.ADMIN}?auth_error=expired_session`);
    }

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

    // Armazenar tokens no cache
    const userId = userData.id.toString();
    await cache.setUser(CACHE_KEYS.USER_TOKEN(userId), {
      token: tokenResult.access_token,
      refresh_token: tokenResult.refresh_token,
      expires_at: new Date(Date.now() + (tokenResult.expires_in * 1000)).toISOString(),
      user_id: userId,
      scope: tokenResult.scope,
      token_type: tokenResult.token_type
    });

    // Limpar code verifier usado
    await kv.del(CACHE_KEYS.PKCE_VERIFIER(state));

    console.log('✅ Autenticação OAuth concluída com sucesso');

    // Redirecionar para admin com sucesso
    return NextResponse.redirect(`${request.nextUrl.origin}${PAGES.ADMIN}?auth_success=true&user_id=${userId}`);

  } catch (error) {
    console.error('❌ Erro no callback OAuth:', error);
    return NextResponse.redirect(`${request.nextUrl.origin}${PAGES.ADMIN}?auth_error=callback_failed`);
  }
}