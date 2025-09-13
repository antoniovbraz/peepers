#!/usr/bin/env node

/**
 * Teste do endpoint de sincronização forçada
 */

async function testForceSync() {
  const BASE_URL = 'https://peepers-8r5nq0xjn-antoniovbrazs-projects.vercel.app';
  
  console.log('🔄 TESTANDO SINCRONIZAÇÃO FORÇADA');
  console.log('=================================\n');
  
  try {
    console.log('Executando POST /api/force-sync...');
    
    const response = await fetch(`${BASE_URL}/api/force-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Peepers-Force-Sync-Test/1.0'
      }
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    const data = await response.json();
    console.log('\nResposta:');
    console.log(JSON.stringify(data, null, 2));
    
    if (response.ok && data.success) {
      console.log('\n✅ SUCESSO! Sincronização funcionou');
      console.log(`   Produtos sincronizados: ${data.debug?.sync_result?.products_found || 0}`);
      
      // Agora testar endpoint de produtos
      console.log('\n📦 Testando endpoint de produtos...');
      
      const productsResponse = await fetch(`${BASE_URL}/api/products`, {
        headers: {
          'User-Agent': 'Peepers-Force-Sync-Test/1.0'
        }
      });
      
      console.log(`Status produtos: ${productsResponse.status}`);
      
      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        console.log(`✅ Produtos carregados: ${productsData.products?.length || 0}`);
      } else {
        const errorData = await productsResponse.json().catch(() => ({}));
        console.log(`❌ Erro produtos: ${errorData.error || 'Desconhecido'}`);
      }
      
    } else {
      console.log('\n❌ FALHA na sincronização');
      if (data.debug) {
        console.log('Debug info:', JSON.stringify(data.debug, null, 2));
      }
    }
    
  } catch (error) {
    console.log(`\n❌ ERRO: ${error.message}`);
  }
}

testForceSync().catch(console.error);