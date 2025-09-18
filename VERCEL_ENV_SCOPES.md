# Configuração de Variáveis de Ambiente - Vercel

## 📊 Status Atual das Variáveis

Baseado na análise do código e nas capturas de tela do Vercel, aqui está a configuração correta para cada variável:

## 🔐 **Variáveis Críticas - Todas as Ambientes (Production + Preview + Development)**

### Super Admin
```
SUPER_ADMIN_EMAIL = peepers.shop@gmail.com
```
**✅ CONFIGURADO CORRETAMENTE**: "All Environments"
- **Justificativa**: Você precisa ter acesso de super admin em todos os ambientes para testes

### Mercado Livre API (ML)
```
ML_CLIENT_ID = (valor visível nas imagens)
ML_CLIENT_SECRET = (valor oculto nas imagens)
```
**✅ CONFIGURADO CORRETAMENTE**: "All Environments" 
- **Justificativa**: Necessário para testes de integração em preview e desenvolvimento

### Cache/Redis
```
UPSTASH_REDIS_REST_URL = (valor oculto nas imagens)
UPSTASH_REDIS_REST_TOKEN = (valor oculto nas imagens)
```
**✅ CONFIGURADO CORRETAMENTE**: "All Environments"
- **Justificativa**: Cache é essencial em todos os ambientes

### NextAuth
```
NEXTAUTH_SECRET = (valor oculto nas imagens)
NEXTAUTH_URL = (valor oculto nas imagens)
```
**✅ CONFIGURADO CORRETAMENTE**: "All Environments"
- **Justificativa**: Autenticação necessária em todos os ambientes

### Sistema Base
```
NODE_ENV = production/preview/development (automático do Vercel)
```
**✅ AUTOMÁTICO**: Gerenciado pelo Vercel

## 💳 **Stripe - APENAS Production (Crítico para SaaS)**

### Chaves Principais
```
STRIPE_SECRET_KEY = sk_live_... (Production) | sk_test_... (Preview + Development)
STRIPE_PUBLISHABLE_KEY = pk_live_... (Production) | pk_test_... (Preview + Development)
```
**⚠️ CONFIGURAÇÃO NECESSÁRIA**:
- **Production**: Chaves LIVE do Stripe
- **Preview + Development**: Chaves TEST do Stripe

### Webhook Secrets
```
STRIPE_WEBHOOK_SECRET = whsec_live_... (Production) | whsec_test_... (Preview + Development)
```
**⚠️ CONFIGURAÇÃO NECESSÁRIA**: Diferentes endpoints de webhook para cada ambiente

### Price IDs dos Planos
```
STRIPE_PRICE_STARTER_MONTHLY = price_live_... (Production) | price_test_... (Preview + Development)
STRIPE_PRICE_STARTER_QUARTERLY = price_live_... (Production) | price_test_... (Preview + Development)
STRIPE_PRICE_STARTER_YEARLY = price_live_... (Production) | price_test_... (Preview + Development)

STRIPE_PRICE_PROFESSIONAL_MONTHLY = price_live_... (Production) | price_test_... (Preview + Development)
STRIPE_PRICE_PROFESSIONAL_QUARTERLY = price_live_... (Production) | price_test_... (Preview + Development)
STRIPE_PRICE_PROFESSIONAL_YEARLY = price_live_... (Production) | price_test_... (Preview + Development)

STRIPE_PRICE_ENTERPRISE_MONTHLY = price_live_... (Production) | price_test_... (Preview + Development)
STRIPE_PRICE_ENTERPRISE_QUARTERLY = price_live_... (Production) | price_test_... (Preview + Development)
STRIPE_PRICE_ENTERPRISE_YEARLY = price_live_... (Production) | price_test_... (Preview + Development)
```
**⚠️ CONFIGURAÇÃO NECESSÁRIA**: Price IDs diferentes para live vs test

## 🔒 **Segurança - Production Only**

### Webhook Secrets
```
ML_WEBHOOK_SECRET = (secret específico para production)
```
**⚠️ CONFIGURAÇÃO NECESSÁRIA**: 
- **Production**: Secret real do ML
- **Preview + Development**: Secret de teste ou desabilitado

### Admin Legacy
```
ADMIN_SECRET = (valor oculto nas imagens)
```
**✅ CONFIGURADO**: Parece estar configurado corretamente

## 📍 **URLs Públicas - All Environments**

```
NEXT_PUBLIC_APP_URL = https://peepers.vercel.app (Production)
                    = https://peepers-git-branch.vercel.app (Preview)  
                    = http://localhost:3000 (Development)
```
**✅ CONFIGURADO CORRETAMENTE**: "All Environments" com URL adequada

## ⚠️ **Variáveis AUSENTES que Precisam ser Configuradas**

### 1. Stripe Billing (CRÍTICO para SaaS)
```bash
# Production
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_live_...

# Preview + Development  
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...
```

### 2. Price IDs do Stripe (Para Checkout)
```bash
# Cada plano precisa de 3 variações (monthly, quarterly, yearly)
# E cada ambiente precisa de price IDs diferentes (live vs test)

# Production (Live Price IDs)
STRIPE_PRICE_STARTER_MONTHLY=price_1234567890
STRIPE_PRICE_STARTER_QUARTERLY=price_1234567891
STRIPE_PRICE_STARTER_YEARLY=price_1234567892

# Preview + Development (Test Price IDs)
STRIPE_PRICE_STARTER_MONTHLY=price_test_1234567890
STRIPE_PRICE_STARTER_QUARTERLY=price_test_1234567891
STRIPE_PRICE_STARTER_YEARLY=price_test_1234567892
```

