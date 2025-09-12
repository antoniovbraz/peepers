# Guia Completo da API do Mercado Livre

Este guia apresenta uma visão geral completa da API do Mercado Livre, com base na documentação oficial. O objetivo é fornecer um recurso centralizado e bem estruturado para desenvolvedores que desejam integrar suas aplicações com o ecossistema do Mercado Livre.






## 1. Primeiros Passos: Criando sua Aplicação

Para começar a utilizar a API do Mercado Livre, o primeiro passo é criar uma aplicação. Este processo é fundamental para obter as credenciais (Client ID e Client Secret) que permitirão a autenticação e autorização de suas requisições.

### 1.1. Criando a Aplicação

Para criar uma aplicação, siga os seguintes passos:

1.  **Acesse o Dev Center:** [https://developers.mercadolivre.com.br/](https://developers.mercadolivre.com.br/)
2.  **Crie sua aplicação:** Preencha as informações solicitadas, como nome, descrição e URL de redirecionamento.
3.  **Obtenha suas credenciais:** Após a criação, você receberá seu `Client ID` e `Client Secret`.

### 1.2. Informações Básicas da Aplicação

-   **Nome:** Um nome único para sua aplicação.
-   **Nome Curto:** Utilizado para gerar a URL da aplicação.
-   **Descrição:** Uma breve descrição que será exibida aos usuários.
-   **Logo:** A imagem que representará sua aplicação.
-   **URLs de Redirecionamento:** As URLs para as quais os usuários serão redirecionados após a autorização.

### 1.3. Gerenciamento da Aplicação

-   **Renovação de Credenciais:** É possível renovar seu `Client Secret` a qualquer momento, seja de forma imediata ou programada.
-   **Escopos:** Defina as permissões que sua aplicação necessita (leitura, escrita, etc.).
-   **Tópicos de Notificação:** Configure os tópicos para os quais você deseja receber notificações (pedidos, perguntas, etc.).






## 2. Autenticação e Autorização

A autenticação e autorização são processos cruciais para garantir a segurança e o acesso correto aos recursos da API do Mercado Livre. A API utiliza o protocolo OAuth 2.0 para autorização.

### 2.1. Fluxo de Autorização (Server-Side)

O fluxo server-side é o mais comum e seguro para aplicações que rodam em um servidor. O processo geral é o seguinte:

1.  **Redirecionamento:** Sua aplicação redireciona o usuário para a página de autorização do Mercado Livre.
2.  **Autorização do Usuário:** O usuário autoriza sua aplicação a acessar seus dados.
3.  **Código de Autorização:** O Mercado Livre redireciona o usuário de volta para sua aplicação com um código de autorização.
4.  **Troca do Código por Token:** Sua aplicação troca o código de autorização por um `access_token`.
5.  **Acesso à API:** Com o `access_token`, sua aplicação pode fazer chamadas à API em nome do usuário.

### 2.2. Enviando o Access Token

Todas as requisições para a API devem incluir o `access_token` no header `Authorization`:

```http
Authorization: Bearer SEU_ACCESS_TOKEN
```

### 2.3. Refresh Token

O `access_token` tem uma vida útil limitada. Para manter o acesso contínuo, você deve utilizar o `refresh_token` para obter um novo `access_token` sem a necessidade de o usuário autorizar novamente sua aplicação.






## 3. Usuários e Aplicativos

A API de Usuários permite que você acesse e gerencie informações sobre os usuários do Mercado Livre.

### 3.1. Principais Endpoints

-   **`/users/{user_id}`:**
    -   `GET`: Obtém informações detalhadas sobre um usuário específico.
    -   `PUT`: Atualiza as informações de um usuário.
-   **`/users/me`:**
    -   `GET`: Obtém as informações do usuário que autorizou a aplicação.
-   **`/users/{user_id}/addresses`:**
    -   `GET`: Obtém os endereços de um usuário.

### 3.2. Exemplo de Requisição (Obter informações do usuário)

```bash
curl -X GET -H 'Authorization: Bearer SEU_ACCESS_TOKEN' https://api.mercadolibre.com/users/me
```

### 3.3. Exemplo de Resposta

```json
{
  "id": 123456789,
  "nickname": "NOME_DO_USUARIO",
  "first_name": "Nome",
  "last_name": "Sobrenome",
  "email": "usuario@email.com",
  "country_id": "BR",
  ...
}
```





## 4. Permissões Funcionais (Escopos)

Ao criar sua aplicação, você deve definir as permissões (escopos) necessárias para que ela funcione corretamente. As permissões determinam quais recursos da API sua aplicação pode acessar.

### 4.1. Tipos de Escopo

-   **`read` (Somente Leitura):** Permite que sua aplicação acesse dados via métodos `GET`.
-   **`write` (Leitura e Escrita):** Permite que sua aplicação modifique dados via métodos `POST`, `PUT` e `DELETE`.

### 4.2. Principais Grupos de Permissões

-   **Usuários (padrão):** Acesso a informações de usuários.
-   **Publicação e Sincronização:** Gerenciamento de anúncios (criação, edição, exclusão).
-   **Comunicação Pré e Pós-venda:** Acesso a perguntas, mensagens, reclamações e devoluções.
-   **Publicidade:** Gerenciamento de campanhas de publicidade.
-   **Métricas do Negócio:** Acesso a métricas de vendas, estoque e reputação.
-   **Vendas e Envios:** Gerenciamento de pedidos, envios, pagamentos e notas fiscais.
-   **Promoções, Cupons e Descontos:** Gerenciamento de ofertas e promoções.
-   **Faturamento:** Acesso a informações de faturamento e relatórios financeiros.





## 5. Sistema de Notificações

O sistema de notificações do Mercado Livre permite que sua aplicação receba atualizações em tempo real sobre eventos importantes, como mudanças em pedidos, novas mensagens, alterações em itens, etc.

### 5.1. Configuração

Para receber notificações, você deve:

1.  **Configurar a URL de Callback:** Especifique uma URL pública onde sua aplicação receberá as notificações via HTTP POST.
2.  **Selecionar Tópicos:** Escolha os tipos de eventos que deseja monitorar.

### 5.2. Principais Tópicos Disponíveis

-   **`orders_v2`:** Notificações sobre criação e alterações em vendas confirmadas.
-   **`messages`:** Notificações sobre novas mensagens e leituras.
-   **`items`:** Notificações sobre mudanças em itens publicados.
-   **`questions`:** Notificações sobre perguntas e respostas.
-   **`price_suggestion`:** Notificações sobre sugestões de preços.

### 5.3. Estrutura de uma Notificação

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

### 5.4. Boas Práticas

-   **Responda com HTTP 200:** Sempre confirme o recebimento da notificação com status 200.
-   **Resposta Rápida:** Responda em até 500ms para evitar reenvios.
-   **Use Filas:** Para grandes volumes, implemente um sistema de filas para processar as notificações.



## 6. Categorias e Atributos

As categorias são fundamentais para organizar os produtos no Mercado Livre. Cada país possui sua própria árvore de categorias, adaptada às características locais do mercado.

### 6.1. Estrutura Hierárquica

As categorias seguem uma estrutura hierárquica (árvore), onde cada categoria pode ter subcategorias. Por exemplo:
- **Eletrônicos** → **Celulares** → **Smartphones**

### 6.2. Principais Endpoints

-   **`/sites/{SITE_ID}/categories`:** Lista todas as categorias de primeiro nível de um país.
-   **`/categories/{CATEGORY_ID}`:** Obtém informações detalhadas sobre uma categoria específica.
-   **`/categories/{CATEGORY_ID}/attributes`:** Lista os atributos de uma categoria.

### 6.3. Exemplo: Listando Categorias do Brasil

```bash
curl -X GET https://api.mercadolibre.com/sites/MLB/categories
```

### 6.4. Exemplo: Detalhes de uma Categoria

```bash
curl -X GET https://api.mercadolibre.com/categories/MLB1051
```

### 6.5. Atributos das Categorias

Cada categoria possui atributos específicos que podem ser:
-   **Obrigatórios:** Devem ser preenchidos na publicação.
-   **Opcionais:** Podem ser preenchidos para melhorar a descrição do produto.
-   **Variações:** Atributos que definem variações do produto (cor, tamanho, etc.).

### 6.6. Boas Práticas

-   **Explore a hierarquia completa** antes de escolher uma categoria.
-   **Verifique os atributos obrigatórios** da categoria selecionada.
-   **Considere as configurações específicas** (moedas aceitas, tipos de envio, etc.).
-   **Analise categorias similares** para encontrar a mais adequada.


## 7. Principais Endpoints da API

### 7.1. Usuários
- `GET /users/me` - Informações do usuário autenticado
- `GET /users/{user_id}` - Informações de um usuário específico
- `PUT /users/{user_id}` - Atualizar informações do usuário
- `GET /users/{user_id}/addresses` - Endereços do usuário

### 7.2. Categorias
- `GET /sites/{site_id}/categories` - Listar categorias de um país
- `GET /categories/{category_id}` - Detalhes de uma categoria
- `GET /categories/{category_id}/attributes` - Atributos de uma categoria

### 7.3. Itens
- `GET /items/{item_id}` - Detalhes de um item
- `POST /items` - Criar um novo item
- `PUT /items/{item_id}` - Atualizar um item
- `PUT /items/{item_id}/status` - Alterar status do item

### 7.4. Busca
- `GET /sites/{site_id}/search` - Buscar itens
- `GET /sites/{site_id}/search/filters` - Filtros disponíveis

### 7.5. Pedidos
- `GET /orders/{order_id}` - Detalhes de um pedido
- `GET /orders/search` - Buscar pedidos
- `PUT /orders/{order_id}` - Atualizar pedido

### 7.6. Mensagens
- `GET /messages/{message_id}` - Detalhes de uma mensagem
- `POST /messages` - Enviar mensagem
- `GET /messages/search` - Buscar mensagens

### 7.7. Perguntas
- `GET /questions/{question_id}` - Detalhes de uma pergunta
- `POST /questions/{question_id}/answers` - Responder pergunta

## 8. Considerações Finais

### 8.1. Ambientes
- **Produção:** `https://api.mercadolibre.com`
- **Sandbox:** Disponível para testes (consulte a documentação oficial)

### 8.2. Rate Limits
- A API possui limites de requisições por minuto
- Implemente retry com backoff exponencial
- Monitore os headers de rate limit nas respostas

### 8.3. Versionamento
- A API utiliza versionamento através de URLs
- Mantenha-se atualizado com as versões mais recentes
- Teste mudanças em ambiente de desenvolvimento

### 8.4. Suporte
- Documentação oficial: https://developers.mercadolivre.com.br/
- Fórum da comunidade para dúvidas técnicas
- Suporte técnico através do portal do desenvolvedor

---

## Conclusão

Este guia apresentou os principais conceitos e recursos da API do Mercado Livre, incluindo:

1. **Configuração inicial** - Como criar e configurar sua aplicação
2. **Autenticação** - Implementação do fluxo OAuth 2.0
3. **Permissões** - Configuração dos escopos necessários
4. **Usuários** - Gerenciamento de informações de usuários
5. **Notificações** - Sistema de eventos em tempo real
6. **Categorias** - Estrutura hierárquica de produtos

Para uma integração bem-sucedida, recomendamos:

- Começar com um ambiente de testes
- Implementar tratamento de erros robusto
- Seguir as boas práticas de segurança
- Monitorar o desempenho da integração
- Manter-se atualizado com as mudanças da API

**Próximos passos:**
1. Crie sua aplicação no Dev Center
2. Implemente a autenticação OAuth 2.0
3. Configure as notificações necessárias
4. Teste os endpoints principais
5. Implemente em produção gradualmente

Para informações mais detalhadas e atualizadas, sempre consulte a documentação oficial em https://developers.mercadolivre.com.br/



## 7. Gerenciamento de Pedidos e Opiniões

O gerenciamento de pedidos é fundamental para vendedores que utilizam a API do Mercado Livre. Esta seção permite acompanhar vendas, status de pagamento e envio.

### 7.1. Principais Endpoints para Pedidos

-   **`/orders/search?seller={seller_id}`:** Buscar todos os pedidos de um vendedor
-   **`/orders/search?buyer={buyer_id}`:** Buscar todos os pedidos de um comprador
-   **`/orders/search?seller={seller_id}&q={order_id}`:** Buscar um pedido específico
-   **`/orders/{order_id}`:** Obter detalhes completos de um pedido

### 7.2. Status dos Pedidos

#### Status Principais:
-   **`paid`:** Pedido pago e confirmado
-   **`confirmed`:** Pedido confirmado pelo vendedor
-   **`payment_in_process`:** Pagamento sendo processado
-   **`payment_required`:** Aguardando pagamento
-   **`cancelled`:** Pedido cancelado
-   **`invalid`:** Pedido inválido

#### Status de Envio:
-   **`to_be_agreed`:** Envio a ser acordado
-   **`ready_to_ship`:** Pronto para envio
-   **`shipped`:** Produto enviado
-   **`delivered`:** Produto entregue
-   **`not_delivered`:** Não entregue

### 7.3. Exemplo: Buscar Pedidos de um Vendedor

```bash
curl -X GET -H 'Authorization: Bearer SEU_ACCESS_TOKEN' \
'https://api.mercadolibre.com/orders/search?seller=123456789'
```

### 7.4. Filtros Úteis

-   **Por status:** `?order.status=paid`
-   **Por envio:** `?shipping.status=ready_to_ship`
-   **Por período:** `?order.date_created.from=2023-01-01&order.date_created.to=2023-12-31`

### 7.5. Paginação e Ordenação

-   **Limite:** Máximo 50 resultados por página
-   **Offset:** Para navegar entre páginas
-   **Ordenação:** `date_asc` ou `date_desc`



## 8. Sistema de Perguntas e Respostas

O sistema de perguntas e respostas é fundamental para a comunicação entre compradores e vendedores, permitindo esclarecer dúvidas sobre produtos antes da compra.

### 8.1. Principais Endpoints

-   **`/questions/search?item_id={item_id}`:** Buscar perguntas de um item específico
-   **`/my/received_questions/search`:** Listar todas as perguntas recebidas
-   **`/questions`:** Fazer uma pergunta sobre um item
-   **`/answers`:** Responder uma pergunta
-   **`/questions/{question_id}`:** Obter detalhes de uma pergunta específica

### 8.2. Status das Perguntas

-   **`UNANSWERED`:** Pergunta aguardando resposta
-   **`ANSWERED`:** Pergunta já respondida
-   **`BANNED`:** Pergunta bloqueada por violar políticas
-   **`DELETED`:** Pergunta removida
-   **`UNDER_REVIEW`:** Pergunta em análise

### 8.3. Exemplo: Responder uma Pergunta

```bash
curl -X POST -H 'Authorization: Bearer SEU_ACCESS_TOKEN' \
-H "Content-Type: application/json" -d '{
    "question_id": 123456789, 
    "text":"Obrigado pela pergunta! Sim, temos esse produto em estoque." 
}' https://api.mercadolibre.com/answers
```

### 8.4. Exemplo: Listar Perguntas Recebidas

```bash
curl -X GET -H 'Authorization: Bearer SEU_ACCESS_TOKEN' \
'https://api.mercadolibre.com/my/received_questions/search?status=UNANSWERED'
```

### 8.5. Gerenciamento de Usuários Bloqueados

É possível verificar se um usuário está bloqueado para perguntas:

```bash
curl -X GET -H 'Authorization: Bearer SEU_ACCESS_TOKEN' \
'https://api.mercadolibre.com/block-api/search/users/{user_id}?type=blocked_by_questions'
```

### 8.6. Boas Práticas

-   **Responda rapidamente** para melhorar sua reputação como vendedor
-   **Use linguagem clara e profissional** nas respostas
-   **Configure notificações** para não perder nenhuma pergunta
-   **Monitore perguntas frequentes** para melhorar descrições dos produtos

