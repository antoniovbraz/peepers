import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔐 Testing auth endpoint');

    const clientId = process.env.ML_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json({ 
        error: 'ML_CLIENT_ID não configurado',
        message: 'Configure a variável de ambiente ML_CLIENT_ID'
      }, { status: 500 });
    }

    // Construir URL de teste sem PKCE
    const baseUrl = request.nextUrl.origin;
    const authUrl = new URL('https://auth.mercadolivre.com.br/authorization');
    
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', `${baseUrl}/api/auth/mercado-livre/callback`);
    authUrl.searchParams.set('scope', 'read write');

    console.log('🔗 Auth URL gerada:', authUrl.toString());

    return NextResponse.json({
      success: true,
      auth_url: authUrl.toString(),
      client_id: clientId,
      redirect_uri: `${baseUrl}/api/auth/mercado-livre/callback`,
      message: 'Use auth_url para fazer login manual'
    });

  } catch (error) {
    console.error('❌ Erro no test auth:', error);
    return NextResponse.json({
      error: 'Falha no teste',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}