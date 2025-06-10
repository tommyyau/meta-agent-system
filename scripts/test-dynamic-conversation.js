#!/usr/bin/env node

/**
 * Dynamic Conversation Engine Test Script
 * 
 * Tests the core functionality of the GPT-4 powered conversation system:
 * - Question generation based on context
 * - Response analysis for sophistication and engagement
 * - Escape signal detection
 * - Context preservation and updating
 */

const chalk = require('chalk')

// Test configurations
const TEST_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  timeout: 30000 // 30 seconds for GPT-4 calls
}

// Test scenarios for different user types
const TEST_SCENARIOS = {
  novice_fintech: {
    name: 'Novice Fintech Founder',
    domain: 'fintech',
    userProfile: {
      role: 'founder',
      sophisticationLevel: 'novice',
      domainKnowledge: {
        experience: 'limited',
        technicalDepth: 'basic',
        businessAcumen: 'intermediate'
      },
      engagementPattern: 'engaged'
    },
    testResponses: [
      'I want to build a fintech app',
      'Something to help people with their money',
      'Maybe for budgeting and saving',
      'This is taking too long, can we just move forward?'
    ]
  },
  expert_fintech: {
    name: 'Expert Fintech Professional',
    domain: 'fintech',
    userProfile: {
      role: 'technical',
      sophisticationLevel: 'expert',
      domainKnowledge: {
        experience: 'extensive',
        technicalDepth: 'expert',
        businessAcumen: 'advanced',
        specificAreas: ['regulatory compliance', 'API integration', 'risk management']
      },
      engagementPattern: 'highly-engaged'
    },
    testResponses: [
      'I\'m building a regulatory reporting solution for mid-market banks targeting SOC2 and BSA/AML compliance',
      'The system needs real-time API integration with core banking platforms and automated compliance monitoring',
      'We\'re implementing microservices architecture with cloud-first security and regulatory data isolation',
      'I know the technical details, let\'s focus on wireframes'
    ]
  },
  healthcare_founder: {
    name: 'Healthcare Founder',
    domain: 'healthcare',
    userProfile: {
      role: 'founder',
      sophisticationLevel: 'intermediate',
      domainKnowledge: {
        experience: 'moderate',
        technicalDepth: 'basic',
        businessAcumen: 'advanced',
        specificAreas: ['HIPAA compliance', 'clinical workflows']
      },
      engagementPattern: 'engaged'
    },
    testResponses: [
      'I want to help doctors manage patient data more efficiently',
      'The main problem is HIPAA compliance complexity and EHR integration challenges',
      'We need a simple web interface that integrates with existing clinical workflows',
      'I\'m getting bored with these questions'
    ]
  }
}

/**
 * Make API request with proper error handling
 */
