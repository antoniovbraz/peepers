import { NextRequest, NextResponse } from 'next/server';
import { ProductRepository } from '@/infrastructure/repositories/ProductRepository';

export async function GET(_request: NextRequest) {
  try {
    // Test endpoint - simulate admin context
    const sellerId = 669073070; // Hardcoded for testing

    // Initialize repositories with admin context (server-side)
    const productRepository = new ProductRepository(undefined, true);

    // Test product statistics with admin context (should fetch real data)
    console.log('🧪 Testing product statistics in admin context...');
    const productStats = await productRepository.getStatistics(sellerId);

    console.log('📊 Product stats result:', {
      success: productStats.success,
      error: productStats.error,
      data: productStats.data
    });

    return NextResponse.json({
      success: true,
      productStats: productStats.success ? productStats.data : null,
      productStatsError: productStats.error,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Test dashboard error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}