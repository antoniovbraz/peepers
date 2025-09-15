#!/bin/bash

# Script para testar endpoints em produção
# Uso: ./test-prod.sh [endpoint]

PROD_URL="https://peepers.vercel.app"
ENDPOINT=${1:-"products-public"}

echo "🧪 Testando endpoint: $ENDPOINT"
echo "🌐 URL: $PROD_URL/api/$ENDPOINT"
echo ""

case $ENDPOINT in
    "health")
        echo "🏥 Testando health check..."
        curl -s $PROD_URL/api/health | jq '.'
        ;;
    "products-public")
        echo "📦 Testando produtos públicos..."
        curl -s $PROD_URL/api/products-public | jq '{success, total, message, source}'
        ;;
    "products")
        echo "🔒 Testando produtos autenticados (deve falhar)..."
        curl -s $PROD_URL/api/products | jq '.'
        ;;
    "auth-me")
        echo "👤 Testando autenticação (deve redirecionar)..."
        curl -I $PROD_URL/api/auth/me
        ;;
    "sync")
        echo "🔄 Testando sincronização (deve falhar)..."
        curl -s $PROD_URL/api/sync | jq '.'
        ;;
    "all")
        echo "🔍 Testando todos os endpoints..."
        echo ""
        echo "1. Health:"
        $0 health
        echo ""
        echo "2. Produtos públicos:"
        $0 products-public
        echo ""
        echo "3. Produtos autenticados:"
        $0 products
        echo ""
        echo "4. Autenticação:"
        $0 auth-me
        ;;
    *)
        echo "❌ Endpoint desconhecido: $ENDPOINT"
        echo ""
        echo "📋 Endpoints disponíveis:"
        echo "  health          - Health check"
        echo "  products-public - Produtos públicos"
        echo "  products        - Produtos autenticados"
        echo "  auth-me         - Status de autenticação"
        echo "  sync            - Sincronização de produtos"
        echo "  all             - Todos os endpoints"
        echo ""
        echo "💡 Uso: $0 <endpoint>"
        ;;
esac

echo ""
echo "✅ Teste concluído!"