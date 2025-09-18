/**
 * Platform Admin Stats API
 * 
 * Estatísticas globais da plataforma para super admin
 * Métricas de organizações, usuários, receita e sistema
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { isSuperAdmin } from '@/config/platform-admin';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    // Verificar se é super admin
    const headersList = await headers();
    const userId = headersList.get('x-user-id');
    const userEmail = headersList.get('x-user-email');

    if (!isSuperAdmin({ email: userEmail || undefined, id: userId || undefined })) {
      return NextResponse.json(
        { error: 'Super admin access required' },
        { status: 403 }
      );
    }

    // Mock data para demonstração
    // TODO: Implementar queries reais no banco de dados
    const platformStats = {
      organizations: {
        total: 15,
        active: 12,
        trial: 5,
        paid: 7
      },
      users: {
        total: 45,
        active_last_30d: 38,
        new_this_month: 8
      },
      revenue: {
        mrr: 12500, // Monthly Recurring Revenue em R$
        total_this_month: 11800,
        growth_rate: 23.5
      },
      system: {
        uptime: 99.8,
        api_calls_today: 1250,
        cache_hit_rate: 94.2,
        error_rate: 0.02
      },
      recent_activity: [
        {
          id: 1,
          type: 'organization_created',
          message: 'Nova organização criada: Loja ABC',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2h atrás
          metadata: {
            organization_name: 'Loja ABC',
            plan: 'professional'
          }
        },
        {
          id: 2,
          type: 'plan_upgraded',
          message: 'TechStore fez upgrade para Enterprise',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4h atrás
          metadata: {
            organization_name: 'TechStore',
            from_plan: 'professional',
            to_plan: 'enterprise'
          }
        },
        {
          id: 3,
          type: 'ml_integration',
          message: '5 novas integrações ML conectadas hoje',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6h atrás
          metadata: {
            count: 5
          }
        }
      ],
      top_organizations: [
        {
          id: 'org_1',
          name: 'TechStore Premium',
          plan: 'enterprise',
          mrr: 2970, // R$297 * 10 users
          users_count: 10,
          api_usage_30d: 45000,
          status: 'active'
        },
        {
          id: 'org_2', 
          name: 'Loja Fashion',
          plan: 'professional',
          mrr: 970, // R$97 * 10 users
          users_count: 5,
          api_usage_30d: 28000,
          status: 'active'
        },
        {
          id: 'org_3',
          name: 'Casa & Decoração',
          plan: 'professional',
          mrr: 485, // R$97 * 5 users
          users_count: 3,
          api_usage_30d: 15000,
          status: 'trial'
        }
      ],
      metrics_summary: {
        conversion_rate: 68.2, // % trial -> paid
        churn_rate: 4.1, // % monthly churn
        avg_revenue_per_user: 278, // ARPU em R$
        customer_acquisition_cost: 125, // CAC em R$
        lifetime_value: 3340 // LTV em R$
      }
    };

    logger.info(`Platform stats requested by super admin ${userEmail}`);

    return NextResponse.json(platformStats);

  } catch (error) {
    logger.error('Error fetching platform stats');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}