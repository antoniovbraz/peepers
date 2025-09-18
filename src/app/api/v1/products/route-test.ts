import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Teste básico sem dependências complexas
    return NextResponse.json({
      success: true,
      message: 'V1 Products endpoint is working',
      timestamp: new Date().toISOString(),
      test: 'basic functionality'
    });
  } catch (error) {
    console.error('V1 Products test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Test endpoint error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}