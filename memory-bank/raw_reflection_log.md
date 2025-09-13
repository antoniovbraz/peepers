---
Date: 2025-09-13
TaskRef: "Fix middleware: replace non-existent cache.getAccessToken usage"

Learnings:
- Discovered TypeScript error caused because `CacheManager` does not expose `getAccessToken`.
- Tokens are stored in the cache via `cache.setUser(key, data)` in `src/app/api/ml/auth/callback/route.ts`. The access token is saved under the key `access_token:{userId}` with shape:
  {
    token: string,
    expires_at: string, // ISO datetime
    user_id: number|string
  }
- Other parts of the code read tokens using `cache.getUser(key)` (e.g., sync route uses `cache.getUser(\`access_token:${userId}\`)`).
- Middleware attempted to call a non-existent `cache.getAccessToken()` method. Correct approach is to read from cache using `cache.getUser('access_token:{userId}')`, and optionally fall back to environment variables `ML_ACCESS_TOKEN` / `ML_USER_ID`.
- TypeScript checks require guarding against undefined expiry values before passing into `new Date(...)`.

Difficulties:
- The middleware code assumed a convenience method that doesn't exist, causing a compile-time error.
- The cached token shape uses the property name `token` (not `access_token`) which required aligning the middleware's expectations.
- Needed to make expiry handling safe (token.expires_at may be undefined) to avoid TS errors.

Successes:
- Implemented a minimal, safe fix:
  - Use `process.env.ML_USER_ID` to attempt `cache.getUser(\`access_token:${userId}\`)`.
  - Fallback to `process.env.ML_ACCESS_TOKEN` if cache miss.
  - Add safe check for `expires_at` before constructing a Date.
- Change keeps behavior: returns 401 when no token or token expired; allows env-based tokens for local/CI scenarios.

Improvements_Identified_For_Consolidation:
- Pattern: store/retrieve tokens via `cache.setUser`/`cache.getUser` with a consistent key naming convention `access_token:{userId}`.
- Middleware should always validate the presence of ML_USER_ID in env and provide a clear fallback or error message when absent.
- Add a small helper in `src/lib/cache.ts` (optional) such as `getAccessTokenForCurrentUser(userId?: string)` to encapsulate this logic and avoid duplication.
---
