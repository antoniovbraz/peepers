---
title: "Arquitetura — Peepers.com.br"
schema_version: 1
owner: "Arquiteto de Software"
last_review: "2025-09-11"
status: "draft"
---

# 🏗️ Arquitetura Técnica

## Stack
- Frontend: Next.js + TailwindCSS
- Backend: Node.js + Express
- Banco: PostgreSQL
- Cache: Redis
- Infra: Vercel
- Integrações: API Mercado Livre (OAuth2)

## Segurança
- OAuth2 para Mercado Livre
- JWT interno para admin
- Segredos armazenados em Vault

## Escalabilidade
- Redis para cache de produtos
- Retry automático em falha de API ML
- CDN via Vercel Edge
