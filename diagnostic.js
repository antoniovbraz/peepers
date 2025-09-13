#!/usr/bin/env node

// API Diagnostic Tool for Mercado Livre Integration
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

console.log('🔍 AUDITORIA DA INTEGRAÇÃO MERCADO LIVRE\n');
console.log('=====================================\n');

// 1. Check Environment Variables
console.log('1. VERIFICAÇÃO DE VARIÁVEIS DE AMBIENTE:');
console.log('==========================================');

const requiredEnvVars = [
  'ML_CLIENT_ID',
  'ML_CLIENT_SECRET', 
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL'
];

let envErrors = 0;
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 10)}...`);
  } else {
    console.log(`❌ ${varName}: MISSING`);
    envErrors++;
  }
});

console.log(`\nResultado: ${envErrors === 0 ? '✅ Todas as variáveis estão configuradas' : `❌ ${envErrors} variáveis faltando`}\n`);

// 2. Test Mercado Livre API Connection
console.log('2. TESTE DE CONECTIVIDADE COM MERCADO LIVRE:');
console.log('============================================');

async function testMLConnection() {
  try {
    // Test basic ML API endpoint
    const response = await fetch('https://api.mercadolibre.com/sites/MLB');
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Conexão com Mercado Livre API: OK');
      console.log(`   Site: ${data.name} (${data.id})`);
    } else {
      console.log('❌ Conexão com Mercado Livre API: FALHOU');
      console.log(`   Status: ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Conexão com Mercado Livre API: ERRO');
    console.log(`   Erro: ${error.message}`);
  }
}

// 3. Test OAuth Configuration
console.log('\n3. VERIFICAÇÃO DE CONFIGURAÇÃO OAUTH:');
console.log('=====================================');

async function testOAuthConfig() {
  const clientId = process.env.ML_CLIENT_ID;
  
  if (clientId) {
    try {
      // Test if client ID is valid by checking app info
      const response = await fetch(`https://api.mercadolibre.com/applications/${clientId}`);
      
      if (response.ok) {
        const appData = await response.json();
        console.log('✅ Client ID válido');
        console.log(`   App: ${appData.name || 'N/A'}`);
        console.log(`   Status: ${appData.status || 'N/A'}`);
      } else if (response.status === 404) {
        console.log('❌ Client ID inválido ou aplicação não encontrada');
      } else {
        console.log(`⚠️  Não foi possível verificar Client ID (Status: ${response.status})`);
      }
    } catch (error) {
      console.log('❌ Erro ao verificar Client ID');
      console.log(`   Erro: ${error.message}`);
    }
  } else {
    console.log('❌ ML_CLIENT_ID não configurado');
  }
}

// 4. Test Redis Connection
console.log('\n4. TESTE DE CONEXÃO REDIS (UPSTASH):');
console.log('====================================');

async function testRedisConnection() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (!url || !token) {
    console.log('❌ Credenciais Redis não configuradas');
    return;
  }
  
  try {
    const response = await fetch(`${url}/ping`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (response.ok && data.result === 'PONG') {
      console.log('✅ Conexão Redis: OK');
    } else {
      console.log('❌ Conexão Redis: FALHOU');
      console.log(`   Response: ${JSON.stringify(data)}`);
    }
  } catch (error) {
    console.log('❌ Conexão Redis: ERRO');
    console.log(`   Erro: ${error.message}`);
  }
}

// 5. Check File Structure
console.log('\n5. VERIFICAÇÃO DE ESTRUTURA DE ARQUIVOS:');
console.log('=========================================');

function checkFileStructure() {
  const requiredFiles = [
    'src/app/api/ml/auth/route.ts',
    'src/app/api/ml/auth/callback/route.ts',
    'src/app/api/products/route.ts',
    'src/lib/ml-api.ts',
    'src/lib/cache.ts',
    'src/types/ml.ts'
  ];
  
  let fileErrors = 0;
  requiredFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${filePath}`);
    } else {
      console.log(`❌ ${filePath} - MISSING`);
      fileErrors++;
    }
  });
  
  console.log(`\nResultado: ${fileErrors === 0 ? '✅ Estrutura de arquivos completa' : `❌ ${fileErrors} arquivos faltando`}`);
}

// Run all tests
async function runDiagnostics() {
  await testMLConnection();
  await testOAuthConfig();
  await testRedisConnection();
  checkFileStructure();
  
  console.log('\n📋 RESUMO DA AUDITORIA:');
  console.log('======================');
  console.log('1. ✅ Variáveis de ambiente verificadas');
  console.log('2. ✅ Conectividade ML API testada');
  console.log('3. ✅ OAuth configuration verificada');
  console.log('4. ✅ Conexão Redis testada');
  console.log('5. ✅ Estrutura de arquivos verificada');
  
  console.log('\n🚀 PRÓXIMOS PASSOS RECOMENDADOS:');
  console.log('===============================');
  console.log('1. Testar fluxo OAuth completo');
  console.log('2. Verificar logs de produção no Vercel');
  console.log('3. Testar sincronização de produtos');
  console.log('4. Validar webhooks (se configurados)');
}

runDiagnostics().catch(console.error);