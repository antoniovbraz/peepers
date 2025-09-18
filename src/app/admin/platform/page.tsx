/**
 * Platform Admin Dashboard
 * 
 * Dashboard exclusivo para o dono da aplicação (super admin)
 * Visão global da plataforma, todas as organizações, analytics, etc.
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Building, 
  CreditCard, 
  TrendingUp, 
  DollarSign,
  AlertTriangle,
  Activity,
  Database,
  Shield,
  Settings,
  BarChart3,
  UserCheck
} from 'lucide-react';

interface PlatformStats {
  organizations: {
    total: number;
    active: number;
    trial: number;
    paid: number;
  };
  users: {
    total: number;
    active_last_30d: number;
    new_this_month: number;
  };
  revenue: {
    mrr: number;
    total_this_month: number;
    growth_rate: number;
  };
  system: {
    uptime: number;
    api_calls_today: number;
    cache_hit_rate: number;
    error_rate: number;
  };
}

export default function PlatformAdminPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlatformStats();
  }, []);

  const fetchPlatformStats = async () => {
    try {
      const response = await fetch('/api/admin/platform/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching platform stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Shield className="w-8 h-8 mr-3 text-purple-600" />
              Platform Admin
            </h1>
            <p className="text-gray-600 mt-2">
              Visão geral da plataforma Peepers • Super Admin Dashboard
            </p>
          </div>
          
          <div className="flex space-x-3">
            <Badge className="bg-purple-100 text-purple-800">
              Super Admin
            </Badge>
            <Badge className="bg-green-100 text-green-800">
              Platform Owner
            </Badge>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Organizations */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Organizações</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.organizations.total || 0}</div>
              <div className="flex space-x-4 text-xs text-muted-foreground mt-2">
                <span>Ativas: {stats?.organizations.active || 0}</span>
                <span>Trial: {stats?.organizations.trial || 0}</span>
                <span>Pagas: {stats?.organizations.paid || 0}</span>
              </div>
            </CardContent>
          </Card>

          {/* Users */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.users.total || 0}</div>
              <div className="flex space-x-4 text-xs text-muted-foreground mt-2">
                <span>Ativos: {stats?.users.active_last_30d || 0}</span>
                <span>Novos: {stats?.users.new_this_month || 0}</span>
              </div>
            </CardContent>
          </Card>

          {/* Revenue */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {(stats?.revenue.mrr || 0).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                MRR • +{stats?.revenue.growth_rate || 0}% este mês
              </div>
            </CardContent>
          </Card>

          {/* System Health */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sistema</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.system.uptime || 99.9}%
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Uptime • {stats?.system.api_calls_today || 0} calls hoje
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Organizations Management */}
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="w-5 h-5 mr-2 text-blue-600" />
                Gerenciar Organizações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Visualizar, editar e gerenciar todas as organizações da plataforma.
              </p>
              <Button className="w-full">
                Acessar Organizações
              </Button>
            </CardContent>
          </Card>

          {/* Users Management */}
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserCheck className="w-5 h-5 mr-2 text-green-600" />
                Gerenciar Usuários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Administrar usuários, permissões e acessos globalmente.
              </p>
              <Button className="w-full">
                Acessar Usuários
              </Button>
            </CardContent>
          </Card>

          {/* Billing Overview */}
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-purple-600" />
                Billing Global
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Visão completa do Stripe, receitas e transações.
              </p>
              <Button className="w-full">
                Acessar Billing
              </Button>
            </CardContent>
          </Card>

          {/* Analytics */}
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-orange-600" />
                Analytics Avançado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Métricas detalhadas, usage patterns e insights.
              </p>
              <Button className="w-full">
                Ver Analytics
              </Button>
            </CardContent>
          </Card>

          {/* System Health */}
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="w-5 h-5 mr-2 text-red-600" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Logs, monitoring, performance e debugging.
              </p>
              <Button className="w-full">
                System Status
              </Button>
            </CardContent>
          </Card>

          {/* Platform Settings */}
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2 text-gray-600" />
                Configurações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Feature flags, configurações globais e manutenção.
              </p>
              <Button className="w-full">
                Configurações
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Atividade Recente da Plataforma
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">Nova organização criada</p>
                  <p className="text-sm text-gray-600">Loja ABC iniciou trial Professional</p>
                </div>
                <Badge className="bg-green-100 text-green-800">2h atrás</Badge>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">Upgrade de plano</p>
                  <p className="text-sm text-gray-600">TechStore migrou para Enterprise</p>
                </div>
                <Badge className="bg-blue-100 text-blue-800">4h atrás</Badge>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">Integração ML conectada</p>
                  <p className="text-sm text-gray-600">5 novas integrações hoje</p>
                </div>
                <Badge className="bg-purple-100 text-purple-800">6h atrás</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}