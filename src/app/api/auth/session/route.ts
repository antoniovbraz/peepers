import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Simular dados da empresa conectada (Mercado Livre)
    const companyProfile = {
      id: '669073070',
      name: 'PEEPERS SHOP',
      nickname: 'peepersshop',
      email: 'contato@peepers.com.br',
      country: 'BR',
      user_type: 'brand',
      site_id: 'MLB',
      permalink: 'https://www.mercadolivre.com.br/pagina/peepersshop',
      seller_reputation: {
        level_id: '5_green',
        power_seller_status: 'platinum',
        transactions: {
          total: 1250,
          completed: 1200,
          canceled: 50,
          period: 'historic'
        }
      },
      status: {
        site_status: 'active',
        list: {
          allow: true,
          codes: [],
          immediate_payment: {
            required: true,
            reasons: []
          }
        }
      },
      company: {
        brand_name: 'Peepers',
        city: 'São Paulo',
        state: 'SP',
        identification: 'CNPJ',
        company_id: '12.345.678/0001-90'
      }
    };

    return NextResponse.json({
      success: true,
      company: companyProfile,
      session: {
        authenticated: true,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
        last_sync: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Erro ao obter perfil da empresa:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}