# Configurações de Segurança - Peepers ERP

## Visão Geral

Este documento detalha todas as configurações de segurança implementadas no Peepers após a auditoria IAM completa. O sistema agora inclui proteções avançadas contra ataques CSRF, roubo de tokens, rate limiting granular e monitoramento de eventos de segurança em tempo real.

## Variáveis de Ambiente

### 1. Configurações Básicas (Obrigatórias)

```bash
# Mercado Livre API - OBRIGATÓRIAS
ML_CLIENT_ID=seu_client_id_aqui
ML_CLIENT_SECRET=seu_client_secret_aqui

# Cache Redis - OBRIGATÓRIAS
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=seu_token_redis_aqui

# Aplicação - OBRIGATÓRIAS
NEXT_PUBLIC_APP_URL=https://seu-dominio.vercel.app
ALLOWED_USER_IDS=123456789,987654321,555666777
```

### 2. Sistema de Alertas (Opcionais)

```bash
# Email Alerts
ALERT_EMAIL_WEBHOOK=https://api.emailservice.com/send
ALERT_EMAIL_TO=admin@seudominio.com
ALERT_EMAIL_FROM=security@seudominio.com

# Webhook Alerts
ALERT_WEBHOOK_URL=https://seus-alertas.com/webhook
ALERT_WEBHOOK_SECRET=webhook_secret_key

# Slack Alerts  
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX
```

### 3. Configurações CORS (Opcionais)

```bash
# CORS Origins - Por ambiente
CORS_ALLOWED_ORIGINS_PRODUCTION=https://peepers.vercel.app,https://www.peepers.com
CORS_ALLOWED_ORIGINS_DEVELOPMENT=http://localhost:3000,http://localhost:3001
CORS_ALLOWED_ORIGINS_PREVIEW=https://*.vercel.app

# CORS Debug Mode
CORS_DEBUG_MODE=false
```

### 4. Rate Limiting (Opcionais - Com Defaults)

```bash
# Rate Limits Globais
RATE_LIMIT_IP_WINDOW_MS=60000          # 1 minuto
RATE_LIMIT_IP_MAX_REQUESTS=100         # 100 requests por minuto por IP

# Rate Limits por Login
RATE_LIMIT_LOGIN_WINDOW_MS=300000      # 5 minutos  
RATE_LIMIT_LOGIN_MAX_REQUESTS=10       # 10 tentativas por 5 min

# Rate Limits por API Pública
RATE_LIMIT_PUBLIC_WINDOW_MS=60000      # 1 minuto
RATE_LIMIT_PUBLIC_MAX_REQUESTS=200     # 200 requests por minuto

# Rate Limits por API Autenticada
RATE_LIMIT_AUTH_WINDOW_MS=60000        # 1 minuto
RATE_LIMIT_AUTH_MAX_REQUESTS=500       # 500 requests por minuto

# Webhooks
RATE_LIMIT_WEBHOOK_WINDOW_MS=60000     # 1 minuto
RATE_LIMIT_WEBHOOK_MAX_REQUESTS=100    # 100 webhooks por minuto
```

### 5. Sistema de Eventos de Segurança (Opcionais)

```bash
# Configurações de Alertas
SECURITY_ALERT_THRESHOLD_CRITICAL=1    # 1 evento crítico = alerta imediato
SECURITY_ALERT_THRESHOLD_HIGH=5        # 5 eventos HIGH = alerta
SECURITY_ALERT_THRESHOLD_MEDIUM=10     # 10 eventos MEDIUM = alerta
SECURITY_ALERT_WINDOW_MINUTES=15       # Janela de tempo para contagem

# Debug de Eventos
SECURITY_EVENTS_DEBUG=false
SECURITY_EVENTS_LOG_ALL=true
```

## Sistemas de Segurança Implementados

### 1. Rotação de Refresh Tokens

**Localização**: `src/lib/token-rotation.ts`

**Funcionalidades**:
- Rotação automática de refresh tokens a cada uso
- Detecção de roubo de tokens (token theft detection)
- Blacklist de tokens comprometidos
- Auditoria completa de uso de tokens

**Configuração**:
```typescript
// Configurações padrão (automáticas)
const TOKEN_ROTATION_CONFIG = {
  rotateOnRefresh: true,
  blacklistOnTheft: true,
  auditTrail: true,
  tokenTTL: 3600, // 1 hora
  refreshTokenTTL: 604800 // 7 dias
};
```

**Monitoramento**:
- Eventos `auth.token_theft.detected` para tentativas de roubo
- Eventos `auth.token.refresh.success/failure` para auditoria
- Alertas automáticos para administradores

### 2. Proteção CORS Avançada

**Localização**: `src/lib/cors.ts`

**Funcionalidades**:
- Whitelist de origins por ambiente
- Validação rigorosa de headers
- Logging de violações CORS
- Configuração automática por ambiente

