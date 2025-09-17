# Repository Configuration - Peepers Admin Panel

## 🔧 GitHub Repository Setup

Este documento define as configurações necessárias do repositório GitHub para implementar o fluxo de desenvolvimento profissional do painel administrativo.

**Data de Criação**: 16 de setembro de 2025  
**Versão**: 1.0.0  
**Aplicável a**: Repositório GitHub do Peepers

---

## 🛡️ Branch Protection Rules

### **Main Branch (Production)**

```json
{
  "protection": {
    "required_status_checks": {
      "strict": true,
      "checks": [
        {
          "context": "ci/type-check",
          "app_id": null
        },
        {
          "context": "ci/lint",
          "app_id": null
        },
        {
          "context": "ci/test",
          "app_id": null
        },
        {
          "context": "ci/build",
          "app_id": null
        },
        {
          "context": "vercel",
          "app_id": null
        }
      ]
    },
    "enforce_admins": true,
    "required_pull_request_reviews": {
      "required_approving_review_count": 2,
      "dismiss_stale_reviews": true,
      "require_code_owner_reviews": true,
      "require_last_push_approval": true
    },
    "restrictions": {
      "users": [],
      "teams": ["admin-team"],
      "apps": []
    },
    "allow_force_pushes": false,
    "allow_deletions": false,
    "block_creations": false,
    "required_conversation_resolution": true,
    "lock_branch": false,
    "allow_fork_syncing": true
  }
}
```

### **Develop Branch (Staging)**

```json
{
  "protection": {
    "required_status_checks": {
      "strict": true,
      "checks": [
        {
          "context": "ci/type-check",
          "app_id": null
        },
        {
          "context": "ci/lint",
          "app_id": null
        },
        {
          "context": "ci/test",
          "app_id": null
        },
        {
          "context": "ci/build",
          "app_id": null
        }
      ]
    },
    "enforce_admins": false,
    "required_pull_request_reviews": {
      "required_approving_review_count": 1,
      "dismiss_stale_reviews": true,
      "require_code_owner_reviews": false,
      "require_last_push_approval": false
    },
    "restrictions": null,
    "allow_force_pushes": false,
    "allow_deletions": false,
    "required_conversation_resolution": true
  }
}
```

---

## 📋 GitHub Actions Workflows

### **PR Quality Checks**

```yaml
# .github/workflows/pr-checks.yml
name: PR Quality Checks

on:
  pull_request:
    branches: [main, develop]
  pull_request_target:
    types: [opened, synchronize, reopened]

jobs:
  quality-checks:
    name: Quality Gates
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Type check
        run: npm run type-check
      
      - name: Lint check
        run: npm run lint
        
      - name: Run tests
        run: npm run test:ci
        env:
          NODE_ENV: test
      
      - name: Build application
        run: npm run build
        env:
          NODE_ENV: production
          SKIP_BUILD_STATIC_GENERATION: true
      
      - name: Security audit
        run: npm audit --audit-level high
        continue-on-error: true
      
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          files: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella
          fail_ci_if_error: false

  performance-check:
    name: Performance Check
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build for performance
        run: npm run build
        env:
          NODE_ENV: production
      
      - name: Lighthouse CI
        uses: treosh/lighthouse-ci-action@v10
        with:
          configPath: './lighthouserc.json'
          uploadArtifacts: true
          temporaryPublicStorage: true
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}

  security-scan:
    name: Security Scan
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
      
      - name: Upload Trivy scan results to GitHub Security tab
        uses: github/codeql-action/upload-sarif@v2
        if: always()
        with:
          sarif_file: 'trivy-results.sarif'
```

### **Deployment Workflow**

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  release:
    types: [published]

