# Enterprise Runbooks - Peepers SaaS Operations

## 🚨 **Critical Incident Response**

### **Webhook Outage (500ms Timeout Violations)**

**Priority**: P0 - Critical  
**SLA**: 15 minutes response, 1 hour resolution

#### **Detection**
```bash
# Monitor webhook response times
curl -w "@curl-format.txt" -o /dev/null -s "https://app.peepers.com.br/api/webhook/mercado-livre"

# Alert when >500ms consistently
# Expected: <500ms (ML requirement)
# Action: Immediate investigation
```

#### **Immediate Actions**
1. **Check System Load**
   ```bash
   # Monitor server metrics
   vercel logs --app=peepers --since=1h
   
   # Check Redis cache performance
   redis-cli info stats
   ```

2. **Implement Emergency Cache**
   ```typescript
   // Emergency webhook response
   export async function POST(request: Request) {
     // Immediate 200 OK response (<100ms)
     setTimeout(async () => {
       // Process webhook in background
       await processWebhookAsync(request);
     }, 0);
     
     return Response.json({ status: 'accepted' }, { status: 200 });
   }
   ```

3. **Notify Stakeholders**
   - Slack: `#alerts-critical`
   - Email: engineering@peepers.com.br
   - Status page: Update incident

#### **Investigation Steps**
1. Check Vercel function timeout limits
2. Review Redis connection latency
3. Analyze webhook payload size
4. Verify ML IP whitelist compliance
5. Review recent deployments

#### **Resolution Validation**
```bash
# Test webhook performance
for i in {1..10}; do
  curl -w "Time: %{time_total}s\n" -o /dev/null -s \
  -X POST "https://app.peepers.com.br/api/webhook/mercado-livre" \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
done
```

---

### **OAuth Token Refresh Failures**

**Priority**: P1 - High  
**SLA**: 30 minutes response, 2 hours resolution

#### **Detection**
- 401 errors spike in API logs
- User reports authentication issues
- Failed token refresh rate >5%

#### **Immediate Actions**
1. **Check ML API Status**
   ```bash
   curl -I https://api.mercadolibre.com/oauth/token
   # Expected: 200 OK
   ```

2. **Verify Refresh Token Rotation**
   ```typescript
   // Emergency token validation
   const validateTokens = async (userId: string) => {
     const tokens = await getTokensFromCache(userId);
     if (!tokens.refresh_token) {
       // Force re-authentication
       await invalidateUserSession(userId);
       return false;
     }
     return true;
   };
   ```

3. **Manual Token Recovery**
   ```bash
   # Check token cache status
   redis-cli keys "user_tokens:*"
   redis-cli get "user_tokens:123456"
   
   # Clear corrupted tokens
   redis-cli del "user_tokens:corrupted_user_id"
   ```

---

### **Rate Limit Exceeded (ML API)**

**Priority**: P2 - Medium  
**SLA**: 1 hour response, 4 hours resolution

#### **Detection**
- 429 responses from ML API
- Failed request rate >10%
- User complaints about sync delays

#### **Immediate Actions**
1. **Implement Circuit Breaker**
   ```typescript
   class MLAPICircuitBreaker {
     private failures = 0;
     private lastFailure?: Date;
     private readonly threshold = 5;
     private readonly timeout = 300000; // 5 minutes
     
     async execute<T>(operation: () => Promise<T>): Promise<T> {
       if (this.isOpen()) {
         throw new Error('Circuit breaker is OPEN');
       }
       
       try {
         const result = await operation();
         this.reset();
         return result;
       } catch (error) {
         this.recordFailure();
         throw error;
       }
     }
   }
   ```

2. **Enable Exponential Backoff**
   ```typescript
   const backoffDelays = [1000, 2000, 4000, 8000, 16000]; // ms
   ```

3. **Prioritize Critical Operations**
   ```typescript
   enum RequestPriority {
     CRITICAL = 1,    // Webhooks, payments
     HIGH = 2,        // Orders, messages
     MEDIUM = 3,      // Product updates
     LOW = 4          // Analytics, reports
   }
   ```

---

## 🔧 **Operational Procedures**

### **New Tenant Onboarding**

#### **Prerequisites**
- Valid Mercado Livre seller account
- Verified email and phone number
- Business documentation (if applicable)

#### **Automated Steps**
1. **Tenant Creation**
   ```bash
   # Run tenant setup script
   npm run scripts:create-tenant \
     --ml-user-id=123456 \
     --email=seller@company.com \
     --plan=professional
   ```

2. **OAuth Setup**
   ```bash
   # Generate tenant-specific OAuth config
   npm run scripts:setup-oauth \
     --tenant-id=uuid \
     --redirect-uri=https://app.peepers.com.br/auth/callback
   ```

3. **Initial Data Sync**
   ```bash
   # Sync tenant products and orders
   npm run scripts:initial-sync \
     --tenant-id=uuid \
     --full-sync=true
   ```

#### **Manual Verification**
- [ ] OAuth flow working
- [ ] Product sync complete
- [ ] Webhook delivery successful
- [ ] Dashboard accessible
- [ ] Billing integration active

---

### **Deployment Procedures**

#### **Pre-deployment Checklist**
- [ ] All tests passing (`npm test`)
- [ ] Security scan clean (`npm audit`)
- [ ] Performance benchmarks met
- [ ] Database migrations tested
- [ ] Feature flags configured
- [ ] Rollback plan documented

