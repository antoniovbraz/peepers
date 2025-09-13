# Perguntas e Respostas

**Última atualização em 05/06/2025**

**Nota:**
Por segurança, você pode obter o e-mail, telefone e nome do comprador em `/questions/$QUESTION_ID`.
Use o parâmetro `api_version=4` e obtenha as perguntas e respostas com a nova estrutura.

Os seguintes exemplos servirão para gerenciar perguntas e respostas.

## Principais Endpoints

| Recurso | Descrição | Método |
|---------|-----------|---------|
| `/questions/search?item=$ITEM_ID` | Busca uma pergunta feita nos items do usuário | GET |
| `/questions` | Fazer perguntas sobre os items de outros usuários | POST |
| `/answers` | Responder às perguntas realizadas em seus items | POST |
| `/questions/$QUESTION_ID` | Obter informação de uma pergunta específica de um ID | GET |
| `/block-api/search/users/$USER_ID` | Consultar os bloqueios associados a um user | GET |
| `/my/received_questions/search` | Perguntas recebidas por usuário | GET |

## 1. Buscar Perguntas por Item

### Endpoint:
```bash
GET /questions/search?item_id=$ITEM_ID
```

### Exemplo de Requisição:
```bash
curl -X GET -H 'Authorization: Bearer $ACCESS_TOKEN' \
https://api.mercadolibre.com/questions/search?item_id=MLA608007087
```

### Exemplo de Resposta:
```json
{
    "total": 0,
    "limit": 50,
    "questions": [],
    "filters": {
        "limit": 50,
        "offset": 0,
        "api_version": "4",
        "is_admin": false,
        "sorts": [],
        "caller": 447594313,
        "item": "MLA608007087"
    },
    "available_filters": [
        {
            "id": "from",
            "name": "From user id",
            "type": "number"
        },
        {
            "id": "seller",
            "name": "Seller id",
            "type": "number"
        },
        {
            "id": "status",
            "name": "Status",
            "type": "text",
            "values": [
                "ANSWERED",
                "BANNED",
                "CLOSED_UNANSWERED",
                "DELETED",
                "DISABLED",
                "UNANSWERED",
                "UNDER_REVIEW"
            ]
        }
    ],
    "available_sorts": [
        "item_id",
        "from_id",
        "date_created",
        "seller_id"
    ]
}
```

## 2. Fazer uma Pergunta

### Endpoint:
```bash
POST /questions
```

### Exemplo de Requisição:
```bash
curl -X POST -H 'Authorization: Bearer $ACCESS_TOKEN' \
-H "Content-Type: application/json" -d '{
   "text":"Test question.",
   "item_id":"MLA608007087"
}' https://api.mercadolibre.com/questions
```

### Exemplo de Resposta:
```json
{
    "id": 3957150025,
    "answer": null,
    "date_created": "2016-02-29T11:19:42.957-04:00",
    "item_id": "MLA608007087",
    "seller_id": 202593498,
    "status": "UNANSWERED",
    "text": "Test question.",
    "from": {
        "id": 207119838
    }
}
```

## 3. Responder uma Pergunta

### Endpoint:
```bash
POST /answers
```

### Exemplo de Requisição:
```bash
curl -X POST -H 'Authorization: Bearer $ACCESS_TOKEN' \
-H "Content-Type: application/json" -d '{
    "question_id": 3957150025, 
    "text":"Test answer..." 
}' https://api.mercadolibre.com/answers
```

### Exemplo de Resposta:
```json
{
    "id": 3957150025,
    "answer": {
        "date_created": "2016-02-29T11:21:27.831-04:00",
        "status": "ACTIVE",
        "text": "Test answer..."
    },
    "date_created": "2016-02-29T11:19:42.000-04:00",
    "deleted_from_listing": false,
    "hold": false,
    "item_id": "MLA608007087",
    "seller_id": 202593498,
    "status": "ANSWERED",
    "text": "Test question.",
    "from": {
        "id": 207119838,
        "answered_questions": 0
    }
}
```

## 4. Obter Detalhes de uma Pergunta

### Endpoint:
```bash
GET /questions/$QUESTION_ID
```

### Exemplo de Requisição:
```bash
curl -X GET -H 'Authorization: Bearer $ACCESS_TOKEN' \
https://api.mercadolibre.com/questions/3957150025
```

### Exemplo de Resposta:
```json
{
  "id": 3957150025,
  "answer": {
    "date_created": "2016-02-29T11:21:27.000-04:00",
    "status": "ACTIVE",
    "text": "Test answer..."
  },
  "date_created": "2016-02-29T11:19:42.000-04:00",
  "deleted_from_listing": false,
  "hold": false,
  "item_id": "MLA608007087",
  "seller_id": 202593498,
  "status": "ANSWERED",
  "text": "Test question.",
  "from": {
    "id": 207119838,
    "answered_questions": 1
  }
}
```

