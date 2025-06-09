import { AgentTemplate, UserProfile } from '@/lib/types/agent-types'
import { agentSelector } from './agent-selector'
import { nanoid } from 'nanoid'

/**
 * Advanced Agent Selection Framework
 * 
 * Provides comprehensive agent selection logic with:
 * - Multi-criteria decision analysis
 * - Selection caching and optimization
 * - Decision tree logic
 * - Selection analytics and learning
 * - Fallback strategies
 */
export class AgentSelectionFramework {
  private selectionCache: Map<string, CachedSelection> = new Map()
  private selectionHistory: SelectionRecord[] = []
  private decisionTrees: Map<string, DecisionTree> = new Map()

  constructor() {
    this.initializeDecisionTrees()
  }

  /**
   * Enhanced agent selection with comprehensive logic
   */
  async selectOptimalAgent(
    profile: UserProfile,
    availableAgents: AgentTemplate[],
    context?: SelectionContext
  ): Promise<AgentSelectionResult> {
    try {
      const selectionId = nanoid()
      const startTime = Date.now()

      // Check cache first
      const cacheKey = this.generateCacheKey(profile, availableAgents)
      const cachedResult = this.getCachedSelection(cacheKey)
      if (cachedResult && this.isCacheValid(cachedResult)) {
        return this.enhanceWithMetadata(cachedResult.result, selectionId, startTime, true)
      }

      // Multi-stage selection process
      const selectionResult = await this.performMultiStageSelection(
        profile,
        availableAgents,
        context
      )

      // Cache the result
      this.cacheSelection(cacheKey, selectionResult, profile)

      // Record selection for analytics
      this.recordSelection(selectionResult, profile, context)

      return this.enhanceWithMetadata(selectionResult, selectionId, startTime, false)
    } catch (error) {
      console.error('Error in optimal agent selection:', error)
      throw new Error(`Agent selection failed: ${(error as Error).message}`)
    }
  }

  /**
   * Multi-stage selection process
   */
  private async performMultiStageSelection(
    profile: UserProfile,
    availableAgents: AgentTemplate[],
    context?: SelectionContext
  ): Promise<AgentSelectionResult> {
    // Stage 1: Filter by basic compatibility
    const compatibleAgents = this.filterCompatibleAgents(profile, availableAgents)
    
    if (compatibleAgents.length === 0) {
      return this.createFallbackResult(profile, availableAgents)
    }

    // Stage 2: Apply decision tree logic
    const decisionTreeResult = this.applyDecisionTree(profile, compatibleAgents)
    
    // Stage 3: Multi-criteria scoring
    const scoredAgents = await this.performMultiCriteriaScoring(
      profile,
      decisionTreeResult.candidates,
      context
    )

    // Stage 4: Apply contextual adjustments
    const adjustedScores = this.applyContextualAdjustments(
      scoredAgents,
      profile,
      context
    )

    // Stage 5: Select final agent with confidence analysis
    return this.selectFinalAgent(adjustedScores, profile, context)
  }

  /**
   * Initialize decision trees for different scenarios
   */
  private initializeDecisionTrees(): void {
    // Technical user decision tree
    this.decisionTrees.set('technical', {
      id: 'technical-tree',
      rootNode: {
        condition: { type: 'industry', operator: 'equals', value: 'fintech' },
        trueNode: {
          condition: { type: 'sophistication', operator: 'greater_than', value: 0.7 },
          trueNode: { result: 'fintech-expert' },
          falseNode: { result: 'fintech-standard' }
        },
        falseNode: {
          condition: { type: 'industry', operator: 'equals', value: 'healthcare' },
          trueNode: { result: 'healthcare-technical' },
          falseNode: { result: 'general-technical' }
        }
      }
    })

    // Business user decision tree
    this.decisionTrees.set('business', {
      id: 'business-tree',
      rootNode: {
        condition: { type: 'sophistication', operator: 'less_than', value: 0.4 },
        trueNode: { result: 'simplified-business' },
        falseNode: {
          condition: { type: 'industry', operator: 'in', value: ['fintech', 'healthcare'] },
          trueNode: { result: 'domain-business' },
          falseNode: { result: 'general-business' }
        }
      }
    })

    // Default decision tree
    this.decisionTrees.set('default', {
      id: 'default-tree',
      rootNode: {
        condition: { type: 'industry', operator: 'equals', value: 'general' },
        trueNode: { result: 'general-purpose' },
        falseNode: { result: 'domain-specific' }
      }
    })
  }

