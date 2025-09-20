# 🏗️ Guia de Migração - Arquitetura Multi-Tenant Peepers v2.0.0

## 📋 Visão Geral das Mudanças

A implementação da arquitetura multi-tenant traz as seguintes mudanças críticas no ambiente:

### ✅ **Variáveis de Ambiente Adicionadas**

```bash
# ==================== MULTI-TENANT CONFIGURATION ====================
ENABLE_MULTI_TENANT=false                    # ⚠️ IMPORTANTE: Mantenha false inicialmente
TENANT_BASE_DOMAIN=peepers.vercel.app       # Domínio para subdomínios
DEFAULT_TENANT_SLUG=default                 # Tenant padrão (fallback)
DEFAULT_TENANT_NAME="Peepers Default"       # Nome do tenant padrão
MAX_TENANTS_PER_USER=5                      # Limite de tenants por usuário
MAX_USERS_PER_TENANT=50                     # Limite de usuários por tenant

# ==================== NOVAS VARIÁVEIS DE SEGURANÇA ====================
ML_WEBHOOK_SECRET=your_ml_webhook_secret    # Secret para webhooks do ML
ALERT_EMAIL_WEBHOOK=https://your-webhook    # Webhook para alertas
```

### 🔄 **Variáveis de Ambiente Atualizadas**

```bash
# Preços atualizados para o novo modelo estratégico
STRIPE_PRICE_STARTER_MONTHLY=price_starter_monthly     # R$ 19,90
STRIPE_PRICE_BUSINESS_MONTHLY=price_business_monthly   # R$ 34,90
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_enterprise_monthly # R$ 54,90
```

## 🚨 **Mudanças Críticas que Podem Quebrar a Aplicação**

### 1. **Modo Multi-Tenant Desabilitado por Padrão**

```bash
ENABLE_MULTI_TENANT=false  # ⚠️ NÃO ALTERE PARA true SEM PREPARAÇÃO
```

**Por que?** A arquitetura multi-tenant muda completamente como a aplicação funciona:
- Todas as rotas passam a exigir identificação de tenant
- Dados são isolados por tenant
- Autenticação passa a ser tenant-scoped
- Cache keys incluem tenant_id

### 2. **Novos Secrets Necessários**

```bash
ML_WEBHOOK_SECRET=your_secret_here          # Para validação de webhooks
ALERT_EMAIL_WEBHOOK=https://your-webhook    # Para notificações de erro
```

### 3. **Stripe Price IDs Atualizados**

Os nomes dos preços mudaram para refletir o novo modelo:
- `PROFESSIONAL` → `BUSINESS`
- Novos preços em centavos (já incluem impostos)

## 📝 **Passos para Migração Segura**

### **FASE 1: Preparação (Sem Quebrar Nada)**

```bash
# 1. Atualize o .env com as novas variáveis
cp .env.example .env.local

# 2. Mantenha ENABLE_MULTI_TENANT=false
ENABLE_MULTI_TENANT=false

# 3. Configure apenas os novos secrets
ML_WEBHOOK_SECRET=your_secret
ALERT_EMAIL_WEBHOOK=https://your-webhook

# 4. Teste a aplicação normalmente
npm run dev
```

### **FASE 2: Configuração do Stripe**

```bash
# 1. Acesse seu dashboard do Stripe
# 2. Crie os novos produtos/preços:
#    - Starter: R$ 19,90/mês
#    - Business: R$ 34,90/mês
#    - Enterprise: R$ 54,90/mês

# 3. Atualize os PRICE IDs no .env
STRIPE_PRICE_STARTER_MONTHLY=price_xxx
STRIPE_PRICE_BUSINESS_MONTHLY=price_yyy
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_zzz
```

### **FASE 3: Ativação Gradual (Opcional)**

```bash
# Só faça isso quando estiver pronto para multi-tenant
ENABLE_MULTI_TENANT=true

# Configure o domínio base
TENANT_BASE_DOMAIN=peepers.vercel.app
```