**Configuração**:
```typescript
// Origins permitidos por ambiente
const allowedOrigins = {
  production: ['https://peepers.vercel.app'],
  development: ['http://localhost:3000'],
  preview: ['https://*.vercel.app']
};
```

**Eventos de Segurança**:
- `security.cors.violation` para tentativas bloqueadas
- Logs detalhados com origin, método e headers

### 3. Rate Limiting Granular

**Localização**: `src/lib/rate-limiter.ts`

**Funcionalidades**:
- Sliding window algorithm para precisão
- Limites específicos por tipo de operação
- Whitelist de IPs confiáveis
- Integração com sistema de alertas

**Tipos de Rate Limiting**:

1. **Por IP**: Limite global por endereço IP
2. **Por Usuário**: Limite por usuário autenticado
3. **Por Endpoint**: Limite específico por rota
4. **Login**: Proteção contra brute force
5. **Webhook**: Proteção contra spam de webhooks
6. **API Pública**: Controle de uso de APIs públicas
7. **API Autenticada**: Controle de uso de APIs protegidas

**Configuração de Limites**:
```typescript
const RATE_LIMITS = {
  ip: { windowMs: 60000, max: 100 },
  login: { windowMs: 300000, max: 10 },
  webhook: { windowMs: 60000, max: 100 },
  publicAPI: { windowMs: 60000, max: 200 },
  authAPI: { windowMs: 60000, max: 500 }
};
```

### 4. Sistema de Eventos de Segurança

**Localização**: `src/lib/security-events.ts`

**Funcionalidades**:
- Monitoramento em tempo real
- Alertas automáticos por canal
- Agregação de estatísticas
- Dashboard de métricas

**Tipos de Eventos Monitorados**:

**Críticos**:
- `auth.csrf.detected`: Ataques CSRF detectados
- `auth.token_theft.detected`: Tentativas de roubo de token
- `security.brute_force.detected`: Ataques de força bruta

**Alta Prioridade**:
- `security.rate_limit.exceeded`: Violações de rate limit
- `authz.unauthorized.access`: Tentativas de acesso não autorizado
- `security.suspicious.activity`: Atividade suspeita

**Média Prioridade**:
- `security.cors.violation`: Violações CORS
- `system.webhook.auth.failure`: Falhas de autenticação webhook
- `system.api.error`: Erros de API

**Configuração de Alertas**:
```typescript
const ALERT_RULES = {
  'auth.csrf.detected': { threshold: 1, severity: 'CRITICAL' },
  'auth.token_theft.detected': { threshold: 1, severity: 'CRITICAL' },
  'security.rate_limit.exceeded': { threshold: 10, severity: 'HIGH' },
  'authz.unauthorized.access': { threshold: 5, severity: 'HIGH' }
};
```

## Dashboard de Segurança

### Endpoint de Estatísticas

**URL**: `/api/security/stats`
**Método**: GET
**Autenticação**: Requerida (apenas administradores)

**Parâmetros**:
- `window`: Janela de tempo em segundos (default: 3600 = 1 hora)

**Resposta**:
```json
{
  "timestamp": "2024-12-19T10:30:00.000Z",
  "time_window_seconds": 3600,
  "security_status": "SECURE|NORMAL|MODERATE|HIGH_RISK|CRITICAL",
  
  "summary": {
    "total_events": 45,
    "critical_events": 0,
    "high_events": 2,
    "medium_events": 8,
    "low_events": 35
  },
  
  "critical_threats": {
    "csrf_detections": 0,
    "token_theft_detections": 0,
    "brute_force_attempts": 0
  },
  
  "high_priority": {
    "rate_limit_exceeded": 2,
    "unauthorized_access": 0,
    "suspicious_activity": 0
  },
  
  "active_alerts": [
    "High rate limit violations"
  ],
  
  "recommendations": [
    "Consider adjusting rate limit thresholds or blocking IPs"
  ]
}
```

### Status de Segurança

**SECURE**: Nenhuma ameaça detectada
**NORMAL**: Atividade normal com poucos eventos
**MODERATE**: Atividade aumentada, monitoramento recomendado  
**HIGH_RISK**: Múltiplos eventos de alta prioridade
**CRITICAL**: Eventos críticos detectados - ação imediata necessária

## Canais de Alertas

### 1. Email

**Configuração**:
```bash
ALERT_EMAIL_WEBHOOK=https://api.emailservice.com/send
ALERT_EMAIL_TO=admin@seudominio.com
ALERT_EMAIL_FROM=security@seudominio.com
```

**Payload**:
```json
{
  "to": "admin@seudominio.com",
  "from": "security@seudominio.com", 
  "subject": "SECURITY ALERT: [CRITICAL] CSRF attacks detected",
  "html": "<h2>Alerta de Segurança</h2><p>Detalhes...</p>"
}
```

