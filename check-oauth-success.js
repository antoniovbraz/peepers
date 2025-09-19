#!/usr/bin/env node

/**
 * Quick OAuth Success Validator
 * Run this after completing OAuth flow to verify success
 */

const https = require('https');

async function checkOAuthSuccess() {
  console.log('🔍 CHECKING OAUTH SUCCESS STATUS');
  console.log('=================================');
  
  const checks = [
    {
      name: 'Auth Status',
      url: 'https://peepers.vercel.app/api/auth/status',
      expect: (data) => JSON.parse(data).authenticated === true
    },
    {
      name: 'Admin Page',
      url: 'https://peepers.vercel.app/admin',
      expect: (data) => !data.includes('Verificando autenticação')
    },
    {
      name: 'Cache Debug',
      url: 'https://peepers.vercel.app/api/cache-debug',
      expect: (data) => JSON.parse(data).cache_checks?.user_token_exists === true
    }
  ];
  
  for (const check of checks) {
    await new Promise(resolve => {
      const req = https.get(check.url, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const success = check.expect(data);
            console.log(`${success ? '✅' : '❌'} ${check.name}: ${success ? 'PASS' : 'FAIL'}`);
          } catch (e) {
            console.log(`❌ ${check.name}: ERROR (${e.message})`);
          }
          resolve();
        });
      });
      req.on('error', () => {
        console.log(`❌ ${check.name}: NETWORK ERROR`);
        resolve();
      });
    });
  }
  
  console.log('\n📋 INSTRUCTIONS:');
  console.log('If all checks PASS: OAuth is working correctly!');
  console.log('If any checks FAIL: OAuth flow needs to be completed');
  console.log('\nTo complete OAuth: Visit https://peepers.vercel.app/login');
}

checkOAuthSuccess();