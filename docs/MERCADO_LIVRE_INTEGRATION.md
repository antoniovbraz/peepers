# Integração com Mercado Livre

## Visão Geral

O Peepers utiliza a API oficial do Mercado Livre para sincronizar produtos e gerenciar vendas. A integração é feita através do protocolo OAuth 2.0 para garantir a segurança das operações.

## Fluxo de Autenticação

1. **Início da Autenticação**
   - O usuário clica em "Conectar com Mercado Livre"
   - O sistema gera um estado de OAuth para segurança
   - O usuário é redirecionado para a página de login do Mercado Livre

2. **Autorização**
   - O usuário faz login no Mercado Livre
   - O usuário autoriza o Peepers a acessar sua conta
   - O Mercado Livre redireciona de volta para nossa aplicação

3. **Callback e Token**
   - O sistema valida o estado OAuth
   - O código de autorização é trocado por tokens de acesso
   - Os tokens são armazenados de forma segura

## Recursos Disponíveis

- Sincronização de produtos
- Gerenciamento de estoque
- Acompanhamento de vendas
- Respostas a perguntas
- Gestão de entregas

## Configuração

### Variáveis de Ambiente Necessárias

\`\`\`bash
# Mercado Livre API
ML_CLIENT_ID=seu_client_id
ML_CLIENT_SECRET=seu_client_secret

# Redis (Cache)
UPSTASH_REDIS_REST_URL=sua_url_redis
UPSTASH_REDIS_REST_TOKEN=seu_token_redis

# Next.js
NEXTAUTH_SECRET=seu_secret
NEXTAUTH_URL=https://seu-dominio.com
\`\`\`

### Permissões Necessárias

- read: Leitura de produtos e pedidos
- write: Atualização de produtos
- offline_access: Acesso contínuo

## Tratamento de Erros

A integração inclui tratamento robusto de erros para:
- Tokens expirados
- Falhas de rede
- Erros de validação
- Limites de API

## Segurança

- Tokens armazenados de forma segura
- Estado OAuth validado
- HTTPS obrigatório
- Rate limiting implementado

## Boas Práticas

1. **Cache**
   - Produtos em cache por 2 horas
   - Sincronização programada
   - Invalidação seletiva

2. **Performance**
   - Requisições em lote
   - Compressão de dados
   - Cache distribuído

3. **Monitoramento**
   - Logs estruturados
   - Métricas de performance
   - Alertas configurados

## Suporte

Em caso de problemas:
1. Verifique os logs
2. Confirme as variáveis de ambiente
3. Valide os tokens de acesso
4. Entre em contato com o suporte