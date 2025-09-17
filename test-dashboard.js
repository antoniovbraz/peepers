const http = require('http');

const testEndpoint = (path, description) => {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const hasError = data.toLowerCase().includes('erro ao carregar métricas') || 
                        data.toLowerCase().includes('order must have at least one item') ||
                        data.toLowerCase().includes('product title cannot exceed');
        
        console.log(`✅ ${description}`);
        console.log(`   Status: ${res.statusCode}`);
        console.log(`   Tem erros: ${hasError ? '❌ SIM' : '✅ NÃO'}`);
        
        if (hasError) {
          const errorLines = data.split('\n').filter(line => 
            line.toLowerCase().includes('erro') || 
            line.toLowerCase().includes('error')
          ).slice(0, 3);
          
          if (errorLines.length > 0) {
            console.log(`   Erros encontrados:`);
            errorLines.forEach(line => console.log(`     ${line.trim()}`));
          }
        }
        
        resolve({ success: !hasError, status: res.statusCode });
      });
    });

    req.on('error', (e) => {
      console.log(`❌ ${description} - Erro de conexão: ${e.message}`);
      resolve({ success: false, error: e.message });
    });

    req.on('timeout', () => {
      console.log(`⏰ ${description} - Timeout`);
      req.destroy();
      resolve({ success: false, error: 'timeout' });
    });

    req.end();
  });
};

async function testDashboard() {
  console.log('🔍 TESTANDO DASHBOARD APÓS CORREÇÕES...\n');
  
  const tests = [
    { path: '/admin', description: 'Dashboard Admin Page' },
    { path: '/api/v1/products?limit=5', description: 'Products API' },
    { path: '/', description: 'Homepage' }
  ];
  
  for (const test of tests) {
    await testEndpoint(test.path, test.description);
    console.log('');
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('✅ TESTE CONCLUÍDO!');
}

testDashboard().catch(console.error);