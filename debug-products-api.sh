#!/bin/bash

echo "=== Testing API Behavior ==="
echo ""

echo "1. Testing /api/products (authenticated endpoint):"
curl -s -w "\nStatus: %{http_code}\n" "https://peepers.vercel.app/api/products?format=summary&limit=50"

echo ""
echo "2. Testing /api/products-public (public endpoint):"
curl -s -w "\nStatus: %{http_code}\n" "https://peepers.vercel.app/api/products-public?limit=10"

echo ""
echo "3. Testing /api/health:"
curl -s -w "\nStatus: %{http_code}\n" "https://peepers.vercel.app/api/health"

echo ""
echo "4. Testing with browser-like headers:"
curl -s -w "\nStatus: %{http_code}\n" \
  -H "Accept: application/json" \
  -H "Cache-Control: no-cache" \
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" \
  "https://peepers.vercel.app/api/products?format=summary&limit=50"