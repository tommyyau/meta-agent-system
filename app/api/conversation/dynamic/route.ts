/**
 * Dynamic Conversation Engine API
 * 
 * REST endpoints for testing and using the dynamic conversation system
 */

import { NextRequest, NextResponse } from 'next/server'
import { DynamicConversationEngine } from '@/lib/conversation/dynamic-conversation-engine'
import { ConversationStage } from '@/lib/types/conversation'
import type { 
  ConversationContext, 
  Domain,
  UserProfile 
} from '@/lib/types/conversation'

// Configure runtime for longer OpenAI API calls
export const runtime = 'nodejs'
export const maxDuration = 30

const conversationEngine = new DynamicConversationEngine()

/**
 * Normalize conversation context with proper defaults
 */
function normalizeContext(context: ConversationContext): ConversationContext {
  const defaultUserProfile: UserProfile = {
    role: 'business',
    sophisticationLevel: 'novice',
    domainKnowledge: {},
    engagementPattern: 'unknown'
  }

  return {
    sessionId: context.sessionId || 'default-session',
    domain: context.domain || 'general',
    stage: context.stage || ConversationStage.IDEA_CLARITY,
    conversationHistory: context.conversationHistory || [],
    userProfile: {
      ...defaultUserProfile,
      ...context.userProfile
    },
    currentQuestion: context.currentQuestion,
    lastUpdated: context.lastUpdated || new Date().toISOString(),
    metadata: context.metadata || {
      startedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      totalQuestions: 0,
      escapeCount: 0
    }
  }
}

/**
 * POST /api/conversation/dynamic
 * Main endpoint for dynamic conversation interaction
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, context, userResponse } = body

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'generate_question':
        return await handleGenerateQuestion(context)
      
      case 'analyze_response':
        return await handleAnalyzeResponse(userResponse, context)
      
      case 'conversation_turn':
        return await handleConversationTurn(userResponse, context)

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Dynamic conversation API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Handle question generation
 */
async function handleGenerateQuestion(context: ConversationContext) {
  if (!context) {
    return NextResponse.json(
      { error: 'Conversation context is required' },
      { status: 400 }
    )
  }

  try {
    // Ensure context has proper defaults
    const normalizedContext = normalizeContext(context)
    const question = await conversationEngine.generateNextQuestion(normalizedContext)
    
    return NextResponse.json({
      success: true,
      question,
      context: {
        ...normalizedContext,
        currentQuestion: question
      }
    })
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to generate question',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Handle response analysis
 */
async function handleAnalyzeResponse(userResponse: string, context: ConversationContext) {
  if (!userResponse) {
    return NextResponse.json(
      { error: 'User response is required' },
      { status: 400 }
    )
  }

  if (!context) {
    return NextResponse.json(
      { error: 'Conversation context is required' },
      { status: 400 }
    )
  }

  try {
    const normalizedContext = normalizeContext(context)
    const analysis = await conversationEngine.analyzeResponse(userResponse, normalizedContext)
    const shouldEscape = await conversationEngine.detectEscapeSignals(normalizedContext)
    
    return NextResponse.json({
      success: true,
      analysis,
      shouldEscape,
      adaptations: analysis.suggestedAdaptations,
      escapeSignals: analysis.escapeSignals
    })
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to analyze response',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Handle complete conversation turn (analyze response + generate next question)
 */
async function handleConversationTurn(userResponse: string, context: ConversationContext) {
  if (!userResponse) {
    return NextResponse.json(
      { error: 'User response is required' },
      { status: 400 }
    )
  }

  if (!context) {
    return NextResponse.json(
      { error: 'Conversation context is required' },
      { status: 400 }
    )
  }

  try {
    const normalizedContext = normalizeContext(context)
    
    // Analyze the user's response
    const responseAnalysis = await conversationEngine.analyzeResponse(userResponse, normalizedContext)
    
    // Check for escape signals
    const shouldEscape = await conversationEngine.detectEscapeSignals(normalizedContext)
    
    // Update conversation context
    const updatedContext = conversationEngine.updateContext(
      normalizedContext,
      userResponse,
      responseAnalysis
    )

    let nextQuestion = null
    let escapeTriggered = false

    // Generate next question if not escaping
    if (!shouldEscape) {
      nextQuestion = await conversationEngine.generateNextQuestion(updatedContext)
      updatedContext.currentQuestion = nextQuestion
    } else {
      escapeTriggered = true
    }

    return NextResponse.json({
      success: true,
      analysis: responseAnalysis,
      nextQuestion,
      updatedContext,
      escapeTriggered,
      shouldPivotToAssumptions: escapeTriggered,
      metadata: {
        conversationLength: updatedContext.conversationHistory.length,
        userSophistication: updatedContext.userProfile.sophisticationLevel,
        engagement: updatedContext.userProfile.engagementPattern,
        stage: updatedContext.stage
      }
    })
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to process conversation turn',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/conversation/dynamic
 * Get example conversation context for testing
 */
export async function GET() {
  const exampleContext: ConversationContext = {
    sessionId: 'example-session-001',
    userId: 'test-user',
    domain: 'fintech',
    stage: ConversationStage.IDEA_CLARITY,
    userProfile: {
      role: 'founder',
      sophisticationLevel: 'intermediate',
      domainKnowledge: {
        experience: 'some_experience',
        technicalDepth: 'basic',
        businessAcumen: 'advanced'
      },
      engagementPattern: 'engaged'
    },
    conversationHistory: [],
    lastUpdated: new Date().toISOString()
  }

  return NextResponse.json({
    success: true,
    exampleContext,
    usage: {
      endpoints: {
        'POST /api/conversation/dynamic': {
          actions: [
            'generate_question - Generate next optimal question',
            'analyze_response - Analyze user response for sophistication and escape signals',
            'conversation_turn - Complete turn: analyze response + generate next question'
          ]
        }
      },
      examples: {
        generateQuestion: {
          action: 'generate_question',
          context: exampleContext
        },
        analyzeResponse: {
          action: 'analyze_response',
          userResponse: 'I want to build a fintech app for regulatory reporting',
          context: exampleContext
        },
        conversationTurn: {
          action: 'conversation_turn',
          userResponse: 'I want to build a fintech app for regulatory reporting',
          context: exampleContext
        }
      }
    }
  })
} 