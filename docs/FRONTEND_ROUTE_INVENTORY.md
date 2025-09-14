# Frontend Route Inventory

## 📋 Inventário de Rotas - Peepers

**Data:** 14 de Setembro de 2025
**Versão:** 0.1.1
**Status:** ✅ Ativo

### 🎯 Metodologia
- **Framework:** Next.js 15.5.3 (App Router)
- **Análise:** Estrutura de arquivos + código fonte
- **Cobertura:** Rotas públicas e admin
- **Validação:** Manual + build check

---

## 📊 Resumo Executivo

| Categoria | Quantidade | Status |
|-----------|------------|--------|
| **Rotas Públicas** | 4 | ✅ Implementadas |
| **Rotas Admin** | 1 | ✅ Implementada |
| **Rotas API** | 15+ | ✅ Implementadas |
| **Rotas 404** | 0 | ✅ Nenhuma detectada |
| **Redirecionamentos** | 0 | ⚠️ Nenhum configurado |

---

## 🏠 Rotas Públicas

### 1. `/` - Home Page
- **Arquivo:** `src/app/page.tsx`
- **Status:** ✅ 200 OK
- **Descrição:** Página inicial com produtos em destaque
- **Funcionalidades:**
  - Header com navegação
  - Hero section
  - Produtos em destaque (4 primeiros)
  - Seções: Como Funciona, Contato
- **Owner:** Frontend Team
- **SEO:** ✅ Meta tags configuradas

### 2. `/produtos` - Listagem de Produtos
- **Arquivo:** `src/app/produtos/page.tsx`
- **Status:** ✅ 200 OK
- **Descrição:** Listagem completa de todos os produtos
- **Funcionalidades:**
  - Grid responsivo de produtos
  - Filtros e busca
  - Paginação
  - Links para produtos individuais
- **Owner:** Frontend Team
- **Parâmetros:** Nenhum (GET)
- **SEO:** ⚠️ Meta tags genéricas

### 3. `/produtos/[id]` - Página do Produto
- **Arquivo:** `src/app/produtos/[id]/page.tsx` (implícito via ProductsClient)
- **Status:** ✅ 200 OK (dinâmico)
- **Descrição:** Página detalhada de produto individual
- **Funcionalidades:**
  - Detalhes do produto
  - Galeria de imagens
  - Preço e informações de frete
  - Link para compra no Mercado Livre
- **Owner:** Frontend Team
- **Parâmetros:**
  - `id` (string): ID do produto no Mercado Livre
- **SEO:** ⚠️ Meta tags dinâmicas não implementadas

### 4. `/admin` - Painel Administrativo
- **Arquivo:** `src/app/admin/page.tsx`
- **Status:** ✅ 200 OK
- **Descrição:** Dashboard administrativo
- **Funcionalidades:**
  - Métricas de produtos
  - Debug de cache
  - Testes de endpoints
  - Backup/restore
- **Owner:** Admin Team
- **Autenticação:** ⚠️ Não implementada
- **SEO:** ❌ Não indexável (robots noindex implícito)

---

## 🔌 Rotas API (Backend)

### Auth & OAuth
- **`/api/auth/mercado-livre`** - ✅ Iniciador OAuth ML
- **`/api/auth/mercado-livre/callback`** - ✅ Callback OAuth ML
- **`/api/auth/callback-test`** - ✅ Teste de callback
- **`/api/auth/test`** - ✅ Teste de autenticação

### Produtos
- **`/api/products`** - ✅ Lista todos os produtos
- **`/api/products-minimal`** - ✅ Lista produtos (versão reduzida)
- **`/api/products-simple`** - ✅ Lista produtos (versão simples)
- **`/api/products/[id]`** - ✅ Detalhes de produto específico

### Cache & Debug
- **`/api/cache-debug`** - ✅ Debug de cache
- **`/api/debug`** - ✅ Debug geral
- **`/api/debug-cache`** - ✅ Debug específico de cache
- **`/api/debug-products-logic`** - ✅ Debug lógica produtos
- **`/api/debug-tokens`** - ✅ Debug tokens OAuth

