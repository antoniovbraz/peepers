# Busca de Itens

**Última atualização em 07/04/2025**

## Resumo dos Recursos Disponíveis

| Recurso | Descrição | Substituto |
|---------|-----------|------------|
| `/sites/$SITE_ID/search?nickname=$NICKNAME` | Obter itens das listagens por nickname | Não haverá substituição |
| `/sites/$SITE_ID/search?seller_id=$SELLER_ID` | Permite listar itens por vendedor | `https://api.mercadolibre.com/users/{User_id}/items/search` |
| `/sites/$SITE_ID/search?seller_id=$SELLER_ID&category=$CATEGORY_ID` | Obter itens das listagens por vendedor numa categoria específica | `https://api.mercadolibre.com/users/{User_id}/items/search` |
| `/users/$USER_ID/items/search` | Permite listar todos os itens da conta de um vendedor | Se mantém |
| `/items?ids=$ITEM_ID1,$ITEM_ID2` | Multiget com múltiplos números de itens | Se mantém |
| `/users?ids=$USER_ID1,$USER_ID2` | Multiget com múltiplos números de usuários | Recomendamos o uso de consultas individuais com o access token do seller |
| `/items?ids=$ITEM_ID1,$ITEM_ID2&attributes=$ATTRIBUTE1,$ATTRIBUTE2,$ATTRIBUTE3` | Multiget com múltiplos números de itens selecionando apenas os campos de interesse | Se mantém |
| `/users/$USER_ID/items/search?search_type=scan` | Permite obter mais de 1000 itens correspondentes a um usuário | Se mantém |

**Importante:** Revise possíveis erros como os **401** e **403**.

## Valores no Campo available_quantity

Nos recursos públicos de Itens e Buscas, as informações do "available_quantity" serão referenciais com os seguintes valores:

| Faixa | Valor Retornado |
|-------|-----------------|
| RANGO_1_50 | 1 |
| RANGO_51_100 | 50 |
| RANGO_101_150 | 100 |
| RANGO_151_200 | 150 |
| RANGO_201_250 | 200 |
| RANGO_251_500 | 250 |
| RANGO_501_5000 | 500 |
| RANGO_5001_50000 | 5000 |
| RANGO_50001_99999 | 50000 |

## Buscar Itens por Vendedor

### Diferenças entre Endpoints:
- **`/sites/$SITE_ID/search?`** - Obtém resultados de itens ativos diretamente das listagens do Mercado Livre
- **`/users/$USER_ID/items/search`** - Obtém uma listagem dos itens publicados por determinado vendedor a partir de sua conta

### 1. Obter Itens das Listagens por Vendedor

Esta busca se ajusta às regras das listagens da plataforma. Os resultados sempre serão de itens ativos.

#### Por ID de Vendedor:
```bash
curl -X GET -H 'Authorization: Bearer $ACCESS_TOKEN' \
https://api.mercadolibre.com/sites/$SITE_ID/search?seller_id=$SELLER_ID
```

#### Por Nickname:
```bash
curl -X GET -H 'Authorization: Bearer $ACCESS_TOKEN' \
https://api.mercadolibre.com/sites/$SITE_ID/search?nickname=$NICKNAME
```

### 2. Filtros e Ordenamentos

Dentro de `/sites/{site_id}/search?` existem os campos "available_sorts" e "available_filters" quando adicionar um parâmetro.

#### Como Ordenar:
Adicione "sort" com o ID disponível da ordem que quiser aplicar, por exemplo: "price_asc".

```bash
curl -X GET -H 'Authorization: Bearer $ACCESS_TOKEN' \
https://api.mercadolibre.com/sites/$SITE_ID/search?seller_id=$SELLER_ID&sort=price_asc
```

#### Como Filtrar:
Para filtrar itens com envio sem custo extra, você encontrará entre os "available_filters" disponíveis o ID "shipping" e, dentro dele, o "value" com ID "free".

```bash
curl -X GET -H 'Authorization: Bearer $ACCESS_TOKEN' \
https://api.mercadolibre.com/sites/$SITE_ID/search?seller_id=$SELLER_ID&shipping_cost=free
```

**Nota:** Por funcionalidade do site, a pesquisa nas listagens já vem com uma ordem de relevância definida.

### 3. Por ID de Vendedor para uma Categoria Específica

Com a seguinte chamada, você poderá consultar as publicações de categorias específicas.

```bash
curl -X GET -H 'Authorization: Bearer $ACCESS_TOKEN' \
https://api.mercadolibre.com/sites/$SITE_ID/search?seller_id=$SELLER_ID&category=$CATEGORY_ID
```

**Importante:** Atualmente, esta funcionalidade está disponível apenas para Mercado Libre México, Chile e Brasil.

## Itens com Perda de Exposição

Com os filtros a seguir, você poderá reconhecer os itens que estão perdendo ou podem perder exposição devido a reclamações ou cancelamentos:

- **`unhealthy`:** Para identificar itens que já estão perdendo exposição
- **`warning`:** Para quem pode perdê-lo e que ainda é possível recuperar
- **`healthy`:** Para itens que não foram afetados

### Exemplo de Chamada:
```bash
curl -X GET -H 'Authorization: Bearer $ACCESS_TOKEN' \
https://api.mercadolibre.com/users/$SELLER_ID/items/search?reputation_health_gauge=unhealthy
```

### Exemplo Prático:
```bash
curl -X GET -H 'Authorization: Bearer $ACCESS_TOKEN' \
https://api.mercadolibre.com/users/123456789/items/search?reputation_health_gauge=unhealthy
```

