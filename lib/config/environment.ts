import { z } from 'zod'

// Environment validation schema
const environmentSchema = z.object({
  // Node.js Environment
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  DEBUG: z.string().transform(val => val === 'true').default('false'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // Next.js Configuration
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_API_URL: z.string().url(),

  // Database Configuration
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_JWT_SECRET: z.string().optional(),

  // MongoDB Configuration
  MONGODB_URI: z.string().optional(),
  MONGODB_DB_NAME: z.string().default('meta-agent-analytics'),

  // OpenAI Configuration
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_ORG_ID: z.string().optional(),
  OPENAI_MODEL_PRIMARY: z.string().default('gpt-4o-mini'),
  OPENAI_MODEL_FALLBACK: z.string().default('gpt-3.5-turbo'),
  OPENAI_MAX_TOKENS: z.string().transform(Number).default('4000'),
  OPENAI_RATE_LIMIT_PER_MINUTE: z.string().transform(Number).default('60'),
  OPENAI_TIMEOUT_SECONDS: z.string().transform(Number).default('30'),
  OPENAI_TEMPERATURE: z.string().transform(Number).default('0.7'),

  // Redis Configuration
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  REDIS_SESSION_TTL: z.string().transform(Number).default('86400'),
  REDIS_CACHE_TTL: z.string().transform(Number).default('3600'),

  // Security Configuration
  JWT_SECRET: z.string().min(32),
  ENCRYPTION_KEY: z.string().min(32),
  WEBHOOK_SECRET: z.string().optional(),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),

  // Monitoring Configuration
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),

  // Email Configuration
  RESEND_API_KEY: z.string().optional(),
  FROM_EMAIL: z.string().email().optional(),
  ADMIN_EMAIL: z.string().email().optional(),

  // Rate Limiting
  RATE_LIMIT_REQUESTS_PER_MINUTE: z.string().transform(Number).default('100'),
  RATE_LIMIT_REQUESTS_PER_HOUR: z.string().transform(Number).default('1000'),
  RATE_LIMIT_REQUESTS_PER_DAY: z.string().transform(Number).default('10000'),
  OPENAI_DAILY_QUOTA: z.string().transform(Number).default('1000'),
  OPENAI_MONTHLY_BUDGET: z.string().transform(Number).default('500'),

  // Feature Flags
  ENABLE_ANALYTICS: z.string().transform(val => val === 'true').default('true'),
  ENABLE_ESCAPE_HATCH: z.string().transform(val => val === 'true').default('true'),
  ENABLE_ASSUMPTION_CASCADE: z.string().transform(val => val === 'true').default('true'),
  ENABLE_ADVANCED_PROFILING: z.string().transform(val => val === 'true').default('false'),
  ENABLE_WIREFRAME_GENERATION: z.string().transform(val => val === 'true').default('true'),
  ENABLE_DEBUG_MODE: z.string().transform(val => val === 'true').default('false'),
  ENABLE_EXPERIMENTAL_FEATURES: z.string().transform(val => val === 'true').default('false'),

  // Development Tools
  ENABLE_QUERY_LOGGING: z.string().transform(val => val === 'true').default('false'),
  ENABLE_API_LOGGING: z.string().transform(val => val === 'true').default('true'),
  ENABLE_PERFORMANCE_MONITORING: z.string().transform(val => val === 'true').default('true'),

  // Optional External Integrations
  ANTHROPIC_API_KEY: z.string().optional(),
  COHERE_API_KEY: z.string().optional(),
  FIGMA_API_TOKEN: z.string().optional(),
  MIRO_API_TOKEN: z.string().optional(),
  SLACK_WEBHOOK_URL: z.string().url().optional(),
  DISCORD_WEBHOOK_URL: z.string().url().optional(),

  // Testing Configuration
  TEST_DATABASE_URL: z.string().optional(),
  TEST_REDIS_URL: z.string().optional(),
})

// Validate environment variables
const validateEnvironment = () => {
  try {
    return environmentSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join('\n')
      throw new Error(`Environment validation failed:\n${missingVars}`)
    }
    throw error
  }
}

