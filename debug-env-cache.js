#!/usr/bin/env node

const BASE_URL = 'https://peepers.vercel.app';

async function debugEnvAndCache() {
  console.log('🔧 Debugging Environment and Cache...\n');

  try {
    // 1. Test cache debug endpoint
    console.log('1. Testing cache debug:');
    const cacheResponse = await fetch(`${BASE_URL}/api/cache-debug`);
    const cacheData = await cacheResponse.json();
    
    console.log(`Cache debug status: ${cacheResponse.status}`);
    if (cacheData.success) {
      console.log(`Total cache keys: ${cacheData.data.keys.length}`);
      
      // Look for user data in cache
      const userKeys = cacheData.data.keys.filter(key => key.includes('user_'));
      console.log(`User cache keys found: ${userKeys.length}`);
      
      if (userKeys.length > 0) {
        console.log('Sample user keys:', userKeys.slice(0, 3));
      }
      
      // Look for session tokens
      const sessionKeys = cacheData.data.keys.filter(key => key.includes('session'));
      console.log(`Session keys found: ${sessionKeys.length}`);
    }

    // 2. Test debug admin config
    console.log('\n2. Testing admin config:');
    const configResponse = await fetch(`${BASE_URL}/api/debug-admin-config`);
    const configData = await configResponse.json();
    
    console.log('Admin Config:', {
      superAdminEmail: configData.superAdminEmail,
      expectedEmail: configData.expectedEmail,
      isCorrectlyConfigured: configData.isCorrectlyConfigured
    });

    // 3. Test a valid ML user callback simulation
    console.log('\n3. Testing if there are any active sessions:');
    
    // Try different user IDs that might be in ALLOWED_USER_IDS
    const testUserIds = ['669073070', '123456789', 'test'];
    
    for (const testUserId of testUserIds) {
      const testResponse = await fetch(`${BASE_URL}/api/auth/me`, {
        headers: {
          'Cookie': `user_id=${testUserId}; session_token=test-token; user_email=peepers.shop@gmail.com`
        }
      });
      
      console.log(`User ID ${testUserId}: Status ${testResponse.status}`);
      
      if (testResponse.status !== 401) {
        const responseData = await testResponse.json();
        console.log(`Response for ${testUserId}:`, responseData);
      }
    }

    console.log('\n📋 Diagnosis:');
    console.log('- Check if ALLOWED_USER_IDS environment variable is set');
    console.log('- Check if session tokens are being stored in cache correctly');
    console.log('- Verify that user_id matches ALLOWED_USER_IDS');

  } catch (error) {
    console.error('❌ Debug error:', error.message);
  }
}

debugEnvAndCache();