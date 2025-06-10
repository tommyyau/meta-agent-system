#!/usr/bin/env node

/**
 * Simplified Assumption Generation Test
 * 
 * Tests the assumption generation logic without full environment setup
 */

// Mock the OpenAI client to avoid environment issues
const mockOpenAI = {
  chat: {
    completions: {
      create: async (params) => {
        // Mock response for assumption generation
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
      }
    }
  }
}

// Mock the environment config
const mockEnv = {
  OPENAI_API_KEY: 'mock-key',
  OPENAI_MODEL_PRIMARY: 'gpt-4o-mini',
  OPENAI_MAX_TOKENS: 2000,
  OPENAI_TEMPERATURE: 0.3,
  OPENAI_RATE_LIMIT_PER_MINUTE: 60,
  OPENAI_TIMEOUT_SECONDS: 30,
  OPENAI_DAILY_QUOTA: 1000,
  OPENAI_MONTHLY_BUDGET: 500
}

// Mock modules
const Module = require('module')
const originalRequire = Module.prototype.require

Module.prototype.require = function(id) {
  if (id === '../lib/openai/client') {
    return { openai: mockOpenAI }
  }
  if (id === '../lib/config/environment') {
    return {
      env: mockEnv,
      openaiConfig: {
        apiKey: mockEnv.OPENAI_API_KEY,
        models: {
          primary: mockEnv.OPENAI_MODEL_PRIMARY,
          fallback: 'gpt-3.5-turbo'
        },
        limits: {
          maxTokens: mockEnv.OPENAI_MAX_TOKENS,
          rateLimit: mockEnv.OPENAI_RATE_LIMIT_PER_MINUTE,
          timeout: mockEnv.OPENAI_TIMEOUT_SECONDS,
          temperature: mockEnv.OPENAI_TEMPERATURE,
          dailyQuota: mockEnv.OPENAI_DAILY_QUOTA,
          monthlyBudget: mockEnv.OPENAI_MONTHLY_BUDGET
        }
      }
    }
  }
  return originalRequire.apply(this, arguments)
}

// Now we can import the TypeScript modules
const { AssumptionGenerator } = require('../lib/conversation/assumption-generator')

// Test data
const testContext = {
  sessionId: 'test-session-1',
  domain: 'fintech',
  stage: 'idea_clarity',
  userProfile: {
    role: 'technical',
    sophisticationLevel: 'expert',
    domainKnowledge: {
      experience: 'senior',
      technicalDepth: 'expert',
      businessAcumen: 'advanced',
      specificAreas: ['payments', 'compliance', 'security']
    }
  },
  conversationHistory: [
    {
      userResponse: "I'm building a regulatory reporting platform for mid-market banks",
      timestamp: new Date().toISOString(),
      stage: 'idea_clarity'
    },
    {
      userResponse: "Focus on SOC2 and PCI DSS compliance",
      timestamp: new Date().toISOString(),
      stage: 'idea_clarity'
    }
  ],
  lastUpdated: new Date().toISOString()
}

const testResponseAnalysis = {
  sophisticationScore: 0.9,
  engagementLevel: 0.8,
  clarityScore: 0.85,
  domainKnowledge: {
    technicalDepth: 'expert',
    businessAcumen: 'advanced',
    industryExperience: 'high',
    specificAreas: ['compliance', 'security', 'fintech']
  },
  advancedEscapeSignals: {
    fatigue: { detected: false, confidence: 0.1 },
    expertise: { detected: true, confidence: 0.9, suggestedSkipLevel: 'expert' },
    impatience: { detected: true, confidence: 0.8, urgencyLevel: 'high' },
    redirect: { detected: true, confidence: 0.7, requestedDestination: 'technical architecture' }
  },
  extractedEntities: ['regulatory reporting', 'mid-market banks', 'SOC2', 'PCI DSS'],
  sentiment: 'positive',
  suggestedAdaptations: ['increase technical depth', 'focus on architecture'],
  nextQuestionHints: ['Ask about specific frameworks', 'Dive into technical requirements']
}

async function testAssumptionGeneration() {
  console.log('🧪 Testing Assumption Generation (Simplified)\n')
  
  try {
    const generator = new AssumptionGenerator()
    
    console.log('📋 Test 1: Pivot Detection')
    const pivotResult = await generator.shouldPivotToAssumptions(testContext, testResponseAnalysis)
    
    console.log(`   Should Pivot: ${pivotResult.shouldPivot}`)
    console.log(`   Pivot Reason: ${pivotResult.pivotReason}`)
    console.log(`   Transition Message: "${pivotResult.transitionMessage.substring(0, 80)}..."`)
    
    if (pivotResult.shouldPivot && pivotResult.assumptionSet) {
      console.log(`   ✅ Assumptions Generated: ${pivotResult.assumptionSet.assumptions.length}`)
      console.log(`   Overall Confidence: ${pivotResult.assumptionSet.confidence}`)
      
      console.log('\n📋 Generated Assumptions:')
      pivotResult.assumptionSet.assumptions.forEach((assumption, index) => {
        console.log(`   ${index + 1}. ${assumption.title} (${assumption.category})`)
        console.log(`      Confidence: ${assumption.confidence}`)
        console.log(`      Impact: ${assumption.impact}`)
        console.log(`      Description: ${assumption.description.substring(0, 100)}...`)
      })
      
      console.log('\n✅ Test PASSED - Assumptions generated successfully!')
      return true
    } else {
      console.log('\n❌ Test FAILED - No assumptions generated')
      return false
    }
    
  } catch (error) {
    console.log(`\n❌ Test ERROR: ${error.message}`)
    console.log(`Stack: ${error.stack}`)
    return false
  }
}

async function testDirectAssumptionGeneration() {
  console.log('\n🧪 Testing Direct Assumption Generation\n')
  
  try {
    const generator = new AssumptionGenerator()
    
    const assumptions = await generator.generateAssumptions(
      testContext,
      testResponseAnalysis,
      "User requesting assumption generation"
    )
    
    console.log('📋 Direct Generation Results:')
    console.log(`   Total Assumptions: ${assumptions.assumptions.length}`)
    console.log(`   Overall Confidence: ${assumptions.confidence}`)
    console.log(`   Reasoning: ${assumptions.reasoning}`)
    
    if (assumptions.assumptions.length > 0) {
      console.log('\n✅ Direct generation PASSED!')
      return true
    } else {
      console.log('\n❌ Direct generation FAILED - No assumptions generated')
      return false
    }
    
  } catch (error) {
    console.log(`\n❌ Direct generation ERROR: ${error.message}`)
    console.log(`Stack: ${error.stack}`)
    return false
  }
}

async function main() {
  console.log('🚀 Starting Simplified Assumption Tests\n')
  
  const test1 = await testAssumptionGeneration()
  const test2 = await testDirectAssumptionGeneration()
  
  const allPassed = test1 && test2
  
  console.log('\n📊 Test Summary')
  console.log('================')
  console.log(`Pivot Detection: ${test1 ? '✅ PASSED' : '❌ FAILED'}`)
  console.log(`Direct Generation: ${test2 ? '✅ PASSED' : '❌ FAILED'}`)
  console.log(`Overall: ${allPassed ? '✅ SUCCESS' : '❌ FAILURE'}`)
  
  process.exit(allPassed ? 0 : 1)
}

if (require.main === module) {
  main()
} 