// Test OAuth Flow Specifically
require('dotenv').config({ path: '.env.local' });

console.log('🔐 TESTE ESPECÍFICO DE OAUTH MERCADO LIVRE\n');

async function testOAuthFlow() {
  const clientId = process.env.ML_CLIENT_ID;
  const clientSecret = process.env.ML_CLIENT_SECRET;
  
  console.log('1. TESTANDO GERAÇÃO DE URL DE AUTORIZAÇÃO:');
  console.log('==========================================');
  
  // Generate OAuth URL
  const redirectUri = encodeURIComponent(`${process.env.NEXTAUTH_URL}/api/ml/auth/callback`);
  const state = Math.random().toString(36).substring(7);
  
  const authUrl = `https://auth.mercadolibre.com.br/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}`;
  
  console.log('✅ URL de autorização gerada:');
  console.log(`   ${authUrl}\n`);
  
  console.log('2. VERIFICANDO APLICAÇÃO NO MERCADO LIVRE:');
  console.log('==========================================');
  
  try {
    // Test public app info endpoint (doesn't require authentication)
    const appResponse = await fetch(`https://api.mercadolibre.com/applications/${clientId}`);
    
    if (appResponse.ok) {
      const appData = await appResponse.json();
      console.log('✅ Aplicação encontrada:');
      console.log(`   Nome: ${appData.name || 'N/A'}`);
      console.log(`   Status: ${appData.status || 'N/A'}`);
      console.log(`   URL: ${appData.url || 'N/A'}`);
      
      // Check redirect URIs
      if (appData.redirect_uris && appData.redirect_uris.length > 0) {
        console.log('   Redirect URIs configuradas:');
        appData.redirect_uris.forEach((uri, index) => {
          console.log(`     ${index + 1}. ${uri}`);
        });
      } else {
        console.log('   ⚠️  Nenhuma Redirect URI configurada');
      }
      
    } else if (appResponse.status === 401) {
      console.log('❌ Aplicação não encontrada ou acesso negado');
      console.log('   Possíveis causas:');
      console.log('   - Client ID incorreto');
      console.log('   - Aplicação foi deletada');
      console.log('   - Permissões insuficientes');
    } else {
      console.log(`❌ Erro ao verificar aplicação: ${appResponse.status}`);
    }
  } catch (error) {
    console.log('❌ Erro de conexão:', error.message);
  }
  
  console.log('\n3. TESTANDO SITES DISPONÍVEIS:');
  console.log('==============================');
  
  try {
    const sitesResponse = await fetch('https://api.mercadolibre.com/sites');
    if (sitesResponse.ok) {
      const sites = await sitesResponse.json();
      console.log('✅ Sites disponíveis:');
      sites.slice(0, 5).forEach(site => {
        console.log(`   ${site.id}: ${site.name}`);
      });
    }
  } catch (error) {
    console.log('❌ Erro ao buscar sites:', error.message);
  }
  
  console.log('\n📋 DIAGNÓSTICO DO OAUTH:');
  console.log('========================');
  console.log('1. Verifique se o Client ID está correto no Dev Portal do ML');
  console.log('2. Confirme se as Redirect URIs estão configuradas');
  console.log('3. Certifique-se que a aplicação está ativa');
  console.log('4. Teste o fluxo OAuth manualmente usando a URL gerada');
}

testOAuthFlow().catch(console.error);