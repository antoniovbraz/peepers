#!/usr/bin/env node

/**
 * Debug OAuth Callback Cookie Setting
 * Simula uma chamada OAuth callback para verificar se cookies são definidos
 */

const https = require('https');
const { URL } = require('url');

const BASE_URL = 'https://peepers.vercel.app';

async function testOAuthCallback() {
  console.log('🔍 OAUTH CALLBACK COOKIE DEBUG');
  console.log('===============================');
  
  // Primeiro, vou simular iniciar o OAuth para obter um state válido
  console.log('\n1. Initiating OAuth to get valid state...');
  
  const oauthInitRequest = new Promise((resolve, reject) => {
    const req = https.get(`${BASE_URL}/api/auth/mercado-livre`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      }
    }, (res) => {
      console.log(`OAuth Init Status: ${res.statusCode}`);
      console.log(`OAuth Redirect Location: ${res.headers.location}`);
      
      if (res.headers.location) {
        const redirectUrl = new URL(res.headers.location);
        const state = redirectUrl.searchParams.get('state');
        const codeChallenge = redirectUrl.searchParams.get('code_challenge');
        
        console.log(`State: ${state}`);
        console.log(`Code Challenge: ${codeChallenge}`);
        
        resolve({ state, codeChallenge });
      } else {
        reject(new Error('No redirect location found'));
      }
      
      // Consume response body
      res.on('data', () => {});
      res.on('end', () => {});
    });
    
    req.on('error', reject);
  });
  
  try {
    const { state } = await oauthInitRequest;
    
    console.log('\n2. Testing callback with valid state (simulated success)...');
    
    // Agora vamos simular um callback bem-sucedido
    const callbackUrl = `${BASE_URL}/api/auth/mercado-livre/callback?code=SIMULATED_CODE&state=${state}`;
    
    const callbackRequest = new Promise((resolve) => {
      const req = https.get(callbackUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        }
      }, (res) => {
        console.log(`Callback Status: ${res.statusCode}`);
        console.log(`Callback Headers:`, res.headers);
        
        // Verificar se Set-Cookie headers estão presentes
        const setCookieHeaders = res.headers['set-cookie'];
        if (setCookieHeaders) {
          console.log('\n✅ SET-COOKIE HEADERS FOUND:');
          setCookieHeaders.forEach((cookie, index) => {
            console.log(`${index + 1}. ${cookie}`);
            
            // Parse cookie details
            const [nameValue, ...attributes] = cookie.split(';');
            const [name, value] = nameValue.split('=');
            console.log(`   Name: ${name.trim()}`);
            console.log(`   Value Length: ${value ? value.length : 0}`);
            
            const attrs = attributes.map(attr => attr.trim());
            console.log(`   Attributes: ${attrs.join(', ')}`);
            console.log('');
          });
        } else {
          console.log('\n❌ NO SET-COOKIE HEADERS FOUND');
        }
        
        // Consume response body
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 302 || res.statusCode === 307) {
            console.log(`Redirect Location: ${res.headers.location}`);
          }
          
          if (data.length > 0 && data.length < 1000) {
            console.log(`Response Body: ${data}`);
          }
          
          resolve();
        });
      });
      
      req.on('error', (error) => {
        console.log(`Callback Error: ${error.message}`);
        resolve();
      });
    });
    
    await callbackRequest;
    
  } catch (error) {
    console.log(`OAuth Init Error: ${error.message}`);
  }
  
  console.log('\n3. Testing auth status after simulated callback...');
  
  // Testar status após o callback
  const authStatusRequest = new Promise((resolve) => {
    const req = https.get(`${BASE_URL}/api/auth/status`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const authData = JSON.parse(data);
          console.log(`Auth Status: ${authData.authenticated ? 'AUTHENTICATED' : 'NOT AUTHENTICATED'}`);
          console.log(`Missing Cookies: ${Object.entries(authData.cookies).filter(([k,v]) => v === 'MISSING').map(([k]) => k).join(', ')}`);
        } catch (e) {
          console.log('Unable to parse auth status response');
        }
        resolve();
      });
    });
    
    req.on('error', () => resolve());
  });
  
  await authStatusRequest;
  
  console.log('\n📊 DIAGNOSIS:');
  console.log('==============');
  console.log('If SET-COOKIE headers are present but cookies don\'t persist:');
  console.log('1. ❓ Domain mismatch (cookies set for wrong domain)');
  console.log('2. ❓ Path mismatch (cookies set for wrong path)');
  console.log('3. ❓ Secure flag issue (cookies require HTTPS but accessed via HTTP)');
  console.log('4. ❓ SameSite policy blocking cookies');
  console.log('5. ❓ Browser security settings blocking httpOnly cookies');
  console.log('\nIf NO SET-COOKIE headers are present:');
  console.log('1. ❓ OAuth callback failing before cookie setting');
  console.log('2. ❓ Response not properly configured');
  console.log('3. ❓ Error in callback route preventing cookie setting');
}

testOAuthCallback().catch(console.error);