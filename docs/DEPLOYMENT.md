# Deployment Guide

## Overview

This guide covers production deployment, monitoring, and maintenance of the Peepers application across different environments and platforms.

## Prerequisites

### Production Requirements

- **Domain with SSL**: HTTPS is mandatory for Mercado Livre integration
- **Redis Database**: Upstash Redis or self-hosted Redis instance
- **Environment Variables**: All production secrets configured
- **Mercado Livre App**: Configured with production URLs

### Infrastructure Checklist

- [ ] Custom domain with HTTPS certificate
- [ ] Redis instance with proper backup strategy
- [ ] Monitoring and logging setup
- [ ] Error tracking configured
- [ ] Performance monitoring active
- [ ] Backup and recovery procedures

## Deployment Platforms

### Vercel (Recommended)

Vercel provides optimal integration with Next.js applications and automatic HTTPS.

#### Initial Setup

1. **Connect Repository**

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from project directory
vercel --prod
```

2. **Configure Environment Variables**

Access Vercel Dashboard → Project → Settings → Environment Variables:

```env
# Production Environment Variables
ML_CLIENT_ID=your_production_ml_client_id
ML_CLIENT_SECRET=your_production_ml_client_secret
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_production_redis_token
NEXT_PUBLIC_APP_URL=https://your-domain.com
ALLOWED_USER_IDS=123456789,987654321
NODE_ENV=production
LOG_LEVEL=info
```

3. **Custom Domain Setup**

```bash
# Add custom domain via Vercel CLI
vercel domains add your-domain.com

# Or via dashboard: Project → Settings → Domains
```

4. **SSL Certificate**

Vercel automatically provisions SSL certificates. Verify:

```bash
curl -I https://your-domain.com/api/health
```

#### Automatic Deployments

Configure automatic deployments:

1. **Production Branch**: Deploy `main` branch automatically
2. **Preview Deployments**: Every pull request gets preview URL
3. **Environment Separation**: Use different variables for preview vs production

```json
{
  "git": {
    "deploymentEnabled": {
      "main": true
    }
  },
  "env": {
    "NEXT_PUBLIC_APP_URL": {
      "production": "https://peepers.com",
      "preview": "https://preview.peepers.com"
    }
  }
}
```

### Docker Deployment

For self-hosted deployments or custom infrastructure.

#### Production Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set permissions
USER nextjs

# Expose port
EXPOSE 3000

# Environment
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start application
CMD ["node", "server.js"]
```

#### Docker Compose

```yaml
version: '3.8'

services:
  peepers:
    build: .
    ports:
      - "3000:3000"
    environment:
      - ML_CLIENT_ID=${ML_CLIENT_ID}
      - ML_CLIENT_SECRET=${ML_CLIENT_SECRET}
      - UPSTASH_REDIS_REST_URL=${UPSTASH_REDIS_REST_URL}
      - UPSTASH_REDIS_REST_TOKEN=${UPSTASH_REDIS_REST_TOKEN}
      - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
      - ALLOWED_USER_IDS=${ALLOWED_USER_IDS}
    depends_on:
      - redis
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
    depends_on:
      - peepers
    restart: unless-stopped

volumes:
  redis_data:
```

#### Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/ssl/certs/your-domain.crt;
    ssl_certificate_key /etc/ssl/certs/your-domain.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    location / {
        proxy_pass http://peepers:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### AWS Deployment

Deploy on AWS using ECS Fargate or EC2.

#### ECS Fargate

1. **Create Task Definition**

```json
{
  "family": "peepers-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "peepers",
      "image": "your-account.dkr.ecr.region.amazonaws.com/peepers:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "ML_CLIENT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:peepers/ml-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/peepers",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

2. **Create ECS Service**

```bash
aws ecs create-service \
  --cluster peepers-cluster \
  --service-name peepers-service \
  --task-definition peepers-task \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-12345],securityGroups=[sg-12345],assignPublicIp=ENABLED}"
```

3. **Application Load Balancer**

```yaml
# CloudFormation template
Resources:
  LoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Type: application
      Scheme: internet-facing
      SecurityGroups: [!Ref ALBSecurityGroup]
      Subnets: [!Ref PublicSubnet1, !Ref PublicSubnet2]

  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Port: 3000
      Protocol: HTTP
      TargetType: ip
      VpcId: !Ref VPC
      HealthCheckPath: /api/health