jobs:
  deploy:
    name: Deploy to Vercel
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run final tests
        run: npm run test:ci
        env:
          NODE_ENV: production
      
      - name: Build application
        run: npm run build
        env:
          NODE_ENV: production
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          github-token: ${{ secrets.GITHUB_TOKEN }}
          vercel-args: '--prod'
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
      
      - name: Run production tests
        run: npm run test:prod all
        env:
          NEXT_PUBLIC_APP_URL: https://peepers.vercel.app
        continue-on-error: true
      
      - name: Notify deployment
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#deployments'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
        if: always()

  post-deploy:
    name: Post-deployment Tasks
    runs-on: ubuntu-latest
    needs: deploy
    if: success()
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Update staging with main
        run: |
          git config --global user.name 'GitHub Actions'
          git config --global user.email 'actions@github.com'
          git checkout develop
          git merge main --no-ff -m "Sync develop with main after deployment"
          git push origin develop
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Create deployment tag
        run: |
          git tag -a "deploy-$(date +%Y%m%d-%H%M%S)" -m "Deployment $(date)"
          git push origin --tags
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### **Staging Deployment**

```yaml
# .github/workflows/staging.yml
name: Deploy to Staging

on:
  push:
    branches: [develop]
  pull_request:
    branches: [develop]
    types: [closed]

jobs:
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    if: github.event_name == 'push' || (github.event_name == 'pull_request' && github.event.action == 'closed' && github.event.pull_request.merged == true)
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
        env:
          NODE_ENV: staging
      
      - name: Deploy to Vercel (Staging)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          github-token: ${{ secrets.GITHUB_TOKEN }}
          vercel-args: '--target staging'
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
      
      - name: Run staging tests
        run: npm run test:prod all
        env:
          NEXT_PUBLIC_APP_URL: https://peepers-staging.vercel.app
        continue-on-error: true
```

---

## 📝 Issue and PR Templates

### **Pull Request Template**

```markdown
<!-- .github/pull_request_template.md -->
## 📋 Descrição

### O que foi implementado?
- [ ] Lista das principais mudanças
- [ ] Funcionalidades adicionadas
- [ ] Bugs corrigidos
- [ ] Refatorações realizadas

### Como testar?
1. Passos para reproduzir/testar
2. Cenários de teste
3. URLs relevantes
4. Credenciais de teste (se aplicável)

## 🎯 Tipo de Mudança

- [ ] 🆕 Nova feature
- [ ] 🐛 Bug fix
- [ ] 💥 Breaking change
- [ ] 📚 Documentação
- [ ] 🔧 Refatoração
- [ ] ⚡ Performance
- [ ] 🧪 Testes

## ✅ Checklist de Qualidade

### Código
- [ ] Código segue as convenções do projeto
- [ ] Testes passando (`npm test`)
- [ ] Linting ok (`npm run lint`)
- [ ] Type checking ok (`npm run type-check`)
- [ ] Build sem erros (`npm run build`)
- [ ] Performance não degradada

### Documentação
- [ ] README.md atualizado (se necessário)
- [ ] Documentação técnica atualizada
- [ ] Comentários adicionados em código complexo
- [ ] Changelog atualizado

### Testes
- [ ] Testes unitários adicionados/atualizados
- [ ] Testes de integração (se aplicável)
- [ ] Testes manuais realizados
- [ ] Cobertura de testes mantida/melhorada

### Segurança
- [ ] Não expõe informações sensíveis
- [ ] Validação de entrada implementada
- [ ] Autorização verificada
- [ ] Dependências auditadas

## 📸 Screenshots/GIFs

<!-- Adicionar imagens das mudanças visuais -->

## 🔗 Issues Relacionadas

Closes #123
Related to #124
Fixes #125

## 📊 Métricas de Performance

### Before
- Lighthouse Score: XX/100
- Bundle Size: XX KB
- First Contentful Paint: XX ms

### After
- Lighthouse Score: XX/100
- Bundle Size: XX KB
- First Contentful Paint: XX ms

## 🧪 Plano de Teste

### Casos de Teste
1. **Caso 1**: Descrição do teste
   - **Entrada**: Dados de entrada
   - **Esperado**: Resultado esperado
   - **Status**: ✅ Passou / ❌ Falhou

2. **Caso 2**: Descrição do teste
   - **Entrada**: Dados de entrada
   - **Esperado**: Resultado esperado
   - **Status**: ✅ Passou / ❌ Falhou

### Testes de Regressão
- [ ] Login/logout funcionando
- [ ] Navegação entre páginas
- [ ] Funcionalidades críticas não quebradas

## 🚀 Deploy Checklist

- [ ] Variáveis de ambiente configuradas
- [ ] Migrations executadas (se aplicável)
- [ ] Cache invalidado (se necessário)
- [ ] Rollback plan definido
- [ ] Monitoring configurado

## 👥 Revisores Sugeridos

@antoniovbraz - Arquitetura geral
@reviewer2 - Frontend/UI
@reviewer3 - Backend/API

## 📝 Notas Adicionais

<!-- Qualquer informação adicional relevante -->
```

