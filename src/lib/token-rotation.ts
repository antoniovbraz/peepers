import { cache } from '@/lib/cache';
import { logger } from '@/lib/logger';
import { ML_CONFIG } from '@/config/routes';

export interface RefreshTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  user_id: number;
  refresh_token: string;
}

export interface TokenRotationResult {
  success: boolean;
  access_token?: string;
  refresh_token?: string;
  expires_at?: string;
  error?: string;
}

/**
 * Serviço de Rotação Segura de Tokens
 * 
 * Implementa token rotation para prevenir token theft:
 * 1. Valida token atual no cache
 * 2. Obtém novo token do Mercado Livre
 * 3. Invalida token anterior (crítico para segurança)
 * 4. Detecta tentativas de reutilização (token theft)
 * 5. Armazena histórico para auditoria
 */
export class TokenRotationService {
  
  /**
   * Rotaciona refresh token de forma segura
   * 
   * @param userId - ID do usuário
   * @param currentRefreshToken - Token atual para rotação
   * @returns Resultado da rotação com novos tokens
   */
  async rotateRefreshToken(userId: string, currentRefreshToken: string): Promise<TokenRotationResult> {
    try {
      // 1. Validar token atual no cache
      const userData = await cache.getUser(userId);
      if (!userData || !userData.refresh_token) {
        logger.warn({ userId }, 'No refresh token found for user');
        return { success: false, error: 'No refresh token found' };
      }

      // 2. CRÍTICO: Verificar se o token corresponde ao armazenado
      if (userData.refresh_token !== currentRefreshToken) {
        // TOKEN THEFT DETECTED - invalidar TODAS as sessões
        logger.error({ userId }, 'TOKEN THEFT DETECTED: Refresh token mismatch');
        
        // Log evento de segurança crítico
        await import('@/lib/security-events').then(m => m.logSecurityEvent({
          type: m.SecurityEventType.TOKEN_THEFT_DETECTED,
          severity: 'CRITICAL',
          userId,
          details: {
            expected_token_suffix: userData.refresh_token?.slice(-8),
            provided_token_suffix: currentRefreshToken.slice(-8),
            token_mismatch: true,
            action_taken: 'invalidate_all_sessions'
          }
        }));
        
        await this.invalidateAllUserSessions(userId);
        return { success: false, error: 'Token theft detected - all sessions invalidated' };
      }

      // 3. Verificar se token não está na blacklist
      if (await this.isTokenBlacklisted(currentRefreshToken)) {
        logger.warn({ userId }, 'Attempted reuse of blacklisted refresh token');
        return { success: false, error: 'Token already used' };
      }

      // 4. Obter novo token do Mercado Livre
      const newTokens = await this.fetchNewTokenFromML(currentRefreshToken);
      if (!newTokens.success) {
        return newTokens;
      }

      // 5. CRÍTICO: Invalidar token anterior (adicionar à blacklist)
      await this.blacklistToken(currentRefreshToken);

      // 6. Calcular nova data de expiração
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + newTokens.expires_in!);

      // 7. Armazenar novos tokens e histórico
      const updatedUserData = {
        ...userData,
        token: newTokens.access_token!,
        refresh_token: newTokens.refresh_token!,
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
        // Histórico para auditoria
        token_rotation_history: [
          ...((userData.token_rotation_history as any[]) || []).slice(-9), // Manter últimos 10
          {
            rotated_at: new Date().toISOString(),
            old_token_hash: this.hashToken(currentRefreshToken),
            new_token_hash: this.hashToken(newTokens.refresh_token!)
          }
        ]
      };

      await cache.setUser(userId, updatedUserData);

      logger.info({ 
        userId, 
        expiresAt: expiresAt.toISOString(),
        rotationCount: updatedUserData.token_rotation_history.length
      }, 'Token rotated successfully');

      return {
        success: true,
        access_token: newTokens.access_token,
        refresh_token: newTokens.refresh_token,
        expires_at: expiresAt.toISOString()
      };

    } catch (error) {
      logger.error({ error, userId }, 'Token rotation failed');
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Busca novo token do Mercado Livre
   */
  private async fetchNewTokenFromML(refreshToken: string): Promise<TokenRotationResult & Partial<RefreshTokenResponse>> {
    try {
      const response = await fetch(ML_CONFIG.TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: process.env.ML_CLIENT_ID!,
          client_secret: process.env.ML_CLIENT_SECRET!,
          refresh_token: refreshToken,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error({ error, status: response.status }, 'ML token refresh failed');
        return { success: false, error: 'Failed to refresh token with Mercado Livre' };
      }

      const tokenData: RefreshTokenResponse = await response.json();
      return { success: true, ...tokenData };

    } catch (error) {
      logger.error({ error }, 'ML token refresh request failed');
      return { success: false, error: 'Network error during token refresh' };
    }
  }

  /**
   * Invalida todas as sessões do usuário (para casos de token theft)
   */
  private async invalidateAllUserSessions(userId: string): Promise<void> {
    try {
      const kv = await import('@/lib/cache').then(m => m.getKVClient());
      
      // Remover todos os dados do usuário
      await Promise.all([
        kv.del(`user:${userId}`),
        kv.del(`access_token:${userId}`),
        this.blacklistAllUserTokens(userId)
      ]);

      logger.info({ userId }, 'All user sessions invalidated due to security incident');
    } catch (error) {
      logger.error({ error, userId }, 'Failed to invalidate all user sessions');
    }
  }

  /**
   * Adiciona token à blacklist
   */
  private async blacklistToken(token: string): Promise<void> {
    try {
      const kv = await import('@/lib/cache').then(m => m.getKVClient());
      const tokenHash = this.hashToken(token);
      
      // TTL de 30 dias (máximo tempo de vida de um refresh token ML)
      await kv.set(`blacklist:${tokenHash}`, 'revoked', { ex: 30 * 24 * 60 * 60 });
      
      logger.debug({ tokenHash }, 'Token added to blacklist');
    } catch (error) {
      logger.error({ error }, 'Failed to blacklist token');
    }
  }

  /**
   * Verifica se token está na blacklist
   */
  private async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const kv = await import('@/lib/cache').then(m => m.getKVClient());
      const tokenHash = this.hashToken(token);
      const result = await kv.get(`blacklist:${tokenHash}`);
      return result !== null;
    } catch (error) {
      logger.error({ error }, 'Failed to check token blacklist');
      return false; // Falhar aberto para não bloquear usuários legítimos
    }
  }

  /**
   * Adiciona todos os tokens do usuário à blacklist
   */
  private async blacklistAllUserTokens(userId: string): Promise<void> {
    try {
      const userData = await cache.getUser(userId);
      if (userData?.refresh_token) {
        await this.blacklistToken(userData.refresh_token);
      }
      
      // Blacklist histórico de tokens se existir
      if (userData?.token_rotation_history) {
        const history = userData.token_rotation_history as any[];
        const blacklistPromises = history
          .map((entry: any) => entry.new_token_hash)
          .map(async (hash: string) => {
            const kv = await import('@/lib/cache').then(m => m.getKVClient());
            await kv.set(`blacklist:${hash}`, 'revoked', { ex: 30 * 24 * 60 * 60 });
          });
        
        await Promise.all(blacklistPromises);
      }
    } catch (error) {
      logger.error({ error, userId }, 'Failed to blacklist all user tokens');
    }
  }

  /**
   * Gera hash seguro do token para armazenamento
   */
  private hashToken(token: string): string {
    // Usar apenas os últimos 8 caracteres + hash simples para auditoria
    // Não armazenar o token completo por segurança
    const suffix = token.slice(-8);
    const hash = Buffer.from(token).toString('base64').slice(0, 8);
    return `${hash}-${suffix}`;
  }
}

// Singleton instance
export const tokenRotationService = new TokenRotationService();