#!/usr/bin/env node

const BASE_URL = 'https://peepers.vercel.app';

async function testAdminFlow() {
  console.log('🔍 Testing Admin Panel Full Flow...\n');

  try {
    // Test 1: Check EntitlementsGuard endpoint
    console.log('1. Testing EntitlementsGuard:');
    const guardResponse = await fetch(`${BASE_URL}/admin`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    console.log(`Admin Page Status: ${guardResponse.status}`);
    console.log(`Content-Type: ${guardResponse.headers.get('content-type')}`);
    
    if (guardResponse.status === 200) {
      const content = await guardResponse.text();
      const hasLoginButton = content.includes('Fazer Login');
      const hasError = content.includes('error') || content.includes('Error');
      console.log(`Has Login Button: ${hasLoginButton}`);
      console.log(`Has Error: ${hasError}`);
    }

    // Test 2: Check dashboard metrics API (should work)
    console.log('\n2. Testing Dashboard Metrics API:');
    const metricsResponse = await fetch(`${BASE_URL}/api/admin/dashboard/metrics`);
    console.log(`Metrics API Status: ${metricsResponse.status}`);
    
    if (metricsResponse.status === 200) {
      const metricsData = await metricsResponse.json();
      console.log(`Metrics Success: ${metricsData.success}`);
      console.log(`Order Revenue: ${metricsData.data?.orders?.totalRevenue || 'null'}`);
    }

    // Test 3: Check health endpoint
    console.log('\n3. Testing Health Endpoint:');
    const healthResponse = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthResponse.json();
    console.log(`Health Status: ${healthResponse.status}`);
    console.log(`Health Success: ${healthData.success}`);

    console.log('\n✅ Admin flow test completed!');

  } catch (error) {
    console.error('❌ Test Error:', error.message);
  }
}

testAdminFlow();