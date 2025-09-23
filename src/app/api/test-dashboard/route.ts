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

    // Also test raw product fetch to see status distribution
    const rawProducts = await (productRepository as any).fetchAllSellerProducts(sellerId);

    // Count products by status
    const statusCounts: Record<string, number> = {};
    rawProducts.forEach((product: any) => {
      const status = product.status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      productStats: productStats.success ? productStats.data : null,
      productStatsError: productStats.error,
      rawProductsCount: rawProducts.length,
      statusDistribution: statusCounts,
      sampleProducts: rawProducts.slice(0, 3).map((p: any) => ({
        id: p.id,
        title: p.title?.substring(0, 50),
        status: p.status,
        price: p.price,
        available_quantity: p.available_quantity
      })),
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