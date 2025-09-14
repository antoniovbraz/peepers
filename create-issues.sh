#!/bin/bash
# Script para criar issues no GitHub automaticamente

ISSUES=(
    'CRÍTICO: Corrigir configuração Vercel quebrada|/api/ml/ references in vercel.json must be updated to new routes|bug|high'
    'CRÍTICO: Corrigir testes quebrados|Vitest cannot resolve @/config/routes path aliases|bug|high'
    'ALTO: Remover strings hardcoded|Replace all hardcoded /api/ml/ routes with centralized constants|enhancement|high'
    'ALTO: Implementar CI/CD básico|Add GitHub Actions workflows for lint, test, build, deploy|enhancement|high'
    'ALTO: Implementar PWA|Add manifest.json, service worker, and PWA functionality|enhancement|high'
    'MÉDIO: Reescrever README|Replace default Next.js README with comprehensive project documentation|documentation|medium'
    'MÉDIO: Implementar rate limiting|Add rate limiting to API endpoints for security|enhancement|medium'
    'MÉDIO: Implementar backup/rollback|Create automated backup and rollback strategy for data|enhancement|medium'
    'MÉDIO: Adicionar monitoramento|Implement metrics, alerts, and structured logging|enhancement|medium'
    'BAIXO: Gerar documentação técnica|Create OpenAPI spec, ADRs, QA docs, Security docs, Runbooks|documentation|low'
    'BAIXO: Melhorar cobertura de testes|Increase test coverage to 90%+ with integration tests|enhancement|low'
    'BAIXO: Implementar validações de API|Add comprehensive input validation and error handling|enhancement|low'
    'BAIXO: Auditar acessibilidade|Review and improve UI/UX accessibility compliance|enhancement|low'
    'BAIXO: Otimizar performance|Add performance monitoring and optimizations|enhancement|low'
    'BAIXO: Implementar feature flags|Add feature flag system for safe deployments|enhancement|low'
)

for issue in "${ISSUES[@]}"; do
    IFS='|' read -r title body label priority <<< "$issue"
    echo "Criando issue: $title"
    echo "gh issue create --title '$title' --body '$body' --label '$label,$priority'"
    echo ""
done