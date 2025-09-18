/**
 * Billing Portal - Dashboard de subscription e faturas
 * 
 * Página para gerenciar subscription, visualizar faturas e acompanhar uso
 * Integração com Stripe Customer Portal para mudanças de plano
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Download, 
  ExternalLink, 
  Calendar,
  TrendingUp,
  Users,
  Database,
  Activity
} from 'lucide-react';
import { TenantEntitlement } from '@/types/stripe';

interface BillingInfo {
  entitlement: TenantEntitlement | null;
  invoices: Array<{
    id: string;
    amount: number;
    status: string;
    created: number;
    invoice_pdf?: string;
  }>;
  nextInvoice?: {
    amount: number;
    date: number;
  };
}

export default function BillingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [billingInfo, setBillingInfo] = useState<BillingInfo>({
    entitlement: null,
    invoices: []
  });

  useEffect(() => {
    fetchBillingInfo();
  }, []);

  const fetchBillingInfo = async () => {
    try {
      // Buscar entitlements
      const entitlementsResponse = await fetch('/api/entitlements');
      const entitlement = entitlementsResponse.ok 
        ? await entitlementsResponse.json() 
        : null;

      // TODO: Implementar endpoint para buscar invoices
      // const invoicesResponse = await fetch('/api/stripe/invoices');
      // const invoices = invoicesResponse.ok ? await invoicesResponse.json() : [];

      setBillingInfo({
        entitlement,
        invoices: [], // Placeholder
        nextInvoice: entitlement?.subscription_status === 'active' ? {
          amount: getPlanPrice(entitlement.plan_type),
          date: new Date(entitlement.current_period_end).getTime()
        } : undefined
      });

    } catch (error) {
      console.error('Failed to fetch billing info:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCustomerPortal = async () => {
    setPortalLoading(true);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_type: billingInfo.entitlement?.plan_type || 'professional',
          success_url: `${window.location.origin}/billing?updated=true`,
          cancel_url: `${window.location.origin}/billing`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to open customer portal');
      }

      const { checkout_url } = await response.json();
      window.location.href = checkout_url;

    } catch (error) {
      console.error('Failed to open customer portal:', error);
      alert('Erro ao abrir portal do cliente. Tente novamente.');
    } finally {
      setPortalLoading(false);
    }
  };

  const getPlanPrice = (planType?: string) => {
    const prices = { starter: 47, professional: 97, enterprise: 297 };
    return prices[planType as keyof typeof prices] || 0;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getSubscriptionStatusBadge = (status?: string) => {
    const statusMap = {
      active: { variant: 'success' as const, text: 'Ativo' },
      trialing: { variant: 'warning' as const, text: 'Trial' },
      past_due: { variant: 'error' as const, text: 'Vencido' },
      canceled: { variant: 'default' as const, text: 'Cancelado' },
      no_subscription: { variant: 'default' as const, text: 'Sem Subscription' }
    };

    const config = statusMap[status as keyof typeof statusMap] || statusMap.no_subscription;
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((used / limit) * 100, 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando informações de billing...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
            <p className="text-gray-600 mt-2">
              Gerencie sua assinatura, visualize faturas e acompanhe o uso
            </p>
          </div>
          <div className="space-x-4">
            <Button 
              variant="outline" 
              onClick={() => router.push('/admin')}
            >
              Voltar ao Dashboard
            </Button>
            <Button 
              variant="outline"
              onClick={() => router.push('/upgrade')}
            >
              Ver Planos
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Subscription Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Subscription Atual
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold capitalize">
                      Plano {billingInfo.entitlement?.plan_type || 'Starter'}
                    </h3>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                      {formatCurrency(getPlanPrice(billingInfo.entitlement?.plan_type))}
                      <span className="text-sm text-gray-500 font-normal">/mês</span>
                    </p>
                  </div>
                  <div className="text-right">
                    {getSubscriptionStatusBadge(billingInfo.entitlement?.subscription_status)}
                    {billingInfo.entitlement?.cancel_at_period_end && (
                      <p className="text-sm text-red-600 mt-1">
                        Cancela em {formatDate(new Date(billingInfo.entitlement.current_period_end).getTime())}
                      </p>
                    )}
                  </div>
                </div>

                {billingInfo.nextInvoice && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-blue-600 mr-2" />
                        <span className="text-sm text-blue-800">Próxima cobrança</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-blue-900">
                          {formatCurrency(billingInfo.nextInvoice.amount)}
                        </p>
                        <p className="text-sm text-blue-600">
                          {formatDate(billingInfo.nextInvoice.date)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4">
                  <Button 
                    onClick={openCustomerPortal}
                    disabled={portalLoading}
                    className="w-full sm:w-auto"
                  >
                    {portalLoading ? (
                      'Abrindo...'
                    ) : (
                      <>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Gerenciar Subscription
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Usage Stats */}
            {billingInfo.entitlement && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Uso Atual
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* API Calls */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium flex items-center">
                          <Activity className="w-4 h-4 mr-1" />
                          Chamadas API
                        </span>
                        <span className="text-sm text-gray-500">
                          {billingInfo.entitlement.limits.api_calls_used} / {
                            billingInfo.entitlement.limits.api_calls_limit === -1 
                              ? '∞' 
                              : billingInfo.entitlement.limits.api_calls_limit.toLocaleString()
                          }
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${getUsagePercentage(
                              billingInfo.entitlement.limits.api_calls_used,
                              billingInfo.entitlement.limits.api_calls_limit
                            )}%` 
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Products */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium flex items-center">
                          <Database className="w-4 h-4 mr-1" />
                          Produtos
                        </span>
                        <span className="text-sm text-gray-500">
                          {billingInfo.entitlement.limits.products_count} / {
                            billingInfo.entitlement.limits.products_limit === -1 
                              ? '∞' 
                              : billingInfo.entitlement.limits.products_limit.toLocaleString()
                          }
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${getUsagePercentage(
                              billingInfo.entitlement.limits.products_count,
                              billingInfo.entitlement.limits.products_limit
                            )}%` 
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Users */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          Usuários
                        </span>
                        <span className="text-sm text-gray-500">
                          {billingInfo.entitlement.limits.users_count} / {
                            billingInfo.entitlement.limits.users_limit === -1 
                              ? '∞' 
                              : billingInfo.entitlement.limits.users_limit
                          }
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${getUsagePercentage(
                              billingInfo.entitlement.limits.users_count,
                              billingInfo.entitlement.limits.users_limit
                            )}%` 
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Storage */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium flex items-center">
                          <Database className="w-4 h-4 mr-1" />
                          Armazenamento
                        </span>
                        <span className="text-sm text-gray-500">
                          {billingInfo.entitlement.limits.storage_used_gb.toFixed(1)} GB / {
                            billingInfo.entitlement.limits.storage_limit_gb === -1 
                              ? '∞' 
                              : `${billingInfo.entitlement.limits.storage_limit_gb} GB`
                          }
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${getUsagePercentage(
                              billingInfo.entitlement.limits.storage_used_gb,
                              billingInfo.entitlement.limits.storage_limit_gb
                            )}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push('/upgrade')}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Fazer Upgrade
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={openCustomerPortal}
                  disabled={portalLoading}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Atualizar Pagamento
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.open('mailto:support@peepers.com', '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Contatar Suporte
                </Button>
              </CardContent>
            </Card>

            {/* Recent Invoices */}
            <Card>
              <CardHeader>
                <CardTitle>Faturas Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                {billingInfo.invoices.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    Nenhuma fatura encontrada
                  </p>
                ) : (
                  <div className="space-y-3">
                    {billingInfo.invoices.map((invoice) => (
                      <div key={invoice.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">
                            {formatCurrency(invoice.amount / 100)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(invoice.created * 1000)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={invoice.status === 'paid' ? 'success' : 'error'}>
                            {invoice.status === 'paid' ? 'Pago' : 'Pendente'}
                          </Badge>
                          {invoice.invoice_pdf && (
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => window.open(invoice.invoice_pdf, '_blank')}
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}