// Type-safe environment configuration
export type Environment = z.infer<typeof environmentSchema>

// Validated environment variables
export const env: Environment = validateEnvironment()

// Environment utilities
export const isProduction = env.NODE_ENV === 'production'
export const isDevelopment = env.NODE_ENV === 'development'
export const isStaging = env.NODE_ENV === 'staging'

// Configuration objects for different services
export const databaseConfig = {
  supabase: {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    jwtSecret: env.SUPABASE_JWT_SECRET,
  },
  mongodb: {
    uri: env.MONGODB_URI,
    dbName: env.MONGODB_DB_NAME,
  },
}

export const openaiConfig = {
  apiKey: env.OPENAI_API_KEY,
  orgId: env.OPENAI_ORG_ID,
  models: {
    primary: env.OPENAI_MODEL_PRIMARY,
    fallback: env.OPENAI_MODEL_FALLBACK,
  },
  limits: {
    maxTokens: env.OPENAI_MAX_TOKENS,
    rateLimit: env.OPENAI_RATE_LIMIT_PER_MINUTE,
    timeout: env.OPENAI_TIMEOUT_SECONDS,
    temperature: env.OPENAI_TEMPERATURE,
    dailyQuota: env.OPENAI_DAILY_QUOTA,
    monthlyBudget: env.OPENAI_MONTHLY_BUDGET,
  },
}

export const redisConfig = {
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
  ttl: {
    session: env.REDIS_SESSION_TTL,
    cache: env.REDIS_CACHE_TTL,
  },
}

export const securityConfig = {
  jwtSecret: env.JWT_SECRET,
  encryptionKey: env.ENCRYPTION_KEY,
  webhookSecret: env.WEBHOOK_SECRET,
  corsOrigins: env.CORS_ORIGINS.split(',').map(origin => origin.trim()),
}

export const rateLimitConfig = {
  requestsPerMinute: env.RATE_LIMIT_REQUESTS_PER_MINUTE,
  requestsPerHour: env.RATE_LIMIT_REQUESTS_PER_HOUR,
  requestsPerDay: env.RATE_LIMIT_REQUESTS_PER_DAY,
}

export const featureFlags = {
  analytics: env.ENABLE_ANALYTICS,
  escapeHatch: env.ENABLE_ESCAPE_HATCH,
  assumptionCascade: env.ENABLE_ASSUMPTION_CASCADE,
  advancedProfiling: env.ENABLE_ADVANCED_PROFILING,
  wireframeGeneration: env.ENABLE_WIREFRAME_GENERATION,
  debugMode: env.ENABLE_DEBUG_MODE,
  experimentalFeatures: env.ENABLE_EXPERIMENTAL_FEATURES,
}

export const monitoringConfig = {
  sentry: {
    dsn: env.SENTRY_DSN,
    org: env.SENTRY_ORG,
    project: env.SENTRY_PROJECT,
    environment: env.SENTRY_ENVIRONMENT || env.NODE_ENV,
  },
  logging: {
    level: env.LOG_LEVEL,
    enableQueryLogging: env.ENABLE_QUERY_LOGGING,
    enableApiLogging: env.ENABLE_API_LOGGING,
    enablePerformanceMonitoring: env.ENABLE_PERFORMANCE_MONITORING,
  },
}

export const emailConfig = {
  resendApiKey: env.RESEND_API_KEY,
  fromEmail: env.FROM_EMAIL,
  adminEmail: env.ADMIN_EMAIL,
}

// Validate critical environment variables are present
export const validateCriticalEnvVars = () => {
  const critical = {
    OPENAI_API_KEY: env.OPENAI_API_KEY,
    NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    UPSTASH_REDIS_REST_URL: env.UPSTASH_REDIS_REST_URL,
    NEXTAUTH_SECRET: env.NEXTAUTH_SECRET,
    JWT_SECRET: env.JWT_SECRET,
  }

  const missing = Object.entries(critical)
    .filter(([_, value]) => !value)
    .map(([key]) => key)

  if (missing.length > 0) {
    throw new Error(`Critical environment variables missing: ${missing.join(', ')}`)
  }
}

// Auto-validate on import
validateCriticalEnvVars() 