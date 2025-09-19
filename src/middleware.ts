import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
export async function middleware(request: NextRequest) {
  console.log(`🔍 Simple middleware processing: ${request.nextUrl.pathname}`);
  
  const response = NextResponse.next();
  
  // Add pathname header for EntitlementsGuard
  response.headers.set('x-pathname', request.nextUrl.pathname);
  
  return response;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*'
  ]
};