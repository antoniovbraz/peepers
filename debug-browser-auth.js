#!/usr/bin/env node

/**
 * Debug Browser Authentication
 * Simula o comportamento do browser vs curl para identificar diferenças
 */

const https = require('https');

const BASE_URL = 'https://peepers.vercel.app';

async function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${path}`;
    console.log(`\n🔍 Testing: ${url}`);
    
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        ...options.headers
      }
    }, (res) => {
      let data = '';
      
      console.log(`Status: ${res.statusCode}`);
      console.log(`Headers:`, Object.keys(res.headers).filter(h => 
        h.includes('cookie') || h.includes('auth') || h.includes('session')
      ).reduce((obj, key) => {
        obj[key] = res.headers[key];
        return obj;
      }, {}));
      
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', reject);
  });
}

async function testBrowserBehavior() {
  console.log('🔍 BROWSER AUTHENTICATION DEBUG');
  console.log('===============================');
  
  // 1. Test admin page directly (simulating browser)
  console.log('\n1. Testing /admin page (browser simulation)');
  const adminResult = await makeRequest('/admin');
  
  if (adminResult.body.includes('Verificando autenticação')) {
    console.log('❌ PROBLEM: Admin page stuck in "Verificando autenticação" loop');
    console.log('This indicates EntitlementsGuard is not finding valid cookies');
  } else if (adminResult.body.includes('Painel Admin')) {
    console.log('✅ SUCCESS: Admin page loaded correctly');
  } else {
    console.log('⚠️  UNKNOWN STATE: Unable to determine admin page state');
  }
  
  // 2. Test auth status API
  console.log('\n2. Testing /api/auth/status');
  const authStatus = await makeRequest('/api/auth/status');
  console.log('Auth Status Response:', authStatus.body.substring(0, 200));
  
  // 3. Test auth debug API
  console.log('\n3. Testing /api/auth/debug');
  const authDebug = await makeRequest('/api/auth/debug');
  console.log('Auth Debug Response:', authDebug.body.substring(0, 300));
  
  // 4. Test cache debug to see if tokens exist
  console.log('\n4. Testing /api/cache-debug');
  const cacheDebug = await makeRequest('/api/cache-debug');
  console.log('Cache Debug Response:', cacheDebug.body.substring(0, 400));
  
  console.log('\n📊 ANALYSIS:');
  console.log('=============');
  
  try {
    const authStatusData = JSON.parse(authStatus.body);
    if (!authStatusData.authenticated) {
      console.log('❌ Browser sees user as NOT authenticated');
      console.log(`   Missing cookies: ${Object.entries(authStatusData.cookies).filter(([k,v]) => v === 'MISSING').map(([k]) => k).join(', ')}`);
    } else {
      console.log('✅ Browser sees user as authenticated');
    }
    
    const cacheData = JSON.parse(cacheDebug.body);
    if (cacheData.cache_checks?.user_token_exists) {
      console.log('✅ Cache has valid tokens stored');
      console.log(`   User ID: ${cacheData.user_id}`);
      console.log(`   Token length: ${cacheData.cache_checks.user_token_data?.token_length}`);
    } else {
      console.log('❌ Cache does NOT have valid tokens');
    }
    
  } catch (e) {
    console.log('⚠️  Unable to parse API responses');
  }
  
  console.log('\n🔧 RECOMMENDED ACTIONS:');
  console.log('========================');
  console.log('1. Check if cookies are being set with correct domain/path');
  console.log('2. Verify sameSite and secure settings are browser-compatible');
  console.log('3. Test OAuth flow completion to ensure cookies persist');
  console.log('4. Check if EntitlementsGuard logic matches actual cookie state');
}

// Run the test
testBrowserBehavior().catch(console.error);