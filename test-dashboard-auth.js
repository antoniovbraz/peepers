const https = require('https');

// Test dashboard metrics with authentication
async function testDashboardMetrics() {
  console.log('🔍 Testing dashboard metrics endpoint...');

  // First, try to get cache debug info
  const cacheResponse = await makeRequest('https://peepers.vercel.app/api/cache-debug');
  console.log('📊 Cache status:', cacheResponse);

  // Try to access dashboard metrics (will likely redirect)
  const metricsResponse = await makeRequest('https://peepers.vercel.app/api/admin/dashboard/metrics');
  console.log('📈 Dashboard metrics response:', metricsResponse.substring(0, 200) + '...');
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

testDashboardMetrics().catch(console.error);