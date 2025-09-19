#!/usr/bin/env node

// Debug script para verificar autenticação real na produção
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

async function testAuthentication() {
  console.log('🚀 Testando Autenticação Real na Produção\n');

  try {
    // 1. Verificar se precisa fazer login
    console.log('1. Verificando status da autenticação...');
    const authCheck = await makeRequest(`${BASE_URL}/api/auth/me`);
    console.log(`Status: ${authCheck.status}`);
    
    let authData;
    try {
      authData = JSON.parse(authCheck.data);
      console.log('Response:', JSON.stringify(authData, null, 2));
    } catch (e) {
      console.log('Response (raw):', authCheck.data);
    }

    if (authCheck.status === 401) {
      console.log('\n❌ Usuário não autenticado');
      console.log('\n📋 AÇÕES NECESSÁRIAS:');
      console.log('1. Acesse: https://peepers.vercel.app/admin');
      console.log('2. Faça Login: Através do Mercado Livre');
      console.log('3. Verifique: Se o dashboard carrega com seus produtos reais');
      console.log('\nApós fazer login, execute este script novamente.');
      return;
    }

    // 2. Se autenticado, testar API de produtos
    if (authCheck.status === 200) {
      console.log('\n2. Testando API de produtos...');
      const productsTest = await makeRequest(`${BASE_URL}/api/products?format=summary&limit=10`);
      console.log(`Status: ${productsTest.status}`);
      
      let productsData;
      try {
        productsData = JSON.parse(productsTest.data);
        console.log('Products Response:', JSON.stringify(productsData, null, 2));
      } catch (e) {
        console.log('Products Response (raw):', productsTest.data);
      }

      // 3. Testar configurações
      console.log('\n3. Testando página de configurações...');
      const configTest = await makeRequest(`${BASE_URL}/admin/configuracoes`);
      console.log(`Status: ${configTest.status}`);
      console.log('Content-Type:', configTest.headers['content-type']);
      
      if (configTest.status !== 200) {
        console.log('Config Response Preview:', configTest.data.substring(0, 500));
      }
    }

  } catch (error) {
    console.error('❌ Erro durante teste:', error.message);
  }
}

async function analyzeMLCompliance() {
  console.log('\n🔍 ANÁLISE DE CONFORMIDADE ML API\n');
  
  console.log('📋 PROBLEMAS IDENTIFICADOS:');
  console.log('');
  
  console.log('🚨 CRÍTICOS (Implementar Imediatamente):');
  console.log('1. ❌ Webhook Response Time: Não limitado a 500ms');
  console.log('2. ❌ IP Whitelist: Aceita webhooks de qualquer IP');
  console.log('3. ❌ User Rate Limiting: Apenas app-level, falta 5K/dia per user');
  console.log('4. ❌ Token Refresh: Pode ter problemas de rotação');
  console.log('');
  
  console.log('⚠️ IMPORTANTES (30 dias):');
  console.log('1. ❌ Missed Feeds Recovery: Não implementado');
  console.log('2. ❌ Webhook Signature: Não valida assinatura');
  console.log('3. ❌ Enhanced Error Handling: Limitado');
  console.log('4. ❌ Structured Logging: Parcial');
  console.log('');
  
  console.log('🔧 PRÓXIMAS AÇÕES:');
  console.log('1. Implementar timeout de 500ms em webhooks');
  console.log('2. Adicionar validação de IP para webhooks');
  console.log('3. Implementar rate limiting por usuário');
  console.log('4. Melhorar sistema de refresh de tokens');
  console.log('5. Adicionar missed feeds recovery');
}

// Executar testes
testAuthentication().then(() => {
  analyzeMLCompliance();
});