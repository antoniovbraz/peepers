import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import crypto from 'node:crypto';
import logger from '@/lib/logger';

const secret = 'test-secret';

function createRequest(body: object, signature?: string) {
  const json = JSON.stringify(body);
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };
  if (signature) {
    headers['x-ml-signature'] = signature;
  }
  const req = new Request('http://localhost/api/ml/webhook', {
    method: 'POST',
    body: json,
    headers,
  });
  return new NextRequest(req);
}

(async () => {
  process.env.ML_WEBHOOK_SECRET = secret;
  process.env.ML_CLIENT_ID = 'id';
  process.env.ML_CLIENT_SECRET = 'secret';
  process.env.UPSTASH_REDIS_REST_URL = 'http://localhost';
  process.env.UPSTASH_REDIS_REST_TOKEN = 'token';

  const { POST } = await import('./route');
  const payload = { topic: 'unknown', resource: 'items/1', user_id: 'u1', attempts: 1 };

  // invalid signature
  const badReq = createRequest(payload, 'bad-signature');
  const badRes = await POST(badReq);
  assert.equal(badRes.status, 401);

  // valid signature
  const sig = crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
  const goodReq = createRequest(payload, sig);
  const goodRes = await POST(goodReq);
  assert.equal(goodRes.status, 200);

  logger.info('Webhook signature tests passed');
})();
