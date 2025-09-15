#!/bin/bash

# Script para desenvolvimento local com HTTPS
# Facilita a configuração do túnel HTTPS para desenvolvimento com Mercado Livre

echo "🚀 Iniciando desenvolvimento local com HTTPS..."
echo ""

# Verificar se localtunnel está instalado
if ! command -v lt &> /dev/null; then
    echo "📦 Instalando localtunnel..."
    npm install -g localtunnel
fi

# Iniciar o servidor Next.js em background
echo "🔧 Iniciando servidor Next.js..."
npm run dev &
SERVER_PID=$!

# Aguardar o servidor iniciar
sleep 3

# Criar túnel HTTPS
echo "🌐 Criando túnel HTTPS..."
echo "Aguarde a URL do túnel aparecer..."
npm run tunnel &
TUNNEL_PID=$!

# Aguardar o túnel ser criado
sleep 5

echo ""
echo "✅ Configuração completa!"
echo ""
echo "📋 Próximos passos:"
echo "1. Copie a URL HTTPS gerada acima"
echo "2. Atualize seu .env.local:"
echo "   NEXT_PUBLIC_APP_URL=https://sua-url-aqui.loca.lt"
echo "3. Configure no Mercado Livre:"
echo "   - Redirect URI: https://sua-url-aqui.loca.lt/api/auth/mercado-livre/callback"
echo "   - Webhook URL: https://sua-url-aqui.loca.lt/api/webhook/mercado-livre"
echo ""
echo "🛑 Para parar: pressione Ctrl+C"

# Aguardar interrupção
trap "echo '🛑 Parando servidores...'; kill $SERVER_PID $TUNNEL_PID; exit" INT
wait