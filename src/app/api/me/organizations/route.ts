/**
 * API: User Organizations
 * 
 * Substitui o sistema ALLOWED_USER_IDS
 * Lista organizações que o usuário pertence
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { logger } from '@/lib/logger';

// Mock data - TODO: Implementar busca real no banco
const MOCK_USER_ORGANIZATIONS = {
  'dev_user_session123': [
    {
      organization_id: 'org_dev_1',
      organization_slug: 'dev-organization',
      organization_name: 'Development Organization',
      role: 'owner',
      status: 'active',
      joined_at: '2024-01-01T00:00:00Z',
      permissions: ['products:read', 'products:write', 'users:invite', 'billing:read', 'billing:write']
    }
  ],
  'user_ml_123456789': [
    {
      organization_id: 'org_prod_1',
      organization_slug: 'loja-teste',
      organization_name: 'Loja de Teste',
      role: 'owner',
      status: 'active',
      joined_at: '2024-01-01T00:00:00Z',
      permissions: ['products:read', 'products:write', 'users:invite', 'billing:read', 'billing:write']
    }
  ]
};

export async function GET(request: NextRequest) {
  try {
    // Extrair user_id dos headers (adicionado pelo middleware)
    const headersList = await headers();
    const userId = headersList.get('x-user-id');
    const userEmail = headersList.get('x-user-email');

    if (!userId) {
      return NextResponse.json(
        { error: 'User authentication required' },
        { status: 401 }
      );
    }

    logger.info(`Fetching organizations for user: ${userId} (${userEmail})`);

    // TODO: Buscar organizações reais do banco
    // Por enquanto usar mock data
    const organizations = MOCK_USER_ORGANIZATIONS[userId as keyof typeof MOCK_USER_ORGANIZATIONS] || [];

    const response = {
      user_id: userId,
      email: userEmail,
      organizations,
      total: organizations.length,
      current_organization: organizations.length > 0 ? organizations[0].organization_id : null
    };

    return NextResponse.json(response);

  } catch (error) {
    logger.error('Error fetching user organizations');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Update user's current organization
 */
export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const userId = headersList.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'User authentication required' },
        { status: 401 }
      );
    }

    const { organization_id } = await request.json();

    if (!organization_id) {
      return NextResponse.json(
        { error: 'organization_id is required' },
        { status: 400 }
      );
    }

    // Verificar se usuário tem acesso à organização
    const userOrganizations = MOCK_USER_ORGANIZATIONS[userId as keyof typeof MOCK_USER_ORGANIZATIONS] || [];
    const hasAccess = userOrganizations.some(org => 
      org.organization_id === organization_id && org.status === 'active'
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Organization access denied' },
        { status: 403 }
      );
    }

    // TODO: Atualizar organização atual no banco
    logger.info(`User ${userId} switched to organization ${organization_id}`);

    return NextResponse.json({
      success: true,
      current_organization: organization_id,
      message: 'Current organization updated'
    });

  } catch (error) {
    logger.error('Error updating current organization');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}