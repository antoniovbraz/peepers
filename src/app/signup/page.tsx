/**
 * Self-Service Signup Page - Enterprise Multi-tenant
 * 
 * Permite que novos clientes se registrem sem precisar de ALLOWED_USER_IDS
 * Cria automaticamente Organization + User + Trial
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Building, User, Mail, CreditCard } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    organization_name: '',
    name: '',
    email: '',
    plan_type: 'professional' as const,
    business_type: 'individual' as const,
    tax_id: '',
    utm_source: '',
    utm_campaign: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.organization_name.trim()) {
      newErrors.organization_name = 'Nome da empresa é obrigatório';
    }
    
    if (!formData.name.trim()) {
      newErrors.name = 'Seu nome é obrigatório';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleSignup = async () => {
    if (!validateStep1()) return;

    setLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro no cadastro');
      }

      // Sucesso - redirecionar para próximos passos
      if (result.next_steps?.stripe_checkout_url) {
        window.location.href = result.next_steps.stripe_checkout_url;
      } else {
        router.push(`/dashboard?welcome=true&org=${result.organization.slug}`);
      }

    } catch (error) {
      console.error('Signup failed:', error);
      setErrors({ 
        general: error instanceof Error ? error.message : 'Erro no cadastro. Tente novamente.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: 'R$ 47/mês',
      description: 'Para começar no Mercado Livre',
      features: ['Até 100 produtos', 'Dashboard básico', '1.000 API calls/mês', '1 usuário'],
      popular: false
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 'R$ 97/mês',
      description: 'Para escalar suas vendas',
      features: ['Até 1.000 produtos', 'Analytics avançados', '10.000 API calls/mês', 'Até 5 usuários'],
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'R$ 297/mês',
      description: 'Para grandes operações',
      features: ['Produtos ilimitados', 'API completa', '100.000 API calls/mês', 'Usuários ilimitados'],
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Crie sua conta no Peepers
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Gerencie sua loja no Mercado Livre de forma profissional.
            Teste grátis por 14 dias, sem compromisso.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Informações Básicas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {errors.general && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 text-sm">{errors.general}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome da sua empresa/loja
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={formData.organization_name}
                      onChange={(e) => handleInputChange('organization_name', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.organization_name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Ex: ACME Store, Loja do João, etc"
                    />
                  </div>
                  {errors.organization_name && (
                    <p className="text-red-600 text-sm mt-1">{errors.organization_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seu nome completo
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="João Silva"
                    />
                  </div>
                  {errors.name && (
                    <p className="text-red-600 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="joao@exemplo.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-600 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/login')}
                  >
                    Já tenho conta
                  </Button>
                  <Button onClick={handleNextStep}>
                    Próximo Passo
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Escolha seu Plano
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 mb-6">
                  {plans.map((plan) => (
                    <div
                      key={plan.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        formData.plan_type === plan.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      } ${plan.popular ? 'ring-2 ring-green-200' : ''}`}
                      onClick={() => handleInputChange('plan_type', plan.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <h3 className="font-semibold text-lg">{plan.name}</h3>
                            {plan.popular && (
                              <Badge className="ml-2 bg-green-500 text-white">
                                Mais Popular
                              </Badge>
                            )}
                          </div>
                          <p className="text-2xl font-bold text-green-600 mb-2">{plan.price}</p>
                          <p className="text-gray-600 mb-3">{plan.description}</p>
                          <div className="space-y-1">
                            {plan.features.map((feature, index) => (
                              <div key={index} className="flex items-center text-sm">
                                <Check className="w-4 h-4 text-green-500 mr-2" />
                                {feature}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className={`w-4 h-4 border-2 rounded-full ${
                            formData.plan_type === plan.id
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300'
                          }`}>
                            {formData.plan_type === plan.id && (
                              <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg mb-6">
                  <p className="text-yellow-800 text-sm">
                    <strong>14 dias grátis</strong> em qualquer plano. 
                    Cancele a qualquer momento sem taxas.
                  </p>
                </div>

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                  >
                    Voltar
                  </Button>
                  <Button
                    onClick={handleSignup}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {loading ? 'Criando conta...' : 'Criar Conta Grátis'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-600">
          <p className="text-sm">
            Ao criar uma conta, você concorda com nossos{' '}
            <a href="/termos" className="text-blue-600 hover:underline">
              Termos de Uso
            </a>{' '}
            e{' '}
            <a href="/privacidade" className="text-blue-600 hover:underline">
              Política de Privacidade
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}