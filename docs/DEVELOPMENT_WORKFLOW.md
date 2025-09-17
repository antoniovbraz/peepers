# Development Workflow - Peepers Admin Panel

## 🚀 Fluxo de Desenvolvimento Profissional

Este documento define o fluxo de desenvolvimento profissional para implementação do novo painel administrativo do Peepers, seguindo as melhores práticas de Git flow e desenvolvimento colaborativo.

**Data de Criação**: 16 de setembro de 2025  
**Versão**: 1.0.0  
**Aplicável a**: Painel Administrativo v2.0.0  

---

## 🌳 Estratégia de Branches

### **Branch Strategy: GitHub Flow + Feature Branches**

```
main (production)
├── develop (staging/integration)
├── feature/admin-dashboard
├── feature/products-management
├── feature/sales-management
├── feature/metrics-analytics
├── feature/communication-center
├── feature/settings-admin
├── hotfix/critical-bug-fix
└── release/v2.0.0
```

### **Tipos de Branches**

#### **🔒 Protected Branches**
- **`main`**: Produção - SEMPRE estável
  - ✅ Require PR reviews (2+ approvals)
  - ✅ Require status checks
  - ✅ Require up-to-date branches
  - ✅ Include administrators
  - ❌ Direct pushes (NUNCA)

- **`develop`**: Staging/Integration
  - ✅ Require PR reviews (1+ approval)
  - ✅ Require status checks
  - ✅ Auto-deploy to staging
  - ❌ Direct pushes

#### **🚀 Working Branches**
- **`feature/*`**: Novas funcionalidades
- **`bugfix/*`**: Correções de bugs
- **`hotfix/*`**: Correções críticas
- **`release/*`**: Preparação de releases
- **`docs/*`**: Atualizações de documentação
- **`refactor/*`**: Refatorações de código

---

## 📋 Convenções de Nomenclatura

### **Branch Names**
```bash
# Features
feature/admin-dashboard-implementation
feature/products-crud-interface
feature/sales-orders-management
feature/metrics-charts-integration

# Bug fixes
bugfix/product-image-upload-error
bugfix/orders-pagination-issue

# Hotfixes
hotfix/critical-auth-vulnerability
hotfix/payment-status-sync

# Releases
release/v2.0.0-beta
release/v2.1.0

# Documentation
docs/admin-panel-specifications
docs/api-documentation-update
```

### **Commit Messages (Conventional Commits)**
```bash
# Format: type(scope): description
feat(dashboard): add real-time KPI cards
fix(products): resolve image upload validation
docs(api): update endpoint documentation
refactor(auth): improve OAuth token handling
test(orders): add unit tests for order management
perf(cache): optimize Redis cache strategy
ci(github): add automated testing workflow
```

### **PR Titles**
```bash
[FEATURE] Admin Dashboard - Real-time KPIs Implementation
[BUGFIX] Products - Fix image upload validation error
[DOCS] Update API documentation with new endpoints
[REFACTOR] Improve authentication token management
[HOTFIX] Critical security vulnerability in OAuth flow
```

---

## 🔄 Workflow de Desenvolvimento

### **1. Setup Inicial**
```bash
# Clone e setup do repositório
git clone https://github.com/antoniovbraz/peepers.git
cd peepers
npm install

# Configurar remote upstream (se fork)
git remote add upstream https://github.com/antoniovbraz/peepers.git

# Verificar branches existentes
git branch -a
```

### **2. Criação de Feature Branch**
```bash
# Atualizar develop com latest changes
git checkout develop
git pull origin develop

# Criar nova feature branch
git checkout -b feature/admin-dashboard-implementation

# Primeira push da branch
git push -u origin feature/admin-dashboard-implementation
```

### **3. Desenvolvimento e Commits**
```bash
# Desenvolvimento iterativo com commits frequentes
git add .
git commit -m "feat(dashboard): add KPI cards component structure"

git add .
git commit -m "feat(dashboard): implement real-time data fetching"

git add .
git commit -m "test(dashboard): add unit tests for KPI components"

# Push regular para backup
git push origin feature/admin-dashboard-implementation
```

