// jest.global-setup.js
module.exports = async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test'
  process.env.OPENAI_API_KEY = 'test-api-key'
  process.env.SUPABASE_URL = 'http://localhost:54321'
  process.env.SUPABASE_ANON_KEY = 'test-anon-key'
  process.env.UPSTASH_REDIS_REST_URL = 'http://localhost:8079'
  process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token'
  
  // Mock external services
  global.__MOCKED_SERVICES__ = {
    openai: true,
    supabase: true,
    redis: true,
    sentry: true,
  }
  
  console.log('🧪 Jest global setup complete')
} 