### 2. Webhook

**Configuração**:
```bash
ALERT_WEBHOOK_URL=https://seus-alertas.com/webhook
ALERT_WEBHOOK_SECRET=webhook_secret_key
```

**Headers**:
```
Content-Type: application/json
X-Security-Signature: sha256=...
User-Agent: Peepers-Security/1.0
```

### 3. Slack

**Configuração**:
```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX
```

**Formato**:
```json
{
  "text": "🚨 SECURITY ALERT: CSRF attacks detected",
  "attachments": [{
    "color": "danger",
    "fields": [
      {"title": "Severity", "value": "CRITICAL", "short": true},
      {"title": "Count", "value": "3", "short": true}
    ]
  }]
}
```

## Monitoramento e Operações

### 1. Logs de Segurança

Todos os eventos de segurança são logados estruturadamente:

```json
{
  "timestamp": "2024-12-19T10:30:00.000Z",
  "level": "warn",
  "msg": "Security event detected",
  "type": "auth.token_theft.detected",
  "severity": "CRITICAL",
  "userId": "123456789",
  "clientIP": "192.168.1.100",
  "details": {
    "tokenFamily": "abc123",
    "attemptedToken": "xyz789",
    "validToken": "def456"
  }
}
```

### 2. Métricas de Performance

**Cache Hit Rates**:
- Tokens: >95%
- Produtos: >90%
- Dados de usuário: >85%

**Rate Limiting**:
- Falsos positivos: <1%
- Bloqueios legítimos: >99%

**Tempos de Resposta**:
- Validação CORS: <5ms
- Rate limiting: <10ms
- Eventos de segurança: <15ms

### 3. Alertas de Sistema

**Alertas Imediatos** (Severidade CRITICAL):
- Detecção de CSRF
- Roubo de tokens
- Ataques de força bruta

**Alertas Agrupados** (Severidade HIGH/MEDIUM):
- 10 violações de rate limit em 15 minutos
- 5 tentativas de acesso não autorizado em 15 minutos
- 10 violações CORS em 15 minutos

## Troubleshooting

### Problemas Comuns

1. **Rate Limit Falsos Positivos**
   - Verificar se IP está na whitelist
   - Ajustar limites específicos
   - Verificar se usuário está autenticado corretamente

2. **CORS Bloqueando Requests Legítimos**
   - Verificar origins na configuração
   - Validar headers enviados
   - Verificar ambiente (dev/prod/preview)

3. **Alertas Excessivos**
   - Ajustar thresholds nos `ALERT_RULES`
   - Configurar whitelist de IPs confiáveis
   - Revisar configurações de severidade

4. **Tokens Sendo Invalidados Incorretamente**
   - Verificar rotação de tokens está funcionando
   - Validar TTL de cache
   - Verificar se client está enviando tokens corretos

### Comandos de Debug

```bash
# Verificar estatísticas de segurança
curl -H "Cookie: user_id=123456789" \
     https://seu-dominio.vercel.app/api/security/stats

# Verificar rate limiting atual
curl https://seu-dominio.vercel.app/api/cache-debug

# Testar CORS
curl -H "Origin: https://exemplo.com" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://seu-dominio.vercel.app/api/health
```

### Logs Importantes

**Verificar eventos de segurança**:
```bash
# No Vercel
vercel logs --filter="Security event"

# Localmente com logs estruturados
grep "Security event" .next/server.log | jq .
```

**Monitorar rate limiting**:
```bash
# Rate limits exceeded
grep "Rate limit exceeded" logs/

# CORS violations  
grep "CORS violation" logs/
```

## Compliance e Auditoria

### LGPD

- **Dados Minimizados**: Apenas dados essenciais são armazenados
- **TTL Definido**: Todos os caches têm tempo de vida limitado
- **IPs Mascarados**: IPs são parcialmente mascarados nos logs
- **Consentimento**: Cookie banner implementado

### Auditoria de Segurança

- **Eventos Registrados**: Todos os eventos de segurança são auditáveis
- **Timestamps**: Todos os eventos têm timestamps UTC precisos
- **Correlação**: IDs de sessão permitem rastreamento de atividades
- **Retenção**: Eventos mantidos por 30 dias no cache

### Relatórios de Segurança

O endpoint `/api/security/stats` fornece relatórios automatizados incluindo:
- Resumo executivo de ameaças
- Tendências de segurança
- Recomendações automáticas
- Status de conformidade

---

## Próximos Passos

1. **Monitoramento Contínuo**: Implementar dashboards em tempo real
2. **Machine Learning**: Detecção de padrões suspeitos automatizada
3. **Integração SOC**: Conectar com ferramentas de SOC corporativo
4. **Compliance**: Certificações SOC 2 Type II e ISO 27001

Para questões de segurança urgentes, contate: security@seudominio.com