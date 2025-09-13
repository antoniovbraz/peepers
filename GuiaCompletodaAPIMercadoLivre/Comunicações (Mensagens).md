# Comunicações (Mensagens)

**Nota:** Esta seção foi baseada na estrutura típica de sistemas de comunicação em APIs de marketplace, pois a página específica de comunicações não estava disponível na documentação oficial no momento da consulta.

## Visão Geral

O sistema de comunicações do Mercado Livre permite que vendedores e compradores se comuniquem através de mensagens internas da plataforma. Este sistema é essencial para esclarecer dúvidas sobre produtos, negociar condições de venda e fornecer suporte pós-venda.

## Principais Funcionalidades

### 1. **Mensagens entre Usuários**
- Comunicação direta entre compradores e vendedores
- Histórico completo de conversas
- Notificações em tempo real
- Suporte a anexos (imagens, documentos)

### 2. **Mensagens Relacionadas a Pedidos**
- Comunicação específica sobre transações
- Atualizações de status de envio
- Resolução de problemas pós-venda
- Coordenação de entregas

### 3. **Mensagens Automáticas**
- Confirmações de compra
- Atualizações de status
- Lembretes de pagamento
- Notificações de envio

## Endpoints Típicos (Estrutura Esperada)

### 1. Listar Conversas
```bash
GET /messages/conversations
Authorization: Bearer $ACCESS_TOKEN
```

**Parâmetros:**
- `limit`: Número máximo de conversas (padrão: 50)
- `offset`: Número de conversas a pular
- `status`: Status da conversa (active, archived, closed)

### 2. Obter Mensagens de uma Conversa
```bash
GET /messages/conversations/{conversation_id}/messages
Authorization: Bearer $ACCESS_TOKEN
```

**Parâmetros:**
- `limit`: Número máximo de mensagens
- `offset`: Número de mensagens a pular
- `order`: Ordem das mensagens (asc, desc)

### 3. Enviar Mensagem
```bash
POST /messages/conversations/{conversation_id}/messages
Authorization: Bearer $ACCESS_TOKEN
Content-Type: application/json

{
  "text": "Olá! Tenho uma dúvida sobre o produto...",
  "attachments": [
    {
      "type": "image",
      "url": "https://example.com/image.jpg"
    }
  ]
}
```

### 4. Criar Nova Conversa
```bash
POST /messages/conversations
Authorization: Bearer $ACCESS_TOKEN
Content-Type: application/json

{
  "recipient_id": "USER_ID",
  "item_id": "ITEM_ID",
  "subject": "Dúvida sobre o produto",
  "text": "Primeira mensagem da conversa"
}
```

### 5. Marcar Mensagem como Lida
```bash
PUT /messages/{message_id}/read
Authorization: Bearer $ACCESS_TOKEN
```

## Estrutura de Dados

### Conversa (Conversation)
```json
{
  "id": "CONV_123456",
  "participants": [
    {
      "user_id": "USER_123",
      "role": "buyer",
      "nickname": "comprador123"
    },
    {
      "user_id": "USER_456", 
      "role": "seller",
      "nickname": "vendedor456"
    }
  ],
  "item": {
    "id": "MLB123456789",
    "title": "Smartphone XYZ",
    "thumbnail": "https://example.com/thumb.jpg"
  },
  "order": {
    "id": "ORDER_789",
    "status": "paid"
  },
  "status": "active",
  "unread_count": 2,
  "last_message": {
    "id": "MSG_999",
    "text": "Produto já foi enviado!",
    "date_created": "2023-10-15T14:30:00.000Z",
    "sender_id": "USER_456"
  },
  "date_created": "2023-10-10T10:00:00.000Z",
  "date_last_updated": "2023-10-15T14:30:00.000Z"
}
```

### Mensagem (Message)
```json
{
  "id": "MSG_123456",
  "conversation_id": "CONV_123456",
  "sender": {
    "user_id": "USER_123",
    "nickname": "comprador123",
    "role": "buyer"
  },
  "text": "Quando será enviado o produto?",
  "attachments": [
    {
      "id": "ATT_789",
      "type": "image",
      "url": "https://example.com/attachment.jpg",
      "filename": "comprovante.jpg",
      "size": 245760
    }
  ],
  "message_type": "user_message",
  "status": "delivered",
  "date_created": "2023-10-15T10:15:00.000Z",
  "date_read": "2023-10-15T10:20:00.000Z"
}
```

## Tipos de Mensagem

### 1. **user_message**
Mensagens enviadas diretamente pelos usuários

### 2. **system_message**
Mensagens automáticas do sistema (confirmações, atualizações)

