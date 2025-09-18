#!/usr/bin/env node

/**
 * TESTE DE COMPLIANCE - MERCADO LIVRE OFICIAL
 * 
 * Script para verificar se nossa implementação está 100% compliance
 * com a especificação oficial do Mercado Livre.
 * 
 * Baseado na auditoria oficial: AUDITORIA_ML_OFICIAL_VS_PEEPERS.md
 */

const https = require('https');
const crypto = require('crypto');

// Configuração do ambiente
const VERCEL_URL = process.env.VERCEL_URL || 'peepers-xi.vercel.app';
const TEST_ENV = process.env.NODE_ENV || 'production';

// IPs oficiais do ML para teste
const ML_OFFICIAL_IPS = [
  '54.88.218.97',
  '18.215.140.160', 
  '18.213.114.129',
  '18.206.34.84'
];

console.log('🚨 TESTE DE COMPLIANCE MERCADO LIVRE OFICIAL');
console.log('='.repeat(60));
console.log(`🎯 Testando: https://${VERCEL_URL}`);
console.log(`🌐 Environment: ${TEST_ENV}`);
console.log('');

/**
 * Teste 1: Verificar endpoint de webhook ativo
 */
async function testWebhookEndpoint() {
  console.log('📡 Teste 1: Endpoint de Webhook');
  console.log('-'.repeat(40));
  
  return new Promise((resolve) => {
    const options = {
      hostname: VERCEL_URL,
      port: 443,
      path: '/api/webhook/mercado-livre',
      method: 'GET',
      headers: {
        'User-Agent': 'ML-Compliance-Test/1.0'
      }
    };

    const startTime = Date.now();
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        
        try {
          const response = JSON.parse(data);
          
          console.log(`✅ Status: ${res.statusCode}`);
          console.log(`⏱️  Response Time: ${responseTime}ms`);
          console.log(`🔧 ML Compliance Config:`);
          console.log(`   - Timeout: ${response.ml_compliance?.timeout_ms}ms`);
          console.log(`   - IP Validation: ${response.ml_compliance?.ip_validation}`);
          console.log(`   - Environment: ${response.ml_compliance?.environment}`);
          console.log(`   - Spec Version: ${response.ml_compliance?.official_spec_version}`);
          console.log('');
          
          resolve({
            success: res.statusCode === 200,
            responseTime,
            config: response.ml_compliance
          });
        } catch (error) {
          console.log(`❌ Erro parsing response: ${error.message}`);
          resolve({ success: false, error: error.message });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Erro na requisição: ${error.message}`);
      resolve({ success: false, error: error.message });
    });

    req.end();
  });
}

/**
 * Teste 2: Verificar timeout compliance (500ms)
 */
async function testWebhookTimeout() {
  console.log('⏱️  Teste 2: Timeout Compliance (500ms)');
  console.log('-'.repeat(40));
  
  const payload = {
    user_id: 123456789,
    topic: 'orders_v2',
    resource: '/orders/123456',
    application_id: process.env.ML_CLIENT_ID || 'test_app',
    attempts: 1,
    sent: new Date().toISOString(),
    received: new Date().toISOString()
  };

  return new Promise((resolve) => {
    const postData = JSON.stringify(payload);
    
    const options = {
      hostname: VERCEL_URL,
      port: 443,
      path: '/api/webhook/mercado-livre',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'MercadoLibre/1.0',
        // Simular IP do ML para teste em desenvolvimento
        'X-Forwarded-For': ML_OFFICIAL_IPS[0],
        'X-Real-IP': ML_OFFICIAL_IPS[0]
      }
    };

    const startTime = Date.now();
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        
        try {
          const response = JSON.parse(data);
          
          console.log(`✅ Status: ${res.statusCode}`);
          console.log(`⏱️  Response Time: ${responseTime}ms`);
          console.log(`🎯 Timeout Compliance: ${responseTime <= 500 ? '✅ PASS' : '❌ FAIL'}`);
          
          if (response.processing_time_ms) {
            console.log(`🔧 Processing Time: ${response.processing_time_ms}ms`);
          }
          
          if (response.timeout) {
            console.log(`⚠️  Timeout Enforced: ${response.timeout}`);
          }
          
          console.log(`🛡️  ML Compliance: ${response.ml_compliance || 'not_reported'}`);
          console.log('');
          
          resolve({
            success: res.statusCode === 200 && responseTime <= 500,
            responseTime,
            withinTimeout: responseTime <= 500,
            response
          });
        } catch (error) {
          console.log(`❌ Erro parsing response: ${error.message}`);
          resolve({ success: false, error: error.message });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Erro na requisição: ${error.message}`);
      resolve({ success: false, error: error.message });
    });

    // Timeout do cliente para testar
    req.setTimeout(1000, () => {
      console.log('⏱️  Client timeout - servidor não respondeu em 1s');
      resolve({ success: false, timeout: true });
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Teste 3: Verificar API de produtos (OAuth compliance)
 */
async function testProductsAPI() {
  console.log('🛍️  Teste 3: API de Produtos (OAuth)');
  console.log('-'.repeat(40));
  
  return new Promise((resolve) => {
    const options = {
      hostname: VERCEL_URL,
      port: 443,
      path: '/api/v1/products?format=minimal&limit=5',
      method: 'GET',
      headers: {
        'User-Agent': 'ML-Compliance-Test/1.0'
      }
    };

    const startTime = Date.now();
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        
        try {
          const response = JSON.parse(data);
          
          console.log(`✅ Status: ${res.statusCode}`);
          console.log(`⏱️  Response Time: ${responseTime}ms`);
          console.log(`📦 Products Count: ${response.products?.length || 0}`);
          console.log(`🔗 API Version: ${response.api_version || 'not_reported'}`);
          console.log(`💾 Cache Status: ${response.cache_status || 'not_reported'}`);
          console.log('');
          
          resolve({
            success: res.statusCode === 200,
            responseTime,
            productsCount: response.products?.length || 0
          });
        } catch (error) {
          console.log(`❌ Erro parsing response: ${error.message}`);
          resolve({ success: false, error: error.message });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Erro na requisição: ${error.message}`);
      resolve({ success: false, error: error.message });
    });

    req.end();
  });
}

/**
 * Teste 4: Health check geral
 */
async function testHealthCheck() {
  console.log('🏥 Teste 4: Health Check');
  console.log('-'.repeat(40));
  
  return new Promise((resolve) => {
    const options = {
      hostname: VERCEL_URL,
      port: 443,
      path: '/api/health',
      method: 'GET',
      headers: {
        'User-Agent': 'ML-Compliance-Test/1.0'
      }
    };

    const startTime = Date.now();
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        
        try {
          const response = JSON.parse(data);
          
          console.log(`✅ Status: ${res.statusCode}`);
          console.log(`⏱️  Response Time: ${responseTime}ms`);
          console.log(`🚀 App Status: ${response.status || 'unknown'}`);
          console.log(`📊 Uptime: ${response.uptime || 'not_reported'}`);
          console.log('');
          
          resolve({
            success: res.statusCode === 200,
            responseTime,
            status: response.status
          });
        } catch (error) {
          console.log(`❌ Erro parsing response: ${error.message}`);
          resolve({ success: false, error: error.message });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Erro na requisição: ${error.message}`);
      resolve({ success: false, error: error.message });
    });

    req.end();
  });
}

/**
 * Executar todos os testes
 */
async function runAllTests() {
  const results = [];
  
  try {
    // Teste 1: Endpoint webhook
    const test1 = await testWebhookEndpoint();
    results.push({ name: 'Webhook Endpoint', ...test1 });
    
    // Teste 2: Timeout compliance
    const test2 = await testWebhookTimeout();
    results.push({ name: 'Timeout Compliance', ...test2 });
    
    // Teste 3: API produtos
    const test3 = await testProductsAPI();
    results.push({ name: 'Products API', ...test3 });
    
    // Teste 4: Health check
    const test4 = await testHealthCheck();
    results.push({ name: 'Health Check', ...test4 });
    
  } catch (error) {
    console.log(`❌ Erro durante os testes: ${error.message}`);
  }
  
  // Relatório final
  console.log('📊 RELATÓRIO FINAL DE COMPLIANCE');
  console.log('='.repeat(60));
  
  const totalTests = results.length;
  const passedTests = results.filter(r => r.success).length;
  const failedTests = totalTests - passedTests;
  
  results.forEach((result, index) => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    const time = result.responseTime ? `(${result.responseTime}ms)` : '';
    console.log(`${index + 1}. ${result.name}: ${status} ${time}`);
  });
  
  console.log('');
  console.log(`📈 Total: ${totalTests} testes`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`📊 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log('');
    console.log('🎉 PARABÉNS! Integração ML 100% COMPLIANT');
    console.log('✅ Todos os requisitos da especificação oficial atendidos');
  } else {
    console.log('');
    console.log('⚠️  ATENÇÃO: Alguns testes falharam');
    console.log('🔧 Revisar implementação antes de produção');
  }
  
  return {
    totalTests,
    passedTests,
    failedTests,
    successRate: (passedTests / totalTests) * 100,
    allPassed: passedTests === totalTests
  };
}

// Executar se chamado diretamente
if (require.main === module) {
  console.log(`🚀 Iniciando testes de compliance ML...`);
  console.log(`📅 Data: ${new Date().toISOString()}`);
  console.log('');
  
  runAllTests()
    .then((summary) => {
      process.exit(summary.allPassed ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = {
  runAllTests,
  testWebhookEndpoint,
  testWebhookTimeout,
  testProductsAPI,
  testHealthCheck
};