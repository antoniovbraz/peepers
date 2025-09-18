/**
 * API: Create Organization
 * 
 * Permite criar nova organização (self-service)
 * Substitui necessidade de ALLOWED_USER_IDS
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { logger } from '@/lib/logger';

interface CreateOrganizationRequest {
  name: string;
  slug?: string;
  plan?: 'starter' | 'professional' | 'enterprise';
}

/**
 * Create new organization
 */
export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const userId = headersList.get('x-user-id');
    const userEmail = headersList.get('x-user-email');

    if (!userId) {
      return NextResponse.json(
        { error: 'User authentication required' },
        { status: 401 }
      );
    }

    const { name, slug, plan = 'professional' }: CreateOrganizationRequest = await request.json();

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Organization name is required' },
        { status: 400 }
      );
    }

    // Gerar slug se não fornecido
    const organizationSlug = slug || name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Validar slug
    if (!/^[a-z0-9-]+$/.test(organizationSlug)) {
      return NextResponse.json(
        { error: 'Invalid slug format. Use only letters, numbers and hyphens.' },
        { status: 400 }
      );
    }

    // TODO: Verificar se slug já existe no banco
    // TODO: Criar organização no banco
    // TODO: Adicionar usuário como owner
    // TODO: Configurar trial se aplicável

    const organizationId = `org_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const organization = {
      id: organizationId,
      name: name.trim(),
      slug: organizationSlug,
      status: 'active',
      plan_type: plan,
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 dias
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: userId
    };

    // Criar membership do criador como owner
    const membership = {
      id: `membership_${Date.now()}`,
      organization_id: organizationId,
      user_id: userId,
      role: 'owner' as const,
      status: 'active' as const,
      joined_at: new Date().toISOString()
    };

    logger.info(`Organization created: ${organization.name} (${organization.slug}) by user ${userId}`);

    return NextResponse.json({
      success: true,
      organization,
      membership,
      next_steps: {
        setup_billing: plan !== 'starter',
        connect_ml_account: true,
        invite_team: true
      }
    }, { status: 201 });

  } catch (error) {
    logger.error('Error creating organization');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * List organizations (for selection)
 */
export async function GET(request: NextRequest) {
  try {
    const headersList = await headers();
    const userId = headersList.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'User authentication required' },
        { status: 401 }
      );
    }

    // TODO: Buscar organizações do usuário no banco
    // Por enquanto, retornar lista vazia para novos usuários
    const organizations: any[] = [];

    return NextResponse.json({
      organizations,
      total: organizations.length,
      can_create: true, // Permitir criação para todos por enquanto
      limits: {
        max_organizations_per_user: 10,
        current_count: organizations.length
      }
    });

  } catch (error) {
    logger.error('Error listing organizations');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}