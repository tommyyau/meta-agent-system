#!/usr/bin/env node

/**
 * Assumption Test with Environment Setup
 * 
 * Sets up minimal environment variables and tests assumption generation
 */

// Set up minimal environment variables
process.env.NODE_ENV = 'development'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-assumption-testing-12345678901234567890'
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000/api'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.OPENAI_API_KEY = 'sk-test-key-replace-with-real-key'
process.env.OPENAI_MODEL_PRIMARY = 'gpt-4o-mini'
process.env.OPENAI_MODEL_FALLBACK = 'gpt-3.5-turbo'
process.env.UPSTASH_REDIS_REST_URL = 'https://test-redis.upstash.io'
process.env.UPSTASH_REDIS_REST_TOKEN = 'test-redis-token'
process.env.JWT_SECRET = 'test-jwt-secret-key-for-assumption-testing-12345678901234567890'
process.env.ENCRYPTION_KEY = 'test-encryption-key-for-assumption-testing-12345678901234567890'

// Mock the OpenAI client to avoid API calls
const mockOpenAI = {
  chat: {
    completions: {
      create: async (params) => {
        console.log('🔧 Mock OpenAI call intercepted')
        
        // Check if this is for assumption generation based on the prompt
        const prompt = params.messages[0].content
        
        if (prompt.includes('Generate intelligent assumptions')) {
          return {
            choices: [{
              message: {
                content: JSON.stringify({
                  assumptions: [
                    {
                      category: "technical_requirements",
                      title: "Cloud-based Architecture",
                      description: "The regulatory reporting platform will be built on cloud infrastructure for scalability and compliance",
                      confidence: 0.8,
                      reasoning: "Mid-market banks typically prefer cloud solutions for regulatory reporting due to compliance requirements",
                      impact: "high",
                      dependencies: [],
                      validationQuestions: ["Do you have any cloud provider preferences?", "Are there specific compliance requirements for data residency?"],
                      alternatives: ["On-premise deployment", "Hybrid cloud approach"]
                    },
                    {
                      category: "business_model",
                      title: "SaaS Subscription Model",
                      description: "The platform will operate on a subscription-based pricing model",
                      confidence: 0.7,
                      reasoning: "Most fintech solutions for mid-market banks use SaaS models for predictable revenue",
                      impact: "medium",
                      dependencies: [],
                      validationQuestions: ["What pricing model are you considering?"],
                      alternatives: ["Per-transaction pricing", "Enterprise licensing"]
                    },
                    {
                      category: "user_target",
                      title: "Compliance Officers as Primary Users",
                      description: "The primary users will be compliance officers and risk managers at mid-market banks",
                      confidence: 0.9,
                      reasoning: "Regulatory reporting platforms are typically used by compliance teams",
                      impact: "high",
                      dependencies: [],
                      validationQuestions: ["Who are the main users you're targeting?"],
                      alternatives: ["IT administrators", "Executive dashboards"]
                    }
                  ],
                  confidence: 0.8,
                  reasoning: "Based on the fintech domain and regulatory reporting focus, these assumptions align with typical mid-market banking needs",
                  missingCriticalInfo: [
                    "Specific regulatory frameworks beyond SOC2 and PCI DSS",
                    "Target bank size and geographic focus",
                    "Integration requirements with existing banking systems"
                  ],
                  recommendedNextSteps: [
                    "Validate compliance framework requirements",
                    "Define specific user personas and workflows",
                    "Identify key integration points with banking systems"
                  ]
                })
              }
            }],
            usage: {
              prompt_tokens: 500,
              completion_tokens: 300,
              total_tokens: 800
            }
          }
        } else {
          // Mock response analysis
          return {
            choices: [{
              message: {
                content: JSON.stringify({
                  sophisticationScore: 0.9,
                  engagementLevel: 0.8,
                  clarityScore: 0.85,
                  domainKnowledge: {
                    technicalDepth: 'expert',
                    businessAcumen: 'advanced',
                    industryExperience: 'high',
                    specificAreas: ['compliance', 'security', 'fintech']
                  },
                  sophisticationBreakdown: {
                    technicalLanguage: 0.9,
                    domainSpecificity: 0.8,
                    complexityHandling: 0.85,
                    businessAcumen: 0.7,
                    communicationClarity: 0.8
                  },
                  clarityMetrics: {
                    specificity: 0.8,
                    structuredThinking: 0.7,
                    completeness: 0.75,
                    relevance: 0.9,
                    actionability: 0.8
                  },
                  engagementMetrics: {
                    enthusiasm: 0.8,
                    interestLevel: 0.85,
                    participationQuality: 0.8,
                    proactiveness: 0.7,
                    collaborativeSpirit: 0.75
                  },
                  advancedEscapeSignals: {
                    fatigue: { 
                      detected: false, 
                      confidence: 0.1,
                      indicators: []
                    },
                    expertise: { 
                      detected: true, 
                      confidence: 0.9, 
                      suggestedSkipLevel: 'advanced'
                    },
                    impatience: { 
                      detected: true, 
                      confidence: 0.8, 
                      urgencyLevel: 'high'
                    },
                    confusion: {
                      detected: false,
                      confidence: 0.1,
                      supportLevel: 'clarification'
                    },
                    redirect: { 
                      detected: true, 
                      confidence: 0.7, 
                      requestedDestination: 'technical architecture'
                    }
                  },
                  adaptationRecommendations: {
                    nextQuestionComplexity: 'expert',
                    suggestedApproach: 'technical',
                    toneAdjustment: 'maintain',
                    pacingRecommendation: 'speed_up',
                    topicFocus: ['architecture', 'compliance']
                  },
                  analysisConfidence: {
                    overall: 0.85,
                    sophistication: 0.9,
                    clarity: 0.8,
                    engagement: 0.8,
                    escapeSignals: 0.85
                  },
                  escapeSignals: {
                    detected: true,
                    type: 'expert_skip',
                    confidence: 0.8,
                    indicators: ['technical expertise', 'domain knowledge']
                  },
                  extractedEntities: ['regulatory reporting', 'mid-market banks', 'SOC2', 'PCI DSS'],
                  sentiment: 'positive',
                  suggestedAdaptations: ['increase technical depth', 'focus on architecture'],
                  nextQuestionHints: ['Ask about specific frameworks', 'Dive into technical requirements']
                })
              }
            }],
            usage: {
              prompt_tokens: 300,
              completion_tokens: 200,
              total_tokens: 500
            }
          }
        }
      }
    }
  }
}

// Mock the OpenAI module
const Module = require('module')
const originalRequire = Module.prototype.require

Module.prototype.require = function(id) {
  if (id === 'openai') {
    return function OpenAI() {
      return mockOpenAI
    }
  }
  return originalRequire.apply(this, arguments)
}

// Now run the test
async function runTest() {
  console.log('🚀 Starting Assumption Test with Environment Setup\n')
  
  try {
    // Import the test after setting up mocks
    const { testAssumptionQuality } = require('./test-assumption-pivot.js')
    
    console.log('🔧 Environment and mocks set up successfully')
    console.log('📋 Running assumption quality test...\n')
    
    await testAssumptionQuality()
    
    console.log('\n✅ Test completed successfully!')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error('Stack:', error.stack)
    process.exit(1)
  }
}

runTest() 