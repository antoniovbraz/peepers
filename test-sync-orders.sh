#!/bin/bash

# ============================================================================
# TESTE DE SINCRONIZAÇÃO DE PEDIDOS
# ============================================================================
# Script para testar a sincronização de pedidos do Mercado Livre
# Data: 2025-01-18
# ============================================================================

set -e  # Exit on any error

# Configuração
VERCEL_URL="${VERCEL_URL:-peepers-xi.vercel.app}"
BASE_URL="https://${VERCEL_URL}"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para logging
log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Função para fazer requisições HTTP
make_request() {
    local url="$1"
    local method="${2:-GET}"
    local data="$3"

    echo "🌐 $method $url"
    if [ "$method" = "POST" ] && [ -n "$data" ]; then
        curl -s -X "$method" \
             -H "Content-Type: application/json" \
             -d "$data" \
             "$url"
    else
        curl -s -X "$method" "$url"
    fi
    echo -e "\n"
}

# ============================================================================
# TESTE: SINCRONIZAÇÃO DE PEDIDOS
# ============================================================================

log "🚀 Iniciando teste de sincronização de pedidos..."

# 1. Verificar status atual
log "📊 Verificando status atual dos pedidos..."
STATUS_RESPONSE=$(make_request "$BASE_URL/api/sync-orders" "GET")
echo "$STATUS_RESPONSE"

# 2. Executar sincronização
log "🔄 Executando sincronização de pedidos..."
SYNC_RESPONSE=$(make_request "$BASE_URL/api/sync-orders" "POST")
echo "$SYNC_RESPONSE"

# 3. Verificar status após sincronização
log "📊 Verificando status após sincronização..."
STATUS_AFTER_RESPONSE=$(make_request "$BASE_URL/api/sync-orders" "GET")
echo "$STATUS_AFTER_RESPONSE"

# 4. Verificar dados no dashboard
log "📈 Verificando dados no dashboard..."
DASHBOARD_RESPONSE=$(make_request "$BASE_URL/api/admin/dashboard/metrics" "GET")
echo "$DASHBOARD_RESPONSE"

success "✅ Teste de sincronização de pedidos concluído!"
log "📋 Resumo dos resultados:"
echo "   - Status inicial: $(echo "$STATUS_RESPONSE" | grep -o '"needsSync":[^,]*' || echo 'N/A')"
echo "   - Sincronização: $(echo "$SYNC_RESPONSE" | grep -o '"synced":[^,]*' || echo 'N/A')"
echo "   - Status final: $(echo "$STATUS_AFTER_RESPONSE" | grep -o '"needsSync":[^,]*' || echo 'N/A')"
echo "   - Dashboard: $(echo "$DASHBOARD_RESPONSE" | grep -o '"totalRevenue":[^,]*' || echo 'N/A')"