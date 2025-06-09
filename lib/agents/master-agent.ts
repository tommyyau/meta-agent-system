import { UserProfile, AgentTemplate, SpecializedAgent, SessionManager } from '@/lib/types/agent-types'
import { openaiService } from '@/lib/openai/client'
import { sessionStore } from '@/lib/services/session-store'
import { profileAnalyzer } from '@/lib/services/profile-analyzer'
import { agentSelector } from '@/lib/services/agent-selector'
import { agentDeployer } from '@/lib/services/agent-deployer'

/**
 * Master Agent Core Framework
 * 
 * The Master Agent is the central orchestration system that:
 * 1. Analyzes user input to create profiles
 * 2. Selects appropriate specialized agents
 * 3. Deploys and manages agent instances
 * 4. Maintains session state across conversations
 */
export class MasterAgent {
  private sessionManagers: Map<string, SessionManager> = new Map()

  constructor() {
    this.initializeServices()
  }

  /**
   * Initialize all required services
   */
  private async initializeServices(): Promise<void> {
    // Services are initialized through dependency injection
    // This ensures proper service lifecycle management
  }

  /**
   * Analyze user input to generate a comprehensive user profile
   * 
   * @param input - Raw user input text
   * @param sessionId - Optional session ID for context
   * @returns Promise<UserProfile> - Analyzed user profile
   */
  async analyzeUser(input: string, sessionId?: string): Promise<UserProfile> {
    try {
      // Get session context if available
      const sessionContext = sessionId ? await this.getSessionContext(sessionId) : null
      
      // Analyze user input with context
      const profile = await profileAnalyzer.analyzeUserInput({
        input,
        context: sessionContext,
        sessionId
      })

      // Store profile in session if session exists
      if (sessionId) {
        await this.updateSessionProfile(sessionId, profile)
      }

      return profile
    } catch (error) {
      console.error('Error analyzing user:', error)
      throw new Error(`Failed to analyze user: ${(error as Error).message}`)
    }
  }

  /**
   * Select the most appropriate agent based on user profile
   * 
   * @param profile - User profile from analysis
   * @returns Promise<AgentTemplate> - Selected agent template
   */
  async selectAgent(profile: UserProfile): Promise<AgentTemplate> {
    try {
      const selectedAgent = await agentSelector.selectBestAgent({
        profile,
        availableAgents: await this.getAvailableAgents(),
        selectionCriteria: {
          industryMatch: 0.4,
          roleMatch: 0.3,
          sophisticationMatch: 0.2,
          contextualFit: 0.1
        }
      })

      if (!selectedAgent) {
        // Fallback to general business agent
        return await this.getFallbackAgent()
      }

      return selectedAgent
    } catch (error) {
      console.error('Error selecting agent:', error)
      throw new Error(`Failed to select agent: ${(error as Error).message}`)
    }
  }

  /**
   * Deploy a specialized agent instance with user profile context
   * 
   * @param template - Agent template to deploy
   * @param profile - User profile for customization
   * @param sessionId - Session ID for the deployment
   * @returns Promise<SpecializedAgent> - Deployed agent instance
   */
  async deployAgent(
    template: AgentTemplate, 
    profile: UserProfile, 
    sessionId: string
  ): Promise<SpecializedAgent> {
    try {
      // Deploy the agent with profile customization
      const agent = await agentDeployer.deployAgent({
        template,
        profile,
        sessionId,
        customizations: {
          terminology: await this.getTerminologyForProfile(profile),
          questionSet: await this.getQuestionSetForProfile(profile, template),
          conversationStyle: this.getConversationStyleForProfile(profile)
        }
      })

      // Register agent with session
      await this.registerAgentWithSession(sessionId, agent)

      return agent
    } catch (error) {
      console.error('Error deploying agent:', error)
      throw new Error(`Failed to deploy agent: ${(error as Error).message}`)
    }
  }

  /**
   * Get or create session manager for a session
   * 
   * @param sessionId - Session identifier
   * @returns Promise<SessionManager> - Session manager instance
   */
  async manageSession(sessionId: string): Promise<SessionManager> {
    try {
      // Check if session manager already exists
      if (this.sessionManagers.has(sessionId)) {
        return this.sessionManagers.get(sessionId)!
      }

      // Create new session manager
      const sessionManager = await sessionStore.createSession({
        sessionId,
        masterAgent: this,
        configuration: {
          maxDuration: 24 * 60 * 60 * 1000, // 24 hours
          autoSave: true,
          compressionEnabled: true
        }
      })

      this.sessionManagers.set(sessionId, sessionManager)
      return sessionManager
    } catch (error) {
      console.error('Error managing session:', error)
      throw new Error(`Failed to manage session: ${(error as Error).message}`)
    }
  }

