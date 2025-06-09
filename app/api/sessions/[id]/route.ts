import { NextRequest, NextResponse } from 'next/server'
import { sessionManagementSystem } from '@/lib/services/session-management-system'
import { UserProfile, SpecializedAgent } from '@/lib/types/agent-types'

/**
 * Individual Session Management API Endpoints
 * 
 * GET /api/sessions/[id] - Get specific session
 * PUT /api/sessions/[id] - Update specific session
 * DELETE /api/sessions/[id] - Delete specific session
 */

/**
 * GET /api/sessions/[id] - Get specific session details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id
    const { searchParams } = new URL(request.url)
    const includeContext = searchParams.get('context') === 'true'
    const includeState = searchParams.get('state') === 'true'

    const session = await sessionManagementSystem.getSession(sessionId)
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      )
    }

    const response: any = {
      success: true,
      data: {
        sessionId: session.sessionId,
        uptime: session.getUptime(),
        isActive: session.isActive(),
        hasProfile: !!session.profile,
        hasAgent: !!session.activeAgent,
        timestamp: new Date().toISOString()
      }
    }

    // Include context if requested
    if (includeContext) {
      response.data.context = await session.getContext()
    }

    // Include state if requested
    if (includeState) {
      response.data.state = await session.loadState()
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error getting session:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get session',
        details: (error as Error).message
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/sessions/[id] - Update specific session
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id
    const body = await request.json()
    const { profile, agent, metadata, extend } = body

    const session = await sessionManagementSystem.getSession(sessionId)
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      )
    }

    // Apply updates
    const updates: string[] = []

    if (profile) {
      await session.updateProfile(profile as UserProfile)
      updates.push('profile')
    }

    if (agent) {
      await session.registerAgent(agent as SpecializedAgent)
      updates.push('agent')
    }

    if (metadata) {
      await session.updateMetadata(metadata)
      updates.push('metadata')
    }

    if (extend && typeof extend === 'number') {
      await session.extend(extend)
      updates.push('duration')
    }

    // Save state
    await session.saveState()

    const context = await session.getContext()

    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        updated: updates,
        timestamp: new Date().toISOString(),
        context: {
          hasProfile: !!context.profile,
          hasAgent: !!session.activeAgent,
          uptime: session.getUptime(),
          isActive: session.isActive(),
          currentStage: context.currentStage
        }
      }
    })
  } catch (error) {
    console.error('Error updating session:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update session',
        details: (error as Error).message
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/sessions/[id] - Delete specific session
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id

    const session = await sessionManagementSystem.getSession(sessionId)
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      )
    }

    // Get session info before deletion
    const sessionInfo = {
      sessionId: session.sessionId,
      uptime: session.getUptime(),
      hasProfile: !!session.profile,
      hasAgent: !!session.activeAgent
    }

    // Delete the session
    const success = await sessionManagementSystem.deleteSession(sessionId)

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete session' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        deleted: sessionInfo,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error deleting session:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete session',
        details: (error as Error).message
      },
      { status: 500 }
    )
  }
} 