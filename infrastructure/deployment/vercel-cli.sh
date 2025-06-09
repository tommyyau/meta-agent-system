#!/bin/bash

# Meta-Agent System Vercel Deployment Script
# This script replaces Terraform for Vercel-based deployments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="meta-agent-system"
FRAMEWORK="nextjs"
TEAM=${VERCEL_TEAM_ID:-""}

echo -e "${BLUE}🚀 Meta-Agent System Vercel Deployment${NC}"
echo "=================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
fi

# Login to Vercel (if not already logged in)
echo -e "${YELLOW}🔐 Checking Vercel authentication...${NC}"
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}Please log in to Vercel:${NC}"
    vercel login
fi

# Function to set environment variables
set_env_vars() {
    local environment=$1
    echo -e "${BLUE}📝 Setting environment variables for ${environment}...${NC}"
    
    # Core environment variables
    if [ -n "$OPENAI_API_KEY" ]; then
        vercel env add OPENAI_API_KEY $environment < <(echo "$OPENAI_API_KEY")
    fi
    
    if [ -n "$DATABASE_URL" ]; then
        vercel env add DATABASE_URL $environment < <(echo "$DATABASE_URL")
    fi
    
    if [ -n "$REDIS_URL" ]; then
        vercel env add REDIS_URL $environment < <(echo "$REDIS_URL")
    fi
    
    if [ -n "$SUPABASE_URL" ]; then
        vercel env add SUPABASE_URL $environment < <(echo "$SUPABASE_URL")
    fi
    
    if [ -n "$SUPABASE_ANON_KEY" ]; then
        vercel env add SUPABASE_ANON_KEY $environment < <(echo "$SUPABASE_ANON_KEY")
    fi
    
    if [ -n "$NEXTAUTH_SECRET" ]; then
        vercel env add NEXTAUTH_SECRET $environment < <(echo "$NEXTAUTH_SECRET")
    fi
    
    echo -e "${GREEN}✅ Environment variables set for ${environment}${NC}"
}

# Function to deploy to environment
deploy() {
    local environment=$1
    local alias=$2
    
    echo -e "${BLUE}🚀 Deploying to ${environment}...${NC}"
    
    if [ "$environment" = "production" ]; then
        vercel --prod --yes
        if [ -n "$alias" ]; then
            vercel alias set $alias
        fi
    else
        vercel --yes
    fi
    
    echo -e "${GREEN}✅ Deployment to ${environment} completed!${NC}"
}

# Function to setup project
setup_project() {
    echo -e "${BLUE}📦 Setting up Vercel project...${NC}"
    
    # Link to existing project or create new one
    if vercel link --yes; then
        echo -e "${GREEN}✅ Project linked successfully${NC}"
    else
        echo -e "${YELLOW}⚠️  Creating new project...${NC}"
        vercel --name $PROJECT_NAME --yes
    fi
    
    # Copy Vercel configuration
    if [ -f "infrastructure/vercel/project.json" ]; then
        cp infrastructure/vercel/project.json vercel.json
        echo -e "${GREEN}✅ Vercel configuration copied${NC}"
    fi
}

# Function to setup domains
setup_domains() {
    echo -e "${BLUE}🌐 Setting up domains...${NC}"
    
    # Add custom domain if specified
    if [ -n "$CUSTOM_DOMAIN" ]; then
        vercel domains add $CUSTOM_DOMAIN
        vercel alias $CUSTOM_DOMAIN
        echo -e "${GREEN}✅ Custom domain ${CUSTOM_DOMAIN} configured${NC}"
    fi
}

# Function to setup monitoring
setup_monitoring() {
    echo -e "${BLUE}📊 Setting up monitoring...${NC}"
    
    # Enable Vercel Analytics
    echo -e "${YELLOW}Enable Vercel Analytics in your dashboard at:${NC}"
    echo -e "${BLUE}https://vercel.com/dashboard/analytics${NC}"
    
    # Setup Sentry if DSN provided
    if [ -n "$SENTRY_DSN" ]; then
        vercel env add SENTRY_DSN production < <(echo "$SENTRY_DSN")
        echo -e "${GREEN}✅ Sentry monitoring configured${NC}"
    fi
}

# Main deployment flow
case "${1:-setup}" in
    "setup")
        echo -e "${YELLOW}🔧 Initial project setup${NC}"
        setup_project
        ;;
    
    "env-dev")
        echo -e "${YELLOW}🔧 Setting up development environment${NC}"
        set_env_vars "development"
        ;;
    
    "env-preview")
        echo -e "${YELLOW}🔧 Setting up preview environment${NC}"
        set_env_vars "preview"
        ;;
    
    "env-prod")
        echo -e "${YELLOW}🔧 Setting up production environment${NC}"
        set_env_vars "production"
        ;;
    
    "deploy-dev")
        echo -e "${YELLOW}🚀 Deploying to development${NC}"
        deploy "development"
        ;;
    
    "deploy-preview")
        echo -e "${YELLOW}🚀 Deploying to preview${NC}"
        deploy "preview"
        ;;
    
    "deploy-prod")
        echo -e "${YELLOW}🚀 Deploying to production${NC}"
        deploy "production" "$CUSTOM_DOMAIN"
        setup_domains
        setup_monitoring
        ;;
    
    "full-setup")
        echo -e "${YELLOW}🔧 Complete setup and deployment${NC}"
        setup_project
        set_env_vars "development"
        set_env_vars "preview"
        set_env_vars "production"
        deploy "production" "$CUSTOM_DOMAIN"
        setup_domains
        setup_monitoring
        ;;
    
    "status")
        echo -e "${BLUE}📊 Project status${NC}"
        vercel ls
        vercel domains ls
        vercel env ls
        ;;
    
    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        echo ""
        echo -e "${YELLOW}Available commands:${NC}"
        echo "  setup         - Initial project setup"
        echo "  env-dev       - Set development environment variables"
        echo "  env-preview   - Set preview environment variables"
        echo "  env-prod      - Set production environment variables"
        echo "  deploy-dev    - Deploy to development"
        echo "  deploy-preview- Deploy to preview"
        echo "  deploy-prod   - Deploy to production"
        echo "  full-setup    - Complete setup and deployment"
        echo "  status        - Show project status"
        echo ""
        echo -e "${YELLOW}Environment variables to set before running:${NC}"
        echo "  OPENAI_API_KEY, DATABASE_URL, REDIS_URL, SUPABASE_URL,"
        echo "  SUPABASE_ANON_KEY, NEXTAUTH_SECRET, CUSTOM_DOMAIN"
        exit 1
        ;;
esac

echo -e "${GREEN}🎉 Operation completed successfully!${NC}" 