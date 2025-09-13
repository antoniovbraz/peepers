import { NextRequest, NextResponse } from 'next/server';
import { getKVClient } from '@/lib/cache';
import { cache } from '@/lib/cache';

export async function POST(request: NextRequest) {
  try {
    const kv = getKVClient();
    
    // Buscar token com chave antiga
    const userId = '669073070';
    const oldToken = await kv.get<any>(`access_token:${userId}`);
    
    if (!oldToken) {
      return NextResponse.json({
        success: false,
        message: 'Nenhum token encontrado com chave antiga',
        userId
      });
    }

    // Migrar para nova chave usando o método correto
    await cache.setUser(userId, {
      token: oldToken.access_token || oldToken.token,
      refresh_token: oldToken.refresh_token,
      expires_at: oldToken.expires_at,
      user_id: parseInt(userId, 10),
      scope: oldToken.scope || 'read write',
      token_type: oldToken.token_type || 'Bearer'
    });

    // Verificar se foi salvo corretamente
    const newToken = await cache.getUser(userId);
    
    // Opcionalmente, remover chave antiga
    await kv.del(`access_token:${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Token migrado com sucesso',
      migration: {
        from: `access_token:${userId}`,
        to: `user:${userId}`,
        old_token_exists: !!oldToken,
        new_token_exists: !!newToken,
        token_data: {
          has_token: !!(newToken?.token),
          has_refresh: !!(newToken?.refresh_token),
          expires_at: newToken?.expires_at,
          user_id: newToken?.user_id
        }
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}