# 🧹 LIMPEZA RADICAL - ENDPOINTS DE PRODUTOS

## SITUAÇÃO ATUAL (PROBLEMÁTICA)
Temos **11 endpoints diferentes** para produtos, causando:
- Conflitos de middleware
- Código duplicado
- Complexidade desnecessária
- Bugs de roteamento

## ARQUITETURA NOVA (SIMPLIFICADA)

### 📋 NECESSIDADES DO USUÁRIO:
1. **Home + `/produtos`** → Qualquer pessoa vê produtos (público)
2. **`/admin/produtos`** → Dono da loja gerencia produtos (autenticado)

### 🎯 ENDPOINTS FINAIS (APENAS 2):
1. **`/api/products`** → Público (para home/produtos)
2. **`/api/admin/products`** → Protegido (para admin)

## 🗑️ ENDPOINTS PARA REMOVER:

### Debug/Test (8 endpoints):
- ❌ `/api/debug-products-logic`
- ❌ `/api/debug-ml-products` 
- ❌ `/api/test-products-path`
- ❌ `/api/products-v1` (criado hoje)
- ❌ `/api/v1/products` (removido - era código legacy com mock data)
- ❌ `/api/products-simple`
- ❌ `/api/products-minimal`
- ❌ `/api/products/[id]` (mover para admin se necessário)

### Redundantes (1 endpoint):
- ❌ `/api/products-public` (mesclar com `/api/products`)

### Manter/Adaptar (2 endpoints):
- ✅ `/api/products` → Simplificar para público
- ✅ `/api/admin/products` → Criar para administração

## 🚀 AÇÃO:
1. Remover todos os endpoints desnecessários
2. Simplificar `/api/products` para uso público
3. Criar `/api/admin/products` para administração
4. Atualizar configuração de rotas
5. Testar integração completa

**RESULTADO:** De 11 endpoints → 2 endpoints focados e funcionais!