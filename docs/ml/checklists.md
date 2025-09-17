# Checklists Práticos - Mercado Livre API

*Atualizado em: 17 de setembro de 2025*

## Índice

- [Checklist OAuth & Segurança](#checklist-oauth--segurança)
- [Checklist Site MLB (Brasil)](#checklist-site-mlb-brasil)
- [Checklist Tratamento de Erros](#checklist-tratamento-de-erros)
- [Checklist Paginação](#checklist-paginação)
- [Checklist Webhooks](#checklist-webhooks)
- [Checklist LGPD & Privacidade](#checklist-lgpd--privacidade)

---

## Checklist OAuth & Segurança

### ✅ Configuração Inicial

- [ ] **Aplicação registrada** no [Application Manager](https://global-selling.mercadolibre.com/devcenter)
- [ ] **HTTPS obrigatório** configurado para todas as URLs (desenvolvimento e produção)
- [ ] **Redirect URI** exata registrada (sem wildcards)
- [ ] **Client ID** e **Client Secret** armazenados com segurança
- [ ] **Scopes** mínimos necessários definidos (`read`, `write`, `offline_access`)

### ✅ Implementação PKCE

- [ ] **Code Verifier**: String aleatória 43-128 caracteres (base64url)
- [ ] **Code Challenge**: SHA256 do verifier em base64url
- [ ] **Code Challenge Method**: Sempre `S256`
- [ ] **State Parameter**: Token CSRF único por requisição
- [ ] **Validação de State**: Verificar correspondência no callback

### ✅ Gerenciamento de Tokens

- [ ] **Access Token**: Armazenar em memória/cache (TTL 6h)
- [ ] **Refresh Token**: Banco de dados criptografado (TTL 6 meses)
- [ ] **Renovação automática**: Implementar antes da expiração
- [ ] **Invalidação**: Limpar tokens ao fazer logout
- [ ] **Rate limiting**: Controle de tentativas de refresh

### ✅ Validações de Segurança

- [ ] **Tipo de usuário**: Verificar se é administrador (não operador)
- [ ] **Application ID**: Validar em notificações webhook
- [ ] **User ID**: Conferir autorização em `ALLOWED_USER_IDS`
- [ ] **Token scope**: Verificar permissões antes de cada operação
- [ ] **HTTPS only**: Rejeitar requisições HTTP em produção

### ✅ Error Handling OAuth

- [ ] **invalid_client**: Client ID/Secret incorretos
- [ ] **invalid_grant**: Code expirado ou já usado
- [ ] **invalid_scope**: Escopo inválido ou não autorizado
- [ ] **access_denied**: Usuário recusou autorização
- [ ] **server_error**: Erro temporário, implementar retry

---

## Checklist Site MLB (Brasil)

### ✅ Configurações Obrigatórias

- [ ] **Site ID**: Sempre `MLB` para Brasil
- [ ] **Currency**: Sempre `BRL` (Real brasileiro)
- [ ] **Language**: Português brasileiro (`pt-BR`)
- [ ] **Timezone**: America/Sao_Paulo (UTC-3)
- [ ] **Business hours**: Considerar horário comercial brasileiro

### ✅ Categorias e Atributos

- [ ] **Category mapping**: Usar categorias específicas do MLB
- [ ] **Required attributes**: Verificar obrigatórios por categoria
- [ ] **Value constraints**: Respeitar valores permitidos
- [ ] **Brand validation**: Verificar marcas aceitas no Brasil
- [ ] **Model specification**: Seguir padrões brasileiros

### ✅ Preços e Moeda

- [ ] **Price format**: Decimal com ponto (ex: 199.90)
- [ ] **Currency ID**: Sempre `BRL`
- [ ] **Tax inclusion**: Preços sempre incluem impostos
- [ ] **Price ranges**: Respeitar mínimos/máximos por categoria
- [ ] **Promotional pricing**: Usar oficial_store_id quando aplicável

### ✅ Shipping Brasil

- [ ] **Mercado Envios**: Preferir ME2 para cobertura nacional
- [ ] **Free shipping**: Configurar quando elegível
- [ ] **Shipping modes**: ME1 (próprio) ou ME2 (ML)
- [ ] **Coverage areas**: Verificar CEPs atendidos
- [ ] **Handling time**: Configurar prazo de despacho

### ✅ Compliance Brasil

- [ ] **Product titles**: Máximo 60 caracteres
- [ ] **Forbidden words**: Evitar termos proibidos
- [ ] **Image requirements**: 500x500px mínimo
- [ ] **Warranty info**: Incluir informações de garantia
- [ ] **Legal compliance**: Seguir regulamentações brasileiras

---

## Checklist Tratamento de Erros

### ✅ HTTP Status Codes

- [ ] **200 OK**: Sucesso, processar resposta
- [ ] **400 Bad Request**: Validar parâmetros enviados
- [ ] **401 Unauthorized**: Renovar token de acesso
- [ ] **403 Forbidden**: Verificar permissões/scopes
- [ ] **404 Not Found**: Recurso não existe ou foi removido
- [ ] **429 Too Many Requests**: Implementar backoff exponencial
- [ ] **500 Internal Server Error**: Retry com delay

### ✅ Estratégias de Retry

- [ ] **Exponential backoff**: 1s, 2s, 4s, 8s, 16s
- [ ] **Maximum retries**: Máximo 5 tentativas
- [ ] **Jitter**: Adicionar randomização (±25%)
- [ ] **Circuit breaker**: Parar após muitas falhas
- [ ] **Graceful degradation**: Fallback para dados em cache

### ✅ Error Logging

- [ ] **Structured logging**: JSON com fields padronizados
- [ ] **Error correlation**: IDs únicos para rastreamento
- [ ] **PII protection**: Nunca logar tokens ou dados pessoais
- [ ] **Error metrics**: Contadores por tipo de erro
- [ ] **Alerting**: Notificações para erros críticos

### ✅ Error Response Handling

```javascript
// Template de tratamento
try {
  const response = await mlApiCall();
  return response.data;
} catch (error) {
  if (error.response?.status === 401) {
    await refreshToken();
    return retryApiCall();
  }
  
  if (error.response?.status === 429) {
    await delay(getBackoffTime());
    return retryApiCall();
  }
  
  logError(error);
  throw new APIError(error.message, error.response?.status);
}
```

### ✅ Fallback Strategies

- [ ] **Cache fallback**: Servir dados em cache quando API falha
- [ ] **Public endpoints**: Usar endpoints públicos quando possível
- [ ] **Default values**: Valores padrão para campos opcionais
- [ ] **Partial responses**: Processar dados parciais quando útil
- [ ] **User notification**: Informar limitações ao usuário

---

## Checklist Paginação

### ✅ Parâmetros de Paginação

- [ ] **limit**: Máximo por página (padrão 50, máximo 200)
- [ ] **offset**: Deslocamento (múltiplo de limit)
- [ ] **sort**: Ordenação quando disponível
- [ ] **total**: Verificar total de registros na resposta
- [ ] **has_more**: Indicador de mais páginas

### ✅ Implementação Eficiente

```javascript
// Template de paginação
async function getAllItems(searchParams = {}) {
  const items = [];
  let offset = 0;
  const limit = 50;
  
  do {
    const response = await api.get('/items', {
      params: { ...searchParams, limit, offset }
    });
    
    items.push(...response.data.results);
    offset += limit;
    
    // Prevenir loops infinitos
    if (items.length >= 10000) break;
    
  } while (response.data.paging?.total > offset);
  
  return items;
}
```

### ✅ Performance Optimization

- [ ] **Batch processing**: Processar páginas em lotes
- [ ] **Concurrent requests**: Máximo 3-5 requests paralelos
- [ ] **Memory management**: Não carregar tudo na memória
- [ ] **Progress feedback**: Informar progresso para operações longas
- [ ] **Cancellation**: Permitir cancelar operações longas

### ✅ Rate Limiting com Paginação

- [ ] **Request spacing**: 200ms entre requests sequenciais
- [ ] **Burst control**: Máximo 10 requests/segundo
- [ ] **Queue management**: Fila de requests com prioridade
- [ ] **Adaptive throttling**: Reduzir velocidade se rate limited
- [ ] **Monitoring**: Acompanhar taxa de requests/responses

---

## Checklist Webhooks

### ✅ Configuração Inicial

- [ ] **HTTPS endpoint**: URL pública acessível via HTTPS
- [ ] **Response time**: Responder HTTP 200 em < 500ms
- [ ] **Topics registration**: Registrar apenas tópicos necessários
- [ ] **Application Manager**: Configurar URL no painel
- [ ] **Health check**: Endpoint responde OK para GET requests

### ✅ Segurança

- [ ] **IP validation**: Aceitar apenas IPs oficiais do ML
  - 54.88.218.97
  - 18.215.140.160  
  - 18.213.114.129
  - 18.206.34.84
- [ ] **User ID validation**: Verificar user_id na notificação
- [ ] **Application ID**: Confirmar application_id se disponível
- [ ] **HTTPS only**: Rejeitar requests HTTP
- [ ] **Rate limiting**: Proteger contra abuse

### ✅ Processing Logic

```javascript
// Template de webhook
app.post('/webhook/mercadolibre', (req, res) => {
  // 1. Responder imediatamente
  res.status(200).send('OK');
  
  // 2. Validar origem
  if (!isValidMLOrigin(req.ip)) {
    return;
  }
  
  // 3. Processar assíncronamente
  setImmediate(() => {
    processNotification(req.body);
  });
});
```

### ✅ Idempotência

- [ ] **Duplicate detection**: Usar resource + timestamp como chave
- [ ] **Processing status**: Marcar notificações como processadas
- [ ] **TTL cleanup**: Limpar registros antigos (ex: 30 dias)
- [ ] **Retry protection**: Não reprocessar notificações idênticas
- [ ] **State validation**: Verificar se mudança é relevante

### ✅ Monitoramento

- [ ] **Webhook logs**: Registrar todas as notificações recebidas
- [ ] **Processing time**: Medir tempo de processamento
- [ ] **Error tracking**: Contar falhas por tipo
- [ ] **Missing notifications**: Verificar missed_feeds periodicamente
- [ ] **Health dashboard**: Monitorar status do webhook endpoint

### ✅ Topics Configuration

- [ ] **marketplace_orders**: Mudanças de status de pedidos
- [ ] **marketplace_questions**: Novas perguntas e respostas
- [ ] **marketplace_shipments**: Atualizações de envio
- [ ] **items**: Alterações em produtos (opcional)
- [ ] **messages**: Mensagens entre buyer/seller (se aplicável)

---

## Checklist LGPD & Privacidade

### ✅ Coleta de Dados

- [ ] **Minimização**: Coletar apenas dados necessários
- [ ] **Finalidade específica**: Definir propósito claro para cada dado
- [ ] **Consent logging**: Registrar consentimentos do usuário
- [ ] **Data mapping**: Mapear fluxo de dados pessoais
- [ ] **Legal basis**: Definir base legal para processamento

### ✅ Armazenamento Seguro

- [ ] **Encryption at rest**: Dados criptografados no banco
- [ ] **Encryption in transit**: HTTPS/TLS para todas as comunicações
- [ ] **Access control**: Controle de acesso baseado em roles
- [ ] **Audit logging**: Log de acessos a dados pessoais
- [ ] **Backup encryption**: Backups também criptografados

### ✅ Retenção de Dados

- [ ] **TTL policies**: Definir tempo de vida para cada tipo de dado
- [ ] **Automatic deletion**: Processo automatizado de exclusão
- [ ] **Data lifecycle**: Documentar ciclo de vida dos dados
- [ ] **Archive strategy**: Estratégia para dados históricos
- [ ] **User request handling**: Processo para exclusão sob demanda

### ✅ Direitos dos Titulares

- [ ] **Right to access**: Permitir consulta de dados pessoais
- [ ] **Right to rectification**: Corrigir dados incorretos
- [ ] **Right to erasure**: Excluir dados quando solicitado
- [ ] **Right to portability**: Exportar dados em formato estruturado
- [ ] **Right to object**: Permitir objeção ao processamento

### ✅ Transparência

- [ ] **Privacy policy**: Política de privacidade clara e acessível
- [ ] **Data processing notice**: Avisos sobre coleta de dados
- [ ] **Cookie consent**: Gerenciar consentimento para cookies
- [ ] **Third-party disclosure**: Informar compartilhamento com ML
- [ ] **Contact information**: DPO ou responsável pela privacidade

### ✅ Compliance Técnico

```javascript
// Template de conformidade
const PersonalDataHandler = {
  // Criptografar dados pessoais
  encrypt: (data) => encrypt(data, ENCRYPTION_KEY),
  
  // Log de acesso
  logAccess: (userId, dataType, purpose) => {
    auditLog.create({
      userId,
      dataType,
      purpose,
      timestamp: new Date(),
      source: 'ml_integration'
    });
  },
  
  // TTL automático
  setTTL: (key, data, ttlHours) => {
    cache.setex(key, ttlHours * 3600, data);
  },
  
  // Anonimização
  anonymize: (data) => {
    return {
      ...data,
      email: hashString(data.email),
      phone: hashString(data.phone),
      name: '[ANONYMIZED]'
    };
  }
};
```

### ✅ Integração ML Específica

- [ ] **ML data sharing**: Mapear dados compartilhados com ML
- [ ] **Token security**: Tokens não contêm dados pessoais
- [ ] **Webhook data**: Processar apenas dados necessários
- [ ] **Cache policies**: TTL adequado para dados de usuários
- [ ] **Cross-border**: Considerar transferência internacional

---

## Checklist Deployment & Monitoring

### ✅ Environment Setup

- [ ] **Production HTTPS**: Certificado SSL/TLS válido
- [ ] **Environment variables**: Secrets configurados corretamente
- [ ] **Database migrations**: Schema atualizado
- [ ] **Cache configuration**: Redis/cache configurado
- [ ] **Monitoring setup**: APM e logging configurados

### ✅ Performance Monitoring

- [ ] **API response times**: < 200ms para endpoints críticos
- [ ] **Error rates**: < 1% de erro em requests
- [ ] **Webhook processing**: < 500ms para processar notificações
- [ ] **Database queries**: Otimizar queries lentas
- [ ] **Cache hit rates**: > 80% para dados frequentes

### ✅ Business Monitoring

- [ ] **Order processing**: Alertas para pedidos não processados
- [ ] **Question response time**: SLA de resposta de perguntas
- [ ] **Shipment delays**: Monitorar atrasos de envio
- [ ] **Stock synchronization**: Detectar divergências de estoque
- [ ] **Revenue tracking**: Acompanhar performance de vendas

---

*Estes checklists devem ser revisados regularmente e adaptados conforme mudanças na API do Mercado Livre e regulamentações locais.*