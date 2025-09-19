#!/usr/bin/env node

// Debug script para verificar variáveis de ambiente ML na produção
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

async function debugEnvironment() {
  console.log('🔍 DEBUGGING ENVIRONMENT VARIABLES AND AUTH FLOW\n');

  try {
    // 1. Testar se ML_CLIENT_ID está configurado
    console.log('1. Testando OAuth initialization endpoint...');
    const authInit = await makeRequest(`${BASE_URL}/api/auth/mercado-livre`);
    console.log(`Status: ${authInit.status}`);
    
    if (authInit.status === 500) {
      console.log('❌ ERRO 500 - Provavelmente ML_CLIENT_ID não configurado');
      try {
        const errorData = JSON.parse(authInit.data);
        console.log('Error Response:', JSON.stringify(errorData, null, 2));
      } catch (e) {
        console.log('Error Response (raw):', authInit.data);
      }
    } else if (authInit.status === 302 || authInit.status === 307) {
      console.log('✅ OAuth redirect funcionando');
      console.log('Location:', authInit.headers.location);
      
      if (authInit.headers.location && authInit.headers.location.includes('auth.mercadolivre.com.br')) {
        console.log('✅ Redirect para ML OAuth correto');
      } else {
        console.log('❌ Redirect incorreto');
      }
    }

    // 2. Testar endpoint de debug de ambiente
    console.log('\n2. Testando debug environment endpoint...');
    const debugEnv = await makeRequest(`${BASE_URL}/api/debug-env`);
    console.log(`Status: ${debugEnv.status}`);
    
    if (debugEnv.status === 200) {
      try {
        const envData = JSON.parse(debugEnv.data);
        console.log('Environment Debug:', JSON.stringify(envData, null, 2));
      } catch (e) {
        console.log('Environment Debug (raw):', debugEnv.data);
      }
    }

    // 3. Verificar se existe endpoint de configurações ML
    console.log('\n3. Verificando configurações ML...');
    const mlConfig = await makeRequest(`${BASE_URL}/api/config/ml`);
    console.log(`ML Config Status: ${mlConfig.status}`);

  } catch (error) {
    console.error('❌ Erro durante debug:', error.message);
  }
}

async function analyzeIssue() {
  console.log('\n🔧 ANÁLISE DO PROBLEMA:\n');
  
  console.log('📋 SINTOMAS OBSERVADOS:');
  console.log('1. ❌ Botão "Continuar com Mercado Livre" não abre popup ML');
  console.log('2. ❌ Vai direto para /admin sem autenticação real');
  console.log('3. ❌ URL mostra sucesso mas dados são mock');
  console.log('4. ❌ /api/products retorna 401 (não autenticado)');
  console.log('');
  
  console.log('🔍 POSSÍVEIS CAUSAS:');
  console.log('1. ❌ ML_CLIENT_ID não configurado no Vercel');
  console.log('2. ❌ ML_CLIENT_SECRET ausente');
  console.log('3. ❌ Redirect URI não registrado no Dev Center ML');
  console.log('4. ❌ OAuth endpoint retornando erro 500');
  console.log('5. ❌ Frontend fazendo redirect sem chamar OAuth');
  console.log('');
  
  console.log('🚀 AÇÕES PARA CORRIGIR:');
  console.log('1. Verificar variáveis de ambiente no Vercel');
  console.log('2. Verificar registros no Dev Center ML');
  console.log('3. Testar OAuth endpoint manualmente');
  console.log('4. Verificar logs do Vercel Functions');
}

// Executar diagnóstico
debugEnvironment().then(() => {
  analyzeIssue();
});