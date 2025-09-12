---
title: "Plano de Testes — Peepers.com.br"
schema_version: 1
owner: "QA Lead"
last_review: "2025-09-11"
status: "draft"
---

# 🧾 Plano de Testes

## Escopo
- Testes sincronização Mercado Livre.
- Testes PWA (mobile-first).
- Testes admin (banners e promoções).

## Estratégia
- Unitários: parsing de produtos ML.
- Integração: sync ML → Redis → Frontend.
- E2E: fluxo usuário → vitrine → clique em comprar (híbrido).
