# Notificações

**Última atualização em 04/09/2025**

Alguns eventos são produzidos apenas do lado do Mercado Livre e a única forma de conhecê-los é por notificações. Com as notificações você terá um feed em tempo real das mudanças produzidas nos diferentes recursos da nossa API. Por exemplo, se você anunciou um item e mais tarde decidiu pausá-lo, se alguém formulou alguma pergunta, se compraram um item ou até se pagaram e/ou solicitaram o envio. Uma maneira eficiente sem ter que consultar permanentemente nossa API.

Se quiser começar a receber notificações, você deverá acessar seu [gerenciador de aplicativos](https://developers.mercadolivre.com.br/), onde você criou seu aplicativo pela primeira vez, editar os detalhes especificando quais são os topics que você receberá. Caso você ainda não tenha criado seu aplicativo, acesse seção [Criar a sua aplicação](https://developers.mercadolivre.com.br/pt_br/crie-uma-aplicacao-no-mercado-livre).

## Configuração de notificações

### URL de Retorno de Chamada (Callback URL):

Especifique a URL pública onde o sistema enviará as notificações via HTTP POST. Essa URL deve estar acessível e configurada para receber dados dos tópicos selecionados. Exemplo: http://myapp.com/notifications.

### Tópicos:

Escolha os tópicos de interesse para receber notificações específicas. Cada tópico corresponde a um tipo de evento no sistema, e ao configurá-los, as notificações enviadas serão restritas aos eventos desses tópicos.

**Nota:**
- Os tópicos payments e messages não são utilizados para imóveis, serviços e automóveis.
- As notificações têm zona horária UTC.

## Tópicos

Atualmente, temos duas abordagens para a organização dos tópicos de notificações na plataforma:

**Modelo de Tópico Geral:** Neste modelo, o tópico agrupa e envia todas as notificações de uma entidade, de forma mais ampla e unificada, sem a visualização ou segmentação de sub-tópicos.

**Modelo com Subtópicos (tipificado):** Permite a visualização e organização das notificações em subtópicos (ou filtros). Assim, é possível segmentar as novidades conforme as ações/atributos/filtros específicos que se apliquem.

### Estrutura Modelo com Subtópicos:

**Entidade principal:** Esta é a entidade principal que engloba todos os subtipos de notificações de um recurso.

**Subtópicos (Filtros):** Dentro da Entidade principal, você poderá configurar filtros específicos para segmentar as notificações.

## Tópicos disponíveis

### Orders:

**orders_v2:** você receberá notificações a partir da criação e alterações realizadas em alguma de suas vendas confirmadas. (recomendável)

Resposta de notificação:

```json
{
  "resource":"/orders/2195160686",
  "user_id": 468424240,
  "topic":"orders_v2",
  "application_id": 5503910054141466,
  "attempts":1,
  "sent":"2019-10-30T16:19:20.129Z",
  "received":"2019-10-30T16:19:20.106Z"
}
```

Com essas informações, você poderá realizar um GET para o recurso orders:

```bash
curl -X GET -H 'Authorization: Bearer $ACCESS_TOKEN' https://api.mercadolibre.com/orders/$ORDER_ID
```

**orders feedback:** receberá notificações sobre a criação e alterações feitas nos feedbacks de suas vendas confirmadas.

### Messages:

Estrutura Modelo com Subtópicos

**created:** você receberá notificações das novas mensagens que forem geradas, tendo como destinatário o user_id correspondente (Comprador ou Vendedor).

**read:** você receberá notificações das leituras de mensagens.

Resposta de notificação:

```json
{
  "id": "5e2827f2-99b7-474e-b68b-6a86e934cc7e",
  "resource": "3f6da1e35ac84f70a24af7360d24c7bc",
  "user_id": 123456789,
  "topic": "messages",
  "actions": ["created"], // ou ["read"]
  "application_id": 89745685555,
  "attempts": 1,
  "sent": "2017-10-09T13:44:33.006Z",
  "received": "2017-10-09T13:44:32.984Z"
}
```

Com essas informações, você poderá realizar um GET para o recurso mensagens:

```bash
curl -X GET -H 'Authorization: Bearer $ACCESS_TOKEN' https://api.mercadolibre.com/messages/$RESOURCE
```

### Prices:

**Price Suggestion:** você receberá notificações sobre as sugestões de preços no Mercado Livre.

Resposta de notificação:

```json
{
  "resource": "suggestions/items/$ITEM_ID/details",
  "user_id": 318494000,
  "topic": "price_suggestion",
  "application_id": 22299753060000,
  "attempts": 1,
  "sent": "2024-05-09T13:44:33.006Z",
  "received": "2024-05-09T13:44:32.984Z"
}
```

Com essas informações, você poderá realizar um GET para o recurso suggestions:

```bash
curl -X GET -H 'Authorization: Bearer $ACCESS_TOKEN' https://api.mercadolibre.com/suggestions/items/$ITEM_ID/details
```

### Items:

**Items:** você receberá notificações sobre qualquer mudança em um item que tiver publicado.

Resposta de notificação:

```json
{
   "resource": "/items/MLA686791111",
   "user_id": 123456789,
   "topic": "items",
   "application_id": 2069392825111111,
   "attempts": 1,
   "sent": "2017-10-09T13:44:33.006Z",
   "received": "2017-10-09T13:44:32.984Z"
}
```

Com essas informações, você poderá realizar um GET para o recurso items:

```bash
curl -X GET -H 'Authorization: Bearer $ACCESS_TOKEN' https://api.mercadolibre.com/items/$ITEM_ID
```

**Questions:** você receberá notificações de perguntas e respostas feitas.

Resposta de notificação:

```json
{
   "resource": "/questions/5036111111",
   "user_id": "123456789",
   "topic": "questions",
   "application_id": 2069392825111111,
   "attempts": 1,
   "sent": "2017-10-09T13:51:05.464Z",
   "received": "2017-10-09T13:51:05.438Z"
}
```

Com essas informações, você poderá realizar um GET para o recurso questions:

```bash
curl -X GET -H 'Authorization: Bearer $ACCESS_TOKEN' https://api.mercadolibre.com/questions/$QUESTION_ID
```

**Quotations:** você receberá notificações referente a cotações que ocorram nas publicações (aplicável apenas para integração de imóveis de Mercado Libre Chile).

## Considerações Importantes

**Importante:**
Atualize sua integração para ter sempre retorno HTTP 200 e em 500 milissegundos após o recebimento da notificação, com isso você evitará que os tópicos de suas notificações sejam desativados por fail back. Tenha em conta que caso ocorra a desativação, as notificações correspondentes a este período não serão salvas no my feeds, e você terá que se inscrever novamente nos tópicos.

- Enviamos um POST à callback URL e seu aplicativo deverá confirmar mediante um HTTP 200 o recebimento correto. Caso contrário, a mensagem será considerada não entregue e haverá uma nova tentativa de envio.

- As mensagens serão enviadas e novas tentativas de envio serão feitas durante um intervalo de 1 hora. Depois desse período, se não forem aceitas pelo aplicativo, elas serão excluídas.

- Sabendo que pode haver uma grande quantidade de notificações, é recomendável que se trabalhe com filas, onde seu servidor deverá confirmar o recebimento das notificações (HTTP 200) instantaneamente e apenas em seguida faça a consulta do tópico na API; assim, evita que sejam feitas novas tentativas de notificações e não gerará a sensação de notificações duplicadas.

- Leve em conta que há eventos internos não visíveis para o integrador, porém estes disparam notificações.

## Como consultar as notificações

Quando você receber uma notificação sobre um tópico, será necessário realizar uma solicitação GET ao recurso indicado para obter os detalhes completos. Se você tiver salvo uma versão anterior do JSON, é importante compará-la com a nova resposta para identificar mudanças.

## Estrutura de Notificação tópico geral:

As notificações têm uma estrutura uniforme, o que facilita o acesso e a análise dos dados:

```json
{
  "resource": "/orders/123456789",
  "user_id": 123456789,
  "topic": "orders_v2",
  "application_id": 1234567890123456,
  "attempts": 1,
  "sent": "2019-10-30T16:19:20.129Z",
  "received": "2019-10-30T16:19:20.106Z"
}
```

