# Environment Configuration Guide

This guide covers environment variable setup, API key management, and configuration for different deployment environments.

## Quick Setup

### Automated Setup (Recommended)
```bash
# Run the interactive setup script
npm run setup:env

# Or directly:
node scripts/setup-env.js
```

### Manual Setup
```bash
# Copy environment template
cp config/environment.template .env.local

# Edit with your values
nano .env.local
```

## Environment Files

### File Structure
```
├── config/
│   ├── environment.template           # Complete template with all variables
│   ├── environment.development.template  # Development-specific template
│   └── environment.production.template   # Production-specific template
├── .env.local                        # Your local development config (git-ignored)
├── .env.development.local            # Development overrides (git-ignored)
└── .env.production                   # Production config (git-ignored)
```

### Environment Precedence
Next.js loads environment variables in this order (higher precedence wins):
1. `.env.local` (always loaded, except in test)
2. `.env.development.local` (when NODE_ENV=development)
3. `.env.production.local` (when NODE_ENV=production)
4. `.env.development` (when NODE_ENV=development)
5. `.env.production` (when NODE_ENV=production)
6. `.env`

## Required Environment Variables

### Critical Variables (Must Be Set)
```bash
# OpenAI API (Required for AI functionality)
OPENAI_API_KEY=sk-your-openai-api-key

# Database (Required for data persistence)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Cache (Required for session management)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Security (Required for authentication)
NEXTAUTH_SECRET=your-nextauth-secret-min-32-chars
JWT_SECRET=your-jwt-secret-min-32-chars
ENCRYPTION_KEY=your-encryption-key-32-chars

# Application URLs (Required for Next.js)
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## Service Configuration

### 1. OpenAI Setup

1. **Get API Key**:
   - Visit [OpenAI Platform](https://platform.openai.com/api-keys)
   - Create new API key
   - Copy and securely store the key

2. **Configuration**:
   ```bash
   OPENAI_API_KEY=sk-your-actual-api-key
   OPENAI_ORG_ID=org-your-organization-id  # Optional
   OPENAI_MODEL_PRIMARY=gpt-4
   OPENAI_MODEL_FALLBACK=gpt-3.5-turbo
   OPENAI_MAX_TOKENS=4000
   OPENAI_RATE_LIMIT_PER_MINUTE=60
   OPENAI_TIMEOUT_SECONDS=30
   OPENAI_TEMPERATURE=0.7
   ```

3. **Rate Limiting & Budget**:
   ```bash
   OPENAI_DAILY_QUOTA=1000
   OPENAI_MONTHLY_BUDGET=500
   ```

### 2. Supabase Database Setup

1. **Create Project**:
   - Visit [Supabase](https://supabase.com)
   - Create new project
   - Wait for database provisioning

2. **Get Configuration**:
   - Go to Settings → API
   - Copy URL and keys

3. **Configuration**:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   SUPABASE_JWT_SECRET=your-jwt-secret
   ```

### 3. Upstash Redis Setup

