import { NextRequest, NextResponse } from 'next/server';
import { getKVClient } from '@/lib/cache';
import { CACHE_KEYS } from '@/config/routes';

/**
 * Debug endpoint para diagnóstico completo de autenticação
 * Mostra estado de cookies, cache, tokens e sessão
 */
export async function GET(request: NextRequest) {
  try {
    const kv = getKVClient();
    
    // Ler cookies
    const sessionToken = request.cookies.get('session_token')?.value;
    const userId = request.cookies.get('user_id')?.value;
    const userEmail = request.cookies.get('user_email')?.value;
    
    const debug = {
      timestamp: new Date().toISOString(),
      cookies: {
        session_token: sessionToken ? 'PRESENT' : 'MISSING',
        user_id: userId || 'MISSING',
        user_email: userEmail || 'MISSING'
      },
      cache: {
        user_data: null as Record<string, unknown> | null,
        user_token: null as Record<string, unknown> | null,
        keys_checked: [] as string[]
      },
      validation: {
        has_session_token: !!sessionToken,
        has_user_id: !!userId,
        session_valid: false,
        token_available: false,
        auth_ready: false
      },
      errors: [] as string[]
    };

    if (!userId) {
      debug.errors.push('USER_ID_MISSING: Cookie user_id não encontrado');
      return NextResponse.json(debug);
    }

    if (!sessionToken) {
      debug.errors.push('SESSION_TOKEN_MISSING: Cookie session_token não encontrado');
      return NextResponse.json(debug);
    }

    // Verificar cache do usuário
    try {
      const userKey = `user:${userId}`;
      debug.cache.keys_checked.push(userKey);
      const userData = await kv.get(userKey);
      
      if (userData) {
        debug.cache.user_data = {
          exists: true,
          has_session_token: !!(userData && typeof userData === 'object' && 'session_token' in userData),
          session_token_matches: userData && typeof userData === 'object' && 'session_token' in userData && userData.session_token === sessionToken,
          has_token: !!(userData && typeof userData === 'object' && 'token' in userData),
          has_email: !!(userData && typeof userData === 'object' && 'email' in userData),
          user_type: userData && typeof userData === 'object' && 'user_type' in userData ? userData.user_type : 'UNKNOWN',
          connected_at: userData && typeof userData === 'object' && 'connected_at' in userData ? userData.connected_at : 'UNKNOWN'
        };
        
        // Validar sessão
        if (userData && typeof userData === 'object' && 'session_token' in userData) {
          debug.validation.session_valid = userData.session_token === sessionToken;
        }
        
        // Verificar se tem token
        if (userData && typeof userData === 'object' && 'token' in userData && userData.token) {
          debug.validation.token_available = true;
        }
      } else {
        debug.cache.user_data = { exists: false };
        debug.errors.push('USER_DATA_MISSING: Dados do usuário não encontrados no cache');
      }
    } catch (error) {
      debug.errors.push(`USER_CACHE_ERROR: ${error}`);
    }

    // Verificar USER_TOKEN cache
    try {
      const tokenKey = CACHE_KEYS.USER_TOKEN(userId);
      debug.cache.keys_checked.push(tokenKey);
      const userTokens = await kv.get(tokenKey);
      
      if (userTokens) {
        debug.cache.user_token = {
          exists: true,
          has_access_token: !!(userTokens && typeof userTokens === 'object' && 'access_token' in userTokens),
          has_refresh_token: !!(userTokens && typeof userTokens === 'object' && 'refresh_token' in userTokens),
          expires_at: userTokens && typeof userTokens === 'object' && 'expires_at' in userTokens ? userTokens.expires_at : 'UNKNOWN',
          token_type: userTokens && typeof userTokens === 'object' && 'token_type' in userTokens ? userTokens.token_type : 'UNKNOWN'
        };
        
        if (userTokens && typeof userTokens === 'object' && 'access_token' in userTokens && userTokens.access_token) {
          debug.validation.token_available = true;
        }
      } else {
        debug.cache.user_token = { exists: false };
      }
    } catch (error) {
      debug.errors.push(`USER_TOKEN_CACHE_ERROR: ${error}`);
    }

    // Super admin check
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL?.toLowerCase();
    const isSuperAdmin = !!(superAdminEmail && userEmail && userEmail.toLowerCase() === superAdminEmail);
    debug.validation.auth_ready = debug.validation.session_valid && (debug.validation.token_available || isSuperAdmin);

    if (isSuperAdmin) {
      debug.validation.auth_ready = true;
      debug.errors = debug.errors.filter(e => !e.includes('TOKEN'));
    }

    return NextResponse.json(debug);

  } catch (error) {
    return NextResponse.json({
      error: 'DEBUG_ENDPOINT_ERROR',
      message: String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}