import assert from 'node:assert/strict';
import { getKVClient, __resetKVClient } from './cache';

const originalUrl = process.env.UPSTASH_REDIS_REST_URL;
const originalToken = process.env.UPSTASH_REDIS_REST_TOKEN;

delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;

assert.throws(() => getKVClient(), /Missing environment variable: UPSTASH_REDIS_REST_URL/);

process.env.UPSTASH_REDIS_REST_URL = 'https://example.com';
process.env.UPSTASH_REDIS_REST_TOKEN = 'test';

assert.doesNotThrow(() => getKVClient());

__resetKVClient();
process.env.UPSTASH_REDIS_REST_URL = originalUrl;
process.env.UPSTASH_REDIS_REST_TOKEN = originalToken;

console.log('Cache client initialization tests passed');
