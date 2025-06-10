#!/usr/bin/env node

/**
 * Full Conversation Flow Integration Tests
 * 
 * Tests all generative AI conversations:
 * 1. Response Analysis (EnhancedResponseAnalyzer)
 * 2. Question Generation (DynamicConversationEngine)
 * 3. Assumption Generation (AssumptionGenerator)
 * 4. End-to-end conversation flow
 */

// Set up environment variables
process.env.NODE_ENV = 'development'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-conversation-testing-12345678901234567890'
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000/api'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.UPSTASH_REDIS_REST_URL = 'https://test-redis.upstash.io'
process.env.UPSTASH_REDIS_REST_TOKEN = 'test-redis-token'
process.env.JWT_SECRET = 'test-jwt-secret-key-for-conversation-testing-12345678901234567890'
process.env.ENCRYPTION_KEY = 'test-encryption-key-for-conversation-testing-12345678901234567890'

// You need to set a real OpenAI API key here
if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-test-key') {
  console.log('⚠️  Warning: No real OpenAI API key found. Set OPENAI_API_KEY environment variable.')
  console.log('   Using mock responses for testing...\n')
  process.env.OPENAI_API_KEY = 'sk-test-key'
}

process.env.OPENAI_MODEL_PRIMARY = 'gpt-4o-mini'
process.env.OPENAI_MODEL_FALLBACK = 'gpt-3.5-turbo'

console.log('🚀 Starting Full Conversation Flow Tests\n')

// Simple test to verify the conversation logic works
async function testConversationLogic() {
  console.log('📋 Testing Conversation Logic Components\n')
  
  // Test 1: Basic imports and initialization
  console.log('1. Testing module imports...')
  try {
    const { DynamicConversationEngine } = require('../lib/conversation/dynamic-conversation-engine')
    const { EnhancedResponseAnalyzer } = require('../lib/conversation/response-analyzer')
    const { AssumptionGenerator } = require('../lib/conversation/assumption-generator')
    const { ConversationStage } = require('../lib/types/conversation')
    
    console.log('   ✅ All modules imported successfully')
    
    // Test 2: Initialize components
    console.log('2. Testing component initialization...')
    const engine = new DynamicConversationEngine()
    const analyzer = new EnhancedResponseAnalyzer()
    const assumptionGenerator = new AssumptionGenerator()
    
    console.log('   ✅ All components initialized successfully')
    
    // Test 3: Test basic conversation context
    console.log('3. Testing conversation context creation...')
    const testContext = {
      sessionId: 'test-session-1',
      domain: 'fintech',
      stage: ConversationStage.IDEA_CLARITY,
      userProfile: {
        role: 'technical',
        sophisticationLevel: 'expert',
        domainKnowledge: {
          experience: 'senior',
          technicalDepth: 'expert',
          businessAcumen: 'advanced',
          specificAreas: ['compliance', 'security', 'payments']
        }
      },
      conversationHistory: [],
      lastUpdated: new Date().toISOString()
    }
    
    console.log('   ✅ Conversation context created successfully')
    
    // Test 4: Test response analysis
    console.log('4. Testing response analysis...')
    const userResponse = "I'm building a regulatory reporting platform for mid-market banks"
    
    try {
      const analysis = await analyzer.analyzeResponse(userResponse, testContext)
      
      console.log(`   📊 Analysis Results:`)
      console.log(`      Sophistication: ${analysis.sophisticationScore.toFixed(2)}`)
      console.log(`      Engagement: ${analysis.engagementLevel.toFixed(2)}`)
      console.log(`      Clarity: ${analysis.clarityScore.toFixed(2)}`)
      console.log(`      Escape Signals Detected: ${analysis.advancedEscapeSignals.expertise.detected}`)
      console.log('   ✅ Response analysis completed successfully')
      
      // Test 5: Test question generation
      console.log('5. Testing question generation...')
      try {
        const questionResult = await engine.generateAdaptiveQuestion(testContext, analysis)
        
        console.log(`   ❓ Generated Question: "${questionResult.question.substring(0, 80)}..."`)
        console.log(`   📝 Question Type: ${questionResult.questionType}`)
        console.log(`   🎯 Sophistication Level: ${questionResult.sophisticationLevel}`)
        console.log(`   📈 Confidence: ${questionResult.confidence}`)
        console.log('   ✅ Question generation completed successfully')
        
        // Test 6: Test assumption generation
        console.log('6. Testing assumption generation...')
        try {
          // Test with explicit assumption request
          const assumptionResponse = "Just generate some smart assumptions and let's move forward"
          const assumptionAnalysis = await analyzer.analyzeResponse(assumptionResponse, testContext)
          
          const pivotResult = await assumptionGenerator.shouldPivotToAssumptions(testContext, assumptionAnalysis)
          
          console.log(`   🔄 Should Pivot: ${pivotResult.shouldPivot}`)
          console.log(`   📝 Pivot Reason: ${pivotResult.pivotReason}`)
          
          if (pivotResult.shouldPivot && pivotResult.assumptionSet) {
            console.log(`   🎯 Generated ${pivotResult.assumptionSet.assumptions.length} assumptions`)
            console.log(`   📊 Confidence: ${pivotResult.assumptionSet.confidence}`)
            
            if (pivotResult.assumptionSet.assumptions.length > 0) {
              console.log(`   📋 Sample Assumption: "${pivotResult.assumptionSet.assumptions[0].title}"`)
            }
            console.log('   ✅ Assumption generation completed successfully')
          } else {
            console.log('   ⚠️  No assumptions generated - testing fallback...')
            
            // Test direct assumption generation
            const directAssumptions = await assumptionGenerator.generateAssumptions(
              testContext, 
              assumptionAnalysis, 
              'Direct test request'
            )
            
            console.log(`   🎯 Fallback generated ${directAssumptions.assumptions.length} assumptions`)
            console.log(`   📊 Fallback confidence: ${directAssumptions.confidence}`)
            console.log('   ✅ Fallback assumption generation completed successfully')
          }
          
        } catch (assumptionError) {
          console.log(`   ❌ Assumption generation failed: ${assumptionError.message}`)
          return false
        }
        
      } catch (questionError) {
        console.log(`   ❌ Question generation failed: ${questionError.message}`)
        return false
      }
      
    } catch (analysisError) {
      console.log(`   ❌ Response analysis failed: ${analysisError.message}`)
      return false
    }
    
    console.log('\n🎉 All conversation components working successfully!')
    return true
    
  } catch (importError) {
    console.log(`   ❌ Module import failed: ${importError.message}`)
    return false
  }
}

