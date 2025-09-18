# Implementation Flows - Mercado Livre Integration

## 🔄 **OAuth 2.0 + PKCE Flow (Implementation)**

### **Complete Authentication Sequence**

```mermaid
graph TD
    A[User clicks 'Login'] --> B[Generate PKCE Parameters]
    B --> C[Store code_verifier in cache]
    C --> D[Redirect to ML Authorization]
    D --> E[User authenticates on ML]
    E --> F[ML redirects with code + state]
    F --> G[Validate state parameter]
    G --> H{State valid?}
    H -->|No| I[Error: CSRF Attack]
    H -->|Yes| J[Retrieve code_verifier from cache]
    J --> K[Exchange code for tokens]
    K --> L[Store tokens in cache]
    L --> M[Create user session]
    M --> N[Redirect to dashboard]
    
    style I fill:#ffcccc
    style N fill:#ccffcc
```

### **PKCE Implementation Details**

#### **Code Verifier Generation (RFC 7636)**
```typescript
function generateCodeVerifier(): string {
  // 43-128 characters, URL-safe
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode.apply(null, array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}
```

#### **Code Challenge Generation**
```typescript
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode.apply(null, new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}
```

---

## 🎣 **Webhook Processing Flow**

### **Inbound Webhook Handler**

```mermaid
sequenceDiagram
    participant ML as Mercado Livre
    participant App as Peepers App
    participant Cache as Redis Cache
    participant Queue as Background Queue
    
    ML->>App: POST /api/webhook/mercado-livre
    App->>App: Validate IP Origin
    App->>App: Validate Signature (optional)
    App->>App: Parse JSON payload
    App->>App: Validate schema
    App->>App: Check for duplicates
    App->>Cache: Store notification
    App->>Queue: Enqueue processing job
    App->>ML: Return 200 OK (< 500ms)
    
    Queue->>Queue: Process notification
    Queue->>Cache: Update related data
    Queue->>Queue: Trigger side effects
```

### **Topic-Based Processing**

#### **Orders Flow (orders_v2)**
```mermaid
graph LR
    A[Order Notification] --> B{Order Action}
    B -->|created| C[Fetch Full Order]
    B -->|paid| D[Update Payment Status]
    B -->|shipped| E[Update Shipping]
    B -->|delivered| F[Complete Order]
    B -->|cancelled| G[Cancel Order]
    
    C --> H[Cache Order Data]
    D --> H
    E --> H
    F --> H
    G --> H
    
    H --> I[Update Dashboard]
    H --> J[Send Email Notification]
    H --> K[Sync Analytics]
```

#### **Items Flow (items)**
```mermaid
graph LR
    A[Item Notification] --> B{Item Action}
    B -->|updated| C[Sync Product Data]
    B -->|paused| D[Update Status]
    B -->|closed| E[Mark as Closed]
    B -->|reactivated| F[Reactivate Product]
    
    C --> G[Update Cache]
    D --> G
    E --> G
    F --> G
    
    G --> H[Refresh Product Lists]
    G --> I[Update Search Index]
```

#### **Messages Flow (messages)**
```mermaid
graph LR
    A[Message Notification] --> B{Message Type}
    B -->|question| C[New Q&A]
    B -->|order_message| D[Order Communication]
    B -->|claim| E[Customer Claim]
    
    C --> F[Fetch Question Details]
    D --> G[Fetch Order Context]
    E --> H[Fetch Claim Details]
    
    F --> I[Update Q&A Dashboard]
    G --> J[Update Order Timeline]
    H --> K[Create Support Ticket]
```

---

## 🚀 **Product Sync Flow**

### **Full Catalog Synchronization**

```mermaid
graph TD
    A[Start Sync] --> B[Get User Products List]
    B --> C{Has More Pages?}
    C -->|Yes| D[Batch Request 50 products]
    C -->|No| E[Sync Complete]
    
    D --> F[Process Product Details]
    F --> G[Update Cache]
    G --> H[Update Search Index]
    H --> I[Next Batch]
    I --> C
    
    F --> J{Rate Limit?}
    J -->|Yes| K[Wait + Retry]
    J -->|No| G
    K --> F
```

### **Incremental Updates (Webhook-Driven)**

```mermaid
graph LR
    A[Item Webhook] --> B[Extract Product ID]
    B --> C[Fetch Latest Data]
    C --> D[Compare with Cache]
    D --> E{Changes Detected?}
    E -->|Yes| F[Update Cache]
    E -->|No| G[Skip Update]
    
    F --> H[Invalidate Related Cache]
    F --> I[Update Search Index]
    F --> J[Notify Subscribers]
```

---

## 🎯 **Rate Limiting Strategy**

### **Multi-Level Rate Limiting**

```mermaid
graph TD
    A[API Request] --> B[Check App Rate Limit]
    B --> C{App Limit OK?}
    C -->|No| D[Return 429 - App]
    C -->|Yes| E[Check User Rate Limit]
    E --> F{User Limit OK?}
    F -->|No| G[Return 429 - User]
    F -->|Yes| H[Check Endpoint Limit]
    H --> I{Endpoint OK?}
    I -->|No| J[Return 429 - Endpoint]
    I -->|Yes| K[Process Request]
    
    K --> L[Update Counters]
    L --> M[Set TTL]
```

