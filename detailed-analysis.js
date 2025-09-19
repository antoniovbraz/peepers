const https = require('https');

const problematicIds = [
  'MLB3344348552',
  'MLB4077762091', 
  'MLB4575221608',
  'MLB3964954711',
  'MLB3964823893'
];

async function getOurProductData() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'peepers.vercel.app',
      path: '/api/products-public?format=full',
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
          resolve(json.data.products);
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
  console.log('🔍 ANALISANDO PRODUTOS PROBLEMÁTICOS COM DETALHES...\n');
  console.log('═'.repeat(80));
  
  try {
    const allProducts = await getOurProductData();
    const problematicProducts = allProducts.filter(p => problematicIds.includes(p.id));
    
    console.log(`📊 Encontrados ${problematicProducts.length} produtos problemáticos de ${problematicIds.length} IDs`);
    
    problematicProducts.forEach((product, index) => {
      console.log(`\n📦 PRODUTO ${index + 1}/${problematicProducts.length}`);
      console.log('─'.repeat(60));
      console.log(`🆔 ID: ${product.id}`);
      console.log(`📝 Título: "${product.title}"`);
      console.log(`📏 Comprimento: ${product.title.length} caracteres (+${product.title.length - 60} do limite)`);
      
      // Análise detalhada do título
      console.log(`\n🔍 ANÁLISE DO TÍTULO:`);
      
      // Dividir o título em palavras para análise
      const words = product.title.split(' ');
      console.log(`   • Total de palavras: ${words.length}`);
      console.log(`   • Média de caracteres por palavra: ${Math.round(product.title.length / words.length)}`);
      
      // Procurar padrões de variação
      const variationKeywords = [
        'cor', 'color', 'preto', 'branco', 'azul', 'vermelho', 'verde', 'amarelo', 'rosa', 'roxo', 'cinza',
        'tamanho', 'size', 'pequeno', 'médio', 'grande', 'p', 'm', 'g', 'gg', 'pp',
        'modelo', 'model', 'tipo', 'type', 'estilo', 'style',
        'voltagem', 'potência', 'watts', 'volts', 'ampere',
        'material', 'tecido', 'algodão', 'polyester', 'couro',
        'marca', 'original', 'importado', 'nacional'
      ];
      
      const foundVariations = [];
      const titleLower = product.title.toLowerCase();
      
      variationKeywords.forEach(keyword => {
        if (titleLower.includes(keyword)) {
          foundVariations.push(keyword);
        }
      });
      
      if (foundVariations.length > 0) {
        console.log(`   • 🎯 Palavras de variação: ${foundVariations.join(', ')}`);
      }
      
      // Procurar números e códigos (podem indicar modelos/variações)
      const numbers = product.title.match(/\d+/g);
      if (numbers) {
        console.log(`   • 🔢 Números encontrados: ${numbers.join(', ')}`);
      }
      
      // Procurar caracteres especiais e símbolos
      const specialChars = product.title.match(/[^\w\s]/g);
      if (specialChars) {
        console.log(`   • ⚡ Caracteres especiais: ${[...new Set(specialChars)].join(' ')}`);
      }
      
      // Verificar se tem informações adicionais
      console.log(`\n📋 OUTRAS INFORMAÇÕES:`);
      console.log(`   • 💰 Preço: R$ ${product.price}`);
      console.log(`   • 📦 Estoque: ${product.available_quantity}`);
      console.log(`   • 🛒 Vendidos: ${product.sold_quantity}`);
      console.log(`   • 📂 Categoria: ${product.category_id}`);
      
      if (product.attributes && product.attributes.length > 0) {
        console.log(`   • 🏷️  Atributos: ${product.attributes.length} atributos definidos`);
        
        // Mostrar alguns atributos relevantes
        const relevantAttrs = product.attributes.filter(attr => 
          attr.name && (
            attr.name.toLowerCase().includes('cor') ||
            attr.name.toLowerCase().includes('tamanho') ||
            attr.name.toLowerCase().includes('modelo') ||
            attr.name.toLowerCase().includes('marca')
          )
        ).slice(0, 3);
        
        if (relevantAttrs.length > 0) {
          console.log(`   • 🎯 Atributos de variação:`);
          relevantAttrs.forEach(attr => {
            console.log(`     - ${attr.name}: ${attr.value_name || attr.value_id || 'N/A'}`);
          });
        }
      }
      
      // Tentar quebrar o título em seções lógicas
      console.log(`\n✂️  POSSÍVEL BREAKDOWN DO TÍTULO:`);
      const titleParts = product.title.split(/[-,()]/);
      if (titleParts.length > 1) {
        titleParts.forEach((part, i) => {
          const trimmed = part.trim();
          if (trimmed) {
            console.log(`   ${i + 1}. "${trimmed}" (${trimmed.length} chars)`);
          }
        });
      } else {
        // Se não tem separadores, tentar por palavras em grupos
        const wordGroups = [];
        for (let i = 0; i < words.length; i += 3) {
          wordGroups.push(words.slice(i, i + 3).join(' '));
        }
        wordGroups.forEach((group, i) => {
          console.log(`   ${i + 1}. "${group}" (${group.length} chars)`);
        });
      }
    });
    
    console.log('\n' + '═'.repeat(80));
    console.log('✅ ANÁLISE DETALHADA CONCLUÍDA');
    console.log('\n📋 CONCLUSÕES:');
    console.log('• Verificar se títulos incluem especificações desnecessárias');
    console.log('• Possível otimização: mover detalhes para atributos/descrição');
    console.log('• ML pode ser mais flexível com títulos para produtos complexos');
    
  } catch (error) {
    console.error('❌ Erro na análise:', error.message);
  }
}

analyzeProblematicProducts().catch(console.error);