import { AgentTemplate, UserProfile, AgentSelectionRequest, SelectionCriteria } from '@/lib/types/agent-types'

/**
 * Agent Selector Service
 * 
 * Selects the most appropriate agent template based on user profile analysis
 * and selection criteria with weighted scoring algorithm
 */
export class AgentSelector {

  /**
   * Select the best agent based on user profile and criteria
   */
  async selectBestAgent(request: AgentSelectionRequest): Promise<AgentTemplate | null> {
    const { profile, availableAgents, selectionCriteria } = request

    try {
      if (!availableAgents || availableAgents.length === 0) {
        return null
      }

      // Score each agent against the user profile
      const scoredAgents = availableAgents.map(agent => ({
        agent,
        score: this.calculateAgentScore(agent, profile, selectionCriteria)
      }))

      // Sort by score descending
      scoredAgents.sort((a, b) => b.score - a.score)

      // Return the highest scoring agent if score is above threshold
      const bestAgent = scoredAgents[0]
      if (bestAgent.score >= 0.3) { // Minimum confidence threshold
        return bestAgent.agent
      }

      return null
    } catch (error) {
      console.error('Error selecting agent:', error)
      return null
    }
  }

  /**
   * Calculate agent suitability score for a user profile
   */
  private calculateAgentScore(
    agent: AgentTemplate, 
    profile: UserProfile, 
    criteria: SelectionCriteria
  ): number {
    let totalScore = 0

    // Industry match scoring
    const industryScore = this.calculateIndustryMatch(agent, profile)
    totalScore += industryScore * criteria.industryMatch

    // Role match scoring
    const roleScore = this.calculateRoleMatch(agent, profile)
    totalScore += roleScore * criteria.roleMatch

    // Sophistication match scoring
    const sophisticationScore = this.calculateSophisticationMatch(agent, profile)
    totalScore += sophisticationScore * criteria.sophisticationMatch

    // Contextual fit scoring
    const contextualScore = this.calculateContextualFit(agent, profile)
    totalScore += contextualScore * criteria.contextualFit

    return Math.max(0, Math.min(1, totalScore))
  }

  /**
   * Calculate how well agent domain matches user industry
   */
  private calculateIndustryMatch(agent: AgentTemplate, profile: UserProfile): number {
    // Direct domain match
    if (agent.domain === profile.industry) {
      return 1.0
    }

    // Related domain mapping
    const relatedDomains: Record<string, string[]> = {
      'fintech': ['finance', 'banking', 'payments', 'trading'],
      'healthcare': ['medical', 'pharma', 'biotech', 'health'],
      'ecommerce': ['retail', 'marketplace', 'commerce', 'shopping'],
      'saas': ['software', 'tech', 'enterprise'],
      'consumer': ['mobile', 'social', 'gaming', 'entertainment'],
      'enterprise': ['business', 'corporate', 'b2b']
    }

    // Check if user industry is related to agent domain
    const agentRelated = relatedDomains[agent.domain] || []
    if (agentRelated.includes(profile.industry)) {
      return 0.7
    }

    // Check if agent domain is related to user industry
    for (const [domain, related] of Object.entries(relatedDomains)) {
      if (domain === profile.industry && related.includes(agent.domain)) {
        return 0.7
      }
    }

    // General agents match everything at lower score
    if (agent.domain === 'general') {
      return 0.5
    }

    return 0.2 // Poor match
  }

  /**
   * Calculate role compatibility score
   */
  private calculateRoleMatch(agent: AgentTemplate, profile: UserProfile): number {
    // Analyze agent's question bank and terminology for role fit
    const technicalTerms = [
      'api', 'database', 'architecture', 'integration', 'technical',
      'implementation', 'infrastructure', 'security', 'performance'
    ]

    const businessTerms = [
      'business', 'process', 'workflow', 'requirements', 'stakeholder',
      'user experience', 'customer', 'market', 'revenue', 'strategy'
    ]

    // Check agent terminology for role alignment
    const agentTerminology = Array.from(agent.terminology.keys()).join(' ').toLowerCase()
    
    const technicalMatches = technicalTerms.filter(term => 
      agentTerminology.includes(term)
    ).length

    const businessMatches = businessTerms.filter(term => 
      agentTerminology.includes(term)
    ).length

    // Score based on role alignment
    switch (profile.role) {
      case 'technical':
        return technicalMatches > businessMatches ? 
          Math.min(1.0, technicalMatches / 5) : 
          Math.max(0.3, businessMatches / 10)
      
      case 'business':
        return businessMatches > technicalMatches ? 
          Math.min(1.0, businessMatches / 5) : 
          Math.max(0.3, technicalMatches / 10)
      
      case 'hybrid':
        return Math.min(1.0, (technicalMatches + businessMatches) / 8)
      
      default:
        return 0.5 // Unknown role gets neutral score
    }
  }

