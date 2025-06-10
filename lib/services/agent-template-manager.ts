import { AgentTemplate, QuestionSet, AssumptionTemplate, ConversationFlow, UserProfile } from '@/lib/types/agent-types'
import { nanoid } from 'nanoid'

/**
 * Agent Template Manager
 * 
 * Manages agent templates with domain-specific configurations, question banks,
 * terminology mapping, and template versioning.
 */
export class AgentTemplateManager {
  private templates: Map<string, AgentTemplate> = new Map()
  private templatesByDomain: Map<string, AgentTemplate[]> = new Map()
  private terminologyMaps: Map<string, Map<string, string>> = new Map()
  private questionBanks: Map<string, QuestionSet[]> = new Map()

  constructor() {
    this.initializeTemplates()
  }

  /**
   * Get agent template by ID
   */
  async getTemplate(templateId: string): Promise<AgentTemplate | null> {
    return this.templates.get(templateId) || null
  }

  /**
   * Get all templates for a specific domain
   */
  async getTemplatesByDomain(domain: string): Promise<AgentTemplate[]> {
    return this.templatesByDomain.get(domain) || []
  }

  /**
   * Get all available templates
   */
  async getAllTemplates(): Promise<AgentTemplate[]> {
    return Array.from(this.templates.values())
  }

  /**
   * Create a new agent template
   */
  async createTemplate(config: TemplateConfig): Promise<AgentTemplate> {
    const template: AgentTemplate = {
      id: config.id || nanoid(),
      name: config.name,
      domain: config.domain,
      version: config.version || '1.0.0',
      description: config.description,
      questionBank: config.questionBank || [],
      terminology: config.terminology || new Map(),
      assumptionTemplates: config.assumptionTemplates || [],
      conversationFlow: config.conversationFlow || this.getDefaultConversationFlow(),
      metadata: {
        created: new Date(),
        lastUpdated: new Date(),
        deploymentCount: 0
      }
    }

    // Register template
    this.templates.set(template.id, template)

    // Add to domain index
    if (!this.templatesByDomain.has(template.domain)) {
      this.templatesByDomain.set(template.domain, [])
    }
    this.templatesByDomain.get(template.domain)!.push(template)

    return template
  }

  /**
   * Update an existing template
   */
  async updateTemplate(templateId: string, updates: Partial<TemplateConfig>): Promise<AgentTemplate | null> {
    const template = this.templates.get(templateId)
    if (!template) {
      return null
    }

    // Create new version if major changes
    const shouldVersion = updates.questionBank || updates.conversationFlow || updates.assumptionTemplates
    const newVersion = shouldVersion ? this.incrementVersion(template.version) : template.version

    // Apply updates
    const updatedTemplate: AgentTemplate = {
      ...template,
      ...updates,
      version: newVersion,
      metadata: {
        ...template.metadata,
        lastUpdated: new Date()
      }
    }

    this.templates.set(templateId, updatedTemplate)
    
    // Update domain index
    this.updateDomainIndex(template, updatedTemplate)

    return updatedTemplate
  }

  /**
   * Delete a template
   */
  async deleteTemplate(templateId: string): Promise<boolean> {
    const template = this.templates.get(templateId)
    if (!template) {
      return false
    }

    this.templates.delete(templateId)

    // Remove from domain index
    const domainTemplates = this.templatesByDomain.get(template.domain)
    if (domainTemplates) {
      const index = domainTemplates.findIndex(t => t.id === templateId)
      if (index !== -1) {
        domainTemplates.splice(index, 1)
      }
    }

    return true
  }

  /**
   * Customize template for specific user profile
   */
  async customizeTemplateForProfile(templateId: string, profile: UserProfile): Promise<AgentTemplate | null> {
    const baseTemplate = this.templates.get(templateId)
    if (!baseTemplate) {
      return null
    }

    // Create customized version
    const customizedTemplate: AgentTemplate = {
      ...baseTemplate,
      id: `${baseTemplate.id}-${profile.id}`,
      terminology: this.customizeTerminology(baseTemplate.terminology, profile),
      questionBank: await this.customizeQuestionBank(baseTemplate.questionBank, profile),
      conversationFlow: this.customizeConversationFlow(baseTemplate.conversationFlow, profile),
      metadata: {
        ...baseTemplate.metadata,
        created: new Date()
      }
    }

    return customizedTemplate
  }

