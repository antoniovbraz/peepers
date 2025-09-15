# Peepers - Mercado Livre Integration

## ⚠️ REQUISITOS CRÍTICOS PARA FUNCIONAMENTO

### 🔒 HTTPS é OBRIGATÓRIO

**O Mercado Livre EXIGE HTTPS para TODAS as operações:**

- ✅ **URLs de redirecionamento OAuth** - Devem usar HTTPS
- ✅ **URLs de webhook/notificações** - Devem usar HTTPS
- ✅ **Todas as chamadas API** - Devem usar HTTPS
- ❌ **HTTP local** - NÃO funciona para produção

### 🌐 Configuração da Aplicação no Mercado Livre

**Antes de qualquer desenvolvimento, você DEVE:**

1. **Criar aplicação no DevCenter:**
   - Acesse: https://developers.mercadolivre.com.br/
   - Crie apenas 1 aplicação por conta
   - Use conta do proprietário (não operador)

2. **Configurar URLs HTTPS:**

   ```text
   Redirect URI: https://seudominio.com/api/auth/mercado-livre/callback
   Webhook URL: https://seudominio.com/api/webhook/mercado-livre
   ```

3. **Habilitar PKCE:**
   - ✅ Recomendado para segurança
   - Evita ataques CSRF e injeção de código

4. **Configurar escopos:**
   - Leitura: para consultar dados
   - Escrita: para modificar dados

### 🚫 O QUE NÃO PODE FAZER

**Erros comuns que quebram a integração:**

- ❌ Usar HTTP em produção
- ❌ URLs de redirecionamento com parâmetros variáveis
- ❌ Usuários operadores (apenas administradores)
- ❌ Compartilhar Client Secret
- ❌ Fazer chamadas sem HTTPS
- ❌ Usar redirect_uri diferente do configurado
- ❌ Não validar PKCE quando habilitado

### ✅ O QUE PODE FAZER

**Desenvolvimento local com HTTPS:**

1. **Usar túnel HTTPS:**

   ```bash
   npm install -g localtunnel
   npm run tunnel  # Cria https://xxxxx.loca.lt
   ```

2. **Configurar ambiente:**

   ```bash
   NEXT_PUBLIC_APP_URL=https://xxxxx.loca.lt
   ```

3. **Testar OAuth:**
   - Use a URL HTTPS do túnel
   - Configure no Mercado Livre temporariamente
   - Teste o fluxo completo

### 🔄 Fluxo OAuth 2.0 + PKCE

```text
1. Usuário clica "Login" → Redirecionamento HTTPS
2. Mercado Livre autentica → Autorização concedida
3. Callback HTTPS → Recebe code
4. Troca code por token → Armazenamento seguro
5. API calls com Bearer token
```

### 🔔 Notificações (Webhooks)

**Requisitos para webhooks:**

- ✅ URL HTTPS pública
- ✅ Resposta HTTP 200 em até 5 segundos
- ✅ Processamento assíncrono para operações longas
- ✅ Validação do tópico e resource_id

**Tópicos disponíveis:**

- `orders_v2` - Pedidos
- `items` - Produtos
- `messages` - Mensagens
- `shipments` - Envios

### 🛡️ Segurança e Limitações

**Rate Limits:**

- 1000 chamadas/hora por aplicação
- 5000 chamadas/dia por usuário
- Respeite os limites para evitar bloqueio

**Tokens:**

- Expiração: 6 meses (renovação automática)
- Renovação: Use refresh_token
- Revogação: Possível pelo usuário

**Usuários:**

- ✅ Apenas administradores podem autorizar
- ❌ Operadores recebem erro `invalid_operator_user_id`
- ✅ Uma aplicação por conta proprietária

### 🧪 Testes em Produção

### ✅ Teste Rápido de Todos os Endpoints

```bash
# Testar todos os endpoints automaticamente
npm run test:prod all

# Testar endpoint específico
npm run test:prod products-public  # Produtos públicos
npm run test:prod health           # Health check
npm run test:prod products         # Produtos autenticados
npm run test:prod auth-me          # Status de autenticação
```

### 📊 Status Atual dos Endpoints

| Endpoint | Status | Descrição |
|----------|--------|-----------|
| `/api/health` | ✅ OK | Health check funcionando |
| `/api/products-public` | ✅ OK | 50 produtos retornados |
| `/api/products` | ✅ OK | Proteção de autenticação ativa |
| `/api/auth/me` | ✅ OK | Redirecionamento correto |

### 🔍 Teste Manual com cURL

```bash
# Produtos públicos (sempre funciona)
curl -X GET https://peepers.vercel.app/api/products-public

# Health check
curl -X GET https://peepers.vercel.app/api/health

# Produtos autenticados (requer login)
curl -X GET https://peepers.vercel.app/api/products
```

### 📈 Monitoramento em Produção

- ✅ **50 produtos** sendo exibidos na homepage
- ✅ **Proteção de autenticação** funcionando
- ✅ **Health check** ativo
- ✅ **Cache Redis** operacional
- ✅ **Rate limiting** ativo

## � Desenvolvimento Local (Sem HTTPS)

