#!/usr/bin/env node

/**
 * Simple Session Management System Test
 * Tests the core functionality without API calls
 */

const { sessionManagementSystem } = require('../lib/services/session-management-system')

async function testSessionManagement() {
  console.log('🧪 Testing Session Management System Core...')
  
  try {
    // Test session creation
    console.log('\n1. Creating session...')
    const session = await sessionManagementSystem.createSession('test-session-123')
    console.log(`✅ Created session: ${session.sessionId}`)
    
    // Test session retrieval
    console.log('\n2. Retrieving session...')
    const retrievedSession = await sessionManagementSystem.getSession('test-session-123')
    if (retrievedSession) {
      console.log(`✅ Retrieved session: ${retrievedSession.sessionId}`)
    } else {
      console.log(`❌ Failed to retrieve session`)
      return false
    }
    
    // Test session analytics
    console.log('\n3. Getting analytics...')
    const analytics = sessionManagementSystem.getSessionAnalytics()
    console.log(`✅ Analytics: ${analytics.activeSessions} active sessions`)
    
    // Test session health
    console.log('\n4. Checking health...')
    const health = await sessionManagementSystem.getHealthStatus()
    console.log(`✅ Health: ${health.status}`)
    
    // Test session deletion
    console.log('\n5. Deleting session...')
    const deleted = await sessionManagementSystem.deleteSession('test-session-123')
    console.log(`✅ Deleted session: ${deleted}`)
    
    // Verify deletion
    console.log('\n6. Verifying deletion...')
    const deletedSession = await sessionManagementSystem.getSession('test-session-123')
    if (!deletedSession) {
      console.log(`✅ Session properly deleted`)
    } else {
      console.log(`❌ Session still exists after deletion`)
      return false
    }
    
    console.log('\n🎉 All core tests passed!')
    return true
    
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`)
    return false
  }
}

// Run test
testSessionManagement()
  .then(success => {
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error(`💥 Test crashed: ${error.message}`)
    process.exit(1)
  }) 