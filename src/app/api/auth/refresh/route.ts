import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/cache';
import { logger } from '@/lib/logger';

/**
 * Endpoint para refresh automático de token ML quando próximo do vencimento
 * Chamado automaticamente pelo AuthCheck quando token precisa ser renovado
 */
export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session_token')?.value;
    const userId = request.cookies.get('user_id')?.value;

    if (!sessionToken || !userId) {
      return NextResponse.json({
        success: false,
        message: 'No session found'
      }, { status: 401 });
    }

    const userData = await cache.getUser(userId);
    
    if (!userData || !userData.refresh_token) {
      return NextResponse.json({
        success: false,
        message: 'No refresh token found'
      }, { status: 401 });
    }

    // Verifica se o token precisa mesmo ser renovado
    const expiresAt = userData.expires_at ? new Date(userData.expires_at) : null;
    const now = new Date();
    const timeUntilExpiry = expiresAt ? expiresAt.getTime() - now.getTime() : 0;
    const hoursUntilExpiry = timeUntilExpiry / (1000 * 60 * 60);

    // Só renova se realmente necessário (menos de 2 horas para vencer)
    if (hoursUntilExpiry > 2) {
      return NextResponse.json({
        success: true,
        message: 'Token still valid, no refresh needed',
        hours_until_expiry: hoursUntilExpiry
      });
    }

    // Fazer refresh do token ML
    const tokenData = {
      grant_type: 'refresh_token',
      client_id: process.env.ML_CLIENT_ID,
      client_secret: process.env.ML_CLIENT_SECRET,
      refresh_token: userData.refresh_token,
    };

    const tokenResponse = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(tokenData),
    });

    if (!tokenResponse.ok) {
      logger.error({
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
      }, 'Failed to refresh ML token');
      
      return NextResponse.json({
        success: false,
        message: 'Failed to refresh token'
      }, { status: 400 });
    }

    const newTokenData = await tokenResponse.json();

    // Calcular nova data de expiração
    const newExpiresAt = new Date();
    newExpiresAt.setSeconds(newExpiresAt.getSeconds() + newTokenData.expires_in);

    // Atualizar dados do usuário no cache
    const updatedUserData = {
      ...userData,
      token: newTokenData.access_token,
      refresh_token: newTokenData.refresh_token,
      expires_at: newExpiresAt.toISOString(),
      token_type: newTokenData.token_type,
      scope: newTokenData.scope,
    };

    await cache.setUser(userId, updatedUserData);

    logger.info({
      user_id: userId,
      new_expires_at: newExpiresAt,
    }, 'Token refreshed successfully');

    return NextResponse.json({
      success: true,
      message: 'Token refreshed successfully',
      expires_at: newExpiresAt.toISOString(),
      hours_until_expiry: newTokenData.expires_in / 3600
    });

  } catch (error) {
    logger.error({ error }, 'Token refresh error');
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: String(error)
    }, { status: 500 });
  }
}