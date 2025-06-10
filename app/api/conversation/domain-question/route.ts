import { NextRequest, NextResponse } from 'next/server'
import { DynamicConversationEngine } from '../../../../lib/conversation/dynamic-conversation-engine'
import type { ConversationContext } from '../../../../lib/types/conversation'

/**
 * Test endpoint for enhanced domain-specific question generation
 * 
 * Tests the new DomainQuestionGenerator integration with the DynamicConversationEngine
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

    // Then generate enhanced domain-specific question
    const questionResult = await engine.generateNextQuestionEnhanced(context, responseAnalysis)

    // Also test the quick sophistication check
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
          adaptationRecommendations: responseAnalysis.adaptationRecommendations,
          analysisConfidence: responseAnalysis.analysisConfidence
        },
        sophisticationCheck,
        generatedQuestion: questionResult,
        metadata: {
          timestamp: new Date().toISOString(),
          model: 'gpt-4o-mini',
          domain: context.domain,
          stage: context.stage
        }
      }
    })

  } catch (error) {
    console.error('Error in domain question generation test:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to generate domain question',
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
    description: 'Enhanced Domain-Specific Question Generation API',
    version: '1.0.0',
    endpoints: {
      POST: {
        description: 'Generate domain-specific questions with enhanced analysis',
        required_fields: ['context', 'userResponse'],
        example_request: {
          context: {
            domain: 'fintech',
            stage: 'idea_clarity',
            userProfile: {
              role: 'business',
              sophisticationLevel: 'intermediate'
            },
            conversationHistory: [],
            sessionId: 'test-session',
            lastUpdated: '2024-12-10T00:00:00Z'
          },
          userResponse: 'I want to build a payment processing solution for small businesses'
        }
      }
    },
    features: [
      'Multi-dimensional response analysis',
      'Domain-specific expertise demonstration',
      'Advanced escape signal detection',
      'Strategic question generation',
      'Real-time sophistication assessment',
      'Contextual adaptation recommendations'
    ],
    supported_domains: ['fintech', 'healthcare', 'general'],
    analysis_dimensions: [
      'Sophistication (technical language, domain specificity, complexity handling, business acumen, communication clarity)',
      'Clarity (specificity, structured thinking, completeness, relevance, actionability)',
      'Engagement (enthusiasm, interest level, participation quality, proactiveness, collaborative spirit)',
      'Escape Signals (fatigue, expertise skip, impatience, confusion, redirect requests)',
      'Adaptation Recommendations (complexity, approach, tone, pacing, topic focus)'
    ]
  })
} 