#!/usr/bin/env node

const BASE_URL = 'https://peepers.vercel.app';

async function checkEnv() {
  try {
    const response = await fetch(`${BASE_URL}/api/debug-env`);
    const data = await response.json();
    
    console.log('🔧 Environment Variables Status:\n');
    console.log(`ALLOWED_USER_IDS: ${data.allowedUserIds}`);
    console.log(`Allowed Users Array: [${data.allowedUserIdsArray.join(', ')}]`);
    console.log(`SUPER_ADMIN_EMAIL: ${data.superAdminEmail}`);
    console.log(`ML_CLIENT_ID: ${data.mlClientId}`);
    console.log(`UPSTASH_REDIS_REST_URL: ${data.upstashUrl}`);
    console.log(`NODE_ENV: ${data.nodeEnv}`);
    
    // Analysis
    console.log('\n🔍 Analysis:');
    if (data.allowedUserIds === 'NOT_SET') {
      console.log('❌ CRITICAL: ALLOWED_USER_IDS not set - this will cause 401 errors');
    } else {
      console.log('✅ ALLOWED_USER_IDS is configured');
    }
    
    if (data.superAdminEmail === 'peepers.shop@gmail.com') {
      console.log('✅ SUPER_ADMIN_EMAIL correctly set');
    } else {
      console.log('❌ SUPER_ADMIN_EMAIL not set correctly');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkEnv();