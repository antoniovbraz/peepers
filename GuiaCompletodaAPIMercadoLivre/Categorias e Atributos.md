# Categorias e Atributos

**Última atualização em 01/04/2025**

As categorias são um conjunto hierárquico de grupos nos quais são enumerados os produtos de natureza similar, denominados "árvore de categorias". As categorias ajudam os usuários a buscar facilmente o tipo de produto desejado. Cada site tem seu próprio conjunto de categorias, isto é, a Argentina terá um conjunto único de categorias diferentes das que você vai encontrar no Brasil, porque cada país tem suas características particulares classificadas no mercado.

Antes de publicar um produto, você deve explorar a estrutura de categorias e escolher em qual delas quer publicar. Como ajuda, você pode baixar a hierarquia completa das categorias com ID e nome simples, de nossa API. Para fazer a publicação de um imóvel, você deverá selecionar a category_id dependendo do tipo de operação e imóvel.

## Categorias por site

O recurso **Sites** pode oferecer a estrutura de categorias de um país em particular.

Exemplo:

```bash
curl -X GET -H 'Authorization: Bearer $ACCESS_TOKEN' https://api.mercadolibre.com/sites/MLA/categories
```

Resposta:

```json
[
    {
        "id": "MLA5725",
        "name": "Accesorios para Vehículos"
    },
    {
        "id": "MLA1512",
        "name": "Agro"
    },
    {
        "id": "MLA1403",
        "name": "Alimentos y Bebidas"
    },
    {
        "id": "MLA1071",
        "name": "Animales y Mascotas"
    },
    {
        "id": "MLA1367",
        "name": "Antigüedades y Colecciones"
    },
    {
        "id": "MLA1368",
        "name": "Arte, Librería y Mercería"
    },
    {
        "id": "MLA1743",
        "name": "Autos, Motos y Otros"
    },
    {
        "id": "MLA1384",
        "name": "Bebés"
    },
    {
        "id": "MLA1246",
        "name": "Belleza y Cuidado Personal"
    },
    {
        "id": "MLA1039",
        "name": "Cámaras y Accesorios"
    },
    {
        "id": "MLA1051",
        "name": "Celulares y Teléfonos"
    },
    {
        "id": "MLA1648",
        "name": "Computación"
    },
    {
        "id": "MLA1144",
        "name": "Consolas y Videojuegos"
    },
    {
        "id": "MLA1500",
        "name": "Construcción"
    },
    {
        "id": "MLA1276",
        "name": "Deportes y Fitness"
    },
    {
        "id": "MLA5726",
        "name": "Electrodomésticos y Aires Ac."
    },
    {
        "id": "MLA1000",
        "name": "Electrónica, Audio y Video"
    },
    {
        "id": "MLA2547",
        "name": "Entradas para Eventos"
    },
    {
        "id": "MLA407134",
        "name": "Herramientas"
    },
    {
        "id": "MLA1574",
        "name": "Hogar, Muebles y Jardín"
    },
    {
        "id": "MLA1499",
        "name": "Industrias y Oficinas"
    },
    {
        "id": "MLA1459",
        "name": "Inmuebles"
    },
    {
        "id": "MLA1182",
        "name": "Instrumentos Musicales"
    },
    {
        "id": "MLA3937",
        "name": "Joyas y Relojes"
    },
    {
        "id": "MLA1132",
        "name": "Juegos y Juguetes"
    },
    {
        "id": "MLA3025",
        "name": "Libros, Revistas y Comics"
    },
    {
        "id": "MLA1168",
        "name": "Música, Películas y Series"
    },
    {
        "id": "MLA1430",
        "name": "Ropa y Accesorios"
    },
    {
        "id": "MLA409431",
        "name": "Salud y Equipamiento Médico"
    },
    {
        "id": "MLA1540",
        "name": "Servicios"
    },
    {
        "id": "MLA9304",
        "name": "Souvenirs, Cotillón y Fiestas"
    },
    {
        "id": "MLA1953",
        "name": "Otras categorías"
    }
]
```

Para categorias do segundo nível, ou informações relacionadas com categorias específicas, você deverá utilizar o recurso Categories e enviar o ID da categoria como parâmetro URL.

Veja o que podemos encontrar na categoria "Inmuebles" (Imóveis):

Exemplo:

```bash
curl -X GET -H 'Authorization: Bearer $ACCESS_TOKEN' https://api.mercadolibre.com/categories/MLA1459
```

Resposta:

```json
{
    "id": "MLA1459",
    "name": "Inmuebles",
    "picture": "http://resources.mlstatic.com/category/images/cc0eed64-9cfb-4b78-9258-6266475f6427.png",
    "permalink": "https://www.mercadolibre.com.ar/c/inmuebles",
    "total_items_in_this_category": 652169,
    "path_from_root": [
        {
            "id": "MLA1459",
            "name": "Inmuebles"
        }
    ],
    "children_categories": [
        {
            "id": "MLA374730",
            "name": "Camas Náuticas",
            "total_items_in_this_category": 319
        },
        {
            "id": "MLA1496",
            "name": "Campos",
            "total_items_in_this_category": 5789
        },
        {
            "id": "MLA1466",
            "name": "Casas",
            "total_items_in_this_category": 172797
        },
        {
            "id": "MLA50541",
            "name": "Cocheras",
            "total_items_in_this_category": 9817
        },
        {
            "id": "MLA392265",
            "name": "Consultorios",
            "total_items_in_this_category": 506
        },
        {
            "id": "MLA1472",
            "name": "Departamentos",
            "total_items_in_this_category": 279183
        },
        {
            "id": "MLA1475",
            "name": "Depósitos y Galpones",
            "total_items_in_this_category": 11609
        },
        {
            "id": "MLA50545",
            "name": "Fondo de Comercio",
            "total_items_in_this_category": 2984
        },
        {
            "id": "MLA79242",
            "name": "Locales",
            "total_items_in_this_category": 23445
        },
        {
            "id": "MLA50538",
            "name": "Oficinas",
            "total_items_in_this_category": 16826
        },
        {
            "id": "MLA50544",
            "name": "Parcelas, Nichos y Bóvedas",
            "total_items_in_this_category": 406
        },
        {
            "id": "MLA105179",
            "name": "PH",
            "total_items_in_this_category": 28017
        },
        {
            "id": "MLA50547",
            "name": "Quintas",
            "total_items_in_this_category": 4927
        },
        {
            "id": "MLA1493",
            "name": "Terrenos y Lotes",
            "total_items_in_this_category": 88830
        },
        {
            "id": "MLA50536",
            "name": "Tiempo Compartido",
            "total_items_in_this_category": 299
        },
        {
            "id": "MLA1892",
            "name": "Otros Inmuebles",
            "total_items_in_this_category": 6401
        }
    ],
    "attribute_types": "none",
    "settings": {
        "adult_content": false,
        "buying_allowed": false,
        "buying_modes": [
            "classified"
        ],
        "catalog_domain": null,
        "coverage_areas": "not_allowed",
        "currencies": [
            "USD",
            "ARS"
        ],
        "fragile": false,
        "immediate_payment": "not_allowed",
        "item_conditions": [
            "not_specified"
        ],
        "items_reviews_allowed": false,
        "listing_allowed": true,
        "max_description_length": 50000,
        "max_pictures_per_item": 20,
        "max_pictures_per_item_var": 10,
        "max_sub_title_length": 70,
        "max_title_length": 60,
        "maximum_price": null,
        "maximum_price_currency": "ARS",
        "minimum_price": 1,
        "minimum_price_currency": "ARS",
        "mirror_category": null,
        "mirror_master_category": null,
        "mirror_slave_categories": [],
        "moderation": "required",
        "nearby_areas": "not_allowed",
        "pictures_protected": false,
        "posting_allowed": true,
        "price": "required",
        "product_identifier_values": [],
        "reservation_allowed": "not_allowed",
        "restrictions": [],
        "rounded_address": false,
        "seller_contact_policy": "no_restriction",
        "shipping_modes": [
            "not_specified"
        ],
        "shipping_options": [
            "custom"
        ],
        "shipping_profile": "not_allowed",
        "show_contact_information": true,
        "simple_shipping": "not_allowed",
        "stock": "not_allowed",
        "sub_vertical": "real_estate_properties",
        "subscribable": true,
        "tags": [],
        "vertical": "real_estate",
        "vip_subdomain": "inmuebles",
        "buyer_protection_programs": [
            "mercadopago_full_protection"
        ],
        "status": "enabled"
    }
}
```

## Categorias JSON

Para obter informações detalhadas sobre uma categoria específica, incluindo seus atributos e configurações, você pode usar o endpoint:

```bash
curl -X GET https://api.mercadolibre.com/categories/{CATEGORY_ID}
```

## Atributos específicos das categorias

Cada categoria pode ter atributos específicos que são obrigatórios ou opcionais para a publicação de itens. Para obter os atributos de uma categoria:

```bash
curl -X GET https://api.mercadolibre.com/categories/{CATEGORY_ID}/attributes
```

## Nome

O nome da categoria é importante para a classificação correta dos produtos e deve ser escolhido cuidadosamente para garantir que o item seja encontrado pelos usuários.

## Atributos obrigatórios

Algumas categorias possuem atributos obrigatórios que devem ser preenchidos durante a publicação do item. Estes atributos variam de acordo com a categoria selecionada.

## Dump de categorias

Para obter todas as categorias de um site de uma só vez, você pode usar:

```bash
curl -X GET https://api.mercadolibre.com/sites/{SITE_ID}/categories
```

## Seleção de categorias

A seleção correta da categoria é fundamental para:

1. **Visibilidade:** Garantir que o produto seja encontrado pelos usuários corretos
2. **Conformidade:** Atender aos requisitos específicos de cada categoria
3. **Experiência do usuário:** Facilitar a navegação e busca dos compradores

### Dicas para seleção de categorias:

- Explore a hierarquia completa antes de escolher
- Verifique os atributos obrigatórios da categoria
- Considere as configurações específicas (moedas aceitas, tipos de envio, etc.)
- Analise categorias similares para encontrar a mais adequada

