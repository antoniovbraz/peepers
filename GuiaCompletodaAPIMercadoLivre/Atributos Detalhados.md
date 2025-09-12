# Atributos Detalhados

**Última atualização em 08/09/2025**

## Consultar Atributos

Lembre que os atributos variam dependendo da categoria e você poderá consultá-los através da seguinte chamada:

```bash
curl -X GET -H 'Authorization: Bearer $ACCESS_TOKEN' \
https://api.mercadolibre.com/categories/$CATEGORY_ID/attributes
```

### Exemplo de Resposta:

```json
[
  {
    "id": "HEADPHONE_FORMAT",
    "name": "Formato",
    "tags": {
      "fixed": true
    },
    "value_type": "list",
    "values": [
      {
        "id": "182349",
        "name": "In-Ear"
      }
    ],
    "attribute_group_id": "DFLT",
    "attribute_group_name": "Otros"
  },
  {
    "id": "BRAND",
    "name": "Marca",
    "tags": {
      "fixed": true
    },
    "value_type": "string",
    "value_max_length": 60,
    "values": [
      {
        "id": "15438",
        "name": "Shure"
      }
    ],
    "attribute_group_id": "MAIN",
    "attribute_group_name": "Atributos Principales"
  },
  {
    "id": "COLOR",
    "name": "Color",
    "tags": {
      "allow_variations": true,
      "hidden": true
    },
    "type": "color",
    "value_type": "list",
    "values": [
      {
        "id": "52049",
        "name": "Negro",
        "metadata": {
          "rgb": "000000"
        }
      },
      {
        "id": "51993",
        "name": "Rojo",
        "metadata": {
          "rgb": "FF0000"
        }
      }
    ],
    "attribute_group_id": "MAIN",
    "attribute_group_name": "Atributos Principales"
  }
]
```

## Tipos de Atributos Possíveis

Existem diversos tipos de atributos; deles vão depender os valores que poderão suportar. O tipo de um atributo pode ser visualizado acessando a API de atributos dessa categoria e consultando o campo `value_type`. Os tipos possíveis são:

### 1. string
Você pode preencher atributos como esse com texto livre, incluindo letras e números indistintamente.

**Considerações:** Para este tipo de atributos sugerimos uma lista de valores conhecidos; mesmo assim, você também pode adicionar novos atributos que não façam parte dessa lista. Para o caso de valores novos só deverá enviar o name, mas para valores conhecidos pode fazê-lo enviando tanto o id como o name. Veja os valores sugeridos na API!

### 2. number
Estes atributos são somente preenchidos com valores numéricos.

**Considerações:** Para este tipo de atributos sugerimos uma lista de valores conhecidos; mesmo assim, você também pode adicionar novos atributos que não façam parte dessa lista. Para o caso de valores novos só deverá enviar o name, mas para valores conhecidos pode fazê-lo enviando tanto o id como o name. Veja os valores sugeridos na API!

### 3. number_unit
São atributos formados por um valor numérico e mais uma unidade. Na API de atributos você pode ver as unidades disponíveis para esse atributo.

**Considerações:** No momento de realizar ou modificar uma postagem, o formato desses atributos será validado, corroborando que este seja respeitado. Para todos os tipos de atributos acima, o campo `value_max_length` indica o número máximo de caracteres a ser carregado no valor do atributo.

### 4. boolean
Permite somente dois valores, um positivo e outro negativo.

**Considerações:** É necessário enviar o id do valor; você pode consultá-lo na API de atributos.

### 5. list
Na propriedade value são elencados os valores possíveis que este atributo pode tomar; sempre haverá pelo menos um.

**Considerações:** Para carregar um atributo, só precisa o `value_name` de um dos valores possíveis. Incentivamos você a ver os valores permitidos na API!

## Comportamentos Especiais

Na propriedade tags são especificados comportamentos particulares do atributo. Abaixo são listados os possíveis valores que podem ser incluídos, junto com a descrição do comportamento.

### Tags Principais:

#### allow_variations
Esta TAG permite que os atributos sejam attributes_combinations. Atualmente, as variações não são criadas automaticamente, deixando o atributo na seção para a qual é enviado no PUT/POST. Se você quiser mais informações sobre como adicioná-los, convidamos a ler a documentação sobre variações.

#### defines_picture
Indica que o atributo define a foto. Por exemplo, Cor em sapatos. Utilizando esta tag será interpretado o modo em que os diferentes componentes nos fluxos devem ser mostrados. Lembre que este comportamento é somente aplicável para atributos que suportam variações.

#### fixed
Indica que há um valor fixo para a categoria e todos os itens postados nesta seção terão esse valor. Por exemplo, se você está postando um Micro-ondas na categoria MLB232411 correspondente a Micro-ondas -> Outras Marcas -> 18 Litros, esta possui o atributo CAPACITY com valor fixo de 18 L. Neste caso, não é necessário enviar este atributo no POST/PUT do item, pois será adicionado automaticamente.

#### hidden
Indica que o atributo não será mostrado na VIP (Visualização do Item Publicado). Geralmente são atributos utilizados para filtros de busca ou para melhorar a experiência de compra.

