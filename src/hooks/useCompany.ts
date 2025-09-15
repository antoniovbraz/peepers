'use client';

import { useState, useEffect } from 'react';

interface CompanyProfile {
  id: string;
  name: string;
  nickname: string;
  email: string;
  country: string;
  user_type: string;
  site_id: string;
  permalink: string;
  seller_reputation: {
    level_id: string;
    power_seller_status: string;
    transactions: {
      total: number;
      completed: number;
      canceled: number;
      period: string;
    };
  };
  status: {
    site_status: string;
    list: {
      allow: boolean;
      codes: string[];
      immediate_payment: {
        required: boolean;
        reasons: string[];
      };
    };
  };
  company: {
    brand_name: string;
    city: string;
    state: string;
    identification: string;
    company_id: string;
  };
}

interface SessionInfo {
  authenticated: boolean;
  expires_at: string;
  last_sync: string;
}

interface CompanyData {
  success: boolean;
  company: CompanyProfile;
  session: SessionInfo;
}

export function useCompany() {
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCompanyProfile();
  }, []);

  const fetchCompanyProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/auth/session');
      const data: CompanyData = await response.json();

      if (data.success && data.company) {
        setCompany(data.company);
        setSession(data.session);
      } else {
        setError('Falha ao carregar perfil da empresa');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
      console.error('Erro ao buscar perfil da empresa:', err);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setCompany(null);
        setSession(null);
        // Redirecionar para a página inicial
        window.location.href = '/';
      } else {
        setError('Erro ao fazer logout');
      }
    } catch (err) {
      setError('Erro ao fazer logout');
      console.error('Erro no logout:', err);
    }
  };

  const getSellerLevelColor = (levelId: string) => {
    if (levelId.includes('red')) return 'text-red-600 bg-red-100';
    if (levelId.includes('orange')) return 'text-orange-600 bg-orange-100';
    if (levelId.includes('yellow')) return 'text-yellow-600 bg-yellow-100';
    if (levelId.includes('light_green')) return 'text-green-600 bg-green-100';
    if (levelId.includes('green')) return 'text-green-600 bg-green-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getPowerSellerBadge = (status: string) => {
    switch (status) {
      case 'platinum': return '🏆 Platinum';
      case 'gold': return '🥇 Gold';
      case 'silver': return '🥈 Silver';
      case 'bronze': return '🥉 Bronze';
      default: return status;
    }
  };

  return {
    company,
    session,
    loading,
    error,
    logout,
    getSellerLevelColor,
    getPowerSellerBadge,
    refetch: fetchCompanyProfile
  };
}