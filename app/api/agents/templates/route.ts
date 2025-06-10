import { NextRequest, NextResponse } from 'next/server'
import { agentTemplateManager, TemplateConfig } from '@/lib/services/agent-template-manager'

/**
 * GET /api/agents/templates
 * Get all templates or filter by domain
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const domain = searchParams.get('domain')
    const templateId = searchParams.get('id')

    if (templateId) {
      // Get specific template
      const template = await agentTemplateManager.getTemplate(templateId)
      if (!template) {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        )
      }
      return NextResponse.json({ template })
    }

    if (domain) {
      // Get templates by domain
      const templates = await agentTemplateManager.getTemplatesByDomain(domain)
      return NextResponse.json({ templates })
    }

    // Get all templates
    const templates = await agentTemplateManager.getAllTemplates()
    return NextResponse.json({ templates })

  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/agents/templates
 * Create a new agent template
 */
export async function POST(request: NextRequest) {
  try {
    const config: TemplateConfig = await request.json()

    // Validate required fields
    if (!config.name || !config.domain || !config.description) {
      return NextResponse.json(
        { error: 'Missing required fields: name, domain, description' },
        { status: 400 }
      )
    }

    // Create template
    const template = await agentTemplateManager.createTemplate(config)

    // Validate the created template
    const validation = await agentTemplateManager.validateTemplate(template)
    
    return NextResponse.json({
      template,
      validation
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating template:', error)
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/agents/templates
 * Update an existing agent template
 */
export async function PUT(request: NextRequest) {
  try {
    const { templateId, updates } = await request.json()

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    const updatedTemplate = await agentTemplateManager.updateTemplate(templateId, updates)
    
    if (!updatedTemplate) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Validate the updated template
    const validation = await agentTemplateManager.validateTemplate(updatedTemplate)

    return NextResponse.json({
      template: updatedTemplate,
      validation
    })

  } catch (error) {
    console.error('Error updating template:', error)
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/agents/templates
 * Delete an agent template
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('id')

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    const deleted = await agentTemplateManager.deleteTemplate(templateId)

    if (!deleted) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Template deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    )
  }
} 