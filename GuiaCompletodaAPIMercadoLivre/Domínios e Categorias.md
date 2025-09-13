# Domínios e Categorias

**Última atualização em 29/06/2023**

Os seguintes exemplos servirão para você trabalhar com as opções da árvore de categorias e listas do Mercado Livre. Alguns conceitos importantes a ter em conta:

## Conceitos Fundamentais

- **Site**: site onde o Mercado Livre está disponível para operações comerciais, identificado com três letras maiúsculas, por exemplo: MLA para a Argentina, MLB para o Brasil ou MLM para o México.

- **Domínio**: o domínio indica a que família de produtos pertence a publicação, como CELLPHONES, SNEAKERS ou BICYCLES.

- **Categoria**: seções hierárquicas que compõem um domínio, para permitir que os produtos sejam classificados corretamente de acordo com atributos e especificações comuns, por exemplo, COVERS_CELFONE ou SLIPPERS.

## Principais Endpoints

| Recurso | Descrição | Método |
|---------|-----------|---------|
| `/sites` | Devolve informação sobre os sites donde Mercado Livre está disponível. | GET |
| `/sites/$SITE_ID/listing_types` | Devolve diferentes níveis de exposição associados com todos los listing types en Mercado Libre. | GET |
| `/sites/$SITE_ID/listing_prices?price=$PRICE` | Devolve la lista de precios para vender y comprar en Mercado Libre. | GET |
| `/sites/$SITE_ID/categories` | Devolve las categorías disponibles en el sitio. | GET |
| `/categories/$CATEGORY_ID` | Devolve información sobre la categoría. | GET |
| `/categories/$CATEGORY_ID/attributes` | Muestra los atributos y reglas con el fin de describir los elementos que se almacenan en cada categoría. | GET |
| `/sites/$SITE_ID/domain_discovery/search?q=$Q` | Preditor de categorías. Devolve la categoría correspondiente para enumerar un artículo basándose en el título, dominio e/ou atributos. | GET |

## Detalhamento dos Endpoints

### 1. Sites Disponíveis
```bash
GET /sites
```
**Descrição:** Retorna informação sobre os sites onde Mercado Livre está disponível.

### 2. Tipos de Listagem por Site
```bash
GET /sites/$SITE_ID/listing_types
```
**Descrição:** Retorna diferentes níveis de exposição associados com todos os listing types no Mercado Livre.

### 3. Lista de Preços
```bash
GET /sites/$SITE_ID/listing_prices?price=$PRICE
```
**Descrição:** Retorna a lista de preços para vender e comprar no Mercado Livre.

### 4. Categorias Disponíveis
```bash
GET /sites/$SITE_ID/categories
```
**Descrição:** Retorna as categorias disponíveis no site.

**Exemplo para o Brasil:**
```bash
curl -X GET https://api.mercadolibre.com/sites/MLB/categories
```

### 5. Informações de Categoria Específica
```bash
GET /categories/$CATEGORY_ID
```
**Descrição:** Retorna informação sobre a categoria específica.

**Exemplo:**
```bash
curl -X GET https://api.mercadolibre.com/categories/MLB1051
```

### 6. Atributos da Categoria
```bash
GET /categories/$CATEGORY_ID/attributes
```
**Descrição:** Mostra os atributos e regras para descrever os elementos que se armazenam em cada categoria.

**Exemplo:**
```bash
curl -X GET https://api.mercadolibre.com/categories/MLB1051/attributes
```

### 7. Preditor de Categorias
```bash
GET /sites/$SITE_ID/domain_discovery/search?q=$Q
```
**Descrição:** Preditor de categorias. Retorna a categoria correspondente para enumerar um artigo baseando-se no título, domínio e/ou atributos.

**Exemplo:**
```bash
curl -X GET https://api.mercadolibre.com/sites/MLB/domain_discovery/search?q=smartphone
```

## Estrutura Hierárquica

As categorias seguem uma estrutura hierárquica onde:

1. **Nível 1:** Categorias principais (ex: Eletrônicos)
2. **Nível 2:** Subcategorias (ex: Celulares e Telefones)
3. **Nível 3:** Categorias específicas (ex: Smartphones)

## Boas Práticas

### Para Seleção de Categorias:
1. **Use o preditor de categorias** para encontrar a categoria mais adequada baseada no título do produto
2. **Explore a hierarquia completa** antes de fazer a escolha final
3. **Verifique os atributos obrigatórios** da categoria selecionada
4. **Considere o volume de produtos** em cada categoria para melhor visibilidade

### Para Implementação:
1. **Cache as informações de categorias** para melhorar performance
2. **Implemente fallback** para categorias que possam ser descontinuadas
3. **Monitore mudanças** na estrutura de categorias
4. **Teste em diferentes sites** se sua aplicação for multi-país

## Códigos de Sites Principais

- **MLB:** Brasil
- **MLA:** Argentina  
- **MLM:** México
- **MLC:** Chile
- **MLU:** Uruguai
- **MLC:** Colômbia
- **MPE:** Peru
- **MEC:** Equador
- **MLV:** Venezuela

## Exemplo Prático: Busca de Categoria

Para encontrar a categoria ideal para um produto "iPhone 13", você pode:

1. **Usar o preditor:**
```bash
GET /sites/MLB/domain_discovery/search?q=iPhone%2013
```

2. **Explorar categorias de eletrônicos:**
```bash
GET /sites/MLB/categories
# Encontrar categoria de eletrônicos
GET /categories/MLB1000  # Eletrônicos
# Navegar até celulares
GET /categories/MLB1051  # Celulares e Telefones
```

3. **Verificar atributos obrigatórios:**
```bash
GET /categories/MLB1051/attributes
```

Isso garantirá que você escolha a categoria correta e preencha todos os atributos necessários para uma publicação bem-sucedida.

