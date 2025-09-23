import { NextRequest, NextResponse } from 'next/server';
import { ProductRepository } from '@/infrastructure/repositories/ProductRepository';

export async function GET(_request: NextRequest) {
  try {
    // Test endpoint - no auth required for debugging
    const sellerId = 669073070; // Hardcoded for testing

    // Initialize repositories with admin context (server-side)
    const productRepository = new ProductRepository(undefined, true);

    // Test product statistics
    const productStats = await productRepository.getStatistics(sellerId);

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