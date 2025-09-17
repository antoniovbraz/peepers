import { NextRequest, NextResponse } from 'next/server';
import { getKVClient } from '@/lib/cache';
import { CACHE_KEYS } from '@/config/routes';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Obter user_id do cookie
    const userId = request.cookies.get('user_id')?.value;
    
    if (userId) {
      const kv = getKVClient();
      
      // CORREÇÃO CRÍTICA: Invalidar TODOS os dados relacionados ao usuário
      await Promise.all([
        // Cache principal do usuário (completo)
        kv.del(`user:${userId}`),
        // Cache específico de token (legacy)
        kv.del(CACHE_KEYS.USER_TOKEN(userId)),
        // Cache de produtos do usuário se existir
        kv.del(`products:${userId}`),
        // Cache de questões do usuário se existir
        kv.del(`questions:${userId}`),
        // Cache de categorias do usuário se existir
        kv.del(`categories:${userId}`),
        // Invalidar locks de sincronização do usuário
        kv.del(`sync:lock:${userId}`),
        // Adicionar tokens à blacklist por segurança
        invalidateUserTokens(userId, kv)
      ]);
      
      logger.info({ userId }, 'Complete user logout - all cache and sessions invalidated');
    }

    // Criar resposta com limpeza completa de cookies
    const response = NextResponse.json({
      success: true,
      message: 'Logout realizado com sucesso',
      redirect: '/'
    });

    // Limpar TODOS os cookies relacionados com flags de segurança máxima
    const cookiesToClear = ['session_token', 'user_id', 'ml_state', 'auth_status'];
    
    cookiesToClear.forEach(cookieName => {
      response.cookies.set(cookieName, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 0,
        path: '/',
        domain: undefined // Limpar para todos os domínios
      });
    });

    return response;

  } catch (error) {
    logger.error({ error }, 'Logout error');
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * Invalida tokens do usuário adicionando à blacklist
 */
async function invalidateUserTokens(userId: string, kv: any): Promise<void> {
  try {
    // Buscar dados do usuário antes de deletar
    const userData = await kv.get(`user:${userId}`);
    
    if (userData?.refresh_token) {
      // Adicionar refresh token atual à blacklist
      const tokenHash = hashToken(userData.refresh_token);
      await kv.set(`blacklist:${tokenHash}`, 'logout', { ex: 30 * 24 * 60 * 60 }); // 30 dias
      
      // Adicionar histórico de tokens à blacklist se existir
      if (userData.token_rotation_history) {
        const history = userData.token_rotation_history as any[];
        const blacklistPromises = history
          .slice(-5) // Últimos 5 tokens por segurança
          .map(async (entry: any) => {
            await kv.set(`blacklist:${entry.new_token_hash}`, 'logout', { ex: 30 * 24 * 60 * 60 });
          });
        
        await Promise.all(blacklistPromises);
      }
    }
  } catch (error) {
    logger.error({ error, userId }, 'Failed to blacklist user tokens during logout');
  }
}

/**
 * Gera hash do token para blacklist
 */
function hashToken(token: string): string {
  const suffix = token.slice(-8);
  const hash = Buffer.from(token).toString('base64').slice(0, 8);
  return `${hash}-${suffix}`;
}