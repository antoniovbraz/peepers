console.log('🔄 Forçando sincronização de produtos...');

async function forceSyncProducts() {
  try {
    // Primeiro, buscar produtos da API ML
    console.log('📡 Buscando produtos do ML...');
    const mlResponse = await fetch('https://peepers.vercel.app/api/ml/products');
    const mlData = await mlResponse.json();
    
    if (mlData.success) {
      console.log(`✅ ML API: ${mlData.product_ids.length} produtos encontrados`);
      console.log(`📊 Sample products: ${mlData.sample_products.length}`);
      
      // Agora testar se o /api/products consegue acessar
      console.log('\n🧪 Testando /api/products...');
      const productsResponse = await fetch('https://peepers.vercel.app/api/products');
      
      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        console.log(`✅ Products API: ${productsData.total} produtos retornados`);
        
        if (productsData.statistics) {
          console.log(`📈 Estatísticas:`, productsData.statistics.status_summary);
        }
        
        console.log('\n🎉 Sincronização bem-sucedida!');
        console.log('Os produtos agora devem aparecer no frontend.');
        
      } else {
        const error = await productsResponse.text();
        console.log(`❌ Products API falhou: ${productsResponse.status}`);
        console.log(`Error: ${error.substring(0, 200)}...`);
      }
      
    } else {
      console.log('❌ ML API falhou:', mlData);
    }
    
  } catch (error) {
    console.error('❌ Erro na sincronização:', error.message);
  }
}

forceSyncProducts();