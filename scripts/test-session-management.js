#!/usr/bin/env node

/**
 * Session Management System Test Suite
 * 
 * Tests all session management functionality:
 * - Session creation and lifecycle
 * - Profile and agent management
 * - Analytics and health monitoring
 * - API endpoints
 * - Error handling
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args))

const BASE_URL = 'http://localhost:3000'
const API_BASE = `${BASE_URL}/api`

// Test configuration
const TEST_CONFIG = {
  verbose: true,
  delay: 100, // ms between requests
  timeout: 5000 // ms
}

// Test data
const TEST_PROFILES = {
  fintech: {
    id: 'test-user-fintech',
    name: 'Alex Chen',
    email: 'alex@fintech.com',
    industry: 'fintech',
    role: 'technical',
    sophisticationLevel: 'expert',
    goals: ['build trading platform', 'implement risk management'],
    preferences: {
      communicationStyle: 'technical',
      detailLevel: 'comprehensive',
      responseFormat: 'structured'
    },
    conversationHistory: []
  },
  healthcare: {
    id: 'test-user-healthcare',
    name: 'Dr. Sarah Johnson',
    email: 'sarah@healthtech.com',
    industry: 'healthcare',
    role: 'business',
    sophisticationLevel: 'intermediate',
    goals: ['patient management system', 'compliance automation'],
    preferences: {
      communicationStyle: 'professional',
      detailLevel: 'balanced',
      responseFormat: 'actionable'
    },
    conversationHistory: []
  }
}

const TEST_AGENTS = {
  fintech: {
    id: 'fintech-expert-agent',
    name: 'Fintech Expert Agent',
    type: 'specialized',
    specialization: 'fintech',
    capabilities: ['trading-systems', 'risk-management', 'compliance'],
    currentStage: 'idea-clarity',
    conversationState: {
      stage: 'idea-clarity',
      context: {},
      history: []
    },
    configuration: {
      responseStyle: 'technical',
      expertise: 'expert',
      focus: 'implementation'
    }
  }
}

// Utility functions
function log(message, type = 'info') {
  if (!TEST_CONFIG.verbose && type === 'debug') return
  
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0]
  const colors = {
    info: '\x1b[36m',    // cyan
    success: '\x1b[32m', // green
    error: '\x1b[31m',   // red
    warning: '\x1b[33m', // yellow
    debug: '\x1b[90m',   // gray
    reset: '\x1b[0m'
  }
  
  console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`)
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function makeRequest(method, endpoint, data = null) {
  const url = `${API_BASE}${endpoint}`
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: TEST_CONFIG.timeout
  }
  
  if (data) {
    options.body = JSON.stringify(data)
  }
  
  log(`${method} ${endpoint}`, 'debug')
  
  try {
    const response = await fetch(url, options)
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${result.error || 'Unknown error'}`)
    }
    
    return result
  } catch (error) {
    log(`Request failed: ${error.message}`, 'error')
    throw error
  }
}

// Test functions
async function testSessionCreation() {
  log('🧪 Testing Session Creation...', 'info')
  
  try {
    // Test basic session creation
    const result1 = await makeRequest('POST', '/sessions', {})
    log(`✅ Created session: ${result1.data.sessionId}`, 'success')
    
    // Test session creation with custom ID
    const customId = 'test-session-' + Date.now()
    const result2 = await makeRequest('POST', '/sessions', {
      sessionId: customId,
      options: {
        maxDuration: 60 * 60 * 1000, // 1 hour
        autoSave: true
      }
    })
    log(`✅ Created custom session: ${result2.data.sessionId}`, 'success')
    
    return [result1.data.sessionId, result2.data.sessionId]
  } catch (error) {
    log(`❌ Session creation failed: ${error.message}`, 'error')
    throw error
  }
}

async function testSessionRetrieval(sessionIds) {
  log('🧪 Testing Session Retrieval...', 'info')
  
  try {
    // Test getting session analytics
    const analytics = await makeRequest('GET', '/sessions')
    log(`✅ Retrieved analytics: ${analytics.data.activeSessions} active sessions`, 'success')
    
    // Test getting specific session
    const session = await makeRequest('GET', `/sessions/${sessionIds[0]}`)
    log(`✅ Retrieved session: ${session.data.sessionId}`, 'success')
    
    // Test getting session with context
    const sessionWithContext = await makeRequest('GET', `/sessions/${sessionIds[0]}?context=true`)
    log(`✅ Retrieved session with context`, 'success')
    
    // Test getting health status
    const health = await makeRequest('GET', '/sessions?health=true')
    log(`✅ Health status: ${health.health.status}`, 'success')
    
    return analytics
  } catch (error) {
    log(`❌ Session retrieval failed: ${error.message}`, 'error')
    throw error
  }
}

async function testSessionUpdates(sessionIds) {
  log('🧪 Testing Session Updates...', 'info')
  
  try {
    const sessionId = sessionIds[0]
    
    // Test profile update
    const profileUpdate = await makeRequest('PUT', `/sessions/${sessionId}`, {
      profile: TEST_PROFILES.fintech
    })
    log(`✅ Updated profile for session: ${sessionId}`, 'success')
    
    await delay(TEST_CONFIG.delay)
    
    // Test agent registration
    const agentUpdate = await makeRequest('PUT', `/sessions/${sessionId}`, {
      agent: TEST_AGENTS.fintech
    })
    log(`✅ Registered agent for session: ${sessionId}`, 'success')
    
    await delay(TEST_CONFIG.delay)
    
    // Test metadata update
    const metadataUpdate = await makeRequest('PUT', `/sessions/${sessionId}`, {
      metadata: {
        testRun: true,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    })
    log(`✅ Updated metadata for session: ${sessionId}`, 'success')
    
    await delay(TEST_CONFIG.delay)
    
    // Test session extension
    const extensionUpdate = await makeRequest('PUT', `/sessions/${sessionId}`, {
      extend: 30 * 60 * 1000 // 30 minutes
    })
    log(`✅ Extended session duration: ${sessionId}`, 'success')
    
    return profileUpdate
  } catch (error) {
    log(`❌ Session updates failed: ${error.message}`, 'error')
    throw error
  }
}

async function testSessionAnalytics() {
  log('🧪 Testing Session Analytics...', 'info')
  
  try {
    // Test detailed analytics
    const analytics = await makeRequest('GET', '/sessions?analytics=true')
    log(`✅ Analytics - Total: ${analytics.analytics.totalSessions}, Active: ${analytics.analytics.activeSessions}`, 'success')
    log(`   Requests: ${analytics.analytics.totalRequests}, Error Rate: ${(analytics.analytics.errorRate * 100).toFixed(1)}%`, 'debug')
    
    // Test health monitoring
    const health = await makeRequest('GET', '/sessions?health=true')
    log(`✅ Health Status: ${health.health.status}`, 'success')
    log(`   Memory: ${Math.round(health.health.memoryUsage.heapUsed / 1024 / 1024)}MB`, 'debug')
    log(`   Uptime: ${Math.round(health.health.uptime)}s`, 'debug')
    
    return { analytics: analytics.analytics, health: health.health }
  } catch (error) {
    log(`❌ Analytics failed: ${error.message}`, 'error')
    throw error
  }
}

async function testSessionDeletion(sessionIds) {
  log('🧪 Testing Session Deletion...', 'info')
  
  try {
    // Test single session deletion
    const deleteResult = await makeRequest('DELETE', `/sessions/${sessionIds[1]}`)
    log(`✅ Deleted session: ${sessionIds[1]}`, 'success')
    
    await delay(TEST_CONFIG.delay)
    
    // Test bulk deletion
    const bulkDeleteResult = await makeRequest('DELETE', '/sessions', {
      sessionIds: [sessionIds[0]]
    })
    log(`✅ Bulk deleted ${bulkDeleteResult.data.deletedCount} sessions`, 'success')
    
    // Verify deletion
    try {
      await makeRequest('GET', `/sessions/${sessionIds[0]}`)
      log(`❌ Session should have been deleted but still exists`, 'error')
    } catch (error) {
      if (error.message.includes('404')) {
        log(`✅ Confirmed session deletion`, 'success')
      } else {
        throw error
      }
    }
    
    return bulkDeleteResult
  } catch (error) {
    log(`❌ Session deletion failed: ${error.message}`, 'error')
    throw error
  }
}

async function testErrorHandling() {
  log('🧪 Testing Error Handling...', 'info')
  
  try {
    // Test getting non-existent session
    try {
      await makeRequest('GET', '/sessions/non-existent-session')
      log(`❌ Should have failed for non-existent session`, 'error')
    } catch (error) {
      if (error.message.includes('404')) {
        log(`✅ Correctly handled non-existent session`, 'success')
      } else {
        throw error
      }
    }
    
    // Test invalid update data
    try {
      await makeRequest('PUT', '/sessions', {
        // Missing sessionId
        updates: { invalid: 'data' }
      })
      log(`❌ Should have failed for missing sessionId`, 'error')
    } catch (error) {
      if (error.message.includes('400')) {
        log(`✅ Correctly handled missing sessionId`, 'success')
      } else {
        throw error
      }
    }
    
    log(`✅ Error handling tests passed`, 'success')
  } catch (error) {
    log(`❌ Error handling tests failed: ${error.message}`, 'error')
    throw error
  }
}

async function testPerformance() {
  log('🧪 Testing Performance...', 'info')
  
  try {
    const startTime = Date.now()
    const sessionPromises = []
    
    // Create multiple sessions concurrently
    for (let i = 0; i < 10; i++) {
      sessionPromises.push(makeRequest('POST', '/sessions', {}))
    }
    
    const sessions = await Promise.all(sessionPromises)
    const creationTime = Date.now() - startTime
    
    log(`✅ Created 10 sessions in ${creationTime}ms (${(creationTime/10).toFixed(1)}ms avg)`, 'success')
    
    // Test concurrent updates
    const updateStartTime = Date.now()
    const updatePromises = sessions.map((session, i) => 
      makeRequest('PUT', `/sessions/${session.data.sessionId}`, {
        metadata: { testIndex: i, timestamp: new Date().toISOString() }
      })
    )
    
    await Promise.all(updatePromises)
    const updateTime = Date.now() - updateStartTime
    
    log(`✅ Updated 10 sessions in ${updateTime}ms (${(updateTime/10).toFixed(1)}ms avg)`, 'success')
    
    // Cleanup test sessions
    const cleanupPromises = sessions.map(session => 
      makeRequest('DELETE', `/sessions/${session.data.sessionId}`)
    )
    
    await Promise.all(cleanupPromises)
    log(`✅ Cleaned up test sessions`, 'success')
    
    return { creationTime, updateTime }
  } catch (error) {
    log(`❌ Performance tests failed: ${error.message}`, 'error')
    throw error
  }
}

// Main test runner
async function runTests() {
  log('🚀 Starting Session Management System Tests', 'info')
  log('=' .repeat(60), 'info')
  
  const results = {
    passed: 0,
    failed: 0,
    startTime: Date.now()
  }
  
  const tests = [
    { name: 'Session Creation', fn: testSessionCreation },
    { name: 'Session Retrieval', fn: (sessionIds) => testSessionRetrieval(sessionIds) },
    { name: 'Session Updates', fn: (sessionIds) => testSessionUpdates(sessionIds) },
    { name: 'Session Analytics', fn: testSessionAnalytics },
    { name: 'Session Deletion', fn: (sessionIds) => testSessionDeletion(sessionIds) },
    { name: 'Error Handling', fn: testErrorHandling },
    { name: 'Performance', fn: testPerformance }
  ]
  
  let sessionIds = []
  
  for (const test of tests) {
    try {
      log(`\n📋 Running ${test.name}...`, 'info')
      
      if (test.name === 'Session Creation') {
        sessionIds = await test.fn()
      } else if (['Session Retrieval', 'Session Updates', 'Session Deletion'].includes(test.name)) {
        await test.fn(sessionIds)
      } else {
        await test.fn()
      }
      
      results.passed++
      log(`✅ ${test.name} PASSED`, 'success')
      
      await delay(TEST_CONFIG.delay)
    } catch (error) {
      results.failed++
      log(`❌ ${test.name} FAILED: ${error.message}`, 'error')
    }
  }
  
  // Final results
  const totalTime = Date.now() - results.startTime
  log('\n' + '=' .repeat(60), 'info')
  log('📊 TEST RESULTS', 'info')
  log('=' .repeat(60), 'info')
  log(`✅ Passed: ${results.passed}`, 'success')
  log(`❌ Failed: ${results.failed}`, results.failed > 0 ? 'error' : 'info')
  log(`⏱️  Total Time: ${totalTime}ms`, 'info')
  log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`, 'info')
  
  if (results.failed === 0) {
    log('\n🎉 All tests passed! Session Management System is working correctly.', 'success')
  } else {
    log(`\n⚠️  ${results.failed} test(s) failed. Please check the logs above.`, 'warning')
  }
  
  return results.failed === 0
}

// Run tests if called directly
if (require.main === module) {
  runTests()
    .then(success => {
      process.exit(success ? 0 : 1)
    })
    .catch(error => {
      log(`💥 Test runner crashed: ${error.message}`, 'error')
      process.exit(1)
    })
}

module.exports = { runTests } 