### Sistema
- **`/api/backup`** - ✅ Backup do sistema
- **`/api/health`** - ✅ Health check
- **`/api/migrate-token`** - ✅ Migração de tokens
- **`/api/sync`** - ✅ Sincronização de produtos
- **`/api/webhook/mercado-livre`** - ✅ Webhook ML

### Testes
- **`/api/test-cache`** - ✅ Teste de cache
- **`/api/test-cache-direct`** - ✅ Teste direto de cache
- **`/api/test-products-path`** - ✅ Teste caminho produtos

---

## 🚫 Rotas Não Implementadas (Gaps)

### Páginas Públicas Faltando
1. **`/contato`** - Página de contato
   - **Status:** ❌ 404 (link existe no header)
   - **Prioridade:** Alta
   - **Sugestão:** Formulário de contato + informações

2. **`/como-funciona`** - Página explicativa (#ancora)
   - **Status:** ⚠️ Ancora na home (não é rota separada)
   - **Prioridade:** Média
   - **Sugestão:** Página dedicada ou melhorar seção na home

### Páginas de Erro
3. **`/404`** - Página 404 customizada
   - **Status:** ❌ Usa padrão Next.js
   - **Prioridade:** Alta
   - **Sugestão:** Página com navegação e busca

4. **`/500`** - Página 500 customizada
   - **Status:** ❌ Usa padrão Next.js
   - **Prioridade:** Média
   - **Sugestão:** Página de erro amigável

### Funcionalidades Faltando
5. **`/carrinho`** - Carrinho de compras
   - **Status:** ❌ Não implementado
   - **Prioridade:** Baixa
   - **Nota:** Compra finalizada no ML

6. **`/busca`** - Página de resultados de busca
   - **Status:** ❌ Funcionalidade existe, mas sem página dedicada
   - **Prioridade:** Baixa

---

## 🔗 Status dos Links Internos

### Header Navigation
- ✅ `/` - Home
- ✅ `/produtos` - Produtos
- ⚠️ `/contato` - **404** (não implementado)
- ⚠️ `#como-funciona` - Ancora (funciona)

### Footer Navigation
- ❌ Nenhum footer implementado

### Links de Produto
- ✅ `/produtos/[id]` - Dinâmico (funciona)

---

## 📈 Métricas de Cobertura

### SEO Coverage
- ✅ Home (`/`) - Meta tags completas
- ⚠️ Produtos (`/produtos`) - Meta tags básicas
- ❌ Produto (`/produtos/[id]`) - Meta tags dinâmicas não implementadas
- ❌ Admin (`/admin`) - Não indexável

### Performance
- ✅ Home - Otimizada (Server Components)
- ✅ Produtos - Otimizada (Client Components)
- ⚠️ Produto individual - Pode precisar de otimização

### Acessibilidade
- ⚠️ Header - Menu mobile sem funcionalidade
- ⚠️ Imagens - Alguns produtos sem alt text adequado
- ⚠️ Navegação - Faltam skip-links

---

## 🎯 Próximos Passos

### Prioridade Alta
1. **Implementar `/contato`** - Página de contato
2. **Criar página 404 customizada**
3. **Corrigir menu mobile** - Funcionalidade completa

### Prioridade Média
4. **Implementar `/como-funciona`** - Página dedicada
5. **Meta tags dinâmicas** - Para produtos individuais
6. **Footer navigation** - Links consistentes

### Prioridade Baixa
7. **Página 500 customizada**
8. **Página de busca dedicada**
9. **Funcionalidade de carrinho** (se necessário)

---

## 📝 Notas Técnicas

- **Framework:** Next.js 15.5.3 com App Router
- **Styling:** Tailwind CSS 4.x
- **Fontes:** Geist Sans/Mono (Google Fonts)
- **PWA:** Service Worker implementado
- **Build:** Produção otimizada
- **Deploy:** Vercel (CD automático)

**Última atualização:** 14/09/2025
**Responsável:** Frontend Team