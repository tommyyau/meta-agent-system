# 🚀 Meta-Agent Infrastructure

This directory contains the infrastructure configuration for the Meta-Agent System, optimized for **lightweight Vercel deployment** with minimal external dependencies.

## 📁 Directory Structure

```
infrastructure/
├── README.md                     # This file
├── docker-compose.yml           # Local Redis for development
├── services.yml                 # External services configuration
├── vercel/
│   └── project.json            # Vercel project configuration
├── deployment/
│   ├── vercel-cli.sh           # Vercel deployment script
│   └── github-actions.yml      # CI/CD pipeline
└── monitoring/
    └── performance.config.json # Performance monitoring config
```

## 🏗️ Architecture Overview

### **Lightweight Dynamic Conversation Stack**

- **🌐 Frontend + API:** Next.js with dynamic conversation engine (deployed on Vercel)
- **🧠 AI Engine:** OpenAI GPT-4 for dynamic question generation and conversation analysis
- **⚡ Session Storage:** In-memory with Redis caching (Upstash serverless)
- **📁 File Storage:** Vercel Blob for generated wireframes and exports
- **📧 Email:** Resend for notifications (optional)
- **🔍 Monitoring:** Vercel Analytics + Sentry
- **🚀 Deployment:** Vercel with automatic deployments

### **🎯 No Traditional Database Architecture**

❌ **No PostgreSQL/MySQL** - No static data storage needed  
❌ **No MongoDB** - No heavy analytics database  
❌ **No ORM Complexity** - No database migrations or schemas  
✅ **In-Memory Sessions** - Fast, lightweight conversation state  
✅ **Redis Caching** - Optional session persistence  
✅ **Dynamic Generation** - All content generated in real-time  
✅ **Cost-Effective** - Pay only for compute and OpenAI usage  

### **Why This Architecture?**

✅ **Ultra-Fast Response Times:** No database queries, pure in-memory processing  
✅ **Infinite Scalability:** Serverless functions scale to demand  
✅ **Cost Optimization:** No database hosting or maintenance costs  
✅ **Conversation Intelligence:** GPT-4 provides domain expertise vs static content  
✅ **Real-time Adaptation:** Conversations adapt instantly to user sophistication  
✅ **Zero Maintenance:** No database backups, migrations, or schema management  

## 🚀 Quick Start

### 1. **Local Development Setup**

```bash
# Clone the repository
git clone <repository-url>
cd meta-agent-system

# Start local Redis for development (optional)
docker-compose -f infrastructure/docker-compose.yml up -d redis

# The app will be available at:
# - Frontend: http://localhost:3000
# - Redis (optional): localhost:6379
```

### 2. **Vercel Deployment Setup**

```bash
# Make deployment script executable
chmod +x infrastructure/deployment/vercel-cli.sh

# Initial project setup
./infrastructure/deployment/vercel-cli.sh setup

# Set environment variables
export OPENAI_API_KEY="your-openai-key"
export UPSTASH_REDIS_REST_URL="your-redis-url"
export UPSTASH_REDIS_REST_TOKEN="your-redis-token"

# Deploy to production
./infrastructure/deployment/vercel-cli.sh deploy-prod
```

### 3. **GitHub Actions CI/CD**

Copy the workflow file to enable automatic deployments:

```bash
mkdir -p .github/workflows
cp infrastructure/deployment/github-actions.yml .github/workflows/deploy.yml
```

## 🔧 Configuration Files

### **vercel/project.json**
Main Vercel configuration with:
- API routes for dynamic conversation endpoints
- OpenAI API proxy configuration
- Environment variables management
- Function timeout configurations for AI processing
- CORS headers and security settings

### **services.yml**
External services documentation including:
- OpenAI GPT-4 integration setup
- Redis cache (Upstash) for session storage
- File storage (Vercel Blob) for wireframe exports
- Email service (Resend) for notifications
- Monitoring (Sentry + Vercel Analytics)

### **docker-compose.yml**
Local development environment with:
- Redis container for session caching (optional)
- Development environment setup

## 🌍 Environment Variables

### **Required for All Environments:**
```bash
# Core AI Integration
OPENAI_API_KEY=sk-...              # OpenAI GPT-4 API access
OPENAI_ORG_ID=org-...             # OpenAI organization (optional)
OPENAI_MODEL_PRIMARY=gpt-4         # Primary conversation model
OPENAI_MODEL_FALLBACK=gpt-3.5-turbo # Fallback model

# Session Management
SESSION_STORAGE=memory             # Session storage type
MAX_CONVERSATION_HISTORY=50        # Max conversation items
UPSTASH_REDIS_REST_URL=...        # Redis session cache (optional)
UPSTASH_REDIS_REST_TOKEN=...      # Redis authentication (optional)

# Core Application
NEXTAUTH_SECRET=...               # Authentication secret
NEXT_PUBLIC_APP_URL=...           # Application URL
```

