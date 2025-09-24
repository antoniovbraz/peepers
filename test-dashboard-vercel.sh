#!/bin/bash

# ============================================================================
# TESTE COMPLETO DASHBOARD PEEPERS - VERCEL
# ============================================================================
# Script para testar o dashboard completo no Vercel após deploy
# Data: 2025-01-18
# ============================================================================

set -e  # Exit on any error

# Configuração
VERCEL_URL="${VERCEL_URL:-peepers.vercel.app}"
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
# TESTE: DASHBOARD COMPLETO
# ============================================================================

log "🚀 Iniciando teste completo do dashboard Peepers no Vercel..."

# 1. Verificar saúde da aplicação
log "🏥 Verificando saúde da aplicação..."
HEALTH_RESPONSE=$(make_request "$BASE_URL/api/health" "GET")
echo "$HEALTH_RESPONSE"

# 2. Verificar status de sincronização de pedidos
log "📊 Verificando status de sincronização de pedidos..."
SYNC_STATUS_RESPONSE=$(make_request "$BASE_URL/api/sync-orders" "GET")
echo "$SYNC_STATUS_RESPONSE"

# 3. Executar sincronização de pedidos
log "🔄 Executando sincronização de pedidos..."
SYNC_RESPONSE=$(make_request "$BASE_URL/api/sync-orders" "POST")
echo "$SYNC_RESPONSE"

# 4. Verificar métricas do dashboard (sem autenticação - deve falhar)
log "📈 Tentando acessar métricas do dashboard (deve falhar sem auth)..."
DASHBOARD_RESPONSE=$(make_request "$BASE_URL/api/admin/dashboard/metrics" "GET")
echo "$DASHBOARD_RESPONSE"

# 5. Verificar produtos públicos
log "📦 Verificando produtos públicos..."
PRODUCTS_RESPONSE=$(make_request "$BASE_URL/api/products-public" "GET")
echo "$PRODUCTS_RESPONSE"

# 6. Verificar cache debug
log "🔍 Verificando debug do cache..."
CACHE_RESPONSE=$(make_request "$BASE_URL/api/cache-debug" "GET")
echo "$CACHE_RESPONSE"

success "✅ Teste completo do dashboard concluído!"
log "📋 Próximos passos:"
echo "   1. Faça login no dashboard: $BASE_URL/login"
echo "   2. Acesse o admin: $BASE_URL/admin/dashboard"
echo "   3. Verifique se os cards mostram dados reais"
echo "   4. Se ainda estiver zerado, execute sync manualmente"
echo ""
log "🔗 URLs importantes:"
echo "   - Dashboard: $BASE_URL/admin/dashboard"
echo "   - Sync Orders: $BASE_URL/api/sync-orders"
echo "   - Cache Debug: $BASE_URL/api/cache-debug"
echo "   - Products: $BASE_URL/api/products-public"