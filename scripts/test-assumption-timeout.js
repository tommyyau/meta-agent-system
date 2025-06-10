#!/usr/bin/env node

/**
 * Simple test for assumption pivot timeout debugging
 */

const http = require('http')

console.log('🔍 Testing Assumption Pivot API Timeout...')

const testData = {
  userResponse: "Just generate some assumptions and show me wireframes",
  context: {
    sessionId: 'timeout-test',
    domain: 'fintech',
    stage: 'idea_clarity',
    userProfile: {
      role: 'technical',
      sophisticationLevel: 'expert'
    },
    conversationHistory: [],
    lastUpdated: new Date().toISOString()
  }
}

const postData = JSON.stringify(testData)

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/conversation/assumption-pivot',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  },
  timeout: 35000 // 35 second timeout
}

console.log('⏱️  Starting request with 35 second timeout...')
const startTime = Date.now()

const req = http.request(options, (res) => {
  const duration = Date.now() - startTime
  console.log(`📊 Response received after ${duration}ms`)
  console.log(`📊 Status Code: ${res.statusCode}`)
  
  let responseData = ''
  
  res.on('data', (chunk) => {
    responseData += chunk
  })
  
  res.on('end', () => {
    try {
      const jsonData = JSON.parse(responseData)
      console.log('✅ SUCCESS!')
      console.log(`🎯 Should Pivot: ${jsonData.pivotResult?.shouldPivot}`)
      console.log(`📝 Pivot Reason: ${jsonData.pivotResult?.pivotReason}`)
      console.log(`🔢 Assumptions Generated: ${jsonData.pivotResult?.assumptionSet?.assumptions?.length || 0}`)
    } catch (parseError) {
      console.log('❌ JSON Parse Error:', parseError.message)
      console.log('Raw response:', responseData.substring(0, 200))
    }
  })
})

req.on('error', (error) => {
  const duration = Date.now() - startTime
  console.log(`❌ Request failed after ${duration}ms: ${error.message}`)
})

req.on('timeout', () => {
  const duration = Date.now() - startTime
  req.destroy()
  console.log(`⏱️  Request timed out after ${duration}ms`)
})

req.write(postData)
req.end() 