```

## Environment Configuration

### Environment Variables

#### Required Variables

```env
# Mercado Livre Integration
ML_CLIENT_ID=your_ml_client_id
ML_CLIENT_SECRET=your_ml_client_secret

# Redis Cache
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# Application
NEXT_PUBLIC_APP_URL=https://your-domain.com
ALLOWED_USER_IDS=123456789,987654321

# Environment
NODE_ENV=production
LOG_LEVEL=info
```

#### Optional Variables

```env
# Performance
REDIS_CONNECTION_TIMEOUT=5000
REDIS_COMMAND_TIMEOUT=5000
CACHE_DEFAULT_TTL=7200

# Security
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_HTTPONLY=true
SESSION_COOKIE_SAMESITE=strict

# Monitoring
SENTRY_DSN=your_sentry_dsn
NEW_RELIC_LICENSE_KEY=your_newrelic_key
```

### Secrets Management

#### Vercel

Store secrets in Vercel dashboard:

```bash
# Via CLI
vercel env add ML_CLIENT_SECRET production
```

#### AWS Secrets Manager

```bash
# Create secret
aws secretsmanager create-secret \
  --name peepers/ml-credentials \
  --description "Mercado Livre API credentials" \
  --secret-string '{"client_id":"your_id","client_secret":"your_secret"}'

# Reference in ECS task definition
{
  "name": "ML_CLIENT_SECRET",
  "valueFrom": "arn:aws:secretsmanager:region:account:secret:peepers/ml-credentials:SecretString:client_secret"
}
```

#### Docker Secrets

```yaml
# docker-compose.yml
services:
  peepers:
    secrets:
      - ml_client_secret
    environment:
      - ML_CLIENT_SECRET_FILE=/run/secrets/ml_client_secret

secrets:
  ml_client_secret:
    file: ./secrets/ml_client_secret.txt
```

## Monitoring and Observability

### Health Checks

#### Application Health

```typescript
// src/app/api/health/route.ts
export async function GET() {
  const checks = {
    redis: await checkRedisConnection(),
    mlApi: await checkMLApiConnection(),
    database: await checkDatabaseConnection(),
  };

  const isHealthy = Object.values(checks).every(check => check.status === 'ok');

  return NextResponse.json({
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    checks,
    version: process.env.npm_package_version,
    uptime: process.uptime()
  }, {
    status: isHealthy ? 200 : 503
  });
}
```

#### Infrastructure Health

```bash
# Kubernetes liveness probe
livenessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10

# Docker health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1
```

### Logging

#### Structured Logging

```typescript
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  } : undefined
});
```

#### Log Aggregation

**Vercel**: Automatic log collection in dashboard

**AWS CloudWatch**:
```json
{
  "logConfiguration": {
    "logDriver": "awslogs",
    "options": {
      "awslogs-group": "/ecs/peepers",
      "awslogs-region": "us-east-1",
      "awslogs-stream-prefix": "ecs"
    }
  }
}
```

**ELK Stack**:
```yaml
# docker-compose.yml
services:
  peepers:
    logging:
      driver: "fluentd"
      options:
        fluentd-address: localhost:24224
        tag: peepers
```

### Error Tracking

#### Sentry Integration

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

#### Custom Error Handling

```typescript
export function handleApiError(error: unknown, context: string) {
  logger.error({ error, context }, 'API error occurred');
  
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, {
      tags: {
        component: context
      }
    });
  }
}
```

### Performance Monitoring

#### Application Performance

```typescript
// Performance metrics
export function trackPerformance(operation: string, startTime: number) {
  const duration = Date.now() - startTime;
  
  logger.info({
    operation,
    duration,
    timestamp: new Date().toISOString()
  }, 'Performance metric');
  
  // Send to monitoring service
  if (process.env.NEW_RELIC_LICENSE_KEY) {
    newrelic.recordMetric(`Custom/${operation}`, duration);
  }
}
```

#### Infrastructure Monitoring

**Vercel Analytics**: Built-in performance monitoring

**AWS CloudWatch**:
```bash
# Create custom metrics
aws cloudwatch put-metric-data \
  --namespace "Peepers/API" \
  --metric-data MetricName=ResponseTime,Value=150,Unit=Milliseconds
```

**Prometheus + Grafana**:
```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'peepers'
    static_configs:
      - targets: ['peepers:3000']
    metrics_path: '/api/metrics'
