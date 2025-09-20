/**
 * Organization Service - Application Layer
 * 
 * Gerencia organizações, usuários e assinaturas de forma coordenada
 * Clean Architecture: Application Layer
 */

import { Organization, User, OrganizationSlug, Email } from '@/domain/entities/multi-tenant';
import { stripeClient } from '@/lib/stripe';
import { getKVClient } from '@/lib/cache';
import { logger } from '@/lib/logger';
import { PEEPERS_PLANS } from '@/config/entitlements';
import { PeepersPlanType } from '@/types/stripe';

export class OrganizationService {
  private cache = getKVClient();

  /**
   * Criar nova organização com owner (self-service signup)
   */
  async createOrganization(params: {
    name: string;
    ownerEmail: string;
    ownerName: string;
    planType?: PeepersPlanType;
  }): Promise<{ organization: Organization; user: User; stripeCheckoutUrl?: string }> {
    try {
      const { name, ownerEmail, ownerName, planType = 'starter' } = params;

      // 1. Validar inputs
      const email = new Email(ownerEmail);
      const slug = OrganizationSlug.fromName(name);

      // 2. Verificar se slug está disponível
      const existingOrg = await this.getOrganizationBySlug(slug.toString());
      if (existingOrg) {
        throw new Error('Organization slug already exists');
      }

      // 3. Verificar se email já está em uso
      const existingUser = await this.getUserByEmail(ownerEmail);
      if (existingUser) {
        throw new Error('Email already registered');
      }

      // 4. Gerar IDs
      const orgId = `org_${this.generateId()}`;
      const userId = `user_${this.generateId()}`;

      // 5. Criar Stripe Customer
      const stripeCustomer = await stripeClient.getOrCreateCustomer(
        ownerEmail,
        ownerName,
        {
          organization_id: orgId,
          organization_name: name,
          plan_type: planType
        }
      );

      // 6. Criar Organization
      const plan = PEEPERS_PLANS[planType];
      const organization: Organization = {
        id: orgId,
        name,
        slug: slug.toString(),
        created_at: new Date(),
        updated_at: new Date(),
        stripe_customer_id: stripeCustomer.id,
        subscription: {
          status: 'none',
          plan_type: planType,
          cancel_at_period_end: false
        },
        settings: {
          timezone: 'America/Sao_Paulo',
          currency: 'BRL',
          language: 'pt-BR',
          business_type: 'individual'
        },
        limits: {
          max_users: plan.limits.users_limit,
          max_ml_connections: planType === 'starter' ? 1 : planType === 'business' ? 3 : -1,
          max_products: plan.limits.products_limit,
          api_calls_per_month: plan.limits.api_calls_per_month,
          storage_gb: plan.limits.storage_gb
        },
        usage: {
          users_count: 1,
          ml_connections_count: 0,
          products_count: 0,
          api_calls_used: 0,
          storage_used_gb: 0
        },
        features: [...plan.features]
      };

      // 7. Criar User (owner)
      const user: User = {
        id: userId,
        email: ownerEmail,
        name: ownerName,
        organization_id: orgId,
        role: 'owner',
        joined_at: new Date(),
        email_verified: false, // Será verificado via email
        preferences: {
          theme: 'system',
          language: 'pt-BR',
          timezone: 'America/Sao_Paulo',
          notifications: {
            email: true,
            browser: true,
            slack: false
          }
        },
        created_at: new Date(),
        updated_at: new Date()
      };

      // 8. Salvar no cache (temporário - migrar para DB)
      await this.saveOrganization(organization);
      await this.saveUser(user);

      // 9. Criar Stripe Checkout para trial/subscription
      let stripeCheckoutUrl: string | undefined;
      if (planType !== 'starter') {
        // TODO: Implementar checkout session
        // stripeCheckoutUrl = await this.createCheckoutSession(orgId, planType);
      }

      // 10. Log event
      logger.info({
        organizationId: orgId,
        userId,
        planType,
        stripeCustomerId: stripeCustomer.id
      }, 'Organization created successfully');

      return {
        organization,
        user,
        stripeCheckoutUrl
      };

    } catch (error) {
      logger.error({ error, params }, 'Failed to create organization');
      throw error;
    }
  }

