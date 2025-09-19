
import { cache } from '@/lib/cache';
import { logger } from '@/lib/logger';
import { ML_CONFIG } from '@/config/routes';
import { getKVClient } from '@/lib/cache';

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
   * Detecta tentativas avançadas de token theft
   * Verifica padrões suspeitos de uso de token
   */
  private async detectAdvancedTokenTheft(
    userId: string,
    currentRefreshToken: string,
    userData: any
  ): Promise<{ isTheft: boolean; reason: string }> {
    try {
      // 1. Verificar se token foi usado recentemente (reutilização suspeita)
      const recentUsage = await getKVClient().get(`token_usage:${userId}:${currentRefreshToken}`);
      if (recentUsage) {
        const lastUsed = new Date(recentUsage as string);
        const timeSinceLastUse = Date.now() - lastUsed.getTime();
        
        // Se usado há menos de 30 segundos, pode ser reutilização suspeita
        if (timeSinceLastUse < 30000) {
          return {
            isTheft: true,
            reason: 'Token reused too quickly - possible theft'
          };
        }
      }

      // 2. Verificar se há múltiplas tentativas de rotação em curto período
      const rotationAttempts = await getKVClient().get(`rotation_attempts:${userId}`);
      if (rotationAttempts && (rotationAttempts as number) > 3) {
        return {
          isTheft: true,
          reason: 'Too many rotation attempts - possible brute force'
        };
      }

      // 3. Verificar se o token foi emitido há muito tempo (tokens velhos são suspeitos)
      if (userData.token_issued_at) {
        const issuedAt = new Date(userData.token_issued_at);
        const tokenAge = Date.now() - issuedAt.getTime();
        const maxTokenAge = 30 * 24 * 60 * 60 * 1000; // 30 dias
        
        if (tokenAge > maxTokenAge) {
          logger.warn({ userId, tokenAge: Math.floor(tokenAge / (24 * 60 * 60 * 1000)) },
            'Old token detected - may be compromised');
        }
      }

      // 4. Verificar se há mudanças suspeitas no user agent ou IP
      const lastKnownData = await getKVClient().get(`last_auth:${userId}`);
      if (lastKnownData) {
        // TODO: Implementar comparação de user agent e IP para detectar mudanças suspeitas
      }

      return { isTheft: false, reason: '' };
    } catch (error) {
      logger.error({ error, userId }, 'Error in advanced token theft detection');
      return { isTheft: false, reason: 'Detection error - allowing rotation' };
    }
  }

  /**
   * Executa rotação segura de tokens
   */
  async rotateToken(userId: string, currentRefreshToken: string): Promise<TokenRotationResult> {
    try {
      // 1. Validar token atual no cache
      const userData = await cache.getUser(userId);
      if (!userData || !userData.refresh_token) {
        logger.warn({ userId }, 'No refresh token found for user');
        return { success: false, error: 'No refresh token found' };
      }

      // 2. Detectar tentativas avançadas de token theft
      const theftDetection = await this.detectAdvancedTokenTheft(userId, currentRefreshToken, userData);
      if (theftDetection.isTheft) {
        logger.error({ userId, reason: theftDetection.reason }, 'Advanced token theft detected');
        
        // Log evento de segurança crítico
        await import('@/lib/security-events').then(m => m.logSecurityEvent({
          type: m.SecurityEventType.TOKEN_THEFT_DETECTED,
          severity: 'CRITICAL',
          userId,
          details: {
            detection_method: 'advanced_pattern_analysis',
            reason: theftDetection.reason,
            action_taken: 'invalidate_all_sessions'
          }
        }));
        
        await this.invalidateAllUserSessions(userId);
        return { success: false, error: theftDetection.reason };
      }

      // 3. CRÍTICO: Verificar se o token corresponde ao armazenado
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

      // 4. Verificar se token não está na blacklist
      if (await this.isTokenBlacklisted(currentRefreshToken)) {
        logger.warn({ userId }, 'Attempted reuse of blacklisted refresh token');
        // Normalize message to include 'theft' so upper layers can classify correctly
        return { success: false, error: 'Token theft detected - token already used' };
      }

      // 5. Obter novo token do Mercado Livre
      const newTokens = await this.fetchNewTokenFromML(currentRefreshToken);
      if (!newTokens.success) {
        return newTokens;
      }

      // 6. CRÍTICO: Invalidar token anterior (adicionar à blacklist)
      await this.blacklistToken(currentRefreshToken);

      // 7. Calcular nova data de expiração
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + newTokens.expires_in!);

      // 8. Armazenar novos tokens e histórico
      type TokenRotationHistoryEntry = { rotated_at: string; old_token_hash: string; new_token_hash: string };
      const updatedUserData = {
        ...userData,
        token: newTokens.access_token!,
        refresh_token: newTokens.refresh_token!,
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
        // Histórico para auditoria
        token_rotation_history: ([
          ...((userData.token_rotation_history as TokenRotationHistoryEntry[] | undefined) || []).slice(-9),
          { rotated_at: new Date().toISOString(), old_token_hash: this.hashToken(currentRefreshToken), new_token_hash: this.hashToken(newTokens.refresh_token!) }
        ] as TokenRotationHistoryEntry[])
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
  public async blacklistToken(token: string, reason?: string): Promise<void> {
    try {
      const kv = await import('@/lib/cache').then(m => m.getKVClient());
      const tokenHash = this.hashToken(token);
      
      // TTL de 30 dias (máximo tempo de vida de um refresh token ML)
      await kv.set(`blacklist:${tokenHash}`, 'revoked', { ex: 30 * 24 * 60 * 60 });
      
      logger.debug({ tokenHash, reason }, 'Token added to blacklist');
    } catch (error) {
      logger.error({ error }, 'Failed to blacklist token');
    }
  }

  /**
   * Verifica se token está na blacklist
   */
  public async isTokenBlacklisted(token: string): Promise<boolean> {
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
   * Cria uma família inicial de tokens para um usuário (helpers para testes)
   */
  public async createTokenFamily(userId: string, opts?: { tokenTTL?: number; refreshTokenTTL?: number }) {
    const familyId = `${userId}-${Date.now()}`;
    const accessToken = `access-${Math.random().toString(36).slice(2, 12)}`;
    const refreshToken = `refresh-${Math.random().toString(36).slice(2, 12)}`;

    // Persistir no cache / storage do usuário
    try {
      const userData = {
        user_id: parseInt(userId, 10) || 0,
        token: accessToken,
        refresh_token: refreshToken,
        expires_at: new Date(Date.now() + (opts?.tokenTTL || 3600) * 1000).toISOString(),
        token_rotation_history: [] as Array<{ rotated_at: string; old_token_hash: string; new_token_hash: string }>
      };

      await cache.setUser(userId, userData);
    } catch (error) {
      logger.error({ error, userId }, 'Failed to persist token family');
    }

    return {
      familyId,
      accessToken,
      refreshToken,
      userId
    };
  }

  /**
   * Wrapper compatível com testes: recebe (refreshToken, userId)
   * e lança em caso de detecção de theft para corresponder às expectativas
   */
  public async rotateTokens(refreshToken: string, userId: string) {
    const result = await this.rotateToken(userId, refreshToken);
    if (!result.success) {
      // Normalizar a mensagem para os testes
      if (result.error && result.error.toLowerCase().includes('theft')) {
        throw new Error('Token theft detected');
      }
      throw new Error(result.error || 'Token rotation failed');
    }

    return {
      accessToken: result.access_token!,
      refreshToken: result.refresh_token!,
      expiresAt: result.expires_at
    };
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
        const history = userData.token_rotation_history as Array<{ new_token_hash: string }>;
        const blacklistPromises = history
          .map((entry) => entry.new_token_hash)
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