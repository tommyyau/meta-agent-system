# 🚀 Meta-Agent Infrastructure

This directory contains the infrastructure configuration for the Meta-Agent System, optimized for **Vercel deployment** with modern cloud services.

## 📁 Directory Structure

```
infrastructure/
├── README.md                     # This file
├── docker-compose.yml           # Local development environment
├── services.yml                 # External services configuration
├── vercel/
│   └── project.json            # Vercel project configuration
├── deployment/
│   ├── vercel-cli.sh           # Vercel deployment script
│   └── github-actions.yml      # CI/CD pipeline
└── lighthouse/
    └── lighthouserc.json       # Performance testing config
```

## 🏗️ Architecture Overview

### **Modern Vercel-Centric Stack**

- **🌐 Frontend + API:** Next.js (deployed on Vercel)
- **🗄️ Database:** Supabase PostgreSQL with real-time features
- **⚡ Cache:** Upstash Redis (serverless)
- **📊 Analytics:** MongoDB Atlas for user behavior tracking
- **📁 Storage:** Vercel Blob for wireframes and assets
- **📧 Email:** Resend for notifications
- **🔍 Monitoring:** Vercel Analytics + Sentry
- **🚀 Deployment:** Vercel with automatic deployments

### **Why Vercel Instead of AWS?**

✅ **Zero Configuration:** No complex infrastructure management  
✅ **Built-in CI/CD:** Automatic deployments from Git  
✅ **Global CDN:** Instant worldwide distribution  
✅ **Serverless Functions:** Auto-scaling API endpoints  
✅ **Preview Deployments:** Branch-based staging  
✅ **Cost-Effective:** Pay-per-use pricing  
✅ **Developer Experience:** Excellent tooling and integration  

## 🚀 Quick Start

### 1. **Local Development Setup**

```bash
# Clone the repository
git clone <repository-url>
cd meta-agent-system

# Start local development environment
docker-compose -f infrastructure/docker-compose.yml up -d

# The app will be available at:
# - Frontend: http://localhost:3000
# - Database: localhost:5432
# - Redis: localhost:6379
# - MongoDB: localhost:27017
```

### 2. **Vercel Deployment Setup**

```bash
# Make deployment script executable
chmod +x infrastructure/deployment/vercel-cli.sh

# Initial project setup
./infrastructure/deployment/vercel-cli.sh setup

# Set environment variables
export OPENAI_API_KEY="your-key"
export DATABASE_URL="your-supabase-url"
export REDIS_URL="your-upstash-url"

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
- API routes and routing rules
- Environment variables management
- Function timeout configurations
- CORS headers and security settings
- Cron jobs for maintenance tasks

### **services.yml**
External services documentation including:
- Database options (Supabase/PlanetScale)
- Redis cache (Upstash)
- Analytics (MongoDB Atlas)
- File storage (Vercel Blob)
- Email service (Resend)
- Monitoring (Sentry + Vercel Analytics)

### **docker-compose.yml**
Local development environment with:
- Next.js application container
- PostgreSQL database
- Redis cache
- MongoDB for analytics
- Development proxy

## 🌍 Environment Variables

### **Required for All Environments:**
```bash
OPENAI_API_KEY=sk-...              # OpenAI API access
DATABASE_URL=postgresql://...       # Supabase PostgreSQL
REDIS_URL=redis://...              # Upstash Redis
NEXTAUTH_SECRET=...                # Authentication secret
```

### **Production Additional:**
```bash
SUPABASE_URL=https://...           # Supabase project URL
SUPABASE_ANON_KEY=...             # Supabase anonymous key
SENTRY_DSN=https://...            # Error tracking
RESEND_API_KEY=...                # Email service
VERCEL_BLOB_READ_WRITE_TOKEN=...  # File storage
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
- **Vercel Analytics:** Web Vitals, audience insights
- **Vercel Speed Insights:** Real-time performance metrics
- **Function Logs:** Serverless function monitoring

