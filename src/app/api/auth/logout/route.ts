import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Simular logout - em produção isso invalidaria tokens/sessões
    console.log('Logout realizado com sucesso');

    // Criar resposta com limpeza de cookies
    const response = NextResponse.json({
      success: true,
      message: 'Logout realizado com sucesso',
      redirect: '/'
    });

    // Limpar cookies de sessão (se existirem)
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