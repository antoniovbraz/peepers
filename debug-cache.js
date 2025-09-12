const { createClient } = require('@vercel/kv');
require('dotenv').config({ path: '.env.local' });

// Create KV client
const kv = createClient({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

async function debugCache() {
  try {
    console.log('🔍 Debugging Cache...\n');

    // Helper to scan keys by pattern
    async function scanKeys(pattern) {
      const keys = [];
      for await (const key of kv.scanIterator({ match: pattern })) {
        keys.push(key);
      }
      return keys;
    }

    // Check all keys
    console.log('1. Getting all keys:');
    const allKeys = await scanKeys('*');
    console.log('All keys:', allKeys);
    console.log('Total keys:', allKeys.length);

    // Check products keys specifically
    console.log('\n2. Getting product keys:');
    const productKeys = await scanKeys('products:*');
    console.log('Product keys:', productKeys);
    
    // Check specific product keys
    console.log('\n3. Checking specific product cache keys:');
    const productsAll = await kv.get('products:all');
    const productsActive = await kv.get('products:active');
    
    console.log('products:all exists:', !!productsAll);
    console.log('products:active exists:', !!productsActive);
    
    if (productsAll) {
      console.log('products:all length:', Array.isArray(productsAll) ? productsAll.length : 'not array');
      console.log('products:all sample:', Array.isArray(productsAll) ? productsAll.slice(0, 2) : productsAll);
    }
    
    if (productsActive) {
      console.log('products:active length:', Array.isArray(productsActive) ? productsActive.length : 'not array');
      console.log('products:active sample:', Array.isArray(productsActive) ? productsActive.slice(0, 2) : productsActive);
    }
    
    // Check last sync
    console.log('\n4. Checking sync info:');
    const lastSync = await kv.get('sync:last');
    console.log('Last sync:', lastSync);
    
    // Check individual product keys
    console.log('\n5. Checking individual product keys:');
    const individualProductKeys = await scanKeys('product:*');
    console.log('Individual product keys count:', individualProductKeys.length);
    console.log('Sample individual keys:', individualProductKeys.slice(0, 5));
    
    if (individualProductKeys.length > 0) {
      const sampleProduct = await kv.get(individualProductKeys[0]);
      console.log('Sample product data:', sampleProduct);
    }
    
  } catch (error) {
    console.error('Debug error:', error);
  }
}

debugCache();
