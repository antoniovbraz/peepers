import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('POST /api/ml/sync auth', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.ML_CLIENT_ID = 'id';
    process.env.ML_CLIENT_SECRET = 'secret';
    process.env.ML_ACCESS_TOKEN = 'access';
    process.env.ML_REFRESH_TOKEN = 'refresh';
    process.env.ML_USER_ID = '123';
  });

  it('returns 401 for invalid token', async () => {
    process.env.ADMIN_SECRET = 's3cr3t';
    const { POST } = await import('./route');
    const req = { headers: new Headers({ authorization: 'Bearer wrong' }) } as any;
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 401 when secret missing', async () => {
    delete process.env.ADMIN_SECRET;
    const { POST } = await import('./route');
    const req = { headers: new Headers({ authorization: 'Bearer whatever' }) } as any;
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 200 for valid token', async () => {
    process.env.ADMIN_SECRET = 's3cr3t';
    vi.mock('@/lib/cache', () => ({
      cache: {
        acquireSyncLock: vi.fn().mockResolvedValue(true),
        getUser: vi.fn().mockResolvedValue({ token: 't', user_id: '123', expires_at: new Date(Date.now()+1000).toISOString() }),
        setAllProducts: vi.fn().mockResolvedValue(undefined),
        releaseSyncLock: vi.fn().mockResolvedValue(undefined),
        getCacheStats: vi.fn(),
        getLastSyncTime: vi.fn(),
      },
    }));
    vi.mock('@/lib/ml-api', () => ({
      createMercadoLivreAPI: () => ({
        setAccessToken: vi.fn(),
        syncAllProducts: vi.fn().mockResolvedValue([]),
      }),
    }));
    const { POST } = await import('./route');
    const req = { headers: new Headers({ authorization: 'Bearer s3cr3t' }) } as any;
    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});
