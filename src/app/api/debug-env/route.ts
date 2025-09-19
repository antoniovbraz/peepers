import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    allowedUserIds: process.env.ALLOWED_USER_IDS || 'NOT_SET',
    allowedUserIdsArray: (process.env.ALLOWED_USER_IDS || '').split(',').filter(Boolean),
    superAdminEmail: process.env.SUPER_ADMIN_EMAIL || 'NOT_SET',
    mlClientId: process.env.ML_CLIENT_ID ? 'SET' : 'NOT_SET',
    upstashUrl: process.env.UPSTASH_REDIS_REST_URL ? 'SET' : 'NOT_SET',
    nodeEnv: process.env.NODE_ENV || 'NOT_SET',
    timestamp: new Date().toISOString()
  });
}