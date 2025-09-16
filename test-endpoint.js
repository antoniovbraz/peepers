const http = require('http');

function testEndpoint() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/products',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      console.log('Status:', res.statusCode);

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log('Success! Response structure:');
          console.log('- success:', json.success);
          console.log('- message:', json.message);
          console.log('- products count:', json.data?.products?.length || 0);
          console.log('- total:', json.data?.total || 0);
          resolve(json);
        } catch (e) {
          console.log('Raw response (first 200 chars):', data.substring(0, 200));
          resolve(data);
        }
      });
    });

    req.on('error', (e) => {
      console.error('Connection error:', e.message);
      reject(e);
    });

    req.setTimeout(5000, () => {
      console.log('Request timeout');
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.end();
  });
}

testEndpoint()
  .then(() => console.log('Test completed'))
  .catch(err => console.error('Test failed:', err.message));