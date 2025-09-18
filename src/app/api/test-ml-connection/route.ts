import { NextRequest, NextResponse } from 'next/server';

/**
 * Endpoint para testar conectividade com ML API seguindo documentação oficial
 * 
 * Testa os seguintes endpoints em ordem:
 * 1. /sites/MLB/categories (sem auth)
 * 2. /sites/MLB/currencies (sem auth) 
 * 3. /users/test_user (sem auth, para verificar estrutura)
 * 4. /oauth/token (teste de validação apenas)
 * 
 * Baseado na documentação: https://developers.mercadolibre.com/pt_br/primeiros-passos
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const includeAuth = searchParams.get('auth') === 'true';

  const results = {
    timestamp: new Date().toISOString(),
    tests: [] as Array<{
      name: string;
      endpoint: string;
      status: 'success' | 'error';
      response_time_ms: number;
      details: any;
    }>,
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      success_rate: 0
    }
  };

  // Teste 1: Categorias (endpoint público)
  await testEndpoint(
    'Categorias MLB',
    'https://api.mercadolibre.com/sites/MLB/categories',
    results,
    false
  );

  // Teste 2: Informações do site (endpoint público)
  await testEndpoint(
    'Site MLB Info',
    'https://api.mercadolibre.com/sites/MLB', 
    results,
    false
  );

  // Teste 3: Busca pública (endpoint público que DEVE funcionar)
  await testEndpoint(
    'Busca Pública',
    'https://api.mercadolibre.com/sites/MLB/search?q=smartphone&limit=1',
    results,
    false
  );

  // Teste 4: Moedas (endpoint público)
  await testEndpoint(
    'Moedas',
    'https://api.mercadolibre.com/currencies',
    results,
    false
  );

  // Testes com autenticação (se solicitado)
  if (includeAuth) {
    const clientId = process.env.ML_CLIENT_ID;
    
    if (clientId) {
      // Teste 5: Validação de Client ID
      await testEndpoint(
        'Validação Client ID',
        `https://api.mercadolibre.com/applications/${clientId}`,
        results,
        false
      );
    }
  }

  // Calcular estatísticas
  results.summary.total = results.tests.length;
  results.summary.passed = results.tests.filter(t => t.status === 'success').length;
  results.summary.failed = results.tests.filter(t => t.status === 'error').length;
  results.summary.success_rate = Math.round((results.summary.passed / results.summary.total) * 100);

  return NextResponse.json(results, {
    status: results.summary.success_rate >= 80 ? 200 : 207, // 207 = Multi-Status
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Content-Type': 'application/json'
    }
  });
}

async function testEndpoint(
  name: string,
  url: string, 
  results: any,
  requiresAuth: boolean
) {
  const startTime = performance.now();
  
  try {
    const headers: Record<string, string> = {
      'User-Agent': 'Peepers-App/1.0 (Connection Test)',
      'Accept': 'application/json'
    };

    // Se requer auth, tentar obter token do cache
    if (requiresAuth) {
      // TODO: Implementar quando necessário
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(10000) // 10s timeout
    });

    const endTime = performance.now();
    const responseTime = Math.round(endTime - startTime);

    let data: any;
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = { text: await response.text() };
    }

    results.tests.push({
      name,
      endpoint: url,
      status: response.ok ? 'success' : 'error',
      response_time_ms: responseTime,
      details: {
        http_status: response.status,
        content_type: contentType,
        data: response.ok ? (Array.isArray(data) ? `Array[${data.length}]` : data) : data,
        headers: {
          'x-ratelimit-remaining': response.headers.get('x-ratelimit-remaining'),
          'x-ratelimit-reset': response.headers.get('x-ratelimit-reset'),
          'server': response.headers.get('server')
        }
      }
    });

  } catch (error) {
    const endTime = performance.now();
    const responseTime = Math.round(endTime - startTime);

    results.tests.push({
      name,
      endpoint: url,
      status: 'error',
      response_time_ms: responseTime,
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        type: error instanceof Error ? error.constructor.name : 'UnknownError'
      }
    });
  }
}