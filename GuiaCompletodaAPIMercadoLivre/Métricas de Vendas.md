# Métricas de Vendas

**Última atualização em 14/03/2023**

Os seguintes exemplos servirão para conhecer nosso recurso de métricas.

## 1. Visitas de Itens por Usuário

### Endpoint: `/users/$USER_ID/items_visits`

Obtém o número de visitas que um usuário teve em seus itens durante um período específico.

#### Parâmetros:
- **`date_from`:** Data de início (formato ISO 8601)
- **`date_to`:** Data de fim (formato ISO 8601)

#### Exemplo de Chamada:
```bash
curl -X GET -H 'Authorization: Bearer $ACCESS_TOKEN' \
https://api.mercadolibre.com/users/206946886/items_visits?date_from=2016-01-01T00:00:00.000-00:00&date_to=2016-02-10T00:00:00.000-00:00
```

#### Exemplo de Resposta:
```json
{
  "user_id": 206946886,
  "date_from": "2016-01-01T00:00:00.000-00:00",
  "date_to": "2016-02-10T00:00:00.000-00:00",
  "total_visits": 0,
  "visits_detail": []
}
```

## 2. Visitas por Usuário e Tempo (Time Window)

### Endpoint: `/users/$USER_ID/items_visits/time_window`

Devolve as visitas de um usuário em cada item publicado durante um período de tempo. O detalhe da informação é agrupado por intervalos de tempo.

#### Parâmetros:
- **`last`:** Número de unidades de tempo
- **`unit`:** Unidade de tempo (day, hour, week, month)
- **`ending`:** (Opcional) Data de fim específica

#### Exemplo de Chamada:
```bash
curl -X GET -H 'Authorization: Bearer $ACCESS_TOKEN' \
https://api.mercadolibre.com/users/52366166/items_visits/time_window?last=2&unit=day
```

#### Exemplo de Resposta:
```json
{
    "user_id": 52366166,
    "date_from": "2021-06-16T00:00:00Z",
    "date_to": "2021-06-18T00:00:00Z",
    "total_visits": 0,
    "last": 2,
    "unit": "day",
    "results": [
        {
            "date": "2021-06-16T00:00:00Z",
            "total": 0,
            "visits_detail": []
        },
        {
            "date": "2021-06-17T00:00:00Z",
            "total": 0,
            "visits_detail": []
        }
    ]
}
```

## 3. Total de Perguntas por Usuário

### Endpoint: `/users/$USER_ID/contacts/questions`

Devolve o total de perguntas de um usuário específico em todos os itens publicados num intervalo de datas.

#### Parâmetros:
- **`date_from`:** Data de início
- **`date_to`:** Data de fim

#### Exemplo de Chamada:
```bash
curl -X GET -H 'Authorization: Bearer $ACCESS_TOKEN' \
https://api.mercadolibre.com/items/MLV421672596/contacts/questions?date_from=2014-08-01T00:00:00.000-03:00&date_to=2014-08-02T23:59:59.999
```

#### Exemplo de Resposta:
```json
{
    "date_from": "2014-08-01T00:00:00.000-03:00",
    "date_to": "2014-08-02T23:59:59.999",
    "item_id": "MLV421672596",
    "total": 9
}
```

## 4. Perguntas por Time Window

### Endpoint: `/users/$USER_ID/contacts/questions/time_window`

O recurso permite obter as perguntas realizadas num determinado tempo nos itens publicados por um seller.

#### Parâmetros:
- **`last`:** Número de unidades de tempo
- **`unit`:** Unidade de tempo (hour, day, week, month)

#### Exemplo de Chamada:
```bash
curl -X GET -H 'Authorization: Bearer $ACCESS_TOKEN' \
https://api.mercadolibre.com/items/MLA510272257/contacts/questions/time_window?last=2&unit=hour
```