### **Bug Report Template**

```markdown
<!-- .github/ISSUE_TEMPLATE/bug_report.md -->
---
name: Bug Report
about: Relatar um bug encontrado
title: '[BUG] '
labels: bug, needs-triage
assignees: ''
---

## 🐛 Descrição do Bug

Uma descrição clara e concisa do bug encontrado.

## 🔄 Passos para Reproduzir

1. Vá para '...'
2. Clique em '...'
3. Role até '...'
4. Veja o erro

## ✅ Comportamento Esperado

Uma descrição clara do que deveria acontecer.

## ❌ Comportamento Atual

Uma descrição clara do que está acontecendo.

## 📸 Screenshots

Se aplicável, adicione screenshots para ajudar a explicar o problema.

## 🖥️ Ambiente

- **SO**: [Windows/Mac/Linux]
- **Browser**: [Chrome, Firefox, Safari]
- **Versão do Browser**: [ex: 22]
- **Dispositivo**: [Desktop/Mobile]
- **Resolução**: [ex: 1920x1080]

## 📱 Informações Adicionais

### Console Errors
```javascript
// Cole aqui os erros do console
```

### Network Errors
- Status: 500
- Endpoint: /api/products
- Response: { error: "..." }

## 🔧 Tentativas de Solução

Descreva o que você já tentou para resolver o problema.

## 📊 Impacto

- [ ] Bloqueia funcionalidade crítica
- [ ] Afeta experiência do usuário
- [ ] Problema cosmético
- [ ] Problema de performance

## 🏷️ Labels Sugeridas

- [ ] critical
- [ ] high-priority
- [ ] frontend
- [ ] backend
- [ ] api
- [ ] ui/ux
```

### **Feature Request Template**

```markdown
<!-- .github/ISSUE_TEMPLATE/feature_request.md -->
---
name: Feature Request
about: Sugerir uma nova funcionalidade
title: '[FEATURE] '
labels: enhancement, needs-triage
assignees: ''
---

## 🚀 Resumo da Feature

Uma descrição clara e concisa da feature solicitada.

## 💡 Motivação

**O problema que esta feature resolve:**
Descreva qual problema ou necessidade esta feature atenderia.

**Porque esta feature é importante:**
Explique o valor que ela traria para os usuários.

## 📋 Descrição Detalhada

### Funcionalidade Desejada

Uma descrição detalhada de como a feature deveria funcionar.

### Casos de Uso

1. **Como vendedor**, eu quero [ação] para [benefício]
2. **Como administrador**, eu quero [ação] para [benefício]
3. **Como cliente**, eu quero [ação] para [benefício]

## 🎨 Mockups/Design

<!-- Adicionar imagens, wireframes ou descrições visuais -->

## 🔧 Critérios de Aceitação

- [ ] Critério 1: Descrição específica
- [ ] Critério 2: Descrição específica
- [ ] Critério 3: Descrição específica

## 🧪 Cenários de Teste

### Cenário 1: [Nome do cenário]
**Dado** que [contexto]
**Quando** [ação]
**Então** [resultado esperado]

### Cenário 2: [Nome do cenário]
**Dado** que [contexto]
**Quando** [ação]
**Então** [resultado esperado]

## 📊 Métricas de Sucesso

Como saberemos que esta feature está funcionando bem?

- Métrica 1: [ex: Tempo de carregamento < 2s]
- Métrica 2: [ex: Taxa de conversão > 5%]
- Métrica 3: [ex: Satisfação do usuário > 4.5/5]

## 🔗 Dependências

- [ ] Dependência 1: Descrição
- [ ] Dependência 2: Descrição
- [ ] API do Mercado Livre: [endpoint específico]

## 📅 Urgência

- [ ] Crítica (precisa ser feita agora)
- [ ] Alta (próximas 2 semanas)
- [ ] Média (próximo mês)
- [ ] Baixa (quando possível)

## 💭 Alternativas Consideradas

Descreva outras soluções que você considerou e por que esta é a melhor.

## 📝 Contexto Adicional

Qualquer outra informação relevante sobre a feature.
```

