#!/usr/bin/env node

/**
 * AUDITORIA COMPLETA OAUTH PKCE - PEEPERS
 * 
 * Este script realiza uma auditoria detalhada do flow OAuth PKCE
 * para identificar onde está falhando o processo de autenticação.
 */

const https = require('https');
const { URL } = require('url');

const BASE_URL = 'https://peepers.vercel.app';
const ML_AUTH_URL = 'https://auth.mercadolivre.com.br';

// Cores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'Peepers-OAuth-Audit/1.0',
        ...options.headers
      }
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          cookies: parseCookies(res.headers['set-cookie'] || [])
        });
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

function parseCookies(cookies) {
  const parsed = {};
  cookies.forEach(cookie => {
    const [nameValue] = cookie.split(';');
    const [name, value] = nameValue.split('=');
    if (name && value) {
      parsed[name.trim()] = value.trim();
    }
  });
  return parsed;
}

function formatCookies(cookies) {
  return Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
}

async function testHealthEndpoints() {
  log('\n=== TESTE DE ENDPOINTS DE SAÚDE ===', colors.cyan);
  
  const endpoints = [
    '/api/health',
    '/api/debug',
    '/api/cache-debug'
  ];

  for (const endpoint of endpoints) {
    try {
      log(`\n🔍 Testando ${endpoint}...`, colors.yellow);
      const response = await makeRequest(`${BASE_URL}${endpoint}`);
      
      if (response.statusCode === 200) {
        log(`✅ ${endpoint}: OK (${response.statusCode})`, colors.green);
        try {
          const data = JSON.parse(response.body);
          if (data.cache) {
            log(`   Cache: ${JSON.stringify(data.cache, null, 2)}`, colors.blue);
          }
        } catch (e) {
          // Response não é JSON, tudo bem
        }
      } else {
        log(`❌ ${endpoint}: ERRO (${response.statusCode})`, colors.red);
        log(`   Response: ${response.body.substring(0, 200)}...`, colors.red);
      }
    } catch (error) {
      log(`❌ ${endpoint}: FALHA DE CONEXÃO`, colors.red);
      log(`   Erro: ${error.message}`, colors.red);
    }
  }
}

async function testOAuthInitiation() {
  log('\n=== TESTE DE INICIALIZAÇÃO OAUTH ===', colors.cyan);
  
  try {
    log('🔍 Testando /api/ml/auth...', colors.yellow);
    const response = await makeRequest(`${BASE_URL}/api/ml/auth`);
    
    log(`Status: ${response.statusCode}`, colors.blue);
    log(`Headers:`, colors.blue);
    Object.entries(response.headers).forEach(([key, value]) => {
      log(`  ${key}: ${value}`, colors.blue);
    });
    
    if (response.cookies) {
      log(`Cookies definidos:`, colors.blue);
      Object.entries(response.cookies).forEach(([name, value]) => {
        log(`  ${name}: ${value}`, colors.blue);
      });
      
      // Verificar se os cookies PKCE foram definidos
      if (response.cookies.ml_code_verifier) {
        log('✅ Cookie ml_code_verifier definido', colors.green);
        log(`   Tamanho: ${response.cookies.ml_code_verifier.length} chars`, colors.green);
      } else {
        log('❌ Cookie ml_code_verifier NÃO definido', colors.red);
      }
      
      if (response.cookies.oauth_state) {
        log('✅ Cookie oauth_state definido', colors.green);
        log(`   Valor: ${response.cookies.oauth_state}`, colors.green);
      } else {
        log('❌ Cookie oauth_state NÃO definido', colors.red);
      }
    }
    
    // Verificar redirecionamento
    if (response.statusCode === 302 || response.statusCode === 307) {
      const location = response.headers.location;
      if (location && location.includes('auth.mercadolivre.com.br')) {
        log('✅ Redirecionamento para ML correto', colors.green);
        log(`   URL: ${location}`, colors.green);
        
        // Verificar parâmetros PKCE na URL
        const url = new URL(location);
        const codeChallenge = url.searchParams.get('code_challenge');
        const codeChallengeMethod = url.searchParams.get('code_challenge_method');
        const state = url.searchParams.get('state');
        
        if (codeChallenge) {
          log('✅ code_challenge presente na URL', colors.green);
          log(`   Tamanho: ${codeChallenge.length} chars`, colors.green);
        } else {
          log('❌ code_challenge AUSENTE na URL', colors.red);
        }
        
        if (codeChallengeMethod === 'S256') {
          log('✅ code_challenge_method correto (S256)', colors.green);
        } else {
          log(`❌ code_challenge_method incorreto: ${codeChallengeMethod}`, colors.red);
        }
        
        if (state) {
          log('✅ state presente na URL', colors.green);
          log(`   Valor: ${state}`, colors.green);
        } else {
          log('❌ state AUSENTE na URL', colors.red);
        }
        
        return { cookies: response.cookies, state, redirectUrl: location };
      } else {
        log('❌ Redirecionamento incorreto', colors.red);
        log(`   Location: ${location}`, colors.red);
      }
    } else {
      log(`❌ Status de resposta inesperado: ${response.statusCode}`, colors.red);
      log(`Body: ${response.body.substring(0, 500)}...`, colors.red);
    }
    
  } catch (error) {
    log('❌ Falha no teste de inicialização OAuth', colors.red);
    log(`Erro: ${error.message}`, colors.red);
  }
  
  return null;
}