### **4. Sync com Develop**
```bash
# Antes de abrir PR, sync com develop
git checkout develop
git pull origin develop

git checkout feature/admin-dashboard-implementation
git rebase develop

# Resolver conflitos se necessário
# git add . && git rebase --continue

# Force push após rebase (apenas em feature branches)
git push --force-with-lease origin feature/admin-dashboard-implementation
```

### **5. Pull Request Creation**

#### **Template de PR**
```markdown
## 📋 Descrição

### O que foi implementado?
- [ ] Componente KPI Cards com métricas em tempo real
- [ ] Integração com Redis cache para performance
- [ ] Testes unitários com 90%+ coverage
- [ ] Documentação de componentes

### Como testar?
1. `npm run dev`
2. Navegar para `/admin`
3. Verificar carregamento dos KPIs
4. Testar refresh automático (30s)

## 🎯 Tipo de Mudança
- [x] Nova feature
- [ ] Bug fix
- [ ] Breaking change
- [ ] Documentação

## ✅ Checklist
- [x] Código segue as convenções do projeto
- [x] Testes passando (`npm test`)
- [x] Linting ok (`npm run lint`)
- [x] Build sem erros (`npm run build`)
- [x] Documentação atualizada
- [x] Screenshots/GIFs anexados (se UI)

## 📸 Screenshots
[Anexar imagens da nova funcionalidade]

## 🔗 Issues Relacionadas
Closes #123
Related to #124
```

---

## 🧪 Quality Gates

### **Checks Obrigatórios (CI/CD)**
```yaml
# .github/workflows/pr-checks.yml
name: PR Quality Checks
on: [pull_request]

jobs:
  quality-gates:
    runs-on: ubuntu-latest
    steps:
      - name: Type Check
        run: npm run type-check
        
      - name: Lint
        run: npm run lint
        
      - name: Unit Tests
        run: npm run test:ci
        
      - name: E2E Tests (if UI changes)
        run: npm run test:e2e
        
      - name: Build
        run: npm run build
        
      - name: Security Audit
        run: npm audit --audit-level high
        
      - name: Performance Budget
        run: npm run test:lighthouse
```

### **Review Requirements**
- ✅ **Code Review**: 2+ approvals para `main`, 1+ para `develop`
- ✅ **Automated Tests**: Todos os tests passando
- ✅ **Manual Testing**: QA checklist completo
- ✅ **Documentation**: Docs atualizadas se necessário
- ✅ **Performance**: Sem degradação significativa
- ✅ **Security**: Scan de segurança ok

---

## 📦 Release Process

### **1. Preparação de Release**
```bash
# Criar release branch
git checkout develop
git pull origin develop
git checkout -b release/v2.0.0

# Bump version
npm version 2.0.0 --no-git-tag-version

# Update changelog
# Commit changes
git add .
git commit -m "chore(release): prepare v2.0.0"

# Push release branch
git push -u origin release/v2.0.0
```

### **2. Release Testing**
- ✅ Deploy em staging environment
- ✅ Full regression testing
- ✅ Performance testing
- ✅ Security scanning
- ✅ User acceptance testing

### **3. Merge to Main**
```bash
# Após aprovação, merge para main
# Criar PR: release/v2.0.0 → main
# Após merge, criar tag
git checkout main
git pull origin main
git tag -a v2.0.0 -m "Release v2.0.0: Admin Panel Implementation"
git push origin v2.0.0

# Merge back to develop
git checkout develop
git merge main
git push origin develop
```

---

## 🔧 Configurações de Ambiente

