#!/bin/bash

# ============================================================================
# TESTE COMPLETO INTEGRAÇÃO MERCADO LIVRE VIA CURL
# ============================================================================
# Script para testar toda a integração ML usando curl
# Data: 2025-09-18
# Status: ML Compliance Testing
# ============================================================================

set -e  # Exit on any error

# Configuração
VERCEL_URL="${VERCEL_URL:-peepers-xi.vercel.app}"
BASE_URL="https://${VERCEL_URL}"
TEST_LOG="ml-integration-test.log"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para logging
log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1" | tee -a "$TEST_LOG"
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$TEST_LOG"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$TEST_LOG"
}

error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$TEST_LOG"
}

# Função para medir tempo de resposta
curl_with_timing() {
    local url="$1"
    local method="${2:-GET}"
    local data="$3"
    local headers="$4"
    
    if [ "$method" = "POST" ] && [ -n "$data" ]; then
        curl -w "@curl-format.txt" -H "Content-Type: application/json" ${headers:+-H "$headers"} -X "$method" -d "$data" "$url" -s
    else
        curl -w "@curl-format.txt" ${headers:+-H "$headers"} -X "$method" "$url" -s
    fi
}

# Criar arquivo de formato para curl timing
cat > curl-format.txt << 'EOF'
{
  "time_namelookup": %{time_namelookup},
  "time_connect": %{time_connect},
  "time_appconnect": %{time_appconnect},
  "time_pretransfer": %{time_pretransfer},
  "time_redirect": %{time_redirect},
  "time_starttransfer": %{time_starttransfer},
  "time_total": %{time_total},
  "http_code": %{http_code},
  "size_download": %{size_download}
}
EOF

echo "============================================================================"
echo "🚀 TESTE COMPLETO INTEGRAÇÃO MERCADO LIVRE"
echo "============================================================================"
echo "📅 Data: $(date)"
echo "🌐 URL Base: $BASE_URL"
echo "📝 Log: $TEST_LOG"
echo ""

# Limpar log anterior
> "$TEST_LOG"

# ============================================================================
# TESTE 1: HEALTH CHECK
# ============================================================================
log "🏥 TESTE 1: Health Check"
echo "----------------------------------------------------------------------------"

HEALTH_RESPONSE=$(curl_with_timing "$BASE_URL/api/health")
HEALTH_CODE=$(echo "$HEALTH_RESPONSE" | jq -r '.http_code' 2>/dev/null || echo "000")
HEALTH_TIME=$(echo "$HEALTH_RESPONSE" | jq -r '.time_total * 1000' 2>/dev/null || echo "0")

if [ "$HEALTH_CODE" = "200" ]; then
    success "Health check OK (${HEALTH_TIME}ms)"
    echo "$HEALTH_RESPONSE" | jq -r 'del(.time_namelookup, .time_connect, .time_appconnect, .time_pretransfer, .time_redirect, .time_starttransfer)' 2>/dev/null || echo "$HEALTH_RESPONSE"
else
    error "Health check failed - HTTP $HEALTH_CODE"
fi
echo ""

# ============================================================================
# TESTE 2: WEBHOOK ENDPOINT (GET)
# ============================================================================
log "📡 TESTE 2: Webhook Endpoint Status"
echo "----------------------------------------------------------------------------"

WEBHOOK_RESPONSE=$(curl_with_timing "$BASE_URL/api/webhook/mercado-livre")
WEBHOOK_CODE=$(echo "$WEBHOOK_RESPONSE" | jq -r '.http_code' 2>/dev/null || echo "000")
WEBHOOK_TIME=$(echo "$WEBHOOK_RESPONSE" | jq -r '.time_total * 1000' 2>/dev/null || echo "0")

if [ "$WEBHOOK_CODE" = "200" ]; then
    success "Webhook endpoint OK (${WEBHOOK_TIME}ms)"
    echo "$WEBHOOK_RESPONSE" | jq 2>/dev/null || echo "$WEBHOOK_RESPONSE"
else
    error "Webhook endpoint failed - HTTP $WEBHOOK_CODE"
fi
echo ""

# ============================================================================
# TESTE 3: PRODUTOS API (SEM AUTH)
# ============================================================================
log "🛍️  TESTE 3: API de Produtos (Sem Auth)"
echo "----------------------------------------------------------------------------"

