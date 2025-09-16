#!/usr/bin/env node

/**
 * Script para testar endpoints em produção
 * ⚠️  IMPORTANTE: Este script SEMPRE testa no Vercel (produção)
 * Mercado Livre NÃO aceita URLs locais ou HTTP - apenas HTTPS pré-configurado
 * Funciona em Windows, Linux e Mac
 */

const https = require('https');

const PROD_URL = 'https://peepers.vercel.app';
const endpoint = process.argv[2] || 'products-public';

console.log('🚨 ATENÇÃO: Testando APENAS no Vercel (Produção)');
console.log('🌐 Mercado Livre requer HTTPS e URLs pré-configuradas');
console.log('❌ NÃO é possível testar localmente com ML API');
console.log('');
console.log(`🧪 Testando endpoint: ${endpoint}`);
console.log(`🌐 URL: ${PROD_URL}/api/${endpoint}`);
console.log('');

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({ statusCode: res.statusCode, data: jsonData });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, data: data });
                }
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

async function testEndpoint() {
    try {
        const url = `${PROD_URL}/api/${endpoint}`;
        const response = await makeRequest(url);

        switch (endpoint) {
            case 'health':
                console.log('🏥 Health check:');
                console.log(JSON.stringify(response.data, null, 2));
                break;

            case 'products-public':
                console.log('📦 Produtos públicos:');
                if (response.data.products) {
                    console.log(`✅ ${response.data.total} produtos encontrados`);
                    console.log(`📊 Status: ${response.data.success ? 'OK' : 'Erro'}`);
                } else {
                    console.log('❌ Resposta inesperada:', response.data);
                }
                break;

            case 'v1/products':
                console.log('🆕 Produtos API v1 (unificado):');
                if (response.data.data && response.data.data.products) {
                    console.log(`✅ ${response.data.data.total} produtos encontrados`);
                    console.log(`📄 Página: ${response.data.data.page}/${response.data.data.totalPages}`);
                    console.log(`📊 Status: ${response.data.success ? 'OK' : 'Erro'}`);
                } else {
                    console.log('❌ Resposta inesperada:', response.data);
                }
                break;

            case 'products':
                console.log('🔒 Produtos autenticados:');
                console.log(JSON.stringify(response.data, null, 2));
                break;

            case 'auth-me':
                console.log('👤 Autenticação:');
                console.log(`Status: ${response.statusCode}`);
                if (response.statusCode === 302) {
                    console.log('✅ Redirecionamento correto (não autenticado)');
                }
                break;

            case 'sync':
                console.log('🔄 Sincronização:');
                console.log(JSON.stringify(response.data, null, 2));
                break;

            case 'all':
                console.log('🔍 Testando todos os endpoints...\n');

                const endpoints = ['health', 'products-public', 'v1/products', 'products', 'auth-me'];

                for (const ep of endpoints) {
                    console.log(`${endpoints.indexOf(ep) + 1}. Testando ${ep}:`);
                    const testUrl = `${PROD_URL}/api/${ep}`;
                    const testResponse = await makeRequest(testUrl);

                    if (ep === 'products-public' && testResponse.data.products) {
                        console.log(`   ✅ ${testResponse.data.total} produtos`);
                    } else if (ep === 'v1/products' && testResponse.data.data && testResponse.data.data.products) {
                        console.log(`   ✅ ${testResponse.data.data.total} produtos (v1)`);
                    } else if (ep === 'auth-me') {
                        console.log(`   ✅ Status: ${testResponse.statusCode}`);
                    } else {
                        console.log(`   ✅ OK`);
                    }
                    console.log('');
                }
                break;

            default:
                console.log('❌ Endpoint desconhecido:', endpoint);
                console.log('\n📋 Endpoints disponíveis:');
                console.log('  health          - Health check');
                console.log('  products-public - Produtos públicos');
                console.log('  v1/products     - Produtos API v1 (unificado)');
                console.log('  products        - Produtos autenticados');
                console.log('  auth-me         - Status de autenticação');
                console.log('  sync            - Sincronização de produtos');
                console.log('  all             - Todos os endpoints');
                console.log('\n💡 Uso: npm run test:prod <endpoint>');
        }
    } catch (error) {
        console.error('❌ Erro:', error.message);
    }

    console.log('\n✅ Teste concluído!');
}

testEndpoint();