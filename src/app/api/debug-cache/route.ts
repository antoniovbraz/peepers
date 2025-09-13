import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    // Try to get sessions with oauth prefix
    const sessions = await Promise.all([
      cache.getUser('oauth_session:teste'),
      cache.getUser('oauth_session:state_123'),
    ]);

    // Get sample access token
    const tokenData = await cache.getUser('access_token:12345');

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      cache_data: {
        sample_sessions: sessions.filter(Boolean),
        sample_token: tokenData,
        // Check if cache methods work
        test_result: 'Cache methods accessible'
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}