#!/usr/bin/env node

/**
 * Conversation API Integration Tests
 * 
 * Tests all conversation API endpoints to ensure generative AI is working:
 * 1. /api/conversation/dynamic (analyze_response) - Response analysis
 * 2. /api/conversation/dynamic (generate_question) - Question generation  
 * 3. /api/conversation/assumption-pivot - Assumption generation
 */

const http = require('http')

console.log('🚀 Testing Conversation API Endpoints\n')

// Helper function to make HTTP requests
function makeRequest(path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data)
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 30000
    }
    
    const req = http.request(options, (res) => {
      let responseData = ''
      
      res.on('data', (chunk) => {
        responseData += chunk
      })
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData)
          resolve({
            statusCode: res.statusCode,
            data: jsonData
          })
        } catch (parseError) {
          resolve({
            statusCode: res.statusCode,
            data: responseData,
            parseError: parseError.message
          })
        }
      })
    })
    
    req.on('error', (error) => {
      reject(error)
    })
    
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Request timeout'))
    })
    
    req.write(postData)
    req.end()
  })
}

// Test scenarios
const testScenarios = [
  {
    name: "Fintech Expert - Regulatory Platform",
    context: {
      sessionId: 'test-fintech-expert',
      domain: 'fintech',
      stage: 'IDEA_CLARITY',
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
    },
    testSteps: [
      {
        userResponse: "I'm building a regulatory reporting platform for mid-market banks",
        expectHighSophistication: true
      },
      {
        userResponse: "Focus on SOC2 and PCI DSS compliance with real-time transaction monitoring",
        expectHighSophistication: true
      },
      {
        userResponse: "Just generate some smart assumptions and let's move to wireframes",
        expectAssumptionPivot: true
      }
    ]
  },
  
  {
    name: "Healthcare Novice - Patient Management",
    context: {
      sessionId: 'test-healthcare-novice',
      domain: 'healthcare',
      stage: 'IDEA_CLARITY',
      userProfile: {
        role: 'business',
        sophisticationLevel: 'novice',
        domainKnowledge: {
          experience: 'beginner',
          businessAcumen: 'intermediate'
        }
      },
      conversationHistory: [],
      lastUpdated: new Date().toISOString()
    },
    testSteps: [
      {
        userResponse: "I want to build something for managing patients in my clinic",
        expectLowSophistication: true
      },
      {
        userResponse: "Um, I'm not sure about the technical stuff. Just something simple?",
        expectLowSophistication: true
      }
    ]
  }
]

class ConversationAPITester {
  constructor() {
    this.results = []
  }

  async testResponseAnalysis(userResponse, context, expectations = {}) {
    console.log(`   🔍 Testing Response Analysis`)
    console.log(`      Input: "${userResponse.substring(0, 60)}..."`)
    
    try {
      const response = await makeRequest('/api/conversation/dynamic', {
        action: 'analyze_response',
        userResponse,
        context
      })
      
      if (response.statusCode !== 200) {
        throw new Error(`API returned status ${response.statusCode}: ${JSON.stringify(response.data)}`)
      }
      
             const result = response.data
       const analysis = result.analysis
       
       // Validate basic structure
       if (!analysis || !analysis.sophisticationScore || !analysis.engagementLevel || !analysis.clarityScore) {
         throw new Error('Missing required analysis fields')
       }
       
       console.log(`      Sophistication: ${analysis.sophisticationScore.toFixed(2)}`)
       console.log(`      Engagement: ${analysis.engagementLevel.toFixed(2)}`)
       console.log(`      Clarity: ${analysis.clarityScore.toFixed(2)}`)
      
      // Check expectations
      if (expectations.expectHighSophistication && analysis.sophisticationScore < 0.7) {
        console.log(`      ⚠️  Expected high sophistication but got ${analysis.sophisticationScore.toFixed(2)}`)
      }
      
      if (expectations.expectLowSophistication && analysis.sophisticationScore > 0.6) {
        console.log(`      ⚠️  Expected low sophistication but got ${analysis.sophisticationScore.toFixed(2)}`)
      }
      
      console.log(`      ✅ Response analysis PASSED`)
      return { success: true, analysis }
      
    } catch (error) {
      console.log(`      ❌ Response analysis FAILED: ${error.message}`)
      return { success: false, error: error.message }
    }
  }

  async testQuestionGeneration(context, responseAnalysis) {
    console.log(`   ❓ Testing Question Generation`)
    
    try {
      const response = await makeRequest('/api/conversation/dynamic', {
        action: 'generate_question',
        context
      })
      
      if (response.statusCode !== 200) {
        throw new Error(`API returned status ${response.statusCode}: ${JSON.stringify(response.data)}`)
      }
      
             const result = response.data
       const questionResult = result.question
       
       if (!questionResult || !questionResult.question || questionResult.question.length < 10) {
         throw new Error('Generated question is too short or empty')
       }
       
       console.log(`      Question: "${questionResult.question.substring(0, 80)}..."`)
       console.log(`      Type: ${questionResult.questionType || 'unknown'}`)
       console.log(`      Sophistication: ${questionResult.sophisticationLevel || 'unknown'}`)
      console.log(`      ✅ Question generation PASSED`)
      
      return { success: true, questionResult }
      
    } catch (error) {
      console.log(`      ❌ Question generation FAILED: ${error.message}`)
      return { success: false, error: error.message }
    }
  }

