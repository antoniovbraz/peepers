#!/usr/bin/env node

/**
 * SCRIPT DE TESTE PARA WEBHOOKS - PRODUÇÃO
 *
 * Testa validações críticas de webhook em ambiente de produção (Vercel)
 * Use este script APENAS em produção com HTTPS
 *
 * ❌ NÃO use em desenvolvimento local
 * ✅ Use apenas com URLs do Vercel
 *
 * Uso: node test-webhook-security.js https://your-app.vercel.app
 */

const https = require('https');
const http = require('http');

const WEBHOOK_TEST_URL = process.argv[2];
const ML_VALID_IPS = ['54.88.218.97', '18.215.140.160', '18.213.114.129', '18.206.34.84'];

if (!WEBHOOK_TEST_URL) {
  console.error('❌ Uso: node test-webhook-security.js https://your-app.vercel.app');
  console.error('📚 Certifique-se de usar uma URL HTTPS pública (Vercel)');
  process.exit(1);
}

// Validação básica da URL
if (!WEBHOOK_TEST_URL.startsWith('https://')) {
  console.error('❌ ERRO: Use apenas URLs HTTPS (obrigatório pelo ML)');
  console.error('✅ Exemplo: https://your-app.vercel.app');
  process.exit(1);
}

console.log('🚀 Iniciando testes de webhook security...');
console.log(`📍 URL de teste: ${WEBHOOK_TEST_URL}`);
console.log('');

// ==================== TESTE 1: IP VÁLIDO ====================
console.log('🧪 TESTE 1: IP válido do ML');
console.log('📡 Testando IP: 54.88.218.97 (válido)');

const testValidIP = () => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      topic: 'orders_v2',
      test_ip: '54.88.218.97'
    });

    const url = new URL(`${WEBHOOK_TEST_URL}/api/test-webhook-security`);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'ML-Webhook-Test/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 200 && response.testMode) {
            console.log('✅ SUCESSO: IP válido aceito');
            console.log(`   Status: ${res.statusCode}`);
            console.log(`   Tempo: ${response.processing_time_ms}ms`);
            resolve(true);
          } else {
            console.log('❌ FALHA: Resposta inesperada');
            console.log(`   Status: ${res.statusCode}`);
            console.log(`   Response:`, response);
            resolve(false);
          }
        } catch (e) {
          console.log('❌ ERRO: Resposta inválida');
          console.log('   Data:', data);
          resolve(false);
        }
      });
    });

    req.on('error', (e) => {
      console.log('❌ ERRO de conexão:', e.message);
      resolve(false);
    });

    req.write(postData);
    req.end();
  });
};

// ==================== TESTE 2: IP INVÁLIDO ====================
console.log('');
console.log('🧪 TESTE 2: IP inválido (não do ML)');
console.log('📡 Testando IP: 192.168.1.1 (inválido)');

const testInvalidIP = () => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      topic: 'orders_v2',
      test_ip: '192.168.1.1'
    });

    const url = new URL(`${WEBHOOK_TEST_URL}/api/test-webhook-security`);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'ML-Webhook-Test/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 403 && response.error === 'Unauthorized IP') {
            console.log('✅ SUCESSO: IP inválido rejeitado corretamente');
            console.log(`   Status: ${res.statusCode}`);
            console.log(`   Error: ${response.error}`);
            resolve(true);
          } else {
            console.log('❌ FALHA: IP inválido não foi rejeitado');
            console.log(`   Status: ${res.statusCode}`);
            console.log(`   Response:`, response);
            resolve(false);
          }
        } catch (e) {
          console.log('❌ ERRO: Resposta inválida');
          console.log('   Data:', data);
          resolve(false);
        }
      });
    });

    req.on('error', (e) => {
      console.log('❌ ERRO de conexão:', e.message);
      resolve(false);
    });

    req.write(postData);
    req.end();
  });
};

// ==================== TESTE 3: TIMEOUT ====================
console.log('');
console.log('🧪 TESTE 3: Timeout enforcement');
console.log('⏱️  Testando delay de 600ms (deve exceder 500ms)');

const testTimeout = () => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      topic: 'orders_v2',
      simulate_delay: 600
    });

    const url = new URL(`${WEBHOOK_TEST_URL}/api/test-webhook-security`);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'ML-Webhook-Test/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 200 && response.warning?.includes('timeout')) {
            console.log('✅ SUCESSO: Timeout detectado e alertado');
            console.log(`   Status: ${res.statusCode}`);
            console.log(`   Tempo: ${response.processing_time_ms}ms`);
            console.log(`   Warning: ${response.warning}`);
            resolve(true);
          } else {
            console.log('❌ FALHA: Timeout não foi detectado corretamente');
            console.log(`   Status: ${res.statusCode}`);
            console.log(`   Response:`, response);
            resolve(false);
          }
        } catch (e) {
          console.log('❌ ERRO: Resposta inválida');
          console.log('   Data:', data);
          resolve(false);
        }
      });
    });

    req.on('error', (e) => {
      console.log('❌ ERRO de conexão:', e.message);
      resolve(false);
    });

    req.write(postData);
    req.end();
  });
};

// ==================== EXECUÇÃO DOS TESTES ====================
async function runTests() {
  console.log('🔧 Executando testes de segurança de webhook...\n');

  const results = [];

  // Teste 1: IP válido
  results.push(await testValidIP());

  // Teste 2: IP inválido
  results.push(await testInvalidIP());

  // Teste 3: Timeout
  results.push(await testTimeout());

  // Resultado final
  console.log('\n📊 RESULTADO DOS TESTES:');
  const passed = results.filter(r => r).length;
  const total = results.length;

  console.log(`✅ Aprovados: ${passed}/${total}`);
  console.log(`❌ Reprovados: ${total - passed}/${total}`);

  if (passed === total) {
    console.log('\n🎉 TODOS OS TESTES APROVADOS!');
    console.log('✅ Webhook security está funcionando corretamente');
  } else {
    console.log('\n⚠️  Alguns testes falharam');
    console.log('🔧 Verifique a implementação de segurança');
  }

  console.log('\n📚 PRÓXIMOS PASSOS:');
  console.log('1. Configure webhook URL no painel do ML Developer');
  console.log('2. Use apenas IPs oficiais do ML em produção');
  console.log('3. Monitore tempo de resposta (< 500ms)');
  console.log('4. Implemente alertas para timeouts críticos');
}

runTests().catch(console.error);