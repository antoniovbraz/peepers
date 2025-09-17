const https = require('https');

const problematicIds = [
  'MLB3344348552',
  'MLB4077762091', 
  'MLB4575221608',
  'MLB3964954711',
  'MLB3964823893'
];

async function getProductWithVariations(productId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.mercadolibre.com',
      path: `/items/${productId}`,
      method: 'GET',
      headers: {
        'User-Agent': 'Peepers/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const product = JSON.parse(data);
          resolve(product);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function analyzeProductVariations() {
  console.log('🔍 ANALISANDO VARIAÇÕES DOS PRODUTOS PROBLEMÁTICOS...\n');
  console.log('═'.repeat(80));
  
  for (let i = 0; i < problematicIds.length; i++) {
    const productId = problematicIds[i];
    console.log(`\n📦 PRODUTO ${i + 1}/${problematicIds.length}: ${productId}`);
    console.log('─'.repeat(60));
    
    try {
      const product = await getProductWithVariations(productId);
      
      console.log(`📝 Título Original: "${product.title}"`);
      console.log(`📏 Comprimento Total: ${product.title.length} caracteres`);
      
      // Verificar se tem variações
      if (product.variations && product.variations.length > 0) {
        console.log(`🔄 VARIAÇÕES ENCONTRADAS: ${product.variations.length}`);
        
        product.variations.forEach((variation, index) => {
          console.log(`\n   Variação ${index + 1}:`);
          console.log(`   ID: ${variation.id}`);
          console.log(`   Preço: R$ ${variation.price}`);
          console.log(`   Estoque: ${variation.available_quantity}`);
          
          if (variation.attributes) {
            console.log(`   Atributos:`);
            variation.attributes.forEach(attr => {
              console.log(`     - ${attr.name}: ${attr.value_name || attr.value_id}`);
            });
          }
        });
        
        // Analisar se o título contém informações de variação
        const titleWords = product.title.toLowerCase().split(' ');
        const variationKeywords = ['cor', 'tamanho', 'modelo', 'tipo', 'estilo', 'voltagem', 'potência'];
        const foundKeywords = titleWords.filter(word => 
          variationKeywords.some(keyword => word.includes(keyword))
        );
        
        if (foundKeywords.length > 0) {
          console.log(`\n   🎯 PALAVRAS DE VARIAÇÃO DETECTADAS: ${foundKeywords.join(', ')}`);
        }
        
      } else {
        console.log(`❌ SEM VARIAÇÕES - Título longo por outros motivos`);
      }
      
      // Verificar atributos do produto principal
      if (product.attributes && product.attributes.length > 0) {
        console.log(`\n📋 ATRIBUTOS PRINCIPAIS:`);
        product.attributes.slice(0, 5).forEach(attr => {
          if (attr.value_name || attr.value_id) {
            console.log(`   • ${attr.name}: ${attr.value_name || attr.value_id}`);
          }
        });
        if (product.attributes.length > 5) {
          console.log(`   ... e mais ${product.attributes.length - 5} atributos`);
        }
      }
      
      // Tentar identificar partes do título
      const title = product.title;
      console.log(`\n🔍 ANÁLISE DO TÍTULO:`);
      
      // Procurar por padrões comuns
      const patterns = [
        { name: 'Marca/Modelo', regex: /^[A-Z][a-zA-Z0-9]+\s+[A-Z0-9-]+/i },
        { name: 'Especificações técnicas', regex: /\d+[a-zA-Z]+|\d+x\d+|\d+\/\d+/g },
        { name: 'Cores/Variações', regex: /(cor|color|preto|branco|azul|vermelho|verde|amarelo|rosa|roxo|cinza)/gi },
        { name: 'Tamanhos', regex: /(pequeno|médio|grande|p|m|g|gg|pp|tamanho|size)/gi },
        { name: 'Modelos', regex: /(modelo|model|tipo|style|estilo)/gi }
      ];
      
      patterns.forEach(pattern => {
        const matches = title.match(pattern.regex);
        if (matches) {
          console.log(`   • ${pattern.name}: ${matches.join(', ')}`);
        }
      });
      
    } catch (error) {
      console.log(`❌ Erro ao buscar produto ${productId}:`, error.message);
    }
    
    // Pequena pausa entre requisições
    if (i < problematicIds.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 800));
    }
  }
  
  console.log('\n' + '═'.repeat(80));
  console.log('✅ ANÁLISE DE VARIAÇÕES CONCLUÍDA');
  console.log('\n💡 INSIGHTS:');
  console.log('• Títulos longos podem incluir especificações de variações');
  console.log('• ML pode permitir títulos mais longos para produtos com muitas variações');
  console.log('• A regra de 60 caracteres pode ser flexível em casos específicos');
}

analyzeProductVariations().catch(console.error);