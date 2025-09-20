// Debug rate limiter
import { checkIPLimit } from '../src/lib/rate-limiter.js';

async function testRateLimiter() {
  console.log('Testing rate limiter...');

  const ip = 'test-ip';
  const config = { maxRequests: 3, windowMs: 60000 };

  for (let i = 1; i <= 5; i++) {
    const result = await checkIPLimit(ip, config);
    console.log(`Request ${i}:`, {
      allowed: result.allowed,
      remaining: result.remaining,
      totalHits: result.totalHits,
      resetTime: new Date(result.resetTime).toISOString()
    });
  }
}

testRateLimiter().catch(console.error);