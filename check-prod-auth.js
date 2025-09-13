#!/usr/bin/env node

/**
 * Script para testar se a autenticação OAuth foi bem-sucedida
 * Verifica se há tokens válidos no cache de produção
 */

require('dotenv').config({ path: '.env.local' });

async function checkProdAuth() {
  console.log('🔍 VERIFICAÇÃO DE AUTENTICAÇÃO PRODUÇÃO');
  console.log('======================================\n');
  
  // URL mais recente do deploy
  const BASE_URL = 'https://peepers-n9yvsw84x-antoniovbrazs-projects.vercel.app';
  
  console.log('1. Verificando se a página de callback funcionou...');
  console.log('   (Testando através do status da sincronização)\n');
  
  // Primeiro, tentar o endpoint de sincronização simples (GET)
  try {
    console.log('Tentando sincronização GET...');
    const response = await fetch(`${BASE_URL}/api/ml/sync?action=sync`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Peepers-Auth-Check/1.0'
      }
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.status === 200) {
      const text = await response.text();
      if (text.includes('success') || text.includes('produtos') || text.includes('sync')) {
        console.log('✅ Sincronização iniciada - autenticação provavelmente OK');
        return true;
      }
    } else if (response.status === 401) {
      console.log('❌ Ainda sem autenticação válida');
    }
    
  } catch (error) {
    console.log(`Erro na verificação: ${error.message}`);
  }
  
  console.log('\n2. Tentando com POST e admin token...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/ml/sync`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer peepers-admin-secret-2024-sync-access',
        'Content-Type': 'application/json',
        'User-Agent': 'Peepers-Auth-Check/1.0'
      }
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Sincronização manual funcionou!');
      console.log(`Resultado: ${JSON.stringify(data, null, 2)}`);
      return true;
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.log(`❌ Erro: ${errorData.error || 'Erro desconhecido'}`);
      
      if (errorData.hint) {
        console.log(`💡 Dica: ${errorData.hint}`);
      }
    }
    
  } catch (error) {
    console.log(`Erro na requisição POST: ${error.message}`);
  }
  
  console.log('\n3. Verificando endpoint de produtos...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/products`, {
      headers: {
        'User-Agent': 'Peepers-Auth-Check/1.0'
      }
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Produtos: ${data.products ? data.products.length : 0} encontrados`);
      
      if (data.products && data.products.length > 0) {
        console.log('🎉 SUCESSO! Sistema está funcionando completamente');
        return true;
      } else if (data.message && data.message.includes('sync')) {
        console.log('💡 Produtos não encontrados - sincronização necessária');
      }
    }
    
  } catch (error) {
    console.log(`Erro na verificação de produtos: ${error.message}`);
  }
  
  return false;
}

async function main() {
  const success = await checkProdAuth();
  
  console.log('\n📋 RESULTADO FINAL:');
  console.log('==================');
  
  if (success) {
    console.log('🎉 ✅ AUTENTICAÇÃO FUNCIONANDO!');
    console.log('   O sistema está operacional e tokens válidos');
  } else {
    console.log('❌ PROBLEMA PERSISTENTE');
    console.log('   Possíveis causas:');
    console.log('   1. Proteção de autenticação do Vercel ainda ativa');
    console.log('   2. Token não foi salvo corretamente');
    console.log('   3. Erro no processo de callback');
    console.log('');
    console.log('💡 PRÓXIMOS PASSOS:');
    console.log('   - Verificar logs do Vercel');
    console.log('   - Tentar nova autenticação se necessário');
    console.log('   - URL: https://peepers.vercel.app/api/ml/auth');
  }
}

main().catch(console.error);