#### Exemplo de Resposta:
```json
{
    "total": 0,
    "last": "2",
    "unit": "hour",
    "date_from": "2021-06-18T18:00:00Z",
    "date_to": "2021-06-18T20:00:00Z",
    "item_id": "MLA510272257",
    "results": [
        {
            "date": "2021-06-18T18:00:00Z",
            "total": 0
        },
        {
            "date": "2021-06-18T19:00:00Z",
            "total": 0
        }
    ]
}
```

## 5. Visualizações de Telefone

### Endpoint: `/users/$USER_ID/contacts/phone_views`

Pode obter a quantidade de vezes que fizeram clique em "Ver telefone" dentro de um item durante um período de tempo.

#### Parâmetros:
- **`date_from`:** Data de início
- **`date_to`:** Data de fim

#### Exemplo de Chamada:
```bash
curl -X GET -H 'Authorization: Bearer $ACCESS_TOKEN' \
https://api.mercadolibre.com/users/52366166/contacts/phone_views?date_from=2014-05-28T00:00:00.000-03:00&date_to=2014-05-29T23:59:59.999
```

#### Exemplo de Resposta:
```json
{
    "date_from": "2014-05-28T00:00:00.000-03:00",
    "date_to": "2014-05-29T23:59:59.999",
    "total": 71,
    "user_id": "52366166"
}
```

## 6. Visualizações de Telefone por Time Window

### Endpoint: `/users/$USER_ID/contacts/phone_views/time_window`

Devolve a quantidade de vezes que foi clicado na opção "ver telefone" para cada item de um usuário num intervalo de datas.

#### Parâmetros:
- **`last`:** Número de unidades de tempo
- **`unit`:** Unidade de tempo
- **`ending`:** (Opcional) Data de fim específica

#### Exemplo de Chamada:
```bash
curl -X GET -H 'Authorization: Bearer $ACCESS_TOKEN' \
https://api.mercadolibre.com/items/contacts/phone_views/time_window?ids=MLA510272257,MLA489747739&last=2&unit=hour&ending=2014-05-28T00:00:00.000-03:00
```

#### Exemplo de Resposta:
```json
[
    {
        "total": 0,
        "last": "2",
        "unit": "hour",
        "date_from": "2021-06-18T18:00:00Z",
        "date_to": "2021-06-18T20:00:00Z",
        "item_id": "MLA510272257",
        "results": [
            {
                "date": "2021-06-18T18:00:00Z",
                "total": 0
            },
            {
                "date": "2021-06-18T19:00:00Z",
                "total": 0
            }
        ]
    },
    {
        "total": 0,
        "last": "2",
        "unit": "hour",
        "date_from": "2021-06-18T18:00:00Z",
        "date_to": "2021-06-18T20:00:00Z",
        "item_id": "MLA489747739",
        "results": [
            {
                "date": "2021-06-18T18:00:00Z",
                "total": 0
            },
            {
                "date": "2021-06-18T19:00:00Z",
                "total": 0
            }
        ]
    }
]
```

## 7. Visitas de Itens (Multi-Get)

### Endpoint: `/items/visits`

Devolve as visitas do item usando Multi-Get para múltiplos itens simultaneamente.

#### Parâmetros:
- **`ids`:** Lista de IDs de itens separados por vírgula
- **`date_from`:** Data de início
- **`date_to`:** Data de fim

#### Exemplo de Chamada:
```bash
curl -X GET -H 'Authorization: Bearer $ACCESS_TOKEN' \
https://api.mercadolibre.com/items/visits?ids=MLA506635149,MLA506634973,MLA503004418&date_from=2014-06-01T00:00:00.000-00:00&date_to=2014-06-10T00:00:00.000-00:00
```

