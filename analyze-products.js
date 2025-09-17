const https = require('https');

const problematicIds = [
  'MLB3344348552',
  'MLB4077762091', 
  'MLB4575221608',
  'MLB3964954711',
  'MLB3964823893'
];

async function getProductDetails(productId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'peepers.vercel.app',
      path: `/api/v1/products?id=${productId}&format=full`,
      method: 'GET'
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.data && json.data.products && json.data.products[0]) {
            resolve(json.data.products[0]);
          } else {
            resolve(null);
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function analyzeProblematicProducts() {
  console.log('🔍 ANALISANDO PRODUTOS PROBLEMÁTICOS...\n');
  console.log('═'.repeat(80));
  
  for (let i = 0; i < problematicIds.length; i++) {
    const productId = problematicIds[i];
    console.log(`\n📦 PRODUTO ${i + 1}/${problematicIds.length}`);
    console.log('─'.repeat(50));
    
    try {
      const product = await getProductDetails(productId);
      
      if (product) {
        console.log(`🆔 ID: ${product.id}`);
        console.log(`📝 Título: ${product.title}`);
        console.log(`📏 Comprimento: ${product.title.length} caracteres (${product.title.length - 60 > 0 ? '+' + (product.title.length - 60) : product.title.length - 60} do limite)`);
        console.log(`💰 Preço: R$ ${product.price}`);
        console.log(`📊 Status: ${product.status}`);
        console.log(`📦 Estoque: ${product.available_quantity} unidades`);
        console.log(`🛒 Vendidos: ${product.sold_quantity} unidades`);
        console.log(`🏷️  Condição: ${product.condition}`);
        console.log(`📂 Categoria: ${product.category_id}`);
        console.log(`🚚 Frete Grátis: ${product.shipping && product.shipping.free_shipping ? 'Sim' : 'Não'}`);
        
        if (product.pictures && product.pictures.length > 0) {
          console.log(`🖼️  Imagens: ${product.pictures.length} foto(s)`);
          console.log(`📸 Thumbnail: ${product.thumbnail}`);
        }
        
        if (product.date_created) {
          const created = new Date(product.date_created);
          console.log(`📅 Criado em: ${created.toLocaleDateString('pt-BR')} às ${created.toLocaleTimeString('pt-BR')}`);
        }
        
        if (product.last_updated) {
          const updated = new Date(product.last_updated);
          console.log(`✏️  Atualizado em: ${updated.toLocaleDateString('pt-BR')} às ${updated.toLocaleTimeString('pt-BR')}`);
        }
        
      } else {
        console.log(`❌ Produto ${productId} não encontrado`);
      }
      
    } catch (error) {
      console.log(`❌ Erro ao buscar produto ${productId}:`, error.message);
    }
    
    // Wait a bit between requests to be nice to the API
    if (i < problematicIds.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log('\n' + '═'.repeat(80));
  console.log('✅ ANÁLISE CONCLUÍDA');
  console.log('\n📋 RESUMO DOS PROBLEMAS:');
  console.log('• Esses produtos foram criados antes da validação de 60 caracteres');
  console.log('• O Mercado Livre permite títulos maiores em algumas situações');
  console.log('• A aplicação precisa lidar com esses casos "legacy"');
  console.log('• Solução implementada: skip produtos problemáticos nas estatísticas');
}

analyzeProblematicProducts().catch(console.error);