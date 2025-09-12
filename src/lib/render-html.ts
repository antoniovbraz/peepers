import { NextResponse } from 'next/server';

export function renderHtml(content: string, init: ResponseInit = {}): NextResponse {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'text/html');
  return new NextResponse(content, { ...init, headers });
}
