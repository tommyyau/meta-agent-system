#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
}

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
}

// Critical environment variables that must be present
const criticalVars = [
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_API_URL',
]

// Important environment variables that should be present
const importantVars = [
  'OPENAI_API_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'JWT_SECRET',
  'ENCRYPTION_KEY',
]

// Optional but recommended variables
const optionalVars = [
  'SENTRY_DSN',
  'RESEND_API_KEY',
  'MONGODB_URI',
  'OPENAI_ORG_ID',
]

function validateEnvironment() {
  log.info('🔍 Validating environment configuration...\n')
  
  let hasErrors = false
  let hasWarnings = false

  // Check for .env.local file
  const envLocalPath = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(envLocalPath)) {
    log.warning('No .env.local file found')
    log.info('Run: npm run setup:env to create one\n')
    hasWarnings = true
  } else {
    log.success('.env.local file found')
  }

  // Load environment variables from .env.local if it exists
  if (fs.existsSync(envLocalPath)) {
    const envContent = fs.readFileSync(envLocalPath, 'utf8')
    const envLines = envContent.split('\n')
    envLines.forEach(line => {
      const [key, value] = line.split('=')
      if (key && value && !key.startsWith('#')) {
        process.env[key] = value
      }
    })
  }

  // Validate critical variables
  log.info('🔑 Checking critical variables:')
  criticalVars.forEach(varName => {
    const value = process.env[varName]
    if (!value) {
      log.error(`Missing critical variable: ${varName}`)
      hasErrors = true
    } else {
      log.success(`${varName} is set`)
    }
  })

  // Validate important variables
  log.info('\n📋 Checking important variables:')
  importantVars.forEach(varName => {
    const value = process.env[varName]
    if (!value) {
      log.warning(`Missing important variable: ${varName}`)
      hasWarnings = true
    } else {
      log.success(`${varName} is set`)
    }
  })

  // Validate optional variables
  log.info('\n🔧 Checking optional variables:')
  optionalVars.forEach(varName => {
    const value = process.env[varName]
    if (!value) {
      log.info(`Optional variable not set: ${varName}`)
    } else {
      log.success(`${varName} is set`)
    }
  })

  // Validate specific formats and requirements
  log.info('\n🔍 Validating formats and requirements:')
  
  // URL validation
  const urls = ['NEXTAUTH_URL', 'NEXT_PUBLIC_APP_URL', 'NEXT_PUBLIC_API_URL']
  urls.forEach(varName => {
    const value = process.env[varName]
    if (value) {
      try {
        new URL(value)
        log.success(`${varName} is a valid URL`)
      } catch {
        log.error(`${varName} is not a valid URL: ${value}`)
        hasErrors = true
      }
    }
  })

  // Secret length validation
  const secrets = ['NEXTAUTH_SECRET', 'JWT_SECRET', 'ENCRYPTION_KEY']
  secrets.forEach(varName => {
    const value = process.env[varName]
    if (value) {
      if (value.length < 32) {
        log.error(`${varName} should be at least 32 characters (current: ${value.length})`)
        hasErrors = true
      } else {
        log.success(`${varName} length is adequate (${value.length} chars)`)
      }
    }
  })

  // OpenAI API key format validation
  const openaiKey = process.env.OPENAI_API_KEY
  if (openaiKey) {
    if (openaiKey.startsWith('sk-')) {
      log.success('OPENAI_API_KEY format is correct')
    } else {
      log.error('OPENAI_API_KEY should start with "sk-"')
      hasErrors = true
    }
  }

  // Summary
  log.info('\n📊 Validation Summary:')
  if (hasErrors) {
    log.error('Environment validation failed with errors!')
    log.info('Fix the errors above and run validation again.')
    process.exit(1)
  } else if (hasWarnings) {
    log.warning('Environment validation completed with warnings.')
    log.info('Consider addressing the warnings for optimal functionality.')
    process.exit(0)
  } else {
    log.success('Environment validation passed! ✨')
    log.info('Your environment is properly configured.')
    process.exit(0)
  }
}

// Run validation
validateEnvironment() 