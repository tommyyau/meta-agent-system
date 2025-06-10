#!/usr/bin/env node

const http = require('http')

console.log('🧪 COMPREHENSIVE CONVERSATION SYSTEM TEST SUITE')
console.log('===============================================')
console.log('Running full test suite against all conversation APIs...\n')

// Test configuration
const BASE_URL = 'http://localhost:3000'
const TIMEOUT = 35000 // 35 seconds for complex operations

// Test data
const testContext = {
  domain: 'fintech',
  userLevel: 'expert',
  conversationHistory: [],
  currentPhase: 'discovery'
}

// Utility function to make API calls
function makeAPICall(path, data, description, timeout = TIMEOUT) {
  return new Promise((resolve) => {
    const startTime = Date.now()
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
      timeout: timeout
    }
    
    const req = http.request(options, (res) => {
      let responseData = ''
      
      res.on('data', (chunk) => {
        responseData += chunk
      })
      
      res.on('end', () => {
        const duration = Date.now() - startTime
        try {
          const jsonData = JSON.parse(responseData)
          resolve({
            success: true,
            duration,
            statusCode: res.statusCode,
            data: jsonData,
            description
          })
        } catch (parseError) {
          resolve({
            success: false,
            duration,
            statusCode: res.statusCode,
            error: parseError.message,
            description,
            rawResponse: responseData.substring(0, 200)
          })
        }
      })
    })
    
    req.on('error', (error) => {
      const duration = Date.now() - startTime
      resolve({
        success: false,
        duration,
        error: error.message,
        description
      })
    })
    
    req.on('timeout', () => {
      const duration = Date.now() - startTime
      req.destroy()
      resolve({
        success: false,
        duration,
        error: 'Request timeout',
        description
      })
    })
    
    req.write(postData)
    req.end()
  })
}

// Test scenarios
const testSuites = [
  {
    name: 'Core API Functionality',
    tests: [
      {
        name: 'Question Generation API',
        path: '/api/conversation/dynamic',
        data: {
          action: 'generate_question',
          context: testContext
        },
        validate: (result) => result.data.question && (typeof result.data.question === 'string' || result.data.question.text)
      },
      {
        name: 'Response Analysis API',
        path: '/api/conversation/dynamic',
        data: {
          action: 'analyze_response',
          userResponse: "I'm building a regulatory reporting platform for mid-market banks with real-time compliance monitoring",
          context: testContext
        },
        validate: (result) => result.data.analysis && result.data.analysis.sophisticationScore
      },
      {
        name: 'Full Conversation Turn API',
        path: '/api/conversation/dynamic',
        data: {
          action: 'conversation_turn',
          userResponse: "I want to build a fintech platform with automated compliance reporting",
          context: testContext
        },
        validate: (result) => result.data.analysis && result.data.nextQuestion
      },
      {
        name: 'Assumption Pivot API',
        path: '/api/conversation/assumption-pivot',
        data: {
          userResponse: "Just generate some assumptions and show me wireframes",
          context: testContext
        },
        validate: (result) => result.data.pivotResult && typeof result.data.pivotResult.shouldPivot === 'boolean'
      }
    ]
  },
  {
    name: 'Edge Cases & Robustness',
    tests: [
      {
        name: 'Empty Response Handling',
        path: '/api/conversation/dynamic',
        data: {
          action: 'analyze_response',
          userResponse: "",
          context: testContext
        },
        validate: (result) => result.data.analysis || result.error
      },
      {
        name: 'Invalid Action Handling',
        path: '/api/conversation/dynamic',
        data: {
          action: 'invalid_action',
          context: testContext
        },
        validate: (result) => result.statusCode === 400 || result.error
      },
      {
        name: 'Missing Context Handling',
        path: '/api/conversation/dynamic',
        data: {
          action: 'generate_question'
        },
        validate: (result) => result.data.question || result.error
      }
    ]
  },
  {
    name: 'Performance & Reliability',
    tests: [
      {
        name: 'Quick Response Test',
        path: '/api/conversation/dynamic',
        data: {
          action: 'generate_question',
          context: { ...testContext, domain: 'general' }
        },
        timeout: 15000,
        validate: (result) => result.duration < 15000
      },
      {
        name: 'Complex Analysis Test',
        path: '/api/conversation/dynamic',
        data: {
          action: 'analyze_response',
          userResponse: "I'm developing a comprehensive fintech solution that integrates with multiple banking APIs, handles real-time transaction processing, implements advanced fraud detection using machine learning, ensures PCI DSS compliance, and provides detailed regulatory reporting for both domestic and international markets.",
          context: testContext
        },
        validate: (result) => result.data.analysis && result.data.analysis.sophisticationScore > 0.7
      }
    ]
  }
]

