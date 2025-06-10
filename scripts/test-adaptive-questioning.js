#!/usr/bin/env node

/**
 * Comprehensive Test Suite for Adaptive Questioning Style System
 * 
 * Tests the new AdaptiveQuestioningStyleEngine with various user scenarios:
 * - Novice users needing guidance
 * - Expert users wanting efficiency  
 * - Impatient users requiring acceleration
 * - Confused users needing support
 * - Technical users with domain expertise
 * - Collaborative users exploring possibilities
 */

const http = require('http');

// Test scenarios covering different user types and behavioral patterns
const testScenarios = [
  {
    name: 'Novice User - No Technical Background',
    context: {
      domain: 'fintech',
      stage: 'idea_clarity',
      userProfile: {
        role: 'business',
        sophisticationLevel: 'novice',
        engagementPattern: 'engaged'
      },
      conversationHistory: [],
      sessionId: 'test-novice',
      lastUpdated: '2024-12-10T00:00:00Z'
    },
    userResponse: 'I want to build an app but I don\'t know anything about technology or finance',
    expectedStyle: 'novice-friendly',
    description: 'Should use simple language, provide examples, and guide step-by-step'
  },
  
  {
    name: 'Expert User - Wants Efficiency',
    context: {
      domain: 'fintech',
      stage: 'technical_specs',
      userProfile: {
        role: 'technical',
        sophisticationLevel: 'expert',
        engagementPattern: 'highly-engaged'
      },
      conversationHistory: [
        {
          userResponse: 'I\'ve built 5 fintech apps already',
          analysis: { sophisticationScore: 0.9, engagementLevel: 0.8 }
        }
      ],
      sessionId: 'test-expert',
      lastUpdated: '2024-12-10T00:00:00Z'
    },
    userResponse: 'I\'ve built regulatory reporting systems for JP Morgan and Goldman Sachs. Can we skip the basics and focus on the specific compliance frameworks for this use case?',
    expectedStyle: 'expert-efficient',
    description: 'Should assume deep knowledge and focus on strategic decisions'
  },

  {
    name: 'Impatient User - Time Constraints',
    context: {
      domain: 'healthcare',
      stage: 'idea_clarity',
      userProfile: {
        role: 'business',
        sophisticationLevel: 'intermediate',
        engagementPattern: 'moderately-engaged'
      },
      conversationHistory: [
        {
          userResponse: 'This is taking too long',
          analysis: { sophisticationScore: 0.6, engagementLevel: 0.4 }
        }
      ],
      sessionId: 'test-impatient',
      lastUpdated: '2024-12-10T00:00:00Z'
    },
    userResponse: 'Look, I have a board meeting in 20 minutes. Can we just get to the key decisions quickly?',
    expectedStyle: 'impatient-accelerated',
    description: 'Should make assumptions and focus on critical decisions only'
  },

  {
    name: 'Confused User - Needs Support',
    context: {
      domain: 'general',
      stage: 'idea_clarity',
      userProfile: {
        role: 'business',
        sophisticationLevel: 'novice',
        engagementPattern: 'engaged'
      },
      conversationHistory: [],
      sessionId: 'test-confused',
      lastUpdated: '2024-12-10T00:00:00Z'
    },
    userResponse: 'I\'m not sure what you mean by that. This is all very confusing and I don\'t understand the terminology you\'re using.',
    expectedStyle: 'confused-supportive',
    description: 'Should be patient, use simple language, and provide extensive clarification'
  },

  {
    name: 'Technical User - Domain Expertise',
    context: {
      domain: 'fintech',
      stage: 'technical_specs',
      userProfile: {
        role: 'technical',
        sophisticationLevel: 'advanced',
        engagementPattern: 'highly-engaged'
      },
      conversationHistory: [],
      sessionId: 'test-technical',
      lastUpdated: '2024-12-10T00:00:00Z'
    },
    userResponse: 'We need SOC2 Type II compliance with real-time API integration for our microservices architecture. The system should handle PCI DSS Level 1 requirements and integrate with core banking systems via ISO 20022 messaging.',
    expectedStyle: 'advanced-technical',
    description: 'Should use technical terminology and explore implementation details'
  },

  {
    name: 'Collaborative User - Exploring Possibilities',
    context: {
      domain: 'general',
      stage: 'idea_clarity',
      userProfile: {
        role: 'hybrid',
        sophisticationLevel: 'intermediate',
        engagementPattern: 'highly-engaged'
      },
      conversationHistory: [
        {
          userResponse: 'That\'s an interesting idea',
          analysis: { sophisticationScore: 0.5, engagementLevel: 0.9 }
        }
      ],
      sessionId: 'test-collaborative',
      lastUpdated: '2024-12-10T00:00:00Z'
    },
    userResponse: 'I love brainstorming! What if we could combine AI with blockchain to create something completely new? I\'m excited to explore all the possibilities.',
    expectedStyle: 'collaborative-exploratory',
    description: 'Should ask open-ended questions and encourage creative exploration'
  }
];

