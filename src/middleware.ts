import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware Simplificado para Debugging
 * Removendo todas as dependências que podem estar causando MIDDLEWARE_INVOCATION_FAILED
 */
export async function middleware(request: NextRequest) {
  console.log(`🔍 Simple middleware processing: ${request.nextUrl.pathname}`);
  
  // Simplesmente permitir tudo passar por enquanto
  return NextResponse.next();
}

// Configurar em quais rotas o middleware deve ser executado
export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*'
  ]
};