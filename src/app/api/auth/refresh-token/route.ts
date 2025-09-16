import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/cache';
import { logger } from '@/lib/logger';

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

    // Renovar token com Mercado Livre
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

    if (!refreshResponse.ok) {
      const error = await refreshResponse.text();
      logger.error({ error, userId }, 'Failed to refresh token');
      return NextResponse.json({ error: 'Failed to refresh token' }, { status: 500 });
    }

    const tokenData: RefreshTokenResponse = await refreshResponse.json();

    // Calcular nova data de expiração
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);

    // Atualizar dados no cache
    const updatedUserData = {
      ...userData,
      token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: expiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    };

    await cache.setUser(userId, updatedUserData);

    logger.info({ userId, expiresAt }, 'Token refreshed successfully');

    return NextResponse.json({
      success: true,
      expires_at: expiresAt.toISOString(),
      token_type: tokenData.token_type,
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
  const allowedUserIds = process.env.ALLOWED_USER_IDS?.split(',') || [];
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

  for (const userId of allowedUserIds) {
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