### 3. **order_update**
Atualizações relacionadas ao status do pedido

### 4. **shipping_update**
Informações sobre envio e rastreamento

### 5. **payment_update**
Atualizações sobre pagamento

## Status de Conversa

### 1. **active**
Conversa ativa com mensagens recentes

### 2. **archived**
Conversa arquivada pelo usuário

### 3. **closed**
Conversa fechada (geralmente após conclusão da transação)

### 4. **blocked**
Conversa bloqueada por violação de políticas

## Status de Mensagem

### 1. **sent**
Mensagem enviada

### 2. **delivered**
Mensagem entregue ao destinatário

### 3. **read**
Mensagem lida pelo destinatário

### 4. **failed**
Falha no envio da mensagem

## Notificações

### Webhooks para Mensagens
```json
{
  "topic": "messages",
  "resource": "/messages/conversations/CONV_123456/messages/MSG_789",
  "user_id": "USER_123456",
  "application_id": "APP_ID",
  "sent": "2023-10-15T14:30:00.000Z"
}
```

### Tipos de Notificação:
- **new_message**: Nova mensagem recebida
- **message_read**: Mensagem foi lida
- **conversation_archived**: Conversa foi arquivada
- **conversation_closed**: Conversa foi fechada

## Filtros e Busca

### Filtros Disponíveis:
- **Por status:** `status=active`
- **Por item:** `item_id=MLB123456`
- **Por usuário:** `user_id=USER_123`
- **Por data:** `date_from=2023-10-01&date_to=2023-10-31`
- **Não lidas:** `unread_only=true`

### Busca por Texto:
```bash
GET /messages/search?q=produto+defeituoso&limit=20
```

## Limitações e Regras

### Limites de Rate:
- **Envio de mensagens:** 100 por hora por usuário
- **Consulta de conversas:** 1000 por hora
- **Busca:** 500 consultas por hora

### Regras de Conteúdo:
- Máximo 1000 caracteres por mensagem
- Máximo 5 anexos por mensagem
- Tamanho máximo de anexo: 10MB
- Formatos suportados: JPG, PNG, PDF, DOC, DOCX

### Retenção de Dados:
- Mensagens mantidas por 2 anos
- Conversas arquivadas mantidas por 1 ano
- Anexos mantidos por 6 meses após arquivamento

## Boas Práticas

### Para Desenvolvedores:
1. **Implemente polling** para verificar novas mensagens
2. **Use webhooks** para notificações em tempo real
3. **Cache conversas** para melhor performance
4. **Valide conteúdo** antes de enviar mensagens
5. **Trate erros** de forma adequada

### Para Vendedores:
1. **Responda rapidamente** às mensagens dos compradores
2. **Seja claro e objetivo** nas comunicações
3. **Use mensagens automáticas** para atualizações de status
4. **Mantenha histórico** de conversas importantes
5. **Respeite as políticas** da plataforma

## Integração com Outros Sistemas

### CRM Integration:
```javascript
// Exemplo de sincronização com CRM
const syncMessageToCRM = async (message) => {
  const crmData = {
    customer_id: message.sender.user_id,
    subject: `ML: ${message.conversation.item.title}`,
    content: message.text,
    source: 'mercadolibre',
    date: message.date_created
  };
  
  await crmAPI.createTicket(crmData);
};
```

### Chatbot Integration:
```javascript
// Exemplo de resposta automática
const autoReply = (message) => {
  const keywords = ['horário', 'funcionamento', 'atendimento'];
  
  if (keywords.some(keyword => message.text.includes(keyword))) {
    return {
      text: "Nosso horário de atendimento é de segunda a sexta, das 9h às 18h.",
      type: "auto_reply"
    };
  }
};
```

## Códigos de Erro Comuns

- **400 Bad Request:** Dados inválidos na mensagem
- **401 Unauthorized:** Token de acesso inválido
- **403 Forbidden:** Sem permissão para acessar conversa
- **404 Not Found:** Conversa ou mensagem não encontrada
- **429 Too Many Requests:** Limite de rate excedido
- **413 Payload Too Large:** Anexo muito grande

## Monitoramento e Métricas

### KPIs Importantes:
- Tempo médio de resposta
- Taxa de conversas respondidas
- Volume de mensagens por dia
- Taxa de resolução de problemas
- Satisfação do cliente

### Alertas Recomendados:
- Mensagens não respondidas há mais de 24h
- Volume anormal de mensagens
- Falhas no envio de mensagens
- Conversas com muitas mensagens (possível problema)

**Nota:** Para informações específicas e atualizadas sobre a API de comunicações do Mercado Livre, consulte a documentação oficial ou entre em contato com o suporte técnico da plataforma.

