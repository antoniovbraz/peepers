/**
 * ⚠️ WEBHOOK HTTPS REQUIREMENTS - MERCADO LIVRE
 *
 * DOCUMENTAÇÃO CRÍTICA: Requisitos obrigatórios para webhooks do ML
 *
 * ❌ PROBLEMA IDENTIFICADO:
 * - Webhooks do ML NÃO funcionam em desenvolvimento local sem HTTPS
 * - URLs devem ser públicas e acessíveis externamente
 * - ML rejeita webhooks que não atendem aos requisitos de segurança
 *
 * ✅ SOLUÇÃO RECOMENDADA:
 * - Usar Vercel para desenvolvimento com webhooks reais
 * - Configurar HTTPS obrigatório
 * - Usar URLs públicas pré-configuradas no painel do ML
 *
 * 📚 REFERÊNCIAS OFICIAIS:
 * - https://developers.mercadolivre.com.br/pt_br/produto-receba-notificacoes
 * - https://developers.mercadolivre.com.br/pt_br/autenticacao-e-autorizacao
 */

export const WEBHOOK_HTTPS_REQUIREMENTS = {
  // ⚠️ CRÍTICO: HTTPS obrigatório para TODAS as operações do ML
  HTTPS_REQUIRED: true,

  // URLs devem ser públicas e acessíveis externamente
  PUBLIC_ACCESS_REQUIRED: true,

  // IPs oficiais do ML para whitelist
  ALLOWED_IPS: [
    '54.88.218.97',
    '18.215.140.160',
    '18.213.114.129',
    '18.206.34.84'
  ] as const,

  // Timeout máximo de resposta (ML desabilita webhooks se > 500ms)
  MAX_RESPONSE_TIME_MS: 500,

  // Desenvolvimento local: IMPOSSÍVEL com webhooks reais
  LOCAL_DEVELOPMENT_LIMITATIONS: {
    https: false,           // Local não tem HTTPS nativo
    public_access: false,   // Localhost não é acessível externamente
    ml_integration: false   // ML rejeita URLs locais
  },

  // Soluções para desenvolvimento
  DEVELOPMENT_SOLUTIONS: {
    vercel_deployment: 'vercel --prod',  // Deploy rápido para HTTPS
    mock_mode: 'npm run dev:mock',       // Desenvolvimento com mocks
    https_tunnel: 'ngrok https 3000',    // Túnel HTTPS (não recomendado)
  }
} as const;

/**
 * Valida se o ambiente atual suporta webhooks do ML
 */
export function validateWebhookEnvironment(): {
  isValid: boolean;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Verificar se está em produção (Vercel)
  const isProduction = process.env.VERCEL_ENV === 'production' ||
                      process.env.NODE_ENV === 'production';

  // Verificar HTTPS
  const hasHttps = typeof window !== 'undefined'
    ? window.location.protocol === 'https:'
    : process.env.NODE_ENV === 'production';

  if (!hasHttps && !isProduction) {
    issues.push('❌ HTTPS não disponível em desenvolvimento local');
    recommendations.push('✅ Use "vercel --prod" para deploy com HTTPS');
    recommendations.push('✅ Use "npm run dev:mock" para desenvolvimento sem ML');
  }

  // Verificar se URL é pública
  const isLocalhost = typeof window !== 'undefined'
    ? window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    : !process.env.VERCEL_URL;

  if (isLocalhost) {
    issues.push('❌ URLs locais não são acessíveis pelo ML');
    recommendations.push('✅ Configure webhook URL no painel do ML Developer');
    recommendations.push('✅ Use URL do Vercel (https://*.vercel.app)');
  }

  return {
    isValid: issues.length === 0,
    issues,
    recommendations
  };
}

/**
 * Gera documentação de configuração para webhooks
 */
export function generateWebhookSetupGuide(): string {
  return `
# 🚀 Guia de Configuração - Webhooks Mercado Livre

## ⚠️ REQUISITOS CRÍTICOS

### 1. HTTPS Obrigatório
- ✅ Use sempre HTTPS (obrigatório pelo ML)
- ✅ URLs devem ser públicas e acessíveis
- ❌ Desenvolvimento local: IMPOSSÍVEL sem túnel HTTPS

### 2. Configuração no ML Developer Panel
1. Acesse: https://developers.mercadolivre.com.br/
2. Vá para seu aplicativo
3. Configure Webhook URL: \`https://your-domain.vercel.app/api/webhook/mercado-livre\`
4. Habilite tópicos desejados (orders_v2, items, etc.)

### 3. Desenvolvimento Recomendado
\`\`\`bash
# Para desenvolvimento COM webhooks reais:
vercel --prod                    # Deploy para HTTPS
npm run test:prod webhook       # Teste webhook na URL pública

# Para desenvolvimento SEM webhooks reais:
npm run dev:mock                # Desenvolvimento com mocks
\`\`\`

### 4. Teste de Segurança
\`\`\`bash
# Testar IP whitelist
curl -X POST https://your-domain.vercel.app/api/test-webhook-security \\
  -H "Content-Type: application/json" \\
  -d '{"topic":"orders_v2","test_ip":"54.88.218.97"}'

# Testar timeout
curl -X POST https://your-domain.vercel.app/api/test-webhook-security \\
  -H "Content-Type: application/json" \\
  -d '{"topic":"orders_v2","simulate_delay":600}'
\`\`\`

## 🔧 Troubleshooting

### Erro: "IP not in ML whitelist"
- ✅ Verifique se o IP está na lista oficial do ML
- ✅ Use apenas IPs autorizados: 54.88.218.97, 18.215.140.160, 18.213.114.129, 18.206.34.84

### Erro: "Processing exceeded 500ms timeout"
- ✅ Otimize processamento do webhook
- ✅ Use processamento assíncrono quando possível
- ✅ Monitore tempo de resposta

### Erro: "HTTPS required"
- ✅ Use sempre HTTPS em produção
- ✅ Configure URLs públicas no ML Developer Panel
- ✅ Evite desenvolvimento local com webhooks reais
`;
}