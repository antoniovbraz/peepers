# Pedidos e Opiniões

**Última atualização em 05/06/2025**

Os seguintes exemplos servirão para gerenciar os pedidos e as opiniões dos usuários.

## Principais Endpoints

| Recurso | Descrição | Método |
|---------|-----------|---------|
| `/orders/search?seller=$SELLER_ID` | Buscar os pedidos de um vendedor | GET |
| `/orders/search?seller=$SELLER_ID&q=$ORDER_ID` | Buscar um pedido de um vendedor | GET |
| `/orders/search?buyer=$BUYER_ID` | Buscar os pedidos de um comprador | GET |
| `https://api.mercadopago.com/v1/payments/$PAYMENT_ID` | Devolve dados de um pagamento segundo o perfil do remetente do pagamento | GET |

## 1. Buscar Pedidos por Vendedor

### Endpoint:
```bash
GET /orders/search?seller=$SELLER_ID
```

### Exemplo de Requisição:
```bash
curl -X GET -H 'Authorization: Bearer $ACCESS_TOKEN' 'https://api.mercadolibre.com/orders/search?seller=207035636'
```

### Exemplo de Resposta:
```json
{
  "query": "",
  "display": "complete",
  "paging": {
    "total": 1,
    "offset": 0,
    "limit": 50
  },
  "results": [
    {
      "id": 1068825849,
      "comments": null,
      "status": "paid",
      "status_detail": {
        "description": null,
        "code": null
      },
      "date_created": "2016-02-25T15:53:38.000-04:00",
      "date_closed": "2016-02-25T15:53:37.000-04:00",
      "expiration_date": "2016-03-17T15:53:38.000-04:00",
      "date_last_updated": "2016-02-25T15:55:44.973Z",
      "hidden_for_seller": false,
      "currency_id": "ARS",
      "order_items": [
        {
          "currency_id": "ARS",
          "item": {
            "id": "MLA607850752",
            "title": "Item De Testeo, Por Favor No Ofertar --kc:off",
            "seller_custom_field": null,
            "variation_attributes": [],
            "category_id": "MLA3530",
            "variation_id": null
          },
          "sale_fee": 1.05,
          "quantity": 1,
          "unit_price": 10
        }
      ],
      "total_amount": 10,
      "mediations": [],
      "payments": [
        {
          "id": 1833868697,
          "order_id": 2000003508419013,
          "payer_id": 207040551,
          "collector": {
            "id": 207035636
          },
          "currency_id": "ARS",
          "status": "approved",
          "status_code": "0",
          "status_detail": "accredited",
          "transaction_amount": 10,
          "shipping_cost": 0,
          "overpaid_amount": 0,
          "total_paid_amount": 10,
          "marketplace_fee": null,
          "coupon_amount": 0,
          "date_created": "2016-02-25T15:55:42.000-04:00",
          "date_last_modified": "2016-02-25T15:55:42.000-04:00",
          "card_id": null,
          "reason": "Item De Testeo, Por Favor No Ofertar --kc:off",
          "activation_uri": null,
          "payment_method_id": "diners",
          "installments": 9,
          "issuer_id": "1028",
          "atm_transfer_reference": {
            "company_id": null,
            "transaction_id": null
          },
          "coupon_id": null,
          "operation_type": "regular_payment",
          "payment_type": "credit_card",
          "available_actions": [],
          "installment_amount": 1.11,
          "deferred_period": null,
          "date_approved": "2016-02-25T15:55:42.000-04:00",
          "authorization_code": "1234567",
          "transaction_order_id": "1234567"
        }
      ],
      "shipping": {
        "substatus": null,
        "status": "to_be_agreed",
        "id": null,
        "service_id": null,
        "currency_id": null,
        "shipping_mode": null,
        "shipment_type": null,
        "sender_id": null,
        "picking_type": null,
        "date_created": null,
        "cost": null,
        "date_first_printed": null
      },
      "buyer": {
        "id": 207040551,
        "nickname": "TETE5029382",
        "email": "test_user_97424966@testuser.com",
        "phone": {
          "area_code": "01",
          "number": "1111-1111",
          "extension": "",
          "verified": false
        },
        "alternative_phone": {
          "area_code": "",
          "number": "",
          "extension": ""
        },
        "first_name": "Test",
        "last_name": "Test",
        "billing_info": {
          "doc_type": null,
          "doc_number": null
        }
      },
      "seller": {
        "id": 207035636,
        "nickname": "TETE9544096",
        "email": "test_user_50828007@testuser.com",
        "phone": {
          "area_code": "01",
          "number": "1111-1111",
          "extension": "",
          "verified": false
        },
        "alternative_phone": {
          "area_code": "",
          "number": "",
          "extension": ""
        },
        "first_name": "Test",
        "last_name": "Test"
      },
      "feedback": {
        "sale": null,
        "purchase": null
      },
      "tags": [
        "not_delivered",
        "paid"
      ]
    }
  ],
  "sort": {
    "id": "date_asc",
    "name": "Date ascending"
  },
  "available_sorts": [
    {
      "id": "date_desc",
      "name": "Date descending"
    }
  ],
  "filters": [],
  "available_filters": [
    {
      "id": "order.status",
      "name": "Order Status",
      "type": "text",
      "values": [
        {
          "id": "paid",
          "name": "Order Paid",
          "results": 1
        },
        {
          "id": "confirmed",
          "name": "Order Confirmed",
          "results": 0
        },
        {
          "id": "payment_in_process",
          "name": "Payment in Process",
          "results": 0
        },
        {
          "id": "payment_required",
          "name": "Payment Required",
          "results": 0
        },
        {
          "id": "cancelled",
          "name": "Order Cancelled",
          "results": 0
        },
        {
          "id": "invalid",
          "name": "Invalid",
          "results": 0
        }
      ]
    },
    {
      "id": "shipping.status",
      "name": "Shipping Status",
      "type": "text",
      "values": [
        {
          "id": "to_be_agreed",
          "name": "To be agreed",
          "results": 1
        },
        {
          "id": "pending",
          "name": "Pending",
          "results": 0
        },
        {
          "id": "handling",
          "name": "Handling",
          "results": 0
        },
        {
          "id": "ready_to_ship",
          "name": "Ready to ship",
          "results": 0
        },
        {
          "id": "shipped",
          "name": "Shipped",
          "results": 0
        },
        {
          "id": "delivered",
          "name": "Delivered",
          "results": 0
        },
        {
          "id": "not_delivered",
          "name": "Not delivered",
          "results": 0
        },
        {
          "id": "cancelled",
          "name": "Cancelled",
          "results": 0
        }
      ]
    }
  ]
}
```

## 2. Status dos Pedidos

### Status Principais:
- **`paid`:** Pedido pago
- **`confirmed`:** Pedido confirmado
- **`payment_in_process`:** Pagamento em processo
- **`payment_required`:** Pagamento requerido
- **`cancelled`:** Pedido cancelado
- **`invalid`:** Inválido

### Status de Envio:
- **`to_be_agreed`:** A ser acordado
- **`pending`:** Pendente
- **`handling`:** Preparando
- **`ready_to_ship`:** Pronto para envio
- **`shipped`:** Enviado
- **`delivered`:** Entregue
- **`not_delivered`:** Não entregue
- **`cancelled`:** Cancelado

## 3. Buscar Pedidos por Comprador

### Endpoint:
```bash
GET /orders/search?buyer=$BUYER_ID
```

### Exemplo:
```bash
curl -X GET -H 'Authorization: Bearer $ACCESS_TOKEN' 'https://api.mercadolibre.com/orders/search?buyer=123456789'
```

## 4. Buscar Pedido Específico

### Endpoint:
```bash
GET /orders/search?seller=$SELLER_ID&q=$ORDER_ID
```

### Exemplo:
```bash
curl -X GET -H 'Authorization: Bearer $ACCESS_TOKEN' 'https://api.mercadolibre.com/orders/search?seller=207035636&q=1068825849'
```

## 5. Informações de Pagamento

### Endpoint Mercado Pago:
```bash
GET https://api.mercadopago.com/v1/payments/$PAYMENT_ID
```

### Exemplo:
```bash
curl -X GET -H 'Authorization: Bearer $ACCESS_TOKEN' 'https://api.mercadopago.com/v1/payments/1833868697'
```

## 6. Filtros Disponíveis

### Por Status do Pedido:
- `order.status=paid`
- `order.status=confirmed`
- `order.status=cancelled`

### Por Status de Envio:
- `shipping.status=ready_to_ship`
- `shipping.status=shipped`
- `shipping.status=delivered`

### Por Feedback:
- `feedback.sale.rating=positive`
- `feedback.sale.rating=negative`
- `feedback.sale.rating=neutral`

## 7. Paginação

### Parâmetros:
- **`offset`:** Número de resultados a pular
- **`limit`:** Número máximo de resultados (máximo 50)

### Exemplo:
```bash
curl -X GET -H 'Authorization: Bearer $ACCESS_TOKEN' 'https://api.mercadolibre.com/orders/search?seller=207035636&offset=0&limit=20'
```

## 8. Ordenação

### Opções Disponíveis:
- **`date_asc`:** Data crescente
- **`date_desc`:** Data decrescente

### Exemplo:
```bash
curl -X GET -H 'Authorization: Bearer $ACCESS_TOKEN' 'https://api.mercadolibre.com/orders/search?seller=207035636&sort=date_desc'
```

## Boas Práticas

1. **Use paginação** para grandes volumes de pedidos
2. **Implemente filtros** para otimizar as consultas
3. **Monitore os status** dos pedidos regularmente
4. **Configure notificações** para atualizações em tempo real
5. **Trate erros** adequadamente nas requisições
6. **Cache informações** quando apropriado para melhorar performance

