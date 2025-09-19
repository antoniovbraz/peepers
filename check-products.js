const https = require('https');

async function checkAllProducts() {
  console.log('🔍 VERIFICANDO TODOS OS PRODUTOS...\n');
  
  const options = {
    hostname: 'peepers.vercel.app',
    path: '/api/products-public?format=full&limit=1000',
    method: 'GET'
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.data && json.data.products) {
            console.log(`📊 Total de produtos encontrados: ${json.data.products.length}\n`);
            
            let problemProducts = [];
            let longTitleProducts = [];
            
            json.data.products.forEach((product, index) => {
              const title = product.title || '';
              const titleLength = title.length;
              
              if (titleLength > 60) {
                longTitleProducts.push({
                  index: index + 1,
                  id: product.id,
                  title: title,
                  length: titleLength
                });
              }
              
              // Check for other potential issues
              if (!product.id || !title || titleLength === 0) {
                problemProducts.push({
                  index: index + 1,
                  id: product.id || 'NO_ID',
                  title: title || 'NO_TITLE',
                  issue: 'Missing ID or Title'
                });
              }
            });
            
            console.log('=== PRODUTOS COM TÍTULOS > 60 CARACTERES ===');
            if (longTitleProducts.length > 0) {
              longTitleProducts.forEach(p => {
                console.log(`❌ Produto ${p.index}:`);
                console.log(`   ID: ${p.id}`);
                console.log(`   Título: ${p.title}`);
                console.log(`   Comprimento: ${p.length} caracteres`);
                console.log(`   EXCESSO: +${p.length - 60} caracteres\n`);
              });
            } else {
              console.log('✅ Nenhum produto com título > 60 caracteres encontrado\n');
            }
            
            console.log('=== PRODUTOS COM PROBLEMAS ===');
            if (problemProducts.length > 0) {
              problemProducts.forEach(p => {
                console.log(`⚠️  Produto ${p.index}:`);
                console.log(`   ID: ${p.id}`);
                console.log(`   Título: ${p.title}`);
                console.log(`   Problema: ${p.issue}\n`);
              });
            } else {
              console.log('✅ Nenhum produto com problemas de ID/Título encontrado\n');
            }
            
            // Show summary
            console.log('=== RESUMO ===');
            console.log(`📈 Total de produtos: ${json.data.products.length}`);
            console.log(`❌ Produtos com título > 60 chars: ${longTitleProducts.length}`);
            console.log(`⚠️  Produtos com problemas: ${problemProducts.length}`);
            console.log(`✅ Produtos válidos: ${json.data.products.length - longTitleProducts.length - problemProducts.length}`);
            
            resolve({ longTitleProducts, problemProducts, total: json.data.products.length });
          } else {
            console.log('❌ Erro na resposta da API:', json);
            reject(new Error('Invalid API response'));
          }
        } catch (e) {
          console.log('❌ Erro ao parsear JSON:', e.message);
          console.log('Resposta raw (primeiros 500 chars):', data.substring(0, 500));
          reject(e);
        }
      });
    });

    req.on('error', (e) => {
      console.error('❌ Erro na requisição:', e);
      reject(e);
    });

    req.end();
  });
}

checkAllProducts().catch(console.error);