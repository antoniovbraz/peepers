import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Test endpoint working!',
    timestamp: new Date().toISOString(),
    route: 'test-v1'
  });
}