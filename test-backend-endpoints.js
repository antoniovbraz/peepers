#!/usr/bin/env node

/**
 * Script para testar todos os endpoints da API do Mercado Livre
 * Verifica se os endpoints estão funcionando corretamente
 */

require('dotenv').config({ path: '.env.local' });

const BASE_URL = process.env.NEXTAUTH_URL || 'https://peepers.vercel.app';

async function testEndpoint(path, method = 'GET', body = null) {
  try {
    console.log(`\n🔍 Testando: ${method} ${path}`);
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Peepers-Backend-Test/1.0'
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${BASE_URL}${path}`, options);
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}`);
    
    const contentType = response.headers.get('content-type');
    let responseData;
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
      console.log(`   Response: ${JSON.stringify(responseData, null, 2)}`);
    } else {
      const text = await response.text();
      console.log(`   Response (${contentType}): ${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`);
    }
    
    return {
      path,
      method,
      status: response.status,
      success: response.ok,
      response: responseData,
      contentType
    };
    
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`);
    return {
      path,
      method,
      status: 'ERROR',
      success: false,
      error: error.message
    };
  }
}

async function runTests() {
  console.log('🧪 TESTE COMPLETO DOS ENDPOINTS ML');
  console.log('===================================');
  console.log(`Base URL: ${BASE_URL}\n`);
  
  const results = [];
  
  // Testar endpoints do ML
  const endpoints = [
    { path: '/api/ml/auth', method: 'GET' },
    { path: '/api/ml/test-token', method: 'GET' },
    { path: '/api/ml/sync', method: 'GET' },
    { path: '/api/ml/sync', method: 'POST' },
    { path: '/api/products', method: 'GET' },
    { path: '/api/products/123', method: 'GET' }
  ];
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint.path, endpoint.method);
    results.push(result);
    
    // Pausa entre requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📊 RESUMO DOS TESTES:');
  console.log('=====================');
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.method} ${result.path} - ${result.status}`);
  });
  
  const successCount = results.filter(r => r.success).length;
  console.log(`\n📈 Taxa de sucesso: ${successCount}/${results.length} (${Math.round(successCount/results.length*100)}%)`);
  
  // Identificar problemas específicos
  const failures = results.filter(r => !r.success);
  if (failures.length > 0) {
    console.log('\n🚨 PROBLEMAS IDENTIFICADOS:');
    failures.forEach(failure => {
      console.log(`   • ${failure.path}: ${failure.status} - ${failure.error || 'Endpoint não está respondendo corretamente'}`);
    });
  }
  
  return results;
}

// Executar testes
runTests().catch(console.error);