import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    return NextResponse.json({
      success: true,
      message: 'Callback test funcionando',
      params: {
        code: code ? 'presente' : 'ausente',
        state: state ? 'presente' : 'ausente', 
        error: error || 'nenhum'
      },
      url: request.nextUrl.href
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Callback test error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}