---

## 🏷️ Labels Configuration

### **Priority Labels**

```yaml
# .github/labels.yml
- name: "priority: critical"
  color: "d73a4a"
  description: "Critical priority - needs immediate attention"

- name: "priority: high"
  color: "ff6b6b"
  description: "High priority - should be addressed soon"

- name: "priority: medium"
  color: "ffa726"
  description: "Medium priority - normal timeline"

- name: "priority: low"
  color: "4caf50"
  description: "Low priority - can be addressed later"
```

### **Type Labels**

```yaml
- name: "type: bug"
  color: "d73a4a"
  description: "Something isn't working"

- name: "type: feature"
  color: "0052cc"
  description: "New feature or request"

- name: "type: enhancement"
  color: "0e8a16"
  description: "Improvement to existing feature"

- name: "type: documentation"
  color: "0075ca"
  description: "Documentation updates"

- name: "type: refactor"
  color: "5319e7"
  description: "Code refactoring"

- name: "type: test"
  color: "1d76db"
  description: "Adding or updating tests"
```

### **Component Labels**

```yaml
- name: "component: frontend"
  color: "006b75"
  description: "Frontend/UI related"

- name: "component: backend"
  color: "0d1117"
  description: "Backend/API related"

- name: "component: admin-panel"
  color: "8b5cf6"
  description: "Admin panel specific"

- name: "component: auth"
  color: "7c3aed"
  description: "Authentication related"

- name: "component: ml-integration"
  color: "fde047"
  description: "Mercado Livre integration"

- name: "component: cache"
  color: "06b6d4"
  description: "Caching related"

- name: "component: deployment"
  color: "059669"
  description: "Deployment and infrastructure"
```

---

## ⚙️ Repository Settings

### **General Settings**

```json
{
  "name": "peepers",
  "description": "Modern Next.js e-commerce admin panel for Mercado Livre integration",
  "private": false,
  "has_issues": true,
  "has_projects": true,
  "has_wiki": false,
  "has_downloads": true,
  "has_pages": false,
  "allow_squash_merge": true,
  "allow_merge_commit": false,
  "allow_rebase_merge": true,
  "allow_auto_merge": true,
  "delete_branch_on_merge": true,
  "allow_update_branch": true,
  "default_branch": "main"
}
```

### **Collaborators & Teams**

```json
{
  "teams": {
    "admin-team": {
      "permission": "admin",
      "members": ["antoniovbraz"]
    },
    "developers": {
      "permission": "push",
      "members": []
    },
    "reviewers": {
      "permission": "triage",
      "members": []
    }
  }
}
```

### **Webhooks Configuration**

