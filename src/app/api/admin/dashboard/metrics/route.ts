import { NextRequest, NextResponse } from 'next/server';
import { GetDashboardMetricsUseCase } from '@/application/use-cases/GetDashboardMetricsUseCase';
import { ProductRepository } from '@/infrastructure/repositories/ProductRepository';
import { OrderRepository } from '@/infrastructure/repositories/OrderRepository';
import { SellerRepository } from '@/infrastructure/repositories/SellerRepository';

export async function GET(request: NextRequest) {
  try {
    // Este endpoint é protegido pelo middleware
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

    // Execute use case to get dashboard metrics
    const result = await getDashboardMetrics.execute();

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
    console.error('Dashboard metrics error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}