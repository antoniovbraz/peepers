import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock dependencies used in the route
vi.mock('@/lib/cache', () => ({
  cache: {
    acquireSyncLock: vi.fn().mockResolvedValue(true),
    releaseSyncLock: vi.fn().mockResolvedValue(),
    getUser: vi
      .fn()
      .mockResolvedValue({ token: 'token', user_id: 1 }),
    setAllProducts: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@/lib/ml-api', () => ({
  createMercadoLivreAPI: () => ({
    setAccessToken: vi.fn(),
    syncAllProducts: vi.fn().mockResolvedValue([]),
  }),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/render-html', () => ({
  renderHtml: vi.fn(),
}));

import { POST } from './route';

function createRequest(token?: string) {
  const headers: Record<string, string> = {};
  if (token) {
    headers['authorization'] = token;
  }
  const req = new Request('http://localhost/api/ml/sync', {
    method: 'POST',
    headers,
  });
  return new NextRequest(req);
}

describe('POST /api/ml/sync authorization', () => {
  beforeEach(() => {
    process.env.ADMIN_SECRET = 'secret';
    process.env.ML_USER_ID = '1';
  });

  it('allows request with valid token', async () => {
    const res = await POST(createRequest('Bearer secret'));
    expect(res.status).toBe(200);
  });

  it('rejects request with invalid token', async () => {
    const res = await POST(createRequest('Bearer wrong'));
    expect(res.status).toBe(401);
  });
});