### ✅ Abordagem Recomendada: Mocks Locais

Para desenvolvimento diário, use mocks locais que não dependem do Mercado Livre:

```bash
# Desenvolvimento com mocks (recomendado)
npm run dev:mock

# Testar endpoint local
npm run test:local
```

**Vantagens:**

- ✅ Não precisa configurar HTTPS
- ✅ Não precisa alterar URLs no Mercado Livre
- ✅ Desenvolvimento mais rápido
- ✅ Dados consistentes para testes
- ✅ Funciona offline

### 🔧 Funcionalidades com Mocks

- **Homepage**: Mostra produtos de teste automaticamente
- **API Pública**: `/api/products-public` retorna dados mockados
- **Cache**: Simula comportamento do Redis localmente
- **UI**: Interface completa funcionando

### 🌐 Quando Usar HTTPS

Use HTTPS apenas quando precisar testar a integração real com Mercado Livre:

```bash
# Para testes reais com Mercado Livre
npm run dev
# Em outro terminal:
npm run tunnel
# Configure a URL HTTPS no Mercado Livre
```

### 📋 Fluxo de Desenvolvimento

1. **Desenvolvimento**: `npm run dev:mock`
2. **Teste UI**: Acesse `http://localhost:3000`
3. **Teste API**: `npm run test:local`
4. **Deploy**: Configure HTTPS apenas para produção

## �📋 Checklist de Configuração da Aplicação

### ✅ Pré-requisitos

- [ ] Conta proprietária no Mercado Livre (não operador)
- [ ] Domínio com HTTPS configurado
- [ ] Certificado SSL válido

### ✅ Criação da Aplicação

1. [ ] Acesse https://developers.mercadolivre.com.br/
2. [ ] Clique "Criar uma aplicação"
3. [ ] Preencha:
   - Nome da aplicação
   - Nome curto
   - Descrição
   - Logo (opcional)

### ✅ Configuração Técnica

4. [ ] **URLs de redirecionamento:**

   ```
   https://seudominio.com/api/auth/mercado-livre/callback
   ```

5. [ ] **Habilitar PKCE:** ✅ Ativado
6. [ ] **Escopos:** Leitura e Escrita
7. [ ] **URL de notificações:**

   ```
   https://seudominio.com/api/webhook/mercado-livre
   ```

8. [ ] **Tópicos de notificação:**
   - [ ] orders_v2
   - [ ] items
   - [ ] messages

### ✅ Configuração do Ambiente

9. [ ] **Variáveis de ambiente:**

   ```bash
   ML_CLIENT_ID=seu_app_id
   ML_CLIENT_SECRET=seu_client_secret
   NEXT_PUBLIC_APP_URL=https://seudominio.com
   ```

10. [ ] **Teste a aplicação:**
    - [ ] Login OAuth funciona
    - [ ] Webhooks recebem notificações
    - [ ] API calls retornam dados

### 🚨 Possíveis Problemas

**Erro: "redirect_uri mismatch"**
- ✅ Verifique se a URL no Mercado Livre é exatamente igual
- ✅ Não use parâmetros variáveis na URL
- ✅ Use HTTPS (não HTTP)

**Erro: "invalid_operator_user_id"**
- ✅ Use conta de administrador (não operador)
- ✅ Verifique permissões da conta

**Erro: "PKCE verification failed"**
- ✅ Certifique-se que PKCE está habilitado na aplicação
- ✅ Verifique implementação do code_challenge

**Webhook não funciona:**
- ✅ URL deve ser HTTPS
- ✅ Deve responder em até 5 segundos
- ✅ Deve retornar HTTP 200

### 🔧 Desenvolvimento Local

Para desenvolvimento local, use:

```bash
# Instalar localtunnel
npm install -g localtunnel

# Criar túnel HTTPS
npm run tunnel

# Configurar temporariamente no Mercado Livre
# Usar a URL https://xxxxx.loca.lt gerada
```

**⚠️ Importante:** Sempre configure a URL de produção no Mercado Livre. Use túnel apenas para testes locais.

## Business Model

**Single-Tenant Architecture**: Each instance serves exactly one Mercado Livre seller account. This ensures:

- Complete data isolation between sellers
- Customized configurations per store
- Enhanced security and performance
- Dedicated support and maintenance

**Access Control**:

- **Public**: Product catalog (`/produtos`) - accessible to all visitors
- **Restricted**: Admin panel (`/admin`) - only the configured seller account
- **Sales Funnel**: Unauthorized sellers see professional sales page with contact info

## Current Configuration

This instance is configured exclusively for **Mercado Livre seller ID: 669073070**.
Other sellers will see an "Access Denied" page with sales information.his is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## 🚀 Getting Started

### Local Development with HTTPS

Since Mercado Livre requires HTTPS for OAuth and webhooks, use these steps for local development:

1. **Install localtunnel:**

   ```bash
   npm install -g localtunnel
   ```

2. **Start the development server:**

   ```bash
   npm run dev
   ```

3. **In another terminal, create HTTPS tunnel:**

   ```bash
   npm run tunnel
   ```

   This will give you a URL like: `https://xxxxx.loca.lt`