### Exemplo de Resposta:
```json
{
   "seller_id":"123456789",
   "query":null,
   "paging":{
      "limit":50,
      "offset":0,
      "total":1
   },
   "results":[
      "MLA844702264"
   ],
   "orders":[
      {
         "id":"stop_time_asc",
         "name":"Order by stop time ascending"
      }
   ],
   "available_orders":[
      {
         "id":"stop_time_asc",
         "name":"Order by stop time ascending"
      },
      {
         "id":"stop_time_desc",
         "name":"Order by stop time descending"
      },
      {
         "id":"start_time_asc",
         "name":"Order by start time ascending"
      },
      {
         "id":"start_time_desc",
         "name":"Order by start time descending"
      },
      {
         "id":"available_quantity_asc",
         "name":"Order by available quantity ascending"
      },
      {
         "id":"available_quantity_desc",
         "name":"Order by available quantity descending"
      },
      {
         "id":"price_asc",
         "name":"Order by price ascending"
      },
      {
         "id":"price_desc",
         "name":"Order by price descending"
      },
      {
         "id":"last_updated_desc",
         "name":"Order by lastUpdated descending"
      },
      {
         "id":"last_updated_asc",
         "name":"Order by last updated ascending"
      },
      {
         "id":"inventory_id_asc",
         "name":"Order by inventory id ascending"
      }
   ]
}
```

## Obter Itens da Conta de um Vendedor

**Nota:** Não mostramos mais o bloco correspondente aos campos "filters" e "available_filters" para melhorar os tempos de resposta. Se você precisar dessas informações, poderá obtê-las enviando o parâmetro **`include_filters=true`** no search.

### 1. Por user_id:
```bash
curl -X GET -H 'Authorization: Bearer $ACCESS_TOKEN' \
https://api.mercadolibre.com/users/$USER_ID/items/search
```

### 2. Por SKU:

#### Seller_custom_field:
Se o item contém um SKU no campo "seller_custom_field":

```bash
curl -X GET -H 'Authorization: Bearer $ACCESS_TOKEN' \
https://api.mercadolibre.com/users/$USER_ID/items/search?sku=$SELLER_CUSTOM_FIELD
```

#### Seller_sku:
Se o item tiver um SKU no campo/atributo "SELLER_SKU":

```bash
curl -X GET -H 'Authorization: Bearer $ACCESS_TOKEN' \
https://api.mercadolibre.com/users/$USER_ID/items/search?seller_sku=$SELLER_SKU
```

### 3. Por Estado:
```bash
curl -X GET -H 'Authorization: Bearer $ACCESS_TOKEN' \
https://api.mercadolibre.com/users/$USER_ID/items/search?status=active
```

### 4. Com/Sem Product Identifier:

#### Sem identificador de produto:
```bash
curl -X GET -H 'Authorization: Bearer $ACCESS_TOKEN' \
https://api.mercadolibre.com/users/$USER_ID/items/search?missing_product_identifiers=true
```

#### Com identificador de produto:
```bash
curl -X GET -H 'Authorization: Bearer $ACCESS_TOKEN' \
https://api.mercadolibre.com/users/$USER_ID/items/search?missing_product_identifiers=false
```

## Principais Filtros Disponíveis

### Por Status:
- `status=active` - Itens ativos
- `status=paused` - Itens pausados
- `status=closed` - Itens fechados

### Por Saúde da Reputação:
- `reputation_health_gauge=healthy` - Itens saudáveis
- `reputation_health_gauge=warning` - Itens em alerta
- `reputation_health_gauge=unhealthy` - Itens com problemas

### Por Categoria:
- `category=$CATEGORY_ID` - Filtrar por categoria específica

### Por Envio:
- `shipping_cost=free` - Apenas itens com frete grátis

## Principais Ordenações Disponíveis

- `price_asc` - Preço crescente
- `price_desc` - Preço decrescente
- `start_time_asc` - Data de início crescente
- `start_time_desc` - Data de início decrescente
- `stop_time_asc` - Data de fim crescente
- `stop_time_desc` - Data de fim decrescente
- `available_quantity_asc` - Quantidade disponível crescente
- `available_quantity_desc` - Quantidade disponível decrescente
- `last_updated_asc` - Última atualização crescente
- `last_updated_desc` - Última atualização decrescente

## Multiget de Itens

### Buscar Múltiplos Itens:
```bash
curl -X GET https://api.mercadolibre.com/items?ids=$ITEM_ID1,$ITEM_ID2,$ITEM_ID3
```

### Buscar Múltiplos Itens com Atributos Específicos:
```bash
curl -X GET https://api.mercadolibre.com/items?ids=$ITEM_ID1,$ITEM_ID2&attributes=title,price,available_quantity
```

## Paginação

### Parâmetros:
- **`limit`:** Número máximo de resultados por página (máximo 50)
- **`offset`:** Número de resultados a pular

### Exemplo:
```bash
curl -X GET -H 'Authorization: Bearer $ACCESS_TOKEN' \
https://api.mercadolibre.com/users/$USER_ID/items/search?limit=20&offset=0
```

## Search Type Scan

Para obter mais de 1000 itens correspondentes a um usuário:

```bash
curl -X GET -H 'Authorization: Bearer $ACCESS_TOKEN' \
https://api.mercadolibre.com/users/$USER_ID/items/search?search_type=scan
```

## Boas Práticas

1. **Use filtros específicos** para otimizar as consultas
2. **Implemente paginação** para grandes volumes de dados
3. **Cache resultados** quando apropriado para melhorar performance
4. **Monitore a saúde dos itens** regularmente usando `reputation_health_gauge`
5. **Use multiget** para buscar múltiplos itens de uma vez
6. **Considere usar search_type=scan** para grandes volumes de dados
7. **Verifique os available_filters e available_sorts** para cada consulta

