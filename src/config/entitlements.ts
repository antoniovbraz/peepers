/**
 * Entitlements Configuration - Peepers Enterprise v2.0.0
 * Configuração de permissões e recursos baseada na estratégia de pricing focada em soluções estratégicas
 */

import { PEEPERS_PLANS, PeepersPlanId, PeepersPlanFeature } from './pricing';

// Tipos para compatibilidade com código legado
export type PeepersPlanType = PeepersPlanId;
export type PeepersFeature = PeepersPlanFeature;

// Re-exportar configuração de planos
export { PEEPERS_PLANS } from './pricing';

// Cache TTL para entitlements (5 minutos)
export const ENTITLEMENTS_CACHE_TTL = 300;

// Features disponíveis durante o trial gratuito (14 dias)
export const TRIAL_FEATURES = [
  'basic_analytics',
  'product_monitoring',
  'basic_pricing',
  'basic_storefront',
  'weekly_reports',
  'chat_support'
] as const satisfies readonly PeepersPlanFeature[];

// Helper functions para verificação de permissões
export function hasFeature(planType: PeepersPlanType, feature: PeepersPlanFeature): boolean {
  const plan = PEEPERS_PLANS[planType];
  return (plan.features as readonly PeepersPlanFeature[]).includes(feature);
}

export function getLimit(planType: PeepersPlanType, limitType: keyof typeof PEEPERS_PLANS.starter.limits): number {
  const plan = PEEPERS_PLANS[planType];
  const limit = plan.limits[limitType];
  return limit === -1 ? Infinity : limit;
}

// Verificação se usuário pode acessar recurso específico
export function canAccess(planType: PeepersPlanType, feature: PeepersPlanFeature): boolean {
  return hasFeature(planType, feature);
}

// Validação de limites de uso
export function isWithinLimit(
  planType: PeepersPlanType, 
  limitType: keyof typeof PEEPERS_PLANS.starter.limits, 
  currentUsage: number
): boolean {
  const maxLimit = getLimit(planType, limitType);
  return currentUsage < maxLimit;
}

// Obter próximo plano recomendado para upgrade
export function getRecommendedUpgrade(currentPlan: PeepersPlanType): PeepersPlanType | null {
  if (currentPlan === 'starter') return 'business';
  if (currentPlan === 'business') return 'enterprise';
  return null; // Já está no plano mais alto
}
