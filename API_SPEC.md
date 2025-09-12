---
title: "API — Peepers.com.br"
schema_version: 1
owner: "Tech Lead"
last_review: "2025-09-11"
status: "draft"
---

# 🔌 API Specification

## Endpoints Principais
- `GET /products` → lista produtos (cache Redis, origem ML API)
- `POST /admin/banner` → atualiza banner institucional
- `GET /blog/posts` → lista posts do blog
- `POST /blog/posts` → cria post (restrito a admin)

## Autenticação
- OAuth2 (Mercado Livre)
- JWT para admin
