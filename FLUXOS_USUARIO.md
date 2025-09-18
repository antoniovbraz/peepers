# 🔐 Fluxos de Usuário - Super Admin vs Clientes

## 📊 **Resumo das Diferenças**

| Aspecto | **Você (Super Admin)** | **Seus Clientes** |
|---------|------------------------|-------------------|
| **Role** | `super_admin` | `owner/admin/member` |
| **Billing** | ❌ Não paga (dono da SaaS) | ✅ Paga Stripe |
| **Organizações** | 👁️ Vê todas | 🏢 Vê apenas as suas |
| **Dashboard** | `/admin/platform` (global) | `/admin` (sua org) |
| **Limites** | ♾️ Ilimitado | 📊 Por plano |
| **Features** | 🔧 Todas + platform admin | 📦 Conforme plano |

---

## 🎯 **FLUXO 1: Você (Dono da Aplicação)**

### 🔑 **Como o Sistema Te Reconhece**

```typescript
// src/config/platform-admin.ts
SUPER_ADMIN_EMAIL: 'peepers.shop@gmail.com'
```

**Quando você faz login:**
1. Sistema detecta seu email como super admin
2. Você recebe role `super_admin` automaticamente  
3. Acesso liberado para rotas `/admin/platform/*`
4. Entitlements ilimitados (não depende do Stripe)

### 🏠 **Seu Dashboard Especial**

**URL:** `/admin/platform`

**O que você vê:**
- 📊 **Métricas Globais**: Todas as organizações da plataforma
- 💰 **Receita Total**: MRR, growth rate, Stripe analytics
- 👥 **Todos os Usuários**: Gestão global de usuários
- 🏢 **Todas as Organizações**: Pode ver/editar qualquer organização
- 🔧 **System Health**: Uptime, errors, performance
- ⚙️ **Platform Settings**: Feature flags, configurações globais

### 🛠️ **Suas Funcionalidades Exclusivas**

```typescript
// Features que só você tem acesso
SUPER_ADMIN_FEATURES: [
  'platform:analytics',           // Analytics globais
  'platform:users_management',    // Gestão de todos os usuários
  'platform:organizations_management', // Gestão de todas as orgs
  'platform:billing_overview',    // Visão completa do Stripe
  'admin:all_organizations',      // Pode ver qualquer organização
  'admin:impersonate_users',      // Pode se passar por outros usuários
  'stripe:admin_access',          // Acesso total ao Stripe
  'ml:global_settings'            // Configurações globais ML
]
```

### 💳 **Billing Para Você**

- **❌ Não paga nada** (você é o dono da SaaS)
- **✅ Recebe pagamentos** dos seus clientes via Stripe
- **👁️ Vê todas as subscriptions** dos clientes
- **🔧 Pode modificar** billing de qualquer cliente

---

## 🏢 **FLUXO 2: Seus Clientes (Pagantes)**

### 🔑 **Como o Sistema Os Reconhece**

**Quando um cliente faz login:**
1. Email **NÃO** é super admin
2. Sistema busca organizações do usuário
3. Entitlements baseados no plano Stripe da organização
4. Acesso limitado às suas próprias organizações

### 🏠 **Dashboard dos Clientes**

**URL:** `/admin` (dashboard normal)

**O que eles veem:**
- 📊 **Suas Métricas**: Apenas da organização dele
- 🛍️ **Seus Produtos ML**: Produtos da conta ML conectada
- 👥 **Sua Equipe**: Usuários da organização dele
- 💰 **Seu Billing**: Subscription e faturas da organização
- 📈 **Suas Vendas**: Analytics da organização

### 💳 **Billing Para Clientes**

**Fluxo de Signup Cliente:**
1. **Acessa `/signup`** → Self-service registration
2. **Cria organização** → Automaticamente com trial de 14 dias
3. **Escolhe plano** em `/upgrade`:
   - 🥉 **Starter**: R$ 19/mês
   - 🥈 **Professional**: R$ 34/mês 
   - 🥇 **Enterprise**: R$ 54/mês
4. **Paga via Stripe** → Subscription ativa
5. **Acessa features** conforme o plano

### 📦 **Limites Por Plano**

```typescript
// Starter (R$ 47/mês)
{
  products_limit: 100,
  api_calls_limit: 10000,
  users_limit: 3,
  storage_limit_gb: 5
}

// Professional (R$ 97/mês) 
{
  products_limit: 1000,
  api_calls_limit: 50000,
  users_limit: 10,
  storage_limit_gb: 25
}

// Enterprise (R$ 297/mês)
{
  products_limit: "unlimited",
  api_calls_limit: 200000,
  users_limit: "unlimited", 
  storage_limit_gb: 100
}
```

---

## 🔍 **Como Testar os Dois Fluxos**

### 🧪 **Testando Fluxo Super Admin (Você)**

```bash
# 1. Configure seu email no .env
SUPER_ADMIN_EMAIL=antonio@peepers.com

# 2. Faça login com esse email
# 3. Acesse rotas especiais:
https://seu-app.vercel.app/admin/platform  # Dashboard especial
https://seu-app.vercel.app/api/entitlements # Veja entitlements ilimitados
```

**O que deve acontecer:**
- ✅ Acesso liberado para `/admin/platform`
- ✅ Entitlements com `is_super_admin: true`
- ✅ Limites todos `Number.MAX_SAFE_INTEGER`
- ✅ Features platform exclusivas

### 🧪 **Testando Fluxo Cliente**

```bash
# 1. Use email diferente (não super admin)
# 2. Acesse /signup
# 3. Crie uma organização
# 4. Teste limites por plano
```

**O que deve acontecer:**
- ❌ Bloqueado em `/admin/platform` 
- ✅ Acesso normal a `/admin`
- ✅ Entitlements limitados por plano
- ✅ Billing via Stripe funcionando

---

## 🚨 **Status Atual do Código**

### ✅ **O Que Já Funciona**

1. **✅ Detecção Super Admin**: Por email configurado
2. **✅ Middleware**: Proteção de rotas platform
3. **✅ Entitlements**: Sistema duplo (super admin vs Stripe)
4. **✅ Dashboard Platform**: Página especial para você
5. **✅ APIs**: `/api/admin/platform/stats` exclusiva
6. **✅ Multi-tenant**: Clientes isolados por organização

### 🔧 **Para Produção (TODO)**

```bash
# 1. Configure seu email real
SUPER_ADMIN_EMAIL=seu-email@dominio.com

# 2. Connect database real para:
# - Buscar organizações reais
# - Entitlements do Stripe
# - Sessões persistentes

# 3. Configure Stripe webhooks para:
# - Atualizar entitlements automaticamente
# - Processar pagamentos/cancelamentos
```

---

## 🎯 **Resumo Executivo**

**ANTES (Problema):**
- Você era tratado como cliente normal
- Sistema não distinguia dono da SaaS vs pagantes
- Sem visão global da plataforma

**AGORA (Solução):**
- ✅ **Super Admin Role**: Você tem acesso total
- ✅ **Dashboard Especial**: `/admin/platform` só para você
- ✅ **Entitlements Ilimitados**: Sem restrições
- ✅ **Visão Global**: Todas organizações e usuários
- ✅ **Clientes Isolados**: Multi-tenant funcional

**PRÓXIMOS PASSOS:**
1. Deploy no Vercel
2. Configure `SUPER_ADMIN_EMAIL` no ambiente
3. Teste ambos os fluxos
4. Conecte database real para produção

🚀 **Agora você tem uma verdadeira SaaS enterprise com separação clara entre dono e clientes!**