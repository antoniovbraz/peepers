import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/cache';
import { createMercadoLivreAPI } from '@/lib/ml-api';

export async function GET(request: NextRequest) {
  try {
    // Verificar se há token válido
    const userId = process.env.ML_USER_ID || '669073070';
    const tokenData = await cache.getUser(userId);
    
    if (!tokenData || !tokenData.token) {
      return NextResponse.json({
        error: 'No authentication found',
        message: 'Usuário não autenticado ou token expirado',
        userId,
        hasToken: !!tokenData?.token
      }, { status: 401 });
    }

    // Criar cliente ML API
    const mlApi = createMercadoLivreAPI(
      { fetch },
      {
        clientId: process.env.ML_CLIENT_ID!,
        clientSecret: process.env.ML_CLIENT_SECRET!,
        accessToken: tokenData.token,
        refreshToken: tokenData.refresh_token,
        userId: userId
      }
    );

    console.log('🔍 Testando acesso direto à API do Mercado Livre...');

    // Tentar buscar produtos diretamente da API ML
    const productsResponse = await mlApi.getUserProducts('active');
    const productIds = productsResponse.results;
    
    console.log(`📦 IDs de produtos encontrados na API ML: ${productIds.length}`);

    // Buscar detalhes dos primeiros 3 produtos para teste
    const productDetails = [];
    for (let i = 0; i < Math.min(3, productIds.length); i++) {
      try {
        const product = await mlApi.getProduct(productIds[i]);
        productDetails.push({
          id: product.id,
          title: product.title,
          price: product.price,
          status: product.status
        });
      } catch (err) {
        console.warn(`Erro ao buscar produto ${productIds[i]}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        userId,
        tokenExists: true,
        tokenLength: tokenData.token.length,
        hasRefreshToken: !!tokenData.refresh_token,
        productsFromML: productIds.length,
        productIds: productIds.slice(0, 5), // Mostrar apenas os primeiros 5 IDs
        productDetails, // Detalhes dos primeiros 3 produtos
        cachedProducts: await cache.getAllProducts().then(p => p?.length || 0)
      },
      message: productIds.length > 0 
        ? `✅ Encontrados ${productIds.length} produtos na API ML` 
        : '⚠️ Nenhum produto encontrado na API ML'
    });

  } catch (error) {
    console.error('❌ Erro ao acessar API ML:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erro ao acessar API do Mercado Livre',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
      possibleCauses: [
        'Token expirado',
        'Usuário não tem produtos ativos',
        'Problemas de conectividade com ML',
        'Credenciais inválidas'
      ]
    }, { status: 500 });
  }
}