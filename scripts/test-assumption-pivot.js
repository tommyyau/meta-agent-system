#!/usr/bin/env node

/**
 * Test Script: Escape Signal Detection and Assumption Pivot Logic
 * 
 * Comprehensive testing of the assumption generation system integration
 * with the dynamic conversation engine.
 */

const { DynamicConversationEngine } = require('../lib/conversation/dynamic-conversation-engine')
const { ConversationStage } = require('../lib/types/conversation')

// Test scenarios for escape signal detection
const testScenarios = [
  {
    name: "Expert Impatience - Technical Skip",
    userResponse: "Look, I know all this compliance stuff. Can we just skip to the technical architecture?",
    context: {
      sessionId: 'test-expert-1',
      domain: 'fintech',
      stage: ConversationStage.IDEA_CLARITY,
      userProfile: {
        role: 'technical',
        sophisticationLevel: 'expert',
        domainKnowledge: {
          experience: 'senior',
          technicalDepth: 'expert',
          specificAreas: ['compliance', 'architecture', 'security']
        }
      },
      conversationHistory: [],
      lastUpdated: new Date().toISOString()
    },
    expectedPivot: true,
    expectedSignalType: 'expertise'
  },
  
  {
    name: "General Impatience - Time Pressure",
    userResponse: "This is taking too long. Just show me some wireframes or something.",
    context: {
      sessionId: 'test-impatient-1',
      domain: 'healthcare',
      stage: ConversationStage.IDEA_CLARITY,
      userProfile: {
        role: 'business',
        sophisticationLevel: 'intermediate',
        domainKnowledge: {
          experience: 'moderate',
          businessAcumen: 'high'
        }
      },
      conversationHistory: [
        { userResponse: "I want to build a patient management system", timestamp: new Date().toISOString() },
        { userResponse: "For small clinics", timestamp: new Date().toISOString() },
        { userResponse: "HIPAA compliant", timestamp: new Date().toISOString() }
      ],
      lastUpdated: new Date().toISOString()
    },
    expectedPivot: true,
    expectedSignalType: 'impatience'
  },
  
  {
    name: "Conversation Fatigue - Low Engagement",
    userResponse: "I don't know... whatever you think is best I guess.",
    context: {
      sessionId: 'test-fatigue-1',
      domain: 'general',
      stage: ConversationStage.IDEA_CLARITY,
      userProfile: {
        role: 'founder',
        sophisticationLevel: 'novice',
        engagementPattern: 'disengaged'
      },
      conversationHistory: Array(8).fill(null).map((_, i) => ({
        userResponse: `Response ${i + 1}`,
        timestamp: new Date().toISOString(),
        stage: ConversationStage.IDEA_CLARITY
      })),
      lastUpdated: new Date().toISOString()
    },
    expectedPivot: true,
    expectedSignalType: 'fatigue'
  },
  
  {
    name: "Direct Redirect Request",
    userResponse: "Can you just generate some assumptions and show me the wireframes?",
    context: {
      sessionId: 'test-redirect-1',
      domain: 'saas',
      stage: ConversationStage.IDEA_CLARITY,
      userProfile: {
        role: 'hybrid',
        sophisticationLevel: 'advanced',
        domainKnowledge: {
          experience: 'senior',
          technicalDepth: 'advanced',
          businessAcumen: 'expert'
        }
      },
      conversationHistory: [
        { userResponse: "B2B SaaS for project management", timestamp: new Date().toISOString() }
      ],
      lastUpdated: new Date().toISOString()
    },
    expectedPivot: true,
    expectedSignalType: 'redirect'
  },
  
  {
    name: "Normal Engaged Response - No Pivot",
    userResponse: "We need to focus on SOC2 compliance and PCI DSS for payment processing. Our target users are mid-market banks.",
    context: {
      sessionId: 'test-normal-1',
      domain: 'fintech',
      stage: ConversationStage.IDEA_CLARITY,
      userProfile: {
        role: 'technical',
        sophisticationLevel: 'advanced',
        domainKnowledge: {
          experience: 'senior',
          technicalDepth: 'expert',
          specificAreas: ['payments', 'compliance']
        },
        engagementPattern: 'highly-engaged'
      },
      conversationHistory: [
        { userResponse: "Building a regulatory reporting platform", timestamp: new Date().toISOString() }
      ],
      lastUpdated: new Date().toISOString()
    },
    expectedPivot: false,
    expectedSignalType: null
  }
]

