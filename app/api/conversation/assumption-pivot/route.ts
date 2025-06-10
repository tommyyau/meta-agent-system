/**
 * API endpoint for testing escape signal detection and assumption pivot logic
 * 
 * Tests the integration between the dynamic conversation engine and assumption generator
 * to provide smooth transitions from questioning to assumption generation.
 */

import { NextRequest, NextResponse } from 'next/server'
import { DynamicConversationEngine } from '@/lib/conversation/dynamic-conversation-engine'
import type { ConversationContext, ConversationExchange } from '@/lib/types/conversation'
import { ConversationStage } from '@/lib/types/conversation'

// Configure runtime for longer OpenAI API calls
export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userResponse, context } = body

    if (!userResponse || !context) {
      return NextResponse.json(
        { error: 'Missing required fields: userResponse and context' },
        { status: 400 }
      )
    }

    const engine = new DynamicConversationEngine()

    // Analyze the user response
    const responseAnalysis = await engine.analyzeResponse(userResponse, context)

    // Check if conversation should pivot to assumption generation (fast check first)
    const pivotCheck = engine.checkAssumptionPivot(context, responseAnalysis)
    
    let pivotResult
    if (pivotCheck.shouldPivot) {
      // Only generate assumptions if pivot is needed
      const assumptionSet = await engine.generateAssumptions(context, responseAnalysis, pivotCheck.pivotReason)
      pivotResult = {
        shouldPivot: true,
        pivotReason: pivotCheck.pivotReason,
        assumptionSet,
        transitionMessage: `Based on ${pivotCheck.pivotReason.toLowerCase()}, let's move forward with some assumptions.`,
        userOptions: {
          proceedWithAssumptions: "Yes, proceed with these assumptions",
          modifyAssumptions: "Let me adjust some of these assumptions",
          continueQuestioning: "Actually, I'd like to answer more questions"
        }
      }
    } else {
      pivotResult = {
        shouldPivot: false,
        pivotReason: 'No escape signals detected, continuing conversation',
        transitionMessage: '',
        userOptions: {
          proceedWithAssumptions: '',
          modifyAssumptions: '',
          continueQuestioning: ''
        }
      }
    }

    // Update context with the new response
    const updatedContext = engine.updateContext(context, userResponse, responseAnalysis)

    const result = {
      responseAnalysis: {
        sophisticationScore: responseAnalysis.sophisticationScore,
        engagementLevel: responseAnalysis.engagementLevel,
        clarityScore: responseAnalysis.clarityScore,
        escapeSignals: responseAnalysis.escapeSignals,
        advancedEscapeSignals: responseAnalysis.advancedEscapeSignals,
        sentiment: responseAnalysis.sentiment
      },
      pivotResult,
      updatedContext: {
        ...updatedContext,
        conversationHistory: updatedContext.conversationHistory.slice(-5) // Only return last 5 exchanges
      },
      recommendations: {
        shouldPivot: pivotResult.shouldPivot,
        nextAction: pivotResult.shouldPivot ? 'generate_assumptions' : 'continue_questioning',
        transitionMessage: pivotResult.transitionMessage,
        userOptions: pivotResult.userOptions
      }
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error in assumption pivot test:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process assumption pivot test',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  // Return example test data for the assumption pivot endpoint
  const exampleContext: ConversationContext = {
    sessionId: 'test-session-123',
    userId: 'test-user',
    domain: 'fintech',
    stage: ConversationStage.IDEA_CLARITY,
    userProfile: {
      id: 'test-profile',
      role: 'technical',
      sophisticationLevel: 'advanced',
      domainKnowledge: {
        experience: 'senior',
        technicalDepth: 'expert',
        businessAcumen: 'intermediate',
        specificAreas: ['blockchain', 'payments', 'compliance']
      },
      engagementPattern: 'engaged'
    },
    conversationHistory: [
      {
        userResponse: "I want to build a fintech app for regulatory reporting",
        analysis: {
          sophisticationScore: 0.8,
          engagementLevel: 0.9,
          clarityScore: 0.7,
          escapeSignals: {
            detected: false,
            type: null,
            confidence: 0,
            indicators: []
          },
          extractedEntities: ['fintech', 'regulatory reporting'],
          sentiment: 'positive',
          suggestedAdaptations: ['increase technical depth'],
          nextQuestionHints: ['ask about specific regulations'],
          metadata: {
            model: 'gpt-4o-mini',
            tokens: 150,
            timestamp: new Date().toISOString(),
            responseLength: 45
          }
        },
        generatedQuestion: {
          question: "Which specific regulatory frameworks are you targeting?",
          questionType: 'technical',
          sophisticationLevel: 'advanced',
          domainContext: 'Regulatory compliance in fintech',
          followUpSuggestions: ['SOC2', 'PCI DSS', 'BSA/AML'],
          confidence: 0.85,
          reasoning: 'User shows technical sophistication',
          expectedResponseTypes: ['specific frameworks', 'compliance standards'],
          metadata: {
            model: 'gpt-4o-mini',
            tokens: 200,
            timestamp: new Date().toISOString()
          }
        },
        timestamp: new Date().toISOString(),
                 stage: ConversationStage.IDEA_CLARITY
      }
    ],
    lastUpdated: new Date().toISOString()
  }

  const testScenarios = [
    {
      name: "Expert Impatience Signal",
      userResponse: "Look, I know all this compliance stuff. Can we just skip to the technical architecture?",
      expectedPivot: true,
      expectedReason: "User demonstrating advanced expertise"
    },
    {
      name: "General Impatience Signal", 
      userResponse: "This is taking too long. Just show me some wireframes or something.",
      expectedPivot: true,
      expectedReason: "User showing high impatience"
    },
    {
      name: "Conversation Fatigue",
      userResponse: "I don't know... whatever you think is best I guess.",
      expectedPivot: true,
      expectedReason: "User showing conversation fatigue"
    },
    {
      name: "Normal Engaged Response",
      userResponse: "We need to focus on SOC2 compliance and PCI DSS for payment processing.",
      expectedPivot: false,
      expectedReason: "No escape signals detected"
    }
  ]

  return NextResponse.json({
    endpoint: '/api/conversation/assumption-pivot',
    description: 'Test escape signal detection and assumption pivot logic',
    exampleContext,
    testScenarios,
    usage: {
      method: 'POST',
      body: {
        userResponse: 'string',
        context: 'ConversationContext object'
      }
    }
  })
} 