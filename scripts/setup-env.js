#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const readline = require('readline')
const crypto = require('crypto')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`),
}

// Generate secure random strings
const generateSecret = (length = 32) => {
  return crypto.randomBytes(length).toString('hex')
}

// Check if file exists
const fileExists = (filePath) => {
  return fs.existsSync(filePath)
}

// Ask user a question
const askQuestion = (question, defaultValue = '') => {
  return new Promise((resolve) => {
    const prompt = defaultValue 
      ? `${question} (${colors.yellow}${defaultValue}${colors.reset}): `
      : `${question}: `
    
    rl.question(prompt, (answer) => {
      resolve(answer.trim() || defaultValue)
    })
  })
}

// Ask yes/no question
const askYesNo = (question, defaultValue = true) => {
  return new Promise((resolve) => {
    const defaultText = defaultValue ? 'Y/n' : 'y/N'
    rl.question(`${question} (${defaultText}): `, (answer) => {
      const response = answer.trim().toLowerCase()
      if (response === '') resolve(defaultValue)
      else resolve(response === 'y' || response === 'yes')
    })
  })
}

// Main setup function
async function setupEnvironment() {
  log.title('🚀 Meta-Agent System Environment Setup')
  
  log.info('This script will help you configure your environment variables.')
  log.info('You can skip optional variables by pressing Enter.')
  
  // Check if .env.local already exists
  const envLocalPath = path.join(process.cwd(), '.env.local')
  if (fileExists(envLocalPath)) {
    log.warning('.env.local already exists!')
    const overwrite = await askYesNo('Do you want to overwrite it?', false)
    if (!overwrite) {
      log.info('Setup cancelled. Existing .env.local preserved.')
      rl.close()
      return
    }
  }

  const config = {}

  // Environment basics
  log.title('📝 Basic Configuration')
  config.NODE_ENV = await askQuestion('Environment type', 'development')
  config.DEBUG = await askYesNo('Enable debug mode?', true) ? 'true' : 'false'
  config.LOG_LEVEL = await askQuestion('Log level (debug/info/warn/error)', 'debug')

  // Next.js configuration
  log.title('🌐 Next.js Configuration')
  config.NEXTAUTH_URL = await askQuestion('Application URL', 'http://localhost:3000')
  config.NEXT_PUBLIC_APP_URL = config.NEXTAUTH_URL
  config.NEXT_PUBLIC_API_URL = `${config.NEXTAUTH_URL}/api`
  
  // Generate secure secrets
  log.title('🔐 Security Configuration')
  log.info('Generating secure random secrets...')
  config.NEXTAUTH_SECRET = generateSecret()
  config.JWT_SECRET = generateSecret()
  config.ENCRYPTION_KEY = generateSecret()
  log.success('Security secrets generated')

  // OpenAI configuration
  log.title('🤖 OpenAI Configuration')
  config.OPENAI_API_KEY = await askQuestion('OpenAI API Key (required)')
  
  if (!config.OPENAI_API_KEY) {
    log.error('OpenAI API Key is required!')
    log.info('Get your API key from: https://platform.openai.com/api-keys')
    rl.close()
    return
  }

  config.OPENAI_ORG_ID = await askQuestion('OpenAI Organization ID (optional)')
  config.OPENAI_MODEL_PRIMARY = await askQuestion('Primary OpenAI model', 'gpt-4o-mini')
  config.OPENAI_MODEL_FALLBACK = await askQuestion('Fallback OpenAI model', 'gpt-3.5-turbo')
  config.OPENAI_MAX_TOKENS = await askQuestion('Max tokens per request', '4000')
  config.OPENAI_RATE_LIMIT_PER_MINUTE = await askQuestion('Rate limit per minute', '60')
  config.OPENAI_TIMEOUT_SECONDS = await askQuestion('Request timeout (seconds)', '30')
  config.OPENAI_TEMPERATURE = await askQuestion('AI temperature (0-1)', '0.7')

  // Session storage (lightweight, in-memory)
  log.title('💾 Session Configuration')
  log.info('Using in-memory session storage for dynamic conversations')
  config.SESSION_STORAGE = 'memory'
  config.MAX_CONVERSATION_HISTORY = await askQuestion('Max conversation history items', '50')

  // Redis configuration
  log.title('🗄️ Cache Configuration')
  config.UPSTASH_REDIS_REST_URL = await askQuestion('Upstash Redis URL')
  config.UPSTASH_REDIS_REST_TOKEN = await askQuestion('Upstash Redis Token')

  if (!config.UPSTASH_REDIS_REST_URL || !config.UPSTASH_REDIS_REST_TOKEN) {
    log.warning('Redis configuration incomplete')
    log.info('Set up Upstash Redis at: https://upstash.com/')
  }

  // Optional configurations
  log.title('📧 Optional: Email Configuration')
  const enableEmail = await askYesNo('Configure email service (Resend)?', false)
  if (enableEmail) {
    config.RESEND_API_KEY = await askQuestion('Resend API Key')
    config.FROM_EMAIL = await askQuestion('From email address')
    config.ADMIN_EMAIL = await askQuestion('Admin email address')
  }

  log.title('📊 Optional: Monitoring Configuration')
  const enableMonitoring = await askYesNo('Configure error monitoring (Sentry)?', false)
  if (enableMonitoring) {
    config.SENTRY_DSN = await askQuestion('Sentry DSN')
    config.SENTRY_ORG = await askQuestion('Sentry Organization')
    config.SENTRY_PROJECT = await askQuestion('Sentry Project', 'meta-agent-system')
    config.SENTRY_ENVIRONMENT = config.NODE_ENV
  }

  // Feature flags
  log.title('🚩 Feature Flags')
  config.ENABLE_ANALYTICS = await askYesNo('Enable analytics?', true) ? 'true' : 'false'
  config.ENABLE_ESCAPE_HATCH = await askYesNo('Enable escape hatch?', true) ? 'true' : 'false'
  config.ENABLE_ASSUMPTION_CASCADE = await askYesNo('Enable assumption cascade?', true) ? 'true' : 'false'
  config.ENABLE_ADVANCED_PROFILING = await askYesNo('Enable advanced profiling?', false) ? 'true' : 'false'
  config.ENABLE_WIREFRAME_GENERATION = await askYesNo('Enable wireframe generation?', true) ? 'true' : 'false'
  config.ENABLE_DEBUG_MODE = config.NODE_ENV === 'development' ? 'true' : 'false'
  config.ENABLE_EXPERIMENTAL_FEATURES = await askYesNo('Enable experimental features?', false) ? 'true' : 'false'

  // Rate limiting
  log.title('⚡ Rate Limiting')
  config.RATE_LIMIT_REQUESTS_PER_MINUTE = await askQuestion('Requests per minute limit', '100')
  config.RATE_LIMIT_REQUESTS_PER_HOUR = await askQuestion('Requests per hour limit', '1000')
  config.RATE_LIMIT_REQUESTS_PER_DAY = await askQuestion('Requests per day limit', '10000')
  config.OPENAI_DAILY_QUOTA = await askQuestion('OpenAI daily quota', '1000')
  config.OPENAI_MONTHLY_BUDGET = await askQuestion('OpenAI monthly budget ($)', '500')

  // CORS
  config.CORS_ORIGINS = config.NEXTAUTH_URL

  // Redis TTL
  config.REDIS_SESSION_TTL = '86400'
  config.REDIS_CACHE_TTL = '3600'

  // Conversation analytics (optional)
  const enableAnalytics = await askYesNo('Enable conversation analytics?', false)
  if (enableAnalytics) {
    log.info('Analytics will be stored in Redis with configurable TTL')
    config.ANALYTICS_ENABLED = 'true'
    config.ANALYTICS_RETENTION_DAYS = await askQuestion('Analytics retention (days)', '30')
  }

  // Development tools
  if (config.NODE_ENV === 'development') {
    config.ENABLE_QUERY_LOGGING = 'true'
    config.ENABLE_API_LOGGING = 'true'
    config.ENABLE_PERFORMANCE_MONITORING = 'true'
  } else {
    config.ENABLE_QUERY_LOGGING = 'false'
    config.ENABLE_API_LOGGING = 'false'
    config.ENABLE_PERFORMANCE_MONITORING = 'true'
  }

  // Generate .env.local file
  log.title('💾 Generating Environment File')
  
  const envContent = Object.entries(config)
    .filter(([_, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')

  const envFileContent = `# Meta-Agent System Environment Configuration