async function runAssumptionPivotTests() {
  console.log('🧪 Testing Escape Signal Detection and Assumption Pivot Logic\n')
  
  const engine = new DynamicConversationEngine()
  const results = []
  
  for (const scenario of testScenarios) {
    console.log(`📋 Testing: ${scenario.name}`)
    console.log(`   Input: "${scenario.userResponse.substring(0, 60)}${scenario.userResponse.length > 60 ? '...' : ''}"`)
    
    try {
      // Analyze the user response
      const responseAnalysis = await engine.analyzeResponse(scenario.userResponse, scenario.context)
      
      // Check for assumption pivot
      const pivotResult = await engine.checkAndHandleAssumptionPivot(scenario.context, responseAnalysis)
      
      // Validate results
      const testPassed = pivotResult.shouldPivot === scenario.expectedPivot
      const signalDetected = responseAnalysis.advancedEscapeSignals
      
      console.log(`   Expected Pivot: ${scenario.expectedPivot}`)
      console.log(`   Actual Pivot: ${pivotResult.shouldPivot}`)
      console.log(`   Pivot Reason: ${pivotResult.pivotReason}`)
      
      if (pivotResult.shouldPivot) {
        console.log(`   Transition Message: "${pivotResult.transitionMessage.substring(0, 80)}..."`)
        console.log(`   User Options: ${Object.keys(pivotResult.userOptions).join(', ')}`)
        
        if (pivotResult.assumptionSet) {
          console.log(`   Generated Assumptions: ${pivotResult.assumptionSet.assumptions.length}`)
          console.log(`   Assumption Confidence: ${pivotResult.assumptionSet.confidence}`)
        }
      }
      
      console.log(`   ✅ Test ${testPassed ? 'PASSED' : 'FAILED'}\n`)
      
      results.push({
        scenario: scenario.name,
        passed: testPassed,
        expectedPivot: scenario.expectedPivot,
        actualPivot: pivotResult.shouldPivot,
        pivotReason: pivotResult.pivotReason,
        escapeSignals: signalDetected,
        assumptionCount: pivotResult.assumptionSet?.assumptions.length || 0
      })
      
    } catch (error) {
      console.log(`   ❌ Test ERROR: ${error.message}\n`)
      results.push({
        scenario: scenario.name,
        passed: false,
        error: error.message
      })
    }
  }
  
  // Summary
  const passedTests = results.filter(r => r.passed).length
  const totalTests = results.length
  
  console.log('📊 Test Summary')
  console.log('================')
  console.log(`Total Tests: ${totalTests}`)
  console.log(`Passed: ${passedTests}`)
  console.log(`Failed: ${totalTests - passedTests}`)
  console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%\n`)
  
  // Detailed results
  console.log('📋 Detailed Results')
  console.log('===================')
  results.forEach(result => {
    console.log(`${result.passed ? '✅' : '❌'} ${result.scenario}`)
    if (result.error) {
      console.log(`   Error: ${result.error}`)
    } else {
      console.log(`   Expected: ${result.expectedPivot}, Got: ${result.actualPivot}`)
      if (result.pivotReason) {
        console.log(`   Reason: ${result.pivotReason}`)
      }
      if (result.assumptionCount > 0) {
        console.log(`   Assumptions Generated: ${result.assumptionCount}`)
      }
    }
    console.log()
  })
  
  return results
}

// Test assumption generation quality
async function testAssumptionQuality() {
  console.log('🎯 Testing Assumption Generation Quality\n')
  
  const engine = new DynamicConversationEngine()
  
  const testContext = {
    sessionId: 'quality-test-1',
    domain: 'fintech',
    stage: ConversationStage.IDEA_CLARITY,
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
        stage: ConversationStage.IDEA_CLARITY
      },
      {
        userResponse: "Focus on SOC2 and PCI DSS compliance",
        timestamp: new Date().toISOString(),
        stage: ConversationStage.IDEA_CLARITY
      }
    ],
    lastUpdated: new Date().toISOString()
  }
  
  try {
    const responseAnalysis = await engine.analyzeResponse(
      "Just generate some smart assumptions and let's move forward",
      testContext
    )
    
    const assumptions = await engine.generateAssumptions(
      testContext,
      responseAnalysis,
      "User requesting assumption generation"
    )
    
    console.log('Generated Assumptions:')
    console.log('=====================')
    console.log(`Total Assumptions: ${assumptions.assumptions.length}`)
    console.log(`Overall Confidence: ${assumptions.confidence}`)
    console.log(`Reasoning: ${assumptions.reasoning}\n`)
    
    assumptions.assumptions.forEach((assumption, index) => {
      console.log(`${index + 1}. ${assumption.title}`)
      console.log(`   Category: ${assumption.category}`)
      console.log(`   Description: ${assumption.description}`)
      console.log(`   Confidence: ${assumption.confidence}`)
      console.log(`   Impact: ${assumption.impact}`)
      console.log(`   Reasoning: ${assumption.reasoning}`)
      if (assumption.validationQuestions.length > 0) {
        console.log(`   Validation Questions: ${assumption.validationQuestions.join(', ')}`)
      }
      console.log()
    })
    
    if (assumptions.missingCriticalInfo.length > 0) {
      console.log('Missing Critical Information:')
      assumptions.missingCriticalInfo.forEach(info => console.log(`- ${info}`))
      console.log()
    }
    
    if (assumptions.recommendedNextSteps.length > 0) {
      console.log('Recommended Next Steps:')
      assumptions.recommendedNextSteps.forEach(step => console.log(`- ${step}`))
      console.log()
    }
    
  } catch (error) {
    console.log(`❌ Assumption Quality Test Failed: ${error.message}`)
  }
}

// Main execution
async function main() {
  try {
    console.log('🚀 Starting Assumption Pivot Logic Tests\n')
    
    // Test pivot detection
    const pivotResults = await runAssumptionPivotTests()
    
    // Test assumption quality
    await testAssumptionQuality()
    
    console.log('✅ All tests completed!')
    
    // Exit with appropriate code
    const allPassed = pivotResults.every(r => r.passed)
    process.exit(allPassed ? 0 : 1)
    
  } catch (error) {
    console.error('❌ Test execution failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

module.exports = {
  runAssumptionPivotTests,
  testAssumptionQuality,
  testScenarios
} 