```json
{
  "webhooks": [
    {
      "name": "vercel-deployment",
      "config": {
        "url": "https://api.vercel.com/v1/integrations/deploy-hooks/[HOOK_ID]",
        "content_type": "json"
      },
      "events": ["push", "pull_request"],
      "active": true
    },
    {
      "name": "slack-notifications",
      "config": {
        "url": "https://hooks.slack.com/services/[WEBHOOK_URL]",
        "content_type": "json"
      },
      "events": ["push", "pull_request", "issues", "release"],
      "active": true
    }
  ]
}
```

---

## 🔐 Secrets Configuration

### **Required Secrets**

```bash
# Production Environment
VERCEL_TOKEN=                    # Vercel deployment token
ORG_ID=                         # Vercel organization ID
PROJECT_ID=                     # Vercel project ID

# External Services
CODECOV_TOKEN=                  # Code coverage reporting
LHCI_GITHUB_APP_TOKEN=         # Lighthouse CI
SLACK_WEBHOOK=                 # Slack notifications

# Application Secrets (Vercel Environment Variables)
ML_CLIENT_ID=                  # Mercado Livre client ID
ML_CLIENT_SECRET=              # Mercado Livre client secret
UPSTASH_REDIS_REST_URL=        # Redis cache URL
UPSTASH_REDIS_REST_TOKEN=      # Redis cache token
NEXT_PUBLIC_APP_URL=           # Application URL
ALLOWED_USER_IDS=              # Authorized user IDs
```

### **Environment Variables per Branch**

```yaml
# Production (main branch)
production:
  NEXT_PUBLIC_APP_URL: "https://peepers.vercel.app"
  NODE_ENV: "production"
  
# Staging (develop branch)
preview:
  NEXT_PUBLIC_APP_URL: "https://peepers-staging.vercel.app"
  NODE_ENV: "staging"
  
# Development (feature branches)
development:
  NEXT_PUBLIC_APP_URL: "https://peepers-dev.vercel.app"
  NODE_ENV: "development"
```

---

## 📊 Project Management

### **GitHub Projects Configuration**

```json
{
  "projects": [
    {
      "name": "Admin Panel v2.0",
      "description": "Complete admin panel redesign and implementation",
      "columns": [
        {
          "name": "📋 Backlog",
          "purpose": "New issues and feature requests"
        },
        {
          "name": "📝 Ready for Development",
          "purpose": "Issues ready to be worked on"
        },
        {
          "name": "🚧 In Progress",
          "purpose": "Currently being worked on"
        },
        {
          "name": "👀 In Review",
          "purpose": "Pull requests under review"
        },
        {
          "name": "🧪 Testing",
          "purpose": "Features being tested"
        },
        {
          "name": "✅ Done",
          "purpose": "Completed and deployed"
        }
      ]
    }
  ]
}
```

### **Milestones**

```json
{
  "milestones": [
    {
      "title": "Phase 1: Foundation",
      "description": "Documentation, design system, and basic structure",
      "due_date": "2025-09-30",
      "state": "open"
    },
    {
      "title": "Phase 2: Dashboard",
      "description": "Admin dashboard with KPIs and charts",
      "due_date": "2025-10-15",
      "state": "open"
    },
    {
      "title": "Phase 3: Products Management",
      "description": "Complete products CRUD interface",
      "due_date": "2025-10-31",
      "state": "open"
    },
    {
      "title": "Phase 4: Sales Management",
      "description": "Orders, payments, and shipping management",
      "due_date": "2025-11-15",
      "state": "open"
    },
    {
      "title": "Phase 5: Analytics & Communication",
      "description": "Advanced metrics and communication center",
      "due_date": "2025-11-30",
      "state": "open"
    },
    {
      "title": "Phase 6: Final Polish",
      "description": "Settings, optimization, and cleanup",
      "due_date": "2025-12-15",
      "state": "open"
    }
  ]
}
```

---

**Última Atualização**: 16 de setembro de 2025  
**Versão**: 1.0.0  
**Autor**: GitHub Copilot  
**Aprovado por**: [A definir]