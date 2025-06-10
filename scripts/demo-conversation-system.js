#!/usr/bin/env node

/**
 * 🎉 Conversation System Demo
 * 
 * Demonstrates the fully functional conversation system with all 4 APIs working.
 * This script showcases the milestone achievement of 100% API functionality.
 */

const http = require('http')

console.log('🎉 META-AGENT CONVERSATION SYSTEM DEMO')
console.log('=====================================')
console.log('Demonstrating 100% functional conversation APIs\n')

// Test context for demonstrations
const demoContext = {
  sessionId: 'demo-session',
  domain: 'fintech',
  stage: 'idea_clarity',
  userProfile: {
    role: 'technical',
    sophisticationLevel: 'expert'
  },
  conversationHistory: [],
  lastUpdated: new Date().toISOString()
}

// Helper function for API calls
function makeAPICall(path, data, description) {
  return new Promise((resolve) => {
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
      timeout: 35000
    }
    
    console.log(`🔄 Testing: ${description}`)
    const startTime = Date.now()
    
    const req = http.request(options, (res) => {
      const duration = Date.now() - startTime
      let responseData = ''
      
      res.on('data', (chunk) => {
        responseData += chunk
      })
      
      res.on('end', () => {
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
            description
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

// Demo scenarios
async function runConversationDemo() {
  console.log('🚀 Starting Conversation System Demo...\n')
  
  const demos = [
    {
      name: '1. Question Generation',
      path: '/api/conversation/dynamic',
      data: {
        action: 'generate_question',
        context: demoContext
      },
      description: 'Adaptive Question Generation API'
    },
    {
      name: '2. Response Analysis',
      path: '/api/conversation/dynamic',
      data: {
        action: 'analyze_response',
        userResponse: "I'm building a regulatory reporting platform for mid-market banks",
        context: demoContext
      },
      description: 'Multi-dimensional Response Analysis API'
    },
    {
      name: '3. Full Conversation Turn',
      path: '/api/conversation/dynamic',
      data: {
        action: 'conversation_turn',
        userResponse: "I want to build a fintech platform with real-time compliance monitoring",
        context: demoContext
      },
      description: 'Complete Conversation Cycle API'
    },
    {
      name: '4. Assumption Pivot',
      path: '/api/conversation/assumption-pivot',
      data: {
        userResponse: "Just generate some assumptions and show me wireframes",
        context: demoContext
      },
      description: 'Escape Signal Detection & Assumption Generation API'
    }
  ]
  
  const results = []
  
  for (const demo of demos) {
    const result = await makeAPICall(demo.path, demo.data, demo.description)
    results.push({ ...result, name: demo.name })
    
    if (result.success) {
      console.log(`   ✅ SUCCESS (${result.duration}ms)`)
      
      // Show specific results for each API
      if (demo.name.includes('Question Generation') && result.data.question) {
        const questionText = typeof result.data.question === 'string' ? result.data.question : result.data.question.text || JSON.stringify(result.data.question)
        console.log(`   📝 Generated: "${questionText.substring(0, 60)}..."`)
      } else if (demo.name.includes('Response Analysis') && result.data.analysis) {
        console.log(`   📊 Sophistication: ${result.data.analysis.sophisticationScore}`)
        console.log(`   📊 Engagement: ${result.data.analysis.engagementLevel}`)
      } else if (demo.name.includes('Conversation Turn') && result.data.nextQuestion) {
        const nextQuestionText = typeof result.data.nextQuestion === 'string' ? result.data.nextQuestion : result.data.nextQuestion.text || JSON.stringify(result.data.nextQuestion)
        console.log(`   🔄 Next Question: "${nextQuestionText.substring(0, 50)}..."`)
      } else if (demo.name.includes('Assumption Pivot') && result.data.pivotResult) {
        console.log(`   🎯 Should Pivot: ${result.data.pivotResult.shouldPivot}`)
        console.log(`   📝 Assumptions: ${result.data.pivotResult.assumptionSet?.assumptions?.length || 0}`)
      }
    } else {
      console.log(`   ❌ FAILED (${result.duration}ms): ${result.error}`)
    }
    
    console.log('')
  }
  
  // Summary
  console.log('📊 DEMO RESULTS SUMMARY')
  console.log('=======================')
  
  const successCount = results.filter(r => r.success).length
  const totalCount = results.length
  const successRate = Math.round((successCount / totalCount) * 100)
  
  console.log(`🎯 Success Rate: ${successCount}/${totalCount} (${successRate}%)`)
  console.log(`⚡ Average Response Time: ${Math.round(results.reduce((sum, r) => sum + r.duration, 0) / results.length)}ms`)
  
  results.forEach(result => {
    const icon = result.success ? '✅' : '❌'
    console.log(`${icon} ${result.name}: ${result.duration}ms`)
  })
  
  if (successRate === 100) {
    console.log('\n🎉 MILESTONE CONFIRMED: All conversation APIs are working!')
    console.log('🚀 The Meta-Agent conversation system is fully operational.')
  } else {
    console.log('\n⚠️  Some APIs are not responding correctly.')
    console.log('🔧 Check your development server and OpenAI API configuration.')
  }
  
  console.log('\n📖 For detailed milestone documentation, see: CONVERSATION_SYSTEM_MILESTONE.md')
}

// Check if server is running first
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
      console.log('✅ Development server is running on localhost:3000\n')
      return true
    }
  } catch (error) {
    // Server not running
  }
  
  console.log('❌ Development server is not running')
  console.log('🔧 Please start the server with: npm run dev')
  console.log('📍 Then run this demo again\n')
  return false
}

// Main execution
async function main() {
  const serverRunning = await checkServer()
  if (serverRunning) {
    await runConversationDemo()
  }
}

main().catch(console.error) 