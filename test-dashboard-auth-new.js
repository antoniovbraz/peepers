const https = require('https');

// Test dashboard metrics with authentication
async function testDashboardMetrics() {
  console.log('🔍 Testing dashboard metrics endpoint...');

  // First, try to get cache debug info
  const cacheResponse = await makeRequest('https://peepers.vercel.app/api/cache-debug');
  console.log('📊 Cache status:', cacheResponse.data);

  // Try to access dashboard metrics (will likely redirect)
  const metricsResponse = await makeRequest('https://peepers.vercel.app/api/admin/dashboard/metrics');
  console.log('📈 Dashboard metrics response:', metricsResponse.data.substring(0, 200) + '...');

  // Try with mock session cookies
  const mockCookies = 'user_id=669073070; session_token=mock_session_123';
  const metricsWithCookies = await makeRequest('https://peepers.vercel.app/api/admin/dashboard/metrics', {
    headers: {
      'Cookie': mockCookies
    }
  });
  console.log('🍪 Dashboard metrics with mock cookies:', metricsWithCookies.data.substring(0, 200) + '...');
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);

    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ...options.headers
      }
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

testDashboardMetrics().catch(console.error);