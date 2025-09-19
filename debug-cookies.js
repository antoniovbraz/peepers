#!/usr/bin/env node

// Teste específico para debug de cookies após OAuth
const https = require('https');

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

async function testCookieIssue() {
  console.log('🍪 TESTE DE COOKIES APÓS OAUTH\n');

  try {
    console.log('1. Testando callback simulado...');
    // Simular callback com user_id que vimos na URL
    const callbackTest = await makeRequest(`${BASE_URL}/api/auth/mercado-livre/callback?code=test_code&state=test_state`);
    console.log(`Callback Status: ${callbackTest.status}`);
    console.log('Set-Cookie headers:', callbackTest.headers['set-cookie'] || 'NENHUM');
    
    if (callbackTest.status === 307) {
      console.log('Redirect para:', callbackTest.headers.location);
    }

    console.log('\n2. Testando admin com user_id conhecido...');
    const adminTest = await makeRequest(`${BASE_URL}/admin?auth_success=true&user_id=669073070`);
    console.log(`Admin Status: ${adminTest.status}`);
    
    console.log('\n3. Testando auth/me...');
    const authTest = await makeRequest(`${BASE_URL}/api/auth/me`);
    console.log(`Auth/me Status: ${authTest.status}`);
    
    try {
      const authData = JSON.parse(authTest.data);
      console.log('Auth response:', authData);
    } catch (e) {
      console.log('Auth response (raw):', authTest.data.substring(0, 200));
    }

  } catch (error) {
    console.error('❌ Erro durante teste:', error.message);
  }
}

async function analyzeIssue() {
  console.log('\n🔧 ANÁLISE DO PROBLEMA DE COOKIES:\n');
  
  console.log('❌ SINTOMAS OBSERVADOS:');
  console.log('1. URL mostra auth_success=true&user_id=669073070');
  console.log('2. Página fica em loop "Verificando autenticação..."');
  console.log('3. Script de debug mostra cookies MISSING');
  console.log('4. Erro 404 em chunk JavaScript');
  console.log('');
  
  console.log('🔍 POSSÍVEIS CAUSAS:');
  console.log('1. Cookies não sendo definidos no callback');
  console.log('2. Configuração sameSite/secure incompatível');
  console.log('3. Domain/path incorreto nos cookies');
  console.log('4. Timeout no callback impedindo definição');
  console.log('5. EntitlementsGuard ainda interferindo');
  console.log('');
  
  console.log('🚀 CORREÇÕES NECESSÁRIAS:');
  console.log('1. Ajustar configurações de cookies');
  console.log('2. Adicionar logs no callback');
  console.log('3. Testar cookies menos restritivos');
  console.log('4. Verificar se cache está funcionando');
}

// Executar diagnóstico
testCookieIssue().then(() => {
  analyzeIssue();
});