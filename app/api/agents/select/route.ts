import { NextRequest, NextResponse } from 'next/server'
import { agentSelectionFramework } from '@/lib/services/agent-selection-framework'
import { UserProfile, AgentTemplate } from '@/lib/types/agent-types'

/**
 * Agent Selection API Endpoint
 * 
 * POST /api/agents/select
 * Tests the agent selection framework with user profiles
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { profile, availableAgents, context } = body

    // Validate input
    if (!profile || !availableAgents) {
      return NextResponse.json(
        { error: 'Profile and availableAgents are required' },
        { status: 400 }
      )
    }

    // Perform agent selection
    const selectionResult = await agentSelectionFramework.selectOptimalAgent(
      profile as UserProfile,
      availableAgents as AgentTemplate[],
      context
    )

    return NextResponse.json({
      success: true,
      result: selectionResult,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Agent selection error:', error)
    return NextResponse.json(
      { 
        error: 'Agent selection failed',
        details: (error as Error).message 
      },
      { status: 500 }
    )
  }
}

/**
 * Get Agent Selection Analytics
 * 
 * GET /api/agents/select
 */
export async function GET() {
  try {
    const analytics = agentSelectionFramework.getSelectionAnalytics()
    
    return NextResponse.json({
      success: true,
      analytics,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get analytics',
        details: (error as Error).message 
      },
      { status: 500 }
    )
  }
} 