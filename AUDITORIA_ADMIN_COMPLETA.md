# 🔍 AUDITORIA COMPLETA - PÁGINAS ADMIN PEEPERS v2.0.0

**Data da Auditoria**: 19 de Setembro de 2025  
**Escopo**: Transformação completa do Admin Panel para integração 100% com Mercado Livre API  
**Objetivo**: Eliminar todos os dados mock e implementar ERP funcional com dados reais

---

## 📊 **STATUS ATUAL POR PÁGINA ADMIN**

### ✅ **FUNCIONAL COM DADOS REAIS**
| Página | Status | ML API Integrada | Observações |
|--------|--------|------------------|-------------|
| `/admin/produtos` | ✅ FUNCIONAL | `/api/products` | 20 produtos reais, HTTPS corrigido |

### ⚠️ **PARCIALMENTE FUNCIONAL**
| Página | Status | Problemas Identificados | Prioridade |
|--------|--------|------------------------|------------|
| `/admin/dashboard` | 🟡 MOCK + REAL | KPIs usam valor `15.2 // Mock change` | P1 |

### ❌ **100% MOCK DATA**
| Página | Status | API Endpoints | Dados Mock Identificados | Prioridade |
|--------|--------|---------------|-------------------------|------------|
| `/admin/vendas` | ❌ MOCK | `/api/admin/sales` | `getMockOrders`, `getMockSalesMetrics` | P0 |
| `/admin/comunicacao` | ❌ MOCK | `/api/admin/messages` | `mockMessages[]`, fallback mock | P0 |
| `/admin/metricas` | ❌ MOCK | `/api/admin/metrics` | Dados não verificados | P1 |
| `/admin/configuracoes` | ❌ MOCK | N/A | Interface não verificada | P2 |
| `/admin/notificacoes` | ❌ MOCK | N/A | Sistema não implementado | P2 |

---

## 🔧 **ANÁLISE DETALHADA POR COMPONENTE**

### **1. Dashboard (`/admin/dashboard/page.tsx`)**

#### **Problemas Identificados:**
- **Linha 295**: `value: 15.2, // Mock change for now`
- **KPIs**: Produtos, vendas, mensagens usando dados parcialmente reais
- **Gráficos**: SalesChart precisa de dados reais de vendas
- **ActivityFeed**: Feed de atividades usando mock

#### **APIs Necessárias:**
```typescript
// IMPLEMENTAR:
/api/admin/dashboard/metrics - KPIs consolidados
/api/admin/dashboard/sales-chart - Dados para gráficos
/api/admin/dashboard/activity-feed - Feed de atividades reais
```

### **2. Vendas (`/admin/vendas/page.tsx`)**

#### **Problemas Críticos:**
- **Linha 10**: `import { getMockOrders, getMockSalesMetrics }`
- **Linha 18**: `setState(getMockSalesMetrics())` - Fallback para mock
- **Linha 47-55**: Sempre usa mock quando API falha

#### **ML APIs Necessárias:**
```typescript
// ML Orders API:
GET /orders/search?seller={user_id}&order.status=confirmed&limit=50
GET /orders/{order_id} - Detalhes completos
GET /orders/{order_id}/billing_info - Dados de faturamento
```

### **3. Comunicação (`/admin/comunicacao/page.tsx`)**

#### **Problemas Críticos:**
- **Linha 42**: `const mockMessages: Message[]` - 100% mock
- **Linha 261**: `setMessages(mockMessages)` - Fallback sempre mock
- **Linha 268**: Erro sempre resulta em mock

#### **ML APIs Necessárias:**
```typescript
// ML Messages API:
GET /messages/packs/{user_id} - Conversas
GET /questions/search?seller_id={user_id} - Perguntas
POST /questions/{question_id}/answer - Responder perguntas
```

---

## 🎯 **PLANO DE AÇÃO COMPLETO - 30 DIAS**

### **SPRINT 1: FUNDAÇÃO CRÍTICA (Semana 1-2)**

#### **Fase 1.1: Conformidade ML API (CRÍTICO)**
**Prazo**: 3 dias
```typescript
// 1. Implementar webhook timeout obrigatório
const WEBHOOK_TIMEOUT = 500; // ms - REQUERIMENTO ML

// 2. IP Whitelist validation
const ML_WEBHOOK_IPS = [
  '54.88.218.97', '18.215.140.160', 
  '18.213.114.129', '18.206.34.84'
];

// 3. User rate limiting
async function checkUserRateLimit(userId: string) {
  const dailyLimit = 5000; // calls/day per ML spec
  // Implementar controle por usuário
}
```

