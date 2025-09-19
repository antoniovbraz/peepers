# 🚀 PLANO DE AÇÃO EXECUTIVO - PEEPERS ADMIN 100% REAL

**Objetivo**: Transformar todas as páginas admin para usar 100% dados reais do Mercado Livre
**Prazo**: 30 dias
**Prioridade**: Eliminar todos os dados mock em produção

---

## 📋 **ROADMAP DE EXECUÇÃO**

### **SEMANA 1: VENDAS + CONFORMIDADE ML API**

#### **DIA 1-2: Sales API Implementation (P0)**
```typescript
// src/app/api/admin/sales/route.ts - REESCRITA COMPLETA
// Implementar ML Orders API com paginação e filtros
```

#### **DIA 3-4: Messages API Implementation (P0)**  
```typescript
// src/app/api/admin/messages/route.ts - REESCRITA COMPLETA
// Integrar ML Messages + Questions APIs
```

#### **DIA 5-7: ML API Compliance (CRÍTICO)**
```typescript
// Webhook timeout 500ms + IP whitelist + User rate limiting
```

### **SEMANA 2: DASHBOARD REAL DATA**

#### **DIA 8-10: Dashboard KPIs Reais**
```typescript
// src/app/api/admin/dashboard/metrics/route.ts
// Eliminar valor mock 15.2, usar dados reais
```

#### **DIA 11-14: Analytics & Charts**
```typescript
// SalesChart, ActivityFeed com dados ML API
```

### **SEMANA 3-4: MÉTRICAS + POLISH**

#### **DIA 15-21: Advanced Metrics**
```typescript
// Métricas, tendências, relatórios avançados
```

#### **DIA 22-30: UX + Performance**
```typescript
// Error handling, loading states, cache optimization
```

---

## 🔧 **IMPLEMENTAÇÃO IMEDIATA - VENDAS**

### **Endpoint ML Orders API**
```http
GET /orders/search?seller={user_id}&order.status=paid&limit=50&offset=0
```

### **Campos Essenciais Orders**
```typescript
interface MLOrder {
  id: number;
  status: string; // confirmed, paid, shipped, delivered
  date_created: string;
  total_amount: number;
  currency_id: string;
  buyer: { id: number; nickname: string };
  order_items: Array<{
    item: { id: string; title: string };
    quantity: number;
    unit_price: number;
  }>;
  payments: Array<{
    status: string;
    payment_method_id: string;
  }>;
}
```

---

## 🎯 **PRÓXIMOS PASSOS CONCRETOS**

### **AÇÃO IMEDIATA (Agora)**
1. **Implementar `/api/admin/sales/route.ts`** com ML Orders API
2. **Atualizar `/admin/vendas/page.tsx`** para usar dados reais
3. **Testar integração** com suas vendas reais do ML

### **ESTA SEMANA**
1. **Messages API** - Integrar perguntas e mensagens reais
2. **Dashboard KPIs** - Remover dados mock do dashboard
3. **Webhook Compliance** - 500ms timeout obrigatório

### **VALIDAÇÃO CONTÍNUA**
- ✅ **Produtos**: Funcionando com dados reais
- 🔄 **Vendas**: Implementando agora  
- 🔄 **Mensagens**: Próximo na fila
- 🔄 **Dashboard**: Após vendas + mensagens

**Meta**: Zero linhas com `mock`, `fake`, `placeholder` em 30 dias 🎯