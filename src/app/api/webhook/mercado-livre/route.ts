import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('📡 Webhook ML recebido');

    const body = await request.json();
    const signature = request.headers.get('x-signature');
    
    console.log('Webhook payload:', {
      topic: body.topic,
      resource: body.resource,
      user_id: body.user_id,
      application_id: body.application_id
    });

    // Aqui você pode processar os diferentes tipos de notificação:
    // - orders: novos pedidos
    // - items: mudanças em produtos
    // - questions: novas perguntas
    // - messages: novas mensagens

    return NextResponse.json({
      success: true,
      message: 'Webhook processado',
      received_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro no webhook:', error);
    return NextResponse.json({
      error: 'Webhook error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Webhook só aceita POST
export async function GET() {
  return NextResponse.json({
    message: 'Webhook endpoint - use POST only',
    endpoint: '/api/webhook/mercado-livre'
  });
}