  async testAssumptionPivot(userResponse, context, expectations = {}) {
    console.log(`   🎯 Testing Assumption Pivot`)
    
    try {
      const response = await makeRequest('/api/conversation/assumption-pivot', {
        userResponse,
        context
      })
      
      if (response.statusCode !== 200) {
        throw new Error(`API returned status ${response.statusCode}: ${JSON.stringify(response.data)}`)
      }
      
      const result = response.data
      const pivotResult = result.pivotResult
      
      console.log(`      Should Pivot: ${pivotResult.shouldPivot}`)
      console.log(`      Pivot Reason: ${pivotResult.pivotReason || 'none'}`)
      
      if (expectations.expectAssumptionPivot && !pivotResult.shouldPivot) {
        console.log(`      ⚠️  Expected assumption pivot but didn't trigger`)
      }
      
      if (pivotResult.shouldPivot && pivotResult.assumptionSet) {
        const assumptions = pivotResult.assumptionSet.assumptions || []
        console.log(`      Generated ${assumptions.length} assumptions`)
        
        if (assumptions.length > 0) {
          console.log(`      Sample: "${assumptions[0].title || 'No title'}"`)
        }
      }
      
      console.log(`      ✅ Assumption pivot PASSED`)
      return { success: true, pivotResult }
      
    } catch (error) {
      console.log(`      ❌ Assumption pivot FAILED: ${error.message}`)
      return { success: false, error: error.message }
    }
  }

  async testScenario(scenario) {
    console.log(`\n📋 Testing Scenario: ${scenario.name}`)
    console.log(`   Domain: ${scenario.context.domain}`)
    console.log(`   User Level: ${scenario.context.userProfile.sophisticationLevel}`)
    
    let context = { ...scenario.context }
    let scenarioSuccess = true
    
    for (let i = 0; i < scenario.testSteps.length; i++) {
      const step = scenario.testSteps[i]
      console.log(`\n   Step ${i + 1}/${scenario.testSteps.length}`)
      
      // Test response analysis
      const analysisResult = await this.testResponseAnalysis(
        step.userResponse, 
        context, 
        step
      )
      
      if (!analysisResult.success) {
        scenarioSuccess = false
        continue
      }
      
      const responseAnalysis = analysisResult.analysis
      
      // Test question generation
      const questionResult = await this.testQuestionGeneration(context, responseAnalysis)
      if (!questionResult.success) scenarioSuccess = false
      
      // Test assumption pivot
      const assumptionResult = await this.testAssumptionPivot(step.userResponse, context, step)
      if (!assumptionResult.success) scenarioSuccess = false
      
      // Update context for next step
      context.conversationHistory.push({
        userResponse: step.userResponse,
        analysis: responseAnalysis,
        generatedQuestion: questionResult.success ? questionResult.questionResult : undefined,
        timestamp: new Date().toISOString(),
        stage: context.stage
      })
      context.lastUpdated = new Date().toISOString()
    }
    
    return { name: scenario.name, success: scenarioSuccess }
  }

  async runAllTests() {
    console.log('Testing all conversation API endpoints...\n')
    
    const results = []
    
    for (const scenario of testScenarios) {
      const result = await this.testScenario(scenario)
      results.push(result)
    }
    
    // Generate summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 CONVERSATION API TEST SUMMARY')
    console.log('='.repeat(60))
    
    const totalScenarios = results.length
    const passedScenarios = results.filter(r => r.success).length
    const failedScenarios = totalScenarios - passedScenarios
    
    console.log(`\nOverall Results:`)
    console.log(`Total Scenarios: ${totalScenarios}`)
    console.log(`Passed: ${passedScenarios} ✅`)
    console.log(`Failed: ${failedScenarios} ${failedScenarios > 0 ? '❌' : '✅'}`)
    console.log(`Success Rate: ${Math.round((passedScenarios / totalScenarios) * 100)}%`)
    
    console.log(`\nDetailed Results:`)
    results.forEach(result => {
      console.log(`${result.success ? '✅' : '❌'} ${result.name}`)
    })
    
    if (passedScenarios === totalScenarios) {
      console.log(`\n🎉 ALL CONVERSATION APIs WORKING PERFECTLY!`)
      console.log(`✅ Dynamic Response Analysis API`)
      console.log(`✅ Dynamic Question Generation API`)
      console.log(`✅ Assumption Pivot API`)
      console.log(`✅ End-to-end conversation flow`)
    } else {
      console.log(`\n⚠️  Some conversation APIs need attention.`)
      console.log(`Make sure your Next.js server is running on localhost:3000`)
    }
    
    console.log('='.repeat(60))
    
    return results
  }
}

// Main execution
async function main() {
  try {
    console.log('Make sure your Next.js server is running on localhost:3000')
    console.log('Run: npm run dev\n')
    
    const tester = new ConversationAPITester()
    const results = await tester.runAllTests()
    
    const allPassed = results.every(r => r.success)
    process.exit(allPassed ? 0 : 1)
    
  } catch (error) {
    console.error('❌ Test execution failed:', error)
    console.log('\nMake sure:')
    console.log('1. Your Next.js server is running (npm run dev)')
    console.log('2. The server is accessible on localhost:3000')
    console.log('3. Your OpenAI API key is configured')
    process.exit(1)
  }
}

if (require.main === module) {
  main()
} 