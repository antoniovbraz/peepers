# Inventário de Endpoints - Mercado Livre API
*Atualizado em: 17 de setembro de 2025*

## Índice
- [OAuth & Autenticação](#oauth--autenticação)
- [Itens & Buscas](#itens--buscas)
- [Pedidos (Orders)](#pedidos-orders)
- [Envios (Shipments)](#envios-shipments)
- [Perguntas & Respostas](#perguntas--respostas)
- [Categorias & Sites](#categorias--sites)
- [Usuários](#usuários)
- [Notificações (Webhooks)](#notificações-webhooks)
- [Mensagens](#mensagens)
- [Utilitários](#utilitários)

---

## OAuth & Autenticação

| **Recurso** | **Método + Path** | **Escopo OAuth** | **Parâmetros Chave** | **Paginação** | **Limites** | **Códigos de Erro** | **Observações** |
|-------------|-------------------|------------------|----------------------|---------------|-------------|---------------------|-----------------|
| **Autorização** | `GET /authorization` | N/A (público) | `response_type=code`, `client_id`, `redirect_uri`, `state`, `code_challenge`, `code_challenge_method` | N/A | N/A | 400, 403, 404 | **site_id=MLB**. PKCE suportado. HTTPS obrigatório |
| **Token Exchange** | `POST /oauth/token` | N/A (público) | `grant_type`, `client_id`, `client_secret`, `code`, `redirect_uri`, `code_verifier` | N/A | N/A | `invalid_client`, `invalid_grant`, `invalid_scope`, `unsupported_grant_type` | Troca code por access_token. TTL: 6h |
| **Refresh Token** | `POST /oauth/token` | N/A (público) | `grant_type=refresh_token`, `client_id`, `client_secret`, `refresh_token` | N/A | N/A | `invalid_grant`, `invalid_client` | Refresh token válido por 6 meses. Uso único |
| **Validar Token** | `GET /users/me` | `read` | `access_token` (header) | N/A | N/A | 401, 403 | Valida token e retorna dados do usuário autenticado |

---

## Itens & Buscas

| **Recurso** | **Método + Path** | **Escopo OAuth** | **Parâmetros Chave** | **Paginação** | **Limites** | **Códigos de Erro** | **Observações** |
|-------------|-------------------|------------------|----------------------|---------------|-------------|---------------------|-----------------|
| **Busca Pública** | `GET /sites/{site_id}/search` | N/A (público) | `q`, `category`, `seller_id`, `nickname`, `limit`, `offset` | `limit=50` (max 200), `offset` | N/A | 400, 404 | **site_id=MLB**. Busca nos listings ativos |
| **Busca por Vendedor** | `GET /sites/{site_id}/search` | N/A ou `read` | `seller_id`, `nickname`, `shipping_cost=free`, `sort` | `limit=50`, `offset` | N/A | 400, 404 | Filtros: `available_filters`, `available_sorts` |
| **Item por ID** | `GET /items/{id}` | N/A (público) | `item_id`, `attributes` (seleção de campos) | N/A | N/A | 404 | Dados completos do item. `available_quantity` em faixas |
| **Multiget Items** | `GET /items` | N/A ou `read` | `ids` (max 20), `attributes` | N/A | 20 itens/req | 400 | Formato: `ids=ID1,ID2,ID3`. Response em array com códigos |
| **Itens do Vendedor** | `GET /users/{user_id}/items/search` | `read` | `user_id`, `status`, `sku`, `seller_sku`, `orders`, `search_type=scan` | `limit=50` (max 100), `offset` | 1000 records (usar scan) | 401, 403, 404 | Suporte a scroll para +1000 itens |
| **Item com Health** | `GET /users/{user_id}/items/search` | `read` | `reputation_health_gauge=unhealthy\|warning\|healthy` | `limit=50`, `offset` | N/A | 401, 403 | Itens com perda de exposição (BR, MX, CL) |
| **Publicar Item** | `POST /items` | `write` | Payload JSON completo | N/A | N/A | 400, 403 | **site_id** obrigatório. Validações específicas por categoria |
| **Atualizar Item** | `PUT /items/{id}` | `write` | `item_id`, campos atualizáveis | N/A | N/A | 400, 403, 404 | Campos imutáveis: `category_id`, `listing_type_id` após publicação |
| **Pausar/Reativar** | `PUT /items/{id}` | `write` | `status=paused\|active\|closed` | N/A | N/A | 400, 403, 404 | Transições de estado específicas |

---

## Pedidos (Orders)

| **Recurso** | **Método + Path** | **Escopo OAuth** | **Parâmetros Chave** | **Paginação** | **Limites** | **Códigos de Erro** | **Observações** |
|-------------|-------------------|------------------|----------------------|---------------|-------------|---------------------|-----------------|
| **Buscar Pedidos** | `GET /marketplace/orders/search` | `read` | `seller.id`, `buyer`, `order.status`, `site`, `date_created.from/to`, `last_updated.from/to` | `limit=50` (max 1000), `offset` | 100 req/min | 401, 403, 404, 451 | Usar order ID do node `orders`, não do `id` raiz |
| **Pedido por ID** | `GET /marketplace/orders/{id}` | `read` | `order_id` | N/A | N/A | 401, 403, 404, 451 | Dados completos: buyer, seller, items, payments, shipping |
| **Invoice (Proforma)** | `GET /marketplace/orders/{id}/invoice` | `read` | `order_id` | N/A | N/A | 401, 403, 404 | PDF para declarações aduaneiras |
| **Billing Info** | `GET /marketplace/orders/{id}/billing_info` | `read` | `order_id` | N/A | N/A | 401, 403, 404 | Dados de faturamento separados do pedido principal |
| **Adicionar Atributos** | `POST /marketplace/orders/{id}/attributes` | `write` | `order_id`, `name="IMEI"`, `value` | N/A | N/A | 400 | Obrigatório para celulares na Colômbia (MCO1055) |
| **Pack Details** | `GET /marketplace/orders/pack/{pack_id}` | `read` | `pack_id` | N/A | N/A | 401, 403, 404 | Para pedidos divididos (shipment split) |

**Status de Pedidos:**
- `payment_required`: Pagamento pendente
- `payment_in_process`: Pagamento em processamento  
- `partially_paid`: Parcialmente pago
- `paid`: Pago (confirmado)
- `cancelled`: Cancelado
- `invalid`: Invalidado (comprador malicioso)

---

## Envios (Shipments)

| **Recurso** | **Método + Path** | **Escopo OAuth** | **Parâmetros Chave** | **Paginação** | **Limites** | **Códigos de Erro** | **Observações** |
|-------------|-------------------|------------------|----------------------|---------------|-------------|---------------------|-----------------|
| **Detalhes do Envio** | `GET /marketplace/shipments/{id}` | `read` | `shipment_id`, header: `x-format-new: true` | N/A | N/A | 401, 403, 404 | Mode: `me1`/`me2`. Logistic type: `fulfillment`/`drop_off`/`cross_docking` |
| **Custo do Envio** | `GET /marketplace/shipments/{id}/costs` | `read` | `shipment_id`, header: `x-format-new: true` | N/A | N/A | 401, 403, 404 | `gross_amount`, `discounts`, `compensations` |
| **Custo por Item** | `GET /marketplace/items/{id}/shipping_options/cost` | `read` | `item_id` | N/A | N/A | 401, 403, 404 | `shipping_fee`, `billable_weight`, `free_shipping` |
| **Etiqueta (Label)** | `GET /marketplace/shipments/{id}/labels` | `read` | `shipment_id` | N/A | N/A | 401, 403, 404, 401 (unauthorized_scopes) | PDF. Status deve ser `ready_to_ship` |
| **Informar Tracking** | `POST /marketplace/shipments/{id}/tracking` | `write` | `shipment_id`, `tracking_id`, `tracking_url`, `carrier` | N/A | N/A | 401, 403, 404 | Apenas para `me1` (logística própria) |
| **Status do Envio** | `POST /marketplace/shipments/{id}/tracking/status` | `write` | `shipment_id`, `tracking_id`, `status=delivered\|not_delivered` | N/A | N/A | 400, 401, 403, 404 | Status final e irreversível |
| **Itens do Envio** | `GET /marketplace/shipments/{id}/items` | `read` | `shipment_id` | N/A | N/A | 401, 403, 404 | Lista de itens com variações, dimensões, `order_id` |
| **Lead Time** | `GET /marketplace/shipments/{id}/lead_time` | `read` | `shipment_id` | N/A | N/A | 401, 403, 404 | Prazos de envio: `estimated_handling_limit`, `estimated_delivery_limit` |
| **Histórico** | `GET /marketplace/shipments/{id}/history` | `read` | `shipment_id` | N/A | N/A | 401, 403, 404 | Histórico de status e substatus |
| **Informações da Transportadora** | `GET /marketplace/shipments/{id}/carrier` | `read` | `shipment_id` | N/A | N/A | 401, 403, 404 | Nome e URL de tracking da transportadora |
| **Split de Envio** | `POST /marketplace/shipments/{id}/split` | `write` | `shipment_id`, `reason`, `packs`, header: `x-format-new: true` | N/A | N/A | 400, 403, 422 | Apenas ME2 drop-off/cross-docking. Max 2 pacotes |

**Status de Envios:**
- `pending`: Criado
- `handling`: Pagamento processado
- `ready_to_ship`: Etiqueta disponível
- `shipped`: Em trânsito
- `delivered`: Entregue
- `not_delivered`: Não entregue
- `cancelled`: Cancelado

---

## Perguntas & Respostas

| **Recurso** | **Método + Path** | **Escopo OAuth** | **Parâmetros Chave** | **Paginação** | **Limites** | **Códigos de Erro** | **Observações** |
|-------------|-------------------|------------------|----------------------|---------------|-------------|---------------------|-----------------|
| **Buscar Perguntas** | `GET /marketplace/questions/search` | `read` | `seller_id`, `item`, `from`, `status`, `sort_fields`, `sort_types` | `limit=50`, `offset` (max 1000) | N/A | 401, 403, 404 | Filtros: `ANSWERED`, `UNANSWERED`, `BANNED`, etc. |
| **Pergunta por ID** | `GET /marketplace/questions/{id}` | `read` | `question_id` | N/A | N/A | 401, 403, 404 | Detalhes completos incluindo `answer` |
| **Responder Pergunta** | `POST /marketplace/answers` | `write` | `question_id`, `text`, `text_translated` | N/A | N/A | 400 (`invalid_question`, `invalid_post_body`) | Máximo 2000 caracteres |
| **Deletar Pergunta** | `DELETE /marketplace/questions/{id}` | `write` | `question_id` | N/A | N/A | 401, 403, 404 | Apenas o vendedor pode deletar |

**Status de Perguntas:**
- `UNANSWERED`: Não respondida
- `ANSWERED`: Respondida
- `CLOSED_UNANSWERED`: Produto fechado sem resposta
- `UNDER_REVIEW`: Em revisão
- `BANNED`: Banida
- `DELETED`: Deletada
- `DISABLED`: Desabilitada

---

## Categorias & Sites

| **Recurso** | **Método + Path** | **Escopo OAuth** | **Parâmetros Chave** | **Paginação** | **Limites** | **Códigos de Erro** | **Observações** |
|-------------|-------------------|------------------|----------------------|---------------|-------------|---------------------|-----------------|
| **Lista de Sites** | `GET /sites` | N/A (público) | N/A | N/A | N/A | N/A | Inclui **MLB** (Brasil), MLA (Argentina), MLM (México) |
| **Site por ID** | `GET /sites/{site_id}` | N/A (público) | `site_id` | N/A | N/A | 404 | **site_id=MLB** para Brasil |
| **Categorias do Site** | `GET /sites/{site_id}/categories` | N/A (público) | `site_id` | N/A | N/A | 404 | Hierarquia de categorias para **MLB** |
| **Categoria por ID** | `GET /categories/{category_id}` | N/A (público) | `category_id` | N/A | N/A | 404 | Atributos, path hierárquico |
| **Predição de Categoria** | `GET /sites/{site_id}/category_predictor/predict` | N/A (público) | `title`, `site_id` | N/A | N/A | 400, 404 | ML sugere categoria baseada no título |
| **Moedas** | `GET /currencies` | N/A (público) | N/A | N/A | N/A | N/A | Lista de moedas suportadas |
| **Países** | `GET /countries` | N/A (público) | N/A | N/A | N/A | N/A | Lista de países |
| **Métodos de Pagamento** | `GET /sites/{site_id}/payment_methods` | N/A (público) | `site_id` | N/A | N/A | 404 | Métodos disponíveis para **MLB** |

---

## Usuários

| **Recurso** | **Método + Path** | **Escopo OAuth** | **Parâmetros Chave** | **Paginação** | **Limites** | **Códigos de Erro** | **Observações** |
|-------------|-------------------|------------------|----------------------|---------------|-------------|---------------------|-----------------|
| **Usuário Autenticado** | `GET /users/me` | `read` | `access_token` (header) | N/A | N/A | 401, 403 | Dados do usuário logado |
| **Usuário por ID** | `GET /users/{user_id}` | N/A ou `read` | `user_id` | N/A | N/A | 404, 451 | Dados públicos ou privados conforme escopo |
| **Multiget Usuários** | `GET /users` | N/A ou `read` | `ids` (max 20) | N/A | 20 usuários/req | 400 | Formato: `ids=ID1,ID2,ID3` |
| **Endereços** | `GET /users/{user_id}/addresses` | `read` | `user_id` | N/A | N/A | 401, 403, 404 | Endereços de envio/cobrança |
| **Aplicações Autorizadas** | `GET /users/{user_id}/applications/{app_id}` | `read` | `user_id`, `app_id` | N/A | N/A | 401, 403, 404 | Verificar permissões da aplicação |

---

## Notificações (Webhooks)

| **Recurso** | **Método + Path** | **Escopo OAuth** | **Parâmetros Chave** | **Paginação** | **Limites** | **Códigos de Erro** | **Observações** |
|-------------|-------------------|------------------|----------------------|---------------|-------------|---------------------|-----------------|
| **Configurar Webhook** | N/A (via Portal) | N/A | `callback_url`, `topics` | N/A | N/A | N/A | Configuração no Application Manager |
| **Histórico de Feeds** | `GET /myfeeds` | `read` | `app_id`, `topic`, `limit`, `offset` | `limit=10`, `offset` | N/A | 401, 403 | Histórico de notificações enviadas |
| **Feeds Perdidos** | `GET /missed_feeds` | `read` | `app_id` | N/A | N/A | 401, 403 | Notificações não confirmadas (HTTP 200) |

**Tópicos Disponíveis:**
- `items`: Mudanças em itens publicados
- `marketplace_items`: Mudanças em itens do marketplace
- `marketplace_orders`: Novos pedidos criados
- `marketplace_questions`: Perguntas feitas/respondidas
- `marketplace_messages`: Mensagens pós-venda
- `marketplace_shipments`: Mudanças em envios
- `marketplace_claims`: Reclamações relacionadas
- `marketplace_fbm_stock`: Operações de estoque fulfillment
- `marketplace_item_competition`: Competição de catálogo
- `public_offers`: Ofertas em itens
- `public_candidates`: Convites para promoções

**Configuração Crítica:**
- Callback deve retornar HTTP 200 em até 500ms
- Tentativas em intervalos exponenciais por 1 hora
- IPs das notificações: 54.88.218.97, 18.215.140.160, 18.213.114.129, 18.206.34.84

---

## Mensagens

| **Recurso** | **Método + Path** | **Escopo OAuth** | **Parâmetros Chave** | **Paginação** | **Limites** | **Códigos de Erro** | **Observações** |
|-------------|-------------------|------------------|----------------------|---------------|-------------|---------------------|-----------------|
| **Mensagem por ID** | `GET /marketplace/messages/{message_id}` | `read` | `message_id` | N/A | N/A | 401, 403, 404 | Mensagens pós-venda entre buyer/seller |
| **Enviar Mensagem** | `POST /marketplace/messages` | `write` | Payload específico | N/A | N/A | 400, 401, 403 | Comunicação pós-venda |

---

## Utilitários

| **Recurso** | **Método + Path** | **Escopo OAuth** | **Parâmetros Chave** | **Paginação** | **Limites** | **Códigos de Erro** | **Observações** |
|-------------|-------------------|------------------|----------------------|---------------|-------------|---------------------|-----------------|
| **Status da API** | `GET /sites/{site_id}` | N/A (público) | `site_id` | N/A | N/A | N/A | Health check básico |
| **Listing Validator** | Ferramenta Web | N/A | N/A | N/A | N/A | N/A | Validação de estrutura de anúncios |
| **Time Zones** | `GET /countries/{country_id}` | N/A (público) | `country_id` | N/A | N/A | 404 | Fusos horários por país |

---

## Observações Gerais

### Rate Limits Documentados
- **Orders Search**: 100 requisições/minuto
- **OAuth Token Refresh**: Uso único por refresh_token
- **Multiget**: Máximo 20 recursos por chamada
- **Webhook Response**: HTTP 200 em até 500ms

### Site ID para Brasil
- **Sempre usar `site_id=MLB`** para operações no mercado brasileiro
- Endpoints que exigem site_id: busca, categorias, métodos de pagamento

### Campos Imutáveis (Após Publicação)
- `category_id`: Categoria não pode ser alterada
- `listing_type_id`: Tipo de anúncio fixo
- `site_id`: Marketplace de origem

### Paginação Padrão
- `limit`: 50 (padrão), máximo geralmente 100-200
- `offset`: Para navegação sequencial
- **Scroll**: Para conjuntos >1000 registros (usar `search_type=scan`)

### Códigos de Erro Comuns
- **400**: `bad_request` - Parâmetros inválidos
- **401**: `invalid_token` - Token inválido/expirado  
- **403**: `forbidden` - Sem permissão para o recurso
- **404**: `not_found` - Recurso não encontrado
- **429**: `local_rate_limited` - Limite de requisições excedido
- **451**: `unavailable.for.legal.reasons` - Usuário restrito

### Autenticação
- **Header**: `Authorization: Bearer ACCESS_TOKEN`
- **Escopo mínimo**: `read` para consultas, `write` para modificações
- **Escopo offline**: `offline_access` para refresh_token
