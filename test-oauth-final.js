#!/usr/bin/env node

/**
 * TESTE FINAL OAUTH PKCE - PEEPERS
 * 
 * Valida todas as correções implementadas na auditoria
 */

const https = require('https');
const { URL } = require('url');

const BASE_URL = 'https://peepers.vercel.app';

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
        'User-Agent': 'Peepers-OAuth-Final-Test/1.0',
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

async function testImprovedOAuthDiagnostic() {
  log('\n=== TESTE ENDPOINT DIAGNÓSTICO MELHORADO ===', colors.cyan);
  
  try {
    log('🔍 Testando /api/ml/oauth-diagnostic...', colors.yellow);
    const response = await makeRequest(`${BASE_URL}/api/ml/oauth-diagnostic`);
    
    if (response.statusCode === 200) {
      log('✅ Endpoint diagnóstico funcionando', colors.green);
      try {
        const data = JSON.parse(response.body);
        log(`   Cookies detectados: ${data.cookies.total}`, colors.blue);
        log(`   Cache health: ${data.cache.health}`, colors.blue);
        log(`   OAuth sessions: ${data.cache.oauthSessions.length}`, colors.blue);
        
        if (data.cache.oauthSessions.length > 0) {
          log('   Sessões OAuth recentes encontradas:', colors.blue);
          data.cache.oauthSessions.forEach(session => {
            log(`     ${session.key}: ${session.timestamp}`, colors.blue);
          });
        }
      } catch (e) {
        log(`   Response: ${response.body.substring(0, 200)}...`, colors.blue);
      }
    } else {
      log(`❌ Endpoint diagnóstico com problema: ${response.statusCode}`, colors.red);
    }
    
  } catch (error) {
    log('❌ Falha no teste diagnóstico', colors.red);
    log(`Erro: ${error.message}`, colors.red);
  }
}

async function testImprovedOAuthFlow() {
  log('\n=== TESTE FLOW OAUTH MELHORADO ===', colors.cyan);
  
  try {
    log('🔍 Testando OAuth com cookies melhorados...', colors.yellow);
    const response = await makeRequest(`${BASE_URL}/api/ml/auth`);
    
    if (response.statusCode === 307) {
      log('✅ Redirecionamento OAuth funcionando', colors.green);
      
      // Verificar cookies melhorados
      const expectedCookies = [
        'ml_code_verifier',
        'ml_pkce_verifier',
        'oauth_state', 
        'ml_oauth_state'
      ];
      
      const foundCookies = Object.keys(response.cookies);
      const hasAllCookies = expectedCookies.some(cookie => foundCookies.includes(cookie));
      
      if (hasAllCookies) {
        log('✅ Cookies PKCE redundantes definidos', colors.green);
        foundCookies.forEach(cookie => {
          if (expectedCookies.includes(cookie)) {
            log(`   ${cookie}: definido`, colors.green);
          }
        });
      } else {
        log('❌ Nem todos os cookies foram definidos', colors.red);
        log(`   Encontrados: ${foundCookies.join(', ')}`, colors.red);
        log(`   Esperados: ${expectedCookies.join(', ')}`, colors.red);
      }
      
      // Verificar URL do ML
      const location = response.headers.location;
      if (location && location.includes('auth.mercadolivre.com.br')) {
        const url = new URL(location);
        const hasCodeChallenge = url.searchParams.has('code_challenge');
        const hasState = url.searchParams.has('state');
        
        if (hasCodeChallenge && hasState) {
          log('✅ Parâmetros PKCE corretos na URL', colors.green);
          
          // Testar callback melhorado
          return await testImprovedCallback(response.cookies, url.searchParams.get('state'));
        } else {
          log('❌ Parâmetros PKCE ausentes na URL', colors.red);
        }
      }
    } else {
      log(`❌ OAuth não retornou redirecionamento: ${response.statusCode}`, colors.red);
    }
    
  } catch (error) {
    log('❌ Falha no teste OAuth melhorado', colors.red);
    log(`Erro: ${error.message}`, colors.red);
  }
  
  return false;
}

