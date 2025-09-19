import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    superAdminEmail: process.env.SUPER_ADMIN_EMAIL?.toLowerCase(),
    expectedEmail: 'peepers.shop@gmail.com',
    isCorrectlyConfigured: process.env.SUPER_ADMIN_EMAIL?.toLowerCase() === 'peepers.shop@gmail.com',
    hasEnvVar: !!process.env.SUPER_ADMIN_EMAIL,
    timestamp: new Date().toISOString()
  });
}