## 🔍 **Como Testar se Está Tudo Funcionando**

### **Teste Básico (Modo Compatibilidade)**

```bash
# Com ENABLE_MULTI_TENANT=false, tudo deve funcionar normalmente
curl https://peepers.vercel.app/api/health
curl https://peepers.vercel.app/api/products-public
```

### **Teste dos Novos Endpoints**

```bash
# Health check com métricas
curl https://peepers.vercel.app/api/health?detailed=true

# Métricas para monitoramento externo
curl https://peepers.vercel.app/api/metrics?format=prometheus
```

### **Teste do Stripe (Com Novos Preços)**

```bash
# Teste checkout com novos preços
curl -X POST https://peepers.vercel.app/api/stripe/checkout \
  -H "Content-Type: application/json" \
  -d '{"priceId": "price_starter_monthly", "successUrl": "...", "cancelUrl": "..."}'
```

## ⚠️ **Problemas Comuns e Soluções**

### **Erro: "Tenant not found"**

```bash
Causa: ENABLE_MULTI_TENANT=true mas sem tenant configurado
Solução: Mantenha ENABLE_MULTI_TENANT=false até implementar tenants
```

### **Erro: "Stripe price not found"**

```bash
Causa: PRICE IDs não atualizados no Stripe
Solução: Crie os produtos no Stripe dashboard e atualize os IDs
```

### **Erro: "Webhook validation failed"**

```bash
Causa: ML_WEBHOOK_SECRET não configurado
Solução: Configure o secret do Mercado Livre
```

## 📊 **Monitoramento Pós-Migração**

### **Endpoints de Monitoramento**

- `/api/health` - Status geral da aplicação
- `/api/health?detailed=true` - Métricas completas
- `/api/metrics` - Métricas para sistemas externos

### **Logs a Verificar**

```bash
# Verifique se não há erros relacionados a tenant
grep -i "tenant" logs/application.log

# Verifique funcionamento do Stripe
grep -i "stripe" logs/application.log

# Verifique webhooks do ML
grep -i "webhook" logs/application.log
```

## 🎯 **Checklist de Migração**

### **✅ Fase 1 - Preparação**

- [ ] `.env` atualizado com novas variáveis
- [ ] `ENABLE_MULTI_TENANT=false` mantido
- [ ] Secrets configurados (ML_WEBHOOK_SECRET, ALERT_EMAIL_WEBHOOK)
- [ ] Aplicação testada em modo compatibilidade

### **✅ Fase 2 - Stripe**

- [ ] Produtos criados no Stripe dashboard
- [ ] PRICE IDs atualizados no `.env`
- [ ] Checkout testado com novos preços
- [ ] Webhooks do Stripe configurados

### **✅ Fase 3 - Ativação (Quando Pronto)**

- [ ] `ENABLE_MULTI_TENANT=true` ativado
- [ ] `TENANT_BASE_DOMAIN` configurado
- [ ] Primeiro tenant criado
- [ ] Usuários migrados para tenants
- [ ] Funcionalidades testadas

## 🚀 **Próximos Passos Após Migração**

1. **Monitoramento Contínuo**: Use `/api/health` e `/api/metrics`
2. **Logs de Erro**: Configure alertas para erros críticos
3. **Performance**: Monitore SLA (500ms response time)
4. **Escalabilidade**: Configure limites por tenant
5. **Backup**: Tenha plano de backup dos dados

## 📞 **Suporte**

Se encontrar problemas durante a migração:
1. Verifique os logs da aplicação
2. Teste os endpoints de health check
3. Compare com o `.env.example` atualizado
4. Verifique a documentação em `/docs/enterprise/`

---

**📅 Data da Migração: 2025-09-20**
**Versão: Peepers Enterprise v2.0.0**
**Status: ✅ Pronto para Produção**