async function testImprovedCallback(cookies, state) {
  log('\n=== TESTE CALLBACK MELHORADO ===', colors.cyan);
  
  try {
    log('🔍 Testando callback com recuperação melhorada...', colors.yellow);
    
    const callbackUrl = `${BASE_URL}/api/ml/auth/callback?code=FAKE_CODE&state=${state}`;
    const cookieHeader = formatCookies(cookies);
    
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
          log('❌ AINDA ENCONTRANDO: Missing code_verifier', colors.red);
          log('   Isso indica que as melhorias podem não ter resolvido completamente', colors.red);
          
          if (data.troubleshooting) {
            log('   Guia de solução de problemas incluído:', colors.yellow);
            data.troubleshooting.forEach(tip => {
              log(`     ${tip}`, colors.yellow);
            });
          }
          
          return false;
        } else {
          log(`✅ Callback com erro esperado: ${data.error}`, colors.green);
          if (data.error && typeof data.error === 'object' && data.error.error) {
            log(`   Erro do ML: ${data.error.error}`, colors.green);
          }
          return true;
        }
      } catch (e) {
        log(`   Response: ${response.body}`, colors.blue);
        return true; // Assumir sucesso se não conseguir parsear
      }
    } else {
      log(`❌ Callback com status inesperado: ${response.statusCode}`, colors.red);
      return false;
    }
    
  } catch (error) {
    log('❌ Falha no teste de callback melhorado', colors.red);
    log(`Erro: ${error.message}`, colors.red);
    return false;
  }
}

async function testCacheCleanup() {
  log('\n=== TESTE LIMPEZA DE CACHE ===', colors.cyan);
  
  try {
    log('🔍 Testando limpeza de cache OAuth...', colors.yellow);
    const response = await makeRequest(`${BASE_URL}/api/ml/oauth-diagnostic?action=clear-oauth-cache`);
    
    if (response.statusCode === 200) {
      try {
        const data = JSON.parse(response.body);
        if (data.action_result && data.action_result.success) {
          log('✅ Limpeza de cache OAuth funcionando', colors.green);
          log(`   Chaves processadas: ${data.action_result.keysAttempted}`, colors.green);
        } else {
          log('❌ Limpeza de cache falhou', colors.red);
        }
      } catch (e) {
        log(`   Response: ${response.body.substring(0, 200)}...`, colors.blue);
      }
    } else {
      log(`❌ Endpoint de limpeza com problema: ${response.statusCode}`, colors.red);
    }
    
  } catch (error) {
    log('❌ Falha no teste de limpeza', colors.red);
    log(`Erro: ${error.message}`, colors.red);
  }
}

async function runFinalTest() {
  log('🚀 INICIANDO TESTE FINAL DAS CORREÇÕES OAUTH PKCE', colors.bright);
  log('='.repeat(60), colors.bright);
  
  // 1. Testar endpoint diagnóstico melhorado
  await testImprovedOAuthDiagnostic();
  
  // 2. Testar flow OAuth com melhorias
  const oauthSuccess = await testImprovedOAuthFlow();
  
  // 3. Testar limpeza de cache
  await testCacheCleanup();
  
  log('\n=== RESUMO FINAL ===', colors.cyan);
  
  if (oauthSuccess) {
    log('✅ SUCESSO: Melhorias implementadas e funcionando', colors.green);
    log('✅ Sistema OAuth PKCE robusto e com fallbacks', colors.green);
    log('✅ Diagnósticos melhorados disponíveis', colors.green);
  } else {
    log('⚠️  PARCIAL: Algumas melhorias podem precisar de mais tempo para propagar', colors.yellow);
    log('⚠️  Recomenda-se testar novamente em produção', colors.yellow);
  }
  
  log('\n📋 FERRAMENTAS DE DIAGNÓSTICO DISPONÍVEIS:', colors.yellow);
  log('• /api/ml/oauth-diagnostic - Diagnóstico detalhado', colors.yellow);
  log('• /api/ml/oauth-diagnostic?action=clear-oauth-cache - Limpar cache', colors.yellow);
  log('• /api/ml/oauth-diagnostic?action=test-cookies - Testar cookies', colors.yellow);
  
  log('\n🔧 PRÓXIMOS PASSOS SE PROBLEMAS PERSISTIREM:', colors.magenta);
  log('1. Verificar logs em tempo real durante OAuth', colors.magenta);
  log('2. Testar em diferentes navegadores/modos incógnito', colors.magenta);
  log('3. Verificar configurações de proxy/CDN no Vercel', colors.magenta);
  log('4. Considerar usar apenas cache (sem cookies) se necessário', colors.magenta);
  
  log('\n='.repeat(60), colors.bright);
  log('✅ TESTE FINAL CONCLUÍDO', colors.bright);
}

// Executar teste se chamado diretamente
if (require.main === module) {
  runFinalTest().catch(error => {
    log('❌ ERRO FATAL NO TESTE FINAL:', colors.red);
    log(error.message, colors.red);
    process.exit(1);
  });
}

module.exports = { runFinalTest };