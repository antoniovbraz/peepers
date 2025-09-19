#!/usr/bin/env node

/**
 * Admin Panel Diagnostics Script
 * 
 * Tests the admin panel functionality to identify the source of 500 errors
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.VERCEL_URL || 'https://peepers.vercel.app';
// Test configuration
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'peepers.shop@gmail.com';

console.log('🔍 Admin Panel Diagnostics Starting...');
console.log(`📍 Base URL: ${BASE_URL}`);
console.log(`👤 Super Admin Email: ${SUPER_ADMIN_EMAIL}`);
console.log('=' .repeat(60));

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestModule = urlObj.protocol === 'https:' ? https : http;
    
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'Admin-Diagnostics/1.0',
        'Accept': 'application/json,text/html',
        ...options.headers
      }
    };

    const req = requestModule.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          url: url
        });
      });
    });

    req.on('error', (error) => {
      reject({ error: error.message, url });
    });

    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Test functions
async function testHealthEndpoint() {
  console.log('\n🏥 Testing Health Endpoint...');
  try {
    const response = await makeRequest(`${BASE_URL}/api/health`);
    console.log(`✅ Health Status: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      const health = JSON.parse(response.body);
      console.log(`   Cache Status: ${health.cache}`);
      console.log(`   Timestamp: ${health.timestamp}`);
    } else {
      console.log(`❌ Health check failed: ${response.body}`);
    }
  } catch (error) {
    console.log(`❌ Health endpoint error: ${error.error || error.message}`);
  }
}

async function testAuthMe() {
  console.log('\n🔐 Testing Auth Me Endpoint...');
  try {
    const response = await makeRequest(`${BASE_URL}/api/auth/me`);
    console.log(`✅ Auth Status: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      const auth = JSON.parse(response.body);
      console.log(`   Authenticated: ${auth.authenticated}`);
      console.log(`   User Email: ${auth.user?.email || 'N/A'}`);
      console.log(`   Is Admin: ${auth.user?.isAdmin || false}`);
    } else {
      console.log(`❌ Auth check failed: ${response.body}`);
    }
  } catch (error) {
    console.log(`❌ Auth endpoint error: ${error.error || error.message}`);
  }
}

async function testAdminPage() {
  console.log('\n🎛️  Testing Admin Page...');
  try {
    const response = await makeRequest(`${BASE_URL}/admin`);
    console.log(`✅ Admin Page Status: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      console.log(`   Content Type: ${response.headers['content-type']}`);
      console.log(`   Content Length: ${response.body.length} bytes`);
      
      // Check for common error patterns
      if (response.body.includes('500')) {
        console.log(`❌ Page contains 500 error reference`);
      }
      if (response.body.includes('Stripe')) {
        console.log(`ℹ️  Page references Stripe (potential configuration issue)`);
      }
      if (response.body.includes('EntitlementsGuard')) {
        console.log(`ℹ️  Page references EntitlementsGuard`);
      }
    } else if (response.statusCode === 302 || response.statusCode === 307) {
      console.log(`🔄 Redirect to: ${response.headers.location}`);
    } else {
      console.log(`❌ Admin page failed: ${response.body.substring(0, 200)}...`);
    }
  } catch (error) {
    console.log(`❌ Admin page error: ${error.error || error.message}`);
  }
}

async function testAdminDashboard() {
  console.log('\n📊 Testing Admin Dashboard...');
  try {
    const response = await makeRequest(`${BASE_URL}/admin/dashboard`);
    console.log(`✅ Dashboard Status: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      console.log(`   Content Type: ${response.headers['content-type']}`);
      console.log(`   Content Length: ${response.body.length} bytes`);
    } else {
      console.log(`❌ Dashboard failed: ${response.body.substring(0, 200)}...`);
    }
  } catch (error) {
    console.log(`❌ Dashboard error: ${error.error || error.message}`);
  }
}

async function testAdminAPIs() {
  console.log('\n🔧 Testing Admin APIs...');
  
  const endpoints = [
    '/api/admin/products',
    '/api/admin/sales', 
    '/api/admin/metrics',
    '/api/admin/platform/stats',
    '/api/admin/rate-limit-stats'
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(`${BASE_URL}${endpoint}`);
      console.log(`   ${endpoint}: ${response.statusCode}`);
      
      if (response.statusCode >= 400) {
        console.log(`      Error: ${response.body.substring(0, 100)}...`);
      }
    } catch (error) {
      console.log(`   ${endpoint}: ERROR - ${error.error || error.message}`);
    }
  }
}

async function testCacheDebug() {
  console.log('\n💾 Testing Cache Debug...');
  try {
    const response = await makeRequest(`${BASE_URL}/api/cache-debug`);
    console.log(`✅ Cache Debug Status: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      const cache = JSON.parse(response.body);
      console.log(`   Connected: ${cache.connected}`);
      console.log(`   Keys Count: ${cache.keys?.length || 0}`);
      console.log(`   Environment: ${cache.environment}`);
    } else {
      console.log(`❌ Cache debug failed: ${response.body}`);
    }
  } catch (error) {
    console.log(`❌ Cache debug error: ${error.error || error.message}`);
  }
}

// Run all tests
async function runDiagnostics() {
  try {
    await testHealthEndpoint();
    await testCacheDebug();
    await testAuthMe();
    await testAdminAPIs();
    await testAdminPage();
    await testAdminDashboard();
    
    console.log('\n' + '='.repeat(60));
    console.log('🎯 Diagnostics Complete!');
    console.log('\nNext Steps:');
    console.log('1. Check Vercel function logs for detailed error traces');
    console.log('2. Verify SUPER_ADMIN_EMAIL environment variable is set');
    console.log('3. Check if STRIPE_SECRET_KEY is properly configured');
    console.log('4. Test individual admin components separately');
    
  } catch (error) {
    console.error('❌ Diagnostics failed:', error);
    process.exit(1);
  }
}

// Run the diagnostics
runDiagnostics();