  /**
   * Convidar usuário para organização
   */
  async inviteUser(params: {
    organizationId: string;
    invitedByUserId: string;
    email: string;
    role: 'admin' | 'member' | 'viewer';
  }): Promise<{ invitationId: string; invitationUrl: string }> {
    try {
      // 1. Verificar se organização existe
      const organization = await this.getOrganization(params.organizationId);
      if (!organization) {
        throw new Error('Organization not found');
      }

      // 2. Verificar limites de usuários
      if (organization.limits.max_users !== -1 && 
          organization.usage.users_count >= organization.limits.max_users) {
        throw new Error('User limit exceeded for current plan');
      }

      // 3. Verificar se email já está na organização
      // TODO: Implementar verificação

      // 4. Gerar convite
      const invitationId = `inv_${this.generateId()}`;
      const invitationToken = this.generateSecureToken();

      // 5. Salvar convite
      // TODO: Implementar storage de convites

      // 6. Gerar URL de convite
      const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invitation?token=${invitationToken}`;

      // 7. Enviar email (TODO)
      // await this.sendInvitationEmail(params.email, organization.name, invitationUrl);

      logger.info({
        organizationId: params.organizationId,
        invitationId,
        email: params.email,
        role: params.role
      }, 'User invitation created');

      return {
        invitationId,
        invitationUrl
      };

    } catch (error) {
      logger.error({ error, params }, 'Failed to invite user');
      throw error;
    }
  }

  /**
   * Conectar conta Mercado Livre à organização
   */
  async connectMLAccount(params: {
    organizationId: string;
    mlUserData: {
      id: string;
      nickname: string;
      email: string;
      country_id: string;
      site_id: string;
    };
    tokens: {
      access_token: string;
      refresh_token: string;
      expires_at: Date;
    };
  }): Promise<{ connectionId: string }> {
    try {
      // 1. Verificar organização
      const organization = await this.getOrganization(params.organizationId);
      if (!organization) {
        throw new Error('Organization not found');
      }

      // 2. Verificar limites de conexões ML
      if (organization.limits.max_ml_connections !== -1 &&
          organization.usage.ml_connections_count >= organization.limits.max_ml_connections) {
        throw new Error('ML connections limit exceeded');
      }

      // 3. Verificar se ML account já está conectada
      // TODO: Implementar verificação

      // 4. Criar conexão
      const connectionId = `mlconn_${this.generateId()}`;

      // 5. Salvar conexão
      // TODO: Implementar storage

      // 6. Atualizar usage da organização
      await this.incrementUsage(params.organizationId, 'ml_connections_count', 1);

      // 7. Iniciar sync de produtos (background job)
      // TODO: Implementar job queue

      logger.info({
        organizationId: params.organizationId,
        connectionId,
        mlUserId: params.mlUserData.id,
        mlNickname: params.mlUserData.nickname
      }, 'ML connection established');

      return { connectionId };

    } catch (error) {
      logger.error({ error, params }, 'Failed to connect ML account');
      throw error;
    }
  }

  // Métodos auxiliares privados

  private async getOrganization(id: string): Promise<Organization | null> {
    try {
      const cached = await this.cache.get(`org:${id}`);
      if (cached) {
        return JSON.parse(cached as string);
      }
      return null;
    } catch (error) {
      logger.error({ error, id }, 'Failed to get organization');
      return null;
    }
  }

  private async getOrganizationBySlug(slug: string): Promise<Organization | null> {
    try {
      const cached = await this.cache.get(`org:slug:${slug}`);
      if (cached) {
        const orgId = cached as string;
        return this.getOrganization(orgId);
      }
      return null;
    } catch (error) {
      logger.error({ error, slug }, 'Failed to get organization by slug');
      return null;
    }
  }

  private async getUserByEmail(email: string): Promise<User | null> {
    try {
      const cached = await this.cache.get(`user:email:${email}`);
      if (cached) {
        const userId = cached as string;
        const userCached = await this.cache.get(`user:${userId}`);
        return userCached ? JSON.parse(userCached as string) : null;
      }
      return null;
    } catch (error) {
      logger.error({ error, email }, 'Failed to get user by email');
      return null;
    }
  }

  private async saveOrganization(organization: Organization): Promise<void> {
    try {
      // Salvar organização
      await this.cache.set(
        `org:${organization.id}`, 
        JSON.stringify(organization), 
        { ex: 86400 } // 24h
      );

      // Índice por slug
      await this.cache.set(
        `org:slug:${organization.slug}`, 
        organization.id, 
        { ex: 86400 }
      );

    } catch (error) {
      logger.error({ error, organizationId: organization.id }, 'Failed to save organization');
      throw error;
    }
  }

  private async saveUser(user: User): Promise<void> {
    try {
      // Salvar usuário
      await this.cache.set(
        `user:${user.id}`, 
        JSON.stringify(user), 
        { ex: 86400 }
      );

      // Índice por email
      await this.cache.set(
        `user:email:${user.email}`, 
        user.id, 
        { ex: 86400 }
      );

    } catch (error) {
      logger.error({ error, userId: user.id }, 'Failed to save user');
      throw error;
    }
  }

  private async incrementUsage(organizationId: string, metric: keyof Organization['usage'], amount: number): Promise<void> {
    try {
      const org = await this.getOrganization(organizationId);
      if (org) {
        org.usage[metric] = (org.usage[metric] as number) + amount;
        org.updated_at = new Date();
        await this.saveOrganization(org);
      }
    } catch (error) {
      logger.error({ error, organizationId, metric, amount }, 'Failed to increment usage');
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  private generateSecureToken(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}

export const organizationService = new OrganizationService();