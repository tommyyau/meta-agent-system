#!/usr/bin/env node

/**
 * Quick Dynamic Conversation Test
 * 
 * Simple test to validate the conversation engine is working
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

async function testQuestionGeneration() {
  console.log('🔥 Testing Dynamic Question Generation...')
  
  const context = {
    sessionId: 'quick-test-001',
    domain: 'fintech',
    stage: 'idea_clarity',
    userProfile: {
      role: 'founder',
      sophisticationLevel: 'intermediate'
    },
    conversationHistory: [],
    lastUpdated: new Date().toISOString()
  }

  try {
    const response = await fetch(`${API_BASE}/api/conversation/dynamic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'generate_question',
        context
      })
    })

    const data = await response.json()
    
    if (data.success && data.question) {
      console.log('✅ SUCCESS! Question generated:')
      console.log(`   "${data.question.question}"`)
      console.log(`   Type: ${data.question.questionType}`)
      console.log(`   Sophistication: ${data.question.sophisticationLevel}`)
      return true
    } else {
      console.log('❌ FAILED! Response:', JSON.stringify(data, null, 2))
      return false
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message)
    return false
  }
}

async function testResponseAnalysis() {
  console.log('\n🧠 Testing Response Analysis...')
  
  const context = {
    sessionId: 'quick-test-002',
    domain: 'fintech',
    stage: 'idea_clarity',
    userProfile: {
      role: 'founder',
      sophisticationLevel: 'intermediate'
    },
    conversationHistory: [],
    lastUpdated: new Date().toISOString()
  }

  try {
    const response = await fetch(`${API_BASE}/api/conversation/dynamic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'analyze_response',
        userResponse: 'I want to build a fintech app for regulatory compliance',
        context
      })
    })

    const data = await response.json()
    
    if (data.success && data.analysis) {
      console.log('✅ SUCCESS! Response analyzed:')
      console.log(`   Sophistication: ${data.analysis.sophisticationScore}`)
      console.log(`   Engagement: ${data.analysis.engagementLevel}`)
      console.log(`   Entities: ${data.analysis.extractedEntities?.join(', ') || 'none'}`)
      return true
    } else {
      console.log('❌ FAILED! Response:', JSON.stringify(data, null, 2))
      return false
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message)
    return false
  }
}

async function runQuickTest() {
  console.log('🚀 Quick Dynamic Conversation Test\n')
  
  const test1 = await testQuestionGeneration()
  const test2 = await testResponseAnalysis()
  
  console.log('\n📊 Results:')
  console.log(`Question Generation: ${test1 ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`Response Analysis: ${test2 ? '✅ PASS' : '❌ FAIL'}`)
  
  if (test1 && test2) {
    console.log('\n🎉 All tests passed! Dynamic conversation engine is working!')
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.')
  }
}

runQuickTest().catch(console.error) 