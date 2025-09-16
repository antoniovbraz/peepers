# 📚 Documentação da API Peepers - Mercado Livre Integration

## 🎯 Visão Geral

Esta documentação detalha todos os endpoints da API da aplicação **Peepers**, uma integração completa com o **Mercado Livre** (ML) para e-commerce. A aplicação utiliza **OAuth 2.0 + PKCE** para autenticação segura e oferece funcionalidades completas de gerenciamento de produtos, cache inteligente e webhooks em tempo real.

**URL Base de Produção:** `https://peepers.vercel.app`

---

## 🔐 Autenticação e Segurança

### OAuth 2.0 + PKCE Flow
A aplicação implementa fluxo completo de autenticação OAuth 2.0 com **Proof Key for Code Exchange (PKCE)** para máxima segurança.

#### Fluxo de Autenticação:
1. **Iniciação**: `/api/auth/mercado-livre` → Redireciona para ML
2. **Callback**: `/api/auth/mercado-livre/callback` → Processa tokens
3. **Validação**: Middleware protege rotas autenticadas
4. **Refresh**: Tokens renovados automaticamente via cache

#### Sessões e Cookies
- **Sessões baseadas em cookies HTTP-only**
- **Proteção CSRF** com validação de estado
- **Middleware de autenticação** em `/src/middleware.ts`
- **Usuários autorizados** via `ALLOWED_USER_IDS`

---

## 📋 Endpoints da API

### 🟢 Endpoints Públicos (Sem Autenticação)

#### 1. Health Check
```http
GET /api/health
```

**Resposta:**
```json
{
  "message": "Este endpoint está funcionando!",
  "timestamp": "2025-09-16T19:54:31.479Z",
  "status": "success",
  "deployment": "working",
  "environment": "production",
  "analysis": {
    "problem": "Vercel Deployment Protection está bloqueando acesso aos endpoints",
    "solution": "Desabilitar Deployment Protection nas configurações do projeto",
    "confirmation": "Se você conseguir ver esta mensagem..."
  }
}
```

**Uso:** Verificar se a aplicação está funcionando corretamente.

#### 2. Produtos Públicos
```http
GET /api/products-public
```

**Parâmetros de Query:**
- `limit` (opcional): Número máximo de produtos (padrão: 50)
- `page` (opcional): Página atual (padrão: 1)

**Resposta:**
```json
{
  "success": true,
  "total": 4,
  "products": [
    {
      "id": "MLB123456789",
      "title": "Produto de Teste 1 - Camiseta Básica",
      "price": 29.9,
      "status": "active",
      "thumbnail": "https://http2.mlstatic.com/D_NQ_NP_123456-MLA12345678_012023-W.webp",
      "available_quantity": 50,
      "condition": "new",
      "currency_id": "BRL",
      "shipping": {
        "free_shipping": true
      }
    }
  ],
  "page": 1,
  "limit": 50,
  "totalPages": 1,
  "hasNext": false,
  "hasPrev": false,
  "message": "4 produtos encontrados (página 1/1)"
}
```

**Uso:** Obter lista de produtos públicos para exibição em loja.

### 🔴 Endpoints Autenticados (Requer Login)

#### 3. Produtos Autenticados
```http
GET /api/products
```

**Cabeçalhos Necessários:**
```
Authorization: Bearer <token>
Cookie: session=<session_id>
```

**Resposta (Não Autenticado):**
```json
{
  "error": "Unauthorized",
  "message": "Você precisa estar autenticado para acessar este endpoint"
}
```

**Uso:** Obter produtos completos com dados do vendedor autenticado.

#### 4. Sincronização de Produtos
```http
GET /api/sync
```

**Resposta (Não Autenticado):**
```json
{
  "redirect": "/login",
  "status": "307"
}
```

**Uso:** Sincronizar produtos do Mercado Livre com o cache local.

### 🔧 Endpoints de Debug e Desenvolvimento

#### 5. Debug de Cache
```http
GET /api/cache-debug
```

**Resposta:**
```json
{
  "success": true,
  "user_id": "669073070",
  "cache_checks": {
    "user_token_exists": false,
    "user_token_data": null,
    "cached_products_all_count": 0,
    "cached_products_active_count": 0,
    "last_sync": "2025-09-16T13:42:05.196Z"
  },
  "environment": {
    "ML_CLIENT_ID": "Set",
    "ML_CLIENT_SECRET": "Set",
    "ML_USER_ID": "Using default: ..."
  }
}
```

**Uso:** Diagnosticar estado do cache Redis e tokens.

#### 6. Debug Geral
```http
GET /api/debug
```

**Resposta:**
```json
{
  "timestamp": "2025-09-16T19:54:49.411Z",
  "environment": {
    "ML_CLIENT_ID": true,
    "ML_CLIENT_SECRET": true,
    "ADMIN_SECRET": true,
    "NODE_ENV": "production",
    "NEXTAUTH_URL": "https://peepers.vercel.app"
  },
  "cache_check": {
    "cache_available": true,
    "user_token": false,
    "token_has_refresh": false,
    "token_expires_at": null
  }
}
```

**Uso:** Informações técnicas e diagnóstico do ambiente.

### 🔐 Endpoints de Autenticação

#### 7. Iniciar Autenticação ML
```http
GET /api/auth/mercado-livre
```

**Resposta:** Redirecionamento para Mercado Livre OAuth.

#### 8. Callback de Autenticação
```http
GET /api/auth/mercado-livre/callback
```

