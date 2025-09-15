import { NextRequest, NextResponse } from 'next/server';
import { getKVClient } from '@/lib/cache';
import { CACHE_KEYS } from '@/config/routes';

export async function POST(request: NextRequest) {
  try {
    // Obter user_id do cookie
    const userId = request.cookies.get('user_id')?.value;
    
    if (userId) {
      // Invalidar tokens no cache
      const kv = getKVClient();
      await kv.del(CACHE_KEYS.USER_TOKEN(userId));
      console.log(`✅ Tokens invalidated for user: ${userId}`);
    }

    // Criar resposta com limpeza de cookies
    const response = NextResponse.json({
      success: true,
      message: 'Logout realizado com sucesso',
      redirect: '/'
    });

    // Limpar cookies de sessão
    response.cookies.set('session_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    });

    response.cookies.set('user_id', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}