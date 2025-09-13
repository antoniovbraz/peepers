#!/usr/bin/env node

/**
 * Script para diagnosticar problemas de autenticação no Mercado Livre
 * Verifica se há tokens válidos no cache e identifica problemas de autenticação
 */

require('dotenv').config({ path: '.env.local' });

// Importar cache diretamente usando Redis
const Redis = require('@upstash/redis').Redis;

// Criar instância do Redis diretamente
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Implementar funções básicas de cache
const cache = {
  async getUser(userId) {
    try {
      const result = await redis.get(`user:${userId}`);
      return result;
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      return null;
    }
  },
  
  async getLastSyncTime() {
    try {
      const result = await redis.get('last_sync_time');
      return result;
    } catch (error) {
      console.error('Erro ao buscar último sync:', error);
      return null;
    }
  },
  
  async getActiveProducts() {
    try {
      const result = await redis.get('products:active');
      return result ? JSON.parse(result) : null;
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      return null;
    }
  }
};

async function checkAuthStatus() {
  console.log('🔍 DIAGNÓSTICO DE AUTENTICAÇÃO ML');
  console.log('==================================\n');
  
  try {
    console.log('📋 VARIÁVEIS DE AMBIENTE:');
    console.log(`ML_CLIENT_ID: ${process.env.ML_CLIENT_ID ? 'CONFIGURADO' : 'FALTANDO'}`);
    console.log(`ML_CLIENT_SECRET: ${process.env.ML_CLIENT_SECRET ? 'CONFIGURADO' : 'FALTANDO'}`);
    console.log(`ML_ACCESS_TOKEN: ${process.env.ML_ACCESS_TOKEN ? 'CONFIGURADO' : 'FALTANDO'}`);
    console.log(`ML_REFRESH_TOKEN: ${process.env.ML_REFRESH_TOKEN ? 'CONFIGURADO' : 'FALTANDO'}`);
    console.log(`ML_USER_ID: ${process.env.ML_USER_ID ? 'CONFIGURADO' : 'FALTANDO'}`);
    console.log(`ADMIN_SECRET: ${process.env.ADMIN_SECRET ? 'CONFIGURADO' : 'FALTANDO'}\n`);
    
    // Verificar se há usuários autenticados no cache
    console.log('👤 USUÁRIOS NO CACHE:');
    
    // Tentar buscar dados de usuário usando ML_USER_ID se disponível
    if (process.env.ML_USER_ID) {
      const userData = await cache.getUser(process.env.ML_USER_ID);
      console.log(`Usuário ${process.env.ML_USER_ID}:`, userData ? 'ENCONTRADO' : 'NÃO ENCONTRADO');
      
      if (userData) {
        console.log('   Dados:', JSON.stringify(userData, null, 2));
      }
      
      // Verificar token de acesso
      const tokenData = await cache.getUser(`access_token:${process.env.ML_USER_ID}`);
      console.log(`Token para ${process.env.ML_USER_ID}:`, tokenData ? 'ENCONTRADO' : 'NÃO ENCONTRADO');
      
      if (tokenData) {
        console.log('   Token data:', JSON.stringify(tokenData, null, 2));
        
        // Verificar se o token expirou
        if (tokenData.expires_at) {
          const expiryDate = new Date(tokenData.expires_at);
          const now = new Date();
          const isExpired = expiryDate <= now;
          
          console.log(`   Expira em: ${expiryDate.toLocaleString()}`);
          console.log(`   Status: ${isExpired ? '❌ EXPIRADO' : '✅ VÁLIDO'}`);
          
          if (!isExpired) {
            const timeLeft = expiryDate - now;
            const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            console.log(`   Tempo restante: ${hoursLeft}h ${minutesLeft}m`);
          }
        }
      }
    } else {
      console.log('❌ ML_USER_ID não configurado - não é possível verificar usuários específicos');
    }
    
    console.log('\n🔄 ÚLTIMO SYNC:');
    const lastSync = await cache.getLastSyncTime();
    console.log('Data do último sync:', lastSync || 'NUNCA');
    
    console.log('\n📦 PRODUTOS NO CACHE:');
    const products = await cache.getActiveProducts();
    console.log(`Produtos ativos: ${products ? products.length : 0}`);
    
    // Verificar se há produtos no cache
    if (products && products.length > 0) {
      console.log('Primeiros 3 produtos:');
      products.slice(0, 3).forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.title} (${product.id}) - ${product.status}`);
      });
    }
    
    // Fazer verificação adicional de conectividade
    console.log('\n🌐 TESTE DE CONECTIVIDADE:');
    try {
      const response = await fetch('https://api.mercadolibre.com/sites/MLB');
      console.log(`API ML (sites): ${response.ok ? '✅ OK' : '❌ FALHA'} (${response.status})`);
    } catch (error) {
      console.log(`API ML (sites): ❌ ERRO - ${error.message}`);
    }
    
    console.log('\n📊 RESUMO DO DIAGNÓSTICO:');
    console.log('========================');
    
    const hasCredentials = process.env.ML_CLIENT_ID && process.env.ML_CLIENT_SECRET;
    const hasUser = process.env.ML_USER_ID;
    const hasAccessToken = process.env.ML_ACCESS_TOKEN;
    const hasAdminSecret = process.env.ADMIN_SECRET;
    const hasProducts = products && products.length > 0;
    
    console.log(`Credenciais configuradas: ${hasCredentials ? '✅' : '❌'}`);
    console.log(`Usuário configurado: ${hasUser ? '✅' : '❌'}`);
    console.log(`Token de acesso: ${hasAccessToken ? '✅' : '❌'}`);
    console.log(`Admin secret: ${hasAdminSecret ? '✅' : '❌'}`);
    console.log(`Produtos em cache: ${hasProducts ? '✅' : '❌'}`);
    
    if (!hasCredentials) {
      console.log('\n🚨 PROBLEMA: Credenciais ML não configuradas');
      console.log('Solução: Configure ML_CLIENT_ID e ML_CLIENT_SECRET');
    }
    
    if (!hasUser) {
      console.log('\n🚨 PROBLEMA PRINCIPAL: Usuário ML não autenticado');
      console.log('Solução: Execute o fluxo OAuth em /api/ml/auth');
      console.log('URL: https://peepers.vercel.app/api/ml/auth');
    }
    
    if (!hasAccessToken) {
      console.log('\n🚨 PROBLEMA: Token de acesso não configurado');
      console.log('Solução: Complete a autenticação OAuth para obter token');
    }
    
    if (!hasAdminSecret) {
      console.log('\n⚠️  AVISO: ADMIN_SECRET não configurado');
      console.log('Isso impede sincronização manual via POST /api/ml/sync');
    }
    
    if (!hasProducts) {
      console.log('\n💡 SUGESTÃO: Após autenticação, execute sincronização');
      console.log('A sincronização será necessária para carregar produtos');
    }
    
  } catch (error) {
    console.error('❌ Erro durante diagnóstico:', error.message);
    console.error('Stack:', error.stack);
  }
}

checkAuthStatus().then(() => {
  console.log('\n✅ Diagnóstico concluído');
}).catch(console.error);