import { NextRequest, NextResponse } from 'next/server';
import { GetDashboardMetricsUseCase } from '@/application/use-cases/GetDashboardMetricsUseCase';
import { ProductRepository } from '@/infrastructure/repositories/ProductRepository';
import { OrderRepository } from '@/infrastructure/repositories/OrderRepository';
import { SellerRepository } from '@/infrastructure/repositories/SellerRepository';

export async function GET(request: NextRequest) {
  try {
    // Este endpoint é para teste - simula falha nos repositórios
    const userId = request.cookies.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json({
        error: 'Unauthorized'
      }, { status: 401 });
    }

    // Initialize repositories with admin context (server-side)
    const productRepository = new ProductRepository(undefined, true);
    const orderRepository = new OrderRepository(undefined, true);
    const sellerRepository = new SellerRepository(undefined, true);

    const getDashboardMetrics = new GetDashboardMetricsUseCase(
      productRepository,
      orderRepository,
      sellerRepository
    );

    // Execute use case to get dashboard metrics (admin context - should fail with real error)
    const result = await getDashboardMetrics.execute({
      sellerId: parseInt(userId, 10)
    }, true); // isAdmin = true - should never use fallbacks

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to load dashboard metrics',
        message: 'Admin context should show real errors, not mock data'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'Admin context returned real data (no fallbacks used)',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Test dashboard metrics error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      message: 'Admin context properly threw error instead of using mock data'
    }, { status: 500 });
  }
}