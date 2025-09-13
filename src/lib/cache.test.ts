import { describe, it, expect, afterEach } from 'vitest';
import { getKVClient, __resetKVClient } from './cache';

describe('getKVClient', () => {
  const originalUrl = process.env.UPSTASH_REDIS_REST_URL;
  const originalToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  afterEach(() => {
    __resetKVClient();
    if (originalUrl) {
      process.env.UPSTASH_REDIS_REST_URL = originalUrl;
    } else {
      delete process.env.UPSTASH_REDIS_REST_URL;
    }
    if (originalToken) {
      process.env.UPSTASH_REDIS_REST_TOKEN = originalToken;
    } else {
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
    }
  });

  it('throws without required env vars', () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    expect(() => getKVClient()).toThrow(/UPSTASH_REDIS_REST_URL/);
  });

  it('returns same client when env vars set', () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://example.com';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
    const client1 = getKVClient();
    const client2 = getKVClient();
    expect(client1).toBe(client2);
  });
});
