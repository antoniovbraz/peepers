import { NextRequest, NextResponse } from 'next/server';
import { getKVClient } from '@/lib/cache';
import { ML_CONFIG, CACHE_KEYS, API_ENDPOINTS } from '@/config/routes';

// Função para gerar code verifier PKCE
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode.apply(null, Array.from(array)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Função para gerar code challenge PKCE
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(digest))))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export async function GET(request: NextRequest) {
  try {
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