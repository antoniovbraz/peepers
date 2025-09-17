# Fluxos Essenciais - Mercado Livre API

*Atualizado em: 17 de setembro de 2025*

## Índice

- [Fluxo OAuth 2.0 + PKCE](#fluxo-oauth-20--pkce)
- [Publicação e Atualização de Itens](#publicação-e-atualização-de-itens)
- [Consulta e Gestão de Pedidos](#consulta-e-gestão-de-pedidos)
- [Gestão de Envios](#gestão-de-envios)
- [Gestão de Perguntas & Respostas](#gestão-de-perguntas--respostas)
- [Sistema de Notificações (Webhooks)](#sistema-de-notificações-webhooks)

---

## Fluxo OAuth 2.0 + PKCE

### Visão Geral
O Mercado Livre utiliza OAuth 2.0 Authorization Code Flow com suporte a PKCE (Proof Key for Code Exchange) para autenticação segura. O token de acesso tem validade de 6 horas e o refresh token é válido por 6 meses.

### Pré-requisitos
- **HTTPS obrigatório** para todas as URLs de callback
- Aplicação registrada no [Application Manager](https://global-selling.mercadolibre.com/devcenter)
- `client_id`, `client_secret` e `redirect_uri` configurados

### Passo a Passo

#### 1. Gerar Code Challenge (PKCE)
```javascript
// Gerar code_verifier (43-128 caracteres, base64url)
const codeVerifier = generateRandomString(128);

// Gerar code_challenge (SHA256 do verifier em base64url)
const codeChallenge = base64url(sha256(codeVerifier));
```

#### 2. Redirecionar para Autorização
```http
GET https://auth.mercadolibre.com.ar/authorization
  ?response_type=code
  &client_id={APP_ID}
  &redirect_uri={REDIRECT_URI}
  &state={RANDOM_STATE}
  &code_challenge={CODE_CHALLENGE}
  &code_challenge_method=S256
```

**Parâmetros obrigatórios:**
- `response_type=code`: Tipo de fluxo
- `client_id`: ID da aplicação
- `redirect_uri`: URL de callback (deve ser exata à registrada)
- `state`: Token CSRF único por requisição

**Parâmetros PKCE (recomendados):**
- `code_challenge`: Hash SHA256 do code_verifier em base64url
- `code_challenge_method=S256`: Método de hash

#### 3. Usuário Autoriza a Aplicação
O usuário é redirecionado para a tela de consentimento do ML. Após autorizar, é redirecionado de volta:

```http
GET {REDIRECT_URI}?code={AUTHORIZATION_CODE}&state={ORIGINAL_STATE}
```

**Validações obrigatórias:**
- ✅ Verificar se `state` corresponde ao enviado
- ✅ Verificar se `code` foi recebido
- ⚠️ Usuário deve ser **administrador**, não operador

#### 4. Trocar Code por Token
```http
POST https://api.mercadolibre.com/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&client_id={APP_ID}
&client_secret={SECRET_KEY}
&code={AUTHORIZATION_CODE}
&redirect_uri={REDIRECT_URI}
&code_verifier={CODE_VERIFIER}
```

**Resposta de sucesso:**
```json
{
  "access_token": "APP_USR-123456-090515-8cc4448aac10d5105474e1351-1234567",
  "token_type": "bearer",
  "expires_in": 10800,
  "scope": "offline_access read write",
  "user_id": 1234567,
  "refresh_token": "TG-5b9032b4e23464aed1f959f-1234567"
}
```

#### 5. Renovar Token (Quando Necessário)
```http
POST https://api.mercadolibre.com/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&client_id={APP_ID}
&client_secret={SECRET_KEY}
&refresh_token={REFRESH_TOKEN}
```

### Armazenamento Seguro
- **Access Token**: Memória/cache (TTL 6h)
- **Refresh Token**: Banco de dados criptografado
- **Code Verifier**: Sessão temporária (até troca por token)
- **State**: Cache temporário (validação CSRF)

### Códigos de Erro Comuns
- `invalid_client`: `client_id` ou `client_secret` inválidos
- `invalid_grant`: Code expirado, já usado, ou refresh_token inválido
- `invalid_scope`: Escopo solicitado inválido
- `invalid_request`: Parâmetros ausentes ou malformados

---

## Publicação e Atualização de Itens

### Campos Imutáveis vs. Atualizáveis

#### ❌ Campos Imutáveis (Após Publicação)
- `category_id`: Categoria não pode ser alterada
- `listing_type_id`: Tipo de anúncio é fixo
- `site_id`: Marketplace de origem
- `currency_id`: Moeda do anúncio

#### ✅ Campos Atualizáveis
- `title`: Título do produto
- `price`: Preço
- `available_quantity`: Estoque disponível
- `status`: Estado do anúncio (`active`, `paused`, `closed`)
- `description`: Descrição do produto
- `pictures`: Imagens (pode adicionar/remover)
- `attributes`: Atributos específicos da categoria

### Fluxo de Publicação

#### 1. Validar Categoria e Atributos
```http
GET https://api.mercadolibre.com/categories/{category_id}
```

**Verificar:**
- Atributos obrigatórios (`required: true`)
- Valores permitidos para cada atributo
- Restrições específicas da categoria

#### 2. Publicar Item
```http
POST https://api.mercadolibre.com/items
Authorization: Bearer {ACCESS_TOKEN}
Content-Type: application/json

{
  "title": "Power Bank 10000mAh - Carregador Portátil",
  "category_id": "MLB1055",
  "price": 89.90,
  "currency_id": "BRL",
  "available_quantity": 50,
  "condition": "new",
  "listing_type_id": "gold_special",
  "description": "Power bank de alta capacidade...",
  "pictures": [
    {"source": "https://example.com/image1.jpg"},
    {"source": "https://example.com/image2.jpg"}
  ],
  "attributes": [
    {
      "id": "BRAND",
      "value_name": "Samsung"
    },
    {
      "id": "MODEL",
      "value_name": "PB-10000"
    }
  ],
  "shipping": {
    "mode": "me2",
    "free_shipping": true
  }
}
```

#### 3. Validar Resposta
```json
{
  "id": "MLB123456789",
  "site_id": "MLB",
  "title": "Power Bank 10000mAh - Carregador Portátil",
  "status": "active",
  "date_created": "2025-09-17T10:30:00.000Z",
  "permalink": "https://produto.mercadolivre.com.br/MLB123456789"
}
```

### Fluxo de Atualização

#### 1. Atualizar Preço e Estoque
```http
PUT https://api.mercadolibre.com/items/{ITEM_ID}
Authorization: Bearer {ACCESS_TOKEN}
Content-Type: application/json

{
  "price": 79.90,
  "available_quantity": 35
}
```

#### 2. Pausar/Reativar Item
```http
PUT https://api.mercadolibre.com/items/{ITEM_ID}
Authorization: Bearer {ACCESS_TOKEN}
Content-Type: application/json

{
  "status": "paused"  // ou "active" para reativar
}
```

### Estados de Item
- `active`: Ativo e visível
- `paused`: Pausado pelo vendedor
- `closed`: Fechado (sem estoque ou violação)
- `under_review`: Em análise pelo ML

---

## Consulta e Gestão de Pedidos

### Fluxo de Consulta

#### 1. Buscar Pedidos por Período
```http
GET https://api.mercadolibre.com/marketplace/orders/search
  ?seller.id={SELLER_ID}
  &order.status=paid
  &date_created.from=2025-09-01T00:00:00.000Z
  &date_created.to=2025-09-17T23:59:59.999Z
  &limit=50
Authorization: Bearer {ACCESS_TOKEN}
```

#### 2. Filtros Comuns
- **Por status**: `order.status=paid|cancelled|payment_required`
- **Por comprador**: `buyer={BUYER_ID}`
- **Por marketplace**: `site=MLB`
- **Ordenação**: `sort=date_desc|date_asc`

#### 3. Obter Detalhes do Pedido
```http
GET https://api.mercadolibre.com/marketplace/orders/{ORDER_ID}
Authorization: Bearer {ACCESS_TOKEN}
```

**Use o ID correto:**
```json
{
  "id": 2000000580342535,  // ❌ Não use este (pack ID)
  "orders": [
    {
      "id": 2497671750,     // ✅ Use este (order ID real)
      "status": "paid"
    }
  ]
}
```

### Estados de Pedido

#### Fluxo Normal
1. **`payment_required`**: Aguardando pagamento
2. **`payment_in_process`**: Pagamento em processamento
3. **`paid`**: Pago e confirmado → **Disparar fulfillment**
4. **Shipped**: Item enviado
5. **Delivered**: Item entregue

#### Estados Especiais
- **`cancelled`**: Cancelado (pagamento não aprovado, estoque zerado)
- **`invalid`**: Invalidado (comprador malicioso)
- **`partially_paid`**: Pagamento parcial

### Ações por Status
```javascript
switch (order.status) {
  case 'paid':
    // 1. Reduzir estoque
    // 2. Gerar etiqueta de envio
    // 3. Preparar item para despacho
    break;
    
  case 'cancelled':
    // 1. Restaurar estoque
    // 2. Registrar cancelamento
    break;
    
  case 'invalid':
    // 1. Não enviar produto
    // 2. Aguardar instrução do ML
    break;
}
```

### Fraud Alert
Pedidos com tag `fraud_risk_detected`:
- ❌ **NÃO enviar** o produto
- ✅ Cancelar o pedido
- ✅ Aguardar reembolso automático

---

## Gestão de Envios

### Tipos de Logística

#### ME1 (Mercado Envios 1)
- **Seller**: Gera etiqueta e código de rastreio
- **Responsabilidade**: Total do vendedor
- **Uso**: Logística própria

#### ME2 (Mercado Envios 2)
- **ML**: Gera etiqueta pré-paga
- **Seller**: Imprime e entrega à transportadora
- **Tracking**: Automático

#### Fulfillment (FBM)
- **ML**: Controle total do envio
- **Seller**: Sem ação necessária
- **Status**: Atualização automática

### Fluxo ME2 (Mais Comum)

#### 1. Receber Notificação de Pedido Pago
```json
{
  "resource": "/marketplace/orders/2000003508419013",
  "user_id": 123456789,
  "topic": "marketplace_orders"
}
```

#### 2. Consultar Detalhes do Envio
```http
GET https://api.mercadolibre.com/marketplace/orders/{ORDER_ID}
Authorization: Bearer {ACCESS_TOKEN}
```

Extrair `shipping.id`:
```json
{
  "id": 2000003508419013,
  "status": "paid",
  "shipping": {
    "id": 28237306862
  }
}
```

#### 3. Verificar Status do Envio
```http
GET https://api.mercadolibre.com/marketplace/shipments/28237306862
Authorization: Bearer {ACCESS_TOKEN}
x-format-new: true
```

#### 4. Aguardar Status `ready_to_ship`
```json
{
  "id": 28237306862,
  "status": "ready_to_ship",
  "substatus": "printed",
  "logistic": {
    "mode": "me2",
    "type": "drop_off"
  }
}
```

#### 5. Baixar e Imprimir Etiqueta
```http
GET https://api.mercadolibre.com/marketplace/shipments/28237306862/labels
Authorization: Bearer {ACCESS_TOKEN}
```

Retorna PDF para impressão.

#### 6. Despachar para Transportadora
- Embalar produto com etiqueta
- Entregar no ponto de coleta
- Status atualiza automaticamente para `shipped`

### Fluxo ME1 (Logística Própria)

#### 1. Após Status `handling`
```http
POST https://api.mercadolibre.com/marketplace/shipments/{SHIPMENT_ID}/tracking
Authorization: Bearer {ACCESS_TOKEN}
Content-Type: application/json

{
  "tracking_id": "BR123456789",
  "tracking_url": "https://correios.com.br/rastreio",
  "carrier": "Correios"
}
```

#### 2. Informar Entrega
```http
POST https://api.mercadolibre.com/marketplace/shipments/{SHIPMENT_ID}/tracking/status
Authorization: Bearer {ACCESS_TOKEN}
Content-Type: application/json

{
  "tracking_id": "BR123456789",
  "status": "delivered"  // ou "not_delivered"
}
```

### Split de Envios
Para dividir um envio em múltiplos pacotes:

```http
POST https://api.mercadolibre.com/marketplace/shipments/{SHIPMENT_ID}/split
Authorization: Bearer {ACCESS_TOKEN}
x-format-new: true
Content-Type: application/json

{
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
}
```

**Limitações:**
- Apenas ME2 com `drop_off` ou `cross_docking`
- Máximo 2 pacotes por divisão
- Quantidade total deve coincidir

---

## Gestão de Perguntas & Respostas

### Fluxo de Resposta

#### 1. Receber Notificação de Pergunta
```json
{
  "resource": "/marketplace/questions/5036111111",
  "user_id": "123456789",
  "topic": "marketplace_questions"
}
```

#### 2. Consultar Detalhes da Pergunta
```http
GET https://api.mercadolibre.com/marketplace/questions/5036111111
Authorization: Bearer {ACCESS_TOKEN}
```

```json
{
  "id": 5036111111,
  "seller_id": 123456789,
  "text": "Qual a capacidade real da bateria?",
  "status": "UNANSWERED",
  "item_id": "MLB123456789",
  "date_created": "2025-09-17T14:30:00.000Z",
  "from": {
    "id": 987654321
  }
}
```

#### 3. Responder Pergunta
```http
POST https://api.mercadolibre.com/marketplace/answers
Authorization: Bearer {ACCESS_TOKEN}
Content-Type: application/json

{
  "question_id": 5036111111,
  "text": "A capacidade real é de 10.000mAh, testada e certificada.",
  "text_translated": "Real capacity is 10,000mAh, tested and certified."
}
```

### Busca e Filtragem

#### Perguntas Não Respondidas
```http
GET https://api.mercadolibre.com/marketplace/questions/search
  ?seller_id={SELLER_ID}
  &status=UNANSWERED
  &limit=50
Authorization: Bearer {ACCESS_TOKEN}
```

#### Perguntas por Item
```http
GET https://api.mercadolibre.com/marketplace/questions/search
  ?item={ITEM_ID}
  &limit=20
Authorization: Bearer {ACCESS_TOKEN}
```

### Estados de Pergunta
- **`UNANSWERED`**: Aguardando resposta
- **`ANSWERED`**: Respondida
- **`BANNED`**: Banida por violação
- **`CLOSED_UNANSWERED`**: Produto fechado sem resposta
- **`UNDER_REVIEW`**: Em revisão
- **`DELETED`**: Deletada

### Boas Práticas
- ✅ Responder em até 24 horas
- ✅ Máximo 2000 caracteres por resposta
- ✅ Ser informativo e cordial
- ❌ Não incluir links externos
- ❌ Não solicitar contato fora da plataforma

---

## Sistema de Notificações (Webhooks)

### Configuração Inicial

#### 1. Configurar no Application Manager
Acesse [Application Manager](https://global-selling.mercadolibre.com/devsite/application-manager-gs):

- **Callback URL**: `https://seudominio.com/webhook/mercadolibre`
- **Tópicos**: Selecionar conforme necessidade

#### 2. Implementar Endpoint de Webhook
```javascript
app.post('/webhook/mercadolivre', (req, res) => {
  const notification = req.body;
  
  // ✅ CRÍTICO: Responder HTTP 200 imediatamente
  res.status(200).send('OK');
  
  // Processar notificação de forma assíncrona
  processNotification(notification);
});

async function processNotification(notification) {
  const { resource, topic, user_id } = notification;
  
  switch (topic) {
    case 'marketplace_orders':
      await handleOrderNotification(resource);
      break;
      
    case 'marketplace_questions':
      await handleQuestionNotification(resource);
      break;
      
    case 'marketplace_shipments':
      await handleShipmentNotification(resource);
      break;
  }
}
```

### Tópicos Essenciais

#### marketplace_orders
```json
{
  "resource": "/marketplace/orders/1499111111",
  "user_id": 123456789,
  "topic": "marketplace_orders",
  "sent": "2025-09-17T14:44:33.006Z"
}
```

**Ações:**
1. Fazer GET no recurso para obter detalhes
2. Verificar mudança de status
3. Processar ações (reduzir estoque, gerar envio)

#### marketplace_questions
```json
{
  "resource": "/marketplace/questions/5036111111",
  "user_id": "123456789",
  "topic": "marketplace_questions"
}
```

**Ações:**
1. Consultar pergunta
2. Se `UNANSWERED`, preparar resposta
3. Notificar equipe de atendimento

#### marketplace_shipments
```json
{
  "resource": "/marketplace/shipments/1041417027",
  "user_id": "465432224",
  "topic": "marketplace_shipments"
}
```

**Ações:**
1. Verificar status do envio
2. Se `ready_to_ship`, gerar etiqueta
3. Atualizar sistema interno

### Requisitos Críticos

#### Performance
- **⏱️ Timeout**: HTTP 200 em até 500ms
- **🔄 Retry**: ML tentará por 1 hora em intervalos exponenciais
- **📋 Queue**: Processar notificações de forma assíncrona

#### Segurança
- **🔒 IPs permitidos**: 
  - 54.88.218.97
  - 18.215.140.160
  - 18.213.114.129
  - 18.206.34.84
- **🛡️ Validação**: Verificar `user_id` e `application_id`

#### Idempotência
```javascript
const processedNotifications = new Set();

function processNotification(notification) {
  const notificationId = `${notification.resource}_${notification.sent}`;
  
  if (processedNotifications.has(notificationId)) {
    return; // Já processada
  }
  
  processedNotifications.add(notificationId);
  // Processar...
}
```

### Monitoramento

#### Histórico de Feeds
```http
GET https://api.mercadolibre.com/myfeeds
  ?app_id={APP_ID}
  &topic=marketplace_orders
  &limit=10
Authorization: Bearer {ACCESS_TOKEN}
```

#### Feeds Perdidos
```http
GET https://api.mercadolibre.com/missed_feeds
  ?app_id={APP_ID}
Authorization: Bearer {ACCESS_TOKEN}
```

### Troubleshooting

#### Notificações Paradas
1. Verificar se endpoint retorna HTTP 200
2. Verificar timeout (deve ser < 500ms)
3. Reinscrever tópicos no Application Manager

#### Duplicadas
1. Implementar controle de idempotência
2. Usar `sent` timestamp como chave única
3. Verificar se processamento é assíncrono

---

## Considerações de Segurança e LGPD

### Dados Pessoais
- **Minimização**: Coletar apenas dados necessários
- **Retention**: Definir TTL para dados de usuários
- **Anonimização**: Logs não devem conter dados pessoais

### Token Security
- **Storage**: Refresh tokens em banco criptografado
- **Rotation**: Implementar rotação automática
- **Monitoring**: Alertas para falhas de autenticação

### Error Handling
- **Logs**: Não registrar tokens ou dados sensíveis
- **Fallback**: Graceful degradation quando API indisponível
- **Rate Limiting**: Implementar backoff exponencial

---

*Este documento serve como guia de implementação. Sempre consulte a [documentação oficial](https://global-selling.mercadolibre.com/devsite/) para informações atualizadas.*