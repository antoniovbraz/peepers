/**
 * Metrics API Endpoint
 * Exposes monitoring metrics for external monitoring systems
 */

import { NextRequest, NextResponse } from 'next/server';
import { MonitoringService } from '@/lib/monitoring';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const hours = parseInt(searchParams.get('hours') || '1');

    const metrics = MonitoringService.exportMetrics();
    const slaMetrics = MonitoringService.getSLAMetrics(hours);

    if (format === 'prometheus') {
      // Prometheus format
      const prometheusMetrics = [
        `# HELP peeper_requests_total Total number of requests`,
        `# TYPE peeper_requests_total counter`,
        `peeper_requests_total ${metrics.total_requests}`,
        ``,
        `# HELP peeper_response_time_average Average response time in milliseconds`,
        `# TYPE peeper_response_time_average gauge`,
        `peeper_response_time_average ${metrics.average_response_time}`,
        ``,
        `# HELP peeper_error_rate Error rate percentage`,
        `# TYPE peeper_error_rate gauge`,
        `peeper_error_rate ${metrics.error_rate}`,
        ``,
        `# HELP peeper_sla_compliance SLA compliance percentage`,
        `# TYPE peeper_sla_compliance gauge`,
        `peeper_sla_compliance ${metrics.sla_compliance}`,
        ``,
        `# HELP peeper_uptime_percentage Uptime percentage`,
        `# TYPE peeper_uptime_percentage gauge`,
        `peeper_uptime_percentage ${metrics.uptime_percentage}`
      ].join('\n');

      return new NextResponse(prometheusMetrics, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      });
    }

    // JSON format (default)
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      period_hours: hours,
      summary: metrics,
      endpoints: slaMetrics
    });

  } catch (error) {
    console.error('Metrics endpoint error:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve metrics',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}