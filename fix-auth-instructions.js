#!/usr/bin/env node

// Baseado no erro que você mencionou, seu user_id pode ser detectado
// da URL que aparece no sucesso: auth_success=true&user_id=669073070

const USER_ID = '669073070'; // Do seu histórico anterior
const BASE_URL = 'https://peepers.vercel.app';

console.log('🔧 CRITICAL FIX NEEDED:\n');
console.log('Please ensure SUPER_ADMIN_EMAIL or SUPER_ADMIN_USER_IDS are configured on Vercel.');
console.log('ALLOWED_USER_IDS is deprecated and may be removed; use SUPER_ADMIN_USER_IDS for backward compatibility.\n');

console.log('📝 TO FIX THIS:');
console.log('1. Go to Vercel Dashboard -> peepers project -> Settings -> Environment Variables');
console.log('2. Add/verify these environment variables:');
console.log('   Name: SUPER_ADMIN_EMAIL');
console.log('   Value: peepers.shop@gmail.com');
console.log('   Name (optional for backward compatibility): SUPER_ADMIN_USER_IDS');
console.log(`   Value: ${USER_ID}`);
console.log('   Environment: All (Production, Preview, Development)');
console.log('3. Redeploy the application\n');

console.log('🆔 Your detected User ID information:');
console.log(`ML User ID: ${USER_ID}`);
console.log('This is the ID that should be in ALLOWED_USER_IDS\n');

console.log('🔄 Alternative temporary fix:');
console.log('Since you are the super admin (peepers.shop@gmail.com),');
console.log('the EntitlementsGuard should bypass the ALLOWED_USER_IDS check.');
console.log('But some API endpoints still require it.\n');

console.log('⚡ PRIORITY ACTIONS:');
console.log('1. Set SUPER_ADMIN_EMAIL and optionally SUPER_ADMIN_USER_IDS in Vercel environment variables');
console.log('2. Test authentication again');
console.log('3. Your admin panel should work normally after this fix');

async function testWithCorrectUserId() {
  console.log('\n🧪 Testing what happens with correct user ID...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: {
        'Cookie': `user_id=${USER_ID}; session_token=valid-token; user_email=peepers.shop@gmail.com`
      }
    });
    
    console.log(`Current status with user_id ${USER_ID}: ${response.status}`);
    if (response.status === 403) {
      console.log('✅ Getting 403 (not 401) - means user_id validation is working');
      console.log('❌ But user_id not in ALLOWED_USER_IDS - need to add it');
    }
    
  } catch (error) {
    console.log('Test error:', error.message);
  }
}

testWithCorrectUserId();