#### read_only
Indica que o atributo é somente de leitura e não pode ser modificado pelo vendedor. Estes atributos são geralmente calculados automaticamente pelo sistema.

#### required
Indica que o atributo é obrigatório para a categoria. Deve ser preenchido obrigatoriamente na publicação do item.

#### catalog_required
Indica que o atributo é obrigatório quando o item está associado a um catálogo de produtos.

#### multivalued
Permite que o atributo tenha múltiplos valores simultaneamente.

## Atributos Obrigatórios

Para identificar quais atributos são obrigatórios em uma categoria específica, você deve verificar a tag `required` na resposta da API de atributos:

```bash
curl -X GET -H 'Authorization: Bearer $ACCESS_TOKEN' \
https://api.mercadolibre.com/categories/$CATEGORY_ID/attributes
```

### Exemplo de Atributo Obrigatório:

```json
{
  "id": "BRAND",
  "name": "Marca",
  "tags": {
    "required": true,
    "fixed": false
  },
  "value_type": "string",
  "value_max_length": 60,
  "values": [
    {
      "id": "15438",
      "name": "Nike"
    }
  ]
}
```

## Atributos de Dimensões do Pacote

Para produtos que requerem informações de envio, existem atributos específicos para dimensões:

### Atributos Principais:
- **`PACKAGE_LENGTH`:** Comprimento do pacote
- **`PACKAGE_WIDTH`:** Largura do pacote  
- **`PACKAGE_HEIGHT`:** Altura do pacote
- **`PACKAGE_WEIGHT`:** Peso do pacote

### Exemplo de Uso:

```json
{
  "attributes": [
    {
      "id": "PACKAGE_LENGTH",
      "value_name": "30 cm"
    },
    {
      "id": "PACKAGE_WIDTH", 
      "value_name": "20 cm"
    },
    {
      "id": "PACKAGE_HEIGHT",
      "value_name": "10 cm"
    },
    {
      "id": "PACKAGE_WEIGHT",
      "value_name": "1 kg"
    }
  ]
}
```

## Especificar Atributos que Não Aplicam

Para alguns produtos, certos atributos podem não ser aplicáveis. Nestes casos, você pode usar o valor especial "N/A" (Not Applicable).

### Como Usar:

```json
{
  "attributes": [
    {
      "id": "BRAND",
      "value_name": "N/A"
    }
  ]
}
```

## Criar Anúncios com Atributos N/A

Quando um atributo não se aplica ao seu produto, você pode:

1. **Omitir o atributo** (se não for obrigatório)
2. **Usar "N/A"** como valor (para atributos obrigatórios que não se aplicam)
3. **Usar "Sem marca"** para atributos de marca quando aplicável

### Exemplo Prático:

```json
{
  "title": "Produto Artesanal Único",
  "category_id": "MLB123456",
  "price": 50.00,
  "currency_id": "BRL",
  "available_quantity": 1,
  "condition": "new",
  "attributes": [
    {
      "id": "BRAND",
      "value_name": "Sem marca"
    },
    {
      "id": "MODEL",
      "value_name": "N/A"
    },
    {
      "id": "COLOR",
      "value_id": "52055"
    }
  ]
}
```

## Grupos de Atributos

Os atributos são organizados em grupos para melhor organização:

### Grupos Principais:
- **`MAIN`:** Atributos principais (marca, modelo, cor)
- **`DFLT`:** Outros atributos
- **`SPECIFICATIONS`:** Especificações técnicas
- **`DIMENSIONS`:** Dimensões e peso
- **`WARRANTY`:** Informações de garantia

## Validação de Atributos

### Regras de Validação:
1. **Atributos obrigatórios** devem ser preenchidos
2. **Valores de lista** devem usar IDs ou nomes válidos
3. **Atributos numéricos** devem respeitar limites mínimos/máximos
4. **Atributos de texto** devem respeitar o `value_max_length`
5. **Atributos boolean** devem usar valores válidos (true/false)

### Exemplo de Validação:

```json
{
  "id": "SCREEN_SIZE",
  "name": "Tamanho da tela",
  "value_type": "number_unit",
  "value_max_length": 10,
  "tags": {
    "required": true
  },
  "allowed_units": [
    {
      "id": "inches",
      "name": "polegadas"
    }
  ]
}
```

## Boas Práticas

1. **Sempre consulte os atributos** da categoria antes de publicar
2. **Use IDs quando disponíveis** para valores de lista
3. **Respeite os limites de caracteres** para atributos de texto
4. **Preencha atributos obrigatórios** para evitar erros
5. **Use "N/A" adequadamente** para atributos não aplicáveis
6. **Mantenha consistência** nos valores de atributos similares
7. **Teste a validação** antes de publicar em produção
8. **Monitore mudanças** na estrutura de atributos das categorias

## Códigos de Erro Comuns

- **400 Bad Request:** Atributo obrigatório não preenchido
- **400 Bad Request:** Valor inválido para atributo de lista
- **400 Bad Request:** Valor muito longo para atributo de texto
- **400 Bad Request:** Tipo de valor incorreto (ex: texto em atributo numérico)
- **404 Not Found:** Atributo não existe na categoria

