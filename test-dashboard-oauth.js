const https = require('https');
const { URL } = require('url');

// Test dashboard metrics with full OAuth flow
async function testFullDashboardFlow() {
  console.log('🔍 Testing full dashboard flow with OAuth...');

  try {
    // Step 1: Start OAuth flow
    console.log('1️⃣ Starting OAuth flow...');
    const authResponse = await makeRequest('https://peepers.vercel.app/api/auth/mercado-livre');
    console.log('OAuth redirect response:', authResponse.substring(0, 200));

    // Step 2: Check if we can access cache debug
    console.log('2️⃣ Checking cache status...');
    const cacheResponse = await makeRequest('https://peepers.vercel.app/api/cache-debug');
    console.log('Cache status:', JSON.parse(cacheResponse));

    // Step 3: Try to access dashboard metrics (expect redirect)
    console.log('3️⃣ Testing dashboard metrics access...');
    const metricsResponse = await makeRequest('https://peepers.vercel.app/api/admin/dashboard/metrics');
    console.log('Dashboard metrics response:', metricsResponse.substring(0, 100));

    // Step 4: Check auth status
    console.log('4️⃣ Checking auth status...');
    const authStatus = await makeRequest('https://peepers.vercel.app/api/auth/me');
    console.log('Auth status:', authStatus.substring(0, 200));

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ...options.headers
      }
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    });

    req.on('error', reject);
    req.end();
  });
}

testFullDashboardFlow().catch(console.error);