#### **Fase 1.2: Orders API Integration**
**Prazo**: 4 dias
```typescript
// src/app/api/admin/sales/route.ts - REESCREVER COMPLETO
export async function GET(request: NextRequest) {
  // 1. Implementar ML Orders Search API
  // 2. Paginação adequada (max 50 per request)
  // 3. Status filtering (confirmed, paid, shipped, etc.)
  // 4. Transformar MLOrder para formato Peepers
}
```

#### **Fase 1.3: Messages API Integration**
**Prazo**: 4 dias
```typescript
// src/app/api/admin/messages/route.ts - REESCREVER COMPLETO
export async function GET(request: NextRequest) {
  // 1. ML Messages Packs API
  // 2. Questions API integration
  // 3. Message thread handling
  // 4. Auto-classification (question/complaint/post_sale)
}
```

### **SPRINT 2: DASHBOARD & METRICS (Semana 3-4)**

#### **Fase 2.1: Dashboard Real Data**
```typescript
// src/app/api/admin/dashboard/metrics/route.ts
export async function GET() {
  return {
    products: await getProductsCount(),
    sales: await getSalesMetrics(),
    messages: await getMessagesCount(),
    revenue: await getRevenueMetrics()
  };
}
```

#### **Fase 2.2: Advanced Analytics**
```typescript
// src/app/api/admin/analytics/route.ts
export async function GET() {
  return {
    salesChart: await getSalesChartData(),
    topProducts: await getTopProducts(),
    performance: await getPerformanceMetrics()
  };
}
```

---

## 🔗 **ENDPOINTS ML API MAPEAMENTO**

### **Orders & Sales**
```http
# Core Orders
GET /orders/search?seller={user_id}&limit=50&offset=0
GET /orders/{order_id}
GET /orders/{order_id}/billing_info

# Shipping & Tracking  
GET /shipments/{shipment_id}
GET /shipments/{shipment_id}/tracking

# Payments
GET /orders/{order_id}/payments
```

### **Messages & Questions**
```http
# Messages
GET /messages/packs/{user_id}?limit=50
GET /messages/packs/{pack_id}
POST /messages/packs/{pack_id}

# Questions
GET /questions/search?seller_id={user_id}&status=UNANSWERED
GET /questions/{question_id}
POST /questions/{question_id}/answer
```

### **Products & Analytics**
```http
# Products (JÁ IMPLEMENTADO)
GET /users/{user_id}/items/search
GET /items?ids={comma_separated_ids}

# Metrics & Visits
GET /visits/items?ids={item_ids}&date_from={date}&date_to={date}
GET /trends/{category_id}
```

---

## 🚀 **IMPLEMENTAÇÃO PRIORIZADA**

### **PRIORIDADE P0 (CRÍTICA - 1 semana)**
1. ✅ **Produtos**: JÁ FUNCIONANDO
2. 🔴 **Vendas**: Implementar Orders API completa
3. 🔴 **Mensagens**: Implementar Messages + Questions API
4. 🔴 **Webhook Compliance**: 500ms timeout + IP whitelist

### **PRIORIDADE P1 (ALTA - 2 semanas)**
1. 🟡 **Dashboard**: KPIs reais + gráficos
2. 🟡 **Métricas**: Analytics avançadas
3. 🟡 **Rate Limiting**: User-level compliance

### **PRIORIDADE P2 (MÉDIA - 4 semanas)**
1. 🔵 **Configurações**: Settings management
2. 🔵 **Notificações**: Sistema push notifications
3. 🔵 **Multi-tenancy**: Preparação para SaaS

---

## 📋 **CHECKLIST DE VALIDAÇÃO**

### **Dados Reais - 100% ML API**
- [ ] Produtos: ✅ IMPLEMENTADO
- [ ] Vendas/Orders: ❌ Mock data
- [ ] Mensagens: ❌ Mock data  
- [ ] Dashboard KPIs: ❌ Parcial mock
- [ ] Métricas: ❌ Não verificado

### **Performance & UX**
- [ ] Loading states adequados
- [ ] Error handling robusto
- [ ] Pagination eficiente
- [ ] Cache strategy implementada
- [ ] Responsive design validado

### **ML API Compliance**
- [ ] ✅ HTTPS images (IMPLEMENTADO)
- [ ] ❌ Webhook 500ms timeout
- [ ] ❌ IP whitelist validation
- [ ] ❌ User rate limiting (5K/day)
- [ ] ❌ Missed feeds recovery

---

## 🎯 **META FINAL (30 DIAS)**

**Objetivo**: 100% dos dados admin vindos de APIs reais do Mercado Livre
**Métrica**: Zero linhas de código com `mock`, `fake`, `placeholder` em produção
**Compliance**: Todos os requisitos ML API atendidos
**UX**: Interface responsiva e performática com dados reais

**Entrega**: ERP completo funcional para vendedores Mercado Livre com integração total à plataforma oficial.