## 5. Verificar Usuários Bloqueados

### Endpoint:
```bash
GET /block-api/search/users/$USER_ID?type=blocked_by_questions
```

### Exemplo de Requisição:
```bash
curl -X GET -H 'Authorization: Bearer $ACCESS_TOKEN' \
'https://api.mercadolibre.com/block-api/search/users/72641919?type=blocked_by_questions'
```

### Resposta (usuários bloqueados):
```json
{
    "users": [
        {
            "id": 11111111,
            "blocked_at": "2024-02-07T15:04:05Z"
        }
    ],
    "paging": {
        "offset": 0,
        "limit": 10,
        "total": 1
    }
}
```

### Resposta (nenhum usuário bloqueado):
```json
{ 
    "users": [],
    "paging": { 
        "total": 0, 
        "limit": 10,
        "offset": 0 
    } 
}
```

## 6. Perguntas Recebidas

### Endpoint:
```bash
GET /my/received_questions/search
```

### Exemplo de Requisição:
```bash
curl -X GET -H 'Authorization: Bearer $ACCESS_TOKEN' \
https://api.mercadolibre.com/my/received_questions/search
```

### Exemplo de Resposta:
```json
{
    "total": 3,
    "limit": 50,
    "questions": [
        {
            "date_created": "2020-04-14T16:30:02.000-04:00",
            "item_id": "MLB1494945960",
            "seller_id": 447594313,
            "status": "ANSWERED",
            "text": "Olá, vc teria máscaras com filtro tbm? E com estampas personalizada tipo de desenho animado?",
            "id": 6940134223,
            "deleted_from_listing": false,
            "hold": false,
            "answer": {
                "text": "Olá Tudo bem? Temos sim o filtro interno e diversas estampas. =)",
                "status": "ACTIVE",
                "date_created": "2020-04-14T19:53:43.069-04:00"
            },
            "from": {
                "id": 546874560
            }
        },
        {
            "date_created": "2020-04-26T00:47:49.000-04:00",
            "item_id": "MLB1494945960",
            "seller_id": 447594313,
            "status": "ANSWERED",
            "text": "Tem cm escolher as estampas?",
            "id": 6994706979,
            "deleted_from_listing": false,
            "hold": false,
            "answer": {
                "text": "",
                "status": "BANNED",
                "date_created": "2020-04-26T10:14:18.529-04:00"
            },
            "from": {
                "id": 212866079
            }
        }
    ],
    "filters": {
        "limit": 50,
        "offset": 0,
        "api_version": "4"
    }
}
```

## 7. Status das Perguntas

### Status Disponíveis:
- **`ANSWERED`:** Pergunta respondida
- **`BANNED`:** Pergunta banida/bloqueada
- **`CLOSED_UNANSWERED`:** Pergunta fechada sem resposta
- **`DELETED`:** Pergunta deletada
- **`DISABLED`:** Pergunta desabilitada
- **`UNANSWERED`:** Pergunta não respondida
- **`UNDER_REVIEW`:** Pergunta em análise

### Status das Respostas:
- **`ACTIVE`:** Resposta ativa e visível
- **`BANNED`:** Resposta banida/bloqueada

## 8. Filtros Disponíveis

### Por Status:
```bash
?status=UNANSWERED
?status=ANSWERED
```

### Por Usuário:
```bash
?from=USER_ID
?seller=SELLER_ID
```

### Por Data:
```bash
?date_created.from=2023-01-01
?date_created.to=2023-12-31
```

## 9. Ordenação

### Opções Disponíveis:
- **`item_id`:** Por ID do item
- **`from_id`:** Por ID do usuário que perguntou
- **`date_created`:** Por data de criação
- **`seller_id`:** Por ID do vendedor

### Exemplo:
```bash
curl -X GET -H 'Authorization: Bearer $ACCESS_TOKEN' \
'https://api.mercadolibre.com/my/received_questions/search?sort=date_created'
```

## 10. Paginação

### Parâmetros:
- **`limit`:** Número máximo de resultados (máximo 50)
- **`offset`:** Número de resultados a pular

### Exemplo:
```bash
curl -X GET -H 'Authorization: Bearer $ACCESS_TOKEN' \
'https://api.mercadolibre.com/my/received_questions/search?limit=20&offset=0'
```

## Boas Práticas

1. **Responda rapidamente** às perguntas para melhorar sua reputação
2. **Use a API versão 4** para obter informações completas do comprador
3. **Monitore usuários bloqueados** para evitar spam
4. **Configure notificações** para novas perguntas
5. **Implemente filtros** para organizar perguntas por status
6. **Use paginação** para grandes volumes de perguntas
7. **Mantenha respostas profissionais** e informativas

