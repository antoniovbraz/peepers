#!/usr/bin/env node

/**
 * Script para forçar invalidação de cache no Vercel
 * e verificar se as mudanças estão sendo aplicadas corretamente
 */

const https = require('https');

const PROD_URL = 'https://peepers.vercel.app';

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'User-Agent': 'Cache-Buster/1.0'
      }
    };

    const req = https.get(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: body.substring(0, 500) // Primeiros 500 caracteres
        });
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function checkCache() {
  console.log('🔄 VERIFICANDO CACHE DO VERCEL\n');
  
  try {
    // 1. Verificar página principal
    console.log('1. Verificando página principal...');
    const mainPage = await makeRequest(PROD_URL);
    console.log(`Status: ${mainPage.status}`);
    console.log(`Cache-Control: ${mainPage.headers['cache-control'] || 'Not set'}`);
    console.log(`ETag: ${mainPage.headers['etag'] || 'Not set'}`);
    
    // 2. Verificar página de produtos
    console.log('\n2. Verificando página de produtos...');
    const productsPage = await makeRequest(`${PROD_URL}/produtos`);
    console.log(`Status: ${productsPage.status}`);
    console.log(`Cache-Control: ${productsPage.headers['cache-control'] || 'Not set'}`);
    
    // 3. Verificar API de produtos públicos
    console.log('\n3. Verificando API de produtos...');
    const apiProducts = await makeRequest(`${PROD_URL}/api/products-public`);
    console.log(`Status: ${apiProducts.status}`);
    console.log(`Response preview: ${apiProducts.body.substring(0, 100)}...`);
    
    // 4. Verificar se build inclui as mudanças
    console.log('\n4. Verificando se object-contain está no código...');
    if (productsPage.body.includes('object-contain')) {
      console.log('✅ object-contain encontrado no HTML!');
    } else if (productsPage.body.includes('object-cover')) {
      console.log('❌ Ainda encontrando object-cover no HTML');
    } else {
      console.log('⚠️  Nenhum object-* encontrado no HTML');
    }
    
    console.log('\n📝 RECOMENDAÇÕES:');
    console.log('1. Limpe o cache do browser (Ctrl+F5)');
    console.log('2. Teste em aba anônima/incógnita');
    console.log('3. Aguarde alguns minutos para propagação CDN');
    console.log('4. Verifique developer tools para cache de imagens');
    
  } catch (error) {
    console.error('❌ Erro ao verificar:', error.message);
  }
}

checkCache();