PRODUCTS_RESPONSE=$(curl_with_timing "$BASE_URL/api/products-public?format=minimal&limit=5")
PRODUCTS_CODE=$(echo "$PRODUCTS_RESPONSE" | jq -r '.http_code' 2>/dev/null || echo "000")
PRODUCTS_TIME=$(echo "$PRODUCTS_RESPONSE" | jq -r '.time_total * 1000' 2>/dev/null || echo "0")

if [ "$PRODUCTS_CODE" = "200" ]; then
    success "Produtos API OK (${PRODUCTS_TIME}ms)"
    PRODUCTS_COUNT=$(echo "$PRODUCTS_RESPONSE" | jq -r '.products | length' 2>/dev/null || echo "0")
    log "📦 Produtos retornados: $PRODUCTS_COUNT"
else
    error "Produtos API failed - HTTP $PRODUCTS_CODE"
fi
echo ""

# ============================================================================
# TESTE 4: CACHE DEBUG
# ============================================================================
log "💾 TESTE 4: Cache Debug"
echo "----------------------------------------------------------------------------"

CACHE_RESPONSE=$(curl_with_timing "$BASE_URL/api/cache-debug")
CACHE_CODE=$(echo "$CACHE_RESPONSE" | jq -r '.http_code' 2>/dev/null || echo "000")

if [ "$CACHE_CODE" = "200" ]; then
    success "Cache debug OK"
    echo "$CACHE_RESPONSE" | jq '.cache_status' 2>/dev/null || echo "$CACHE_RESPONSE"
else
    error "Cache debug failed - HTTP $CACHE_CODE"
fi
echo ""

# ============================================================================
# TESTE 5: OAUTH FLOW INÍCIO
# ============================================================================
log "🔐 TESTE 5: OAuth Flow - Início"
echo "----------------------------------------------------------------------------"

# Gerar state e code_verifier
STATE=$(openssl rand -hex 16)
CODE_VERIFIER=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-43)
CODE_CHALLENGE=$(echo -n "$CODE_VERIFIER" | openssl dgst -sha256 -binary | openssl base64 | tr -d "=+/" | tr -d '\n')

log "🔑 State: $STATE"
log "🔐 Code Verifier: $CODE_VERIFIER"
log "🔒 Code Challenge: $CODE_CHALLENGE"

# Teste do endpoint OAuth
OAUTH_URL="$BASE_URL/api/auth/mercado-livre"
OAUTH_RESPONSE=$(curl -w "%{http_code}" -s -I "$OAUTH_URL")
OAUTH_CODE="${OAUTH_RESPONSE: -3}"

if [ "$OAUTH_CODE" = "302" ] || [ "$OAUTH_CODE" = "307" ]; then
    success "OAuth endpoint OK - Redirect disponível"
    
    # Construir URL completa do ML
    ML_AUTH_URL="https://auth.mercadolivre.com.br/authorization"
    ML_CLIENT_ID="${ML_CLIENT_ID:-seu_client_id}"
    REDIRECT_URI="$BASE_URL/api/auth/mercado-livre/callback"
    
    FULL_OAUTH_URL="${ML_AUTH_URL}?response_type=code&client_id=${ML_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&state=${STATE}&code_challenge=${CODE_CHALLENGE}&code_challenge_method=S256"
    
    echo ""
    echo "🌐 URL COMPLETA PARA LOGIN MANUAL:"
    echo "============================================================================"
    echo "$FULL_OAUTH_URL"
    echo "============================================================================"
    echo ""
    warning "Por favor, abra esta URL no navegador para completar o OAuth"
    warning "Após o login, o sistema redirecionará e você verá os dados do usuário"
    
else
    error "OAuth endpoint failed - HTTP $OAUTH_CODE"
fi
echo ""

# ============================================================================
# TESTE 6: PRODUTOS API (COM AUTH) - Requer login manual
# ============================================================================
log "🔒 TESTE 6: API de Produtos (Com Auth)"
echo "----------------------------------------------------------------------------"
warning "Este teste requer autenticação via OAuth"
warning "Execute após completar o login no navegador"

PRODUCTS_AUTH_RESPONSE=$(curl_with_timing "$BASE_URL/api/products")
PRODUCTS_AUTH_CODE=$(echo "$PRODUCTS_AUTH_RESPONSE" | jq -r '.http_code' 2>/dev/null || echo "000")

if [ "$PRODUCTS_AUTH_CODE" = "200" ]; then
    success "Produtos autenticados OK"
    echo "$PRODUCTS_AUTH_RESPONSE" | jq 'keys' 2>/dev/null || echo "Response received"
