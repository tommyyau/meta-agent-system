import { agentTemplateManager, TemplateConfig } from '@/lib/services/agent-template-manager'
import { UserProfile, AgentTemplate } from '@/lib/types/agent-types'

describe('Agent Template System', () => {
  beforeEach(() => {
    // Reset template manager state before each test
    // Note: In a real implementation, we might need to clear the singleton state
  })

  describe('AgentTemplateManager', () => {
    describe('Template Creation', () => {
      test('should create a basic template', async () => {
        const config: TemplateConfig = {
          name: 'Test Agent',
          domain: 'test',
          description: 'A test agent template',
          version: '1.0.0'
        }

        const template = await agentTemplateManager.createTemplate(config)

        expect(template).toBeDefined()
        expect(template.id).toBeDefined()
        expect(template.name).toBe(config.name)
        expect(template.domain).toBe(config.domain)
        expect(template.description).toBe(config.description)
        expect(template.version).toBe(config.version)
        expect(template.metadata.created).toBeInstanceOf(Date)
        expect(template.metadata.lastUpdated).toBeInstanceOf(Date)
        expect(template.metadata.deploymentCount).toBe(0)
      })

      test('should auto-generate ID and version if not provided', async () => {
        const config: TemplateConfig = {
          name: 'Auto Test Agent',
          domain: 'auto-test',
          description: 'A test agent with auto-generated fields'
        }

        const template = await agentTemplateManager.createTemplate(config)

        expect(template.id).toBeDefined()
        expect(template.id).not.toBe('')
        expect(template.version).toBe('1.0.0')
      })

      test('should create template with custom terminology', async () => {
        const terminology = new Map([
          ['user', 'customer'],
          ['payment', 'transaction'],
          ['api', 'interface']
        ])

        const config: TemplateConfig = {
          name: 'Custom Terminology Agent',
          domain: 'custom',
          description: 'Agent with custom terminology',
          terminology
        }

        const template = await agentTemplateManager.createTemplate(config)

        expect(template.terminology.size).toBe(3)
        expect(template.terminology.get('user')).toBe('customer')
        expect(template.terminology.get('payment')).toBe('transaction')
        expect(template.terminology.get('api')).toBe('interface')
      })
    })

    describe('Template Retrieval', () => {
      test('should retrieve template by ID', async () => {
        const config: TemplateConfig = {
          id: 'test-retrieve',
          name: 'Retrieve Test Agent',
          domain: 'retrieve-test',
          description: 'Test retrieval functionality'
        }

        const created = await agentTemplateManager.createTemplate(config)
        const retrieved = await agentTemplateManager.getTemplate('test-retrieve')

        expect(retrieved).toBeDefined()
        expect(retrieved?.id).toBe(created.id)
        expect(retrieved?.name).toBe(created.name)
      })

      test('should return null for non-existent template', async () => {
        const result = await agentTemplateManager.getTemplate('non-existent')
        expect(result).toBeNull()
      })

      test('should retrieve templates by domain', async () => {
        // Create multiple templates in same domain
        await agentTemplateManager.createTemplate({
          name: 'Fintech Agent 1',
          domain: 'fintech',
          description: 'First fintech agent'
        })

        await agentTemplateManager.createTemplate({
          name: 'Fintech Agent 2',
          domain: 'fintech',
          description: 'Second fintech agent'
        })

        await agentTemplateManager.createTemplate({
          name: 'Healthcare Agent',
          domain: 'healthcare',
          description: 'Healthcare agent'
        })

        const fintechTemplates = await agentTemplateManager.getTemplatesByDomain('fintech')
        const healthcareTemplates = await agentTemplateManager.getTemplatesByDomain('healthcare')

        expect(fintechTemplates.length).toBeGreaterThanOrEqual(2) // At least our 2 + maybe default
        expect(healthcareTemplates.length).toBeGreaterThanOrEqual(1) // At least our 1 + maybe default
      })

      test('should retrieve all templates', async () => {
        const allTemplates = await agentTemplateManager.getAllTemplates()
        
        // Should have at least the default templates (general, fintech, healthcare)
        expect(allTemplates.length).toBeGreaterThanOrEqual(3)
        
        const domains = allTemplates.map(t => t.domain)
        expect(domains).toContain('general')
        expect(domains).toContain('fintech')
        expect(domains).toContain('healthcare')
      })
    })

    describe('Template Updates', () => {
      test('should update template successfully', async () => {
        const config: TemplateConfig = {
          id: 'test-update',
          name: 'Original Name',
          domain: 'test',
          description: 'Original description'
        }

        const created = await agentTemplateManager.createTemplate(config)
        const originalVersion = created.version

        const updates = {
          name: 'Updated Name',
          description: 'Updated description'
        }

        const updated = await agentTemplateManager.updateTemplate('test-update', updates)

        expect(updated).toBeDefined()
        expect(updated?.name).toBe('Updated Name')
        expect(updated?.description).toBe('Updated description')
        expect(updated?.domain).toBe('test') // Unchanged
        expect(updated?.version).toBe(originalVersion) // No version change for minor updates
      })

      test('should increment version for major changes', async () => {
        const config: TemplateConfig = {
          id: 'test-version',
          name: 'Version Test',
          domain: 'test',
          description: 'Test version incrementing',
          version: '1.0.0'
        }

        const created = await agentTemplateManager.createTemplate(config)

        const updates = {
          questionBank: [], // This should trigger version increment
          conversationFlow: {
            stages: ['new-stage'],
            transitions: {},
            configuration: {}
          }
        }

        const updated = await agentTemplateManager.updateTemplate('test-version', updates)

        expect(updated?.version).toBe('1.1.0')
      })

      test('should return null for non-existent template update', async () => {
        const result = await agentTemplateManager.updateTemplate('non-existent', { name: 'New Name' })
        expect(result).toBeNull()
      })
    })

    describe('Template Deletion', () => {
      test('should delete template successfully', async () => {
        const config: TemplateConfig = {
          id: 'test-delete',
          name: 'Delete Test',
          domain: 'test',
          description: 'Test deletion'
        }

        await agentTemplateManager.createTemplate(config)
        
        // Verify it exists
        const beforeDelete = await agentTemplateManager.getTemplate('test-delete')
        expect(beforeDelete).toBeDefined()

        // Delete it
        const deleted = await agentTemplateManager.deleteTemplate('test-delete')
        expect(deleted).toBe(true)

        // Verify it's gone
        const afterDelete = await agentTemplateManager.getTemplate('test-delete')
        expect(afterDelete).toBeNull()
      })

      test('should return false for non-existent template deletion', async () => {
        const result = await agentTemplateManager.deleteTemplate('non-existent')
        expect(result).toBe(false)
      })
    })

    describe('Template Customization', () => {
      test('should customize template for user profile', async () => {
        const config: TemplateConfig = {
          id: 'test-customize',
          name: 'Customization Test',
          domain: 'fintech',
          description: 'Test customization',
          terminology: new Map([
            ['payment', 'payment processing'],
            ['user', 'client']
          ])
        }

        await agentTemplateManager.createTemplate(config)

        const profile: UserProfile = {
          id: 'test-user',
          industry: 'fintech',
          industryConfidence: 0.9,
          role: 'technical',
          roleConfidence: 0.8,
          sophisticationLevel: 'high',
          sophisticationScore: 0.9,
          conversationHistory: [],
          detectedKeywords: [],
          terminology: [],
          preferredCommunicationStyle: 'technical',
          assumptionTolerance: 'low',
          created: new Date(),
          lastUpdated: new Date(),
          analysisVersion: '1.0.0'
        }

        const customized = await agentTemplateManager.customizeTemplateForProfile('test-customize', profile)

        expect(customized).toBeDefined()
        expect(customized?.id).toBe('test-customize-test-user')
        expect(customized?.terminology.size).toBeGreaterThan(0)
        
        // High sophistication should add technical terms
        expect(customized?.terminology.get('payment')).toBe('payment orchestration layer')
        expect(customized?.terminology.get('user')).toBe('authenticated principal')
      })

      test('should return null for non-existent template customization', async () => {
        const profile: UserProfile = {
          id: 'test-user',
          industry: 'test',
          industryConfidence: 0.9,
          role: 'business',
          roleConfidence: 0.8,
          sophisticationLevel: 'medium',
          sophisticationScore: 0.7,
          conversationHistory: [],
          detectedKeywords: [],
          terminology: [],
          preferredCommunicationStyle: 'casual',
          assumptionTolerance: 'medium',
          created: new Date(),
          lastUpdated: new Date(),
          analysisVersion: '1.0.0'
        }

        const result = await agentTemplateManager.customizeTemplateForProfile('non-existent', profile)
        expect(result).toBeNull()
      })
    })

    describe('Template Validation', () => {
      test('should validate valid template', async () => {
        const validTemplate: AgentTemplate = {
          id: 'valid-template',
          name: 'Valid Template',
          domain: 'test',
          version: '1.0.0',
          description: 'A valid template',
          questionBank: [],
          terminology: new Map(),
          assumptionTemplates: [],
          conversationFlow: {
            stages: ['stage1', 'stage2'],
            transitions: {},
            configuration: {}
          },
          metadata: {
            created: new Date(),
            lastUpdated: new Date(),
            deploymentCount: 0
          }
        }

        const validation = await agentTemplateManager.validateTemplate(validTemplate)

        expect(validation.isValid).toBe(true)
        expect(validation.errors.length).toBe(0)
      })

      test('should detect validation errors', async () => {
        const invalidTemplate: AgentTemplate = {
          id: '',
          name: '',
          domain: '',
          version: '',
          description: 'Invalid template',
          questionBank: [],
          terminology: new Map(),
          assumptionTemplates: [],
          conversationFlow: {
            stages: [],
            transitions: {},
            configuration: {}
          },
          metadata: {
            created: new Date(),
            lastUpdated: new Date(),
            deploymentCount: 0
          }
        }

        const validation = await agentTemplateManager.validateTemplate(invalidTemplate)

        expect(validation.isValid).toBe(false)
        expect(validation.errors.length).toBeGreaterThan(0)
        expect(validation.errors).toContain('Template ID is required')
        expect(validation.errors).toContain('Template name is required')
        expect(validation.errors).toContain('Template domain is required')
        expect(validation.errors).toContain('Template version is required')
      })
    })

    describe('Default Templates', () => {
      test('should have default general business template', async () => {
        const generalTemplate = await agentTemplateManager.getTemplate('general-business')

        expect(generalTemplate).toBeDefined()
        expect(generalTemplate?.name).toBe('General Business Agent')
        expect(generalTemplate?.domain).toBe('general')
        expect(generalTemplate?.conversationFlow.stages).toEqual([
          'idea-clarity', 'user-workflow', 'technical-specs', 'wireframes'
        ])
      })

      test('should have default fintech template', async () => {
        const fintechTemplate = await agentTemplateManager.getTemplate('fintech-standard')

        expect(fintechTemplate).toBeDefined()
        expect(fintechTemplate?.name).toBe('Fintech Standard Agent')
        expect(fintechTemplate?.domain).toBe('fintech')
        expect(fintechTemplate?.terminology.get('KYC')).toBe('Know Your Customer verification')
        expect(fintechTemplate?.terminology.get('AML')).toBe('Anti-Money Laundering protocols')
      })

      test('should have default healthcare template', async () => {
        const healthcareTemplate = await agentTemplateManager.getTemplate('healthcare-standard')

        expect(healthcareTemplate).toBeDefined()
        expect(healthcareTemplate?.name).toBe('Healthcare Standard Agent')
        expect(healthcareTemplate?.domain).toBe('healthcare')
        expect(healthcareTemplate?.terminology.get('HIPAA')).toBe('Health Insurance Portability and Accountability Act')
        expect(healthcareTemplate?.terminology.get('PHI')).toBe('Protected Health Information')
      })
    })
  })
}) 