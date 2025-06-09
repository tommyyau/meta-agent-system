#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Load environment variables from .env.local
const envLocalPath = path.join(process.cwd(), '.env.local')
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

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m',
}

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`),
}

async function testOpenAI() {
  log.title('🤖 OpenAI Integration Test')
  
  // Check if API key is configured
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    log.error('OPENAI_API_KEY not found in environment variables')
    log.info('Run: npm run setup:env to configure your environment')
    process.exit(1)
  }
  
  if (!apiKey.startsWith('sk-')) {
    log.error('OPENAI_API_KEY format is invalid (should start with "sk-")')
    process.exit(1)
  }
  
  log.success('OpenAI API key found and format is valid')
  
  // Test API connection
  log.info('Testing OpenAI API connection...')
  
  try {
    const OpenAI = require('openai')
    
    const openai = new OpenAI({
      apiKey: apiKey,
      timeout: 10000, // 10 second timeout
    })
    
    // Make a simple test request
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL_FALLBACK || 'gpt-3.5-turbo',
      messages: [
        { role: 'user', content: 'Say "OpenAI integration test successful"' }
      ],
      max_tokens: 20,
      temperature: 0,
    })
    
    const content = response.choices[0]?.message?.content?.trim()
    
    log.success('OpenAI API connection successful!')
    log.info(`Response: ${content}`)
    log.info(`Model used: ${response.model}`)
    log.info(`Tokens used: ${response.usage?.total_tokens || 'unknown'}`)
    
    // Test configuration
    log.title('📋 Configuration Test')
    log.info(`Primary model: ${process.env.OPENAI_MODEL_PRIMARY || 'gpt-4'}`)
    log.info(`Fallback model: ${process.env.OPENAI_MODEL_FALLBACK || 'gpt-3.5-turbo'}`)
    log.info(`Rate limit: ${process.env.OPENAI_RATE_LIMIT_PER_MINUTE || '60'} requests/minute`)
    log.info(`Daily quota: ${process.env.OPENAI_DAILY_QUOTA || '1000'} requests/day`)
    log.info(`Monthly budget: $${process.env.OPENAI_MONTHLY_BUDGET || '500'}`)
    
    if (process.env.OPENAI_ORG_ID) {
      log.success(`Organization ID configured: ${process.env.OPENAI_ORG_ID}`)
    } else {
      log.info('Organization ID not configured (optional)')
    }
    
    log.title('🎉 Test Complete')
    log.success('OpenAI integration is working correctly!')
    log.info('You can now start the development server with: npm run dev')
    
  } catch (error) {
    log.error('OpenAI API test failed!')
    
    if (error.status === 401) {
      log.error('Invalid API key - check your OPENAI_API_KEY')
      log.info('Get a new API key from: https://platform.openai.com/api-keys')
    } else if (error.status === 403) {
      log.error('Insufficient permissions - check your API key permissions')
    } else if (error.status === 429) {
      log.error('Rate limit exceeded - try again later')
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      log.error('Network connection failed - check your internet connection')
    } else {
      log.error(`Error: ${error.message}`)
      if (error.status) {
        log.error(`Status: ${error.status}`)
      }
    }
    
    console.log('\nFull error details:')
    console.error(error)
    process.exit(1)
  }
}

// Run the test
testOpenAI().catch((error) => {
  log.error(`Unexpected error: ${error.message}`)
  console.error(error)
  process.exit(1)
}) 