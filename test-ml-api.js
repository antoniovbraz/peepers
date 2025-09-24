const https = require('https');

async function testFetchAllSellerProducts() {
  console.log('🧪 Testando fetchAllSellerProducts...');

  // Simular a chamada que o ProductRepository faz
  const sellerId = 669073070;
  const url = `https://api.mercadolibre.com/users/${sellerId}/items/search?status=active&limit=50&offset=0`;

  console.log('URL:', url);

  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log('✅ Resposta da API ML:');
          console.log('- Status:', res.statusCode);
          console.log('- Total resultados:', json.results ? json.results.length : 'N/A');
          console.log('- Total produtos:', json.paging ? json.paging.total : 'N/A');
          console.log('- Primeiros IDs:', json.results ? json.results.slice(0, 3) : 'N/A');
          resolve(json);
        } catch (err) {
          console.error('❌ Erro ao parsear JSON:', err.message);
          reject(err);
        }
      });
    }).on('error', (err) => {
      console.error('❌ Erro na requisição:', err.message);
      reject(err);
    });
  });
}

testFetchAllSellerProducts().catch(console.error);