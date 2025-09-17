# Integração com Mercado Livre

*Documentação completa atualizada em: 17 de setembro de 2025*

## Visão Geral

O Peepers utiliza a API oficial do Mercado Livre para sincronizar produtos e gerenciar vendas no mercado brasileiro (site_id=MLB). A integração é feita através do protocolo OAuth 2.0 + PKCE para garantir a segurança das operações.

## 📚 Documentação Completa

Esta integração possui documentação abrangente organizada em módulos especializados:

### 📖 Documentação Principal

- **[Visão Geral e Fluxos Essenciais](./ml/overview.md)** - Guias passo-a-passo detalhados para OAuth, publicação de itens, gestão de pedidos, envios e webhooks
- **[Inventário de Endpoints](./ml/endpoints.md)** - Catálogo completo de todos os endpoints da API com parâmetros e autenticação
- **[Especificação OpenAPI](./ml/openapi-summary.yaml)** - Especificação técnica completa em formato OpenAPI 3.0.3
- **[Checklists Práticos](./ml/checklists.md)** - Listas de verificação operacionais para implementação e conformidade

### 🎯 Guias Rápidos

- **[Exemplos Práticos](./ml/examples.md)** - Comandos curl funcionais para teste em produção *(em desenvolvimento)*

## 🔧 Recursos Implementados

### ✅ Autenticação e Segurança

- OAuth 2.0 Authorization Code + PKCE
- Renovação automática de tokens
- Controle de acesso por usuário autorizado
- Validação CSRF com state parameter

### ✅ Gestão de Produtos

- Sincronização de catálogo completo
- Publicação e atualização de itens
- Gestão de estoque em tempo real
- Suporte a variações de produtos

### ✅ Processamento de Pedidos

- Monitoramento de novos pedidos
- Gestão de status de pagamento
- Integração com webhooks
- Controle de fraude

### ✅ Sistema de Envios

- Suporte ME1 (logística própria)
- Suporte ME2 (Mercado Envios)
- Geração de etiquetas
- Rastreamento automático

### ✅ Atendimento ao Cliente

- Resposta automática a perguntas
- Gestão de mensagens
- Monitoramento de avaliações

### ✅ Sistema de Notificações

- Webhooks para eventos críticos
- Processamento assíncrono
- Retry com backoff exponencial
- Monitoramento de falhas

## 🔄 Fluxo de Autenticação OAuth 2.0 + PKCE

### 1. Início da Autenticação

- O usuário clica em "Conectar com Mercado Livre"
- O sistema gera code_verifier e code_challenge (PKCE)
- Estado OAuth gerado para proteção CSRF
- Redirecionamento para página de autorização do ML

### 2. Autorização do Usuário

- Usuário faz login no Mercado Livre
- Usuário autoriza o Peepers a acessar sua conta
- **Validação crítica**: Usuário deve ser administrador (não operador)

### 3. Callback e Tokens

- Validação do state parameter (proteção CSRF)
- Troca do authorization code por access/refresh tokens
- Armazenamento seguro: access token (cache 6h), refresh token (BD criptografado)

### 4. Renovação Automática

- Monitoramento de expiração de tokens
- Renovação automática usando refresh_token
- Fallback para reautenticação se refresh falhar

## ⚙️ Configuração Técnica

### Variáveis de Ambiente Obrigatórias

```bash
# Mercado Livre API Credentials
ML_CLIENT_ID=seu_client_id
ML_CLIENT_SECRET=seu_client_secret

# Cache Redis (Upstash)
UPSTASH_REDIS_REST_URL=sua_url_redis
UPSTASH_REDIS_REST_TOKEN=seu_token_redis

# Aplicação
NEXT_PUBLIC_APP_URL=https://seudominio.com
ALLOWED_USER_IDS=123456789,987654321  # IDs autorizados separados por vírgula

# Next.js Security
NEXTAUTH_SECRET=seu_secret_hash_seguro
```

### Escopos OAuth Configurados

- **read**: Leitura de produtos, pedidos e dados do usuário
- **write**: Criação e atualização de produtos
- **offline_access**: Acesso contínuo via refresh token

