/**
 * Health Check API Endpoint
 * Provides comprehensive system health status and metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { MonitoringService } from '@/lib/monitoring';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const detailed = searchParams.get('detailed') === 'true';

    if (detailed) {
      // Return detailed metrics
      const healthStatus = await MonitoringService.getHealthStatus();
      const slaMetrics = MonitoringService.getSLAMetrics(1); // Last hour
      const systemMetrics = MonitoringService.getSystemMetrics();
      const exportedMetrics = MonitoringService.exportMetrics();

      return NextResponse.json({
        ...healthStatus,
        sla_metrics: slaMetrics,
        system_metrics: systemMetrics,
        exported_metrics: exportedMetrics
      });
    } else {
      // Return basic health status
      const healthStatus = await MonitoringService.getHealthStatus();
      return NextResponse.json(healthStatus);
    }
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed'
      },
      { status: 500 }
    );
  }
}