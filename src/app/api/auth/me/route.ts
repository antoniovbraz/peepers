import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/cache';
import { CACHE_KEYS } from '@/config/routes';

export async function GET(request: NextRequest) {
  try {
    // Verificar se existe cookie de sessão
    const sessionToken = request.cookies.get('session_token')?.value;
    const userId = request.cookies.get('user_id')?.value;

    if (!sessionToken || !userId) {
      return NextResponse.json({
        authenticated: false,
        error: 'No session found'
      }, { status: 401 });
    }

    // Verificar se o token existe no cache
    const tokenData = await cache.getUser(userId);

    if (!tokenData || !tokenData.token) {
      return NextResponse.json({
        authenticated: false,
        error: 'Invalid session'
      }, { status: 401 });
    }

    // Verificar se o session token corresponde
    if (tokenData.session_token !== sessionToken) {
      return NextResponse.json({
        authenticated: false,
        error: 'Session token mismatch'
      }, { status: 401 });
    }

    // Verificar se o token não expirou
    const expiresAt = tokenData.expires_at ? new Date(tokenData.expires_at) : null;
    if (expiresAt && expiresAt < new Date()) {
      return NextResponse.json({
        authenticated: false,
        error: 'Session expired'
      }, { status: 401 });
    }

    // Buscar dados da empresa do cache
    const companyData = await cache.getUser(userId);

    return NextResponse.json({
      authenticated: true,
      user_id: userId,
      company: companyData?.company || null,
      session: {
        expires_at: tokenData.expires_at,
        last_sync: companyData?.last_sync || null
      }
    });

  } catch (error) {
    console.error('Erro ao verificar autenticação:', error);
    return NextResponse.json({
      authenticated: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}