### **Exponential Backoff Implementation**

```typescript
class RateLimitHandler {
  private delays = [1000, 2000, 4000, 8000, 16000]; // ms
  
  async withRetry<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 5
  ): Promise<T> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (error.status === 429 && attempt < maxAttempts - 1) {
          const delay = this.delays[attempt] || 16000;
          await this.sleep(delay);
          continue;
        }
        throw error;
      }
    }
    throw new Error('Max retry attempts exceeded');
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

---

## 🔍 **Error Handling Flows**

### **API Error Classification**

```mermaid
graph TD
    A[API Response] --> B{Status Code}
    B -->|2xx| C[Success - Process Data]
    B -->|401| D[Token Expired]
    B -->|403| E[Insufficient Permissions]
    B -->|404| F[Resource Not Found]
    B -->|429| G[Rate Limited]
    B -->|5xx| H[Server Error]
    
    D --> I[Refresh Token]
    I --> J[Retry Request]
    
    E --> K[Log Permission Error]
    K --> L[Return User Error]
    
    F --> M[Handle Missing Resource]
    
    G --> N[Apply Backoff]
    N --> O[Retry Request]
    
    H --> P[Log Server Error]
    P --> Q[Retry with Backoff]
```

### **Token Refresh Flow**

```mermaid
sequenceDiagram
    participant Client
    participant API as API Route
    participant Cache
    participant ML as ML API
    
    Client->>API: Request with expired token
    API->>ML: API call
    ML->>API: 401 Unauthorized
    API->>Cache: Get refresh token
    Cache->>API: Return refresh token
    API->>ML: Refresh token request
    ML->>API: New tokens
    API->>Cache: Store new tokens
    API->>ML: Retry original request
    ML->>API: Success response
    API->>Client: Return data
```

---

## 📊 **Data Synchronization Patterns**

### **Event-Driven Architecture**

```mermaid
graph LR
    A[ML Webhook] --> B[Event Bus]
    B --> C[Order Handler]
    B --> D[Product Handler]
    B --> E[Message Handler]
    
    C --> F[Update Order Cache]
    C --> G[Send Email]
    C --> H[Update Analytics]
    
    D --> I[Update Product Cache]
    D --> J[Refresh Search Index]
    
    E --> K[Update Message Cache]
    E --> L[Create Notification]
```

### **Cache Invalidation Strategy**

```typescript
class CacheInvalidator {
  async invalidateProduct(productId: string) {
    const patterns = [
      `product:${productId}`,
      `user:*:products`,
      `category:*:products`,
      `search:*`
    ];
    
    await Promise.all(
      patterns.map(pattern => this.redis.del(pattern))
    );
  }
  
  async invalidateUser(userId: string) {
    const patterns = [
      `user:${userId}:*`,
      `orders:${userId}:*`,
      `messages:${userId}:*`
    ];
    
    await Promise.all(
      patterns.map(pattern => this.redis.del(pattern))
    );
  }
}
```

---

## 🛡️ **Security Implementation**

### **Request Validation Pipeline**

```mermaid
graph TD
    A[Incoming Request] --> B[IP Whitelist Check]
    B --> C{IP Allowed?}
    C -->|No| D[Reject - 403]
    C -->|Yes| E[CSRF Token Check]
    E --> F{CSRF Valid?}
    F -->|No| G[Reject - 403]
    F -->|Yes| H[Schema Validation]
    H --> I{Schema Valid?}
    I -->|No| J[Reject - 400]
    I -->|Yes| K[Rate Limit Check]
    K --> L{Rate OK?}
    L -->|No| M[Reject - 429]
    L -->|Yes| N[Process Request]
```

### **Webhook Signature Validation (Optional)**

```typescript
function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}
```

---

## 📈 **Monitoring & Observability**

### **Metrics Collection Flow**

```mermaid
graph LR
    A[API Request] --> B[Start Timer]
    B --> C[Process Request]
    C --> D[Record Metrics]
    D --> E[Send to Analytics]
    
    D --> F[Response Time]
    D --> G[Status Code]
    D --> H[User ID]
    D --> I[Endpoint]
    
    E --> J[Dashboard Update]
    E --> K[Alert Rules]
    K --> L{Threshold Exceeded?}
    L -->|Yes| M[Send Alert]
```

### **Error Tracking**

```typescript
class ErrorTracker {
  async trackError(error: Error, context: any) {
    const errorEvent = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      userId: context.userId,
      endpoint: context.endpoint,
      environment: process.env.NODE_ENV
    };
    
    // Log to structured logger
    logger.error('API Error', errorEvent);
    
    // Send to error tracking service
    await this.sendToSentry(errorEvent);
    
    // Update metrics
    await this.updateErrorMetrics(errorEvent);
  }
}
```

---

**🎯 PRÓXIMOS PASSOS**: Implementar os fluxos críticos identificados na auditoria, começando pelo timeout de webhook (500ms) e validação de IP whitelist.