### **Production Additional:**
```bash
# Monitoring & Analytics
SENTRY_DSN=https://...            # Error tracking
ENABLE_ANALYTICS=true             # Conversation analytics
ANALYTICS_RETENTION_DAYS=30       # Analytics retention

# File Storage
VERCEL_BLOB_READ_WRITE_TOKEN=...  # Wireframe storage

# Notifications (Optional)
RESEND_API_KEY=...                # Email service
```

### **Setting Environment Variables:**

**Via Vercel CLI:**
```bash
vercel env add OPENAI_API_KEY production
```

**Via Vercel Dashboard:**
1. Go to your project in Vercel dashboard
2. Settings → Environment Variables
3. Add your variables for each environment

## 🔄 Deployment Workflows

### **Automatic Deployments:**
- **Main Branch:** → Production deployment
- **Pull Requests:** → Preview deployments with comment links
- **Feature Branches:** → Development deployments

### **Manual Deployments:**
```bash
# Development
./infrastructure/deployment/vercel-cli.sh deploy-dev

# Preview
./infrastructure/deployment/vercel-cli.sh deploy-preview

# Production
./infrastructure/deployment/vercel-cli.sh deploy-prod
```

### **Environment Management:**
```bash
# Set up all environments
./infrastructure/deployment/vercel-cli.sh full-setup

# Check project status
./infrastructure/deployment/vercel-cli.sh status
```

## 📊 Monitoring & Analytics

### **Built-in Monitoring:**
- **Vercel Analytics:** Conversation flow insights, user engagement
- **Vercel Speed Insights:** Real-time performance metrics
- **Function Logs:** AI processing and conversation monitoring

### **Conversation Analytics:**
- **OpenAI Usage Tracking:** Token consumption and cost monitoring
- **Conversation Quality Metrics:** User satisfaction and completion rates
- **Profile Detection Accuracy:** Industry and sophistication classification performance
- **Escape Hatch Usage:** User behavior and conversation optimization insights

### **External Monitoring:**
- **Sentry:** Error tracking and AI processing monitoring
- **Performance Testing:** Automated conversation flow testing

### **Analytics Dashboard:**
Access your analytics at:
- Vercel: `https://vercel.com/dashboard/analytics`
- Sentry: `https://sentry.io/organizations/your-org/`
- OpenAI: `https://platform.openai.com/usage`

## 🔒 Security Features

### **Built-in Security:**
- **HTTPS Everywhere:** Automatic SSL certificates
- **Environment Isolation:** Separate staging/production
- **Secret Management:** Encrypted environment variables
- **CORS Protection:** Configured API headers
- **OpenAI API Protection:** Rate limiting and usage monitoring

### **Data Privacy:**
- **No Persistent Storage:** Conversations stored only in session
- **Redis TTL:** Automatic data expiration
- **Minimal Data Collection:** Only essential conversation analytics
- **GDPR Compliant:** Easy data deletion via session expiration

## 💰 Cost Management

### **Cost Optimization Features:**
- **No Database Costs:** Zero infrastructure hosting fees
- **OpenAI Budget Monitoring:** Automatic usage tracking and alerts
- **Serverless Scaling:** Pay only for actual usage
- **Redis Cost Control:** Optional caching with automatic expiration

### **Expected Monthly Costs (Production):**
- **Vercel Pro:** $20/month for team features
- **OpenAI GPT-4:** $30-100/month (depends on usage)
- **Upstash Redis:** $0-15/month (optional, usage-based)
- **Vercel Blob:** $0-10/month (wireframe storage)
- **Total:** $50-145/month (vs $200-500+ with traditional database)

## 🎯 **Key Architectural Benefits**

1. **Ultra-Fast Performance**: No database queries, pure in-memory processing
2. **Infinite Scalability**: Serverless functions scale automatically
3. **Cost Efficiency**: 60-70% lower costs vs traditional database architecture
4. **Conversation Quality**: GPT-4 provides expert-level domain knowledge
5. **Real-time Adaptation**: Conversations adapt instantly to user behavior
6. **Zero Maintenance**: No database backups, migrations, or schema updates

## 🔧 Troubleshooting

### **Common Issues:**

1. **OpenAI API Rate Limits**
   ```bash
   # Check current usage
   npm run debug:env | grep OPENAI
   # Monitor in OpenAI dashboard
   ```

2. **Redis Connection Issues**
   ```bash
   # Test Redis connectivity
   npm run test:services
   ```

3. **Session Storage Problems**
   ```bash
   # Switch to pure in-memory mode
   SESSION_STORAGE=memory
   ```

### **Performance Monitoring:**
```bash
# Test conversation performance
npm run test:conversation

# Test OpenAI integration
npm run test:openai

# Validate environment setup
npm run validate:env
```

---

**Last Updated**: December 2024  
**Version**: 2.0.0 (Dynamic Conversation Architecture) 