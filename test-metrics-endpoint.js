#!/usr/bin/env node

/**
 * Test admin dashboard metrics endpoint specifically
 */

const https = require('https');

async function testMetricsEndpoint() {
  console.log('🔍 Testing Admin Dashboard Metrics Endpoint...');
  
  try {
    const response = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'peepers.vercel.app',
        path: '/api/admin/dashboard/metrics',
        method: 'GET',
        headers: {
          'User-Agent': 'Admin-Test/1.0',
          'Accept': 'application/json',
          'Cookie': 'user_id=669073070' // Try with user_id cookie
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
        reject(error);
      });

      req.end();
    });

    console.log(`Status: ${response.statusCode}`);
    console.log(`Headers:`, JSON.stringify(response.headers, null, 2));
    
    if (response.statusCode === 500) {
      console.log('\n❌ 500 Error Response:');
      console.log(response.body);
      
      // Try to extract error details
      if (response.body.includes('Error:')) {
        const errorMatch = response.body.match(/Error: ([^\\n]+)/);
        if (errorMatch) {
          console.log('\n🔍 Extracted Error:', errorMatch[1]);
        }
      }
    } else {
      console.log('\n✅ Response Body:');
      console.log(response.body);
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

testMetricsEndpoint();