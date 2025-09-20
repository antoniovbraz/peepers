'use client';

/**
 * Monitoring Dashboard Component
 * Real-time monitoring and SLA visualization for admin panel
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Server,
  TrendingUp,
  Users,
  Zap,
  RefreshCw
} from 'lucide-react';

interface HealthStatus {
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

interface SLAMetrics {
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

export default function MonitoringDashboard() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [slaMetrics, setSlaMetrics] = useState<Record<string, SLAMetrics>>({});
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'services' | 'endpoints' | 'performance'>('services');

  const fetchMonitoringData = async () => {
    try {
      const response = await fetch('/api/health?detailed=true');
      if (response.ok) {
        const data = await response.json();
        setHealthStatus(data);
        setSlaMetrics(data.sla_metrics || {});
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoringData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchMonitoringData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'up':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'down':
      case 'unhealthy':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string): 'default' | 'success' | 'warning' | 'error' => {
    switch (status) {
      case 'healthy':
      case 'up':
        return 'success';
      case 'degraded':
        return 'warning';
      case 'down':
      case 'unhealthy':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading monitoring data...</span>
      </div>
    );
  }

  if (!healthStatus) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Monitoring Unavailable</h3>
            <p className="text-sm text-red-700 mt-1">
              Unable to fetch monitoring data. Please check the health endpoint.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Monitoring</h1>
          <p className="text-gray-600">
            Real-time observability and SLA monitoring
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={getStatusBadgeVariant(healthStatus.status)}>
            {healthStatus.status.toUpperCase()}
          </Badge>
          <Button onClick={fetchMonitoringData} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthStatus.metrics.active_tenants}</div>
            <p className="text-xs text-gray-600">
              Multi-tenant isolation active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthStatus.metrics.total_users}</div>
            <p className="text-xs text-gray-600">
              Across all tenants
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requests/Hour</CardTitle>
            <Activity className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthStatus.metrics.requests_last_hour}</div>
            <p className="text-xs text-gray-600">
              Last hour activity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthStatus.metrics.average_response_time}ms</div>
            <p className="text-xs text-gray-600">
              SLA target: &lt;500ms
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'services', label: 'Services', icon: Server },
            { id: 'endpoints', label: 'Endpoints', icon: Activity },
            { id: 'performance', label: 'Performance', icon: TrendingUp }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as 'services' | 'endpoints' | 'performance')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="h-4 w-4 inline mr-2" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {activeTab === 'services' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Service Health</CardTitle>
                <p className="text-sm text-gray-600">
                  Status of critical system services
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(healthStatus.services).map(([service, status]) => (
                  <div key={service} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {service === 'database' && <Database className="h-4 w-4" />}
                      {service === 'cache' && <Zap className="h-4 w-4" />}
                      {service === 'stripe' && <TrendingUp className="h-4 w-4" />}
                      {service === 'ml_api' && <Server className="h-4 w-4" />}
                      <span className="capitalize">{service.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(status)}
                      <Badge variant={getStatusBadgeVariant(status)}>
                        {status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Information</CardTitle>
                <p className="text-sm text-gray-600">
                  Version and uptime information
                </p>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Version:</span>
                  <span className="font-mono">{healthStatus.version}</span>
                </div>
                <div className="flex justify-between">
                  <span>Uptime:</span>
                  <span>{formatUptime(healthStatus.uptime)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Update:</span>
                  <span>{lastUpdate.toLocaleTimeString()}</span>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === 'endpoints' && (
          <Card>
            <CardHeader>
              <CardTitle>Endpoint SLA Metrics</CardTitle>
              <p className="text-sm text-gray-600">
                Performance metrics for API endpoints (last hour)
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.values(slaMetrics).map((metric) => (
                  <div key={metric.endpoint} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{metric.endpoint}</h4>
                      <Badge variant={metric.sla_breaches > 0 ? 'error' : 'success'}>
                        {metric.sla_breaches > 0 ? 'SLA Breach' : 'OK'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Requests:</span>
                        <div className="font-medium">{metric.total_requests}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Avg Response:</span>
                        <div className="font-medium">{Math.round(metric.average_response_time)}ms</div>
                      </div>
                      <div>
                        <span className="text-gray-600">P95 Response:</span>
                        <div className="font-medium">{Math.round(metric.p95_response_time)}ms</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Error Rate:</span>
                        <div className="font-medium">{metric.error_rate.toFixed(2)}%</div>
                      </div>
                    </div>
                  </div>
                ))}
                {Object.keys(slaMetrics).length === 0 && (
                  <p className="text-gray-600 text-center py-8">
                    No endpoint metrics available yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'performance' && (
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <p className="text-sm text-gray-600">
                System performance and error tracking
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Error Rate</h4>
                  <div className="text-2xl font-bold">
                    {healthStatus.metrics.error_rate_percentage}%
                  </div>
                  <p className="text-sm text-gray-600">
                    SLA target: &lt;1%
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">SLA Compliance</h4>
                  <div className="text-2xl font-bold">
                    {Object.values(slaMetrics).reduce((acc, m) => acc + (m.sla_breaches > 0 ? 0 : 1), 0)}/
                    {Object.keys(slaMetrics).length}
                  </div>
                  <p className="text-sm text-gray-600">
                    Endpoints meeting SLA
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}