  /**
   * Get terminology map for domain
   */
  async getTerminologyMap(domain: string): Promise<Map<string, string>> {
    return this.terminologyMaps.get(domain) || new Map()
  }

  /**
   * Set terminology map for domain
   */
  async setTerminologyMap(domain: string, terminology: Map<string, string>): Promise<void> {
    this.terminologyMaps.set(domain, terminology)
  }

  /**
   * Get question bank for domain
   */
  async getQuestionBank(domain: string): Promise<QuestionSet[]> {
    return this.questionBanks.get(domain) || []
  }

  /**
   * Set question bank for domain
   */
  async setQuestionBank(domain: string, questions: QuestionSet[]): Promise<void> {
    this.questionBanks.set(domain, questions)
  }

  /**
   * Validate template configuration
   */
  async validateTemplate(template: AgentTemplate): Promise<TemplateValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    // Required fields validation
    if (!template.id) errors.push('Template ID is required')
    if (!template.name) errors.push('Template name is required')
    if (!template.domain) errors.push('Template domain is required')
    if (!template.version) errors.push('Template version is required')

    // Question bank validation
    if (!template.questionBank || template.questionBank.length === 0) {
      warnings.push('Template has no question bank configured')
    }

    // Conversation flow validation
    if (!template.conversationFlow || !template.conversationFlow.stages || template.conversationFlow.stages.length === 0) {
      errors.push('Template must have a valid conversation flow with stages')
    }

