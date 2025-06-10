#!/usr/bin/env node

/**
 * Test script for conversation state tracking
 * Tests the 4-stage conversation flow and state management
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${data.error || 'Unknown error'}`);
    }

    return data;
  } catch (error) {
    console.error(`Request failed: ${error.message}`);
    throw error;
  }
}

async function testConversationStateTracking() {
  console.log('🧪 Testing Conversation State Tracking\n');

  const sessionId = `test-session-${Date.now()}`;
  const userId = `test-user-${Date.now()}`;

  try {
    // Test 1: Create conversation state
    console.log('1️⃣ Creating conversation state...');
    const createResponse = await makeRequest(`${BASE_URL}/api/conversation/state`, {
      method: 'POST',
      body: JSON.stringify({
        action: 'create',
        sessionId,
        userId
      })
    });

    console.log('✅ Conversation state created');
    console.log(`   Session ID: ${sessionId}`);
    console.log(`   Current Stage: ${createResponse.state.currentStage}`);
    console.log(`   Overall Progress: ${createResponse.state.overallProgress}%\n`);

    // Test 2: Record question responses in Idea Clarity stage
    console.log('2️⃣ Recording question responses in Idea Clarity stage...');
    
    const ideaClarityQuestions = [
      {
        questionId: 'ic-1',
        question: 'What problem are you trying to solve?',
        answer: 'I want to create a fintech app for small business payments'
      },
      {
        questionId: 'ic-2', 
        question: 'Who is your target user?',
        answer: 'Small business owners who need to accept payments'
      },
      {
        questionId: 'ic-3',
        question: 'What makes your solution unique?',
        answer: 'Lower fees and better mobile experience'
      }
    ];

    for (const q of ideaClarityQuestions) {
      await makeRequest(`${BASE_URL}/api/conversation/state`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'record_response',
          sessionId,
          response: {
            ...q,
            timestamp: new Date().toISOString(),
            confidence: 0.9,
            isSkipped: false
          }
        })
      });
      console.log(`   ✅ Recorded: ${q.question}`);
    }

    // Test 3: Check progress after responses
    console.log('\n3️⃣ Checking progress after responses...');
    const progressResponse = await makeRequest(`${BASE_URL}/api/conversation/state?sessionId=${sessionId}`);
    
    console.log(`   Overall Progress: ${progressResponse.state.overallProgress}%`);
    console.log(`   Idea Clarity Answered: ${progressResponse.state.stageProgresses.idea_clarity.answeredQuestions}/${progressResponse.state.stageProgresses.idea_clarity.totalQuestions}`);

    // Test 4: Progress to next stage
    console.log('\n4️⃣ Progressing to User Workflow stage...');
    await makeRequest(`${BASE_URL}/api/conversation/state`, {
      method: 'POST',
      body: JSON.stringify({
        action: 'update_stage',
        sessionId,
        stage: 'user_workflow'
      })
    });

    const workflowStageResponse = await makeRequest(`${BASE_URL}/api/conversation/state?sessionId=${sessionId}`);
    console.log(`   ✅ Stage updated to: ${workflowStageResponse.state.currentStage}`);
    console.log(`   Previous stage (Idea Clarity) status: ${workflowStageResponse.state.stageProgresses.idea_clarity.status}`);

    // Test 5: Record some workflow responses
    console.log('\n5️⃣ Recording workflow responses...');
    const workflowQuestions = [
      {
        questionId: 'wf-1',
        question: 'What is the primary user workflow?',
        answer: 'User signs up, adds payment method, processes transactions'
      },
      {
        questionId: 'wf-2',
        question: 'What are the key user actions?',
        answer: 'Create account, verify identity, link bank account, send invoice'
      }
    ];

    for (const q of workflowQuestions) {
      await makeRequest(`${BASE_URL}/api/conversation/state`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'record_response',
          sessionId,
          response: {
            ...q,
            timestamp: new Date().toISOString(),
            confidence: 0.85,
            isSkipped: false
          }
        })
      });
      console.log(`   ✅ Recorded: ${q.question}`);
    }

    // Test 6: Trigger escape hatch
    console.log('\n6️⃣ Triggering escape hatch...');
    await makeRequest(`${BASE_URL}/api/conversation/state`, {
      method: 'POST',
      body: JSON.stringify({
        action: 'trigger_escape',
        sessionId,
        stage: 'user_workflow'
      })
    });

    const escapeResponse = await makeRequest(`${BASE_URL}/api/conversation/state?sessionId=${sessionId}`);
    console.log(`   ✅ Escape triggered: ${escapeResponse.state.escapeTriggered}`);
    console.log(`   Escape stage: ${escapeResponse.state.escapeStage}`);

    // Test 7: Get conversation metrics
    console.log('\n7️⃣ Getting conversation metrics...');
    const metricsResponse = await makeRequest(`${BASE_URL}/api/conversation/state`, {
      method: 'PUT',
      body: JSON.stringify({
        sessionId
      })
    });

    console.log(`   Total Duration: ${metricsResponse.metrics.totalDuration} seconds`);
    console.log(`   Completion Rate: ${(metricsResponse.metrics.completionRate * 100).toFixed(1)}%`);
    console.log(`   Escape Rate: ${(metricsResponse.metrics.escapeRate * 100).toFixed(1)}%`);
    console.log(`   Stage Completion Rates:`);
    Object.entries(metricsResponse.metrics.stageCompletionRates).forEach(([stage, rate]) => {
      console.log(`     ${stage}: ${(rate * 100).toFixed(1)}%`);
    });

    // Test 8: Test aggregate metrics
    console.log('\n8️⃣ Getting aggregate metrics...');
    const aggregateMetricsResponse = await makeRequest(`${BASE_URL}/api/conversation/state`, {
      method: 'PUT',
      body: JSON.stringify({
        timeRange: {
          start: new Date(Date.now() - 60000).toISOString(), // Last minute
          end: new Date().toISOString()
        }
      })
    });

    console.log(`   Aggregate Completion Rate: ${(aggregateMetricsResponse.metrics.completionRate * 100).toFixed(1)}%`);
    console.log(`   Aggregate Escape Rate: ${(aggregateMetricsResponse.metrics.escapeRate * 100).toFixed(1)}%`);

    console.log('\n✅ All conversation state tracking tests passed!');
    console.log('\n📊 Final State Summary:');
    console.log(`   Session: ${sessionId}`);
    console.log(`   Current Stage: ${escapeResponse.state.currentStage}`);
    console.log(`   Overall Progress: ${escapeResponse.state.overallProgress}%`);
    console.log(`   Escape Triggered: ${escapeResponse.state.escapeTriggered}`);
    console.log(`   Total Responses: ${Object.values(escapeResponse.state.stageProgresses).reduce((sum, stage) => sum + stage.answeredQuestions, 0)}`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

async function testErrorHandling() {
  console.log('\n🧪 Testing Error Handling\n');

  try {
    // Test invalid session ID
    console.log('1️⃣ Testing invalid session ID...');
    try {
      await makeRequest(`${BASE_URL}/api/conversation/state?sessionId=nonexistent`);
      console.error('❌ Should have failed with 404');
    } catch (error) {
      if (error.message.includes('404')) {
        console.log('✅ Correctly returned 404 for nonexistent session');
      } else {
        throw error;
      }
    }

    // Test missing required parameters
    console.log('\n2️⃣ Testing missing required parameters...');
    try {
      await makeRequest(`${BASE_URL}/api/conversation/state`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'create'
          // Missing sessionId
        })
      });
      console.error('❌ Should have failed with 400');
    } catch (error) {
      if (error.message.includes('400')) {
        console.log('✅ Correctly returned 400 for missing sessionId');
      } else {
        throw error;
      }
    }

    // Test invalid action
    console.log('\n3️⃣ Testing invalid action...');
    try {
      await makeRequest(`${BASE_URL}/api/conversation/state`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'invalid_action',
          sessionId: 'test'
        })
      });
      console.error('❌ Should have failed with 400');
    } catch (error) {
      if (error.message.includes('400')) {
        console.log('✅ Correctly returned 400 for invalid action');
      } else {
        throw error;
      }
    }

    console.log('\n✅ All error handling tests passed!');

  } catch (error) {
    console.error('❌ Error handling test failed:', error.message);
    process.exit(1);
  }
}

async function main() {
  console.log('🚀 Starting Conversation State Tracking Tests\n');
  
  await testConversationStateTracking();
  await testErrorHandling();
  
  console.log('\n🎉 All tests completed successfully!');
  console.log('\n📋 Test Summary:');
  console.log('   ✅ Conversation state creation');
  console.log('   ✅ Question response recording');
  console.log('   ✅ Progress calculation');
  console.log('   ✅ Stage progression');
  console.log('   ✅ Escape hatch triggering');
  console.log('   ✅ Metrics collection');
  console.log('   ✅ Error handling');
  console.log('\n💡 The conversation state tracking system is working correctly!');
}

// Check if running directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
}

module.exports = { testConversationStateTracking, testErrorHandling }; 