1. **Create Database**:
   - Visit [Upstash](https://upstash.com)
   - Create new Redis database
   - Choose region closest to your deployment

2. **Get Configuration**:
   - Go to database details
   - Copy REST URL and token

3. **Configuration**:
   ```bash
   UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your-token
   REDIS_SESSION_TTL=86400  # 24 hours
   REDIS_CACHE_TTL=3600     # 1 hour
   ```

### 4. Optional Services

#### Email (Resend)
```bash
RESEND_API_KEY=re_your-resend-api-key
FROM_EMAIL=notifications@your-domain.com
ADMIN_EMAIL=admin@your-domain.com
```

#### Monitoring (Sentry)
```bash
SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_ORG=your-organization
SENTRY_PROJECT=meta-agent-system
SENTRY_ENVIRONMENT=development
```

#### Analytics (MongoDB)
```bash
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
MONGODB_DB_NAME=meta-agent-analytics
```

## Security Best Practices

### 1. Secret Generation
```bash
# Generate secure secrets (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use the setup script (recommended)
npm run setup:env
```

### 2. Key Rotation
- Rotate secrets regularly (quarterly recommended)
- Update all environments simultaneously
- Monitor for unauthorized access

### 3. Access Control
```bash
# Restrict CORS origins
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Set appropriate rate limits
RATE_LIMIT_REQUESTS_PER_MINUTE=100
RATE_LIMIT_REQUESTS_PER_HOUR=1000
RATE_LIMIT_REQUESTS_PER_DAY=10000
```

### 4. Environment Isolation
- Use different API keys for dev/staging/production
- Separate database instances
- Different monitoring configurations

## Feature Flags

Control feature availability across environments:

```bash
# Core Features
ENABLE_ANALYTICS=true
ENABLE_ESCAPE_HATCH=true
ENABLE_ASSUMPTION_CASCADE=true
ENABLE_WIREFRAME_GENERATION=true

# Advanced Features
ENABLE_ADVANCED_PROFILING=false
ENABLE_EXPERIMENTAL_FEATURES=false

# Development Features
ENABLE_DEBUG_MODE=true              # Only in development
ENABLE_QUERY_LOGGING=true           # Only in development
ENABLE_API_LOGGING=true
ENABLE_PERFORMANCE_MONITORING=true
```

## Environment-Specific Configurations

### Development Environment
- Relaxed rate limits
- Enhanced logging
- All feature flags enabled
- Local service URLs

### Staging Environment
- Production-like configuration
- Limited feature flags
- Staging service instances
- Comprehensive logging

### Production Environment
- Strict rate limits
- Minimal logging
- Stable features only
- Production service instances
- Enhanced monitoring

## Validation and Testing

### Environment Validation
The application automatically validates environment variables on startup using Zod schemas.

### Test Configuration
```bash
# Run environment validation
npm run validate:env

# Test with different environments
NODE_ENV=development npm run dev
NODE_ENV=production npm run build
```

### Common Validation Errors
1. **Missing required variables**: Add to .env.local
2. **Invalid URLs**: Check format (https://...)
3. **Short secrets**: Must be 32+ characters
4. **Invalid email format**: Check email addresses

## Deployment Considerations

### Vercel Deployment
1. Add environment variables in Vercel dashboard
2. Set different values for Preview/Production
3. Use Vercel's secret management

### Docker Deployment
```dockerfile
# Use build-time variables for public vars
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

# Use runtime secrets for sensitive vars
ENV OPENAI_API_KEY=/run/secrets/openai_key
```

### Kubernetes Deployment
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: meta-agent-secrets
data:
  openai-api-key: <base64-encoded-key>
  jwt-secret: <base64-encoded-secret>
```

## Troubleshooting

### Common Issues

1. **Environment variables not loading**:
   - Check file names (.env.local vs .env)
   - Restart development server
   - Verify file location (project root)

2. **Invalid configuration errors**:
   - Run `npm run validate:env`
   - Check console for specific errors
   - Verify variable formats

3. **API connection failures**:
   - Verify API keys are correct
   - Check network connectivity
   - Verify service URLs

4. **Authentication issues**:
   - Ensure NEXTAUTH_SECRET is set
   - Check NEXTAUTH_URL matches your domain
   - Verify JWT_SECRET is 32+ characters

### Debug Commands
```bash
# Validate environment
npm run validate:env

# Test OpenAI connection
npm run test:openai

# Test database connection
npm run test:db

# Check environment loading
npm run debug:env
```

## Security Checklist

- [ ] All secrets are 32+ characters
- [ ] API keys are from official sources
- [ ] No secrets committed to git
- [ ] Environment variables validated
- [ ] CORS origins configured
- [ ] Rate limits set appropriately
- [ ] Monitoring configured
- [ ] Backup access configured

---

**Last Updated**: June 2025  
**Version**: 1.0.0 