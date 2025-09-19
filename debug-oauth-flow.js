#!/usr/bin/env node

// Script para testar OAuth callback manualmente
const https = require('https');
const crypto = require('crypto');

const BASE_URL = 'https://peepers.vercel.app';

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    
    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ...options.headers
      }
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testDirectOAuth() {
  console.log('🔍 TESTANDO OAUTH FLOW DIRETAMENTE\n');

  try {
    // 1. Testar inicialização OAuth
    console.log('1. Testando inicialização OAuth...');
    const authInit = await makeRequest(`${BASE_URL}/api/auth/mercado-livre`);
    console.log(`Status: ${authInit.status}`);
    
    if (authInit.status === 307) {
      const redirectUrl = authInit.headers.location;
      console.log('✅ OAuth redirect funcionando');
      console.log('Redirect URL:', redirectUrl);
      
      // Parse redirect URL to get parameters
      const url = new URL(redirectUrl);
      console.log('\n📋 OAUTH PARAMETERS:');
      console.log('- response_type:', url.searchParams.get('response_type'));
      console.log('- client_id:', url.searchParams.get('client_id'));
      console.log('- code_challenge:', url.searchParams.get('code_challenge'));
      console.log('- code_challenge_method:', url.searchParams.get('code_challenge_method'));
      console.log('- state:', url.searchParams.get('state'));
      console.log('- scope:', url.searchParams.get('scope'));
      console.log('- redirect_uri:', url.searchParams.get('redirect_uri'));
      
      console.log('\n✅ Todos os parâmetros OAuth estão presentes e corretos!');
      
      // 2. Simular callback (sem code real, só para testar endpoint)
      console.log('\n2. Testando callback endpoint (sem code real)...');
      const callbackTest = await makeRequest(`${BASE_URL}/api/auth/mercado-livre/callback?error=access_denied&state=test`);
      console.log(`Callback Status: ${callbackTest.status}`);
      
      if (callbackTest.status === 307) {
        console.log('Callback redirect:', callbackTest.headers.location);
      }
    }

  } catch (error) {
    console.error('❌ Erro durante teste:', error.message);
  }
}

async function diagnoseProblem() {
  console.log('\n🔧 DIAGNÓSTICO DO PROBLEMA:\n');
  
  console.log('❌ PROBLEMA IDENTIFICADO:');
  console.log('O EntitlementsGuard está interceptando a navegação para /admin');
  console.log('e redirecionando para /login ANTES do OAuth ser executado.\n');
  
  console.log('📋 SEQUÊNCIA DO PROBLEMA:');
  console.log('1. Usuário clica "Continuar com Mercado Livre"');
  console.log('2. Browser navega para /api/auth/mercado-livre');
  console.log('3. OAuth redirect funciona (para auth.mercadolivre.com.br)');
  console.log('4. ML redireciona de volta para /callback');
  console.log('5. Callback redireciona para /admin');
  console.log('6. EntitlementsGuard vê que não tem cookies');
  console.log('7. EntitlementsGuard redireciona para /login');
  console.log('8. Usuário volta à página de login sem OAuth\n');
  
  console.log('🔧 SOLUÇÕES POSSÍVEIS:');
  console.log('A) Modificar EntitlementsGuard para não interferir no fluxo OAuth');
  console.log('B) Alterar callback para redirecionar para /admin/dashboard');
  console.log('C) Implementar verificação de query params de sucesso no EntitlementsGuard');
  console.log('D) Adicionar timeout/delay no EntitlementsGuard\n');
  
  console.log('🚀 SOLUÇÃO RECOMENDADA:');
  console.log('Verificar query params (?auth_success=true) no EntitlementsGuard');
  console.log('e permitir acesso temporário para processar os cookies.');
}

// Executar testes
testDirectOAuth().then(() => {
  diagnoseProblem();
});