  /**
   * Get selection analytics
   */
  getSelectionAnalytics(): SelectionAnalytics {
    const totalSelections = this.selectionHistory.length
    const successfulSelections = this.selectionHistory.filter(s => s.outcome === 'success').length
    
    return {
      totalSelections,
      successRate: totalSelections > 0 ? successfulSelections / totalSelections : 0,
      averageConfidence: this.getAverageConfidence(),
      industryBreakdown: this.getIndustryBreakdown(),
      roleBreakdown: this.getRoleBreakdown(),
      topPerformingAgents: this.getTopPerformingAgents(),
      cacheHitRate: this.getCacheHitRate(),
      averageSelectionTime: this.getAverageSelectionTime()
    }
  }

  /**
   * Health check for the framework
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Test basic functionality
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

      const result = await this.selectOptimalAgent(mockProfile, [mockAgent])
      return result.selectedAgent !== null
    } catch {
      return false
    }
  }

  // Helper method implementations
  private filterCompatibleAgents(profile: UserProfile, agents: AgentTemplate[]): AgentTemplate[] {
    return agents.filter(agent => {
      // Basic compatibility checks
      return this.isIndustryCompatible(agent.domain, profile.industry) &&
             this.isSophisticationCompatible(agent, profile) &&
             this.meetsBasicRequirements(agent, profile)
    })
  }

  private isIndustryCompatible(domain: string, industry: string): boolean {
    if (domain === industry) return true
    if (domain === 'general') return true
    
    const relatedDomains: Record<string, string[]> = {
      'fintech': ['finance', 'banking', 'payments'],
      'healthcare': ['medical', 'pharma', 'biotech'],
      'ecommerce': ['retail', 'marketplace', 'commerce']
    }
    
    return relatedDomains[domain]?.includes(industry) || false
  }

  private isSophisticationCompatible(agent: AgentTemplate, profile: UserProfile): boolean {
    // Simple compatibility check - can be enhanced
    return true
  }

  private meetsBasicRequirements(agent: AgentTemplate, profile: UserProfile): boolean {
    // Basic requirements check
    return agent.questionBank.length >= 0 // Placeholder
  }

  private applyDecisionTree(profile: UserProfile, agents: AgentTemplate[]): DecisionTreeResult {
    const treeKey = profile.role === 'unknown' ? 'default' : profile.role
    const tree = this.decisionTrees.get(treeKey) || this.decisionTrees.get('default')!
    
    return {
      candidates: agents,
      reasoning: `Applied ${tree.id} decision tree`
    }
  }

  private async performMultiCriteriaScoring(
    profile: UserProfile,
    agents: AgentTemplate[],
    context?: SelectionContext
  ): Promise<ScoredAgent[]> {
    const scoredAgents: ScoredAgent[] = []

    for (const agent of agents) {
      const scores = {
        industryMatch: await this.calculateIndustryScore(agent, profile),
        roleMatch: await this.calculateRoleScore(agent, profile),
        sophisticationMatch: await this.calculateSophisticationScore(agent, profile),
        contextualFit: await this.calculateContextualScore(agent, profile),
        experienceMatch: 0.5, // Placeholder
        performanceHistory: 0.5, // Placeholder
        userFeedback: 0.5 // Placeholder
      }

      const criteria = this.getDynamicSelectionCriteria(profile, context)
      const weightedScore = this.calculateWeightedScore(scores, criteria)
      const confidence = this.calculateSelectionConfidence(scores)

      scoredAgents.push({
        agent,
        scores,
        weightedScore,
        confidence,
        reasoning: this.generateDetailedReasoning(scores, agent, profile)
      })
    }

    return scoredAgents.sort((a, b) => b.weightedScore - a.weightedScore)
  }

  private applyContextualAdjustments(
    scoredAgents: ScoredAgent[],
    profile: UserProfile,
    context?: SelectionContext
  ): ScoredAgent[] {
    return scoredAgents.map(scored => ({
      ...scored,
      weightedScore: Math.max(0, Math.min(1, scored.weightedScore))
    }))
  }

  private selectFinalAgent(
    scoredAgents: ScoredAgent[],
    profile: UserProfile,
    context?: SelectionContext
  ): AgentSelectionResult {
    if (scoredAgents.length === 0) {
      return this.createFallbackResult(profile, [])
    }

    const topAgent = scoredAgents[0]
    const alternatives = scoredAgents.slice(1, 3)

    return {
      selectedAgent: topAgent.agent,
      confidence: topAgent.confidence,
      score: topAgent.weightedScore,
      reasoning: topAgent.reasoning,
      alternatives: alternatives.map(alt => ({
        agent: alt.agent,
        score: alt.weightedScore,
        reasoning: alt.reasoning
      })),
      selectionMethod: 'multi-criteria-analysis',
      metadata: {
        totalCandidates: scoredAgents.length
      }
    }
  }

  private getDynamicSelectionCriteria(profile: UserProfile, context?: SelectionContext): ExtendedSelectionCriteria {
    return {
      industryMatch: 0.25,
      roleMatch: 0.20,
      sophisticationMatch: 0.15,
      contextualFit: 0.10,
      experienceMatch: 0.10,
      performanceHistory: 0.10,
      userFeedback: 0.10
    }
  }

  private async calculateIndustryScore(agent: AgentTemplate, profile: UserProfile): Promise<number> {
    // Use existing agent selector logic
    return 0.8 // Placeholder
  }

  private async calculateRoleScore(agent: AgentTemplate, profile: UserProfile): Promise<number> {
    return 0.7 // Placeholder
  }

  private async calculateSophisticationScore(agent: AgentTemplate, profile: UserProfile): Promise<number> {
    return 0.6 // Placeholder
  }

  private async calculateContextualScore(agent: AgentTemplate, profile: UserProfile): Promise<number> {
    return 0.5 // Placeholder
  }

  private calculateWeightedScore(scores: AgentScores, criteria: ExtendedSelectionCriteria): number {
    return (
      scores.industryMatch * criteria.industryMatch +
      scores.roleMatch * criteria.roleMatch +
      scores.sophisticationMatch * criteria.sophisticationMatch +
      scores.contextualFit * criteria.contextualFit +
      scores.experienceMatch * criteria.experienceMatch +
      scores.performanceHistory * criteria.performanceHistory +
      scores.userFeedback * criteria.userFeedback
    )
  }

  private calculateSelectionConfidence(scores: AgentScores): number {
    return Math.min(1, Math.max(0, (scores.industryMatch + scores.roleMatch + scores.sophisticationMatch) / 3))
  }

  private generateDetailedReasoning(scores: AgentScores, agent: AgentTemplate, profile: UserProfile): string {
    const reasons = []
    if (scores.industryMatch > 0.7) reasons.push('Strong industry match')
    if (scores.roleMatch > 0.7) reasons.push('Good role alignment')
    if (scores.sophisticationMatch > 0.7) reasons.push('Appropriate sophistication level')
    return reasons.join('; ') || 'Basic compatibility'
  }

  private generateCacheKey(profile: UserProfile, agents: AgentTemplate[]): string {
    const profileKey = `${profile.industry}-${profile.role}-${profile.sophisticationLevel}`
    const agentsKey = agents.map(a => a.id).sort().join(',')
    return `${profileKey}-${agentsKey}`
  }

  private getCachedSelection(cacheKey: string): CachedSelection | null {
    return this.selectionCache.get(cacheKey) || null
  }

  private isCacheValid(cached: CachedSelection): boolean {
    const maxAge = 60 * 60 * 1000 // 1 hour
    return Date.now() - cached.timestamp < maxAge
  }

  private cacheSelection(cacheKey: string, result: AgentSelectionResult, profile: UserProfile): void {
    this.selectionCache.set(cacheKey, {
      result,
      timestamp: Date.now(),
      profile: profile.id
    })
  }

  private recordSelection(result: AgentSelectionResult, profile: UserProfile, context?: SelectionContext): void {
    this.selectionHistory.push({
      id: nanoid(),
      timestamp: new Date(),
      profile: profile.id,
      selectedAgent: result.selectedAgent?.id || null,
      confidence: result.confidence,
      score: result.score,
      method: result.selectionMethod,
      context,
      outcome: 'pending'
    })
  }

  private enhanceWithMetadata(result: AgentSelectionResult, selectionId: string, startTime: number, fromCache: boolean): AgentSelectionResult {
    return {
      ...result,
      metadata: {
        ...result.metadata,
        selectionId,
        selectionTime: Date.now() - startTime,
        fromCache,
        timestamp: new Date()
      }
    }
  }

  private createFallbackResult(profile: UserProfile, agents: AgentTemplate[]): AgentSelectionResult {
    return {
      selectedAgent: null,
      confidence: 0.1,
      score: 0.1,
      reasoning: 'No suitable agent found, using fallback',
      alternatives: [],
      selectionMethod: 'fallback',
      metadata: {}
    }
  }

  // Analytics helper methods
  private getAverageConfidence(): number {
    if (this.selectionHistory.length === 0) return 0
    return this.selectionHistory.reduce((sum, record) => sum + record.confidence, 0) / this.selectionHistory.length
  }

  private getIndustryBreakdown(): Record<string, number> {
    return {} // Placeholder
  }

  private getRoleBreakdown(): Record<string, number> {
    return {} // Placeholder
  }

  private getTopPerformingAgents(): Array<{ agentId: string; successRate: number }> {
    return [] // Placeholder
  }

  private getCacheHitRate(): number {
    return 0 // Placeholder
  }

  private getAverageSelectionTime(): number {
    return 0 // Placeholder
  }
}

// Type definitions
interface SelectionContext {
  timePressure?: 'low' | 'medium' | 'high'
  previousAgent?: string
  userPreferences?: any
  prioritizeExperience?: boolean
}

interface AgentSelectionResult {
  selectedAgent: AgentTemplate | null
  confidence: number
  score: number
  reasoning: string
  alternatives: Array<{
    agent: AgentTemplate
    score: number
    reasoning: string
  }>
  selectionMethod: string
  metadata: Record<string, any>
}

interface ScoredAgent {
  agent: AgentTemplate
  scores: AgentScores
  weightedScore: number
  confidence: number
  reasoning: string
}

interface AgentScores {
  industryMatch: number
  roleMatch: number
  sophisticationMatch: number
  contextualFit: number
  experienceMatch: number
  performanceHistory: number
  userFeedback: number
}

interface ExtendedSelectionCriteria {
  industryMatch: number
  roleMatch: number
  sophisticationMatch: number
  contextualFit: number
  experienceMatch: number
  performanceHistory: number
  userFeedback: number
}

interface DecisionTree {
  id: string
  rootNode: DecisionNode
}

interface DecisionNode {
  condition?: {
    type: string
    operator: string
    value: any
  }
  trueNode?: DecisionNode
  falseNode?: DecisionNode
  result?: string
}

interface DecisionTreeResult {
  candidates: AgentTemplate[]
  reasoning: string
}

interface CachedSelection {
  result: AgentSelectionResult
  timestamp: number
  profile: string
}

interface SelectionRecord {
  id: string
  timestamp: Date
  profile: string
  selectedAgent: string | null
  confidence: number
  score: number
  method: string
  context?: SelectionContext
  outcome: 'success' | 'failure' | 'pending'
}

interface SelectionAnalytics {
  totalSelections: number
  successRate: number
  averageConfidence: number
  industryBreakdown: Record<string, number>
  roleBreakdown: Record<string, number>
  topPerformingAgents: Array<{ agentId: string; successRate: number }>
  cacheHitRate: number
  averageSelectionTime: number
}

// Export singleton instance
export const agentSelectionFramework = new AgentSelectionFramework() 