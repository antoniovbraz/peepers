import { NextResponse } from 'next/server';
import { getKVClient } from '@/lib/cache';

export async function GET() {
  try {
    const kv = getKVClient();
    
    // Tentar buscar tokens com ambas as estratégias
    const userId = '669073070';
    
    // Estratégia antiga (access_token:userId)
    const oldKeyToken = await kv.get<any>(`access_token:${userId}`);
    
    // Estratégia nova (user:userId)  
    const newKeyToken = await kv.get<any>(`user:${userId}`);
    
    // Listar algumas chaves para debug
    const debug = {
      timestamp: new Date().toISOString(),
      userId: userId,
      tokens: {
        old_key_access_token: {
          key: `access_token:${userId}`,
          exists: !!oldKeyToken,
          data: oldKeyToken ? {
            has_token: !!oldKeyToken.token,
            has_refresh: !!oldKeyToken.refresh_token,
            expires_at: oldKeyToken.expires_at,
            user_id: oldKeyToken.user_id
          } : null
        },
        new_key_user: {
          key: `user:${userId}`,
          exists: !!newKeyToken,
          data: newKeyToken ? {
            has_token: !!newKeyToken.token,
            has_refresh: !!newKeyToken.refresh_token,
            expires_at: newKeyToken.expires_at,
            user_id: newKeyToken.user_id
          } : null
        }
      }
    };

    return NextResponse.json(debug);
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}