#!/usr/bin/env node

/**
 * Quick Conversation API Test
 * 
 * Fast test to verify all conversation APIs are responding correctly
 */

const http = require('http')

console.log('🚀 Quick Conversation API Test\n')

// Helper function to make HTTP requests with shorter timeout
function makeRequest(path, data, timeout = 20000) {
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
      timeout
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

// Test context
const testContext = {
  sessionId: 'quick-test-session',
  domain: 'fintech',
  stage: 'IDEA_CLARITY',
  userProfile: {
    role: 'technical',
    sophisticationLevel: 'expert',
    domainKnowledge: {
      experience: 'senior',
      technicalDepth: 'expert',
      businessAcumen: 'advanced'
    }
  },
  conversationHistory: [],
  lastUpdated: new Date().toISOString()
}

async function testResponseAnalysis() {
  console.log('1. Testing Response Analysis API...')
  
  try {
    const response = await makeRequest('/api/conversation/dynamic', {
      action: 'analyze_response',
      userResponse: "I'm building a fintech platform",
      context: testContext
    }, 15000)
    
    if (response.statusCode === 200 && response.data.analysis) {
      console.log(`   ✅ Response Analysis API working`)
      console.log(`   📊 Sophistication: ${response.data.analysis.sophisticationScore.toFixed(2)}`)
      return { success: true, analysis: response.data.analysis }
    } else {
      throw new Error(`Unexpected response: ${response.statusCode}`)
    }
  } catch (error) {
    console.log(`   ❌ Response Analysis API failed: ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function testQuestionGeneration() {
  console.log('2. Testing Question Generation API...')
  
  try {
    const response = await makeRequest('/api/conversation/dynamic', {
      action: 'generate_question',
      context: testContext
    }, 15000)
    
    if (response.statusCode === 200 && response.data.question) {
      console.log(`   ✅ Question Generation API working`)
      console.log(`   ❓ Generated: "${response.data.question.question.substring(0, 60)}..."`)
      return { success: true, question: response.data.question }
    } else {
      throw new Error(`Unexpected response: ${response.statusCode}`)
    }
  } catch (error) {
    console.log(`   ❌ Question Generation API failed: ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function testAssumptionPivot() {
  console.log('3. Testing Assumption Pivot API...')
  
  try {
    const response = await makeRequest('/api/conversation/assumption-pivot', {
      userResponse: "Just generate some assumptions and show me wireframes",
      context: testContext
    }, 35000) // Extra long timeout for assumption pivot (needs 27+ seconds)
    
    if (response.statusCode === 200 && response.data.pivotResult) {
      console.log(`   ✅ Assumption Pivot API working`)
      console.log(`   🎯 Should Pivot: ${response.data.pivotResult.shouldPivot}`)
      return { success: true, pivotResult: response.data.pivotResult }
    } else {
      throw new Error(`Unexpected response: ${response.statusCode}`)
    }
  } catch (error) {
    console.log(`   ❌ Assumption Pivot API failed: ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function testConversationTurn() {
  console.log('4. Testing Full Conversation Turn API...')
  
  try {
    const response = await makeRequest('/api/conversation/dynamic', {
      action: 'conversation_turn',
      userResponse: "I want to build a regulatory reporting platform",
      context: testContext
    }, 20000)
    
    if (response.statusCode === 200 && response.data.analysis && response.data.nextQuestion) {
      console.log(`   ✅ Conversation Turn API working`)
      console.log(`   🔄 Analysis + Question generated successfully`)
      return { success: true, result: response.data }
    } else {
      throw new Error(`Unexpected response: ${response.statusCode}`)
    }
  } catch (error) {
    console.log(`   ❌ Conversation Turn API failed: ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function runQuickTests() {
  console.log('Testing all conversation API endpoints quickly...\n')
  
  const results = []
  
  // Test each endpoint
  results.push(await testResponseAnalysis())
  results.push(await testQuestionGeneration())
  results.push(await testAssumptionPivot())
  results.push(await testConversationTurn())
  
  // Generate summary
  console.log('\n' + '='.repeat(50))
  console.log('📊 QUICK API TEST SUMMARY')
  console.log('='.repeat(50))
  
  const passed = results.filter(r => r.success).length
  const total = results.length
  
  console.log(`\nResults: ${passed}/${total} APIs working`)
  console.log(`Success Rate: ${Math.round((passed / total) * 100)}%`)
  
  const apiNames = [
    'Response Analysis',
    'Question Generation', 
    'Assumption Pivot',
    'Conversation Turn'
  ]
  
  results.forEach((result, index) => {
    console.log(`${result.success ? '✅' : '❌'} ${apiNames[index]}`)
  })
  
  if (passed === total) {
    console.log(`\n🎉 ALL CONVERSATION APIs WORKING!`)
    console.log(`Your generative AI conversation system is fully functional.`)
  } else {
    console.log(`\n⚠️  ${total - passed} API(s) need attention.`)
    console.log(`Check your OpenAI API key and server configuration.`)
  }
  
  console.log('='.repeat(50))
  
  return passed === total
}

// Main execution
async function main() {
  try {
    console.log('Make sure your Next.js server is running on localhost:3000\n')
    
    const allPassed = await runQuickTests()
    process.exit(allPassed ? 0 : 1)
    
  } catch (error) {
    console.error('❌ Test execution failed:', error)
    console.log('\nMake sure:')
    console.log('1. Your Next.js server is running (npm run dev)')
    console.log('2. Your OpenAI API key is configured')
    process.exit(1)
  }
}

if (require.main === module) {
  main()
} 