# Generated on ${new Date().toISOString()}
# DO NOT commit this file to version control

${envContent}
`

  try {
    fs.writeFileSync(envLocalPath, envFileContent)
    log.success('.env.local file created successfully!')
  } catch (error) {
    log.error(`Failed to create .env.local: ${error.message}`)
    rl.close()
    return
  }

  // Summary
  log.title('📋 Setup Summary')
  log.success(`Environment: ${config.NODE_ENV}`)
  log.success(`Application URL: ${config.NEXTAUTH_URL}`)
  log.success(`OpenAI Model: ${config.OPENAI_MODEL_PRIMARY}`)
  
  log.success('Session Storage: In-memory (dynamic conversations)')
  
  if (config.UPSTASH_REDIS_REST_URL) {
    log.success('Cache: Configured')
  } else {
    log.warning('Cache: Not configured')
  }

  log.title('🎉 Setup Complete!')
  log.info('Next steps:')
  log.info('1. Review your .env.local file')
  log.info('2. Set up any missing services (Upstash Redis, Resend, etc.)')
  log.info('3. Run: npm run dev')
  log.info('')
  log.info('For help, check: README.dev.md')

  rl.close()
}

// Run setup
setupEnvironment().catch((error) => {
  log.error(`Setup failed: ${error.message}`)
  rl.close()
  process.exit(1)
}) 