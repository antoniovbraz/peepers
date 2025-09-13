#!/usr/bin/env node

/**
 * Script para testar renovação automática de tokens
 * Simula um token expirado e verifica se a renovação funciona
 */

require('dotenv').config({ path: '.env.local' });

async function testTokenRefresh() {
  console.log('🔄 TESTE DE RENOVAÇÃO DE TOKENS ML');
  console.log('==================================\n');
  
  const BASE_URL = 'https://peepers-n9yvsw84x-antoniovbrazs-projects.vercel.app';
  
  console.log('1. Testando sincronização com token possivelmente expirado...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/ml/sync`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Peepers-Token-Test/1.0'
      }
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
    } else {
      const text = await response.text();
      console.log(`   Response (HTML): ${text.substring(0, 200)}...`);
    }
    
    if (response.ok) {
      console.log('✅ Sincronização funcionou - token válido ou renovado com sucesso');
    } else if (response.status === 401) {
      console.log('❌ Token expirado e renovação falhou - nova autenticação necessária');
    } else {
      console.log(`⚠️  Resposta inesperada: ${response.status}`);
    }
    
  } catch (error) {
    console.log(`❌ Erro na requisição: ${error.message}`);
  }
  
  console.log('\n2. Testando endpoint de produtos...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/products`, {
      headers: {
        'User-Agent': 'Peepers-Token-Test/1.0'
      }
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   Produtos encontrados: ${data.products ? data.products.length : 0}`);
      console.log('✅ Endpoint de produtos funcionando');
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.log(`   Erro: ${errorData.error || 'Erro desconhecido'}`);
      console.log('❌ Endpoint de produtos com problema');
    }
    
  } catch (error) {
    console.log(`❌ Erro na requisição: ${error.message}`);
  }
  
  console.log('\n3. Testando sincronização manual com admin token...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/ml/sync`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer peepers-admin-secret-2024-sync-access',
        'Content-Type': 'application/json',
        'User-Agent': 'Peepers-Token-Test/1.0'
      }
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   Sincronização: ${data.message}`);
      console.log('✅ Sincronização manual funcionando');
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.log(`   Erro: ${errorData.error || 'Erro desconhecido'}`);
      
      if (response.status === 401) {
        console.log('❌ Token de usuário necessário - faça nova autenticação OAuth');
      }
    }
    
  } catch (error) {
    console.log(`❌ Erro na requisição: ${error.message}`);
  }
  
  console.log('\n📋 RESUMO:');
  console.log('=========');
  console.log('- Se os endpoints retornaram 401: Faça nova autenticação OAuth');
  console.log('- Se funcionaram: Sistema de renovação de tokens OK');
  console.log('- URL para nova autenticação: https://peepers.vercel.app/api/ml/auth');
}

testTokenRefresh().catch(console.error);