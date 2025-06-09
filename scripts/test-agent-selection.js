#!/usr/bin/env node

/**
 * Agent Selection Framework Test Script
 * 
 * Tests the agent selection logic with various user profiles and agent templates
 */

const { execSync } = require('child_process')

// Test data
const testProfiles = [
  {
    id: 'test-fintech-technical',
    industry: 'fintech',
    industryConfidence: 0.9,
    role: 'technical',
    roleConfidence: 0.8,
    sophisticationLevel: 'high',
    sophisticationScore: 0.85,
    conversationHistory: [],
    detectedKeywords: ['api', 'payment', 'compliance', 'security'],
    terminology: ['rest', 'microservices', 'oauth', 'pci-dss'],
    preferredCommunicationStyle: 'technical',
    assumptionTolerance: 'low',
    created: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    analysisVersion: '1.0.0'
  },
  {
    id: 'test-healthcare-business',
    industry: 'healthcare',
    industryConfidence: 0.7,
    role: 'business',
    roleConfidence: 0.6,
    sophisticationLevel: 'medium',
    sophisticationScore: 0.5,
    conversationHistory: [],
    detectedKeywords: ['patient', 'workflow', 'compliance', 'efficiency'],
    terminology: ['hipaa', 'ehr', 'workflow', 'patient-care'],
    preferredCommunicationStyle: 'formal',
    assumptionTolerance: 'medium',
    created: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    analysisVersion: '1.0.0'
  },
  {
    id: 'test-general-unknown',
    industry: 'general',
    industryConfidence: 0.3,
    role: 'unknown',
    roleConfidence: 0.2,
    sophisticationLevel: 'low',
    sophisticationScore: 0.3,
    conversationHistory: [],
    detectedKeywords: ['app', 'simple', 'easy'],
    terminology: ['mobile', 'user-friendly'],
    preferredCommunicationStyle: 'casual',
    assumptionTolerance: 'high',
    created: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    analysisVersion: '1.0.0'
  }
]

const testAgents = [
  {
    id: 'fintech-expert',
    name: 'Fintech Expert Agent',
    domain: 'fintech',
    version: '1.0.0',
    description: 'Specialized agent for complex fintech applications',
    questionBank: [
      {
        id: 'fintech-compliance',
        category: 'compliance',
        questions: [
          {
            id: 'pci-requirements',
            text: 'What PCI DSS compliance level do you need?',
            type: 'choice',
            options: ['Level 1', 'Level 2', 'Level 3', 'Level 4'],
            required: true
          }
        ],
        priority: 1
      }
    ],
         terminology: {
       'api': 'Application Programming Interface',
       'pci': 'Payment Card Industry',
       'kyc': 'Know Your Customer',
       'aml': 'Anti-Money Laundering'
     },
    assumptionTemplates: [],
    conversationFlow: {
      stages: ['compliance-check', 'technical-specs', 'integration-planning'],
      transitions: {},
      configuration: {}
    },
    metadata: {
      created: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      deploymentCount: 15
    }
  },
  {
    id: 'healthcare-business',
    name: 'Healthcare Business Agent',
    domain: 'healthcare',
    version: '1.0.0',
    description: 'Business-focused agent for healthcare workflows',
    questionBank: [
      {
        id: 'healthcare-workflow',
        category: 'workflow',
        questions: [
          {
            id: 'patient-flow',
            text: 'Describe your current patient workflow',
            type: 'text',
            required: true
          }
        ],
        priority: 1
      }
    ],
         terminology: {
       'ehr': 'Electronic Health Record',
       'hipaa': 'Health Insurance Portability and Accountability Act',
       'patient': 'Healthcare Service Recipient'
     },
    assumptionTemplates: [],
    conversationFlow: {
      stages: ['workflow-analysis', 'compliance-review', 'solution-design'],
      transitions: {},
      configuration: {}
    },
    metadata: {
      created: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      deploymentCount: 8
    }
  },
  {
    id: 'general-business',
    name: 'General Business Agent',
    domain: 'general',
    version: '1.0.0',
    description: 'General purpose business application agent',
    questionBank: [
      {
        id: 'general-requirements',
        category: 'general',
        questions: [
          {
            id: 'app-purpose',
            text: 'What is the main purpose of your application?',
            type: 'text',
            required: true
          }
        ],
        priority: 1
      }
    ],
         terminology: {
       'app': 'Application',
       'user': 'End User',
       'feature': 'Functionality'
     },
    assumptionTemplates: [],
    conversationFlow: {
      stages: ['idea-clarity', 'user-workflow', 'technical-specs'],
      transitions: {},
      configuration: {}
    },
    metadata: {
      created: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      deploymentCount: 25
    }
  }
]

