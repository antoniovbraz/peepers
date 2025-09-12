# Autenticação e Autorização

**Última atualização em 11/06/2025**

Para começar a utilizar nossos recursos, você deve desenvolver os processos de Autenticação e Autorização. Assim, você poderá trabalhar com os recursos privados do usuário quando autorize seu aplicativo.

## Enviar access token no header

Por segurança, você deve enviar o token de acesso por header toda vez que fizer chamadas para a API. O header da autorização será:

```bash
curl -H 'Authorization: Bearer APP_USR-12345678-031820-X-12345678' \
```

Por exemplo, fazer um GET para o recurso /users/me seria:

```bash
curl -H 'Authorization: Bearer APP_USR-12345678-031820-X-12345678' \
https://api.mercadolibre.com/users/me
```

Saiba mais sobre [a segurança do seu desenvolvimento](https://developers.mercadolivre.com.br/pt_br/desenvolvimento-seguro).

## Autenticação

O processo de autenticação é utilizado para verificar a identidade de uma pessoa em função de um ou vários fatores, garantindo que os dados de quem os enviou sejam corretos. Ainda que existam diferentes métodos, em Mercado Livre utilizamos o baseado em senhas.

## Autorização

A autorização é o processo por meio do qual permitimos acessar a recursos privados. Nesse processo deverá ser definido que recursos e operações podem ser realizados ("só leitura" ou "leitura e escrita").

### Como obtemos a autorização?

Por meio do Protocolo OAuth 2.0, um dos mais utilizados em plataformas abertas (Twitter, Facebook, etc.) e método seguro para trabalhar com recursos privados.

Este protocolo nos oferece:

- Confidencialidade, o usuário nunca deverá revelar sua senha.
- Integridade, apenas poderão ver dados privados os aplicativos que tiverem permissão para fazê-lo.
- Disponibilidade, os dados sempre serão disponibilizados no momento em que forem necessários.

O protocolo de operação é chamado de Grant Types, e o utilizado é The Authorisation Code Grant Type (Server Side).

A seguir mostraremos a você como trabalhar com os recursos de Mercado Livre utilizando Implicit Grant Type.

## Server side

O fluxo Server side é o mais adequado para os aplicativos que executam código do lado do server. Por exemplo, aplicativos desenvolvidos em linguagens como Java, Grails, Go, etc.

Em resumo, o processo que estará realizando é o seguinte:

1. Redireciona o aplicativo para Mercado Livre.
2. Não se preocupe com a autenticação dos usuários para Mercado Libre, nossa plataforma tomará conta disso!
3. Página de autorização.
4. POST para alterar o código de autorização por um access token.
5. O API de Mercado Libre altera o código de autorização por um token.
6. Já pode utilizar o access token para realizar chamadas ao nosso API e acessar os dados privados do usuário.

### Passo a passo:

## 1. Realizando autorização

1.1. Conecte-se com seu usuário de Mercado Livre:

**Notas:**
- Você pode usar um [usuário de teste](https://developers.mercadolivre.com.br/pt_br/realizacao-de-testes).
- Lembre que **o usuário que inicie sessão deve ser administrador**, para que o access token obtido tenha as permissões suficientes para realizar as consultas.
- Se o usuário for operador/colaborador, o grant será inválido e vai receber o erro **invalid_operator_user_id**.
- Os eventos a seguir podem invalidar um access token antes do tempo de expiração:
  - Alteração da senha pelo usuário.
  - Atualização do [Client Secret](https://developers.mercadolivre.com.br/pt_br/crie-uma-aplicacao-no-mercado-livre) por um aplicativo.
  - Revogação de permissões para seu aplicativo pelo usuário.
  - Se não utilizar a aplicação com alguma chamada em https://api.mercadolibre.com/ durante 4 meses.

**Importante:**
A redirect_uri deve corresponder exatamente ao que está registrado nas configurações do seu aplicativo para evitar erros de acesso; a url não pode conter informações variáveis.

1.2. Coloque o seguinte URL na janela de seu navegador para obter a autorização:

```
https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=$APP_ID&redirect_uri=$YOUR_URL&code_challenge=$CODE_CHALLENGE&code_challenge_method=$CODE_METHOD
```

No exemplo, utilizamos a URL para Brasil (mercadolivre.com.br), porém, se estiver trabalhando em outros países, lembre-se de alterar pelo domínio do país correspondente. Por exemplo, Uruguay: mercadolibre.com.uy. Ou Argentina: mercadolibre.com.ar. [Veja os países em que operamos](https://developers.mercadolivre.com.br/pt_br/localizacao-e-moedas).

### Parâmetros

**response_type**: enviando o valor "**code**" será obtido um access token que permitirá ao aplicativo interagir com Mercado Livre.

**redirect_URI**: o atributo YOUR_URL é completado com o valor adicionado quando [quando o aplicativo for criado](https://developers.mercadolivre.com.br/pt_br/crie-uma-aplicacao-no-mercado-livre). Deve ser exatamente igual ao que você configurou e não pode ter informações variáveis.

**client_id**: uma vez criado o aplicativo, será identificado como APP ID.

**State:** para aumentar a segurança, recomendamos que você inclua o parâmetro de estado na URL de autorização para garantir que a resposta pertença a uma solicitação iniciada por seu aplicativo.
Caso você não tenha um identificador aleatório seguro, você pode criá-lo usando SecureRandom e deve ser exclusivo para cada tentativa de chamada.
Portanto, a URL de redirecionamento será:

```
https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=1620218256833906&redirect_uri=https://localhost.com/redirect&state=$12345
```

Um uso adequado para o parâmetro **state** é enviar um estado que você precisará saber quando a URL definida no redirect_uri é chamada. Lembre-se que o redirect_uri deve ser uma URL estática então se você está pensando em enviar parâmetros nesta URL use o parâmetro state para enviar esta informação, caso contrário a requisição irá falhar pois o redirect_uri não corresponde exatamente ao configurado em sua aplicação.

Os parâmetros a seguir são opcionais e só se aplicam se o aplicativo tiver o fluxo de **PKCE** (Proof Key for Code Exchange) habilitado, Entretanto ao ser ativada esta opção, o envio do campo se torna obrigatório.

**code_challenge**: código de verificação gerado a partir de code_verifier y cifrado com code_challenge_method.

**code_challenge_method**: método usado para gerar o code challenge. Os seguintes valores são suportados atualmente:

- S256: especifica que o code_challenge encontra-se usando o algoritmo de cifrado SHA-256.
- plain: o mesmo code_verifier é enviado como code_challenge. Por razões de segurança, não é recomendado usar este método.

O redirect_uri tem que corresponder **exatamente** ao inserido quando o aplicativo foi criado para evitar o seguinte erro, dessa forma, não pode conter informações variáveis:

**Descrição**: your client callback has to match with the redirect_uri param.

1.3. Como último passo do usuário, ele será redirecionado para a tela seguinte, onde lhe será requerido que autorize o aplicativo à sua conta.

**Notas:**
Adicionamos informações do DPP (nível integrador) informando ao vendedor se o aplicativo é certificado ou não.

Conferindo a URL, se pode observar que o parâmetro CODE foi adicionado.

```
https://YOUR_REDIRECT_URI?code=$SERVER_GENERATED_AUTHORIZATION_CODE&state=$RANDOM_ID
```

Exemplo:

```
https://localhost.com/redirect?code=TG-61828b7fffcc9a001b4bc890-314029626&state=ABC1234
```

Este CODE será utilizado para gerar um access token, que permitirá acessar a API.

**Nota:**
- Considere que se o usuário for operador/colaborador, NÃO será possível realizar o grant para a aplicação. Vai retornar o erro invalid_operator_user_id.
- Lembre-se de verificar esse valor para certificar-se de que a resposta pertence a uma solicitação iniciada por seu aplicativo, pois o Mercado Livre não valida este campo.

1.4 Se você receber a mensagem de erro: **Sorry, the application cannot connect to MercadoLibre right now**, isso significa que sua aplicação não está configurada corretamente ou que há algum problema com as credenciais.

