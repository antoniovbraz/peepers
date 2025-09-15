#!/usr/bin/env node

/**
 * Script para testar endpoints em produção
 * Funciona em Windows, Linux e Mac
 */

const https = require('https');

const PROD_URL = 'https://peepers.vercel.app';
const endpoint = process.argv[2] || 'products-public';

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

                const endpoints = ['health', 'products-public', 'products', 'auth-me'];

                for (const ep of endpoints) {
                    console.log(`${endpoints.indexOf(ep) + 1}. Testando ${ep}:`);
                    const testUrl = `${PROD_URL}/api/${ep}`;
                    const testResponse = await makeRequest(testUrl);

                    if (ep === 'products-public' && testResponse.data.products) {
                        console.log(`   ✅ ${testResponse.data.total} produtos`);
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