#### Exemplo de Resposta:
```json
[
    {
        "item_id": "MLA506635149",
        "date_from": "2014-06-01T00:00:00.000-00:00",
        "date_to": "2014-06-10T00:00:00.000-00:00",
        "total_visits": 134,
        "visits_detail": [
            {
                "company": "mercadolibre",
                "quantity": 134
            }
        ]
    },
    {
        "item_id": "MLA506634973",
        "date_from": "2014-06-01T00:00:00.000-00:00",
        "date_to": "2014-06-10T00:00:00.000-00:00",
        "total_visits": 122,
        "visits_detail": [
            {
                "company": "mercadolibre",
                "quantity": 122
            }
        ]
    },
    {
        "item_id": "MLA503004418",
        "date_from": "2014-06-01T00:00:00.000-00:00",
        "date_to": "2014-06-10T00:00:00.000-00:00",
        "total_visits": 355,
        "visits_detail": [
            {
                "company": "mercadolibre",
                "quantity": 355
            }
        ]
    }
]
```

## Unidades de Tempo Suportadas

### Para parâmetro `unit`:
- **`hour`:** Por hora
- **`day`:** Por dia
- **`week`:** Por semana
- **`month`:** Por mês

## Formato de Datas

Todas as datas devem seguir o formato ISO 8601:
- **Formato:** `YYYY-MM-DDTHH:mm:ss.sss-HH:mm`
- **Exemplo:** `2016-01-01T00:00:00.000-00:00`

## Principais Métricas Disponíveis

### 1. **Visitas de Itens**
- Total de visualizações dos seus produtos
- Detalhamento por período
- Agrupamento por intervalos de tempo

### 2. **Perguntas Recebidas**
- Quantidade total de perguntas
- Distribuição temporal das perguntas
- Análise por item específico

### 3. **Visualizações de Contato**
- Cliques em "Ver telefone"
- Interesse direto dos compradores
- Métricas de engajamento

### 4. **Análise Temporal**
- Dados por hora, dia, semana ou mês
- Tendências de tráfego
- Padrões de comportamento

## Casos de Uso Práticos

### 1. **Dashboard de Performance**
```bash
# Visitas dos últimos 7 dias
curl -X GET -H 'Authorization: Bearer $ACCESS_TOKEN' \
https://api.mercadolibre.com/users/$USER_ID/items_visits/time_window?last=7&unit=day
```

### 2. **Análise de Engajamento**
```bash
# Perguntas das últimas 24 horas
curl -X GET -H 'Authorization: Bearer $ACCESS_TOKEN' \
https://api.mercadolibre.com/users/$USER_ID/contacts/questions/time_window?last=24&unit=hour
```

### 3. **Relatório de Interesse**
```bash
# Visualizações de telefone do último mês
curl -X GET -H 'Authorization: Bearer $ACCESS_TOKEN' \
https://api.mercadolibre.com/users/$USER_ID/contacts/phone_views/time_window?last=1&unit=month
```

## Limitações e Considerações

### Limites de Consulta:
- **Período máximo:** Varia por endpoint (geralmente 90 dias)
- **Rate limiting:** Respeite os limites de requisições por minuto
- **Dados históricos:** Disponibilidade limitada para dados muito antigos

### Boas Práticas:
1. **Use time windows** para análises regulares
2. **Cache resultados** para evitar consultas desnecessárias
3. **Monitore tendências** em vez de valores absolutos
4. **Combine métricas** para análises mais completas
5. **Implemente alertas** para mudanças significativas

## Códigos de Erro Comuns

- **400 Bad Request:** Parâmetros de data inválidos
- **401 Unauthorized:** Token de acesso inválido
- **403 Forbidden:** Sem permissão para acessar métricas
- **404 Not Found:** Usuário ou item não encontrado
- **429 Too Many Requests:** Limite de rate exceeded

## Integração com Ferramentas de BI

### Exemplo de Estrutura para Dashboard:
```json
{
  "period": "last_30_days",
  "metrics": {
    "total_visits": 1250,
    "total_questions": 45,
    "phone_views": 23,
    "conversion_rate": "3.6%"
  },
  "trends": {
    "visits_growth": "+15%",
    "questions_growth": "+8%"
  }
}
```