```

## Security

### SSL/TLS Configuration

#### Certificate Management

**Vercel**: Automatic SSL with Let's Encrypt

**AWS Certificate Manager**:
```bash
aws acm request-certificate \
  --domain-name your-domain.com \
  --subject-alternative-names www.your-domain.com \
  --validation-method DNS
```

**Let's Encrypt with Certbot**:
```bash
# Install certbot
apt-get install certbot python3-certbot-nginx

# Obtain certificate
certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
```

### Security Headers

```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          }
        ]
      }
    ];
  }
};
```

### Firewall and Access Control

#### Network Security

```bash
# AWS Security Group rules
aws ec2 authorize-security-group-ingress \
  --group-id sg-12345678 \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id sg-12345678 \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0
```

#### Application Security

```typescript
// Rate limiting middleware
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
```

## Backup and Recovery

### Database Backup

#### Redis Backup

**Upstash**: Automatic backups included

**Self-hosted Redis**:
```bash
# Create backup
redis-cli --rdb /backup/dump-$(date +%Y%m%d-%H%M%S).rdb

# Restore backup
redis-cli --pipe < /backup/dump-20250915-120000.rdb

# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d-%H%M%S)
redis-cli BGSAVE
cp /var/lib/redis/dump.rdb /backup/dump-$DATE.rdb
find /backup -name "dump-*.rdb" -mtime +7 -delete
```

### Application Backup

#### Code and Configuration

```bash
# Git backup
git bundle create peepers-backup-$(date +%Y%m%d).bundle --all

# Environment backup
cat > backup-env.sh << EOF
#!/bin/bash
export ML_CLIENT_ID="your_client_id"
export ML_CLIENT_SECRET="your_client_secret"
# ... other variables
EOF
```

#### Disaster Recovery

1. **Recovery Time Objective (RTO)**: 30 minutes
2. **Recovery Point Objective (RPO)**: 1 hour
3. **Backup Frequency**: Daily
4. **Backup Retention**: 30 days

**Recovery Procedure**:

1. **Deploy Application**:
   ```bash
   # Clone repository
   git clone https://github.com/antoniovbraz/peepers.git
   cd peepers
   
   # Install dependencies
   npm install
   
   # Restore environment
   source backup-env.sh
   
   # Deploy
   vercel --prod
   ```

2. **Restore Database**:
   ```bash
   # Restore Redis data
   redis-cli FLUSHALL
   redis-cli --pipe < backup-dump.rdb
   ```

3. **Verify Recovery**:
   ```bash
   # Test all endpoints
   npm run test:prod all
   
   # Check health
   curl https://your-domain.com/api/health
   ```

## Maintenance

### Regular Maintenance Tasks

#### Daily
- [ ] Check application health status
- [ ] Monitor error rates and performance
- [ ] Review security alerts

#### Weekly
- [ ] Update dependencies for security patches
- [ ] Review and rotate logs
- [ ] Performance optimization review

#### Monthly
- [ ] Security audit and penetration testing
- [ ] Backup and recovery testing
- [ ] Capacity planning review

### Update Procedures

#### Application Updates

```bash
# 1. Test in staging
git checkout staging
git pull origin main
npm run build
npm run test:prod all

# 2. Deploy to production
git checkout main
git pull origin main
vercel --prod

# 3. Verify deployment
npm run test:prod all
```

#### Dependency Updates

```bash
# Check for updates
npm outdated

# Update non-breaking changes
npm update

# Update major versions (test thoroughly)
npm install package@latest

# Security updates
npm audit fix
```

### Scaling

#### Horizontal Scaling

**Vercel**: Automatic scaling based on traffic

**AWS ECS**:
```bash
# Update service capacity
aws ecs update-service \
  --cluster peepers-cluster \
  --service peepers-service \
  --desired-count 5
```

**Kubernetes**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: peepers
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: peepers
        image: peepers:latest
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

#### Database Scaling

**Redis Scaling**:
```bash
# Upstash: Upgrade plan via dashboard

# Self-hosted Redis Cluster
redis-cli --cluster create \
  127.0.0.1:7000 127.0.0.1:7001 127.0.0.1:7002 \
  127.0.0.1:7003 127.0.0.1:7004 127.0.0.1:7005 \
  --cluster-replicas 1
```

This deployment guide provides comprehensive coverage for production deployment, monitoring, and maintenance of the Peepers application across various platforms and environments.