# Exemplos Práticos - Mercado Livre API

*Exemplos testáveis para site_id=MLB (Brasil) - Atualizado em: 17 de setembro de 2025*

## Índice

- [Endpoints Públicos (Sem Autenticação)](#endpoints-públicos-sem-autenticação)
- [Endpoints com Autenticação](#endpoints-com-autenticação)
- [Gestão de Produtos](#gestão-de-produtos)
- [Processamento de Pedidos](#processamento-de-pedidos)
- [Sistema de Envios](#sistema-de-envios)
- [Perguntas & Respostas](#perguntas--respostas)
- [Webhooks](#webhooks)

---

## Endpoints Públicos (Sem Autenticação)

### 🔍 Busca Pública de Produtos

#### Busca Geral no Brasil
```bash
# Buscar produtos por termo
curl "https://api.mercadolibre.com/sites/MLB/search?q=smartphone&limit=20"

# Buscar com filtros específicos
curl "https://api.mercadolibre.com/sites/MLB/search?q=iphone&category=MLB1055&price=1000-3000&condition=new&limit=10"

# Buscar por categoria específica
curl "https://api.mercadolibre.com/sites/MLB/search?category=MLB1055&limit=50"
```

#### Produtos em Destaque
```bash
# Items featured por categoria
curl "https://api.mercadolibre.com/highlights/MLB/category/MLB1055"

# Produtos mais vendidos
curl "https://api.mercadolibre.com/sites/MLB/search?category=MLB1055&sort=sold_quantity_desc&limit=20"
```

### 📱 Detalhes de Produtos

#### Informações Básicas
```bash
# Detalhes completos de um item
curl "https://api.mercadolibre.com/items/MLB123456789"

# Múltiplos items de uma vez
curl "https://api.mercadolibre.com/items?ids=MLB123456789,MLB987654321"

# Descrição do produto
curl "https://api.mercadolibre.com/items/MLB123456789/description"
```

#### Informações de Vendedor
```bash
# Dados do vendedor (públicos)
curl "https://api.mercadolibre.com/users/123456789"

# Reputação do vendedor
curl "https://api.mercadolibre.com/users/123456789/reputation"
```

### 🗂️ Categorias e Atributos

#### Estrutura de Categorias
```bash
# Todas as categorias do Brasil
curl "https://api.mercadolibre.com/sites/MLB/categories"

# Detalhes de uma categoria específica
curl "https://api.mercadolibre.com/categories/MLB1055"

# Atributos obrigatórios por categoria
curl "https://api.mercadolibre.com/categories/MLB1055/attributes"
```

#### Navegação de Categorias
```bash
# Categorias filhas
curl "https://api.mercadolibre.com/categories/MLB1055/children"

# Caminho da categoria (breadcrumb)
curl "https://api.mercadolibre.com/categories/MLB1055/path_from_root"
```

### 🚚 Informações de Envio

#### Calculadora de Frete
```bash
# Calcular frete por CEP
curl "https://api.mercadolibre.com/items/MLB123456789/shipping_options?zip_code=01310-100"

# Métodos de envio disponíveis
curl "https://api.mercadolibre.com/sites/MLB/shipping_methods"
```

---

## Endpoints com Autenticação

**⚠️ Importante**: Todos os exemplos abaixo requerem um token de acesso válido. Substitua `$ACCESS_TOKEN` pelo seu token.

### 🔐 Verificação de Autenticação

#### Validar Token
```bash
# Verificar se token está válido
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
     "https://api.mercadolibre.com/users/me"

# Informações da aplicação
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
     "https://api.mercadolibre.com/applications/$APP_ID"
```

#### Renovar Token
```bash
# Renovar access token usando refresh token
curl -X POST "https://api.mercadolibre.com/oauth/token" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "grant_type=refresh_token&client_id=$ML_CLIENT_ID&client_secret=$ML_CLIENT_SECRET&refresh_token=$REFRESH_TOKEN"
```

---

## Gestão de Produtos

### ➕ Publicar Novo Produto

#### Produto Simples
```bash
curl -X POST "https://api.mercadolibre.com/items" \
     -H "Authorization: Bearer $ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Power Bank 10000mAh - Carregador Portátil USB-C",
       "category_id": "MLB1055",
       "price": 89.90,
       "currency_id": "BRL",
       "available_quantity": 50,
       "condition": "new",
       "listing_type_id": "gold_special",
       "description": "Power bank de alta capacidade com USB-C e carregamento rápido",
       "pictures": [
         {"source": "https://exemplo.com/imagem1.jpg"},
         {"source": "https://exemplo.com/imagem2.jpg"}
       ],
       "attributes": [
         {
           "id": "BRAND",
           "value_name": "Samsung"
         },
         {
           "id": "MODEL",
           "value_name": "PB-10000-USC"
         }
       ],
       "shipping": {
         "mode": "me2",
         "free_shipping": true
       }
     }'
```

#### Produto com Variações
```bash
curl -X POST "https://api.mercadolibre.com/items" \
     -H "Authorization: Bearer $ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Camiseta Básica Algodão",
       "category_id": "MLB1430",
       "price": 39.90,
       "currency_id": "BRL",
       "available_quantity": 100,
       "condition": "new",
       "listing_type_id": "gold_special",
       "variations": [
         {
           "attribute_combinations": [
             {"id": "COLOR", "value_name": "Azul"},
             {"id": "SIZE", "value_name": "M"}
           ],
           "available_quantity": 25,
           "price": 39.90,
           "picture_ids": ["img1"]
         },
         {
           "attribute_combinations": [
             {"id": "COLOR", "value_name": "Vermelho"},
             {"id": "SIZE", "value_name": "G"}
           ],
           "available_quantity": 30,
           "price": 42.90,
           "picture_ids": ["img2"]
         }
       ]
     }'
```

### ✏️ Atualizar Produtos

#### Atualizar Preço e Estoque
```bash
curl -X PUT "https://api.mercadolibre.com/items/MLB123456789" \
     -H "Authorization: Bearer $ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "price": 79.90,
       "available_quantity": 25
     }'
```

#### Pausar/Reativar Item
```bash
# Pausar item
curl -X PUT "https://api.mercadolibre.com/items/MLB123456789" \
     -H "Authorization: Bearer $ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"status": "paused"}'

# Reativar item
curl -X PUT "https://api.mercadolibre.com/items/MLB123456789" \
     -H "Authorization: Bearer $ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"status": "active"}'
```

### 📋 Consultar Produtos do Vendedor

#### Listar Todos os Produtos
```bash
# Listar items do seller (paginado)
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
     "https://api.mercadolibre.com/users/$USER_ID/items/search?limit=50&offset=0"

# Filtrar por status
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
     "https://api.mercadolibre.com/users/$USER_ID/items/search?status=active&limit=20"
```

---

## Processamento de Pedidos

### 🛒 Consultar Pedidos

#### Pedidos por Período
```bash
# Pedidos dos últimos 30 dias
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
     "https://api.mercadolibre.com/marketplace/orders/search?seller.id=$USER_ID&order.date_created.from=$(date -d '30 days ago' -Iseconds)&order.date_created.to=$(date -Iseconds)&limit=50"

# Pedidos pagos pendentes de envio
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
     "https://api.mercadolibre.com/marketplace/orders/search?seller.id=$USER_ID&order.status=paid&shipping.status=pending&limit=20"
```

#### Detalhes de Pedido Específico
```bash
# Informações completas do pedido
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
     "https://api.mercadolibre.com/marketplace/orders/2000000580342535"

# Histórico de mudanças de status
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
     "https://api.mercadolibre.com/marketplace/orders/2000000580342535/history"
```

### 💰 Gestão de Pagamentos

#### Status de Pagamento
```bash
# Detalhes do pagamento
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
     "https://api.mercadolibre.com/marketplace/payments/12345678901"

# Verificar chargebacks
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
     "https://api.mercadolibre.com/marketplace/orders/search?seller.id=$USER_ID&payment.status=chargeback"
```

---

## Sistema de Envios

### 📦 Gestão ME2 (Mercado Envios)

#### Consultar Envio
```bash
# Detalhes completos do envio
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
     -H "x-format-new: true" \
     "https://api.mercadolibre.com/marketplace/shipments/28237306862"

# Status de tracking
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
     "https://api.mercadolibre.com/marketplace/shipments/28237306862/tracking"
```

#### Baixar Etiqueta de Envio
```bash
# Download da etiqueta em PDF
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
     "https://api.mercadolibre.com/marketplace/shipments/28237306862/labels" \
     -o "etiqueta_envio.pdf"

# Múltiplas etiquetas
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
     "https://api.mercadolibre.com/marketplace/shipments/labels?shipment_ids=28237306862,28237306863" \
     -o "etiquetas_multiplas.pdf"
```

#### Dividir Envio (Split)
```bash
curl -X POST "https://api.mercadolibre.com/marketplace/shipments/28237306862/split" \
     -H "Authorization: Bearer $ACCESS_TOKEN" \
     -H "x-format-new: true" \
     -H "Content-Type: application/json" \
     -d '{
       "reason": "FRAGILE",
       "packs": [
         {
           "orders": [
             {"id": "2000000000000002", "quantity": 1}
           ]
         },
         {
           "orders": [
             {"id": "2000000000000002", "quantity": 1}
           ]
         }
       ]
     }'
```

### 🚚 Gestão ME1 (Logística Própria)

#### Adicionar Tracking
```bash
curl -X POST "https://api.mercadolibre.com/marketplace/shipments/28237306862/tracking" \
     -H "Authorization: Bearer $ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "tracking_id": "BR123456789BR",
       "tracking_url": "https://www.correios.com.br/rastreamento",
       "carrier": "Correios"
     }'
```

#### Confirmar Entrega
```bash
curl -X POST "https://api.mercadolibre.com/marketplace/shipments/28237306862/tracking/status" \
     -H "Authorization: Bearer $ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "tracking_id": "BR123456789BR",
       "status": "delivered",
       "delivered_to": "João Silva"
     }'
```

---

## Perguntas & Respostas

### ❓ Consultar Perguntas

#### Perguntas Não Respondidas
```bash
# Perguntas pendentes de resposta
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
     "https://api.mercadolibre.com/marketplace/questions/search?seller_id=$USER_ID&status=UNANSWERED&limit=20"

# Perguntas por item específico
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
     "https://api.mercadolibre.com/marketplace/questions/search?item=MLB123456789&limit=10"
```

#### Detalhes de Pergunta
```bash
# Informações completas da pergunta
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
     "https://api.mercadolibre.com/marketplace/questions/5036111111"
```

### 💬 Responder Perguntas

#### Resposta Simples
```bash
curl -X POST "https://api.mercadolibre.com/marketplace/answers" \
     -H "Authorization: Bearer $ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "question_id": 5036111111,
       "text": "A capacidade real é de 10.000mAh, testada e certificada. Ideal para carregar seu smartphone de 2 a 3 vezes completas."
     }'
```

#### Resposta com Tradução
```bash
curl -X POST "https://api.mercadolibre.com/marketplace/answers" \
     -H "Authorization: Bearer $ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "question_id": 5036111111,
       "text": "Sim, temos disponível em estoque. Envio imediato para todo o Brasil.",
       "text_translated": "Yes, we have it available in stock. Immediate shipping throughout Brazil."
     }'
```

---

## Webhooks

### 🔔 Configuração e Teste

#### Testar Webhook Endpoint
```bash
# Simular notificação de pedido
curl -X POST "https://seudominio.com/webhook/mercadolibre" \
     -H "Content-Type: application/json" \
     -H "User-Agent: MercadoLibre Webhook" \
     -d '{
       "resource": "/marketplace/orders/2000000580342535",
       "user_id": "123456789",
       "topic": "marketplace_orders",
       "sent": "2025-09-17T14:44:33.006Z"
     }'
```

#### Verificar Feeds Perdidos
```bash
# Consultar notificações perdidas
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
     "https://api.mercadolibre.com/missed_feeds?app_id=$APP_ID"

# Histórico de feeds
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
     "https://api.mercadolibre.com/myfeeds?app_id=$APP_ID&topic=marketplace_orders&limit=10"
```

---

## 🧪 Scripts de Teste Completo

### Script de Validação OAuth
```bash
#!/bin/bash
# test_oauth.sh

echo "🔐 Testando OAuth..."

# 1. Verificar token
echo "Verificando token..."
USER_INFO=$(curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
                "https://api.mercadolibre.com/users/me")

if echo "$USER_INFO" | grep -q '"id"'; then
    echo "✅ Token válido"
    USER_ID=$(echo "$USER_INFO" | jq -r '.id')
    echo "👤 User ID: $USER_ID"
else
    echo "❌ Token inválido ou expirado"
    exit 1
fi

# 2. Testar permissões
echo "Testando permissões de read..."
ITEMS=$(curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
            "https://api.mercadolibre.com/users/$USER_ID/items/search?limit=1")

if echo "$ITEMS" | grep -q '"results"'; then
    echo "✅ Permissão read OK"
else
    echo "❌ Sem permissão read"
fi

echo "🎉 Teste OAuth concluído!"
```

### Script de Teste de Produtos
```bash
#!/bin/bash
# test_products.sh

echo "📦 Testando gestão de produtos..."

# 1. Listar produtos
echo "Listando produtos..."
PRODUCTS=$(curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
               "https://api.mercadolibre.com/users/$USER_ID/items/search?limit=5")

PRODUCT_COUNT=$(echo "$PRODUCTS" | jq '.paging.total')
echo "📊 Total de produtos: $PRODUCT_COUNT"

# 2. Testar produto específico
if [ "$PRODUCT_COUNT" -gt 0 ]; then
    ITEM_ID=$(echo "$PRODUCTS" | jq -r '.results[0]')
    echo "🔍 Testando produto: $ITEM_ID"
    
    ITEM_DETAILS=$(curl -s "https://api.mercadolibre.com/items/$ITEM_ID")
    ITEM_TITLE=$(echo "$ITEM_DETAILS" | jq -r '.title')
    ITEM_PRICE=$(echo "$ITEM_DETAILS" | jq -r '.price')
    
    echo "📝 Título: $ITEM_TITLE"
    echo "💰 Preço: R$ $ITEM_PRICE"
fi

echo "🎉 Teste de produtos concluído!"
```

### Script de Teste de Pedidos
```bash
#!/bin/bash
# test_orders.sh

echo "🛒 Testando gestão de pedidos..."

# 1. Pedidos recentes
echo "Buscando pedidos recentes..."
ORDERS=$(curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
             "https://api.mercadolibre.com/marketplace/orders/search?seller.id=$USER_ID&limit=5")

ORDER_COUNT=$(echo "$ORDERS" | jq '.paging.total')
echo "📊 Total de pedidos: $ORDER_COUNT"

# 2. Pedidos por status
echo "Analisando status dos pedidos..."
PAID_ORDERS=$(curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
                  "https://api.mercadolibre.com/marketplace/orders/search?seller.id=$USER_ID&order.status=paid&limit=1")

PAID_COUNT=$(echo "$PAID_ORDERS" | jq '.paging.total')
echo "💰 Pedidos pagos: $PAID_COUNT"

echo "🎉 Teste de pedidos concluído!"
```

---

## 📋 Checklist de Testes

### ✅ Pré-requisitos
- [ ] Variáveis de ambiente configuradas (`ML_CLIENT_ID`, `ML_CLIENT_SECRET`, `ACCESS_TOKEN`, `USER_ID`)
- [ ] Token de acesso válido (renovar se necessário)
- [ ] Conectividade HTTPS com api.mercadolibre.com
- [ ] Aplicação registrada no Application Manager

### ✅ Testes Básicos
- [ ] Autenticação funcional (`/users/me`)
- [ ] Busca pública (`/sites/MLB/search`)
- [ ] Detalhes de produto (`/items/{id}`)
- [ ] Consulta de categorias (`/sites/MLB/categories`)

### ✅ Testes Avançados
- [ ] Listagem de produtos do seller
- [ ] Consulta de pedidos
- [ ] Gestão de envios
- [ ] Perguntas e respostas
- [ ] Webhook endpoint funcionando

### ✅ Testes de Performance
- [ ] Response time < 2s para endpoints públicos
- [ ] Response time < 5s para endpoints autenticados
- [ ] Rate limiting implementado
- [ ] Cache funcionando corretamente

---

*Estes exemplos são testáveis em produção com a API real do Mercado Livre. Sempre use tokens válidos e respeite os rate limits da API.*