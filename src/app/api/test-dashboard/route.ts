import { NextRequest, NextResponse } from 'next/server';
import { GetDashboardMetricsUseCase } from '@/application/use-cases/GetDashboardMetricsUseCase';
import { ProductRepository } from '@/infrastructure/repositories/ProductRepository';
import { OrderRepository } from '@/infrastructure/repositories/OrderRepository';
import { SellerRepository } from '@/infrastructure/repositories/SellerRepository';

export async function GET(_request: NextRequest) {
  try {
    // Initialize repositories
    const productRepository = new ProductRepository(undefined, false); // Not admin context
    const orderRepository = new OrderRepository(undefined, false);
    const sellerRepository = new SellerRepository(undefined, false);

    const getDashboardMetrics = new GetDashboardMetricsUseCase(
      productRepository,
      orderRepository,
      sellerRepository
    );

    // Execute use case to get dashboard metrics
    const result = await getDashboardMetrics.execute({
      sellerId: 123456 // Default seller for demo
    });

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to load dashboard metrics'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Test dashboard error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}