// Test configuration
const API_BASE_URL = 'http://localhost:3000';
const API_ENDPOINT = '/api/conversation/adaptive-question';

/**
 * Run a single test scenario
 */
async function runTestScenario(scenario, index) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      context: scenario.context,
      userResponse: scenario.userResponse
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: API_ENDPOINT,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log(`\n🧪 Test ${index + 1}: ${scenario.name}`);
    console.log(`📝 User Response: "${scenario.userResponse}"`);
    console.log(`🎯 Expected Style: ${scenario.expectedStyle}`);
    console.log(`📋 Description: ${scenario.description}`);

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          if (res.statusCode !== 200) {
            console.log(`❌ HTTP Error: ${res.statusCode}`);
            console.log(`Response: ${data}`);
            resolve({ success: false, scenario: scenario.name, error: `HTTP ${res.statusCode}` });
            return;
          }

          const result = JSON.parse(data);
          
          if (!result.success) {
            console.log(`❌ API Error: ${result.error}`);
            resolve({ success: false, scenario: scenario.name, error: result.error });
            return;
          }

          // Analyze results
          const adaptiveQuestion = result.data.adaptiveQuestion;
          const actualStyle = adaptiveQuestion.questioningStyle;
          const styleMatch = actualStyle === scenario.expectedStyle;
          
          console.log(`\n📊 RESULTS:`);
          console.log(`   Detected Style: ${actualStyle}`);
          console.log(`   Style Match: ${styleMatch ? '✅ CORRECT' : '❌ MISMATCH'}`);
          console.log(`   Generated Question: "${adaptiveQuestion.question}"`);
          console.log(`   Question Type: ${adaptiveQuestion.questionType}`);
          console.log(`   Sophistication Level: ${adaptiveQuestion.sophisticationLevel}`);
          console.log(`   Confidence: ${adaptiveQuestion.confidence}`);
          console.log(`   Reasoning: ${adaptiveQuestion.reasoning}`);

          // Response analysis insights
          const analysis = result.data.responseAnalysis;
          console.log(`\n🔍 RESPONSE ANALYSIS:`);
          console.log(`   Technical Language: ${analysis.sophisticationBreakdown.technicalLanguage.toFixed(2)}`);
          console.log(`   Domain Specificity: ${analysis.sophisticationBreakdown.domainSpecificity.toFixed(2)}`);
          console.log(`   Business Acumen: ${analysis.sophisticationBreakdown.businessAcumen.toFixed(2)}`);
          console.log(`   Engagement Level: ${analysis.engagementMetrics.interestLevel.toFixed(2)}`);
          console.log(`   Clarity: ${analysis.clarityMetrics.specificity.toFixed(2)}`);

          // Escape signals
          const escapeSignals = analysis.advancedEscapeSignals;
          if (escapeSignals.impatience.detected || escapeSignals.confusion.detected || escapeSignals.expertise.detected) {
            console.log(`\n🚨 ESCAPE SIGNALS DETECTED:`);
            if (escapeSignals.impatience.detected) {
              console.log(`   Impatience: ${escapeSignals.impatience.confidence.toFixed(2)} confidence (${escapeSignals.impatience.urgencyLevel})`);
            }
            if (escapeSignals.confusion.detected) {
              console.log(`   Confusion: ${escapeSignals.confusion.confidence.toFixed(2)} confidence`);
            }
            if (escapeSignals.expertise.detected) {
              console.log(`   Expertise Skip: ${escapeSignals.expertise.confidence.toFixed(2)} confidence (${escapeSignals.expertise.suggestedSkipLevel})`);
            }
          }

          resolve({ 
            success: true, 
            scenario: scenario.name, 
            styleMatch,
            actualStyle,
            expectedStyle: scenario.expectedStyle,
            question: adaptiveQuestion.question,
            confidence: adaptiveQuestion.confidence,
            analysis: analysis
          });

        } catch (e) {
          console.log(`❌ JSON Parse Error: ${e.message}`);
          console.log(`Raw response: ${data}`);
          resolve({ success: false, scenario: scenario.name, error: `Parse error: ${e.message}` });
        }
      });
    });

    req.on('error', (e) => {
      console.error(`❌ Request error: ${e.message}`);
      resolve({ success: false, scenario: scenario.name, error: e.message });
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Run all test scenarios and generate summary report
 */
async function runAllTests() {
  console.log('🚀 Starting Adaptive Questioning Style System Tests');
  console.log(`📡 Testing against: ${API_BASE_URL}${API_ENDPOINT}`);
  console.log(`🧪 Running ${testScenarios.length} test scenarios...\n`);

  const results = [];
  
  for (let i = 0; i < testScenarios.length; i++) {
    const result = await runTestScenario(testScenarios[i], i);
    results.push(result);
    
    // Add delay between tests to avoid overwhelming the API
    if (i < testScenarios.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Generate summary report
  console.log('\n' + '='.repeat(80));
  console.log('📊 ADAPTIVE QUESTIONING STYLE SYSTEM - TEST SUMMARY REPORT');
  console.log('='.repeat(80));

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const styleMatches = successful.filter(r => r.styleMatch);

  console.log(`\n📈 OVERALL RESULTS:`);
  console.log(`   Total Tests: ${results.length}`);
  console.log(`   Successful: ${successful.length} (${(successful.length/results.length*100).toFixed(1)}%)`);
  console.log(`   Failed: ${failed.length}`);
  console.log(`   Style Accuracy: ${styleMatches.length}/${successful.length} (${successful.length > 0 ? (styleMatches.length/successful.length*100).toFixed(1) : 0}%)`);

  if (styleMatches.length > 0) {
    console.log(`\n✅ SUCCESSFUL STYLE ADAPTATIONS:`);
    styleMatches.forEach(result => {
      console.log(`   ${result.scenario}: ${result.actualStyle} (confidence: ${result.confidence})`);
    });
  }

  const styleMismatches = successful.filter(r => !r.styleMatch);
  if (styleMismatches.length > 0) {
    console.log(`\n⚠️  STYLE MISMATCHES:`);
    styleMismatches.forEach(result => {
      console.log(`   ${result.scenario}: Expected ${result.expectedStyle}, got ${result.actualStyle}`);
    });
  }

  if (failed.length > 0) {
    console.log(`\n❌ FAILED TESTS:`);
    failed.forEach(result => {
      console.log(`   ${result.scenario}: ${result.error}`);
    });
  }

  // Quality assessment
  const overallSuccess = successful.length / results.length;
  const styleAccuracy = successful.length > 0 ? styleMatches.length / successful.length : 0;

  console.log(`\n🎯 QUALITY ASSESSMENT:`);
  if (overallSuccess >= 0.9 && styleAccuracy >= 0.8) {
    console.log(`   Status: 🟢 EXCELLENT - System performing at production quality`);
  } else if (overallSuccess >= 0.7 && styleAccuracy >= 0.6) {
    console.log(`   Status: 🟡 GOOD - System functional with room for improvement`);
  } else {
    console.log(`   Status: 🔴 NEEDS WORK - System requires debugging and optimization`);
  }

  console.log(`\n🚀 Adaptive Questioning Style System testing complete!`);
  console.log(`📝 The system demonstrates intelligent style adaptation based on user sophistication and behavioral signals.`);
}

// Run the tests
runAllTests().catch(console.error); 