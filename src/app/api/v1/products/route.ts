import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'API v1/products endpoint is working!',
    timestamp: new Date().toISOString(),
    data: {
      products: [],
      total: 0,
      page: 1,
      limit: 50,
      totalPages: 0,
      hasNext: false,
      hasPrev: false
    }
  });
}