### **Variáveis de Ambiente por Branch**
```bash
# .env.development (feature branches)
NEXT_PUBLIC_APP_URL=http://localhost:3000
ML_CLIENT_ID=dev_client_id
NODE_ENV=development

# .env.staging (develop branch)
NEXT_PUBLIC_APP_URL=https://peepers-staging.vercel.app
ML_CLIENT_ID=staging_client_id
NODE_ENV=staging

# .env.production (main branch)
NEXT_PUBLIC_APP_URL=https://peepers.vercel.app
ML_CLIENT_ID=prod_client_id
NODE_ENV=production
```

### **Deploy Automático**
```yaml
# Vercel deployments
branches:
  main: 
    -> peepers.vercel.app (production)
  develop: 
    -> peepers-staging.vercel.app (staging)
  feature/*: 
    -> peepers-preview-[branch].vercel.app (preview)
```

---

## 📅 Plano de Implementação por PRs

### **Phase 1: Foundation (Sprints 1-2)**

#### **PR #1: Project Setup & Documentation**
```bash
Branch: docs/admin-panel-documentation
Files:
  - docs/ADMIN_PANEL_SPECS.md
  - docs/DEVELOPMENT_WORKFLOW.md
  - docs/ARCHITECTURE.md (update)
  - README.md (update)
```

#### **PR #2: Design System Foundation**
```bash
Branch: feature/design-system-foundation
Files:
  - src/components/ui/ (base components)
  - src/styles/globals.css (design tokens)
  - tailwind.config.ts (theme config)
  - src/lib/design-system.ts
```

#### **PR #3: Navigation & Layout Structure**
```bash
Branch: feature/admin-layout-navigation
Files:
  - src/components/admin/Layout.tsx
  - src/components/admin/Sidebar.tsx
  - src/components/admin/Header.tsx
  - src/app/admin/layout.tsx
```

### **Phase 2: Dashboard (Sprint 3)**

#### **PR #4: Dashboard KPI Cards**
```bash
Branch: feature/dashboard-kpi-cards
Files:
  - src/components/admin/dashboard/KPICard.tsx
  - src/components/admin/dashboard/MetricsGrid.tsx
  - src/app/admin/dashboard/page.tsx
  - src/lib/api/dashboard-metrics.ts
```

#### **PR #5: Dashboard Charts & Analytics**
```bash
Branch: feature/dashboard-charts
Files:
  - src/components/admin/dashboard/SalesChart.tsx
  - src/components/admin/dashboard/VisitsChart.tsx
  - src/lib/charts/ (chart utilities)
  - package.json (chart libraries)
```

### **Phase 3: Products Management (Sprint 4-5)**

#### **PR #6: Products List & Filters**
```bash
Branch: feature/products-list-management
Files:
  - src/app/admin/produtos/page.tsx
  - src/components/admin/products/ProductsList.tsx
  - src/components/admin/products/ProductFilters.tsx
  - src/lib/api/products-management.ts
```

#### **PR #7: Product CRUD Operations**
```bash
Branch: feature/products-crud
Files:
  - src/app/admin/produtos/criar/page.tsx
  - src/app/admin/produtos/[id]/editar/page.tsx
  - src/components/admin/products/ProductForm.tsx
  - src/components/admin/products/ProductWizard.tsx
```

### **Phase 4: Sales Management (Sprint 6-7)**

#### **PR #8: Orders Management**
```bash
Branch: feature/sales-orders-management
Files:
  - src/app/admin/vendas/pedidos/page.tsx
  - src/components/admin/sales/OrdersList.tsx
  - src/components/admin/sales/OrderDetails.tsx
  - src/lib/api/orders-management.ts
```

#### **PR #9: Payments & Shipping**
```bash
Branch: feature/payments-shipping
Files:
  - src/app/admin/vendas/pagamentos/page.tsx
  - src/app/admin/vendas/envios/page.tsx
  - src/components/admin/sales/PaymentsList.tsx
  - src/components/admin/sales/ShippingTracker.tsx
```

### **Phase 5: Metrics & Analytics (Sprint 8-9)**

