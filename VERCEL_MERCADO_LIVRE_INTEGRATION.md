# Integração Vercel + Mercado Livre — Guia Completo (Peepers)

Objetivo: documentar, passo a passo, tudo que precisamos saber e configurar para hospedar o site Peepers na Vercel e integrar completamente com a API do Mercado Livre (ML/MELI). Este documento reúne: visão geral, fluxo OAuth, webhooks/notifications, armazenamento seguro de tokens, requisitos de ambiente, estratégias de cache e observabilidade, segurança e checklist de implantação.

IMPORTANTE: consulte sempre a documentação oficial do Mercado Livre ao implementar detalhes (endpoints, nomes exatos de headers, comportamento de webhooks) — pequenos detalhes podem mudar. Links úteis:
- Vercel docs: https://vercel.com/docs
- Mercado Livre Developers: https://developers.mercadolibre.com

---

Sumário rápido
- Preparação Vercel (repo, deploys, domínios, env)
- Fluxo OAuth Mercado Livre (autorização → token → refresh)
- Endpoints ML mais usados (items, orders, users, questions, pictures)
- Webhooks / Notifications (recebimento e validação)
- Armazenamento e rotação de credenciais
- Caching e performance (Redis / Vercel KV / edge)
- Observability / logs / alertas
- Segurança e compliance (LGPD)
- Plano de implementação e checklist técnico

---

1) Preparação e configurações na Vercel
- Criar projeto na Vercel conectado ao repositório Git (GitHub/GitLab/Bitbucket).
- Branches e Deploys:
  - `main` → produção automática
  - feature branches → preview deploys automáticos
- Domains:
  - Associar domínio principal (ex: peepers.com.br) e configurar SSL (Vercel cuida automaticamente).
- Environment Variables (configurar em Project Settings → Environment Variables):
  - NEXT_PUBLIC_BASE_URL = https://peepers.com.br (usado client-side)
  - NEXTAUTH_URL (se usar NextAuth) = https://peepers.com.br
  - ML_CLIENT_ID = <seu client_id do Mercado Livre>
  - ML_CLIENT_SECRET = <seu client_secret>
  - ML_REDIRECT_URI = https://peepers.com.br/api/ml/auth/callback
  - ML_WEBHOOK_SECRET = <segredo para validar notificações> (se ML suportar)
  - DATABASE_URL, REDIS_URL ou VERCEL_KV_URL, VERCEL_KV_TOKEN, etc.
  - SENTRY_DSN (ou outro provider de observabilidade)
  - Any other keys for third-party integrations
- Build & Output:
  - Next.js (App Router) funciona nativamente na Vercel.
  - Ajustar Build Command (normalmente `npm run build`) e Output Directory (Next defaults).
- Functions & Serverless:
  - Use API Routes (app/api or pages/api) para endpoints server-side que falam com Mercado Livre (tokens, webhooks, sync jobs).
  - Para operações longas (sincronização de milhares de produtos), usar background jobs (Vercel cron or offload to a worker-hosted task or queue).
- Webhooks (Vercel) — criar API route pública para receber notificações do Mercado Livre (ex: POST /api/ml/webhook).
  - Registre a URL de webhook no painel de desenvolvedor ML conforme exigido.
  - Garanta HTTPS e resposta 200 OK rápido.

2) Mercado Livre — visão geral e fluxo OAuth2 (autorização)
- URLs principais:
  - Authorization (user consent): https://auth.mercadolibre.com/authorization?response_type=code&client_id=CLIENT_ID&redirect_uri=REDIRECT_URI
  - Token endpoint (exchange code): https://api.mercadolibre.com/oauth/token
  - API base: https://api.mercadolibre.com
- Fluxo (authorization code):
  1. Usuário/admin faz login/consente no ML: redirecionar para Authorization URL.
  2. ML redireciona para ML_REDIRECT_URI com `code`.
  3. Trocar `code` por `access_token` + `refresh_token` no endpoint /oauth/token (POST).
  4. Salvar tokens com segurança (encrypted at rest). Access tokens têm TTL; refresh_token deve ser usado para renovar.
  5. Implementar job/cron para rotacionar tokens antes do expiry e tratar erros 401 re-obtendo refresh.
- Recomendação de armazenamento:
  - Tokens e credenciais: banco (Postgres) em tabela encrypted_tokens OR secrets store; mantê-los cifrados (ex: libsodium, AWS KMS, or a small symmetric key in Vercel Secrets if necessary).
  - Para multi-seller support: associe user_id/merchant_id do ML com registros locais e seus tokens.
- Escopos/permissões:
  - Ao criar o app ML, escolha os scopes necessários (ex.: pedidos, listagem, leitura de perguntas). Solicite o mínimo necessário.

3) Endpoints ML relevantes para o e‑commerce (exemplos)
- GET /users/:user_id — obter dados do vendedor
- GET /items/:item_id — detalhes do produto
- GET /items?ids=ID1,ID2 — multiget
- GET /orders/:order_id — obter pedido
- GET /orders/search?seller=SELLER_ID — listar pedidos do seller
- POST /items — criar/atualizar anúncios (se for necessário publicar pelo app)
- GET /questions/search?seller=SELLER_ID — perguntas recebidas
- Upload de imagens — endpoints de upload de imagens (pictures)
- OBS: consulte a documentação ML para endpoints regionais/versões e corpo das requests.
- Cabeçalhos:
  - Authorization: Bearer ACCESS_TOKEN
  - Accept: application/json
  - Content-Type: application/json

