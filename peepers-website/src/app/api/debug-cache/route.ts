import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    // Get all keys with prefix
    const keys = await cache.getKeys('oauth:*');
    
    // Get values for each key
    const data: Record<string, any> = {};
    for (const key of keys) {
      try {
        data[key] = await cache.get(key);
      } catch (err) {
        data[key] = `Error: ${err}`;
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      keys_found: keys.length,
      data
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}