### Endpoint de Produção

- **Base URL**: `https://api.mercadolibre.com`
- **Site ID**: `MLB` (Brasil)
- **Moeda**: `BRL` (Real brasileiro)

## 🛡️ Segurança e Conformidade

### Proteções Implementadas

- **HTTPS obrigatório** para todas as operações
- **PKCE (Proof Key for Code Exchange)** para OAuth
- **State parameter** para proteção CSRF
- **Criptografia** de refresh tokens em repouso
- **Rate limiting** com backoff exponencial
- **IP validation** para webhooks (IPs oficiais do ML)

### Conformidade LGPD

- **Minimização de dados**: Coleta apenas informações necessárias
- **TTL automático**: Dados de usuários com expiração definida
- **Anonimização**: Logs não contêm dados pessoais
- **Direitos dos titulares**: Suporte a consulta e exclusão de dados

## 📊 Monitoramento e Performance

### Métricas Acompanhadas

- **Response time**: < 200ms para endpoints críticos
- **Error rate**: < 1% em requisições da API
- **Cache hit rate**: > 80% para dados frequentes
- **Webhook processing**: < 500ms para notificações

### Alertas Configurados

- Falhas de autenticação consecutivas
- Pedidos não processados > 10 minutos
- Webhooks com alta taxa de erro
- Tokens próximos ao vencimento

## 🔧 Troubleshooting

### Problemas Comuns e Soluções

#### 🚨 OAuth Failures

```bash
# Verificar configuração
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
     https://api.mercadolibre.com/users/me

# Renovar token se expirado
curl -X POST https://api.mercadolibre.com/oauth/token \
     -d "grant_type=refresh_token&client_id=$ML_CLIENT_ID&client_secret=$ML_CLIENT_SECRET&refresh_token=$REFRESH_TOKEN"
```

#### 🚨 Webhook Issues

- Verificar se endpoint retorna HTTP 200 em < 500ms
- Validar IPs permitidos (54.88.218.97, 18.215.140.160, etc.)
- Confirmar processamento assíncrono de notificações

#### 🚨 Rate Limiting

- Implementar exponential backoff: 1s, 2s, 4s, 8s, 16s
- Usar cache para reduzir chamadas à API
- Agrupar operações em batch quando possível

## 📈 Roadmap e Melhorias

### ✅ Implementado

- OAuth 2.0 + PKCE completo
- Gestão automática de tokens
- Webhooks para eventos críticos
- Cache inteligente com TTL
- Conformidade LGPD básica

### 🔄 Em Desenvolvimento

- Dashboard de métricas avançado
- Sincronização de variações de produtos
- Integração com múltiplos marketplaces
- Analytics de performance de vendas
- Sistema de alertas avançado

### 📋 Backlog

- Suporte a Mercado Pago
- Integração com logística própria
- Machine learning para preços
- API GraphQL própria
- Mobile app para gestão

## 📞 Suporte Técnico

### Em Caso de Problemas

1. **Verificar logs estruturados**
   ```bash
   # Logs de autenticação
   grep "oauth" /var/log/peepers/auth.log
   
   # Logs de API
   grep "ml_api" /var/log/peepers/api.log
   ```

2. **Validar configuração**
   - Conferir variáveis de ambiente
   - Testar conectividade com Redis
   - Verificar tokens válidos

3. **Diagnosticar performance**
   - Usar endpoint `/api/cache-debug` para cache
   - Monitorar response times
   - Verificar rate limiting

4. **Contato de emergência**
   - Slack: #peepers-alerts
   - Email: admin@peepers.com.br
   - Telefone: +55 11 99999-9999

## 📚 Referências

- [Documentação Oficial ML](https://global-selling.mercadolibre.com/devsite/)
- [OAuth 2.0 + PKCE RFC](https://tools.ietf.org/html/rfc7636)
- [LGPD - Lei Geral de Proteção de Dados](http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [Next.js 15 Documentation](https://nextjs.org/docs)

---

*Esta documentação é atualizada automaticamente. Última atualização: 17 de setembro de 2025*