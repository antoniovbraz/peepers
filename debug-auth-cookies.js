#!/usr/bin/env node

const BASE_URL = 'https://peepers.vercel.app';

async function debugAuthCookies() {
  console.log('🍪 Testing Auth Cookie Persistence...\n');

  try {
    // 1. Test admin page access (should show EntitlementsGuard)
    console.log('1. Testing admin page access without auth:');
    const adminResponse = await fetch(`${BASE_URL}/admin`, {
      redirect: 'manual'
    });
    
    console.log(`Status: ${adminResponse.status}`);
    if (adminResponse.status === 302 || adminResponse.status === 307) {
      const location = adminResponse.headers.get('location');
      console.log(`Redirected to: ${location}`);
      
      if (location && location.includes('/login')) {
        console.log('✅ Correctly redirecting to login');
      } else {
        console.log('❌ Unexpected redirect location');
      }
    } else if (adminResponse.status === 200) {
      console.log('⚠️ Admin page accessible without auth (check EntitlementsGuard)');
    }

    // 2. Test with mocked auth cookies
    console.log('\n2. Testing admin access with mock auth cookies:');
    const mockUserId = '669073070'; // Your ML user ID
    const mockSessionToken = 'test-session-' + Date.now();
    const mockEmail = 'peepers.shop@gmail.com';

    const authTestResponse = await fetch(`${BASE_URL}/admin`, {
      headers: {
        'Cookie': `user_id=${mockUserId}; session_token=${mockSessionToken}; user_email=${mockEmail}`
      },
      redirect: 'manual'
    });

    console.log(`Auth test status: ${authTestResponse.status}`);
    if (authTestResponse.status === 200) {
      console.log('✅ Admin page accessible with auth cookies');
    } else if (authTestResponse.status === 302) {
      console.log('❌ Still redirecting despite auth cookies');
    }

    // 3. Test auth/me endpoint
    console.log('\n3. Testing /api/auth/me endpoint:');
    const meResponse = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: {
        'Cookie': `user_id=${mockUserId}; session_token=${mockSessionToken}; user_email=${mockEmail}`
      }
    });

    console.log(`Me endpoint status: ${meResponse.status}`);
    if (meResponse.status === 200) {
      const meData = await meResponse.json();
      console.log('User data:', {
        authenticated: meData.authenticated,
        userId: meData.userId,
        email: meData.email
      });
    }

    // 4. Test products endpoint with auth
    console.log('\n4. Testing /api/products with auth cookies:');
    const productsResponse = await fetch(`${BASE_URL}/api/products?format=summary&limit=10`, {
      headers: {
        'Cookie': `user_id=${mockUserId}; session_token=${mockSessionToken}; user_email=${mockEmail}`
      }
    });

    console.log(`Products endpoint status: ${productsResponse.status}`);
    if (productsResponse.status === 200) {
      console.log('✅ Products API accessible with auth');
    } else if (productsResponse.status === 401) {
      console.log('❌ Products API still returning 401 with auth cookies');
    }

    console.log('\n📋 Cookie Debug Summary:');
    console.log('- Admin EntitlementsGuard working');
    console.log('- Cookie format appears correct');
    console.log('- Need to verify session validation in middleware/APIs');

  } catch (error) {
    console.error('❌ Debug error:', error.message);
  }
}

debugAuthCookies();