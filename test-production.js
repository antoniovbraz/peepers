#!/usr/bin/env node

/**
 * Test script for Peepers production deployment
 * Tests missed feeds recovery and webhook security on https://peepers.vercel.app/
 */

const BASE_URL = 'https://peepers.vercel.app';

async function testEndpoint(endpoint, method = 'GET', body = null) {
  const url = `${BASE_URL}${endpoint}`;
  console.log(`\n🧪 Testing: ${method} ${url}`);

  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Peepers-Test-Script/1.0'
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const responseTime = Date.now();

    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`⏱️  Response time: ${responseTime}ms`);

    if (response.ok) {
      const data = await response.json().catch(() => ({ message: 'Non-JSON response' }));
      console.log(`✅ Success:`, data);
      return { success: true, data, status: response.status };
    } else {
      const error = await response.text().catch(() => 'Unknown error');
      console.log(`❌ Error:`, error);
      return { success: false, error, status: response.status };
    }
  } catch (error) {
    console.log(`💥 Network error:`, error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Starting Peepers Production Tests');
  console.log('🌐 Base URL:', BASE_URL);
  console.log('📅 Date:', new Date().toISOString());

  // Test 1: Health check
  console.log('\n' + '='.repeat(50));
  console.log('🏥 TEST 1: Health Check');
  await testEndpoint('/api/health');

  // Test 2: Cache debug
  console.log('\n' + '='.repeat(50));
  console.log('💾 TEST 2: Cache Debug');
  await testEndpoint('/api/cache-debug');

  // Test 3: Webhook security test
  console.log('\n' + '='.repeat(50));
  console.log('🔒 TEST 3: Webhook Security Test');
  await testEndpoint('/api/test-webhook-security');

  // Test 4: Missed feeds recovery endpoint
  console.log('\n' + '='.repeat(50));
  console.log('🔄 TEST 4: Missed Feeds Recovery');
  await testEndpoint('/api/recovery/missed-feeds', 'POST', {
    tenantId: 'test-tenant',
    options: {
      dryRun: true,
      maxAgeHours: 24
    }
  });

  // Test 5: Products endpoint (should require auth)
  console.log('\n' + '='.repeat(50));
  console.log('📦 TEST 5: Products Endpoint (should fail without auth)');
  await testEndpoint('/api/v1/products');

  // Test 6: Webhook endpoint (should reject non-POST)
  console.log('\n' + '='.repeat(50));
  console.log('📡 TEST 6: Webhook Endpoint (GET should fail)');
  await testEndpoint('/api/webhook/mercado-livre');

  console.log('\n' + '='.repeat(50));
  console.log('✅ All tests completed!');
  console.log('📝 Note: Some endpoints require authentication or specific conditions');
  console.log('🔗 Production URL: https://peepers.vercel.app/');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testEndpoint, runTests };