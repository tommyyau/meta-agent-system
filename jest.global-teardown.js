// jest.global-teardown.js
module.exports = async () => {
  // Cleanup global test state
  delete global.__MOCKED_SERVICES__
  
  // Reset environment variables
  delete process.env.OPENAI_API_KEY
  delete process.env.SUPABASE_URL
  delete process.env.SUPABASE_ANON_KEY
  delete process.env.UPSTASH_REDIS_REST_URL
  delete process.env.UPSTASH_REDIS_REST_TOKEN
  
  console.log('🧹 Jest global teardown complete')
} 