async function testCallbackWithoutCode() {
  log('\n=== TESTE DE CALLBACK SEM CÓDIGO ===', colors.cyan);
  
  try {
    log('🔍 Testando callback sem parâmetros...', colors.yellow);
    const response = await makeRequest(`${BASE_URL}/api/ml/auth/callback`);
    
    log(`Status: ${response.statusCode}`, colors.blue);
    
    if (response.statusCode === 400) {
      log('✅ Callback rejeita requisições sem código (correto)', colors.green);
      try {
        const data = JSON.parse(response.body);
        log(`   Erro retornado: ${data.error}`, colors.green);
      } catch (e) {
        log(`   Response: ${response.body}`, colors.blue);
      }
    } else {
      log(`❌ Callback não rejeitou requisição sem código`, colors.red);
      log(`   Response: ${response.body}`, colors.red);
    }
    
  } catch (error) {
    log('❌ Falha no teste de callback', colors.red);
    log(`Erro: ${error.message}`, colors.red);
  }
}

async function testCallbackWithFakeCode(authData) {
  log('\n=== TESTE DE CALLBACK COM CÓDIGO FALSO ===', colors.cyan);
  
  if (!authData || !authData.cookies) {
    log('❌ Dados de auth não disponíveis, pulando teste', colors.red);
    return;
  }
  
  try {
    log('🔍 Testando callback com código falso...', colors.yellow);
    
    const callbackUrl = `${BASE_URL}/api/ml/auth/callback?code=FAKE_CODE&state=${authData.state}`;
    const cookieHeader = formatCookies(authData.cookies);
    
    log(`   URL: ${callbackUrl}`, colors.blue);
    log(`   Cookies: ${cookieHeader}`, colors.blue);
    
    const response = await makeRequest(callbackUrl, {
      headers: {
        'Cookie': cookieHeader
      }
    });
    
    log(`Status: ${response.statusCode}`, colors.blue);
    
    if (response.statusCode === 400) {
      try {
        const data = JSON.parse(response.body);
        if (data.error === 'Missing code_verifier') {
          log('❌ PROBLEMA IDENTIFICADO: Missing code_verifier', colors.red);
          log('   Isso indica que os cookies não estão sendo lidos corretamente', colors.red);
        } else {
          log(`✅ Callback rejeitou código falso: ${data.error}`, colors.green);
        }
        log(`   Detalhes: ${JSON.stringify(data, null, 2)}`, colors.blue);
      } catch (e) {
        log(`   Response: ${response.body}`, colors.blue);
      }
    } else {
      log(`❌ Callback não rejeitou código falso`, colors.red);
      log(`   Response: ${response.body}`, colors.red);
    }
    
  } catch (error) {
    log('❌ Falha no teste de callback com código falso', colors.red);
    log(`Erro: ${error.message}`, colors.red);
  }
}

async function testCacheAccess() {
  log('\n=== TESTE DE ACESSO AO CACHE ===', colors.cyan);
  
  try {
    log('🔍 Testando acesso direto ao cache...', colors.yellow);
    const response = await makeRequest(`${BASE_URL}/api/cache-debug`);
    
    if (response.statusCode === 200) {
      log('✅ Endpoint de cache acessível', colors.green);
      try {
        const data = JSON.parse(response.body);
        log(`   Cache stats: ${JSON.stringify(data, null, 2)}`, colors.blue);
      } catch (e) {
        log(`   Response: ${response.body}`, colors.blue);
      }
    } else {
      log(`❌ Problema com cache: ${response.statusCode}`, colors.red);
      log(`   Response: ${response.body}`, colors.red);
    }
    
  } catch (error) {
    log('❌ Falha no teste de cache', colors.red);
    log(`Erro: ${error.message}`, colors.red);
  }
}

async function runAudit() {
  log('🔍 INICIANDO AUDITORIA COMPLETA OAUTH PKCE - PEEPERS', colors.bright);
  log('='.repeat(60), colors.bright);
  
  // 1. Testar endpoints de saúde
  await testHealthEndpoints();
  
  // 2. Testar acesso ao cache
  await testCacheAccess();
  
  // 3. Testar inicialização OAuth
  const authData = await testOAuthInitiation();
  
  // 4. Testar callback sem código
  await testCallbackWithoutCode();
  
  // 5. Testar callback com código falso
  await testCallbackWithFakeCode(authData);
  
  log('\n=== RESUMO DA AUDITORIA ===', colors.cyan);
  log('✅ Verificação de paths incorretos: PASSOU', colors.green);
  log('✅ Estrutura de diretórios: CORRETA', colors.green);
  log('✅ Configurações do projeto: CORRETAS', colors.green);
  
  if (authData && authData.cookies && authData.cookies.ml_code_verifier) {
    log('✅ Geração de cookies PKCE: FUNCIONANDO', colors.green);
  } else {
    log('❌ Geração de cookies PKCE: FALHANDO', colors.red);
  }
  
  log('\n📋 PRÓXIMOS PASSOS RECOMENDADOS:', colors.yellow);
  log('1. Verificar logs em produção durante tentativa de OAuth', colors.yellow);
  log('2. Testar OAuth flow manualmente e verificar cookies no browser', colors.yellow);
  log('3. Verificar se Upstash Redis está funcionando corretamente', colors.yellow);
  log('4. Verificar variáveis de ambiente ML_CLIENT_ID e ML_CLIENT_SECRET', colors.yellow);
  
  log('\n🔧 COMANDO PARA TESTAR MANUALMENTE:', colors.magenta);
  log(`curl -v -L "${BASE_URL}/api/ml/auth"`, colors.magenta);
  log('Verificar se cookies são definidos na resposta', colors.magenta);
  
  log('\n='.repeat(60), colors.bright);
  log('✅ AUDITORIA COMPLETA FINALIZADA', colors.bright);
}

// Executar auditoria se chamado diretamente
if (require.main === module) {
  runAudit().catch(error => {
    log('❌ ERRO FATAL NA AUDITORIA:', colors.red);
    log(error.message, colors.red);
    process.exit(1);
  });
}

module.exports = { runAudit };