  /**
   * Calculate sophistication level compatibility
   */
  private calculateSophisticationMatch(agent: AgentTemplate, profile: UserProfile): number {
    // Analyze agent complexity based on question bank and terminology
    const questionComplexity = agent.questionBank.reduce((total, questionSet) => {
      return total + questionSet.questions.length
    }, 0)

    const terminologyComplexity = agent.terminology.size

    // Calculate agent sophistication score
    let agentSophistication: number
    if (questionComplexity > 50 && terminologyComplexity > 20) {
      agentSophistication = 0.8 // High sophistication
    } else if (questionComplexity > 25 && terminologyComplexity > 10) {
      agentSophistication = 0.5 // Medium sophistication  
    } else {
      agentSophistication = 0.2 // Low sophistication
    }

    // Calculate match score based on profile sophistication
    const profileSophistication = profile.sophisticationScore

    // Closer sophistication levels = better match
    return 1.0 - Math.abs(agentSophistication - profileSophistication)
  }

  /**
   * Calculate contextual fit based on conversation history and keywords
   */
  private calculateContextualFit(agent: AgentTemplate, profile: UserProfile): number {
    try {
      // Analyze overlap between profile keywords and agent terminology
      const profileKeywords = [...profile.detectedKeywords, ...profile.terminology]
      const agentTerms = Array.from(agent.terminology.keys())
      
      if (profileKeywords.length === 0 || agentTerms.length === 0) {
        return 0.5 // Neutral score when no keywords available
      }

      // Calculate keyword overlap
      const overlap = profileKeywords.filter(keyword =>
        agentTerms.some(term => 
          term.toLowerCase().includes(keyword.toLowerCase()) ||
          keyword.toLowerCase().includes(term.toLowerCase())
        )
      ).length

      const overlapRatio = overlap / Math.max(profileKeywords.length, agentTerms.length)
      
      // Boost score for conversation history relevance
      const conversationBoost = Math.min(0.2, profile.conversationHistory.length / 20)
      
      return Math.min(1.0, overlapRatio + conversationBoost)
    } catch (error) {
      console.warn('Contextual fit calculation failed:', error)
      return 0.5
    }
  }

  /**
   * Get agent selection recommendations with explanations
   */
  async getAgentRecommendations(
    profile: UserProfile, 
    availableAgents: AgentTemplate[],
    limit: number = 3
  ): Promise<Array<{
    agent: AgentTemplate
    score: number
    reasoning: string
  }>> {
    const defaultCriteria: SelectionCriteria = {
      industryMatch: 0.4,
      roleMatch: 0.3,
      sophisticationMatch: 0.2,
      contextualFit: 0.1
    }

    try {
      const scoredAgents = availableAgents.map(agent => {
        const score = this.calculateAgentScore(agent, profile, defaultCriteria)
        const reasoning = this.generateReasoningExplanation(agent, profile, score)
        
        return { agent, score, reasoning }
      })

      return scoredAgents
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
    } catch (error) {
      console.error('Error getting agent recommendations:', error)
      return []
    }
  }

  /**
   * Generate human-readable reasoning for agent selection
   */
  private generateReasoningExplanation(
    agent: AgentTemplate, 
    profile: UserProfile, 
    score: number
  ): string {
    const reasons: string[] = []

    // Industry match reasoning
    if (agent.domain === profile.industry) {
      reasons.push(`Perfect industry match (${profile.industry})`)
    } else if (agent.domain === 'general') {
      reasons.push('General-purpose agent suitable for any industry')
    } else {
      reasons.push(`Cross-industry experience (${agent.domain} → ${profile.industry})`)
    }

    // Role match reasoning
    if (profile.role !== 'unknown') {
      reasons.push(`Optimized for ${profile.role} users`)
    }

    // Sophistication reasoning
    if (profile.sophisticationLevel === 'high') {
      reasons.push('Handles complex technical requirements')
    } else if (profile.sophisticationLevel === 'low') {
      reasons.push('Simplified, user-friendly approach')
    }

    // Confidence reasoning
    if (score > 0.8) {
      reasons.push('High confidence match')
    } else if (score > 0.6) {
      reasons.push('Good compatibility')
    } else if (score > 0.4) {
      reasons.push('Reasonable fit with some adaptation')
    } else {
      reasons.push('May require significant customization')
    }

    return reasons.join('; ')
  }

  /**
   * Health check for the service
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Test basic functionality with mock data
      const mockProfile: UserProfile = {
        id: 'test',
        industry: 'fintech',
        industryConfidence: 0.8,
        role: 'technical',
        roleConfidence: 0.7,
        sophisticationLevel: 'high',
        sophisticationScore: 0.8,
        conversationHistory: [],
        detectedKeywords: ['api', 'payment'],
        terminology: ['rest', 'microservices'],
        preferredCommunicationStyle: 'technical',
        assumptionTolerance: 'low',
        created: new Date(),
        lastUpdated: new Date(),
        analysisVersion: '1.0.0'
      }

      const mockAgent: AgentTemplate = {
        id: 'test-agent',
        name: 'Test Agent',
        domain: 'fintech',
        version: '1.0.0',
        description: 'Test agent',
        questionBank: [],
        terminology: new Map([['api', 'Application Programming Interface']]),
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

      const result = await this.selectBestAgent({
        profile: mockProfile,
        availableAgents: [mockAgent],
        selectionCriteria: {
          industryMatch: 0.4,
          roleMatch: 0.3,
          sophisticationMatch: 0.2,
          contextualFit: 0.1
        }
      })

      return result !== null
    } catch {
      return false
    }
  }
}

// Export singleton instance
export const agentSelector = new AgentSelector() 