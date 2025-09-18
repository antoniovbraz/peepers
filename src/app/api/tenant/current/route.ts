/**
 * Tenant Current API Route - Simplified Version
 *
 * API para obter dados do tenant atual do usuário
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Por enquanto, retornar dados básicos mock para não bloquear o admin
    const userId = request.cookies.get('user_id')?.value;
    const userEmail = request.cookies.get('user_email')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Retorna dados básicos do tenant
    return NextResponse.json({
      tenant: {
        id: userId, // Usando userId como tenantId por simplicidade
        name: 'Peepers Store',
        plan: 'professional',
        status: 'active'
      },
      user: {
        id: userId,
        email: userEmail || 'admin@peepers.com',
        role: 'admin'
      },
      context: {
        tenantId: userId,
        userId: userId,
        permissions: ['read', 'write', 'admin']
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error fetching current tenant:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Atualizar dados do tenant - Simplified Version
 */
export async function PUT(request: NextRequest) {
  try {
    const userId = request.cookies.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { settings, preferences } = body;

    // Por enquanto, apenas simular atualização
    return NextResponse.json({
      tenant: {
        id: userId,
        name: 'Peepers Store',
        plan: 'professional',
        status: 'active',
        settings,
        preferences
      },
      updated: true,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error updating tenant:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}