#### **Production Deployment**
```bash
# 1. Deploy to staging
vercel --target staging

# 2. Run smoke tests
npm run test:smoke:staging

# 3. Deploy to production
vercel --prod

# 4. Health check
curl https://app.peepers.com.br/api/health

# 5. Monitor for 15 minutes
npm run monitor:post-deploy
```

#### **Rollback Procedure**
```bash
# Immediate rollback
vercel rollback --target production

# Verify rollback
curl https://app.peepers.com.br/api/health

# Clear CDN cache
vercel env rm CACHE_BUST_TOKEN
vercel env add CACHE_BUST_TOKEN $(date +%s)
```

---

### **Database Maintenance**

#### **Daily Operations**
```bash
# Backup critical data
npm run backup:daily

# Clean expired cache entries
redis-cli eval "
  for _,k in ipairs(redis.call('keys','*:expired')) do
    redis.call('del',k)
  end
" 0

# Update analytics
npm run analytics:process-daily
```

#### **Weekly Operations**
```bash
# Full database backup
npm run backup:full

# Performance analysis
npm run analyze:query-performance

# Security audit
npm run audit:security
```

#### **Monthly Operations**
```bash
# Archive old data
npm run archive:monthly

# Generate compliance reports
npm run compliance:report

# Capacity planning review
npm run capacity:analyze
```

---

## 📊 **Monitoring & Alerting**

### **Key Performance Indicators (KPIs)**

#### **System Health**
- API Response Time: <500ms (95th percentile)
- Webhook Processing: <500ms (100%)
- Error Rate: <1%
- Uptime: >99.9%

#### **Business Metrics**
- Active Tenants: Growth rate
- API Usage: Calls per tenant
- Revenue: MRR/ARR growth
- Customer Satisfaction: >4.5/5

#### **ML API Compliance**
- Rate Limit Usage: <80% of limits
- Token Refresh Success: >99%
- Webhook Delivery: >99%
- OAuth Flow Success: >99%

### **Alert Configuration**

#### **Critical Alerts (P0)**
```yaml
webhook_timeout:
  condition: response_time > 500ms
  threshold: 3 consecutive failures
  notification: ["slack:alerts", "email:oncall", "sms:oncall"]
  
ml_api_down:
  condition: 5xx responses > 50%
  threshold: 5 minutes
  notification: ["slack:alerts", "email:oncall"]
  
database_connection_failed:
  condition: connection_errors > 0
  threshold: immediate
  notification: ["slack:alerts", "email:oncall", "sms:oncall"]
```

#### **High Priority Alerts (P1)**
```yaml
authentication_failures:
  condition: 401_errors > 10%
  threshold: 10 minutes
  notification: ["slack:alerts", "email:team"]
  
rate_limit_exceeded:
  condition: 429_responses > 5%
  threshold: 15 minutes
  notification: ["slack:alerts", "email:team"]
```

---

## 🔐 **Security Procedures**

### **Incident Response**

#### **Data Breach Response**
1. **Immediate Containment** (0-1 hour)
   - Identify affected systems
   - Isolate compromised components
   - Preserve forensic evidence
   - Notify security team

2. **Assessment** (1-4 hours)
   - Determine breach scope
   - Identify affected data
   - Assess impact level
   - Document timeline

3. **Notification** (4-24 hours)
   - Notify affected customers
   - Report to authorities (LGPD)
   - Inform business stakeholders
   - Update status page

4. **Recovery** (24-72 hours)
   - Implement fixes
   - Restore services
   - Verify security
   - Monitor for reoccurrence

#### **Vulnerability Management**
```bash
# Daily security scan
npm audit --audit-level=moderate

# Weekly dependency update
npm update && npm audit fix

# Monthly penetration testing
npm run security:pentest
```

### **Access Control**

#### **User Access Review**
- **Frequency**: Monthly
- **Scope**: All admin users
- **Actions**: Disable inactive accounts, review permissions
- **Documentation**: Update access logs

#### **API Key Rotation**
```bash
# Quarterly ML API key rotation
npm run security:rotate-ml-keys

# Update environment variables
vercel env rm ML_CLIENT_SECRET
vercel env add ML_CLIENT_SECRET new_secret_value

# Validate new keys
npm run test:api-auth
```

---

## 📋 **Compliance Checklists**

### **LGPD Compliance**
- [ ] Data minimization implemented
- [ ] Consent management active
- [ ] Data retention policies enforced
- [ ] Subject access requests handled
- [ ] Privacy by design verified
- [ ] DPO contact updated
- [ ] Breach notification procedures tested

### **ML API Compliance**
- [ ] Webhook 500ms timeout enforced
- [ ] IP whitelist validation active
- [ ] Rate limiting implemented
- [ ] OAuth 2.0 + PKCE compliant
- [ ] Token refresh rotation working
- [ ] Error handling comprehensive
- [ ] Monitoring alerts configured

### **SaaS Billing Compliance**
- [ ] Stripe integration secure
- [ ] PCI DSS requirements met
- [ ] Tax calculations accurate
- [ ] Subscription lifecycle managed
- [ ] Invoice generation automated
- [ ] Payment failure handling
- [ ] Refund processing compliant

---

**🎯 PRÓXIMA AÇÃO**: Implementar os runbooks operacionais com scripts automatizados e métricas de SLA para garantir operação enterprise-grade.