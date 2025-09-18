/**
 * Test Script para Recuperação de Feeds Perdidos - Peepers Enterprise v2.0.0
 *
 * Script para testar a funcionalidade completa de recuperação de feeds perdidos
 * do Mercado Livre, incluindo todos os tópicos suportados.
 */

const https = require('https');
const http = require('http');

// Configuração do teste
const TEST_CONFIG = {
  BASE_URL: process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000',

  // Credenciais de teste (usar valores reais em produção)
  TEST_TENANT_ID: process.env.TEST_TENANT_ID || 'test-user-123',

  // Endpoints
  RECOVERY_ENDPOINT: '/api/recovery/missed-feeds',
  HEALTH_ENDPOINT: '/api/health'
};

/**
 * Faz uma requisição HTTP
 */
function makeRequest(url, options = {}, data = null) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;

    const req = protocol.request(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Peepers-Test-Script/1.0'
      },
      ...options
    }, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const response = {
            status: res.statusCode,
            headers: res.headers,
            data: body ? JSON.parse(body) : null
          };
          resolve(response);
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: body
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Testa a saúde da aplicação
 */
async function testHealthCheck() {
  console.log('🏥 Testando health check...');

  try {
    const response = await makeRequest(`${TEST_CONFIG.BASE_URL}${TEST_CONFIG.HEALTH_ENDPOINT}`);

    if (response.status === 200) {
      console.log('✅ Health check passou');
      return true;
    } else {
      console.log('❌ Health check falhou:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro no health check:', error.message);
    return false;
  }
}

/**
 * Testa recuperação de feeds perdidos - Dry Run
 */
async function testMissedFeedsRecoveryDryRun() {
  console.log('🔍 Testando recuperação de feeds perdidos (dry run)...');

  const payload = {
    tenantId: TEST_CONFIG.TEST_TENANT_ID,
    dryRun: true,
    maxAgeHours: 24 // Últimas 24 horas
  };

  try {
    const response = await makeRequest(
      `${TEST_CONFIG.BASE_URL}${TEST_CONFIG.RECOVERY_ENDPOINT}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      },
      payload
    );

    if (response.status === 200 && response.data?.success) {
      console.log('✅ Dry run executado com sucesso:');
      console.log('   - Feeds processados:', response.data.data.processed);
      console.log('   - Feeds falharam:', response.data.data.failed);
      console.log('   - Feeds pulados:', response.data.data.skipped);
      console.log('   - Tempo de processamento:', response.data.data.duration_ms, 'ms');
      return true;
    } else {
      console.log('❌ Dry run falhou:', response.status, response.data?.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro no dry run:', error.message);
    return false;
  }
}

/**
 * Testa recuperação de feeds perdidos - Execução Real
 */
async function testMissedFeedsRecoveryReal() {
  console.log('🚀 Testando recuperação de feeds perdidos (execução real)...');

  const payload = {
    tenantId: TEST_CONFIG.TEST_TENANT_ID,
    topics: ['orders_v2', 'items'], // Testar apenas alguns tópicos
    maxAgeHours: 24
  };

  try {
    const response = await makeRequest(
      `${TEST_CONFIG.BASE_URL}${TEST_CONFIG.RECOVERY_ENDPOINT}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      },
      payload
    );

    if (response.status === 200 && response.data?.success) {
      console.log('✅ Recuperação executada com sucesso:');
      console.log('   - Feeds processados:', response.data.data.processed);
      console.log('   - Feeds falharam:', response.data.data.failed);
      console.log('   - Feeds pulados:', response.data.data.skipped);
      console.log('   - Tempo de processamento:', response.data.data.duration_ms, 'ms');
      return true;
    } else {
      console.log('❌ Recuperação falhou:', response.status, response.data?.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro na recuperação:', error.message);
    return false;
  }
}

/**
 * Testa obtenção de estatísticas de recuperação
 */
async function testRecoveryStats() {
  console.log('📊 Testando obtenção de estatísticas de recuperação...');

  try {
    const response = await makeRequest(
      `${TEST_CONFIG.BASE_URL}${TEST_CONFIG.RECOVERY_ENDPOINT}?tenantId=${TEST_CONFIG.TEST_TENANT_ID}`
    );

    if (response.status === 200 && response.data?.success) {
      console.log('✅ Estatísticas obtidas com sucesso:');
      console.log('   - Última recuperação:', response.data.data.lastRecovery ?
        `${response.data.data.lastRecovery.processed} feeds processados` : 'Nenhuma');
      console.log('   - Total processados:', response.data.data.totalProcessed);
      console.log('   - Total falharam:', response.data.data.totalFailed);
      return true;
    } else {
      console.log('❌ Falha ao obter estatísticas:', response.status, response.data?.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro ao obter estatísticas:', error.message);
    return false;
  }
}

/**
 * Testa validação de parâmetros
 */
async function testValidation() {
  console.log('🔍 Testando validação de parâmetros...');

  const invalidPayloads = [
    { tenantId: '' }, // Tenant ID vazio
    { tenantId: 'test', maxAgeHours: 200 }, // maxAgeHours muito alto
    { tenantId: 'test', topics: 'invalid' }, // Topics não é array
  ];

  let passed = 0;

  for (const payload of invalidPayloads) {
    try {
      const response = await makeRequest(
        `${TEST_CONFIG.BASE_URL}${TEST_CONFIG.RECOVERY_ENDPOINT}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        },
        payload
      );

      if (response.status === 400) {
        console.log('✅ Validação correta para payload inválido');
        passed++;
      } else {
        console.log('❌ Validação falhou para payload:', payload);
      }
    } catch (error) {
      console.log('❌ Erro na validação:', error.message);
    }
  }

  return passed === invalidPayloads.length;
}

/**
 * Executa todos os testes
 */
async function runAllTests() {
  console.log('🧪 Iniciando testes de recuperação de feeds perdidos...\n');

  const results = {
    healthCheck: await testHealthCheck(),
    validation: await testValidation(),
    dryRun: await testMissedFeedsRecoveryDryRun(),
    realRecovery: await testMissedFeedsRecoveryReal(),
    stats: await testRecoveryStats()
  };

  console.log('\n📋 Resultado dos testes:');
  console.log('🏥 Health Check:', results.healthCheck ? '✅ PASSOU' : '❌ FALHOU');
  console.log('🔍 Validação:', results.validation ? '✅ PASSOU' : '❌ FALHOU');
  console.log('🔍 Dry Run:', results.dryRun ? '✅ PASSOU' : '❌ FALHOU');
  console.log('🚀 Recuperação Real:', results.realRecovery ? '✅ PASSOU' : '❌ FALHOU');
  console.log('📊 Estatísticas:', results.stats ? '✅ PASSOU' : '❌ FALHOU');

  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;

  console.log(`\n🎯 Total: ${passedTests}/${totalTests} testes passaram`);

  if (passedTests === totalTests) {
    console.log('🎉 Todos os testes passaram! A recuperação de feeds perdidos está funcionando corretamente.');
    process.exit(0);
  } else {
    console.log('⚠️ Alguns testes falharam. Verifique os logs acima para detalhes.');
    process.exit(1);
  }
}

// Executar testes se o script for chamado diretamente
if (require.main === module) {
  runAllTests().catch((error) => {
    console.error('❌ Erro fatal nos testes:', error);
    process.exit(1);
  });
}

module.exports = {
  testHealthCheck,
  testMissedFeedsRecoveryDryRun,
  testMissedFeedsRecoveryReal,
  testRecoveryStats,
  testValidation,
  runAllTests
};