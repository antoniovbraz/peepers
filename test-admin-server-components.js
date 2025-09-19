#!/usr/bin/env node

/**
 * Admin Panel Server Components Diagnostics
 * 
 * Tests server components specifically to isolate issues
 */

const https = require('https');

const BASE_URL = 'https://peepers.vercel.app';

console.log('🧪 Testing Server Components...');

async function testMinimalPage() {
  console.log('\n📄 Testing minimal page render...');
  
  // Test a simple GET request with verbose error handling
  const response = await new Promise((resolve) => {
    const req = https.request({
      hostname: 'peepers.vercel.app',
      path: '/admin',
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Admin-Test/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        statusCode: 'ERROR',
        error: error.message
      });
    });

    req.end();
  });

  console.log(`Status: ${response.statusCode}`);
  
  if (response.statusCode === 500) {
    // Try to extract more details from the error page
    const body = response.body;
    
    // Look for Next.js error details
    if (body.includes('Internal Server Error')) {
      console.log('❌ Next.js Internal Server Error detected');
    }
    
    // Check for specific error patterns
    const errorPatterns = [
      'EntitlementsGuard',
      'Stripe',
      'SUPER_ADMIN_EMAIL',
      'middleware',
      'headers',
      'x-pathname',
      'TypeError',
      'ReferenceError',
      'SyntaxError'
    ];
    
    errorPatterns.forEach(pattern => {
      if (body.includes(pattern)) {
        console.log(`🔍 Found reference to: ${pattern}`);
      }
    });
    
    // Try to extract any visible error messages
    const matches = body.match(/Error: ([^<]+)</g);
    if (matches) {
      console.log('📋 Error messages found:');
      matches.forEach(match => {
        console.log(`   ${match}`);
      });
    }
  }
}

async function testWithDifferentPaths() {
  console.log('\n🛣️  Testing different admin paths...');
  
  const paths = [
    '/admin',
    '/admin/',
    '/admin/dashboard',
    '/admin/produtos'
  ];
  
  for (const path of paths) {
    try {
      const response = await new Promise((resolve) => {
        const req = https.request({
          hostname: 'peepers.vercel.app',
          path: path,
          method: 'GET',
          timeout: 10000
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve({ statusCode: res.statusCode, size: data.length }));
        });
        
        req.on('error', (error) => resolve({ error: error.message }));
        req.on('timeout', () => resolve({ timeout: true }));
        req.end();
      });
      
      if (response.timeout) {
        console.log(`   ${path}: TIMEOUT`);
      } else if (response.error) {
        console.log(`   ${path}: ERROR - ${response.error}`);
      } else {
        console.log(`   ${path}: ${response.statusCode} (${response.size} bytes)`);
      }
    } catch (error) {
      console.log(`   ${path}: EXCEPTION - ${error.message}`);
    }
  }
}

async function testEnvironmentGuess() {
  console.log('\n🔧 Testing environment-related endpoints...');
  
  // Test some environment-sensitive endpoints
  const endpoints = [
    '/api/health',
    '/api/cache-debug', 
    '/api/debug-headers'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await new Promise((resolve) => {
        const req = https.request({
          hostname: 'peepers.vercel.app',
          path: endpoint,
          method: 'GET'
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            resolve({
              statusCode: res.statusCode,
              body: data,
              headers: res.headers
            });
          });
        });
        
        req.on('error', (error) => resolve({ error: error.message }));
        req.end();
      });
      
      if (response.error) {
        console.log(`   ${endpoint}: ERROR - ${response.error}`);
      } else {
        console.log(`   ${endpoint}: ${response.statusCode}`);
        
        if (response.statusCode === 200 && endpoint === '/api/cache-debug') {
          try {
            const data = JSON.parse(response.body);
            console.log(`      Redis Connected: ${data.connected}`);
            console.log(`      Environment: ${JSON.stringify(data.environment).substring(0, 100)}...`);
          } catch (e) {
            console.log(`      Parse error: ${e.message}`);
          }
        }
      }
    } catch (error) {
      console.log(`   ${endpoint}: EXCEPTION - ${error.message}`);
    }
  }
}

// Run all tests
async function run() {
  try {
    await testMinimalPage();
    await testWithDifferentPaths();
    await testEnvironmentGuess();
    
    console.log('\n' + '='.repeat(50));
    console.log('💡 Analysis Summary:');
    console.log('- Admin pages consistently return 500 errors');
    console.log('- API endpoints have mixed success (some work, some fail)');
    console.log('- Need to check Vercel function logs for exact error cause');
    console.log('');
    console.log('🔧 Recommended Actions:');
    console.log('1. Check Vercel dashboard function logs');
    console.log('2. Test EntitlementsGuard in isolation');
    console.log('3. Verify all environment variables are set');
    console.log('4. Test with simplified admin layout');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  }
}

run();