# Crie uma aplicação no Mercado Livre

**Última atualização em 15/07/2025**

Para criar uma aplicação, é necessário fazer login e acessar **Minhas aplicações** ([Argentina](https://developers.mercadolibre.com.ar/), [Brasil](https://developers.mercadolivre.com.br/), [Chile](https://developers.mercadolibre.cl/), [México](https://developers.mercadolibre.com.mx/), [Colombia](https://developers.mercadolibre.com.co/), [Uruguai](https://developers.mercadolibre.com.uy/), [Peru](https://developers.mercadolibre.com.pe/), [Equador](https://developers.mercadolibre.com.ec/) e [Venezuela](https://developers.mercadolibre.com.ve/)) e preencher as informações solicitadas. Depois, você obterá o Client_Id e Secret_Key, que é necessário para autenticação com nossa API.

Antes de criar uma aplicação, certifique-se de que a conta que estiver usando **seja a conta do proprietário** na solução que será desenvolvida, evitando problemas futuros de transferência de conta. Recomendamos que a conta seja criada sob pessoa jurídica.

Estes são os passos para criar uma aplicação no Mercado Livre, que permitirá que você acesse nosso ecossistema de APIs públicas a partir de uma integração:

1. Acesse nosso [DevCenter](https://developers.mercadolivre.com.br/).

2. Clique em "Criar uma aplicação" e preencha todos os dados obrigatórios.

**Nota:**
- Em alguns países (Argentina, México, Brasil e Chile), é permitido criar apenas 1 aplicação após a inclusão e validação dos dados do titular da conta. Para isso, é necessário observar as informações incluídas ao criar a conta, porque elas devem ser as mesmas. Caso não haja essas informações, sugerimos que você entre em contato com a equipe de atendimento ao cliente do Mercado Livre para conseguir informações sobre a conta.

## Informações básicas da aplicação

**Nome:** nome da aplicação. Deve ser único.

**Nome curto:** nome que o Mercado Livre usa para gerar o URL da aplicação.

**Descrição:** esta descrição (até 150 caracteres) será exibida quando a aplicação solicitar uma autorização.

**Logo:** inclui uma imagem da empresa informando as dimensões.

3. Os possíveis URLs de redirecionamento para os quais o **Code** da autorização recebida será devolvido estarão reunidos nos **URLs de redirecionamento**. Preencha com a raiz do domínio.

**Importante:**
Para criar uma aplicação na seção **Minhas aplicações**, é necessário usar o protocolo HTTPS no URI de redirecionamento, pois assim é possível se certificar de que a mensagem será enviada de forma criptografada e somente as pessoas autorizadas poderão visualizá-la.

### Use o PKCE (Proof Key for Code Exchange)

Isso determina se a aplicação terá a validação do PKCE habilitada para gerar o token. Isso permite uma segunda verificação para evitar ataques de injeção de código de autorização e CSRF (Cross-Site Request Forgery). O uso é opcional, embora seja recomendado.

**Device Grant:** Esse fluxo é usado quando os aplicativos solicitam um token de acesso, usando apenas suas credenciais, para acessar seus próprios recursos, e não em nome de um usuário. A principal diferença com os demais fluxos, para este token, as chamadas recorrentes são feitas até que o usuário finalize a permissão e o token de autorização seja retornado ou até que o tempo alocado para o fluxo, seja ultrapassado.

4. **Escopos**

- Leitura: permite o uso de métodos API GET HTTPS.
- Escrita: permite o uso de métodos API PUT, POST e DELETE HTTPS.

Saiba mais sobre nossas Permissões funcionais [nesta documentação](https://developers.mercadolivre.com.br/pt_br/permissoes-funcionais).

5. **Tópicos**

Inclui um checklist que classifica por temas específicos. É possível selecionar somente o que você tiver interesse para receber notificações e, no campo "**URL de retorno de notificações**", é necessário configurar uma rota para receber essas notificações.

**Importante:**
Preencha este campo com um URL adequado, válido e configurado para receber notificações.

**Tópicos:** Estes são os principais, dentre vários:
- Orders
- Messages
- Items
- Catalog
- Shipments
- Promotions

O Mercado Livre faz solicitações para esta rota sempre que houver uma novidade nos tópicos selecionados. Para mais informações, [consulte a documentação de notificações](https://developers.mercadolivre.com.br/pt_br/notificacoes).

6. Salve o projeto e você será redirecionado(a) para a página de início, na qual sua aplicação será incluída. Você pode conferir o ID e a chave secreta (**Secret_Key**) exibida pela sua aplicação. Com esses dados, podemos iniciar a integração.

Depois que a aplicação for criada e configurada corretamente, é necessário revisar a documentação de [autenticação e autorização](https://developers.mercadolivre.com.br/pt_br/autenticacao-e-autorizacao) para continuar com a integração e saber como gerar um token.

## Gerenciar minhas aplicações

Após a criação da aplicação no Mercado Livre, é possível acessá-la no [DevCenter](https://developers.mercadolivre.com.br/). Se você tiver alguma aplicação já criada, acesse "Editar" para visualizar e gerenciar sua aplicação.

## Configurar

Há 4 grupos de informação neste formulário:

- Configuração da aplicação
- Informações básicas da aplicação
- [Autenticação e segurança](https://developers.mercadolivre.com.br/pt_br/autenticacao-e-autorizacao)
- [Configurações de notificações](https://developers.mercadolivre.com.br/pt_br/notificacoes)

### Configuração da aplicação

**client id:** é o ID do APP da aplicação que foi criada.

**client secret:** é a chave da sua aplicação no Mercado Livre. **Este código é secreto.** Não o compartilhe com ninguém.

**programar renovação:** ação para programar a atualização do Client Secret.

**renove agora:** ação para a renovação do Client secret no exato momento.

## Editar aplicação

Sempre que você quiser, é possível alterar o Client Secret manualmente com estes passos:

1. Acesse "Configurações" da aplicação.
2. Altere o modo para "Ocultar" ou "Mostrar" o Client Secret.

Clique no menu de 3 pontos e selecione uma das ações que são exibidas para programar a forma como renovar o Client secret: "**Renove agora**" ou "**Programar renovação**".

## Renove agora

Esta é a confirmação para renovar o Client Secret. Ao selecionar esta opção, uma nova chave será gerada automaticamente nesse momento, a chave anterior expirará e a renovação será feita.

Recomendamos que a nova chave seja atualizada nos seus desenvolvimentos o quanto antes, pois, nesse período, os novos usuários que quiserem dar permissão para a aplicação enfrentarão erros.

## Programar renovação

Esta é a opção que recomendamos, pois melhora a segurança da sua integração, você terá a chance de preparar seu desenvolvimento e diferentes ambientes (desenvolvimento/teste), para a troca da chave na data de atualização programada.

Para isso:

1. Selecione a data na qual você quer que a chave atual expire e o seletor mostrará opções de até 7 dias.
2. Você também poderá selecionar o horário e o seletor mostrará opções de 30 em 30 minutos.
3. Por último, clique em "Renovar" para confirmar a atualização programada do Client Secret na data e horário que você informou.

Ao programar a renovação, você terá 2 Client Secret "vigentes": **Client secret novo** e **Client secret atual** até o vencimento do prazo.

Por outro lado, após a confirmação para atualização programada, as opções "**Cancelar renovação**" (ação para cancelar a renovação do Client Secret) ou "**Expirar agora**" (ação para renovação do Client Secret) estarão disponíveis.

## Cancelar renovação

Depois que a renovação do Client Secret for programada, é possível cancelá-la. Caso a renovação seja cancelada, o Client Secret gerado expirará e o Client Secret vigente continuará válido.

## Expirar agora

Esta ação permitirá antecipar a renovação programada. O Client Secret novo é o que estará ativo e o Client Secret vigente expirará nesse momento.

## Considerações sobre escopos

Há vários tipos de aplicações. Entretanto, vamos dividi-las em 3 grupos para explicar os escopos requisitados.