### **External Monitoring:**
- **Sentry:** Error tracking and performance monitoring
- **Lighthouse CI:** Automated performance testing
- **Uptime Monitoring:** Third-party service monitoring

### **Analytics Dashboard:**
Access your analytics at:
- Vercel: `https://vercel.com/dashboard/analytics`
- Sentry: `https://sentry.io/organizations/your-org/`

## 🔒 Security Features

### **Built-in Security:**
- **HTTPS Everywhere:** Automatic SSL certificates
- **Environment Isolation:** Separate staging/production
- **Secret Management:** Encrypted environment variables
- **CORS Protection:** Configured API headers

### **Additional Security:**
- **Rate Limiting:** API endpoint protection
- **Input Validation:** Request sanitization
- **SQL Injection Protection:** Parameterized queries
- **XSS Prevention:** Content Security Policy

## 🆘 Troubleshooting

### **Common Issues:**

**Deployment Fails:**
```bash
# Check build logs
vercel logs your-deployment-url

# Verify environment variables
vercel env ls
```

**Database Connection Issues:**
```bash
# Test connection locally
psql $DATABASE_URL

# Check Supabase dashboard for connection limits
```

**Redis Connection Issues:**
```bash
# Test Redis connection
redis-cli -u $REDIS_URL ping
```

### **Getting Help:**
- **Vercel Documentation:** https://vercel.com/docs
- **Supabase Documentation:** https://supabase.com/docs
- **Upstash Documentation:** https://upstash.com/docs
- **Project Issues:** Create an issue in the repository

## 🚀 Scaling Considerations

### **Automatic Scaling:**
- **Vercel Functions:** Auto-scale based on demand
- **Supabase:** Automatic connection pooling
- **Upstash Redis:** Serverless scaling
- **CDN:** Global edge distribution

### **Performance Optimization:**
- **Edge Functions:** For geographically distributed logic
- **ISR (Incremental Static Regeneration):** For frequently accessed content
- **Database Indexing:** Optimized queries
- **Caching Strategy:** Multi-layer caching

## 📈 Cost Optimization

### **Vercel Costs:**
- **Hobby Plan:** Free for personal projects
- **Pro Plan:** $20/month for teams
- **Enterprise:** Custom pricing for scale

### **External Service Costs:**
- **Supabase:** Free tier + usage-based
- **Upstash Redis:** Free tier + per-request pricing
- **MongoDB Atlas:** Free tier + usage-based
- **Sentry:** Free tier + event-based pricing

### **Cost Monitoring:**
- Set up billing alerts in each service
- Monitor usage in respective dashboards
- Use Vercel's usage analytics

---

## 💾 Database Setup

### **Setting up Supabase Database:**

1. **Create Supabase Project:**
   ```bash
   # Visit https://supabase.com and create new project
   # Note your project URL and API keys
   ```

2. **Run Database Setup:**
   ```bash
   cd database/
   export SUPABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
   export SUPABASE_ANON_KEY="your-anon-key"
   export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   ./setup.sh
   ```

3. **Verify Setup:**
   - Check Supabase dashboard for tables
   - Verify question banks are populated
   - Test RLS policies are active

### **Database Features:**
- **15+ Tables:** Complete schema for meta-agent system
- **Question Banks:** 45+ domain-specific questions (Fintech, Healthcare, General)
- **Analytics:** User behavior and model performance tracking
- **Security:** Row Level Security (RLS) for all user data
- **Performance:** Optimized indexes and query patterns

## 🎯 Next Steps

1. **Set up Supabase database** using the database setup script
2. **Configure remaining external services** (Upstash, MongoDB Atlas)
3. **Set environment variables** in Vercel dashboard
4. **Set up monitoring** with Sentry and analytics
5. **Test deployment pipeline** with a small change
5. **Configure custom domain** (if needed)

This infrastructure setup provides a solid foundation for scaling the Meta-Agent System from MVP to production at scale! 🚀 