elif [ "$PRODUCTS_AUTH_CODE" = "401" ]; then
    warning "Produtos autenticados requer login (esperado sem auth)"
else
    error "Produtos autenticados failed - HTTP $PRODUCTS_AUTH_CODE"
fi
echo ""

# ============================================================================
# TESTE 7: WEBHOOK SIMULATION (POST)
# ============================================================================
log "📬 TESTE 7: Simulação de Webhook"
echo "----------------------------------------------------------------------------"

# Payload de teste do webhook
WEBHOOK_PAYLOAD='{
  "user_id": 123456789,
  "topic": "orders_v2", 
  "resource": "/orders/1234567890",
  "application_id": "test_app",
  "attempts": 1,
  "sent": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'",
  "received": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"
}'

# Simular IP do ML (apenas para desenvolvimento)
WEBHOOK_TEST_RESPONSE=$(curl_with_timing "$BASE_URL/api/webhook/mercado-livre" "POST" "$WEBHOOK_PAYLOAD" "X-Forwarded-For: 54.88.218.97")
WEBHOOK_TEST_CODE=$(echo "$WEBHOOK_TEST_RESPONSE" | jq -r '.http_code' 2>/dev/null || echo "000")
WEBHOOK_TEST_TIME=$(echo "$WEBHOOK_TEST_RESPONSE" | jq -r '.time_total * 1000' 2>/dev/null || echo "0")

if [ "$WEBHOOK_TEST_CODE" = "200" ]; then
    success "Webhook simulation OK (${WEBHOOK_TEST_TIME}ms)"
    
    # Verificar compliance de tempo
    if (( $(echo "$WEBHOOK_TEST_TIME < 500" | bc -l) )); then
        success "✅ Webhook resposta < 500ms (ML Compliance)"
    else
        error "❌ Webhook resposta > 500ms (ML Compliance VIOLADA)"
    fi
    
    echo "$WEBHOOK_TEST_RESPONSE" | jq 'del(.time_namelookup, .time_connect, .time_appconnect, .time_pretransfer, .time_redirect, .time_starttransfer)' 2>/dev/null || echo "$WEBHOOK_TEST_RESPONSE"
else
    error "Webhook simulation failed - HTTP $WEBHOOK_TEST_CODE"
fi
echo ""

# ============================================================================
# RELATÓRIO FINAL
# ============================================================================
echo "============================================================================"
echo "📊 RELATÓRIO FINAL DOS TESTES"
echo "============================================================================"

TESTS_TOTAL=7
TESTS_PASSED=0

# Contar testes passados
[ "$HEALTH_CODE" = "200" ] && ((TESTS_PASSED++))
[ "$WEBHOOK_CODE" = "200" ] && ((TESTS_PASSED++))
[ "$PRODUCTS_CODE" = "200" ] && ((TESTS_PASSED++))
[ "$CACHE_CODE" = "200" ] && ((TESTS_PASSED++))
[ "$OAUTH_CODE" = "302" ] || [ "$OAUTH_CODE" = "307" ] && ((TESTS_PASSED++))
[ "$PRODUCTS_AUTH_CODE" = "401" ] && ((TESTS_PASSED++))  # 401 é esperado sem auth
[ "$WEBHOOK_TEST_CODE" = "200" ] && ((TESTS_PASSED++))

echo "📈 Total de testes: $TESTS_TOTAL"
echo "✅ Testes aprovados: $TESTS_PASSED"
echo "❌ Testes falharam: $((TESTS_TOTAL - TESTS_PASSED))"
echo "📊 Taxa de sucesso: $(( TESTS_PASSED * 100 / TESTS_TOTAL ))%"

if [ $TESTS_PASSED -eq $TESTS_TOTAL ]; then
    echo ""
    success "🎉 TODOS OS TESTES PASSARAM!"
    success "✅ Integração ML está funcionando corretamente"
elif [ $TESTS_PASSED -ge $((TESTS_TOTAL * 3 / 4)) ]; then
    echo ""
    warning "⚠️  Maioria dos testes passou - revisar falhas menores"
else
    echo ""
    error "❌ Muitos testes falharam - revisar integração"
fi

echo ""
echo "📝 Log completo salvo em: $TEST_LOG"
echo "🌐 Para completar OAuth, use a URL mostrada acima"
echo ""
echo "============================================================================"

# Cleanup
rm -f curl-format.txt

exit $(( TESTS_TOTAL - TESTS_PASSED ))