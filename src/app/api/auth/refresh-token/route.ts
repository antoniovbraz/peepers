import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/cache';
import { logger } from '@/lib/logger';
import { tokenRotationService } from '@/lib/token-rotation';

interface RefreshTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  user_id: number;
  refresh_token: string;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Buscar dados do usuário no cache
    const userData = await cache.getUser(userId);
    if (!userData || !userData.refresh_token) {
      logger.warn({ userId }, 'No refresh token found for user');
      return NextResponse.json({ error: 'No refresh token found' }, { status: 404 });
    }

    // NOVO: Usar serviço de rotação segura de tokens
    const rotationResult = await tokenRotationService.rotateToken(userId, userData.refresh_token);

    if (!rotationResult.success) {
      logger.error({ userId, error: rotationResult.error }, 'Token rotation failed');
      
      // Se foi detectado token theft, retornar 401 para forçar re-login
      if (rotationResult.error?.includes('theft detected')) {
        return NextResponse.json({ 
          error: 'Security violation detected',
          message: 'Please log in again',
          require_reauth: true
        }, { status: 401 });
      }
      
      return NextResponse.json({ 
        error: rotationResult.error || 'Failed to refresh token' 
      }, { status: 500 });
    }

    logger.info({ userId, expiresAt: rotationResult.expires_at }, 'Token refreshed successfully with rotation');

    return NextResponse.json({
      success: true,
      expires_at: rotationResult.expires_at,
      token_type: 'Bearer',
    });

  } catch (error) {
    logger.error({ error }, 'Token refresh endpoint error');
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'Failed to refresh token'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Endpoint para verificar tokens próximos do vencimento
    const result = await checkAndRefreshExpiredTokens();
    
    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error) {
    logger.error({ error }, 'Token check endpoint error');
    return NextResponse.json({ 
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// Função para verificar e renovar tokens expirados automaticamente
async function checkAndRefreshExpiredTokens() {
  // Prefer explicit list passed via env for backward compatibility. Preferably
  // this routine should be called by an authenticated platform admin and can
  // accept a list of userIds in the request in future versions.
  // Prefer SUPER_ADMIN_USER_IDS for backward compatibility; ALLOWED_USER_IDS is deprecated
  const configuredUserIds = (process.env.SUPER_ADMIN_USER_IDS || process.env.ALLOWED_USER_IDS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const results = {
    checked: 0,
    refreshed: 0,
    errors: 0,
    details: [] as Array<{
      userId: string;
      status: string;
      hours_until_expiry?: number;
      new_expires_at?: string;
      error?: string;
    }>
  };

  // Build candidate user list. If ALLOWED_USER_IDS isn't set, try to read an
  // indexed list of users from the cache (key: 'users:all'). If that's not
  // available, fail fast with a descriptive message so callers can provide
  // an explicit list.
  let candidateUserIds: string[] = configuredUserIds;

  if (candidateUserIds.length === 0) {
    try {
      const { cache } = await import('@/lib/cache');
      if (typeof (cache as any).getUsersIndex === 'function') {
        const index = await (cache as any).getUsersIndex();
        if (Array.isArray(index)) {
          candidateUserIds = index.map(String);
        }
      }
    } catch (_) {
      // ignore and fallthrough
    }
  }

  if (candidateUserIds.length === 0) {
    // No configured users found - return helpful error so admin can invoke
    // the endpoint with an explicit list instead of relying on deprecated env.
    return {
      checked: 0,
      refreshed: 0,
      errors: 1,
      details: [{ userId: 'none', status: 'no_user_list_configured', error: 'No user list configured. Set SUPER_ADMIN_USER_IDS or populate cache key users:all' }]
    };
  }

  for (const userId of candidateUserIds) {
    try {
      results.checked++;
      
      const userData = await cache.getUser(userId);
      if (!userData || !userData.token || !userData.expires_at) {
        results.details.push({ userId, status: 'no_token_data' });
        continue;
      }

      const expiresAt = new Date(userData.expires_at);
      const now = new Date();
      const timeUntilExpiry = expiresAt.getTime() - now.getTime();
      const hoursUntilExpiry = timeUntilExpiry / (1000 * 60 * 60);

      // Se expira em menos de 1 hora, renovar
      if (hoursUntilExpiry < 1) {
        logger.info({ userId, hoursUntilExpiry }, 'Token expiring soon, refreshing...');
        
        const refreshResponse = await fetch('https://api.mercadolibre.com/oauth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
          },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: process.env.ML_CLIENT_ID!,
            client_secret: process.env.ML_CLIENT_SECRET!,
            refresh_token: userData.refresh_token || '',
          }),
        });

        if (refreshResponse.ok) {
          const tokenData: RefreshTokenResponse = await refreshResponse.json();
          const newExpiresAt = new Date();
          newExpiresAt.setSeconds(newExpiresAt.getSeconds() + tokenData.expires_in);

          await cache.setUser(userId, {
            ...userData,
            token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_at: newExpiresAt.toISOString(),
            updated_at: new Date().toISOString(),
          });

          results.refreshed++;
          results.details.push({ 
            userId, 
            status: 'refreshed', 
            new_expires_at: newExpiresAt.toISOString() 
          });
          
          logger.info({ userId, newExpiresAt }, 'Token auto-refreshed successfully');
        } else {
          results.errors++;
          results.details.push({ userId, status: 'refresh_failed' });
          logger.error({ userId }, 'Failed to auto-refresh token');
        }
      } else {
        results.details.push({ 
          userId, 
          status: 'valid', 
          hours_until_expiry: Math.round(hoursUntilExpiry * 100) / 100 
        });
      }

    } catch (error) {
      results.errors++;
      results.details.push({ userId, status: 'error', error: String(error) });
      logger.error({ error, userId }, 'Error checking token for user');
    }
  }

  return results;
}