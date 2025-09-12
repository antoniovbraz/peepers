---
title: "README — Peepers.com.br"
schema_version: 2
owner: "Antonio Henrique Vanucci"
last_review: "2025-09-12"
status: "in-progress"
---

# 📘 README — Peepers.com.br

Bem-vindo à documentação oficial do projeto **Peepers.com.br** — site institucional + vitrine integrada ao Mercado Livre.

Este README foi atualizado para incluir orientações de implantação na Vercel e um guia operacional para a integração completa com a API do Mercado Livre. Para informações operacionais detalhadas sobre a integração, veja: `VERCEL_MERCADO_LIVRE_INTEGRATION.md`.

## 🎯 Objetivo
Criar um PWA (mobile-first, responsivo) hospedado na Vercel que funcione como:
- Site institucional
- Vitrine integrada ao Mercado Livre
- Página B2B
- Blog SEO
- Painel administrativo simples

## 📦 Estrutura do repositório (resumo)
- README.md — visão geral (este arquivo)
- VERCEL_MERCADO_LIVRE_INTEGRATION.md — guia de integração Vercel + Mercado Livre (novo)
- API_SPEC.md — especificação das APIs (resumida)
- ARCHITECTURE.md — arquitetura técnica
- DELIVERY_PLAN.md — plano de entregas
- PRD.md — requisitos de produto
- QA_TEST_PLAN.md — testes e critérios
- memory-bank/ — logs e aprendizados
- peepers-website/ — aplicação Next.js (App Router + Tailwind)

## 🛠️ Stack principal
- Frontend: Next.js (App Router) + React + TailwindCSS
- Backend (server-side functions / API routes): Next.js API Routes (Node)
- Cache: Redis / Vercel KV (opcional)
- Infra / Hosting: Vercel (Preview + Production deploys)
- Observability: Sentry / Vercel Logs / OpenTelemetry (planejado)
- Integração externa: Mercado Livre (OAuth2, Webhooks, REST API)

## Rápido guia de desenvolvimento local
1. Instalar dependências:
   - cd peepers-website && npm install
2. Rodar servidor de desenvolvimento:
   - cd peepers-website && npm run dev
   - A aplicação será exposta em http://localhost:3000 (ou 3001 se 3000 estiver ocupado)
3. Variáveis de ambiente (criar `.env.local` no diretório `peepers-website`):
   - NEXT_PUBLIC_BASE_URL=http://localhost:3000
   - NEXTAUTH_URL=http://localhost:3000
   - (quando integrar ML) ML_CLIENT_ID=... ML_CLIENT_SECRET=... ML_REDIRECT_URI=http://localhost:3000/api/ml/auth/callback
   - DATABASE_URL=...
   - REDIS_URL=...
   - NÃO coloque chaves reais no repositório

## Notas sobre Tailwind / PostCSS
- Projeto usa Tailwind v4+; PostCSS está configurado com o adaptador oficial `@tailwindcss/postcss`.
- Se encontrar erros relacionados a utilitários desconhecidos (ex.: `bg-green-700`) verifique `peepers-website/tailwind.config.js` (aliases de cores foram adicionados).
- Arquivo principal de estilos: `peepers-website/src/app/globals.css` (contém utilitários customizados e constraints para imagens/SVGs).

## Vercel — checklist mínimo para deploy (resumo)
- Conectar repositório ao projeto Vercel.
- Configurar branches: `main` → produção; feature branches → previews.
- Adicionar environment variables no painel do projeto:
  - NEXT_PUBLIC_BASE_URL
  - NEXTAUTH_URL
  - ML_CLIENT_ID, ML_CLIENT_SECRET, ML_REDIRECT_URI, ML_WEBHOOK_SECRET
  - DATABASE_URL, REDIS_URL (ou VERCEL_KV_* se usar Vercel KV)
  - SENTRY_DSN (opcional)
- Build Command: npm run build (padrão Next.js)
- Garantir rotas de API públicas para:
  - /api/ml/auth/authorize
  - /api/ml/auth/callback
  - /api/ml/webhook
  - /api/products (exposição para frontend — usa cache)

Para o checklist completo e fluxos de OAuth/webhooks consulte `VERCEL_MERCADO_LIVRE_INTEGRATION.md`.

## Integração Mercado Livre — pontos importantes (resumo)
- Fluxo OAuth Authorization Code: redirecionar para `https://auth.mercadolibre.com/authorization` e trocar `code` por tokens em `https://api.mercadolibre.com/oauth/token`.
- Armazenar `access_token` e `refresh_token` cifrados; implementar rotina de refresh.
- Usar webhooks para atualizar cache local quando produtos/pedidos mudam.
- Respeitar rate-limits e aplicar retry/backoff.

## Erros e avisos vistos durante auditoria local
- Next.js lançou avisos sobre metadata exports (viewport/themeColor): mover configurações para `viewport` export conforme documentação do Next.
- Em Windows + OneDrive, o cache `.next` pode ficar corrompido (readlink EINVAL) — solução: remover `.next` e reiniciar dev server.
- Ajustei ícones SVG brutos para `lucide-react` e converti imagens de produto para `next/image`.

## Próximos passos (sugestão imediata)
- Atualizar `API_SPEC.md` com rotas ML/Token/Sync detalhadas (posso fazer agora).
- Implementar API routes de OAuth e webhook (em `peepers-website/src/app/api/ml/...`).
- Inicializar Git (recomendo criar branch `fix/layout-audit`) e commitar alterações.
- Testes end-to-end para fluxo OAuth e webhooks (usar ngrok para testes de webhook local).

## Contato / Responsável
- Owner / Product: Antonio Henrique Vanucci
