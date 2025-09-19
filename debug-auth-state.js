#!/usr/bin/env node

const BASE_URL = 'https://peepers.vercel.app';

async function debugAuthState() {
  console.log('🔍 Debugging Authentication State...\n');

  try {
    // Check if user can access the auth/me endpoint
    console.log('1. Testing auth/me endpoint:');
    const authResponse = await fetch(`${BASE_URL}/api/auth/me`);
    console.log(`Auth Me Status: ${authResponse.status}`);
    
    if (authResponse.status === 200) {
      const authData = await authResponse.json();
      console.log('Auth Data:', authData);
    } else {
      const errorText = await authResponse.text();
      console.log('Auth Error:', errorText);
    }

    // Check the ML authentication flow
    console.log('\n2. Testing ML auth initiation:');
    const mlAuthResponse = await fetch(`${BASE_URL}/api/auth/mercado-livre`, {
      redirect: 'manual' // Don't follow redirects
    });
    console.log(`ML Auth Status: ${mlAuthResponse.status}`);
    console.log(`ML Auth Location: ${mlAuthResponse.headers.get('location')}`);

    // Check cache debug to see what's stored
    console.log('\n3. Testing cache debug:');
    const cacheResponse = await fetch(`${BASE_URL}/api/cache-debug`);
    const cacheData = await cacheResponse.json();
    console.log(`Cache Debug Status: ${cacheResponse.status}`);
    console.log('Cache Keys:', cacheData.data?.keys?.slice(0, 5) || 'none'); // Show first 5 keys

    console.log('\n✅ Auth debug completed!');

  } catch (error) {
    console.error('❌ Debug Error:', error.message);
  }
}

debugAuthState();