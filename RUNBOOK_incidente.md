---
title: "Runbook — Peepers.com.br"
schema_version: 1
owner: "SRE/DevOps Team"
last_review: "2025-09-11"
status: "draft"
---

# 🚨 Runbook de Incidentes

## Casos prováveis
1. **API Mercado Livre fora do ar** → fallback cache Redis.
2. **Falha Vercel** → rollback versão anterior.
3. **PWA indisponível** → comunicação com usuários + escalonamento.
