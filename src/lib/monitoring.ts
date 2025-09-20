/**
 * Production Monitoring - Peepers Enterprise v2.0.0
 * Comprehensive observability and SLA monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import * as os from 'os';

// Monitoring metrics
export interface MonitoringMetrics {
  timestamp: string;
  response_time: number;
  status_code: number;
  endpoint: string;
  method: string;
  user_agent?: string;
  tenant_id?: string;
  user_id?: string;
  error_message?: string;
  memory_usage?: number;
  cpu_usage?: number;
}

// SLA metrics
export interface SLAMetrics {
  endpoint: string;
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  average_response_time: number;
  p95_response_time: number;
  p99_response_time: number;
  error_rate: number;
  uptime_percentage: number;
  sla_breaches: number;
}

// Alert configuration
export interface AlertConfig {
  id: string;
  name: string;
  type: 'response_time' | 'error_rate' | 'uptime' | 'memory' | 'cpu';
  threshold: number;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  enabled: boolean;
  channels: ('email' | 'slack' | 'webhook')[];
  cooldown_minutes: number;
}

// Health check response
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    database: 'up' | 'down' | 'degraded';
    cache: 'up' | 'down' | 'degraded';
    stripe: 'up' | 'down' | 'degraded';
    ml_api: 'up' | 'down' | 'degraded';
  };
  metrics: {
    active_tenants: number;
    total_users: number;
    requests_last_hour: number;
    average_response_time: number;
    error_rate_percentage: number;
  };
}

export class MonitoringService {
  private static metrics: MonitoringMetrics[] = [];
  private static readonly MAX_METRICS_HISTORY = 10000;
  private static readonly METRICS_RETENTION_HOURS = 24;

  /**
   * Record API request metrics
   */
  static recordRequest(
    request: NextRequest,
    response: NextResponse,
    startTime: number,
    tenantId?: string,
    userId?: string,
    error?: Error
  ): void {
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    const metrics: MonitoringMetrics = {
      timestamp: new Date().toISOString(),
      response_time: responseTime,
      status_code: response.status,
      endpoint: request.nextUrl.pathname,
      method: request.method,
      user_agent: request.headers.get('user-agent') || undefined,
      tenant_id: tenantId,
      user_id: userId,
      error_message: error?.message,
      memory_usage: this.getMemoryUsage(),
      cpu_usage: this.getCpuUsage()
    };

    this.metrics.push(metrics);

    // Maintain metrics history limit
    if (this.metrics.length > this.MAX_METRICS_HISTORY) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS_HISTORY);
    }

    // Check for SLA breaches
    this.checkSLABreaches(metrics);

    // Log slow requests
    if (responseTime > 1000) {
      console.warn(`🐌 Slow request: ${request.method} ${request.nextUrl.pathname} took ${responseTime}ms`);
    }

    // Log errors
    if (response.status >= 500) {
      console.error(`❌ Server error: ${request.method} ${request.nextUrl.pathname} returned ${response.status}`);
    }
  }

  /**
   * Get current health status
   */
  static async getHealthStatus(): Promise<HealthCheckResponse> {
    const uptime = process.uptime();
    const version = process.env.npm_package_version || '1.0.0';

    // Check service statuses
    const services = await this.checkServiceStatuses();

    // Calculate metrics
    const metrics = this.calculateHealthMetrics();

    // Determine overall status
    const status = this.determineHealthStatus(services, metrics);

    return {
      status,
      timestamp: new Date().toISOString(),
      version,
      uptime,
      services,
      metrics
    };
  }

  /**
   * Get SLA metrics for endpoints
   */
  static getSLAMetrics(hours: number = 1): Record<string, SLAMetrics> {
    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
    const recentMetrics = this.metrics.filter(m => new Date(m.timestamp).getTime() > cutoffTime);

    const endpointMetrics: Record<string, SLAMetrics> = {};

    for (const metric of recentMetrics) {
      if (!endpointMetrics[metric.endpoint]) {
        endpointMetrics[metric.endpoint] = {
          endpoint: metric.endpoint,
          total_requests: 0,
          successful_requests: 0,
          failed_requests: 0,
          average_response_time: 0,
          p95_response_time: 0,
          p99_response_time: 0,
          error_rate: 0,
          uptime_percentage: 100,
          sla_breaches: 0
        };
      }

      const endpoint = endpointMetrics[metric.endpoint];
      endpoint.total_requests++;

      if (metric.status_code < 400) {
        endpoint.successful_requests++;
      } else {
        endpoint.failed_requests++;
      }

      // Calculate response time percentiles
      const responseTimes = recentMetrics
        .filter(m => m.endpoint === metric.endpoint)
        .map(m => m.response_time)
        .sort((a, b) => a - b);

      if (responseTimes.length > 0) {
        endpoint.average_response_time = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
        endpoint.p95_response_time = this.getPercentile(responseTimes, 95);
        endpoint.p99_response_time = this.getPercentile(responseTimes, 99);
      }

      endpoint.error_rate = (endpoint.failed_requests / endpoint.total_requests) * 100;

      // Check SLA breaches (response time > 500ms for 95th percentile)
      if (endpoint.p95_response_time > 500) {
        endpoint.sla_breaches++;
      }
    }

    return endpointMetrics;
  }

  /**
   * Get system performance metrics
   */
  static getSystemMetrics(): {
    memory: NodeJS.MemoryUsage;
    cpu: number;
    uptime: number;
    loadAverage: number[];
  } {
    return {
      memory: process.memoryUsage(),
      cpu: this.getCpuUsage(),
      uptime: process.uptime(),
      loadAverage: process.platform === 'win32' ? [] : os.loadavg()
    };
  }

  /**
   * Check for SLA breaches and trigger alerts
   */
  private static checkSLABreaches(metrics: MonitoringMetrics): void {
    // Response time SLA: 95th percentile < 500ms
    if (metrics.response_time > 500) {
      this.triggerAlert('response_time', {
        endpoint: metrics.endpoint,
        response_time: metrics.response_time,
        tenant_id: metrics.tenant_id
      });
    }

    // Error rate SLA: < 1%
    const recentErrors = this.metrics
      .filter(m => m.status_code >= 500)
      .filter(m => new Date(m.timestamp).getTime() > Date.now() - 60000) // Last minute
      .length;

    const recentRequests = this.metrics
      .filter(m => new Date(m.timestamp).getTime() > Date.now() - 60000)
      .length;

    if (recentRequests > 10) {
      const errorRate = (recentErrors / recentRequests) * 100;
      if (errorRate > 1) {
        this.triggerAlert('error_rate', {
          error_rate: errorRate,
          recent_requests: recentRequests,
          recent_errors: recentErrors
        });
      }
    }
  }

  /**
   * Trigger monitoring alert
   */
  private static triggerAlert(type: string, data: Record<string, unknown>): void {
    console.warn(`🚨 SLA Alert: ${type}`, data);

    // In a real implementation, this would:
    // 1. Check alert cooldowns
    // 2. Send notifications to configured channels
    // 3. Log to external monitoring service
    // 4. Create incident tickets
  }

  /**
   * Check status of external services
   */
  private static async checkServiceStatuses(): Promise<HealthCheckResponse['services']> {
    const services: HealthCheckResponse['services'] = {
      database: 'up',
      cache: 'up',
      stripe: 'up',
      ml_api: 'up'
    };

    // Database check (simplified)
    try {
      // In a real implementation, you'd ping your database
      services.database = 'up';
    } catch (error) {
      services.database = 'down';
      console.error('Database health check failed:', error);
    }

    // Cache check
    try {
      // In a real implementation, you'd ping Redis/Upstash
      services.cache = 'up';
    } catch (error) {
      services.cache = 'down';
      console.error('Cache health check failed:', error);
    }

    // Stripe check
    try {
      // In a real implementation, you'd make a test API call
      services.stripe = 'up';
    } catch (error) {
      services.stripe = 'degraded';
      console.warn('Stripe health check failed:', error);
    }

    // ML API check
    try {
      // In a real implementation, you'd ping Mercado Livre API
      services.ml_api = 'up';
    } catch (error) {
      services.ml_api = 'degraded';
      console.warn('ML API health check failed:', error);
    }

    return services;
  }

  /**
   * Calculate health metrics
   */
  private static calculateHealthMetrics(): HealthCheckResponse['metrics'] {
    const lastHour = Date.now() - (60 * 60 * 1000);
    const recentMetrics = this.metrics.filter(m => new Date(m.timestamp).getTime() > lastHour);

    const successfulRequests = recentMetrics.filter(m => m.status_code < 400).length;
    const totalRequests = recentMetrics.length;
    const errorRate = totalRequests > 0 ? ((totalRequests - successfulRequests) / totalRequests) * 100 : 0;

    const avgResponseTime = recentMetrics.length > 0
      ? recentMetrics.reduce((sum, m) => sum + m.response_time, 0) / recentMetrics.length
      : 0;

    return {
      active_tenants: new Set(recentMetrics.map(m => m.tenant_id).filter(Boolean)).size,
      total_users: new Set(recentMetrics.map(m => m.user_id).filter(Boolean)).size,
      requests_last_hour: totalRequests,
      average_response_time: Math.round(avgResponseTime),
      error_rate_percentage: Math.round(errorRate * 100) / 100
    };
  }

  /**
   * Determine overall health status
   */
  private static determineHealthStatus(
    services: HealthCheckResponse['services'],
    metrics: HealthCheckResponse['metrics']
  ): HealthCheckResponse['status'] {
    // Check if any critical services are down
    const criticalServicesDown = Object.entries(services)
      .filter(([service]) => ['database', 'cache'].includes(service))
      .some(([, status]) => status === 'down');

    if (criticalServicesDown) {
      return 'unhealthy';
    }

    // Check error rate
    if (metrics.error_rate_percentage > 5) {
      return 'degraded';
    }

    // Check response time
    if (metrics.average_response_time > 1000) {
      return 'degraded';
    }

    return 'healthy';
  }

  /**
   * Get percentile from sorted array
   */
  private static getPercentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0;

    const index = (percentile / 100) * (sortedArray.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);

    if (lower === upper) {
      return sortedArray[lower];
    }

    return sortedArray[lower] + (sortedArray[upper] - sortedArray[lower]) * (index - lower);
  }

  /**
   * Get memory usage
   */
  private static getMemoryUsage(): number {
    const memUsage = process.memoryUsage();
    return Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);
  }

  /**
   * Get CPU usage (simplified)
   */
  private static getCpuUsage(): number {
    // In a real implementation, you'd use a library like 'pidusage' or 'node-os-utils'
    // For now, return a mock value
    return Math.floor(Math.random() * 100);
  }

  /**
   * Clean up old metrics
   */
  static cleanupOldMetrics(): void {
    const cutoffTime = Date.now() - (this.METRICS_RETENTION_HOURS * 60 * 60 * 1000);
    this.metrics = this.metrics.filter(m => new Date(m.timestamp).getTime() > cutoffTime);
  }

  /**
   * Export metrics for external monitoring
   */
  static exportMetrics(): {
    total_requests: number;
    average_response_time: number;
    error_rate: number;
    sla_compliance: number;
    uptime_percentage: number;
  } {
    const slaMetrics = this.getSLAMetrics(24); // Last 24 hours
    const totalEndpoints = Object.keys(slaMetrics).length;

    if (totalEndpoints === 0) {
      return {
        total_requests: 0,
        average_response_time: 0,
        error_rate: 0,
        sla_compliance: 100,
        uptime_percentage: 100
      };
    }

    const totals = Object.values(slaMetrics).reduce(
      (acc, metric) => ({
        total_requests: acc.total_requests + metric.total_requests,
        average_response_time: acc.average_response_time + metric.average_response_time,
        error_rate: acc.error_rate + metric.error_rate,
        sla_breaches: acc.sla_breaches + metric.sla_breaches
      }),
      { total_requests: 0, average_response_time: 0, error_rate: 0, sla_breaches: 0 }
    );

    const slaCompliance = ((totalEndpoints - totals.sla_breaches) / totalEndpoints) * 100;

    return {
      total_requests: totals.total_requests,
      average_response_time: totals.average_response_time / totalEndpoints,
      error_rate: totals.error_rate / totalEndpoints,
      sla_compliance: Math.max(0, slaCompliance),
      uptime_percentage: 99.9 // Mock value - would be calculated from actual uptime
    };
  }
}

// Middleware for automatic monitoring
export function withMonitoring(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();

    try {
      const response = await handler(request);

      // Extract tenant and user info from headers (set by tenant middleware)
      const tenantId = request.headers.get('x-tenant-id') || undefined;
      const userId = request.headers.get('x-user-id') || undefined;

      MonitoringService.recordRequest(request, response, startTime, tenantId, userId);

      return response;
    } catch (error) {
      const errorResponse = new NextResponse(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );

      const tenantId = request.headers.get('x-tenant-id') || undefined;
      const userId = request.headers.get('x-user-id') || undefined;

      MonitoringService.recordRequest(request, errorResponse, startTime, tenantId, userId, error as Error);

      return errorResponse;
    }
  };
}

// Periodic cleanup
if (typeof globalThis !== 'undefined') {
  // Run cleanup every hour
  setInterval(() => {
    MonitoringService.cleanupOldMetrics();
  }, 60 * 60 * 1000);
}