    // Terminology validation
    if (!template.terminology) {
      warnings.push('Template has no terminology map configured')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  // Private helper methods

  private initializeTemplates(): void {
    // Initialize with default templates
    this.createDefaultTemplates()
  }

  private async createDefaultTemplates(): Promise<void> {
    // General business template
    await this.createTemplate({
      id: 'general-business',
      name: 'General Business Agent',
      domain: 'general',
      version: '1.0.0',
      description: 'General purpose business application agent for any industry',
      questionBank: [],
      terminology: new Map(),
      assumptionTemplates: [],
      conversationFlow: this.getDefaultConversationFlow()
    })

    // Fintech template (placeholder - will be enhanced in TASK-005)
    await this.createTemplate({
      id: 'fintech-standard',
      name: 'Fintech Standard Agent',
      domain: 'fintech',
      version: '1.0.0',
      description: 'Financial technology focused agent with compliance and regulatory expertise',
      questionBank: [],
      terminology: new Map([
        ['payment', 'payment processing system'],
        ['compliance', 'regulatory compliance framework'],
        ['KYC', 'Know Your Customer verification'],
        ['AML', 'Anti-Money Laundering protocols']
      ]),
      assumptionTemplates: [],
      conversationFlow: this.getDefaultConversationFlow()
    })

    // Healthcare template (placeholder - will be enhanced in TASK-005)
    await this.createTemplate({
      id: 'healthcare-standard',
      name: 'Healthcare Standard Agent',
      domain: 'healthcare',
      version: '1.0.0',
      description: 'Healthcare industry agent with HIPAA compliance and clinical workflow expertise',
      questionBank: [],
      terminology: new Map([
        ['patient', 'healthcare patient or individual'],
        ['EHR', 'Electronic Health Record system'],
        ['HIPAA', 'Health Insurance Portability and Accountability Act'],
        ['PHI', 'Protected Health Information']
      ]),
      assumptionTemplates: [],
      conversationFlow: this.getDefaultConversationFlow()
    })
  }

  private getDefaultConversationFlow(): ConversationFlow {
    return {
      stages: ['idea-clarity', 'user-workflow', 'technical-specs', 'wireframes'],
      transitions: {
        'idea-clarity': {
          from: 'idea-clarity',
          to: 'user-workflow',
          conditions: [{ type: 'profile_complete', parameters: {} }]
        },
        'user-workflow': {
          from: 'user-workflow',
          to: 'technical-specs',
          conditions: [{ type: 'profile_complete', parameters: {} }]
        },
        'technical-specs': {
          from: 'technical-specs',
          to: 'wireframes',
          conditions: [{ type: 'profile_complete', parameters: {} }]
        },
        'wireframes': {
          from: 'wireframes',
          to: 'complete',
          conditions: [{ type: 'profile_complete', parameters: {} }]
        }
      },
      configuration: {
        autoAdvance: true,
        allowBacktracking: false,
        customSettings: {
          allowStageSkipping: true,
          requireStageCompletion: false,
          adaptiveQuestioning: true
        }
      }
    }
  }

  private incrementVersion(currentVersion: string): string {
    const parts = currentVersion.split('.')
    const minor = parseInt(parts[1] || '0') + 1
    return `${parts[0]}.${minor}.0`
  }

  private updateDomainIndex(oldTemplate: AgentTemplate, newTemplate: AgentTemplate): void {
    // Remove from old domain if changed
    if (oldTemplate.domain !== newTemplate.domain) {
      const oldDomainTemplates = this.templatesByDomain.get(oldTemplate.domain)
      if (oldDomainTemplates) {
        const index = oldDomainTemplates.findIndex(t => t.id === oldTemplate.id)
        if (index !== -1) {
          oldDomainTemplates.splice(index, 1)
        }
      }

      // Add to new domain
      if (!this.templatesByDomain.has(newTemplate.domain)) {
        this.templatesByDomain.set(newTemplate.domain, [])
      }
      this.templatesByDomain.get(newTemplate.domain)!.push(newTemplate)
    } else {
      // Update in same domain
      const domainTemplates = this.templatesByDomain.get(newTemplate.domain)
      if (domainTemplates) {
        const index = domainTemplates.findIndex(t => t.id === newTemplate.id)
        if (index !== -1) {
          domainTemplates[index] = newTemplate
        }
      }
    }
  }

  private customizeTerminology(baseTerminology: Map<string, string>, profile: UserProfile): Map<string, string> {
    const customized = new Map(baseTerminology)

    // Adjust terminology based on user sophistication
    if (profile.sophisticationLevel === 'low') {
      // Use simpler terms
      customized.set('API', 'application connection')
      customized.set('microservice', 'software component')
      customized.set('deployment', 'software release')
    } else if (profile.sophisticationLevel === 'high') {
      // Use more technical terms
      customized.set('payment', 'payment orchestration layer')
      customized.set('user', 'authenticated principal')
    }

    return customized
  }

  private async customizeQuestionBank(baseQuestions: QuestionSet[], profile: UserProfile): Promise<QuestionSet[]> {
    // For now, return base questions
    // This will be enhanced in TASK-005 with adaptive questioning logic
    return baseQuestions
  }

  private customizeConversationFlow(baseFlow: ConversationFlow, profile: UserProfile): ConversationFlow {
    const customFlow = { ...baseFlow }

    // Allow stage skipping for high sophistication users
    if (profile.sophisticationLevel === 'high') {
      customFlow.configuration = {
        ...customFlow.configuration,
        customSettings: {
          ...customFlow.configuration.customSettings,
          allowStageSkipping: true,
          requireStageCompletion: false
        }
      }
    }

    return customFlow
  }
}

// Supporting interfaces
export interface TemplateConfig {
  id?: string
  name: string
  domain: string
  version?: string
  description: string
  questionBank?: QuestionSet[]
  terminology?: Map<string, string>
  assumptionTemplates?: AssumptionTemplate[]
  conversationFlow?: ConversationFlow
}

export interface TemplateValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

// Singleton instance for global use
export const agentTemplateManager = new AgentTemplateManager() 