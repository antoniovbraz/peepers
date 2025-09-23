import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const sessionToken = request.cookies.get('session_token')?.value;
  const userId = request.cookies.get('user_id')?.value;

  return NextResponse.json({
    hasSessionToken: !!sessionToken,
    hasUserId: !!userId,
    sessionTokenPreview: sessionToken ? sessionToken.substring(0, 10) + '...' : null,
    userId: userId,
    timestamp: new Date().toISOString(),
    url: request.nextUrl.toString()
  });
}