// Run all tests
async function runFullTestSuite() {
  const allResults = []
  let totalTests = 0
  let passedTests = 0
  
  for (const suite of testSuites) {
    console.log(`\n📋 ${suite.name}`)
    console.log('='.repeat(suite.name.length + 4))
    
    for (const test of suite.tests) {
      totalTests++
      console.log(`\n🔍 ${test.name}`)
      
      const result = await makeAPICall(test.path, test.data, test.name, test.timeout)
      
      // Validate result
      let isValid = false
      let validationError = null
      
      if (result.success) {
        try {
          isValid = test.validate(result)
        } catch (error) {
          validationError = error.message
        }
      }
      
      const testPassed = result.success && isValid
      if (testPassed) passedTests++
      
      // Display result
      const icon = testPassed ? '✅' : '❌'
      const status = testPassed ? 'PASSED' : 'FAILED'
      console.log(`   ${icon} ${status} (${result.duration}ms)`)
      
      if (testPassed) {
        // Show specific success details
        if (test.name.includes('Question Generation') && result.data.question) {
          const questionText = typeof result.data.question === 'string' ? result.data.question : result.data.question.text || 'Generated question'
          console.log(`      📝 Generated: "${questionText.substring(0, 50)}..."`)
        } else if (test.name.includes('Response Analysis') && result.data.analysis) {
          console.log(`      📊 Sophistication: ${result.data.analysis.sophisticationScore}`)
          console.log(`      📊 Engagement: ${result.data.analysis.engagementLevel}`)
        } else if (test.name.includes('Assumption Pivot') && result.data.pivotResult) {
          console.log(`      🎯 Should Pivot: ${result.data.pivotResult.shouldPivot}`)
          console.log(`      📝 Assumptions: ${result.data.pivotResult.assumptionSet?.assumptions?.length || 0}`)
        }
      } else {
        // Show failure details
        if (result.error) {
          console.log(`      ❌ Error: ${result.error}`)
        }
        if (validationError) {
          console.log(`      ❌ Validation: ${validationError}`)
        }
        if (result.statusCode && result.statusCode !== 200) {
          console.log(`      ❌ Status: ${result.statusCode}`)
        }
      }
      
      allResults.push({
        suite: suite.name,
        test: test.name,
        passed: testPassed,
        duration: result.duration,
        result
      })
    }
  }
  
  // Generate comprehensive report
  console.log('\n\n🎯 COMPREHENSIVE TEST SUITE RESULTS')
  console.log('=====================================')
  
  const successRate = Math.round((passedTests / totalTests) * 100)
  const avgDuration = Math.round(allResults.reduce((sum, r) => sum + r.duration, 0) / allResults.length)
  
  console.log(`📊 Overall Results: ${passedTests}/${totalTests} tests passed (${successRate}%)`)
  console.log(`⚡ Average Response Time: ${avgDuration}ms`)
  console.log(`🎯 System Status: ${successRate >= 80 ? '✅ HEALTHY' : '⚠️ NEEDS ATTENTION'}`)
  
  // Detailed breakdown by suite
  console.log('\n📋 Results by Test Suite:')
  for (const suite of testSuites) {
    const suiteResults = allResults.filter(r => r.suite === suite.name)
    const suitePassed = suiteResults.filter(r => r.passed).length
    const suiteTotal = suiteResults.length
    const suiteRate = Math.round((suitePassed / suiteTotal) * 100)
    
    console.log(`   ${suiteRate === 100 ? '✅' : suiteRate >= 50 ? '⚠️' : '❌'} ${suite.name}: ${suitePassed}/${suiteTotal} (${suiteRate}%)`)
  }
  
  // Performance analysis
  console.log('\n⚡ Performance Analysis:')
  const fastTests = allResults.filter(r => r.duration < 10000).length
  const mediumTests = allResults.filter(r => r.duration >= 10000 && r.duration < 20000).length
  const slowTests = allResults.filter(r => r.duration >= 20000).length
  
  console.log(`   🟢 Fast (<10s): ${fastTests} tests`)
  console.log(`   🟡 Medium (10-20s): ${mediumTests} tests`)
  console.log(`   🔴 Slow (>20s): ${slowTests} tests`)
  
  // Final assessment
  if (successRate === 100) {
    console.log('\n🎉 MILESTONE CONFIRMED: All conversation systems are fully operational!')
    console.log('🚀 The Meta-Agent conversation system has achieved 100% functionality.')
  } else if (successRate >= 80) {
    console.log('\n✅ SYSTEM HEALTHY: Most conversation systems are working correctly.')
    console.log('🔧 Minor issues detected - see failed tests above.')
  } else {
    console.log('\n⚠️ SYSTEM NEEDS ATTENTION: Multiple conversation systems are failing.')
    console.log('🔧 Please review the failed tests and check your configuration.')
  }
  
  console.log('\n📖 For detailed documentation, see: CONVERSATION_SYSTEM_MILESTONE.md')
  console.log('🎯 To run individual tests, use: npm run test:milestone')
}

// Check server availability
async function checkServer() {
  try {
    const response = await new Promise((resolve) => {
      const req = http.request({
        hostname: 'localhost',
        port: 3000,
        path: '/api/health',
        method: 'GET',
        timeout: 5000
      }, (res) => {
        resolve({ success: true, statusCode: res.statusCode })
      })
      
      req.on('error', () => resolve({ success: false }))
      req.on('timeout', () => {
        req.destroy()
        resolve({ success: false })
      })
      
      req.end()
    })
    
    if (response.success) {
      console.log('✅ Development server is running on localhost:3000')
      return true
    }
  } catch (error) {
    // Server not running
  }
  
  console.log('❌ Development server is not running')
  console.log('🔧 Please start the server with: npm run dev')
  console.log('📍 Then run this test suite again')
  return false
}

// Main execution
async function main() {
  const serverRunning = await checkServer()
  if (serverRunning) {
    await runFullTestSuite()
  }
}

main().catch(console.error) 