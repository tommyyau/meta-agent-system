import { NextRequest, NextResponse } from 'next/server';
import { conversationStateManager } from '@/lib/conversation/state-manager';
import { ConversationStage, QuestionResponse } from '@/lib/types/conversation';

// GET: Retrieve conversation state
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId parameter is required' },
        { status: 400 }
      );
    }

    const state = await conversationStateManager.getCurrentState(sessionId);
    
    if (!state) {
      return NextResponse.json(
        { error: 'Conversation state not found' },
        { status: 404 }
      );
    }

    // Convert Map to object for JSON serialization
    const serializedState = {
      ...state,
      stageProgresses: Object.fromEntries(state.stageProgresses)
    };

    return NextResponse.json({ state: serializedState });
  } catch (error) {
    console.error('Error retrieving conversation state:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create new conversation state or record question response
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, sessionId, userId, stage, response } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'create':
        if (!userId) {
          return NextResponse.json(
            { error: 'userId is required for create action' },
            { status: 400 }
          );
        }

        const newState = await conversationStateManager.createConversationState(sessionId, userId);
        
        // Convert Map to object for JSON serialization
        const serializedNewState = {
          ...newState,
          stageProgresses: Object.fromEntries(newState.stageProgresses)
        };

        return NextResponse.json({ 
          state: serializedNewState,
          message: 'Conversation state created successfully' 
        });

      case 'record_response':
        if (!response) {
          return NextResponse.json(
            { error: 'response is required for record_response action' },
            { status: 400 }
          );
        }

        // Validate and convert response
        const questionResponse: QuestionResponse = {
          questionId: response.questionId,
          question: response.question,
          answer: response.answer,
          timestamp: new Date(response.timestamp || Date.now()),
          confidence: response.confidence || 0.8,
          isSkipped: response.isSkipped || false
        };

        await conversationStateManager.recordQuestionResponse(sessionId, questionResponse);
        
        const updatedState = await conversationStateManager.getCurrentState(sessionId);
        if (!updatedState) {
          return NextResponse.json(
            { error: 'Failed to retrieve updated state' },
            { status: 500 }
          );
        }

        const serializedUpdatedState = {
          ...updatedState,
          stageProgresses: Object.fromEntries(updatedState.stageProgresses)
        };

        return NextResponse.json({ 
          state: serializedUpdatedState,
          message: 'Question response recorded successfully' 
        });

      case 'update_stage':
        if (!stage || !Object.values(ConversationStage).includes(stage)) {
          return NextResponse.json(
            { error: 'Valid stage is required for update_stage action' },
            { status: 400 }
          );
        }

        await conversationStateManager.updateCurrentStage(sessionId, stage);
        
        const stageUpdatedState = await conversationStateManager.getCurrentState(sessionId);
        if (!stageUpdatedState) {
          return NextResponse.json(
            { error: 'Failed to retrieve updated state' },
            { status: 500 }
          );
        }

        const serializedStageUpdatedState = {
          ...stageUpdatedState,
          stageProgresses: Object.fromEntries(stageUpdatedState.stageProgresses)
        };

        return NextResponse.json({ 
          state: serializedStageUpdatedState,
          message: 'Conversation stage updated successfully' 
        });

      case 'trigger_escape':
        if (!stage || !Object.values(ConversationStage).includes(stage)) {
          return NextResponse.json(
            { error: 'Valid stage is required for trigger_escape action' },
            { status: 400 }
          );
        }

        await conversationStateManager.triggerEscape(sessionId, stage);
        
        const escapeUpdatedState = await conversationStateManager.getCurrentState(sessionId);
        if (!escapeUpdatedState) {
          return NextResponse.json(
            { error: 'Failed to retrieve updated state' },
            { status: 500 }
          );
        }

        const serializedEscapeUpdatedState = {
          ...escapeUpdatedState,
          stageProgresses: Object.fromEntries(escapeUpdatedState.stageProgresses)
        };

        return NextResponse.json({ 
          state: serializedEscapeUpdatedState,
          message: 'Escape hatch triggered successfully' 
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: create, record_response, update_stage, trigger_escape' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error processing conversation state request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Get conversation metrics
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, timeRange } = body;

    if (sessionId) {
      // Get metrics for specific session
      const metrics = await conversationStateManager.getConversationMetrics(sessionId);
      
      // Convert Map to object for JSON serialization
      const serializedMetrics = {
        ...metrics,
        stageCompletionRates: Object.fromEntries(metrics.stageCompletionRates)
      };

      return NextResponse.json({ metrics: serializedMetrics });
    } else {
      // Get aggregate metrics
      const parsedTimeRange = timeRange ? {
        start: new Date(timeRange.start),
        end: new Date(timeRange.end)
      } : undefined;

      const aggregateMetrics = await conversationStateManager.getAggregateMetrics(parsedTimeRange);
      
      // Convert Map to object for JSON serialization
      const serializedAggregateMetrics = {
        ...aggregateMetrics,
        stageCompletionRates: Object.fromEntries(aggregateMetrics.stageCompletionRates)
      };

      return NextResponse.json({ metrics: serializedAggregateMetrics });
    }
  } catch (error) {
    console.error('Error retrieving conversation metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 