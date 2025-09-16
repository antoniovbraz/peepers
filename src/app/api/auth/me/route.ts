import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/cache';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session_token')?.value;
    const userId = request.cookies.get('user_id')?.value;

    if (!sessionToken || !userId) {
      return NextResponse.json({
        authenticated: false,
        message: 'No session found',
        redirect: '/login'
      }, { status: 401 });
    }

    const allowedUserIds = process.env.ALLOWED_USER_IDS?.split(',') || [];
    if (allowedUserIds.length > 0 && !allowedUserIds.includes(userId)) {
      return NextResponse.json({
        authenticated: false,
        authorized: false,
        message: 'User not authorized',
        redirect: '/acesso-negado'
      }, { status: 403 });
    }

    const userData = await cache.getUser(userId);
    
    if (!userData || !userData.token) {
      return NextResponse.json({
        authenticated: false,
        message: 'No token found in cache',
        redirect: '/login'
      }, { status: 401 });
    }

    if (userData.session_token !== sessionToken) {
      return NextResponse.json({
        authenticated: false,
        message: 'Invalid session token',
        redirect: '/login'
      }, { status: 401 });
    }

    const expiresAt = userData.expires_at ? new Date(userData.expires_at) : null;
    const now = new Date();
    const isExpired = expiresAt && expiresAt < now;

    if (isExpired) {
      return NextResponse.json({
        authenticated: false,
        message: 'Token expired',
        expires_at: userData.expires_at,
        redirect: '/login'
      }, { status: 401 });
    }

    const timeUntilExpiry = expiresAt ? expiresAt.getTime() - now.getTime() : 0;
    const hoursUntilExpiry = timeUntilExpiry / (1000 * 60 * 60);

    return NextResponse.json({
      authenticated: true,
      authorized: true,
      user: {
        id: userData.id,
        nickname: userData.nickname,
        email: userData.email,
      },
      token: {
        expires_at: userData.expires_at,
        hours_until_expiry: Math.round(hoursUntilExpiry * 100) / 100,
        needs_refresh: hoursUntilExpiry < 1
      },
      session: {
        session_token: sessionToken ? 'present' : 'missing',
        user_id: userId
      }
    });

  } catch (error) {
    logger.error({ error }, 'Auth check error');
    return NextResponse.json({
      authenticated: false,
      message: 'Internal server error',
      error: String(error)
    }, { status: 500 });
  }
}
