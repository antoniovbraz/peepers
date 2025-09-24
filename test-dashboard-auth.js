#!/usr/bin/env node

const https = require('https');
const { URL } = require('url');

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function testDashboardMetrics() {
  console.log('🔍 Testing dashboard metrics endpoint...');

  try {
    // First get cache debug to see current state
    const cacheUrl = new URL('https://peepers.vercel.app/api/cache-debug');
    const cacheResponse = await makeRequest(cacheUrl);

    if (cacheResponse.status === 200) {
      console.log('📊 Cache status:', JSON.stringify(cacheResponse.data));
    }

    // Test dashboard metrics with simulated session
    const metricsUrl = new URL('https://peepers.vercel.app/api/admin/dashboard/metrics');

    // Simulate valid session cookies (from cache data)
    const cookies = [
      'user_id=669073070',
      'session_token=test-session-token-123', // This will be validated by middleware
      'Path=/',
      'Domain=peepers.vercel.app',
      'Secure',
      'HttpOnly'
    ];

    const response = await makeRequest(metricsUrl, {
      method: 'GET',
      headers: {
        'Cookie': cookies.join('; '),
        'User-Agent': 'Dashboard-Test/1.0',
        'Accept': 'application/json'
      }
    });

    console.log('📈 Dashboard metrics response:', response.data);

    if (response.status === 200 && response.data.success) {
      console.log('✅ Dashboard metrics loaded successfully!');
      console.log('📊 Metrics data:', JSON.stringify(response.data.data, null, 2));
    } else {
      console.log('❌ Dashboard metrics failed:', response.data);
    }

  } catch (error) {
    console.error('❌ Error testing dashboard:', error.message);
  }
}

testDashboardMetrics();