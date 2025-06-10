import { NextRequest, NextResponse } from 'next/server'
import { agentTemplateManager } from '@/lib/services/agent-template-manager'
import { UserProfile } from '@/lib/types/agent-types'

/**
 * POST /api/agents/templates/customize
 * Customize a template for a specific user profile
 */
export async function POST(request: NextRequest) {
  try {
    const { templateId, profile } = await request.json()

    // Validate required fields
    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    if (!profile) {
      return NextResponse.json(
        { error: 'User profile is required' },
        { status: 400 }
      )
    }

    // Validate profile structure
    if (!profile.id || !profile.industry || !profile.role || !profile.sophisticationLevel) {
      return NextResponse.json(
        { error: 'Profile must include id, industry, role, and sophisticationLevel' },
        { status: 400 }
      )
    }

    // Customize template for profile
    const customizedTemplate = await agentTemplateManager.customizeTemplateForProfile(templateId, profile as UserProfile)

    if (!customizedTemplate) {
      return NextResponse.json(
        { error: 'Template not found or customization failed' },
        { status: 404 }
      )
    }

    // Validate the customized template
    const validation = await agentTemplateManager.validateTemplate(customizedTemplate)

    return NextResponse.json({
      customizedTemplate,
      validation,
      customizations: {
        terminologyAdjustments: Array.from(customizedTemplate.terminology.entries()).length,
        conversationFlowAdaptations: Object.keys(customizedTemplate.conversationFlow.configuration.customSettings || {}).length,
        profileMatching: {
          industry: profile.industry,
          role: profile.role,
          sophisticationLevel: profile.sophisticationLevel
        }
      }
    })

  } catch (error) {
    console.error('Error customizing template:', error)
    return NextResponse.json(
      { error: 'Failed to customize template' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/agents/templates/customize
 * Get customization options for a template
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('templateId')

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    const template = await agentTemplateManager.getTemplate(templateId)
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Return customization options
    return NextResponse.json({
      template: {
        id: template.id,
        name: template.name,
        domain: template.domain,
        version: template.version
      },
      customizationOptions: {
        terminology: {
          available: Array.from(template.terminology.keys()),
          count: template.terminology.size
        },
        conversationFlow: {
          stages: template.conversationFlow.stages,
          configurableTransitions: Object.keys(template.conversationFlow.transitions).length
        },
        questionBank: {
          categories: template.questionBank.map(qb => qb.category),
          totalQuestions: template.questionBank.reduce((sum, qb) => sum + qb.questions.length, 0)
        },
        assumptionTemplates: {
          categories: template.assumptionTemplates.map(at => at.category),
          count: template.assumptionTemplates.length
        }
      },
      supportedProfiles: {
        industries: ['fintech', 'healthcare', 'general', 'ecommerce', 'saas', 'consumer', 'enterprise'],
        roles: ['technical', 'business', 'hybrid'],
        sophisticationLevels: ['low', 'medium', 'high']
      }
    })

  } catch (error) {
    console.error('Error getting customization options:', error)
    return NextResponse.json(
      { error: 'Failed to get customization options' },
      { status: 500 }
    )
  }
} 