  /**
   * Complete flow: Analyze user, select agent, and deploy
   * 
   * @param input - User input
   * @param sessionId - Session ID
   * @returns Promise with deployed agent and profile
   */
  async processUserRequest(input: string, sessionId: string): Promise<{
    profile: UserProfile
    agent: SpecializedAgent
    sessionManager: SessionManager
  }> {
    try {
      // Step 1: Analyze user input
      const profile = await this.analyzeUser(input, sessionId)
      
      // Step 2: Select appropriate agent
      const template = await this.selectAgent(profile)
      
      // Step 3: Deploy the agent
      const agent = await this.deployAgent(template, profile, sessionId)
      
      // Step 4: Get session manager
      const sessionManager = await this.manageSession(sessionId)
      
      return { profile, agent, sessionManager }
    } catch (error) {
      console.error('Error processing user request:', error)
      throw new Error(`Failed to process user request: ${(error as Error).message}`)
    }
  }

  /**
   * Get session context for analysis
   */
  private async getSessionContext(sessionId: string): Promise<any> {
    const sessionManager = this.sessionManagers.get(sessionId)
    return sessionManager ? await sessionManager.getContext() : null
  }

  /**
   * Update session with new profile information
   */
  private async updateSessionProfile(sessionId: string, profile: UserProfile): Promise<void> {
    const sessionManager = await this.manageSession(sessionId)
    await sessionManager.updateProfile(profile)
  }

  /**
   * Get list of available agent templates
   */
  private async getAvailableAgents(): Promise<AgentTemplate[]> {
    // This will be implemented in the Agent Template System (TASK-004)
    return []
  }

  /**
   * Get fallback general business agent
   */
  private async getFallbackAgent(): Promise<AgentTemplate> {
    // Return a basic general business agent template
    return {
      id: 'general-business',
      name: 'General Business Agent',
      domain: 'general',
      version: '1.0.0',
      description: 'General purpose business application agent',
      questionBank: [],
      terminology: new Map(),
      assumptionTemplates: [],
      conversationFlow: {
        stages: ['idea-clarity', 'user-workflow', 'technical-specs', 'wireframes'],
        transitions: {},
        configuration: {}
      },
      metadata: {
        created: new Date(),
        lastUpdated: new Date(),
        deploymentCount: 0
      }
    }
  }

  /**
   * Get terminology mapping for user profile
   */
  private async getTerminologyForProfile(profile: UserProfile): Promise<Map<string, string>> {
    // This will be enhanced based on profile industry and sophistication
    return new Map([
      ['app', profile.sophisticationLevel === 'high' ? 'application' : 'app'],
      ['user', profile.role === 'technical' ? 'end user' : 'customer'],
      ['feature', profile.sophisticationLevel === 'high' ? 'functionality' : 'feature']
    ])
  }

  /**
   * Get question set based on profile and template
   */
  private async getQuestionSetForProfile(
    profile: UserProfile, 
    template: AgentTemplate
  ): Promise<any[]> {
    // This will be implemented in Domain-Specific Question Banks (TASK-005)
    return []
  }

  /**
   * Get conversation style based on profile
   */
  private getConversationStyleForProfile(profile: UserProfile): string {
    if (profile.sophisticationLevel === 'high') {
      return 'professional'
    } else if (profile.sophisticationLevel === 'medium') {
      return 'balanced'
    } else {
      return 'friendly'
    }
  }

  /**
   * Register agent with session for tracking
   */
  private async registerAgentWithSession(
    sessionId: string, 
    agent: SpecializedAgent
  ): Promise<void> {
    const sessionManager = await this.manageSession(sessionId)
    await sessionManager.registerAgent(agent)
  }

  /**
   * Health check for master agent
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    services: Record<string, boolean>
    activeSessions: number
  }> {
    try {
      return {
        status: 'healthy',
        services: {
          openai: await this.checkOpenAIHealth(),
          sessionStore: await sessionStore.healthCheck(),
          profileAnalyzer: await profileAnalyzer.healthCheck(),
          agentSelector: await agentSelector.healthCheck()
        },
        activeSessions: this.sessionManagers.size
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        services: {},
        activeSessions: 0
      }
    }
  }

  /**
   * Check OpenAI service health
   */
  private async checkOpenAIHealth(): Promise<boolean> {
    try {
      const result = await openaiService.testConnection()
      return result.success
    } catch {
      return false
    }
  }
}

// Export singleton instance
export const masterAgent = new MasterAgent() 