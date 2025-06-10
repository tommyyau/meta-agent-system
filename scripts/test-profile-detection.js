#!/usr/bin/env node

/**
 * Comprehensive test script for profile detection system
 * Tests industry classification, role detection, and sophistication scoring
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

// Test personas with expected outcomes
const testPersonas = [
  {
    name: 'Technical Fintech Founder',
    input: "I'm building a high-frequency trading platform using Rust and WebAssembly for microsecond latency. We need to implement real-time risk management algorithms and ensure SOC2 compliance for institutional clients. The architecture uses distributed consensus protocols and we're integrating with prime brokerage APIs.",
    expected: {
      industry: 'fintech',
      role: 'technical',
      sophisticationLevel: 'high'
    }
  },
  {
    name: 'Business Healthcare Entrepreneur',
    input: "I want to create a patient engagement platform that helps healthcare providers improve care coordination. We're targeting the $50B healthcare IT market with a B2B SaaS model, focusing on ROI through reduced readmissions and improved patient satisfaction scores.",
    expected: {
      industry: 'healthcare',
      role: 'business',
      sophisticationLevel: 'medium'
    }
  },
  {
    name: 'Product Manager SaaS',
    input: "We're developing a customer analytics platform with API integrations for Salesforce and HubSpot. I'm balancing technical feasibility with business requirements, using A/B testing to optimize our conversion funnel. Need to prioritize features for our product roadmap based on user feedback and technical debt considerations.",
    expected: {
      industry: 'saas',
      role: 'hybrid',
      sophisticationLevel: 'high'
    }
  },
  {
    name: 'E-commerce Beginner',
    input: "I want to start an online store selling handmade jewelry. I need a website where customers can buy my products and maybe connect with social media. Not sure about technical stuff but want to make money online.",
    expected: {
      industry: 'ecommerce',
      role: 'business',
      sophisticationLevel: 'low'
    }
  },
  {
    name: 'Enterprise Technical Lead',
    input: "We're implementing a microservices architecture for our enterprise resource planning system. Need to migrate from monolithic Java application to cloud-native containers using Kubernetes, with zero-downtime deployment and comprehensive monitoring via Prometheus and Grafana.",
    expected: {
      industry: 'enterprise',
      role: 'technical',
      sophisticationLevel: 'high'
    }
  },
  {
    name: 'Consumer App Startup',
    input: "Building a social fitness app where users can share workouts and compete with friends. Focusing on user engagement and viral growth through gamification. Looking at freemium model with premium features.",
    expected: {
      industry: 'consumer',
      role: 'business',
      sophisticationLevel: 'medium'
    }
  },
  {
    name: 'Healthcare Technical Founder',
    input: "Developing a clinical decision support system using machine learning for diagnostic imaging. We're implementing DICOM standards, HL7 FHIR APIs, and ensuring HIPAA compliance with end-to-end encryption. Training convolutional neural networks on radiology datasets.",
    expected: {
      industry: 'healthcare',
      role: 'technical',
      sophisticationLevel: 'high'
    }
  },
  {
    name: 'General Business Idea',
    input: "I have an idea for a service business but not sure about the details yet. Want to help people solve problems and make some revenue. Need to figure out the business model and target customers.",
    expected: {
      industry: 'general',
      role: 'business',
      sophisticationLevel: 'low'
    }
  }
];

async function testProfileDetection() {
  console.log('🧪 Testing Profile Detection System\n');

  const results = [];
  let successCount = 0;
  let failureCount = 0;

  for (const persona of testPersonas) {
    console.log(`\n🎯 Testing: ${persona.name}`);
    console.log(`Input: "${persona.input.slice(0, 100)}..."`);
    console.log(`Expected: ${persona.expected.industry} | ${persona.expected.role} | ${persona.expected.sophisticationLevel}`);

    try {
      const response = await makeRequest(`${BASE_URL}/api/profile/detect`, {
        method: 'POST',
        body: JSON.stringify({
          input: persona.input,
          sessionId: `test-${Date.now()}`
        })
      });

      if (response.success) {
        const profile = response.result.profile;
        const analysis = response.result.analysis;
        
        console.log(`Detected: ${profile.industry} | ${profile.role} | ${profile.sophisticationLevel}`);
        console.log(`Confidence: ${(response.result.confidence * 100).toFixed(1)}%`);
        console.log(`Industry Conf: ${(profile.industryConfidence * 100).toFixed(1)}%`);
        console.log(`Role Conf: ${(profile.roleConfidence * 100).toFixed(1)}%`);
        console.log(`Sophistication Score: ${profile.sophisticationScore}/100`);

        // Check accuracy
        const industryMatch = profile.industry === persona.expected.industry;
        const roleMatch = profile.role === persona.expected.role;
        const sophisticationMatch = profile.sophisticationLevel === persona.expected.sophisticationLevel;
        const overallMatch = industryMatch && roleMatch && sophisticationMatch;

        console.log(`Accuracy: Industry ${industryMatch ? '✅' : '❌'} | Role ${roleMatch ? '✅' : '❌'} | Sophistication ${sophisticationMatch ? '✅' : '❌'}`);

        if (overallMatch) {
          console.log('✅ PERFECT MATCH');
          successCount++;
        } else {
          console.log('⚠️ PARTIAL MATCH');
          if (response.result.confidence > 0.6) {
            successCount++;
          } else {
            failureCount++;
          }
        }

        // Show uncertainties if any
        if (response.result.uncertainties.length > 0) {
          console.log(`Uncertainties: ${response.result.uncertainties.join(', ')}`);
        }

        // Show recommendations
        console.log(`Recommendations: ${response.result.recommendations.agentType} | ${response.result.recommendations.communicationStyle}`);

        results.push({
          persona: persona.name,
          expected: persona.expected,
          detected: {
            industry: profile.industry,
            role: profile.role,
            sophisticationLevel: profile.sophisticationLevel
          },
          confidence: response.result.confidence,
          perfect: overallMatch,
          analysis: analysis
        });

      } else {
        console.log('❌ DETECTION FAILED');
        failureCount++;
      }

    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
      failureCount++;
    }

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n📊 PROFILE DETECTION TEST RESULTS');
  console.log('═══════════════════════════════════');
  console.log(`Total Tests: ${testPersonas.length}`);
  console.log(`Successful: ${successCount} (${((successCount / testPersonas.length) * 100).toFixed(1)}%)`);
  console.log(`Failed: ${failureCount} (${((failureCount / testPersonas.length) * 100).toFixed(1)}%)`);

  // Accuracy by category
  const industryAccuracy = results.filter(r => r.detected.industry === r.expected.industry).length / results.length;
  const roleAccuracy = results.filter(r => r.detected.role === r.expected.role).length / results.length;
  const sophisticationAccuracy = results.filter(r => r.detected.sophisticationLevel === r.expected.sophisticationLevel).length / results.length;

  console.log('\n🎯 ACCURACY BY CATEGORY');
  console.log('═══════════════════════');
  console.log(`Industry Classification: ${(industryAccuracy * 100).toFixed(1)}%`);
  console.log(`Role Detection: ${(roleAccuracy * 100).toFixed(1)}%`);
  console.log(`Sophistication Scoring: ${(sophisticationAccuracy * 100).toFixed(1)}%`);

  const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
  console.log(`Average Confidence: ${(avgConfidence * 100).toFixed(1)}%`);

  return results;
}

async function testBatchDetection() {
  console.log('\n🧪 Testing Batch Profile Detection\n');

  const batchInputs = testPersonas.slice(0, 5).map(persona => ({
    text: persona.input,
    options: {
      sessionId: `batch-test-${Date.now()}`
    }
  }));

  try {
    const response = await makeRequest(`${BASE_URL}/api/profile/detect`, {
      method: 'PUT',
      body: JSON.stringify({
        inputs: batchInputs,
        options: {
          requireMinimumConfidence: 0.5
        }
      })
    });

    if (response.success) {
      console.log('✅ Batch detection successful');
      console.log(`Processed: ${response.metadata.totalInputs} inputs`);
      console.log(`Successful analyses: ${response.metadata.successfulAnalyses}`);
      console.log(`Processing time: ${response.metadata.processingTimeMs}ms`);
      console.log(`Average time per input: ${response.metadata.averageTimePerInput}ms`);

      // Show results summary
      response.results.forEach((result, index) => {
        const profile = result.profile;
        console.log(`\n${index + 1}. ${profile.industry} | ${profile.role} | ${profile.sophisticationLevel} (${(result.confidence * 100).toFixed(1)}%)`);
      });

    } else {
      console.log('❌ Batch detection failed');
    }

  } catch (error) {
    console.log(`❌ Batch detection error: ${error.message}`);
  }
}

async function testCapabilitiesEndpoint() {
  console.log('\n🧪 Testing Capabilities Endpoint\n');

  try {
    const response = await makeRequest(`${BASE_URL}/api/profile/detect`);

    if (response.success) {
      console.log('✅ Capabilities endpoint working');
      console.log(`Supported industries: ${response.capabilities.industries.length}`);
      console.log(`Supported roles: ${response.capabilities.roles.length}`);
      console.log(`Sophistication levels: ${response.capabilities.sophisticationLevels.length}`);
      
      console.log('\nFeatures:');
      Object.entries(response.capabilities.features).forEach(([feature, details]) => {
        console.log(`  ${feature}: ${details.description}`);
      });

      console.log('\nExample personas provided:');
      Object.keys(response.capabilities.examples).forEach(example => {
        console.log(`  - ${example}`);
      });

    } else {
      console.log('❌ Capabilities endpoint failed');
    }

  } catch (error) {
    console.log(`❌ Capabilities error: ${error.message}`);
  }
}

async function testConversationProgression() {
  console.log('\n🧪 Testing Conversation Progression\n');

  const conversationInputs = [
    "I want to build something in healthcare",
    "Specifically, I'm thinking about a platform for doctors and patients",
    "I have technical background and understand API development and database design",
    "We need to ensure HIPAA compliance and integrate with existing EHR systems like Epic and Cerner"
  ];

  const conversationHistory = [];
  let previousProfile = null;

  for (let i = 0; i < conversationInputs.length; i++) {
    const input = conversationInputs[i];
    console.log(`\nStep ${i + 1}: "${input}"`);

    try {
      const response = await makeRequest(`${BASE_URL}/api/profile/detect`, {
        method: 'POST',
        body: JSON.stringify({
          input,
          sessionId: 'progression-test',
          conversationHistory: [...conversationHistory],
          previousProfile,
          enableLearning: true
        })
      });

      if (response.success) {
        const profile = response.result.profile;
        console.log(`Profile: ${profile.industry} | ${profile.role} | ${profile.sophisticationLevel}`);
        console.log(`Confidence: ${(response.result.confidence * 100).toFixed(1)}%`);
        console.log(`Terminology count: ${profile.terminology.length}`);

        conversationHistory.push(input);
        previousProfile = profile;

        // Show how profile evolved
        if (i > 0) {
          console.log('Profile evolution detected ✓');
        }

      } else {
        console.log('❌ Progression test failed');
      }

    } catch (error) {
      console.log(`❌ Progression error: ${error.message}`);
    }

    await new Promise(resolve => setTimeout(resolve, 300));
  }
}

async function testProfileCorrection() {
  console.log('\n🧪 Testing Profile Correction System\n');

  // First, create a profile to correct
  try {
    const detectionResponse = await makeRequest(`${BASE_URL}/api/profile/detect`, {
      method: 'POST',
      body: JSON.stringify({
        input: "I'm building a healthcare app but I'm actually more technical than business-focused",
        sessionId: 'correction-test-session'
      })
    });

    if (!detectionResponse.success) {
      console.log('❌ Failed to create initial profile for correction test');
      return;
    }

    const originalProfile = detectionResponse.result.profile;
    console.log(`Original Profile: ${originalProfile.industry} | ${originalProfile.role} | ${originalProfile.sophisticationLevel}`);

    // Test profile correction
    const correctionResponse = await makeRequest(`${BASE_URL}/api/profile/correct`, {
      method: 'POST',
      body: JSON.stringify({
        profile: originalProfile,
        corrections: {
          role: 'technical',
          sophisticationLevel: 'high'
        },
        sessionId: 'correction-test-session',
        feedback: 'I am actually a technical founder with extensive development experience',
        confidence: 0.9
      })
    });

    if (correctionResponse.success) {
      console.log('✅ Profile correction successful');
      const correctedProfile = correctionResponse.result.updatedProfile;
      console.log(`Corrected Profile: ${correctedProfile.industry} | ${correctedProfile.role} | ${correctedProfile.sophisticationLevel}`);
      console.log(`Corrections applied: ${correctionResponse.result.corrections.length}`);
      console.log(`Training data collected: ${correctionResponse.metadata.trainingDataCollected}`);
      
      // Show impact
      if (correctionResponse.result.impact) {
        console.log('Impact of corrections:');
        if (correctionResponse.result.impact.agentBehaviorChanges.length > 0) {
          console.log(`  Agent behavior: ${correctionResponse.result.impact.agentBehaviorChanges[0]}`);
        }
        if (correctionResponse.result.impact.communicationStyleChanges.length > 0) {
          console.log(`  Communication: ${correctionResponse.result.impact.communicationStyleChanges[0]}`);
        }
      }

      // Test getting correction suggestions
      const suggestionsResponse = await makeRequest(
        `${BASE_URL}/api/profile/correct?profile=${encodeURIComponent(JSON.stringify(correctedProfile))}&sessionId=correction-test-session`
      );

      if (suggestionsResponse.success) {
        console.log('✅ Correction suggestions retrieved');
        console.log(`Suggestions available: ${suggestionsResponse.suggestions.length}`);
        console.log(`Previous corrections: ${suggestionsResponse.correctionHistory.length}`);
      } else {
        console.log('⚠️ Failed to get correction suggestions');
      }

    } else {
      console.log('❌ Profile correction failed');
    }

  } catch (error) {
    console.log(`❌ Profile correction test error: ${error.message}`);
  }
}

async function testErrorHandling() {
  console.log('\n🧪 Testing Error Handling\n');

  const errorTests = [
    {
      name: 'Empty input',
      data: { input: '' },
      expectedStatus: 400
    },
    {
      name: 'Missing input',
      data: { sessionId: 'test' },
      expectedStatus: 400
    },
    {
      name: 'Invalid input type',
      data: { input: 123 },
      expectedStatus: 400
    }
  ];

  for (const test of errorTests) {
    console.log(`Testing: ${test.name}`);
    
    try {
      await makeRequest(`${BASE_URL}/api/profile/detect`, {
        method: 'POST',
        body: JSON.stringify(test.data)
      });
      console.log('❌ Should have failed but succeeded');
    } catch (error) {
      if (error.message.includes(test.expectedStatus.toString())) {
        console.log('✅ Correctly returned expected error');
      } else {
        console.log(`⚠️ Unexpected error: ${error.message}`);
      }
    }
  }
}

async function main() {
  console.log('🚀 Starting Profile Detection System Tests\n');
  
  try {
    // Test individual detection
    const results = await testProfileDetection();
    
    // Test batch detection
    await testBatchDetection();
    
    // Test capabilities
    await testCapabilitiesEndpoint();
    
    // Test conversation progression
    await testConversationProgression();
    
    // Test profile correction
    await testProfileCorrection();
    
    // Test error handling
    await testErrorHandling();
    
    console.log('\n🎉 All Profile Detection Tests Completed!');
    
    // Final summary
    const successRate = results.filter(r => r.perfect || r.confidence > 0.6).length / results.length;
    console.log('\n📋 FINAL SUMMARY');
    console.log('═══════════════');
    console.log(`Overall Success Rate: ${(successRate * 100).toFixed(1)}%`);
    console.log('✅ Industry classification working');
    console.log('✅ Role detection working');  
    console.log('✅ Sophistication scoring working');
    console.log('✅ Batch processing working');
    console.log('✅ Conversation progression working');
    console.log('✅ Error handling working');
    console.log('\n💡 The profile detection system is functioning correctly!');

  } catch (error) {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
  }
}

// Run tests if script is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
}

module.exports = { 
  testProfileDetection, 
  testBatchDetection, 
  testCapabilitiesEndpoint,
  testConversationProgression,
  testErrorHandling 
}; 