// Test different conversation scenarios
async function testConversationScenarios() {
  console.log('\n📋 Testing Different Conversation Scenarios\n')
  
  const scenarios = [
    {
      name: "Fintech Expert",
      domain: 'fintech',
      userLevel: 'expert',
      response: "Building a regulatory reporting platform with SOC2 compliance for mid-market banks"
    },
    {
      name: "Healthcare Novice", 
      domain: 'healthcare',
      userLevel: 'novice',
      response: "I want to build something for managing patients in my clinic"
    },
    {
      name: "SaaS Intermediate",
      domain: 'saas', 
      userLevel: 'intermediate',
      response: "Building a B2B project management tool with team collaboration features"
    },
    {
      name: "Assumption Request",
      domain: 'fintech',
      userLevel: 'expert', 
      response: "Just generate some assumptions and show me wireframes"
    }
  ]
  
  let passedScenarios = 0
  
  for (const scenario of scenarios) {
    console.log(`Testing: ${scenario.name}`)
    
    try {
      const { DynamicConversationEngine } = require('../lib/conversation/dynamic-conversation-engine')
      const { EnhancedResponseAnalyzer } = require('../lib/conversation/response-analyzer')
      const { AssumptionGenerator } = require('../lib/conversation/assumption-generator')
      const { ConversationStage } = require('../lib/types/conversation')
      
      const engine = new DynamicConversationEngine()
      const analyzer = new EnhancedResponseAnalyzer()
      const assumptionGenerator = new AssumptionGenerator()
      
      const context = {
        sessionId: `test-${scenario.name.toLowerCase().replace(' ', '-')}`,
        domain: scenario.domain,
        stage: ConversationStage.IDEA_CLARITY,
        userProfile: {
          role: 'technical',
          sophisticationLevel: scenario.userLevel,
          domainKnowledge: {
            experience: scenario.userLevel === 'expert' ? 'senior' : 'moderate',
            technicalDepth: scenario.userLevel,
            businessAcumen: 'intermediate'
          }
        },
        conversationHistory: [],
        lastUpdated: new Date().toISOString()
      }
      
      // Test response analysis
      const analysis = await analyzer.analyzeResponse(scenario.response, context)
      console.log(`   Analysis - Sophistication: ${analysis.sophisticationScore.toFixed(2)}, Engagement: ${analysis.engagementLevel.toFixed(2)}`)
      
      // Test question generation
      const questionResult = await engine.generateAdaptiveQuestion(context, analysis)
      console.log(`   Question: "${questionResult.question.substring(0, 60)}..."`)
      
      // Test assumption generation if it's an assumption request
      if (scenario.response.toLowerCase().includes('assumption') || scenario.response.toLowerCase().includes('wireframe')) {
        const pivotResult = await assumptionGenerator.shouldPivotToAssumptions(context, analysis)
        console.log(`   Assumption Pivot: ${pivotResult.shouldPivot} (${pivotResult.pivotReason})`)
        
        if (pivotResult.shouldPivot && pivotResult.assumptionSet) {
          console.log(`   Generated ${pivotResult.assumptionSet.assumptions.length} assumptions`)
        }
      }
      
      console.log(`   ✅ ${scenario.name} scenario PASSED\n`)
      passedScenarios++
      
    } catch (error) {
      console.log(`   ❌ ${scenario.name} scenario FAILED: ${error.message}\n`)
    }
  }
  
  console.log(`📊 Scenario Results: ${passedScenarios}/${scenarios.length} passed`)
  return passedScenarios === scenarios.length
}

// Main test execution
async function main() {
  try {
    console.log('Testing all generative AI conversation components...\n')
    
    const basicTest = await testConversationLogic()
    const scenarioTest = await testConversationScenarios()
    
    const allPassed = basicTest && scenarioTest
    
    console.log('\n' + '='.repeat(60))
    console.log('📊 FULL CONVERSATION TEST SUMMARY')
    console.log('='.repeat(60))
    console.log(`Basic Components: ${basicTest ? '✅ PASSED' : '❌ FAILED'}`)
    console.log(`Scenario Tests: ${scenarioTest ? '✅ PASSED' : '❌ FAILED'}`)
    console.log(`Overall: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`)
    
    if (allPassed) {
      console.log('\n🎉 ALL GENERATIVE AI CONVERSATIONS ARE WORKING!')
      console.log('✅ Response Analysis')
      console.log('✅ Question Generation') 
      console.log('✅ Assumption Generation')
      console.log('✅ End-to-end Conversation Flow')
    } else {
      console.log('\n⚠️  Some conversation components need attention.')
    }
    
    console.log('='.repeat(60))
    
    process.exit(allPassed ? 0 : 1)
    
  } catch (error) {
    console.error('❌ Test execution failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
} 