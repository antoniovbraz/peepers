import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'module';

process.env.ML_CLIENT_ID = 'client';
process.env.ML_CLIENT_SECRET = 'secret';
process.env.UPSTASH_REDIS_REST_URL = 'http://localhost:6379';
process.env.UPSTASH_REDIS_REST_TOKEN = 'token';

const require = createRequire(import.meta.url);
const { MLApiService } = require('./ml-api.service');
const { cache } = require('../lib/cache');

(cache as any).setUser = mock.fn(async () => {});

test('refreshAccessToken posts refresh token and updates state', async () => {
  const service = new MLApiService();
  service.setAccessToken('old-access', 'user1', 'refresh123');

  const fetchMock = mock.fn(async () => ({
    ok: true,
    json: async () => ({
      access_token: 'new-access',
      refresh_token: 'new-refresh',
      user_id: 'user1',
      expires_in: 100
    }),
  }));
  global.fetch = fetchMock as any;

  const data = await service.refreshAccessToken();
  assert.equal(data.access_token, 'new-access');
  assert.equal(service['accessToken'], 'new-access');
  assert.equal(service['refreshToken'], 'new-refresh');
  assert.equal((cache as any).setUser.mock.calls.length, 1);
});

test('fetchWithAuth refreshes token on 401 and retries', async () => {
  const service = new MLApiService();
  service.setAccessToken('old-token', 'user1', 'refresh123');

  let callCount = 0;
  const fetchMock = mock.fn(async (url: any) => {
    if (typeof url === 'string' && url.includes('oauth/token')) {
      return {
        ok: true,
        json: async () => ({
          access_token: 'new-token',
          refresh_token: 'new-refresh',
          user_id: 'user1',
          expires_in: 100
        })
      };
    }
    callCount++;
    if (callCount === 1) {
      return { ok: false, status: 401, statusText: 'Unauthorized', json: async () => ({}) };
    }
    return { ok: true, json: async () => ({ id: 'abc' }) };
  });
  global.fetch = fetchMock as any;

  const result = await service.getProduct('abc');
  assert.deepEqual(result, { id: 'abc' });
  assert.equal(callCount, 2);
  assert.equal(service['accessToken'], 'new-token');
});