### 3. Webhook Security (ML)
```bash
# Production
ML_WEBHOOK_SECRET=secret_from_mercado_livre

# Preview + Development
ML_WEBHOOK_SECRET=test_secret_or_disabled
```

## 🎯 **Ações Imediatas Necessárias**

### 1. Super Admin ✅ 
**STATUS**: Configurado corretamente
- `SUPER_ADMIN_EMAIL = peepers.shop@gmail.com` em "All Environments"

### 2. Stripe Integration ⚠️
**STATUS**: AUSENTE - Precisa configurar
```bash
# Criar produtos no Stripe Dashboard primeiro
# Depois configurar as variáveis no Vercel
```

### 3. Webhook Security ⚠️  
**STATUS**: PARCIAL - ML_WEBHOOK_SECRET precisa ser configurado

## 🔧 **Como Configurar no Vercel**

### Passo 1: Stripe Setup
1. **Stripe Dashboard** → Create Products/Prices
2. **Copy Price IDs** for each plan (monthly/quarterly/yearly)
3. **Vercel Dashboard** → Environment Variables
4. **Add variables** with correct scope (Production vs Preview+Development)

### Passo 2: Webhook Secrets
1. **Mercado Livre Dashboard** → Configure webhook endpoint
2. **Copy webhook secret**
3. **Vercel Dashboard** → Add `ML_WEBHOOK_SECRET` (Production only)

### Passo 3: Validation
1. **Test Preview deployment** with test Stripe keys
2. **Test Production deployment** with live Stripe keys
3. **Verify super admin access** with `peepers.shop@gmail.com`

## 🚨 **Problemas Identificados**

### 1. Stripe Billing Incompleto
- **Impacto**: Clientes não conseguem assinar planos
- **Solução**: Configurar todas as variáveis Stripe listadas acima

### 2. Price IDs Ausentes
- **Impacto**: Checkout do Stripe vai falhar
- **Solução**: Criar produtos no Stripe e configurar price IDs

### 3. Webhook Security
- **Impacto**: Vulnerabilidade de segurança
- **Solução**: Configurar ML_WEBHOOK_SECRET para validação

## ✅ **Configuração Ideal Final**

```bash
# ============================================
# PRODUCTION ENVIRONMENT
# ============================================
SUPER_ADMIN_EMAIL=peepers.shop@gmail.com
ML_CLIENT_ID=<production_value>
ML_CLIENT_SECRET=<production_value>
ML_WEBHOOK_SECRET=<production_webhook_secret>
UPSTASH_REDIS_REST_URL=<production_redis_url>
UPSTASH_REDIS_REST_TOKEN=<production_redis_token>
NEXTAUTH_SECRET=<production_nextauth_secret>
NEXTAUTH_URL=https://peepers.vercel.app
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_live_...
STRIPE_PRICE_STARTER_MONTHLY=price_live_starter_monthly
STRIPE_PRICE_STARTER_QUARTERLY=price_live_starter_quarterly
STRIPE_PRICE_STARTER_YEARLY=price_live_starter_yearly
STRIPE_PRICE_PROFESSIONAL_MONTHLY=price_live_professional_monthly
STRIPE_PRICE_PROFESSIONAL_QUARTERLY=price_live_professional_quarterly
STRIPE_PRICE_PROFESSIONAL_YEARLY=price_live_professional_yearly
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_live_enterprise_monthly
STRIPE_PRICE_ENTERPRISE_QUARTERLY=price_live_enterprise_quarterly
STRIPE_PRICE_ENTERPRISE_YEARLY=price_live_enterprise_yearly

# ============================================
# PREVIEW + DEVELOPMENT ENVIRONMENTS
# ============================================
SUPER_ADMIN_EMAIL=peepers.shop@gmail.com
ML_CLIENT_ID=<same_as_production>
ML_CLIENT_SECRET=<same_as_production>
# ML_WEBHOOK_SECRET=<not_set_or_test_value>
UPSTASH_REDIS_REST_URL=<same_as_production_or_separate_test_redis>
UPSTASH_REDIS_REST_TOKEN=<same_as_production_or_separate_test_redis>
NEXTAUTH_SECRET=<can_be_same_or_different>
NEXTAUTH_URL=<auto_generated_by_vercel>
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...
STRIPE_PRICE_STARTER_MONTHLY=price_test_starter_monthly
STRIPE_PRICE_STARTER_QUARTERLY=price_test_starter_quarterly
STRIPE_PRICE_STARTER_YEARLY=price_test_starter_yearly
STRIPE_PRICE_PROFESSIONAL_MONTHLY=price_test_professional_monthly
STRIPE_PRICE_PROFESSIONAL_QUARTERLY=price_test_professional_quarterly
STRIPE_PRICE_PROFESSIONAL_YEARLY=price_test_professional_yearly
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_test_enterprise_monthly
STRIPE_PRICE_ENTERPRISE_QUARTERLY=price_test_enterprise_quarterly
STRIPE_PRICE_ENTERPRISE_YEARLY=price_test_enterprise_yearly
```

---

**💡 Resumo**: Sua configuração do `SUPER_ADMIN_EMAIL` está perfeita. O que falta são as variáveis do Stripe para habilitar o billing dos clientes e alguns ajustes de segurança nos webhooks.