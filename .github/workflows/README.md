# 🚀 GitHub Actions Setup Guide

Este guia explica como configurar os GitHub Actions para deploy automático e testes da aplicação Peepers.

## 📋 Pré-requisitos

1. **Repositório no GitHub** - O código deve estar em `github.com/antoniovbraz/peepers`
2. **Conta Vercel** - Para deploy automático
3. **Conta Slack** (opcional) - Para notificações

## 🔐 Configuração de Secrets

### No GitHub Repository:
Vá para **Settings → Secrets and variables → Actions** e adicione estes secrets:

#### Vercel Secrets (Obrigatórios):
```
VERCEL_TOKEN          # Token de API do Vercel
VERCEL_ORG_ID         # ID da organização no Vercel
VERCEL_PROJECT_ID     # ID do projeto Peepers no Vercel
```

#### Mercado Livre Secrets (Para testes reais):
```
ML_CLIENT_ID          # Client ID da aplicação ML
ML_CLIENT_SECRET      # Client Secret da aplicação ML
```

#### Redis/Cache Secrets:
```
UPSTASH_REDIS_REST_URL    # URL do Redis Upstash
UPSTASH_REDIS_REST_TOKEN  # Token do Redis Upstash
```

#### Slack Notifications (Opcional):
```
SLACK_WEBHOOK_URL     # Webhook URL do Slack para notificações
```

## 🔧 Como obter os Secrets

### Vercel Tokens:
1. Vá para [Vercel Dashboard](https://vercel.com/dashboard)
2. **Settings → Tokens**
3. Crie um novo token
4. Copie o token gerado

### Vercel Org/Project IDs:
```bash
# Instale Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Get project info
vercel project ls
```

### Mercado Livre:
1. Vá para [Mercado Livre Developers](https://developers.mercadolivre.com.br/)
2. Acesse sua aplicação
3. Copie **Client ID** e **Client Secret**

### Redis Upstash:
1. Vá para [Upstash Console](https://console.upstash.com/)
2. Acesse seu banco Redis
3. Copie **REST URL** e **REST Token**

### Slack Webhook:
1. Vá para [Slack Apps](https://api.slack.com/apps)
2. Crie um novo app
3. Adicione **Incoming Webhooks**
4. Copie a **Webhook URL**

## 📊 Workflows Criados

### 1. 🚀 Deploy (`deploy.yml`)
- **Quando roda**: Push para `main`/`master` ou Pull Request
- **O que faz**:
  - ✅ Executa testes
  - ✅ Faz linting
  - ✅ Build da aplicação
  - ✅ Deploy no Vercel (só em `main`/`master`)
  - ✅ Testa se deploy funcionou
  - 📢 Notifica no Slack (se configurado)

### 2. 🧪 API Tests (`api-tests.yml`)
- **Quando roda**: Push, PR, ou diariamente às 6 AM UTC
- **O que faz**:
  - ✅ Testa endpoint `/api/health`
  - ✅ Testa API de produtos públicos
  - ✅ Testa métricas do dashboard admin
  - ✅ Testa debug de cache
  - 🔒 Verifica segurança e vulnerabilidades

### 3. 🤖 ML Integration (`ml-integration.yml`)
- **Quando roda**: Push, PR, ou manualmente
- **O que faz**:
  - ✅ Testa integração ML (dados mock)
  - ✅ Testa estatísticas de produtos
  - 🔴 Testa ML API real (opcional, com secrets)
  - 📊 Testa rate limiting
  - 🧹 Limpa dados de teste

### 4. 🎨 Code Quality (`quality.yml`)
- **Quando roda**: Push ou PR
- **O que faz**:
  - ✅ Executa ESLint
  - ✅ Verifica tipos TypeScript
  - ✅ Checa formatação de código
  - 🔒 Audit de segurança
  - 📦 Análise de tamanho do bundle

## 🚦 Status dos Workflows

Para ver o status dos workflows:
1. Vá para a aba **Actions** do repositório
2. Clique no workflow desejado
3. Veja os logs detalhados de cada step

## 🐛 Troubleshooting

### Workflow falhando?
1. **Verifique os secrets** - Todos os secrets obrigatórios estão configurados?
2. **Logs detalhados** - Clique no job que falhou para ver os logs
3. **Teste local** - Rode os comandos localmente primeiro

### Deploy não funciona?
1. **Vercel token válido** - O token ainda é válido?
2. **Projeto vinculado** - O projeto está corretamente vinculado no Vercel?
3. **Branch correto** - O push foi feito para `main` ou `master`?

### Testes falhando?
1. **Dependências** - Rode `npm ci` localmente
2. **Variáveis de ambiente** - Arquivo `.env` configurado?
3. **Banco de dados** - Redis/Upstash funcionando?

## 📞 Suporte

Se tiver problemas:
1. Verifique os logs do GitHub Actions
2. Teste os comandos localmente
3. Abra uma issue no repositório

## 🎯 Próximos Passos

Após configurar os workflows:
1. ✅ Faça um push para testar
2. ✅ Monitore os workflows na aba Actions
3. ✅ Configure notificações no Slack
4. ✅ Ajuste conforme necessário

---

**🎉 Com GitHub Actions configurado, todo push para `main` fará deploy automático!**