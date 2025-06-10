import { NextRequest, NextResponse } from 'next/server'
import { DynamicConversationEngine } from '../../../../lib/conversation/dynamic-conversation-engine'
import type { ConversationContext } from '../../../../lib/types/conversation'

// Configure runtime for longer OpenAI API calls
export const runtime = 'nodejs'
export const maxDuration = 30

/**
 * Test endpoint for adaptive questioning style system
 * 
 * Tests the new AdaptiveQuestioningStyleEngine integration with real-time style adaptation
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { context, userResponse } = body

    if (!context || !userResponse) {
      return NextResponse.json(
        { error: 'Missing required fields: context and userResponse' },
        { status: 400 }
      )
    }

    // Initialize the enhanced conversation engine
    const engine = new DynamicConversationEngine()

    // First analyze the user response
    const responseAnalysis = await engine.analyzeResponse(userResponse, context)

    // Generate adaptive question with style matching
    const adaptiveResult = await engine.generateAdaptiveQuestion(context, responseAnalysis)

    // Monitor style effectiveness if there's a current style
    let styleMonitoring = null
    if (context.metadata?.currentQuestioningStyle) {
      styleMonitoring = engine.monitorQuestioningStyleEffectiveness(
        context,
        context.metadata.currentQuestioningStyle,
        responseAnalysis
      )
    }

    // Also test quick sophistication check for comparison
    const sophisticationCheck = await engine.quickSophisticationCheck(userResponse, context.domain)

    return NextResponse.json({
      success: true,
      data: {
        userResponse,
        responseAnalysis: {
          sophisticationBreakdown: responseAnalysis.sophisticationBreakdown,
          clarityMetrics: responseAnalysis.clarityMetrics,
          engagementMetrics: responseAnalysis.engagementMetrics,
          advancedEscapeSignals: responseAnalysis.advancedEscapeSignals,
          adaptationRecommendations: responseAnalysis.adaptationRecommendations
        },
        adaptiveQuestion: {
          question: adaptiveResult.question,
          questionType: adaptiveResult.questionType,
          sophisticationLevel: adaptiveResult.sophisticationLevel,
          domainContext: adaptiveResult.domainContext,
          followUpSuggestions: adaptiveResult.followUpSuggestions,
          confidence: adaptiveResult.confidence,
          reasoning: adaptiveResult.reasoning,
          questioningStyle: adaptiveResult.questioningStyle,
          styleProfile: (adaptiveResult.metadata as any)?.styleProfile
        },
        styleMonitoring,
        sophisticationCheck,
        metadata: {
          timestamp: new Date().toISOString(),
          model: 'gpt-4o-mini',
          domain: context.domain,
          stage: context.stage,
          adaptiveStyleUsed: true
        }
      }
    })

  } catch (error) {
    console.error('Error in adaptive questioning test:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to generate adaptive question',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to provide test examples and documentation
 */
export async function GET() {
  return NextResponse.json({
    description: 'Adaptive Questioning Style API',
    version: '1.0.0',
    endpoints: {
      POST: {
        description: 'Generate questions with adaptive style matching user sophistication and engagement',
        required_fields: ['context', 'userResponse'],
        example_request: {
          context: {
            domain: 'fintech',
            stage: 'idea_clarity',
            userProfile: {
              role: 'business',
              sophisticationLevel: 'intermediate',
              engagementPattern: 'engaged'
            },
            conversationHistory: [],
            sessionId: 'test-session',
            lastUpdated: '2024-12-10T00:00:00Z',
            metadata: {
              currentQuestioningStyle: 'intermediate-guided'
            }
          },
          userResponse: 'I want to build a payment processing solution but I\'m not sure about the technical details'
        }
      }
    },
    features: [
      'Real-time questioning style adaptation',
      'Multi-dimensional user analysis (sophistication, engagement, behavioral signals)',
      'Seven distinct questioning styles (novice-friendly to expert-efficient)',
      'Style effectiveness monitoring and recommendations',
      'Seamless integration with domain expertise',
      'Behavioral signal detection (impatience, confusion, expertise skip)',
      'Dynamic style switching based on conversation flow'
    ],
    questioning_styles: [
      {
        style: 'novice-friendly',
        description: 'Simple, educational, step-by-step approach with many examples',
        use_case: 'New users, unfamiliar with domain, need guidance'
      },
      {
        style: 'intermediate-guided',
        description: 'Balanced approach with business terminology and moderate depth',
        use_case: 'Business users with some domain knowledge'
      },
      {
        style: 'advanced-technical',
        description: 'Technical focus with industry terminology and deep exploration',
        use_case: 'Technical users with strong domain knowledge'
      },
      {
        style: 'expert-efficient',
        description: 'Rapid, peer-level conversation assuming deep expertise',
        use_case: 'Domain experts who want efficient, strategic discussions'
      },
      {
        style: 'impatient-accelerated',
        description: 'Quick, assumption-heavy approach for time-pressed users',
        use_case: 'Users showing impatience or time constraints'
      },
      {
        style: 'confused-supportive',
        description: 'Patient, empathetic approach with extensive clarification',
        use_case: 'Users showing confusion or uncertainty'
      },
      {
        style: 'collaborative-exploratory',
        description: 'Open-ended, discovery-oriented conversation style',
        use_case: 'Engaged users who want to explore possibilities together'
      }
    ],
    adaptation_triggers: [
      'Sophistication level changes during conversation',
      'Engagement drops below threshold',
      'Confusion signals detected in responses',
      'Impatience or urgency signals',
      'Expert skip requests ("I know this, move on")',
      'Style effectiveness drops below acceptable level'
    ],
    test_scenarios: [
      {
        scenario: 'Novice User',
        userResponse: 'I want to build an app but I don\'t know anything about technology',
        expectedStyle: 'novice-friendly'
      },
      {
        scenario: 'Impatient Expert',
        userResponse: 'I\'ve built 5 fintech apps already, can we skip the basics?',
        expectedStyle: 'expert-efficient'
      },
      {
        scenario: 'Confused User',
        userResponse: 'I\'m not sure what you mean by that, this is all very confusing',
        expectedStyle: 'confused-supportive'
      },
      {
        scenario: 'Technical User',
        userResponse: 'We need SOC2 compliance with real-time API integration for our microservices architecture',
        expectedStyle: 'advanced-technical'
      }
    ]
  })
} 