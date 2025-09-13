#!/bin/bash

echo "🧪 TESTE DOS ENDPOINTS - PEEPERS API"
echo "===================================="
echo ""

BASE_URL="http://localhost:3000"

echo "📊 1. Testando /api/products (Principal)..."
response=$(curl -s "$BASE_URL/api/products")
if echo "$response" | grep -q "success\|products\|total"; then
    echo "✅ /api/products respondeu com dados"
    echo "$response" | head -3
else
    echo "❌ /api/products não respondeu corretamente"
    echo "Response: $response"
fi
echo ""

echo "📊 2. Testando /api/ml/products (Backup)..."
response=$(curl -s "$BASE_URL/api/ml/products")
if echo "$response" | grep -q "products\|total\|message"; then
    echo "✅ /api/ml/products respondeu com dados"
    echo "$response" | head -3
else
    echo "❌ /api/ml/products não respondeu corretamente"
    echo "Response: $response"
fi
echo ""

echo "📊 3. Testando /api/health..."
response=$(curl -s "$BASE_URL/api/health")
if echo "$response" | grep -q "status\|timestamp"; then
    echo "✅ /api/health respondeu"
    echo "$response"
else
    echo "❌ /api/health não respondeu corretamente"
fi
echo ""

echo "📊 4. Testando /api/ml/auth..."
response=$(curl -s "$BASE_URL/api/ml/auth")
if echo "$response" | grep -q "redirect\|url\|auth"; then
    echo "✅ /api/ml/auth respondeu (redirecionamento)"
else
    echo "❌ /api/ml/auth não respondeu corretamente"
    echo "Response: $response"
fi
echo ""

echo "🏁 Teste completo!"