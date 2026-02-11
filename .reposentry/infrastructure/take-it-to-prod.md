# Production Deployment Guide: Take It To Production

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Deployment Options & Step-by-Step Instructions](#deployment-options--step-by-step-instructions)
3. [DNS and SSL/TLS Configuration](#dns-and-ssltls-configuration)
4. [Monitoring & Logging Setup](#monitoring--logging-setup)
5. [Scaling Considerations](#scaling-considerations)
6. [Rollback Strategy](#rollback-strategy)
7. [Post-Deployment Verification](#post-deployment-verification)

---

## Pre-Deployment Checklist

### Environment Configuration

- [ ] **Node.js Version**: Verify Node.js ≥ 18 available in production environment
- [ ] **.env File Setup**: Create production `.env` file with required variables:
  ```
  NODE_ENV=production
  PORT=3000
  COPILOT_AUTH_TOKEN=<github-copilot-cli-token>
  LOG_LEVEL=info
  ANALYSIS_TIMEOUT=1800000
  MAX_FILE_SIZE=52428800
  ```
- [ ] **GitHub Copilot CLI Token**: Generate and securely store authentication token
- [ ] **Configuration Files**: Verify `reposentry.config.js` or `reposentry.config.json` is production-ready
- [ ] **Git Credentials**: Configure SSH keys or HTTPS tokens for repository access

### Secrets Management

- [ ] Store all secrets in production secrets management system (AWS Secrets Manager, Azure Key Vault, HashiCorp Vault)
- [ ] Rotate Copilot auth tokens on schedule (90-day rotation recommended)
- [ ] Never commit `.env` or credential files to version control
- [ ] Use environment variable interpolation only, not hardcoded values
- [ ] Implement secret scanning in CI/CD pipeline

### Build Verification

- [ ] Run full test suite: `npm run test`
- [ ] Verify TypeScript compilation: `npm run typecheck`
- [ ] Build production distribution: `npm run build`
- [ ] Confirm `dist/` directory contains all required files
- [ ] Test CLI command works: `node dist/index.js --help`
- [ ] Test server mode: `node dist/index.js serve --port 3000`
- [ ] Validate analysis output structure: Run `analyze` command and verify `.reposentry/` directory contents

### Database Migrations

- [ ] Not applicable for RepoSentry (stateless analysis tool)
- [ ] If using external storage for reports, configure connection strings
- [ ] Set up file storage backend (S3, Azure Blob Storage, GCS) if needed

### Dependencies

- [ ] Audit dependencies: `npm audit`
- [ ] Review and address any vulnerabilities
- [ ] Lock package versions in `package-lock.json`
- [ ] Document Node.js version compatibility: ≥ 18

### Security Scan

- [ ] Run security audit tools
- [ ] Verify no hardcoded credentials in codebase
- [ ] Review file permissions (dist, public directories)
- [ ] Validate input sanitization in prompt builder
- [ ] Confirm Handlebars templates prevent XSS injection
- [ ] Test rate limiting if exposed via API

---

## Deployment Options & Step-by-Step Instructions

### Option 1: AWS Elastic Beanstalk

#### Prerequisites
- AWS account with Elastic Beanstalk, EC2, and S3 access
- AWS CLI configured
- EB CLI installed: `pip install awsebcli`

#### Step-by-Step Deployment

1. **Initialize Elastic Beanstalk Environment**
   ```bash
   eb init -p node.js-20 reposentry --region us-east-1
   ```

2. **Create Production Environment Configuration** - Create `.ebextensions/nodecommand.config`:
   ```yaml
   option_settings:
     aws:elasticbeanstalk:container:nodejs:
       NodeCommand: "node dist/index.js serve"
   aws:elasticbeanstalk:application:environment:
     NODE_ENV: production
   ```

3. **Set Environment Variables** - Create `.ebextensions/env.config`:
   ```yaml
   option_settings:
     aws:elasticbeanstalk:application:environment:
       COPILOT_AUTH_TOKEN: !Ref CopilotAuthTokenParameter
       LOG_LEVEL: info
       ANALYSIS_TIMEOUT: "1800000"
   ```

4. **Create Production Environment**
   ```bash
   eb create reposentry-prod --instance-type t3.medium --envvars NODE_ENV=production,LOG_LEVEL=info
   ```

5. **Deploy Application**
   ```bash
   npm run build
   eb deploy reposentry-prod
   ```

6. **Monitor Deployment**
   ```bash
   eb status
   eb logs -f  # Stream logs
   ```

7. **Verify Server is Running**
   ```bash
   eb open  # Opens application in browser
   ```

#### Health Checks Configuration
- Add `.ebextensions/healthcheck.config`:
  ```yaml
  option_settings:
    aws:elasticbeanstalk:healthreporting:system:
      SystemType: enhanced
      EnhancedHealthAuthEnabled: true
      HealthCheckSuccessThreshold: 3
      HealthCheckInterval: 30
  ```

#### S3 Configuration for Report Storage
```bash
# Create S3 bucket for reports
aws s3 mb s3://reposentry-reports-prod --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning --bucket reposentry-reports-prod --versioning-configuration Status=Enabled

# Attach IAM role to EB environment
aws ec2 create-instances --iam-instance-profile Name=aws-elasticbeanstalk-ec2-role
```

---

### Option 2: Google Cloud Run

#### Prerequisites
- Google Cloud project with Cloud Run, Container Registry
- `gcloud` CLI installed and authenticated
- Docker installed locally

#### Step-by-Step Deployment

1. **Create Dockerfile** - Create in project root:
   ```dockerfile
   FROM node:20-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY dist ./dist
   EXPOSE 3000
   ENV NODE_ENV=production
   CMD ["node", "dist/index.js", "serve", "--port", "3000"]
   ```

2. **Build and Test Image Locally**
   ```bash
   npm run build
   docker build -t reposentry:latest .
   docker run -p 3000:3000 -e COPILOT_AUTH_TOKEN=<token> reposentry:latest
   ```

3. **Configure Google Cloud Project**
   ```bash
   gcloud config set project PROJECT_ID
   gcloud auth configure-docker
   ```

4. **Push Image to Container Registry**
   ```bash
   docker tag reposentry:latest gcr.io/PROJECT_ID/reposentry:latest
   docker push gcr.io/PROJECT_ID/reposentry:latest
   ```

5. **Deploy to Cloud Run**
   ```bash
   gcloud run deploy reposentry \
     --image gcr.io/PROJECT_ID/reposentry:latest \
     --platform managed \
     --region us-central1 \
     --memory 2Gi \
     --cpu 2 \
     --set-env-vars NODE_ENV=production,LOG_LEVEL=info \
     --set-secrets COPILOT_AUTH_TOKEN=copilot-token:latest \
     --allow-unauthenticated
   ```

6. **Verify Deployment**
   ```bash
   gcloud run services describe reposentry --platform managed --region us-central1
   gcloud run logs read reposentry --limit 50
   ```

#### Cloud Storage Configuration for Reports
```bash
# Create bucket
gsutil mb gs://reposentry-reports-prod

# Set lifecycle policy
cat > lifecycle.json << EOF
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {"age": 90}
      }
    ]
  }
}
EOF
gsutil lifecycle set lifecycle.json gs://reposentry-reports-prod
```

---

### Option 3: Microsoft Azure Container Instances

#### Prerequisites
- Azure subscription with Container Registry and Container Instances
- Azure CLI installed and authenticated
- Docker installed locally

#### Step-by-Step Deployment

1. **Create Azure Container Registry**
   ```bash
   az acr create --resource-group reposentry-prod --name reposentry --sku Basic
   ```

2. **Build and Push Image**
   ```bash
   npm run build
   az acr build --registry reposentry --image reposentry:latest .
   ```

3. **Create Container Group**
   ```bash
   az container create \
     --resource-group reposentry-prod \
     --name reposentry-container \
     --image reposentry.azurecr.io/reposentry:latest \
     --cpu 2 \
     --memory 2 \
     --port 3000 \
     --dns-name-label reposentry \
     --environment-variables NODE_ENV=production LOG_LEVEL=info \
     --secure-environment-variables COPILOT_AUTH_TOKEN=$COPILOT_TOKEN
   ```

4. **Verify Deployment**
   ```bash
   az container show \
     --resource-group reposentry-prod \
     --name reposentry-container \
     --query "{FQDN:ipAddress.fqdn,Ports:ipAddress.ports}"
   ```

5. **View Logs**
   ```bash
   az container logs \
     --resource-group reposentry-prod \
     --name reposentry-container \
     --follow
   ```

#### Azure Blob Storage for Reports
```bash
# Create storage account
az storage account create \
  --name reposentry \
  --resource-group reposentry-prod \
  --location eastus

# Create blob container
az storage container create \
  --name reports \
  --account-name reposentry
```

---

### Option 4: Docker & Kubernetes (Self-Hosted / On-Premises)

#### Prerequisites
- Kubernetes cluster (1.20+)
- Docker runtime
- kubectl configured
- Helm (optional, recommended)

#### Step-by-Step Deployment

1. **Create Dockerfile** (same as Cloud Run option)

2. **Build and Push to Registry**
   ```bash
   docker build -t your-registry.com/reposentry:1.0.0 .
   docker push your-registry.com/reposentry:1.0.0
   ```

3. **Create Kubernetes Manifests** - Create `k8s/deployment.yaml`:
   ```yaml
   apiVersion: v1
   kind: ConfigMap
   metadata:
     name: reposentry-config
     namespace: production
   data:
     NODE_ENV: "production"
     LOG_LEVEL: "info"
     ANALYSIS_TIMEOUT: "1800000"
   ---
   apiVersion: v1
   kind: Secret
   metadata:
     name: reposentry-secrets
     namespace: production
   type: Opaque
   stringData:
     COPILOT_AUTH_TOKEN: <base64-encoded-token>
   ---
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: reposentry
     namespace: production
   spec:
     replicas: 3
     strategy:
       type: RollingUpdate
       rollingUpdate:
         maxSurge: 1
         maxUnavailable: 0
     selector:
       matchLabels:
         app: reposentry
     template:
       metadata:
         labels:
           app: reposentry
           version: "1.0.0"
       spec:
         containers:
         - name: reposentry
           image: your-registry.com/reposentry:1.0.0
           imagePullPolicy: IfNotPresent
           ports:
           - containerPort: 3000
             name: http
           envFrom:
           - configMapRef:
               name: reposentry-config
           - secretRef:
               name: reposentry-secrets
           resources:
             requests:
               memory: "512Mi"
               cpu: "500m"
             limits:
               memory: "2Gi"
               cpu: "2000m"
           livenessProbe:
             httpGet:
               path: /health
               port: 3000
             initialDelaySeconds: 30
             periodSeconds: 10
             timeoutSeconds: 5
             failureThreshold: 3
           readinessProbe:
             httpGet:
               path: /ready
               port: 3000
             initialDelaySeconds: 10
             periodSeconds: 5
             timeoutSeconds: 3
           securityContext:
             readOnlyRootFilesystem: false
             runAsNonRoot: true
             runAsUser: 1000
           volumeMounts:
           - name: reports
             mountPath: /app/.reposentry
         volumes:
         - name: reports
           emptyDir: {}
   ---
   apiVersion: v1
   kind: Service
   metadata:
     name: reposentry
     namespace: production
   spec:
     type: LoadBalancer
     ports:
     - port: 80
       targetPort: 3000
       protocol: TCP
     selector:
       app: reposentry
   ```

4. **Create Horizontal Pod Autoscaler** - Create `k8s/hpa.yaml`:
   ```yaml
   apiVersion: autoscaling/v2
   kind: HorizontalPodAutoscaler
   metadata:
     name: reposentry-hpa
     namespace: production
   spec:
     scaleTargetRef:
       apiVersion: apps/v1
       kind: Deployment
       name: reposentry
     minReplicas: 3
     maxReplicas: 10
     metrics:
     - type: Resource
       resource:
         name: cpu
         target:
           type: Utilization
           averageUtilization: 70
     - type: Resource
       resource:
         name: memory
         target:
           type: Utilization
           averageUtilization: 80
   ```

5. **Deploy to Kubernetes**
   ```bash
   kubectl create namespace production
   kubectl apply -f k8s/
   kubectl rollout status deployment/reposentry -n production
   ```

6. **Verify Deployment**
   ```bash
   kubectl get pods -n production -l app=reposentry
   kubectl logs -n production -l app=reposentry --tail=50 -f
   kubectl describe svc reposentry -n production
   ```

#### Helm Chart Deployment (Alternative)
```bash
helm repo add reposentry https://charts.example.com
helm repo update
helm install reposentry reposentry/reposentry \
  --namespace production \
  --values values-prod.yaml
```

---

### Option 5: Traditional VPS Deployment

#### Prerequisites
- VPS running Ubuntu 20.04 LTS or later
- Node.js 20 installed
- Nginx or Apache installed
- PM2 or systemd for process management

#### Step-by-Step Deployment

1. **Prepare Server**
   ```bash
   sudo apt update && sudo apt upgrade -y
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs npm nginx git
   sudo npm install -g pm2
   ```

2. **Clone and Setup Application**
   ```bash
   cd /opt
   sudo git clone https://github.com/MaheshDoiphode/reposentry.git
   cd reposentry
   sudo npm install
   sudo npm run build
   ```

3. **Configure Environment**
   ```bash
   sudo cp .env.example .env.production
   sudo nano .env.production
   # Edit with production values
   sudo chown nobody:nogroup .env.production
   sudo chmod 600 .env.production
   ```

4. **Setup PM2 Process Manager**
   ```bash
   # Create ecosystem file
   cat > ecosystem.config.js << EOF
   module.exports = {
     apps: [
       {
         name: 'reposentry',
         script: './dist/index.js',
         args: 'serve --port 3000',
         instances: 2,
         exec_mode: 'cluster',
         env: {
           NODE_ENV: 'production',
           PORT: 3000
         },
         error_file: '/var/log/pm2/reposentry-error.log',
         out_file: '/var/log/pm2/reposentry-out.log',
         log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
         merge_logs: true,
         watch: false
       }
     ]
   };
   EOF
   
   # Start with PM2
   sudo pm2 start ecosystem.config.js
   sudo pm2 save
   sudo pm2 startup
   ```

5. **Configure Nginx Reverse Proxy**
   ```bash
   sudo cat > /etc/nginx/sites-available/reposentry << 'EOF'
   upstream reposentry_backend {
       server 127.0.0.1:3000;
       server 127.0.0.1:3001;
   }
   
   server {
       listen 80;
       server_name reposentry.example.com;
       
       location /.well-known/acme-challenge/ {
           root /var/www/certbot;
       }
       
       location / {
           return 301 https://$server_name$request_uri;
       }
   }
   
   server {
       listen 443 ssl http2;
       server_name reposentry.example.com;
       
       ssl_certificate /etc/letsencrypt/live/reposentry.example.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/reposentry.example.com/privkey.pem;
       
       ssl_protocols TLSv1.2 TLSv1.3;
       ssl_ciphers HIGH:!aNULL:!MD5;
       ssl_prefer_server_ciphers on;
       ssl_session_cache shared:SSL:10m;
       ssl_session_timeout 10m;
       
       client_max_body_size 100M;
       
       gzip on;
       gzip_types text/plain text/css application/json application/javascript;
       gzip_min_length 1000;
       
       location / {
           proxy_pass http://reposentry_backend;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
           proxy_connect_timeout 60s;
           proxy_send_timeout 60s;
           proxy_read_timeout 60s;
       }
       
       location /health {
           access_log off;
           proxy_pass http://reposentry_backend;
       }
   }
   EOF
   
   sudo ln -s /etc/nginx/sites-available/reposentry /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

6. **Setup SSL Certificate (Let's Encrypt)**
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot certonly --webroot -w /var/www/certbot -d reposentry.example.com
   sudo certbot renew --dry-run  # Test renewal
   
   # Setup automatic renewal
   sudo systemctl enable certbot.timer
   ```

7. **Verify Deployment**
   ```bash
   pm2 status
   pm2 logs reposentry
   curl https://reposentry.example.com/health
   ```

---

### Option 6: Static Hosting (Vercel/Netlify for Reports)

If deploying report generation as serverless functions:

1. **Create Vercel Function** - Create `api/analyze.ts`:
   ```typescript
   import { VercelRequest, VercelResponse } from '@vercel/node';
   import { runAnalysis } from '../src/core/orchestrator';
   
   export default async (req: VercelRequest, res: VercelResponse) => {
     try {
       const { repoPath } = req.body;
       const analysis = await runAnalysis(repoPath);
       res.status(200).json(analysis);
     } catch (error) {
       res.status(500).json({ error: error.message });
     }
   };
   ```

2. **Deploy to Vercel**
   ```bash
   npm install -g vercel
   vercel --prod
   ```

---

## DNS and SSL/TLS Configuration

### DNS Configuration

#### 1. Register Domain
- Purchase domain from registrar (GoDaddy, Namecheap, Route 53, etc.)

#### 2. Point to Cloud Provider

**For AWS Elastic Beanstalk:**
```
Create CNAME record:
Name: reposentry
Type: CNAME
Value: reposentry-prod.elasticbeanstalk.com
TTL: 3600
```

**For Google Cloud Run:**
```
Create CNAME record:
Name: reposentry
Type: CNAME
Value: ghs.googleusercontent.com
TTL: 3600
```

**For Kubernetes (Load Balancer):**
```
Create A record:
Name: reposentry
Type: A
Value: <EXTERNAL-IP>
TTL: 3600
```

**For VPS:**
```
Create A record:
Name: reposentry
Type: A
Value: <VPS-IP-ADDRESS>
TTL: 3600
```

#### 3. Verify DNS Propagation
```bash
nslookup reposentry.example.com
dig reposentry.example.com
```

### SSL/TLS Certificate Configuration

#### Option 1: Let's Encrypt (Free, Automated)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot certonly --standalone \
  -d reposentry.example.com \
  -d www.reposentry.example.com

# Auto-renewal setup
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Verify auto-renewal
sudo certbot renew --dry-run
```

#### Option 2: AWS Certificate Manager

```bash
aws acm request-certificate \
  --domain-name reposentry.example.com \
  --subject-alternative-names www.reposentry.example.com \
  --validation-method DNS \
  --region us-east-1
```

#### Option 3: GCP Managed Certificates

```bash
gcloud compute ssl-certificates create reposentry-cert \
  --domains reposentry.example.com,www.reposentry.example.com
```

#### Option 4: Azure App Service Certificates

```bash
az appservice certificate create \
  --resource-group reposentry-prod \
  --name reposentry-cert \
  --host-name reposentry.example.com
```

### HSTS and Security Headers

Add to Nginx configuration:
```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

---

## Monitoring & Logging Setup

### Application Health Checks

#### Implement Health Endpoints

Add to server application:
```typescript
// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Readiness endpoint
app.get('/ready', (req, res) => {
  // Check dependencies (Git, Copilot, storage)
  const isReady = checkDependencies();
  if (isReady) {
    res.json({ status: 'ready' });
  } else {
    res.status(503).json({ status: 'not ready' });
  }
});
```

#### Configure Health Checks by Platform

**AWS Elastic Beanstalk:**
```yaml
option_settings:
  aws:elasticbeanstalk:healthreporting:system:
    SystemType: enhanced
    HealthCheckSuccessThreshold: 3
    HealthCheckInterval: 30
    HealthCheckPath: /health
```

**Kubernetes:**
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /ready
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 5
```

**VPS/Docker:**
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"
```

### Application Performance Monitoring (APM)

#### Datadog Integration

1. **Install Datadog Agent:**
   ```bash
   DD_AGENT_MAJOR_VERSION=7 \
   DD_API_KEY=<your-api-key> \
   DD_SITE="datadoghq.com" \
   bash -c "$(curl -L https://s3.amazonaws.com/dd-agent/scripts/install_mac_os.sh)"
   ```

2. **Add APM to Application:**
   ```bash
   npm install --save dd-trace
   ```

3. **Initialize Tracer:**
   ```typescript
   const tracer = require('dd-trace').init();
   
   import express from 'express';
   const app = express();
   
   app.use((req, res, next) => {
     tracer.trace('http.request', { resource: req.method + ' ' + req.path }, () => {
       next();
     });
   });
   ```

#### New Relic Integration

1. **Install Agent:**
   ```bash
   npm install newrelic
   ```

2. **Create `newrelic.js`:**
   ```javascript
   exports.config = {
     app_name: ['reposentry'],
     license_key: process.env.NEW_RELIC_LICENSE_KEY,
     logging: {
       level: 'info'
     }
   };
   ```

3. **Initialize (must be first require):**
   ```typescript
   require('newrelic');
   import express from 'express';
   // ... rest of app
   ```

#### Prometheus Metrics

1. **Install Prom Client:**
   ```bash
   npm install prom-client
   ```

2. **Expose Metrics Endpoint:**
   ```typescript
   import client from 'prom-client';
   
   const register = new client.Registry();
   client.collectDefaultMetrics({ register });
   
   const requestCounter = new client.Counter({
     name: 'http_requests_total',
     help: 'Total HTTP requests',
     labelNames: ['method', 'path', 'status'],
     registers: [register]
   });
   
   app.get('/metrics', (req, res) => {
     res.set('Content-Type', register.contentType);
     res.end(register.metrics());
   });
   ```

### Structured Logging

#### JSON Logging Setup

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: '/var/log/reposentry/error.log', level: 'error' }),
    new winston.transports.File({ filename: '/var/log/reposentry/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

#### Cloud Logging Destinations

**AWS CloudWatch:**
```bash
npm install winston-cloudwatch
```

```typescript
import WinstonCloudWatch from 'winston-cloudwatch';

logger.add(new WinstonCloudWatch({
  logGroupName: '/aws/elasticbeanstalk/reposentry',
  logStreamName: 'production',
  awsRegion: 'us-east-1'
}));
```

**Google Cloud Logging:**
```bash
npm install @google-cloud/logging-winston
```

```typescript
import logging from '@google-cloud/logging-winston';

logger.add(logging.express.makeMiddleware());
```

**Azure Monitor:**
```bash
npm install applicationinsights
```

```typescript
const appInsights = require('applicationinsights');
appInsights.setup(process.env.APPINSIGHTS_INSTRUMENTATIONKEY).start();
```

### Error Tracking

#### Sentry Integration

1. **Install SDK:**
   ```bash
   npm install @sentry/node @sentry/tracing
   ```

2. **Initialize:**
   ```typescript
   import * as Sentry from '@sentry/node';
   
   Sentry.init({
     dsn: process.env.SENTRY_DSN,
     environment: process.env.NODE_ENV,
     tracesSampleRate: 0.1,
     integrations: [
       new Sentry.Integrations.Http({ tracing: true }),
       new Sentry.Integrations.Express({ app: true, request: true })
     ]
   });
   
   app.use(Sentry.Handlers.errorHandler());
   ```

#### Rollbar Integration

```bash
npm install rollbar
```

```typescript
import Rollbar from 'rollbar';

const rollbar = new Rollbar({
  accessToken: process.env.ROLLBAR_ACCESS_TOKEN,
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === 'production'
});

process.on('unhandledRejection', (reason, promise) => {
  rollbar.error('Unhandled Rejection', { reason, promise });
});
```

### Alerting

#### Alert Rules

```
Alert Condition: HTTP 5xx errors > 5% over 5 minutes
Notify: ops-team@example.com, #alerts Slack channel

Alert Condition: Average response time > 2s over 10 minutes
Notify: engineering@example.com

Alert Condition: Memory usage > 90% over 5 minutes
Notify: devops@example.com

Alert Condition: Disk space < 10% available
Notify: devops@example.com
```

---

## Scaling Considerations

### Horizontal Scaling

#### Load Balancing

**Nginx Load Balancer (VPS):**
```nginx
upstream reposentry_cluster {
    least_conn;
    server 10.0.1.10:3000 weight=5;
    server 10.0.1.11:3000 weight=5;
    server 10.0.1.12:3000 weight=3;
    
    keepalive 32;
}

server {
    listen 80;
    
    location / {
        proxy_pass http://reposentry_cluster;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
    }
}
```

**AWS Load Balancer:**
```bash
aws elbv2 create-load-balancer \
  --name reposentry-lb \
  --subnets subnet-1 subnet-2 subnet-3 \
  --security-groups sg-reposentry
```

**Kubernetes Service (Load Balancer):**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: reposentry-lb
spec:
  type: LoadBalancer
  sessionAffinity: ClientIP
  sessionAffinityConfig:
    clientIP:
      timeoutSeconds: 10800
  selector:
    app: reposentry
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
```

#### Auto-Scaling Configuration

**Kubernetes HPA with Custom Metrics:**
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: reposentry-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: reposentry
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 60
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 75
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "100"
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 30
      policies:
      - type: Percent
        value: 100
        periodSeconds: 30
      - type: Pods
        value: 5
        periodSeconds: 30
```

**AWS Elastic Beanstalk Auto-Scaling:**
```yaml
option_settings:
  aws:autoscaling:asg:
    MinSize: 3
    MaxSize: 20
  aws:autoscaling:trigger:
    MeasureName: CPUUtilization
    Statistic: Average
    Unit: Percent
    UpperThreshold: 60
    LowerThreshold: 30
    UpperBreachScaleIncrement: 2
    LowerBreachScaleIncrement: -1
    BreachDuration: 300
```

### Vertical Scaling

#### Resource Limits

**By Platform:**

| Platform | Small | Medium | Large | XLarge |
|----------|-------|--------|-------|--------|
| **AWS EB** | t3.small | t3.medium | t3.large | t3.xlarge |
| **GCP Cloud Run** | 512MB/0.25CPU | 2GB/2CPU | 8GB/4CPU | 16GB/4CPU |
| **Azure Container** | 1GB/1CPU | 4GB/2CPU | 8GB/4CPU | 16GB/8CPU |
| **Kubernetes Pod** | 256Mi/100m | 1Gi/500m | 4Gi/2000m | 8Gi/4000m |

### Content Delivery Network (CDN)

#### Cloudflare Configuration

```bash
# Login and setup
cloudflare --token <api-token>

# Create DNS entry pointing to origin
CNAME reposentry.example.com -> origin.reposentry.example.com

# Cache rules for static content
- Path: /.reposentry/* | Cache level: Cache Everything | TTL: 1 hour
- Path: /public/* | Cache level: Cache Everything | TTL: 24 hours
- Path: /health | Cache level: Bypass | TTL: N/A
```

#### AWS CloudFront Distribution

```bash
aws cloudfront create-distribution \
  --origin-domain-name reposentry-prod.elasticbeanstalk.com \
  --default-root-object index.html \
  --cache-behaviors file://cache-behaviors.json
```

#### Caching Strategy

```typescript
app.use((req, res, next) => {
  // Cache static reports for 1 hour
  if (req.path.startsWith('/.reposentry/')) {
    res.set('Cache-Control', 'public, max-age=3600');
  }
  // Don't cache health/ready endpoints
  else if (['/health', '/ready'].includes(req.path)) {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
  // Default: cache for 5 minutes
  else {
    res.set('Cache-Control', 'public, max-age=300');
  }
  next();
});
```

### Database/Storage Scaling

#### Report Storage Solutions

**S3 Auto-Scaling Tiering:**
```bash
# Create lifecycle policy to move old reports to Glacier
aws s3api put-bucket-lifecycle-configuration \
  --bucket reposentry-reports-prod \
  --lifecycle-configuration file://lifecycle.json
```

**Content:** 
```json
{
  "Rules": [
    {
      "Id": "archive-old-reports",
      "Status": "Enabled",
      "Transitions": [
        {
          "Days": 30,
          "StorageClass": "STANDARD_IA"
        },
        {
          "Days": 90,
          "StorageClass": "GLACIER"
        }
      ],
      "Expiration": {
        "Days": 365
      }
    }
  ]
}
```

---

## Rollback Strategy

### Backup Before Deployment

#### Database/File Backup

```bash
# Create backup
tar -czf reposentry-backup-$(date +%Y%m%d-%H%M%S).tar.gz \
  .reposentry/ \
  .env.production

# Upload to S3
aws s3 cp reposentry-backup-*.tar.gz s3://reposentry-backups/
```

#### Version Tagging

```bash
# Tag release in Git
git tag -a v1.0.0 -m "Production Release 1.0.0"
git push origin v1.0.0

# Tag Docker image
docker tag reposentry:latest reposentry:v1.0.0
docker push reposentry:v1.0.0
```

### Quick Rollback Procedures

#### Kubernetes Rollback

```bash
# View rollout history
kubectl rollout history deployment/reposentry -n production

# Rollback to previous version
kubectl rollout undo deployment/reposentry -n production

# Rollback to specific revision
kubectl rollout undo deployment/reposentry -n production --to-revision=3

# Verify rollback
kubectl rollout status deployment/reposentry -n production
```

#### AWS Elastic Beanstalk Rollback

```bash
# List environment history
eb appversion

# Rollback to previous version
eb swap
# or
eb deploy --version <previous-app-version>

# Verify
eb status
```

#### Docker/VPS Rollback

```bash
# Stop current container
docker stop reposentry

# Start previous version
docker run -d --name reposentry \
  -e NODE_ENV=production \
  reposentry:v1.0.0-previous

# Verify logs
docker logs reposentry
```

#### Manual File Rollback

```bash
# Restore from backup
tar -xzf reposentry-backup-YYYYMMDD-HHMMSS.tar.gz -C /opt/reposentry

# Restart service
pm2 restart reposentry
# or
sudo systemctl restart reposentry
```

### Rollback Decision Criteria

| Metric | Threshold | Action |
|--------|-----------|--------|
| Error Rate | > 5% | Immediate rollback |
| Response Time | > 2s avg | Investigate, rollback if sustained |
| Memory Usage | > 85% | Check logs, rollback if leak detected |
| CPU Usage | > 80% sustained | Investigate code changes |
| Failed Health Checks | 3+ consecutive | Immediate rollback |

---

## Post-Deployment Verification

### Immediate Verification (First 5 Minutes)

#### Health Checks

```bash
# Check service status
curl -s https://reposentry.example.com/health | jq .

# Response should be:
# {
#   "status": "ok",
#   "timestamp": "2024-01-15T10:30:45.123Z",
#   "uptime": 125.456,
#   "environment": "production"
# }
```

#### Endpoint Testing

```bash
# Test analyze endpoint
curl -X GET https://reposentry.example.com/analyze \
  -H "Content-Type: application/json"

# Test serve endpoint
curl -s https://reposentry.example.com/serve | head -n 50

# Test metrics endpoint (if enabled)
curl -s https://reposentry.example.com/metrics | grep http_requests
```

#### Log Verification

```bash
# Check for errors
kubectl logs -n production -l app=reposentry | grep -i error

# Check startup messages
kubectl logs -n production -l app=reposentry | head -n 20

# Verify no security warnings
tail -100 /var/log/reposentry/combined.log | grep -i "warn\|error"
```

### Smoke Testing (First Hour)

#### CLI Functionality Test

```bash
# Test basic analysis on test repository
reposentry analyze --depth quick --output /tmp/test-output

# Verify output structure
ls -la /tmp/test-output/
test -f /tmp/test-output/HEALTH_REPORT.md && echo "✓ Health report generated"
test -f /tmp/test-output/analysis.json && echo "✓ Analysis JSON generated"

# Test serve mode
reposentry serve --port 3001 &
sleep 2
curl -s http://localhost:3001 | grep -q "RepoSentry" && echo "✓ Serve works"
kill %1
```

#### Server Mode Testing

```bash
# Start server
node dist/index.js serve --port 3000 &

# Test all endpoints
curl http://localhost:3000/health && echo "✓ /health works"
curl http://localhost:3000/ready && echo "✓ /ready works"
curl http://localhost:3000/ && echo "✓ / works"

# Stop server
kill %1
```

#### Configuration Verification

```bash
# Verify environment variables loaded
node -e "console.log('NODE_ENV:', process.env.NODE_ENV); console.log('PORT:', process.env.PORT);"

# Check Copilot integration
echo "test" | node dist/index.js 2>&1 | grep -q "Copilot" && echo "✓ Copilot integration active"
```

### Performance Baseline (First Day)

#### Response Time Measurement

```bash
# Measure endpoint response times
for i in {1..100}; do
  curl -w "%{time_total}\n" -o /dev/null -s \
    https://reposentry.example.com/health
done | awk '{sum+=$1; sumsq+=$1*$1; n++} END {
  avg = sum/n;
  stddev = sqrt(sumsq/n - avg*avg);
  print "Average: " avg "s, StdDev: " stddev "s"
}'
```

#### Load Test

```bash
# Install load testing tool
npm install -g autocannon

# Run load test
autocannon -c 50 -d 30 https://reposentry.example.com/health

# Expected metrics:
# - Requests/sec: > 100
# - P99 latency: < 500ms
# - Errors: 0
```

#### Resource Usage Baseline

```bash
# Record baseline metrics
kubectl top pod -n production -l app=reposentry
kubectl top node

# Save for comparison
{
  echo "Baseline: $(date)"
  kubectl top pod -n production -l app=reposentry
} >> /tmp/resource-baseline.log
```

### Security Verification

#### SSL/TLS Verification

```bash
# Verify certificate
openssl s_client -connect reposentry.example.com:443 -servername reposentry.example.com </dev/null | grep -A5 "Certificate"

# Check certificate expiration
echo | openssl s_client -connect reposentry.example.com:443 2>/dev/null | \
  openssl x509 -noout -dates

# Test TLS protocols
nmap --script ssl-enum-ciphers -p 443 reposentry.example.com

# Expected: TLS 1.2+ only
```

#### Security Headers Verification

```bash
# Check security headers
curl -I https://reposentry.example.com | grep -E "Strict-Transport|X-Frame|X-Content|CSP"

# Expected headers:
# Strict-Transport-Security: max-age=31536000
# X-Frame-Options: SAMEORIGIN
# X-Content-Type-Options: nosniff
```

#### Vulnerability Scan

```bash
# Run OWASP ZAP scan
docker run -t owasp/zap2docker-stable zap-baseline.py -t https://reposentry.example.com

# No critical vulnerabilities should be found
```

### Functional Validation

#### Full Feature Test Suite

Create `tests/production-verification.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';

describe('Production Verification', () => {
  const baseUrl = 'https://reposentry.example.com';

  it('health endpoint returns 200', async () => {
    const res = await fetch(`${baseUrl}/health`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('ok');
  });

  it('ready endpoint returns 200', async () => {
    const res = await fetch(`${baseUrl}/ready`);
    expect(res.status).toBe(200);
  });

  it('CLI help works', async () => {
    const res = await fetch(`${baseUrl}/api/cli/help`);
    expect(res.status).toBe(200);
  });

  it('serves static content', async () => {
    const res = await fetch(`${baseUrl}/public/index.html`);
    expect(res.ok).toBe(true);
  });
});
```

Run tests:
```bash
npm run test -- tests/production-verification.test.ts
```

#### User Acceptance Testing

- [ ] CLI accepts all documented flags without errors
- [ ] Analysis completes within 5-30 minutes depending on depth
- [ ] Generated markdown files are valid and complete
- [ ] HTML output renders correctly in browsers
- [ ] JSON output is valid and machine-readable
- [ ] Server mode serves reports correctly
- [ ] Badge endpoint returns valid shields.io badge URL
- [ ] No sensitive information exposed in output
- [ ] Proper error messages for invalid repositories
- [ ] Configuration loading from all supported sources works

### Monitoring Configuration Validation

#### Verify Metrics Collection

```bash
# Check Prometheus metrics are being scraped
curl -s https://reposentry.example.com/metrics | head -20

# Expected metrics:
# http_requests_total
# http_request_duration_seconds
# nodejs_heap_size_total_bytes
```

#### Verify Logs Are Being Collected

```bash
# AWS CloudWatch
aws logs tail /aws/elasticbeanstalk/reposentry --follow

# Google Cloud
gcloud logging read "resource.type=cloud_run_revision" --limit 50

# Azure Monitor
az monitor metrics list --resource /subscriptions/.../reposentry
```

#### Verify Alerts Are Active

```bash
# Trigger test alert
curl -X POST https://monitoring.example.com/test-alert \
  -d '{"service":"reposentry","severity":"critical"}'

# Verify notification received (email/Slack/PagerDuty)
```

### Documentation Completion

- [ ] Deployment runbook updated with actual URLs and credentials
- [ ] Incident response playbook created
- [ ] Scaling procedures documented
- [ ] Backup/restore procedures tested and documented
- [ ] Team trained on production operations
- [ ] Alert contacts verified and up-to-date
- [ ] On-call rotation configured
- [ ] Disaster recovery procedure tested

### Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| DevOps Lead | | | |
| SRE Lead | | | |
| Engineering Lead | | | |

---

## Troubleshooting Quick Reference

### Common Issues

| Issue | Cause | Resolution |
|-------|-------|-----------|
| High memory usage | Memory leak in analysis engine | Restart pod/container, investigate analysis depth |
| Slow analysis | Large repository or deep analysis | Use `--depth quick` or reduce scope |
| Copilot authentication fails | Invalid/expired token | Regenerate and update `COPILOT_AUTH_TOKEN` |
| SSL certificate errors | Cert expired or misconfigured | Verify cert with `openssl`, renew with Certbot |
| 502 Bad Gateway | Backend service down | Check pod/container logs, verify health endpoint |
| Health check failing | Port unreachable or timeout | Verify port binding, check network policies |

### Support Escalation

1. **Tier 1**: Check logs, restart service
2. **Tier 2**: Check metrics, verify network connectivity
3. **Tier 3**: Check dependency services (Copilot, Git)
4. **Tier 4**: Contact GitHub Copilot support

---

**Last Updated**: 2024 | **Next Review**: Quarterly