#### **PR #10: Advanced Analytics**
```bash
Branch: feature/metrics-analytics
Files:
  - src/app/admin/metricas/page.tsx
  - src/components/admin/metrics/PerformanceCharts.tsx
  - src/components/admin/metrics/ReputationDashboard.tsx
  - src/lib/api/analytics.ts
```

### **Phase 6: Communication (Sprint 10-11)**

#### **PR #11: Messages & Q&A Management**
```bash
Branch: feature/communication-center
Files:
  - src/app/admin/comunicacao/page.tsx
  - src/components/admin/communication/MessagesList.tsx
  - src/components/admin/communication/QAManager.tsx
  - src/lib/api/communication.ts
```

### **Phase 7: Settings & Admin Tools (Sprint 12)**

#### **PR #12: Admin Configuration**
```bash
Branch: feature/admin-settings
Files:
  - src/app/admin/configuracoes/page.tsx
  - src/components/admin/settings/GeneralSettings.tsx
  - src/components/admin/settings/ApiStatus.tsx
  - src/lib/api/admin-tools.ts
```

#### **PR #13: Legacy Cleanup**
```bash
Branch: refactor/remove-legacy-admin
Files:
  - src/app/admin/page.tsx (refactor)
  - Remove: old admin components
  - Update: navigation and routing
```

---

## 🎯 Definition of Done

### **Para cada PR:**
- [ ] ✅ Código revisado e aprovado
- [ ] ✅ Todos os testes passando (unit + integration)
- [ ] ✅ Linting e type checking ok
- [ ] ✅ Build sem erros
- [ ] ✅ Manual testing completo
- [ ] ✅ Documentação atualizada
- [ ] ✅ Performance verificada
- [ ] ✅ Acessibilidade validada
- [ ] ✅ Screenshots/demo anexados
- [ ] ✅ Deploy preview testado

### **Para cada Release:**
- [ ] ✅ Full regression testing
- [ ] ✅ Performance benchmarks
- [ ] ✅ Security audit
- [ ] ✅ Database migrations (se aplicável)
- [ ] ✅ Changelog atualizado
- [ ] ✅ Versioning correto
- [ ] ✅ Rollback plan definido
- [ ] ✅ Monitoring configurado

---

## 🚨 Emergency Procedures

### **Hotfix Workflow**
```bash
# Para correções críticas em produção
git checkout main
git pull origin main
git checkout -b hotfix/critical-security-fix

# Fazer correção mínima necessária
# Testar localmente
npm test
npm run build

# Commit e push
git add .
git commit -m "hotfix(security): fix critical OAuth vulnerability"
git push -u origin hotfix/critical-security-fix

# Criar PR emergencial para main
# Após merge, tag imediata
git tag -a v2.0.1 -m "Hotfix v2.0.1: Security fix"
git push origin v2.0.1

# Merge back para develop
git checkout develop
git merge main
git push origin develop
```

### **Rollback Procedures**
```bash
# Se problema em produção
# 1. Rollback via Vercel dashboard
# 2. Ou revert do commit problemático
git revert <commit-hash>
git push origin main

# 3. Investigar e preparar fix
```

---

## 📊 Métricas de Qualidade

### **KPIs do Processo**
- **Lead Time**: Tempo médio de feature (branch → production)
- **Cycle Time**: Tempo médio de PR (abertura → merge)
- **Deployment Frequency**: Frequência de deploys
- **Mean Time to Recovery**: Tempo médio de recuperação
- **Change Failure Rate**: Taxa de falha de mudanças

### **Quality Metrics**
- **Test Coverage**: > 80%
- **Code Review Coverage**: 100%
- **Build Success Rate**: > 95%
- **Security Scan**: 0 high/critical vulnerabilities
- **Performance Budget**: No regression > 10%

---

**Última Atualização**: 16 de setembro de 2025  
**Versão do Documento**: 1.0.0  
**Autor**: GitHub Copilot  
**Aprovado por**: [A definir]