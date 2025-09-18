/**
 * Onboarding Page - Multi-tenant
 * 
 * Para usuários que não têm organizações
 * Permite criar nova organização ou aceitar convite
 */

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building, Users, Plus, Mail, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';

interface Invitation {
  id: string;
  organization_name: string;
  organization_slug: string;
  inviter_name: string;
  inviter_email: string;
  role: 'admin' | 'member';
  created_at: string;
}

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [step, setStep] = useState<'choose' | 'create' | 'accept'>('choose');
  
  const [newOrgData, setNewOrgData] = useState({
    name: '',
    slug: '',
    plan: 'professional' as const
  });

  useEffect(() => {
    // Buscar convites pendentes
    fetchInvitations();
    
    // Se veio de um convite específico
    const inviteId = searchParams.get('invite');
    if (inviteId) {
      setStep('accept');
    }
  }, [searchParams]);

  const fetchInvitations = async () => {
    try {
      const response = await fetch('/api/invitations');
      if (response.ok) {
        const data = await response.json();
        setInvitations(data.invitations || []);
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  };

  const handleCreateOrganization = async () => {
    if (!newOrgData.name.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrgData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar organização');
      }

      // Redirecionar para dashboard da nova organização
      router.push(`/dashboard?org=${result.organization.slug}&welcome=true`);

    } catch (error) {
      console.error('Error creating organization:', error);
      alert('Erro ao criar organização. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/invitations/${invitationId}/accept`, {
        method: 'POST'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao aceitar convite');
      }

      // Redirecionar para dashboard da organização
      router.push(`/dashboard?org=${result.organization.slug}&joined=true`);

    } catch (error) {
      console.error('Error accepting invitation:', error);
      alert('Erro ao aceitar convite. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (name: string) => {
    setNewOrgData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Bem-vindo ao Peepers!
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Para começar, você precisa criar uma organização ou aceitar um convite.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {step === 'choose' && (
            <div className="grid md:grid-cols-2 gap-8">
              {/* Criar Nova Organização */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Building className="w-6 h-6 mr-3 text-green-600" />
                    Criar Nova Organização
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-6">
                    Perfeito para novas empresas ou se você é o primeiro usuário.
                    Você será o proprietário com controle total.
                  </p>
                  
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      Controle total da organização
                    </li>
                    <li className="flex items-center text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      Gerenciar usuários e permissões
                    </li>
                    <li className="flex items-center text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      Configurar integrações
                    </li>
                    <li className="flex items-center text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      14 dias grátis para testar
                    </li>
                  </ul>

                  <Button 
                    onClick={() => setStep('create')}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Organização
                  </Button>
                </CardContent>
              </Card>

              {/* Aceitar Convites */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-6 h-6 mr-3 text-blue-600" />
                    Aceitar Convite
                    {invitations.length > 0 && (
                      <Badge className="ml-2 bg-blue-500">
                        {invitations.length}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-6">
                    Se você foi convidado para uma organização existente,
                    seus convites aparecerão aqui.
                  </p>

                  {invitations.length === 0 ? (
                    <div className="text-center py-8">
                      <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Nenhum convite pendente</p>
                      <p className="text-sm text-gray-400 mt-2">
                        Verifique seu email ou solicite um convite
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {invitations.map((invitation) => (
                        <div
                          key={invitation.id}
                          className="p-4 border rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium">{invitation.organization_name}</h4>
                            <Badge>{invitation.role}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">
                            Convidado por {invitation.inviter_name} ({invitation.inviter_email})
                          </p>
                          <Button
                            size="sm"
                            onClick={() => handleAcceptInvitation(invitation.id)}
                            disabled={loading}
                            className="w-full"
                          >
                            <ArrowRight className="w-4 h-4 mr-2" />
                            {loading ? 'Aceitando...' : 'Aceitar Convite'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {step === 'create' && (
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="w-6 h-6 mr-3 text-green-600" />
                  Criar Nova Organização
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome da Organização
                  </label>
                  <input
                    type="text"
                    value={newOrgData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Ex: ACME Store, Loja do João, Minha Empresa"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Slug da Organização
                  </label>
                  <div className="flex items-center">
                    <span className="text-gray-500 mr-2">peepers.com/</span>
                    <input
                      type="text"
                      value={newOrgData.slug}
                      onChange={(e) => setNewOrgData(prev => ({ ...prev, slug: e.target.value }))}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="minha-empresa"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    URL única para sua organização (apenas letras, números e hífens)
                  </p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">Teste Grátis de 14 Dias</h4>
                  <p className="text-green-700 text-sm">
                    Sua organização começará com o plano Professional gratuitamente.
                    Após o período de teste, você pode escolher continuar ou fazer downgrade.
                  </p>
                </div>

                <div className="flex space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => setStep('choose')}
                    className="flex-1"
                  >
                    Voltar
                  </Button>
                  <Button
                    onClick={handleCreateOrganization}
                    disabled={loading || !newOrgData.name.trim()}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {loading ? 'Criando...' : 'Criar Organização'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-600">
          <p className="text-sm">
            Precisa de ajuda?{' '}
            <a href="/suporte" className="text-blue-600 hover:underline">
              Entre em contato
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  );
}