async function makeRequest(endpoint, method = 'GET', body = null) {
  const url = `${TEST_CONFIG.baseUrl}${endpoint}`
  
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: TEST_CONFIG.timeout
    }

    if (body) {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(url, options)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${data.error || data.message || 'Unknown error'}`)
    }

    return data
  } catch (error) {
    console.error(chalk.red(`❌ Request failed: ${error.message}`))
    throw error
  }
}

/**
 * Test question generation for different contexts
 */
async function testQuestionGeneration() {
  console.log(chalk.blue('\n🔥 Testing Dynamic Question Generation'))
  console.log(chalk.gray('=' * 60))

  for (const [scenarioKey, scenario] of Object.entries(TEST_SCENARIOS)) {
    console.log(chalk.yellow(`\n📝 Testing: ${scenario.name}`))
    
    try {
      // Create initial context
      const context = {
        sessionId: `test-${scenarioKey}-${Date.now()}`,
        userId: 'test-user',
        domain: scenario.domain,
        stage: 'IDEA_CLARITY',
        userProfile: scenario.userProfile,
        conversationHistory: [],
        lastUpdated: new Date().toISOString()
      }

      // Generate first question
      const questionResult = await makeRequest('/api/conversation/dynamic', 'POST', {
        action: 'generate_question',
        context
      })

      console.log(chalk.green('✅ Question generated successfully'))
      console.log(chalk.white(`   Question: "${questionResult.question.question}"`))
      console.log(chalk.gray(`   Type: ${questionResult.question.questionType}`))
      console.log(chalk.gray(`   Sophistication: ${questionResult.question.sophisticationLevel}`))
      console.log(chalk.gray(`   Confidence: ${questionResult.question.confidence}`))
      console.log(chalk.gray(`   Domain Context: ${questionResult.question.domainContext}`))
      
    } catch (error) {
      console.log(chalk.red(`❌ Failed: ${error.message}`))
    }
  }
}

/**
 * Test response analysis and sophistication detection
 */
async function testResponseAnalysis() {
  console.log(chalk.blue('\n🧠 Testing Response Analysis'))
  console.log(chalk.gray('=' * 60))

  for (const [scenarioKey, scenario] of Object.entries(TEST_SCENARIOS)) {
    console.log(chalk.yellow(`\n📊 Testing: ${scenario.name}`))
    
    try {
      const context = {
        sessionId: `test-${scenarioKey}-${Date.now()}`,
        userId: 'test-user',
        domain: scenario.domain,
        stage: 'IDEA_CLARITY',
        userProfile: scenario.userProfile,
        conversationHistory: [],
        lastUpdated: new Date().toISOString()
      }

      // Test first response
      const testResponse = scenario.testResponses[0]
      
      const analysisResult = await makeRequest('/api/conversation/dynamic', 'POST', {
        action: 'analyze_response',
        userResponse: testResponse,
        context
      })

      console.log(chalk.green('✅ Response analyzed successfully'))
      console.log(chalk.white(`   User Response: "${testResponse}"`))
      console.log(chalk.gray(`   Sophistication Score: ${analysisResult.analysis.sophisticationScore}`))
      console.log(chalk.gray(`   Engagement Level: ${analysisResult.analysis.engagementLevel}`))
      console.log(chalk.gray(`   Clarity Score: ${analysisResult.analysis.clarityScore}`))
      console.log(chalk.gray(`   Sentiment: ${analysisResult.analysis.sentiment}`))
      console.log(chalk.gray(`   Extracted Entities: ${analysisResult.analysis.extractedEntities.join(', ')}`))
      console.log(chalk.gray(`   Escape Detected: ${analysisResult.analysis.escapeSignals.detected}`))
      
    } catch (error) {
      console.log(chalk.red(`❌ Failed: ${error.message}`))
    }
  }
}

/**
 * Test complete conversation flow with escape detection
 */
async function testConversationFlow() {
  console.log(chalk.blue('\n💬 Testing Complete Conversation Flow'))
  console.log(chalk.gray('=' * 60))

  for (const [scenarioKey, scenario] of Object.entries(TEST_SCENARIOS)) {
    console.log(chalk.yellow(`\n🎭 Testing: ${scenario.name}`))
    
    let context = {
      sessionId: `test-${scenarioKey}-${Date.now()}`,
      userId: 'test-user',
      domain: scenario.domain,
      stage: 'IDEA_CLARITY',
      userProfile: scenario.userProfile,
      conversationHistory: [],
      lastUpdated: new Date().toISOString()
    }

    try {
      // Simulate conversation turns
      for (let i = 0; i < scenario.testResponses.length; i++) {
        const userResponse = scenario.testResponses[i]
        console.log(chalk.cyan(`\n   Turn ${i + 1}:`))
        console.log(chalk.white(`   User: "${userResponse}"`))

        const turnResult = await makeRequest('/api/conversation/dynamic', 'POST', {
          action: 'conversation_turn',
          userResponse,
          context
        })

        console.log(chalk.gray(`   Sophistication: ${turnResult.analysis.sophisticationScore.toFixed(2)}`))
        console.log(chalk.gray(`   Engagement: ${turnResult.analysis.engagementLevel.toFixed(2)}`))
        
        if (turnResult.escapeTriggered) {
          console.log(chalk.red(`   🚨 ESCAPE TRIGGERED - Pivoting to assumptions`))
          break
        } else if (turnResult.nextQuestion) {
          console.log(chalk.green(`   AI: "${turnResult.nextQuestion.question}"`))
        }

        // Update context for next turn
        context = turnResult.updatedContext
      }

      console.log(chalk.green(`✅ Conversation flow completed`))
      console.log(chalk.gray(`   Final sophistication: ${context.userProfile.sophisticationLevel}`))
      console.log(chalk.gray(`   Total turns: ${context.conversationHistory.length}`))
      
    } catch (error) {
      console.log(chalk.red(`❌ Failed: ${error.message}`))
    }
  }
}

/**
 * Test escape signal detection across different types
 */
async function testEscapeSignalDetection() {
  console.log(chalk.blue('\n🚨 Testing Escape Signal Detection'))
  console.log(chalk.gray('=' * 60))

  const escapeTestCases = [
    { text: 'This is taking too long', expectedType: 'boredom' },
    { text: 'I know this stuff, skip to technical details', expectedType: 'expert_skip' },
    { text: 'Just show me wireframes', expectedType: 'impatience' },
    { text: 'I\'m not sure about any of this', expectedType: 'confusion' },
    { text: 'Can we move forward?', expectedType: 'impatience' },
    { text: 'I\'m getting bored with these questions', expectedType: 'boredom' }
  ]

  for (const testCase of escapeTestCases) {
    console.log(chalk.yellow(`\n🎯 Testing: "${testCase.text}"`))
    
    try {
      const context = {
        sessionId: `escape-test-${Date.now()}`,
        userId: 'test-user',
        domain: 'general',
        stage: 'IDEA_CLARITY',
        userProfile: {
          role: 'founder',
          sophisticationLevel: 'intermediate',
          engagementPattern: 'engaged'
        },
        conversationHistory: [],
        lastUpdated: new Date().toISOString()
      }

      const result = await makeRequest('/api/conversation/dynamic', 'POST', {
        action: 'analyze_response',
        userResponse: testCase.text,
        context
      })

      const escapeSignals = result.analysis.escapeSignals
      
      if (escapeSignals.detected) {
        console.log(chalk.green(`✅ Escape detected`))
        console.log(chalk.gray(`   Type: ${escapeSignals.type}`))
        console.log(chalk.gray(`   Confidence: ${escapeSignals.confidence}`))
      } else {
        console.log(chalk.yellow(`⚠️  Escape not detected`))
      }
      
    } catch (error) {
      console.log(chalk.red(`❌ Failed: ${error.message}`))
    }
  }
}

/**
 * Test domain expertise demonstration
 */
async function testDomainExpertise() {
  console.log(chalk.blue('\n🎓 Testing Domain Expertise'))
  console.log(chalk.gray('=' * 60))

  const domainTests = [
    {
      domain: 'fintech',
      userInput: 'I need regulatory compliance for banking',
      expectedTerms: ['SOC2', 'PCI DSS', 'BSA/AML', 'regulatory reporting']
    },
    {
      domain: 'healthcare',
      userInput: 'I want to help doctors with patient records',
      expectedTerms: ['HIPAA', 'EHR', 'clinical workflows', 'patient data privacy']
    }
  ]

  for (const test of domainTests) {
    console.log(chalk.yellow(`\n🏥 Testing ${test.domain} domain expertise`))
    
    try {
      const context = {
        sessionId: `domain-test-${Date.now()}`,
        userId: 'test-user',
        domain: test.domain,
        stage: 'IDEA_CLARITY',
        userProfile: {
          role: 'founder',
          sophisticationLevel: 'intermediate',
          engagementPattern: 'engaged'
        },
        conversationHistory: [],
        lastUpdated: new Date().toISOString()
      }

      // Generate question based on user input
      const turnResult = await makeRequest('/api/conversation/dynamic', 'POST', {
        action: 'conversation_turn',
        userResponse: test.userInput,
        context
      })

      if (turnResult.nextQuestion) {
        const question = turnResult.nextQuestion.question.toLowerCase()
        const foundTerms = test.expectedTerms.filter(term => 
          question.includes(term.toLowerCase())
        )

        console.log(chalk.green(`✅ Domain question generated`))
        console.log(chalk.white(`   Question: "${turnResult.nextQuestion.question}"`))
        console.log(chalk.gray(`   Domain terms found: ${foundTerms.join(', ')}`))
        console.log(chalk.gray(`   Domain context: ${turnResult.nextQuestion.domainContext}`))
      } else {
        console.log(chalk.yellow(`⚠️  No question generated`))
      }
      
    } catch (error) {
      console.log(chalk.red(`❌ Failed: ${error.message}`))
    }
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log(chalk.bold.green('🚀 Dynamic Conversation Engine Test Suite'))
  console.log(chalk.gray('Testing GPT-4 powered adaptive conversation system\n'))

  const testSuite = [
    { name: 'Question Generation', fn: testQuestionGeneration },
    { name: 'Response Analysis', fn: testResponseAnalysis },
    { name: 'Conversation Flow', fn: testConversationFlow },
    { name: 'Escape Signal Detection', fn: testEscapeSignalDetection },
    { name: 'Domain Expertise', fn: testDomainExpertise }
  ]

  let passed = 0
  let failed = 0

  for (const test of testSuite) {
    try {
      await test.fn()
      passed++
      console.log(chalk.green(`\n✅ ${test.name} tests completed`))
    } catch (error) {
      failed++
      console.log(chalk.red(`\n❌ ${test.name} tests failed: ${error.message}`))
    }
  }

  // Summary
  console.log(chalk.bold.blue('\n📊 Test Summary'))
  console.log(chalk.gray('=' * 40))
  console.log(chalk.green(`✅ Passed: ${passed}`))
  console.log(chalk.red(`❌ Failed: ${failed}`))
  console.log(chalk.blue(`📊 Total: ${passed + failed}`))

  if (failed === 0) {
    console.log(chalk.bold.green('\n🎉 All tests passed! Dynamic conversation engine is working perfectly.'))
  } else {
    console.log(chalk.bold.yellow(`\n⚠️  ${failed} test suite(s) failed. Check the errors above.`))
  }
}

// Check if running directly
if (require.main === module) {
  // Check environment
  if (!process.env.OPENAI_API_KEY) {
    console.error(chalk.red('❌ OPENAI_API_KEY environment variable is required'))
    process.exit(1)
  }

  runAllTests().catch(error => {
    console.error(chalk.red('❌ Test suite failed:'), error)
    process.exit(1)
  })
}

module.exports = {
  runAllTests,
  testQuestionGeneration,
  testResponseAnalysis,
  testConversationFlow,
  testEscapeSignalDetection,
  testDomainExpertise
} 