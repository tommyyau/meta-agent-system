import { NextRequest, NextResponse } from 'next/server'
import { sessionManagementSystem } from '@/lib/services/session-management-system'
import { UserProfile, SpecializedAgent } from '@/lib/types/agent-types'

/**
 * Session Management API Endpoints
 * 
 * POST /api/sessions - Create new session
 * GET /api/sessions - Get session analytics
 * GET /api/sessions/[id] - Get specific session
 * PUT /api/sessions/[id] - Update session
 * DELETE /api/sessions/[id] - Delete session
 */

/**
 * POST /api/sessions - Create new session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, options } = body

    const session = await sessionManagementSystem.createSession(sessionId, options)
    
    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        created: new Date().toISOString(),
        uptime: session.getUptime(),
        isActive: session.isActive()
      }
    })
  } catch (error) {
    console.error('Error creating session:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create session',
        details: (error as Error).message
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/sessions - Get session analytics and health status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeHealth = searchParams.get('health') === 'true'
    const includeAnalytics = searchParams.get('analytics') === 'true'

    const response: any = {
      success: true,
      timestamp: new Date().toISOString()
    }

    // Get analytics if requested
    if (includeAnalytics) {
      response.analytics = sessionManagementSystem.getSessionAnalytics()
    }

    // Get health status if requested
    if (includeHealth) {
      response.health = await sessionManagementSystem.getHealthStatus()
    }

    // Default: return basic info
    if (!includeHealth && !includeAnalytics) {
      const analytics = sessionManagementSystem.getSessionAnalytics()
      response.data = {
        activeSessions: analytics.activeSessions,
        totalSessions: analytics.totalSessions,
        totalRequests: analytics.totalRequests,
        errorRate: analytics.errorRate
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error getting session data:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get session data',
        details: (error as Error).message
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/sessions - Update session (bulk operations)
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, updates } = body

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      )
    }

    const session = await sessionManagementSystem.getSession(sessionId)
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      )
    }

    // Apply updates
    if (updates.profile) {
      await session.updateProfile(updates.profile as UserProfile)
    }

    if (updates.agent) {
      await session.registerAgent(updates.agent as SpecializedAgent)
    }

    if (updates.metadata) {
      await session.updateMetadata(updates.metadata)
    }

    const context = await session.getContext()

    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        updated: new Date().toISOString(),
        context: {
          hasProfile: !!context.profile,
          hasAgent: !!session.activeAgent,
          uptime: session.getUptime(),
          isActive: session.isActive()
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
 * DELETE /api/sessions - Delete session (bulk operations)
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, sessionIds } = body

    let deletedCount = 0
    const errors: string[] = []

    // Delete single session
    if (sessionId) {
      const success = await sessionManagementSystem.deleteSession(sessionId)
      if (success) {
        deletedCount = 1
      } else {
        errors.push(`Failed to delete session: ${sessionId}`)
      }
    }

    // Delete multiple sessions
    if (sessionIds && Array.isArray(sessionIds)) {
      for (const id of sessionIds) {
        try {
          const success = await sessionManagementSystem.deleteSession(id)
          if (success) {
            deletedCount++
          } else {
            errors.push(`Failed to delete session: ${id}`)
          }
        } catch (error) {
          errors.push(`Error deleting session ${id}: ${(error as Error).message}`)
        }
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      data: {
        deletedCount,
        errors: errors.length > 0 ? errors : undefined,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error deleting sessions:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete sessions',
        details: (error as Error).message
      },
      { status: 500 }
    )
  }
} 