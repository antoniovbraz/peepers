import { NextRequest, NextResponse } from 'next/server';
import { getKVClient } from '@/lib/cache';
import { CACHE_KEYS } from '@/config/routes';

export async function GET(_request: NextRequest) {
  try {
    const cache = getKVClient();
    
    // Buscar token do usuário autenticado
    const userToken = await cache.get(CACHE_KEYS.USER_TOKEN('669073070'));
    
    if (!userToken) {
      return NextResponse.json({
        success: false,
        error: 'Token não encontrado no cache',
      });
    }

    // Test 1: Verificar se o token é válido
    console.log('🔍 Testing ML API with token...');
    
    const testUrl = 'https://api.mercadolibre.com/users/me';
    const testResponse = await fetch(testUrl, {
      headers: {
        'Authorization': `Bearer ${userToken.access_token}`,
        'Accept': 'application/json',
      },
    });

    const testResult = await testResponse.json();
    
    if (!testResponse.ok) {
      return NextResponse.json({
        success: false,
        test: 'user_info',
        status: testResponse.status,
        error: testResult,
        token_info: {
          expires_at: userToken.expires_at,
          needs_refresh: new Date(userToken.expires_at) <= new Date(),
        }
      });
    }

    // Test 2: Verificar busca de items com USER_ID correto
    const itemsUrl = `https://api.mercadolibre.com/users/${testResult.id}/items/search?limit=5`;
    const itemsResponse = await fetch(itemsUrl, {
      headers: {
        'Authorization': `Bearer ${userToken.access_token}`,
        'Accept': 'application/json',
      },
    });

    const itemsResult = await itemsResponse.json();

    if (!itemsResponse.ok) {
      return NextResponse.json({
        success: false,
        test: 'items_search',
        status: itemsResponse.status,
        error: itemsResult,
        user_info: testResult,
      });
    }

    // Test 3: Se temos items, buscar detalhes
    let itemDetails = null;
    if (itemsResult.results && itemsResult.results.length > 0) {
      const firstItemId = itemsResult.results[0];
      const itemUrl = `https://api.mercadolibre.com/items/${firstItemId}`;
      const itemResponse = await fetch(itemUrl, {
        headers: {
          'Authorization': `Bearer ${userToken.access_token}`,
          'Accept': 'application/json',
        },
      });

      if (itemResponse.ok) {
        itemDetails = await itemResponse.json();
      } else {
        const itemError = await itemResponse.json();
        return NextResponse.json({
          success: false,
          test: 'item_details',
          status: itemResponse.status,
          error: itemError,
          item_id: firstItemId,
        });
      }
    }

    return NextResponse.json({
      success: true,
      user_info: testResult,
      items_search: {
        total: itemsResult.paging?.total || 0,
        results_count: itemsResult.results?.length || 0,
        first_items: itemsResult.results?.slice(0, 3) || [],
      },
      item_sample: itemDetails ? {
        id: itemDetails.id,
        title: itemDetails.title,
        price: itemDetails.price,
        status: itemDetails.status,
      } : null,
      token_status: {
        expires_at: userToken.expires_at,
        valid: new Date(userToken.expires_at) > new Date(),
      }
    });

  } catch (error) {
    console.error('Debug ML API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : null,
    });
  }
}