**Parâmetros de Query:**
- `code`: Código de autorização
- `state`: Token CSRF para validação

#### 9. Verificar Autenticação
```http
GET /api/auth/me
```

**Resposta (Não Autenticado):**
```json
{
  "authenticated": false,
  "message": "No session found",
  "redirect": "/login"
}
```

#### 10. Logout
```http
POST /api/auth/logout
```

**Resposta:**
```json
{
  "success": true,
  "message": "Logout realizado com sucesso",
  "redirect": "/"
}
```

### 🔔 Endpoints de Webhook

#### 11. Webhook Mercado Livre
```http
POST /api/webhook/mercado-livre
```

**Cabeçalhos Esperados:**
```
Content-Type: application/json
X-ML-Topic: orders_v2|items|messages|shipments
```

**Resposta (GET):**
```json
{
  "message": "Webhook endpoint - use POST only",
  "endpoint": "/api/webhook/mercado-livre"
}
```

**Resposta (POST Inválido):**
```json
{
  "error": "Invalid payload schema"
}
```

**Uso:** Receber notificações em tempo real do Mercado Livre.

---

## 🏗️ Arquitetura e Tecnologias

### Frontend
- **Next.js 15** com App Router
- **React 19** com Server Components
- **TypeScript** para type safety
- **Tailwind CSS v4** para styling
- **Vitest** para testes

### Backend/API
- **Next.js API Routes**
- **Middleware** para proteção de rotas
- **Server-Side Rendering (SSR)**
- **Edge Runtime** no Vercel

### Cache e Armazenamento
- **Upstash Redis** via `@vercel/kv`
- **Singleton Pattern** para conexão
- **TTL inteligente** por tipo de dado:
  - Produtos: 7200s (2h)
  - Dados do usuário: 1800s (30min)
  - Categorias: 86400s (24h)

### Segurança
- **OAuth 2.0 + PKCE** completo
- **Cookies HTTP-only** para sessões
- **CSRF Protection** com state validation
- **Rate Limiting** do Mercado Livre
- **HTTPS obrigatório** para produção

---

## 📊 Limites e Rate Limiting

### Mercado Livre API Limits
- **1000 chamadas/hora** por app
- **5000 chamadas/dia** por usuário
- **Rate limiting automático** via cache

### Cache Strategy
- **Fallback automático** para dados públicos
- **Token refresh** transparente
- **Invalidation** inteligente por mudanças

---

## 🔄 Fluxos de Dados

### 1. Fluxo de Produtos
```
Mercado Livre API → Cache Redis → Frontend → Usuário
```

### 2. Fluxo de Autenticação
```
Usuário → /auth/ml → ML OAuth → Callback → Token Storage → Acesso Autorizado
```

### 3. Fluxo de Webhooks
```
ML Event → Webhook → Processamento → Cache Update → Frontend Update
```

---

## 🚨 Problemas Conhecidos

### Vercel Deployment Protection
**Status:** Ativo
**Impacto:** Bloqueia acesso direto aos endpoints
**Solução:** Desabilitar em Settings > Deployment Protection

### Rate Limiting
**Status:** Implementado
**Mitigação:** Cache inteligente + fallback público

---

## 🧪 Testes e Desenvolvimento

### Comandos de Teste
```bash
# Testes locais (mock)
npm run dev:mock

# Testes de produção
npm run test:prod all
npm run test:prod products-public
npm run test:prod health

# Desenvolvimento com HTTPS
npm run dev
npm run tunnel  # LocalTunnel para HTTPS
```

### Ambiente de Desenvolvimento
- **Mock Data**: Para desenvolvimento offline
- **LocalTunnel**: Para testes HTTPS locais
- **Debug Endpoints**: Múltiplos `/api/debug-*` disponíveis

---

## 📈 Monitoramento e Analytics

### Métricas Disponíveis
- **Health Checks**: Status da aplicação
- **Cache Performance**: Hit rates e latência
- **API Usage**: Chamadas por endpoint
- **Error Rates**: Taxas de erro por serviço

### Logs e Debugging
- **Console Logs**: Detalhados em desenvolvimento
- **Error Boundaries**: Captura de erros frontend
- **Middleware Logs**: Autenticação e autorização

---

## 🔗 Links Úteis

- **Documentação ML API**: https://developers.mercadolivre.com.br/
- **App Registration**: https://developers.mercadolivre.com.br/app-registration
- **Webhook Topics**: https://developers.mercadolivre.com.br/webhooks
- **Rate Limits**: https://developers.mercadolivre.com.br/rate-limits

---

## 📝 Notas de Desenvolvimento

### Estrutura de Arquivos
```
src/
├── app/
│   ├── api/           # Endpoints da API
│   ├── admin/         # Painel administrativo
│   └── produtos/      # Página de produtos
├── components/        # Componentes React
├── config/           # Configurações centralizadas
├── lib/              # Utilitários e cache
├── types/            # Definições TypeScript
└── utils/            # Funções auxiliares
```

### Padrões de Código
- **Centralized Configuration**: Todas as URLs em `/config/routes.ts`
- **Type Safety**: Interfaces completas para ML API
- **Error Handling**: Try-catch abrangente
- **Performance**: Lazy loading e cache inteligente

---

*Documentação gerada em: 16 de Setembro de 2025*
*Baseada em exploração da API via curl e análise do código fonte*</content>
<parameter name="filePath">c:\Users\anton\OneDrive\Documents\Cline\peepers\API_DOCUMENTATION.md