4. **Update environment variables:**
   Create/update `.env.local`:

   ```bash
   NEXT_PUBLIC_APP_URL=https://your-tunnel-url.loca.lt
   ```

5. **Configure Mercado Livre:**
   - Use the HTTPS tunnel URL as your redirect URI
   - Use the HTTPS tunnel URL for webhook endpoint

### Quick Start with HTTPS (Recommended)

For the fastest setup with HTTPS:

```bash
# Executar script automatizado (Linux/Mac)
./dev-https.sh

# Ou manualmente no Windows PowerShell:
# Terminal 1: npm run dev
# Terminal 2: npm run tunnel
```

The script will:

- ✅ Install localtunnel if needed
- ✅ Start Next.js development server
- ✅ Create HTTPS tunnel
- ✅ Display configuration instructions

### Manual Setup

If you prefer manual setup, follow the steps above.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Limitations

This project uses [Vercel KV](https://vercel.com/docs/storage/vercel-kv) to cache data. Operations that need to inspect or clear
the cache rely on iterating over keys with `scan`. Scanning is appropriate for small and medium datasets but it requires reading
through all matching keys and cannot efficiently paginate very large key sets.

## Environment Variables

Set the following variable to configure absolute URLs used in API calls and OAuth redirects:

- `NEXT_PUBLIC_APP_URL` – Base URL of the application (e.g., `https://peepers.vercel.app`).

## API Authentication

### Authentication Flow

1. **Login**: Users authenticate via Mercado Livre OAuth at `/api/auth/mercado-livre`
2. **Callback**: OAuth tokens are exchanged and stored securely at `/api/auth/mercado-livre/callback`
3. **Session**: Secure HTTP-only cookies are created for session management
4. **Verification**: All protected routes verify session cookies via middleware

### Protected Routes

The following routes require authentication:

- `/admin` - Administrative dashboard
- `/api/sync/*` - Product synchronization
- `/api/products` - Product data access
- `/api/auth/logout` - Session termination

### Security Features

- **HTTP-only Cookies**: Session tokens cannot be accessed via JavaScript
- **Secure Cookies**: HTTPS-only in production
- **Session Validation**: Server-side session verification
- **User Authorization**: Configurable allowed user IDs via `ALLOWED_USER_IDS` env var
- **Token Expiration**: Automatic session cleanup

### Required Environment Variables

Set the following variables for authentication:

```bash
# Mercado Livre OAuth
ML_CLIENT_ID=your_client_id
ML_CLIENT_SECRET=your_client_secret
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Security (optional)
ALLOWED_USER_IDS=123456789,987654321
```

### Admin Routes

**Note**: Routes mentioned in the original documentation that don't exist:

- ❌ `POST /api/ml/sync` (use `POST /api/sync` instead)
- ❌ `POST /api/products/[id]` (use `GET /api/products` for listing)

**Correct admin routes**:

- ✅ `GET /api/products-public` - Public product catalog (homepage)
- ✅ `POST /api/sync` - Synchronize products
- ✅ `GET /api/products` - Authenticated product management
- ✅ `GET /api/auth/me` - Get current user session

## Runtime Requirements

The `/api/ml/webhook` endpoint uses `revalidatePath` to update ISR pages and therefore runs on the Node.js runtime rather than the Edge runtime.

## 🔒 Security Architecture

### OAuth 2.0 with PKCE Flow

- **Secure Authorization**: Code flow with PKCE protection
- **HTTP-only Cookies**: Session management without client-side access
- **Middleware Protection**: Route-level access control
- **Single User Architecture**: Exclusive admin access with sales funnel

### Access Control Model

- **Public Routes**: Homepage, product catalog, login page
- **Protected Routes**: Admin dashboard, authenticated APIs
- **API Separation**: Public vs authenticated endpoints
- **Session Validation**: Automatic token refresh and validation

### Security Features Implemented

- ✅ CSRF Protection via HTTP-only cookies
- ✅ XSS Prevention with proper sanitization
- ✅ Secure redirect handling
- ✅ Rate limiting on sensitive endpoints
- ✅ Input validation and sanitization

## 🔧 Troubleshooting & Maintenance

### Common Issues

**Products not loading on homepage:**

```bash
# Check public API endpoint
curl -X GET http://localhost:3000/api/products-public

# Verify middleware configuration
npm run build
```

**Authentication issues:**

```bash
# Clear cookies and retry login
# Check OAuth configuration in Mercado Livre
# Verify environment variables
```

**Build failures:**

```bash
# Clean install dependencies
rm -rf node_modules package-lock.json
npm install

# Clear Next.js cache
rm -rf .next
npm run build
```

### Maintenance Tasks

**Weekly:**

- Monitor error logs in Vercel dashboard
- Check Mercado Livre API rate limits
- Review authentication success rates

**Monthly:**

- Update dependencies: `npm audit fix`
- Review and rotate API credentials
- Backup configuration and data

**Security:**

- Monitor for OAuth token leaks
- Review access logs for suspicious activity
- Update security dependencies promptly
