import { NextRequest, NextResponse } from 'next/server';

/**
 * Endpoint simples para verificar status de autenticação
 * Retorna informações básicas dos cookies sem acessar cache
 */
export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session_token')?.value;
    const userId = request.cookies.get('user_id')?.value;
    const userEmail = request.cookies.get('user_email')?.value;

    const isAuthenticated = !!(sessionToken && userId);

    return NextResponse.json({
      authenticated: isAuthenticated,
      cookies: {
        session_token: sessionToken ? 'PRESENT' : 'MISSING',
        user_id: userId || 'MISSING',
        user_email: userEmail || 'MISSING'
      },
      timestamp: new Date().toISOString(),
      next_steps: isAuthenticated 
        ? ['Você está autenticado. Verifique /api/auth/debug para mais detalhes.']
        : ['Faça login em /login', 'Complete OAuth do Mercado Livre', 'Retorne ao admin']
    });
  } catch (error) {
    return NextResponse.json({
      error: 'STATUS_CHECK_ERROR',
      message: String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}