4) Webhooks / Notifications (recebimento e processamento)
- Mercado Livre envia notificações para endpoints configurados (varia por recurso: orders, questions, items).
- Ao implementar:
  - Expor POST /api/ml/webhook (ou similar) que:
    - valida payload/signature (se ML fornecer header de assinatura) — se ML não fornecer, aplicar medidas alternativas (verificar origem, timestamps, event dedup).
    - responde com HTTP 200 rapidamente (ack) para evitar re-tries.
    - enfileira payload para processamento assíncrono (ex: job queue, Vercel worker, or background process).
    - processa eventos: order_created → buscar dados detalhados da order, persistir, notificar sistema de fulfillment; item_updated → atualizar cache local.
- Idempotência e deduplicação:
  - Use event ID + dedupe store (Redis) para evitar processamento duplo.
- Segurança:
  - Se ML fornece um signature header, valide HMAC usando ML_WEBHOOK_SECRET.
  - Limitar request methods e rate; bloquear IPs suspeitos.

5) Token lifecycle & refresh strategy
- Access tokens podem expirar (varia). Always:
  - On 401 from ML, attempt refresh using refresh_token.
  - Implement backoff and alerting if refresh fails.
  - Store refresh_token rotation info if ML issues rotating refresh tokens.
- Rate limiting:
  - Respectar limites ML; exponha retry-with-backoff and circuit-breaker patterns.
- Recommendation: central token manager service with functions:
  - getAccessToken(sellerId): returns valid token (refreshes if expired)
  - invalidateToken(sellerId): used on revocation or auth error

6) Caching strategy
- Products and listings:
  - Cache read-heavy endpoints (products list, product details) using:
    - Vercel Edge Cache / CDN for public pages
    - Redis or Vercel KV for server-side caches (fast access, TTL).
  - TTL suggestions:
    - Product list: 1–5 minutes (depends update frequency)
    - Product detail: 5–30 minutes
  - Implement cache invalidation on webhook events (item_updated) to keep site consistent.
- Use conditional fetching (ETags / If-Modified-Since) where supported.

7) Background sync & scalability
- For bulk sync of seller's inventory:
  - Implement paginated sync (batch sizes tuned for ML limits).
  - Use job queue (e.g., Redis queue, vercel-offline worker, or external worker) to process batches and persist them.
  - Avoid long-running serverless functions — break into small jobs.

8) Observability, logging e alertas
- Logs:
  - Centralize logs (Sentry / Datadog / Vercel logs).
  - Log ML API errors, webhook validation failures, token refresh failures.
- Metrics:
  - Count of webhook events processed, sync duration, cache hit ratio.
- Alerts:
  - Token refresh failure threshold
  - High error rate from ML endpoints
  - Webhook delivery failures

9) Security & compliance (LGPD)
- Tokens and PII must be encrypted at rest.
- Minimize personal data stored; when storing, record lawful basis & retention policy.
- Expose data access and deletion endpoint/procedure.
- Secure API endpoints with authentication and CSRF protections where applicable.

10) Implementation checklist (tactical)
- [ ] Criar app Mercado Livre no painel de dev (feito por você) — copiar client_id, client_secret.
- [ ] Adicionar env vars na Vercel (ML_CLIENT_ID, ML_CLIENT_SECRET, ML_REDIRECT_URI, ML_WEBHOOK_SECRET, NEXTAUTH_URL, DATABASE_URL, REDIS_URL).
- [ ] Implementar API route: /api/ml/auth/authorize → redireciona para ML authorization URL.
- [ ] Implementar API route: /api/ml/auth/callback → troca code por tokens e persiste tokens (encrypted).
- [ ] Implementar token manager utilitário com refresh logic.
- [ ] Implementar /api/ml/webhook para receber eventos; validar; enfileirar work.
- [ ] Implementar sync job: /api/ml/sync?action=sync (protected).
- [ ] Caching: integrar Redis/VerceKV; implementar cache invalidation na chegada de webhooks.
- [ ] Observability: configurar Sentry/Prometheus traces.
- [ ] Testes: contratos para webhook, unit tests para token refresh, integration tests para ML API (usar sandbox ML se disponível).
- [ ] Review de segurança e secrets rotation policy.

11) Considerações para o ambiente de desenvolvimento local
- Use .env.local com placeholders (não commit).
- For local webhook testing, use ngrok / localtunnel and register temporary webhook URL in ML dev console.
- Use ML sandbox/test account if available for safe testing.

12) Notas e links úteis
- Endpoint Authorization: https://auth.mercadolibre.com/authorization
- Token exchange: https://api.mercadolibre.com/oauth/token
- Mercado Libre Developers: https://developers.mercadolibre.com
- Vercel docs: https://vercel.com/docs

---

Conclusão
Este documento serve como referência operacional para a integração. Próximo passo: aplicar essas informações na documentação do projeto (README, API_SPEC, DELIVERY_PLAN) — eu posso atualizar exatamente esses arquivos com guia passo-a-passo e exemplos de rotas e variáveis de ambiente para o time. Quer que eu atualize agora o README.md e API_SPEC.md com um resumo dessas instruções e um checklist pronto para execução?
