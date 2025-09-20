/**
 * Página de Upgrade - Enterprise SaaS Plans
 * 
 * Mostra os planos disponíveis (Starter, Professional, Enterprise)
 * Integração com Stripe Checkout para subscription management
 */

'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Star } from 'lucide-react';
import { PEEPERS_PLANS } from '@/config/entitlements';
import { PeepersPlanType } from '@/types/stripe';

interface PlanFeature {
  name: string;
  included: boolean;
  limit?: string;
}

interface PlanDisplayInfo {
  name: string;
  price: string;
  description: string;
  features: PlanFeature[];
  popular?: boolean;
  cta: string;
}

const PLAN_DISPLAY: Record<PeepersPlanType, PlanDisplayInfo> = {
  starter: {
    name: 'Starter',
    price: 'R$ 47/mês',
    description: 'Perfeito para vendedores iniciantes no Mercado Livre',
    cta: 'Começar Grátis',
    features: [
      { name: 'Até 100 produtos', included: true },
      { name: 'Dashboard básico', included: true },
      { name: '1.000 chamadas API/mês', included: true },
      { name: '1 usuário', included: true },
      { name: '1 GB armazenamento', included: true },
      { name: 'Relatórios avançados', included: false },
      { name: 'API v1 completa', included: false },
      { name: 'Suporte prioritário', included: false }
    ]
  },
  business: {
    name: 'Professional',
    price: 'R$ 97/mês',
    description: 'Para vendedores que querem escalar suas operações',
    popular: true,
    cta: 'Upgrade para Pro',
    features: [
      { name: 'Até 1.000 produtos', included: true },
      { name: 'Dashboard completo', included: true },
      { name: '10.000 chamadas API/mês', included: true },
      { name: 'Até 5 usuários', included: true },
      { name: '10 GB armazenamento', included: true },
      { name: 'Relatórios avançados', included: true },
      { name: 'Analytics detalhados', included: true },
      { name: 'API v1 completa', included: false },
      { name: 'Suporte prioritário', included: false }
    ]
  },
  enterprise: {
    name: 'Enterprise',
    price: 'R$ 297/mês',
    description: 'Solução completa para grandes operações',
    cta: 'Contratar Enterprise',
    features: [
      { name: 'Produtos ilimitados', included: true },
      { name: 'Dashboard enterprise', included: true },
      { name: '100.000 chamadas API/mês', included: true },
      { name: 'Usuários ilimitados', included: true },
      { name: '100 GB armazenamento', included: true },
      { name: 'Relatórios avançados', included: true },
      { name: 'Analytics em tempo real', included: true },
      { name: 'API v1 completa', included: true },
      { name: 'Suporte prioritário', included: true }
    ]
  }
};

// Componente separado para lidar com search params
function UpgradeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<PeepersPlanType | null>(null);
  const [currentPlan, setCurrentPlan] = useState<PeepersPlanType>('starter');
  const [reason, setReason] = useState<string>('');

  useEffect(() => {
    // Verificar motivo do upgrade
    const upgradeReason = searchParams.get('reason');
    if (upgradeReason) {
      setReason(upgradeReason);
    }

    // Carregar plano atual
    fetchCurrentPlan();
  }, [searchParams]);

  const fetchCurrentPlan = async () => {
    try {
      const response = await fetch('/api/entitlements');
      if (response.ok) {
        const data = await response.json();
        setCurrentPlan(data.plan_type || 'starter');
      }
    } catch (error) {
      console.error('Failed to fetch current plan:', error);
    }
  };

  const handleUpgrade = async (planType: PeepersPlanType) => {
    if (planType === currentPlan) return;

    setLoading(planType);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_type: planType,
          success_url: `${window.location.origin}/admin?upgrade=success`,
          cancel_url: `${window.location.origin}/upgrade?cancelled=true`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { checkout_url } = await response.json();
      
      // Redirecionar para Stripe Checkout
      window.location.href = checkout_url;

    } catch (error) {
      console.error('Upgrade failed:', error);
      alert('Erro ao processar upgrade. Tente novamente.');
    } finally {
      setLoading(null);
    }
  };

  const getPlanOrder = (planType: PeepersPlanType): number => {
    const order: Record<PeepersPlanType, number> = { 
      starter: 1, 
      professional: 2, 
      enterprise: 3 
    };
    return order[planType];
  };

  const isCurrentPlan = (planType: PeepersPlanType) => planType === currentPlan;
  const isDowngrade = (planType: PeepersPlanType) => getPlanOrder(planType) < getPlanOrder(currentPlan);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Escolha o Plano Ideal
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Escale sua operação no Mercado Livre com as ferramentas certas.
            Teste grátis por 14 dias em qualquer plano.
          </p>
          
          {reason && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg max-w-md mx-auto">
              <p className="text-yellow-800 text-sm">
                {reason === 'plan_required' && 'Esta funcionalidade requer um plano superior.'}
                {reason === 'limit_exceeded' && 'Você atingiu o limite do seu plano atual.'}
              </p>
            </div>
          )}
        </div>

        {/* Planos */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {(Object.keys(PLAN_DISPLAY) as PeepersPlanType[]).map((planType) => {
            const plan = PLAN_DISPLAY[planType];
            const isCurrent = isCurrentPlan(planType);
            const isDowngradeOption = isDowngrade(planType);

            return (
              <Card 
                key={planType}
                className={`relative ${plan.popular ? 'ring-2 ring-green-500 scale-105' : ''} ${
                  isCurrent ? 'bg-green-50 border-green-200' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-green-500 text-white px-4 py-1">
                      <Star className="w-3 h-3 mr-1" />
                      Mais Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    {plan.name}
                  </CardTitle>
                  <div className="text-3xl font-bold text-green-600 mt-2">
                    {plan.price}
                  </div>
                  <p className="text-gray-600 text-sm mt-2">
                    {plan.description}
                  </p>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Features */}
                  <div className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center">
                        {feature.included ? (
                          <Check className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-gray-300 mr-3 flex-shrink-0" />
                        )}
                        <span className={`text-sm ${
                          feature.included ? 'text-gray-900' : 'text-gray-400'
                        }`}>
                          {feature.name}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <div className="pt-6">
                    {isCurrent ? (
                      <Button disabled className="w-full">
                        Plano Atual
                      </Button>
                    ) : isDowngradeOption ? (
                      <Button
                        variant="outline"
                        onClick={() => handleUpgrade(planType)}
                        disabled={loading === planType}
                        className="w-full"
                      >
                        {loading === planType ? 'Processando...' : 'Fazer Downgrade'}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleUpgrade(planType)}
                        disabled={loading === planType}
                        className={`w-full ${
                          plan.popular 
                            ? 'bg-green-600 hover:bg-green-700' 
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        {loading === planType ? 'Processando...' : plan.cta}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className="text-center mt-12 text-gray-600">
          <p className="text-sm">
            Todos os planos incluem 14 dias de teste grátis. 
            Cancele a qualquer momento sem taxas adicionais.
          </p>
          <div className="mt-4 space-x-6 text-sm">
            <button 
              onClick={() => router.push('/admin')}
              className="text-blue-600 hover:underline"
            >
              Voltar ao Dashboard
            </button>
            <button 
              onClick={() => router.push('/billing')}
              className="text-blue-600 hover:underline"
            >
              Gerenciar Billing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UpgradePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando planos...</p>
        </div>
      </div>
    }>
      <UpgradeContent />
    </Suspense>
  );
}