async function testAgentSelection() {
  console.log('🧪 Testing Agent Selection Framework...\n')

  try {
    // Test each profile against all agents
    for (const profile of testProfiles) {
      console.log(`\n📋 Testing Profile: ${profile.id}`)
      console.log(`   Industry: ${profile.industry} (${profile.industryConfidence})`)
      console.log(`   Role: ${profile.role} (${profile.roleConfidence})`)
      console.log(`   Sophistication: ${profile.sophisticationLevel} (${profile.sophisticationScore})`)

      const testData = {
        profile,
        availableAgents: testAgents,
        context: {
          timePressure: 'medium',
          prioritizeExperience: false
        }
      }

      try {
        const response = await fetch('http://localhost:3000/api/agents/select', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(testData)
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const result = await response.json()
        
        if (result.success) {
          const selection = result.result
          console.log(`   ✅ Selected: ${selection.selectedAgent?.name || 'None'}`)
          console.log(`   📊 Confidence: ${(selection.confidence * 100).toFixed(1)}%`)
          console.log(`   🎯 Score: ${(selection.score * 100).toFixed(1)}%`)
          console.log(`   💭 Reasoning: ${selection.reasoning}`)
          console.log(`   🔄 Method: ${selection.selectionMethod}`)
          
          if (selection.alternatives && selection.alternatives.length > 0) {
            console.log(`   🔄 Alternatives: ${selection.alternatives.length}`)
            selection.alternatives.forEach((alt, index) => {
              console.log(`      ${index + 1}. ${alt.agent.name} (${(alt.score * 100).toFixed(1)}%)`)
            })
          }
        } else {
          console.log(`   ❌ Selection failed: ${result.error}`)
        }

      } catch (error) {
        console.log(`   ❌ Request failed: ${error.message}`)
      }
    }

    // Test analytics endpoint
    console.log('\n📈 Testing Analytics Endpoint...')
    try {
      const analyticsResponse = await fetch('http://localhost:3000/api/agents/select')
      
      if (analyticsResponse.ok) {
        const analyticsResult = await analyticsResponse.json()
        
        if (analyticsResult.success) {
          const analytics = analyticsResult.analytics
          console.log(`   📊 Total Selections: ${analytics.totalSelections}`)
          console.log(`   ✅ Success Rate: ${(analytics.successRate * 100).toFixed(1)}%`)
          console.log(`   🎯 Average Confidence: ${(analytics.averageConfidence * 100).toFixed(1)}%`)
          console.log(`   💾 Cache Hit Rate: ${(analytics.cacheHitRate * 100).toFixed(1)}%`)
          console.log(`   ⏱️  Average Selection Time: ${analytics.averageSelectionTime}ms`)
        } else {
          console.log(`   ❌ Analytics failed: ${analyticsResult.error}`)
        }
      } else {
        console.log(`   ❌ Analytics request failed: ${analyticsResponse.status}`)
      }
    } catch (error) {
      console.log(`   ❌ Analytics request failed: ${error.message}`)
    }

    console.log('\n✅ Agent Selection Framework testing completed!')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000/api/health')
    if (response.ok) {
      console.log('✅ Development server is running')
      return true
    }
  } catch (error) {
    console.log('❌ Development server is not running')
    console.log('   Please run: npm run dev')
    return false
  }
}

// Main execution
async function main() {
  console.log('🚀 Agent Selection Framework Test\n')
  
  const serverRunning = await checkServer()
  if (!serverRunning) {
    process.exit(1)
  }

  await testAgentSelection()
}

// Add fetch polyfill for Node.js
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch')
}

main().catch(console.error) 