import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Test endpoint working',
    path: '/api/test-v1-products',
    timestamp: new Date().toISOString()
  });
}