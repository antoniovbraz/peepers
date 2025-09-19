#!/usr/bin/env node

// Comprehensive authentication flow test script
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

async function testAuthenticationFlow() {
  console.log('🔍 TESTE COMPLETO DE AUTENTICAÇÃO - MERCADO LIVRE\n');
  console.log('='.repeat(60));

  try {
    // 1. Verificar status básico de autenticação
    console.log('\n1. 📊 VERIFICANDO STATUS DE AUTENTICAÇÃO');
    console.log('-'.repeat(40));
    
    const statusCheck = await makeRequest(`${BASE_URL}/api/auth/status`);
    console.log(`Status: ${statusCheck.status}`);
    
    if (statusCheck.status === 200) {
      try {
        const statusData = JSON.parse(statusCheck.data);
        console.log('Auth Status:', JSON.stringify(statusData, null, 2));
        
        if (!statusData.authenticated) {
          console.log('\n❌ NÃO AUTENTICADO - Precisa fazer login');
          console.log('\n📋 PRÓXIMOS PASSOS:');
          console.log('1. Acesse: https://peepers.vercel.app/login');
          console.log('2. Clique: "Continuar com Mercado Livre"');
          console.log('3. Complete o OAuth do ML');
          console.log('4. Execute este script novamente');
          return;
        } else {
          console.log('✅ COOKIES DE AUTENTICAÇÃO PRESENTES');
        }
      } catch (e) {
        console.log('Status Response (raw):', statusCheck.data);
      }
    } else {
      console.log('❌ Erro ao verificar status:', statusCheck.status);
      return;
    }

    // 2. Diagnóstico detalhado de cache e tokens
    console.log('\n2. 🔍 DIAGNÓSTICO DETALHADO DE CACHE E TOKENS');
    console.log('-'.repeat(40));
    
    const debugCheck = await makeRequest(`${BASE_URL}/api/auth/debug`);
    console.log(`Debug Status: ${debugCheck.status}`);
    
    if (debugCheck.status === 200) {
      try {
        const debugData = JSON.parse(debugCheck.data);
        console.log('Cache Debug:', JSON.stringify(debugData, null, 2));
        
        if (debugData.errors && debugData.errors.length > 0) {
          console.log('\n⚠️  PROBLEMAS ENCONTRADOS:');
          debugData.errors.forEach(error => console.log(`   - ${error}`));
        }
        
        if (debugData.validation.auth_ready) {
          console.log('\n✅ AUTENTICAÇÃO COMPLETA E PRONTA');
        } else {
          console.log('\n❌ AUTENTICAÇÃO INCOMPLETA');
          console.log('   - Session Valid:', debugData.validation.session_valid);
          console.log('   - Token Available:', debugData.validation.token_available);
        }
      } catch (e) {
        console.log('Debug Response (raw):', debugCheck.data);
      }
    } else {
      console.log('❌ Erro no debug:', debugCheck.status);
    }

    // 3. Testar endpoint /api/auth/me
    console.log('\n3. 👤 TESTANDO ENDPOINT /api/auth/me');
    console.log('-'.repeat(40));
    
    const meCheck = await makeRequest(`${BASE_URL}/api/auth/me`);
    console.log(`Me Status: ${meCheck.status}`);
    
    if (meCheck.status === 200) {
      try {
        const meData = JSON.parse(meCheck.data);
        console.log('User Data:', JSON.stringify(meData, null, 2));
      } catch (e) {
        console.log('Me Response (raw):', meCheck.data);
      }
    } else {
      console.log('❌ Erro em /api/auth/me:', meCheck.status);
    }

    // 4. Testar API de produtos (o que está falhando)
    console.log('\n4. 🛍️  TESTANDO API DE PRODUTOS (PROBLEMA ATUAL)');
    console.log('-'.repeat(40));
    
    const productsCheck = await makeRequest(`${BASE_URL}/api/products?format=summary&limit=10`);
    console.log(`Products Status: ${productsCheck.status}`);
    
    if (productsCheck.status === 200) {
      try {
        const productsData = JSON.parse(productsCheck.data);
        console.log('Products Response:', JSON.stringify(productsData, null, 2));
        console.log('\n✅ SUCESSO! API de produtos funcionando');
      } catch (e) {
        console.log('Products Response (raw):', productsCheck.data.substring(0, 1000));
      }
    } else if (productsCheck.status === 401) {
      console.log('❌ 401 UNAUTHORIZED - Token/sessão inválidos');
      try {
        const errorData = JSON.parse(productsCheck.data);
        console.log('Error Details:', JSON.stringify(errorData, null, 2));
      } catch (e) {
        console.log('Error Response (raw):', productsCheck.data);
      }
    } else if (productsCheck.status === 500) {
      console.log('❌ 500 INTERNAL SERVER ERROR - Erro no código do servidor');
      console.log('Response Preview:', productsCheck.data.substring(0, 1000));
    } else {
      console.log('❌ Erro inesperado:', productsCheck.status);
      console.log('Response Preview:', productsCheck.data.substring(0, 500));
    }

    // 5. Resumo e próximos passos
    console.log('\n5. 📋 RESUMO E PRÓXIMOS PASSOS');
    console.log('-'.repeat(40));
    
    if (productsCheck.status === 200) {
      console.log('🎉 TUDO FUNCIONANDO! OAuth e API de produtos OK');
    } else if (productsCheck.status === 401) {
      console.log('🔧 PROBLEMA: Autenticação/token inválido');
      console.log('   → Faça logout e login novamente');
      console.log('   → Verifique se completou OAuth do ML corretamente');
    } else if (productsCheck.status === 500) {
      console.log('🐛 PROBLEMA: Erro interno do servidor');
      console.log('   → Verifique logs do Vercel Functions');
      console.log('   → Problema no código da API');
    } else {
      console.log('❓ PROBLEMA DESCONHECIDO');
      console.log('   → Status code inesperado:', productsCheck.status);
    }

  } catch (error) {
    console.error('\n❌ ERRO DURANTE TESTE:', error.message);
  }
}

// Executar teste
testAuthenticationFlow();