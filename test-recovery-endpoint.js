#!/usr/bin/env node

/**
 * Test script for Missed Feeds Recovery endpoint
 * Tests the /api/recovery/missed-feeds endpoint on production
 */

const BASE_URL = 'https://peepers.vercel.app';

async function testRecoveryEndpoint() {
  console.log('🔄 Testing Missed Feeds Recovery Endpoint');
  console.log('🌐 URL:', BASE_URL);
  console.log('📅 Date:', new Date().toISOString());
  console.log('='.repeat(60));

  // Test 1: GET request (should return error about tenantId required)
  console.log('\n🧪 TEST 1: GET /api/recovery/missed-feeds (without tenantId)');
  try {
    const response = await fetch(`${BASE_URL}/api/recovery/missed-feeds`);
    const data = await response.json().catch(() => ({ error: 'Invalid JSON' }));

    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    if (response.status === 400 && data.error?.includes('tenantId')) {
      console.log('✅ Correctly requires tenantId parameter');
    } else {
      console.log('❌ Unexpected response:', data);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }

  // Test 2: GET request with tenantId
  console.log('\n🧪 TEST 2: GET /api/recovery/missed-feeds?tenantId=test-tenant');
  try {
    const response = await fetch(`${BASE_URL}/api/recovery/missed-feeds?tenantId=test-tenant`);
    const data = await response.json().catch(() => ({ error: 'Invalid JSON' }));

    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    if (response.ok && data.success) {
      console.log('✅ Successfully retrieved recovery stats');
      console.log('📈 Stats:', {
        lastRecovery: data.data.lastRecovery ? 'Available' : 'None',
        totalProcessed: data.data.totalProcessed,
        totalFailed: data.data.totalFailed
      });
    } else {
      console.log('❌ Failed to get stats:', data.error || data);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }

  // Test 3: POST request with dry run
  console.log('\n🧪 TEST 3: POST /api/recovery/missed-feeds (dry run)');
  try {
    const response = await fetch(`${BASE_URL}/api/recovery/missed-feeds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tenantId: 'test-tenant',
        dryRun: true,
        maxAgeHours: 24
      })
    });

    const data = await response.json().catch(() => ({ error: 'Invalid JSON' }));

    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    if (response.ok && data.success) {
      console.log('✅ Dry run completed successfully');
      console.log('📊 Results:', {
        processed: data.data.processed,
        failed: data.data.failed,
        skipped: data.data.skipped,
        duration: `${data.data.duration_ms}ms`
      });
    } else {
      console.log('❌ Dry run failed:', data.error || data);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }

  // Test 4: POST request with invalid data
  console.log('\n🧪 TEST 4: POST /api/recovery/missed-feeds (invalid data)');
  try {
    const response = await fetch(`${BASE_URL}/api/recovery/missed-feeds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        // Missing tenantId - should fail validation
        dryRun: true
      })
    });

    const data = await response.json().catch(() => ({ error: 'Invalid JSON' }));

    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    if (response.status === 400 && data.error?.includes('Parâmetros inválidos')) {
      console.log('✅ Correctly validated invalid parameters');
    } else {
      console.log('❌ Validation failed:', data);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Recovery endpoint tests completed!');
  console.log('🔗 Production URL: https://peepers.vercel.app/');
  console.log('📡 Endpoint: /api/recovery/missed-feeds');
  console.log('\n📝 Usage Examples:');
  console.log('GET:  /api/recovery/missed-feeds?tenantId=YOUR_TENANT_ID');
  console.log('POST: /api/recovery/missed-feeds with JSON body');
}

// Run tests if this script is executed directly
if (require.main === module) {
  testRecoveryEndpoint().catch(console.error);
}

module.exports = { testRecoveryEndpoint };