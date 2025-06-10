/**
 * Adaptive Questioning Style System
 * 
 * Dynamically adjusts conversation approach based on:
 * - User sophistication level (novice, intermediate, advanced, expert)
 * - Engagement patterns (highly-engaged, engaged, moderately-engaged, disengaged)
 * - Behavioral signals (impatient, confused, expert-skip, collaborative)
 * - Domain expertise demonstration requirements
 */

import { openai } from '../openai/client'
import type { 
  ConversationContext, 
  QuestionGenerationResult,
  SophisticationLevel,
  EngagementLevel,
  Domain
} from '../types/conversation'
import type { EnhancedResponseAnalysis } from './response-analyzer'

export type QuestioningStyle = 
  | 'novice-friendly'      // Simple, educational, step-by-step
  | 'intermediate-guided'  // Balanced, some technical depth
  | 'advanced-technical'   // Technical focus, industry terminology
  | 'expert-efficient'     // Rapid, assumes deep knowledge
  | 'impatient-accelerated' // Quick, assumption-heavy
  | 'confused-supportive'  // Clarifying, patient, examples
  | 'collaborative-exploratory' // Open-ended, discovery-focused

export interface QuestioningStyleProfile {
  style: QuestioningStyle
  characteristics: {
    complexity: 'low' | 'medium' | 'high' | 'expert'
    pace: 'slow' | 'moderate' | 'fast' | 'rapid'
    terminology: 'simple' | 'business' | 'technical' | 'expert'
    depth: 'surface' | 'moderate' | 'deep' | 'comprehensive'
    examples: 'many' | 'some' | 'few' | 'none'
    assumptions: 'minimal' | 'moderate' | 'significant' | 'extensive'
  }
  promptModifiers: {
    tone: string
    structure: string
    focus: string
    constraints: string[]
  }
  questionPatterns: {
    openingStyle: string
    followUpApproach: string
    clarificationMethod: string
    progressionLogic: string
  }
}

export interface StyleAdaptationTriggers {
  sophisticationChange: {
    threshold: number
    direction: 'increase' | 'decrease'
    newStyle: QuestioningStyle
  }
  engagementDrop: {
    threshold: number
    duration: number // number of exchanges
    adaptationStyle: QuestioningStyle
  }
  confusionSignals: {
    clarityThreshold: number
    supportStyle: QuestioningStyle
  }
  expertiseSkip: {
    confidenceThreshold: number
    acceleratedStyle: QuestioningStyle
  }
  impatience: {
    urgencyLevel: 'mild' | 'moderate' | 'high'
    adaptationStyle: QuestioningStyle
  }
}

export class AdaptiveQuestioningStyleEngine {
  private readonly model: string
  private readonly styleProfiles: Map<QuestioningStyle, QuestioningStyleProfile>
  private readonly adaptationTriggers: StyleAdaptationTriggers

  constructor(model: string = 'gpt-4o-mini') {
    this.model = model
    this.styleProfiles = new Map()
    this.adaptationTriggers = this.initializeAdaptationTriggers()
    this.initializeStyleProfiles()
  }

  /**
   * Determine optimal questioning style based on user analysis
   */
  determineQuestioningStyle(
    context: ConversationContext,
    responseAnalysis: EnhancedResponseAnalysis
  ): QuestioningStyle {
    const { userProfile, conversationHistory } = context
    
    // Check for immediate adaptation triggers first
    const triggerStyle = this.checkAdaptationTriggers(context, responseAnalysis)
    if (triggerStyle) return triggerStyle

    // Calculate composite sophistication score
    const sophisticationScore = this.calculateSophisticationScore(responseAnalysis)
    
    // Calculate engagement trend
    const engagementTrend = this.calculateEngagementTrend(conversationHistory)
    
    // Check for behavioral signals
    const behavioralSignals = this.analyzeBehavioralSignals(responseAnalysis)

    // Determine style based on multi-factor analysis
    return this.selectOptimalStyle(
      sophisticationScore,
      engagementTrend,
      behavioralSignals,
      userProfile.sophisticationLevel,
      userProfile.engagementPattern
    )
  }

  /**
   * Generate style-adapted question using the determined questioning approach
   */
  async generateStyleAdaptedQuestion(
    context: ConversationContext,
    responseAnalysis: EnhancedResponseAnalysis,
    questioningStyle: QuestioningStyle,
    baseQuestion?: QuestionGenerationResult
  ): Promise<QuestionGenerationResult> {
    try {
      const styleProfile = this.styleProfiles.get(questioningStyle)!
      const prompt = this.buildStyleAdaptedPrompt(
        context,
        responseAnalysis,
        styleProfile,
        baseQuestion
      )
      
      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: this.getTemperatureForStyle(questioningStyle)
      })

      const content = response.choices[0].message.content || '{}'
      let result
      
      try {
        result = JSON.parse(content)
      } catch (parseError) {
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0])
        } else {
          throw new Error(`Invalid JSON response from style adaptation: ${content}`)
        }
      }
      
      return {
        question: result.question,
        questionType: result.questionType,
        sophisticationLevel: result.sophisticationLevel,
        domainContext: result.domainContext,
        followUpSuggestions: result.followUpSuggestions || [],
        confidence: result.confidence || 0.8,
        reasoning: result.reasoning,
        expectedResponseTypes: result.expectedResponseTypes || [],
        metadata: {
          model: this.model,
          tokens: response.usage?.total_tokens || 0,
          timestamp: new Date().toISOString(),
          questioningStyle,
          styleProfile: styleProfile.characteristics
        }
      }
    } catch (error) {
      console.error('Error generating style-adapted question:', error)
      throw new Error(`Failed to generate style-adapted question: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Monitor and recommend style adaptations during conversation
   */
  monitorStyleEffectiveness(
    context: ConversationContext,
    currentStyle: QuestioningStyle,
    responseAnalysis: EnhancedResponseAnalysis
  ): {
    effectiveness: number // 0-1 score
    recommendedAdaptation?: QuestioningStyle
    reasoning: string
    confidence: number
  } {
    const engagementScore = this.calculateEngagementScore(responseAnalysis)
    const clarityScore = this.calculateClarityScore(responseAnalysis)
    const sophisticationAlignment = this.calculateSophisticationAlignment(
      currentStyle, 
      responseAnalysis
    )

    const effectiveness = (engagementScore + clarityScore + sophisticationAlignment) / 3

    // Determine if adaptation is needed
    let recommendedAdaptation: QuestioningStyle | undefined
    let reasoning = `Current style "${currentStyle}" is performing well`

    if (effectiveness < 0.6) {
      recommendedAdaptation = this.determineQuestioningStyle(context, responseAnalysis)
      reasoning = `Low effectiveness (${effectiveness.toFixed(2)}) suggests adaptation needed`
    } else if (responseAnalysis.advancedEscapeSignals.impatience.detected) {
      recommendedAdaptation = 'impatient-accelerated'
      reasoning = 'Impatience signals detected, accelerating pace'
    } else if (responseAnalysis.advancedEscapeSignals.confusion.detected) {
      recommendedAdaptation = 'confused-supportive'
      reasoning = 'Confusion signals detected, providing more support'
    }

    return {
      effectiveness,
      recommendedAdaptation,
      reasoning,
      confidence: effectiveness > 0.7 ? 0.9 : 0.6
    }
  }

  /**
   * Check for immediate adaptation triggers
   */
  private checkAdaptationTriggers(
    context: ConversationContext,
    responseAnalysis: EnhancedResponseAnalysis
  ): QuestioningStyle | null {
    // Impatience trigger
    if (responseAnalysis.advancedEscapeSignals.impatience.detected) {
      const urgencyLevel = responseAnalysis.advancedEscapeSignals.impatience.urgencyLevel
      if (urgencyLevel === 'high') return 'impatient-accelerated'
      if (urgencyLevel === 'moderate') return 'expert-efficient'
    }

    // Confusion trigger
    if (responseAnalysis.advancedEscapeSignals.confusion.detected) {
      return 'confused-supportive'
    }

    // Expertise skip trigger
    if (responseAnalysis.advancedEscapeSignals.expertise.detected) {
      const skipLevel = responseAnalysis.advancedEscapeSignals.expertise.suggestedSkipLevel
      if (skipLevel === 'advanced') return 'expert-efficient'
      if (skipLevel === 'intermediate') return 'advanced-technical'
    }

    // Engagement drop trigger
    const recentEngagement = this.calculateRecentEngagement(context.conversationHistory)
    if (recentEngagement < this.adaptationTriggers.engagementDrop.threshold) {
      return 'collaborative-exploratory'
    }

    return null
  }

  /**
   * Calculate composite sophistication score
   */
  private calculateSophisticationScore(responseAnalysis: EnhancedResponseAnalysis): number {
    return (
      responseAnalysis.sophisticationBreakdown.technicalLanguage +
      responseAnalysis.sophisticationBreakdown.domainSpecificity +
      responseAnalysis.sophisticationBreakdown.complexityHandling +
      responseAnalysis.sophisticationBreakdown.businessAcumen +
      responseAnalysis.sophisticationBreakdown.communicationClarity
    ) / 5
  }

  /**
   * Calculate engagement trend from conversation history
   */
  private calculateEngagementTrend(conversationHistory: any[]): 'increasing' | 'stable' | 'decreasing' {
    if (conversationHistory.length < 3) return 'stable'
    
    const recentScores = conversationHistory
      .slice(-3)
      .map(h => h.analysis?.engagementLevel || 0.5)
    
    const trend = recentScores[2] - recentScores[0]
    
    if (trend > 0.1) return 'increasing'
    if (trend < -0.1) return 'decreasing'
    return 'stable'
  }

  /**
   * Analyze behavioral signals from response
   */
  private analyzeBehavioralSignals(responseAnalysis: EnhancedResponseAnalysis): {
    impatient: boolean
    confused: boolean
    collaborative: boolean
    expertSkip: boolean
  } {
    return {
      impatient: responseAnalysis.advancedEscapeSignals.impatience.detected,
      confused: responseAnalysis.advancedEscapeSignals.confusion.detected,
      collaborative: responseAnalysis.engagementMetrics.collaborativeSpirit > 0.7,
      expertSkip: responseAnalysis.advancedEscapeSignals.expertise.detected
    }
  }

  /**
   * Select optimal questioning style based on multi-factor analysis
   */
  private selectOptimalStyle(
    sophisticationScore: number,
    engagementTrend: 'increasing' | 'stable' | 'decreasing',
    behavioralSignals: any,
    userSophistication: SophisticationLevel,
    userEngagement?: EngagementLevel
  ): QuestioningStyle {
    // Handle behavioral signals first
    if (behavioralSignals.impatient) return 'impatient-accelerated'
    if (behavioralSignals.confused) return 'confused-supportive'
    if (behavioralSignals.expertSkip) return 'expert-efficient'

    // Handle engagement patterns
    if (engagementTrend === 'decreasing' && userEngagement === 'disengaged') {
      return 'collaborative-exploratory'
    }

    // Handle sophistication-based selection
    if (sophisticationScore >= 0.8 || userSophistication === 'expert') {
      return behavioralSignals.collaborative ? 'collaborative-exploratory' : 'expert-efficient'
    }
    
    if (sophisticationScore >= 0.6 || userSophistication === 'advanced') {
      return 'advanced-technical'
    }
    
    if (sophisticationScore >= 0.4 || userSophistication === 'intermediate') {
      return 'intermediate-guided'
    }
    
    return 'novice-friendly'
  }

  /**
   * Build style-adapted prompt for question generation
   */
  private buildStyleAdaptedPrompt(
    context: ConversationContext,
    responseAnalysis: EnhancedResponseAnalysis,
    styleProfile: QuestioningStyleProfile,
    baseQuestion?: QuestionGenerationResult
  ): string {
    const { userProfile, conversationHistory, stage, domain } = context
    const lastResponse = conversationHistory[conversationHistory.length - 1]?.userResponse || 'No previous response'

    return `You are an expert ${domain} consultant adapting your questioning style to match the user's needs and sophistication level.

QUESTIONING STYLE: ${styleProfile.style}
STYLE CHARACTERISTICS:
- Complexity: ${styleProfile.characteristics.complexity}
- Pace: ${styleProfile.characteristics.pace}
- Terminology: ${styleProfile.characteristics.terminology}
- Depth: ${styleProfile.characteristics.depth}
- Examples: ${styleProfile.characteristics.examples}
- Assumptions: ${styleProfile.characteristics.assumptions}

STYLE MODIFIERS:
- Tone: ${styleProfile.promptModifiers.tone}
- Structure: ${styleProfile.promptModifiers.structure}
- Focus: ${styleProfile.promptModifiers.focus}
- Constraints: ${styleProfile.promptModifiers.constraints.join(', ')}

USER CONTEXT:
- Domain: ${domain}
- Stage: ${stage}
- Sophistication: ${userProfile.sophisticationLevel}
- Engagement: ${userProfile.engagementPattern}
- Last Response: "${lastResponse}"

RESPONSE ANALYSIS:
- Technical Language: ${responseAnalysis.sophisticationBreakdown.technicalLanguage.toFixed(2)}
- Domain Specificity: ${responseAnalysis.sophisticationBreakdown.domainSpecificity.toFixed(2)}
- Engagement Level: ${responseAnalysis.engagementMetrics.interestLevel.toFixed(2)}
- Clarity Score: ${responseAnalysis.clarityMetrics.specificity.toFixed(2)}

QUESTION PATTERNS FOR THIS STYLE:
- Opening: ${styleProfile.questionPatterns.openingStyle}
- Follow-up: ${styleProfile.questionPatterns.followUpApproach}
- Clarification: ${styleProfile.questionPatterns.clarificationMethod}
- Progression: ${styleProfile.questionPatterns.progressionLogic}

${baseQuestion ? `BASE QUESTION TO ADAPT: "${baseQuestion.question}"` : ''}

TASK: Generate a question that perfectly matches the ${styleProfile.style} questioning style while advancing the ${domain} conversation in stage ${stage}.

RESPONSE FORMAT (JSON only):
{
  "question": "Your style-adapted question",
  "questionType": "clarification|deep-dive|technical|business|validation",
  "sophisticationLevel": "novice|intermediate|advanced|expert",
  "domainContext": "Why this question matters in ${domain}",
  "followUpSuggestions": ["style-appropriate follow-ups"],
  "confidence": 0.85,
  "reasoning": "Why this question fits the ${styleProfile.style} style",
  "expectedResponseTypes": ["expected response types"],
  "styleAdaptations": {
    "complexityLevel": "${styleProfile.characteristics.complexity}",
    "paceAdjustment": "${styleProfile.characteristics.pace}",
    "terminologyChoice": "${styleProfile.characteristics.terminology}",
    "exampleUsage": "${styleProfile.characteristics.examples}"
  }
}`
  }

  /**
   * Get appropriate temperature for questioning style
   */
  private getTemperatureForStyle(style: QuestioningStyle): number {
    const temperatureMap: Record<QuestioningStyle, number> = {
      'novice-friendly': 0.3,        // More consistent, educational
      'intermediate-guided': 0.4,    // Balanced consistency
      'advanced-technical': 0.5,     // Some creativity for technical depth
      'expert-efficient': 0.6,       // More creative for efficiency
      'impatient-accelerated': 0.7,  // Creative for rapid adaptation
      'confused-supportive': 0.2,    // Very consistent for clarity
      'collaborative-exploratory': 0.8 // Most creative for exploration
    }
    
    return temperatureMap[style] || 0.5
  }

  /**
   * Calculate engagement score from response analysis
   */
  private calculateEngagementScore(responseAnalysis: EnhancedResponseAnalysis): number {
    return (
      responseAnalysis.engagementMetrics.enthusiasm +
      responseAnalysis.engagementMetrics.interestLevel +
      responseAnalysis.engagementMetrics.participationQuality +
      responseAnalysis.engagementMetrics.proactiveness +
      responseAnalysis.engagementMetrics.collaborativeSpirit
    ) / 5
  }

  /**
   * Calculate clarity score from response analysis
   */
  private calculateClarityScore(responseAnalysis: EnhancedResponseAnalysis): number {
    return (
      responseAnalysis.clarityMetrics.specificity +
      responseAnalysis.clarityMetrics.structuredThinking +
      responseAnalysis.clarityMetrics.completeness +
      responseAnalysis.clarityMetrics.relevance +
      responseAnalysis.clarityMetrics.actionability
    ) / 5
  }

  /**
   * Calculate how well current style aligns with user sophistication
   */
  private calculateSophisticationAlignment(
    currentStyle: QuestioningStyle,
    responseAnalysis: EnhancedResponseAnalysis
  ): number {
    const sophisticationScore = this.calculateSophisticationScore(responseAnalysis)
    
    const styleComplexityMap: Record<QuestioningStyle, number> = {
      'novice-friendly': 0.2,
      'intermediate-guided': 0.5,
      'advanced-technical': 0.7,
      'expert-efficient': 0.9,
      'impatient-accelerated': 0.8,
      'confused-supportive': 0.1,
      'collaborative-exploratory': 0.6
    }
    
    const expectedComplexity = styleComplexityMap[currentStyle]
    const alignment = 1 - Math.abs(sophisticationScore - expectedComplexity)
    
    return Math.max(0, alignment)
  }

  /**
   * Calculate recent engagement from conversation history
   */
  private calculateRecentEngagement(conversationHistory: any[]): number {
    if (conversationHistory.length === 0) return 0.7 // Default assumption
    
    const recentExchanges = conversationHistory.slice(-3)
    const engagementScores = recentExchanges
      .filter(h => h.analysis?.engagementLevel)
      .map(h => h.analysis.engagementLevel)
    
    if (engagementScores.length === 0) return 0.7
    
    return engagementScores.reduce((sum, score) => sum + score, 0) / engagementScores.length
  }

  /**
   * Initialize adaptation triggers
   */
  private initializeAdaptationTriggers(): StyleAdaptationTriggers {
    return {
      sophisticationChange: {
        threshold: 0.3,
        direction: 'increase',
        newStyle: 'advanced-technical'
      },
      engagementDrop: {
        threshold: 0.4,
        duration: 2,
        adaptationStyle: 'collaborative-exploratory'
      },
      confusionSignals: {
        clarityThreshold: 0.3,
        supportStyle: 'confused-supportive'
      },
      expertiseSkip: {
        confidenceThreshold: 0.7,
        acceleratedStyle: 'expert-efficient'
      },
      impatience: {
        urgencyLevel: 'moderate',
        adaptationStyle: 'impatient-accelerated'
      }
    }
  }

  /**
   * Initialize questioning style profiles
   */
  private initializeStyleProfiles(): void {
    // Novice-Friendly Style
    this.styleProfiles.set('novice-friendly', {
      style: 'novice-friendly',
      characteristics: {
        complexity: 'low',
        pace: 'slow',
        terminology: 'simple',
        depth: 'surface',
        examples: 'many',
        assumptions: 'minimal'
      },
      promptModifiers: {
        tone: 'Patient, educational, encouraging',
        structure: 'Step-by-step, logical progression',
        focus: 'Understanding basics, building confidence',
        constraints: ['Avoid jargon', 'Provide examples', 'Check understanding frequently']
      },
      questionPatterns: {
        openingStyle: 'Start with simple, concrete questions about familiar concepts',
        followUpApproach: 'Build gradually on previous answers with gentle guidance',
        clarificationMethod: 'Use analogies and examples to explain concepts',
        progressionLogic: 'Move slowly, ensure understanding before advancing'
      }
    })

    // Intermediate-Guided Style
    this.styleProfiles.set('intermediate-guided', {
      style: 'intermediate-guided',
      characteristics: {
        complexity: 'medium',
        pace: 'moderate',
        terminology: 'business',
        depth: 'moderate',
        examples: 'some',
        assumptions: 'moderate'
      },
      promptModifiers: {
        tone: 'Professional, supportive, balanced',
        structure: 'Structured but flexible, some technical depth',
        focus: 'Practical application, business value',
        constraints: ['Mix simple and business terms', 'Provide context', 'Balance depth with clarity']
      },
      questionPatterns: {
        openingStyle: 'Ask about business goals and practical challenges',
        followUpApproach: 'Dive deeper into specific areas of interest',
        clarificationMethod: 'Use business scenarios and practical examples',
        progressionLogic: 'Balance exploration with focused inquiry'
      }
    })

    // Advanced-Technical Style
    this.styleProfiles.set('advanced-technical', {
      style: 'advanced-technical',
      characteristics: {
        complexity: 'high',
        pace: 'fast',
        terminology: 'technical',
        depth: 'deep',
        examples: 'few',
        assumptions: 'significant'
      },
      promptModifiers: {
        tone: 'Technical, precise, efficient',
        structure: 'Direct, assumes technical knowledge',
        focus: 'Technical implementation, architecture, integration',
        constraints: ['Use industry terminology', 'Assume technical competence', 'Focus on implementation details']
      },
      questionPatterns: {
        openingStyle: 'Jump into technical specifics and architecture',
        followUpApproach: 'Explore technical depth and implementation challenges',
        clarificationMethod: 'Reference technical standards and best practices',
        progressionLogic: 'Move quickly through technical concepts'
      }
    })

    // Expert-Efficient Style
    this.styleProfiles.set('expert-efficient', {
      style: 'expert-efficient',
      characteristics: {
        complexity: 'expert',
        pace: 'rapid',
        terminology: 'expert',
        depth: 'comprehensive',
        examples: 'none',
        assumptions: 'extensive'
      },
      promptModifiers: {
        tone: 'Peer-level, efficient, assumes deep expertise',
        structure: 'Rapid-fire, high-level strategic',
        focus: 'Strategic decisions, trade-offs, optimization',
        constraints: ['Assume expert knowledge', 'Skip basics entirely', 'Focus on strategic decisions']
      },
      questionPatterns: {
        openingStyle: 'Ask about strategic trade-offs and optimization',
        followUpApproach: 'Rapid exploration of complex scenarios',
        clarificationMethod: 'Reference industry best practices and standards',
        progressionLogic: 'Move at expert pace, assume deep knowledge'
      }
    })

    // Impatient-Accelerated Style
    this.styleProfiles.set('impatient-accelerated', {
      style: 'impatient-accelerated',
      characteristics: {
        complexity: 'medium',
        pace: 'rapid',
        terminology: 'business',
        depth: 'moderate',
        examples: 'few',
        assumptions: 'extensive'
      },
      promptModifiers: {
        tone: 'Quick, decisive, results-focused',
        structure: 'Streamlined, assumption-heavy',
        focus: 'Key decisions, critical path items',
        constraints: ['Make reasonable assumptions', 'Focus on essentials', 'Minimize back-and-forth']
      },
      questionPatterns: {
        openingStyle: 'Ask about the most critical decisions first',
        followUpApproach: 'Focus on high-impact areas only',
        clarificationMethod: 'Make smart assumptions and validate quickly',
        progressionLogic: 'Prioritize speed over completeness'
      }
    })

    // Confused-Supportive Style
    this.styleProfiles.set('confused-supportive', {
      style: 'confused-supportive',
      characteristics: {
        complexity: 'low',
        pace: 'slow',
        terminology: 'simple',
        depth: 'surface',
        examples: 'many',
        assumptions: 'minimal'
      },
      promptModifiers: {
        tone: 'Patient, empathetic, reassuring',
        structure: 'Very clear, step-by-step guidance',
        focus: 'Clarity, understanding, confidence building',
        constraints: ['Use simple language', 'Provide multiple examples', 'Check understanding constantly']
      },
      questionPatterns: {
        openingStyle: 'Start with the simplest possible questions',
        followUpApproach: 'Break complex topics into small pieces',
        clarificationMethod: 'Use multiple examples and analogies',
        progressionLogic: 'Move very slowly, ensure complete understanding'
      }
    })

    // Collaborative-Exploratory Style
    this.styleProfiles.set('collaborative-exploratory', {
      style: 'collaborative-exploratory',
      characteristics: {
        complexity: 'medium',
        pace: 'moderate',
        terminology: 'business',
        depth: 'moderate',
        examples: 'some',
        assumptions: 'moderate'
      },
      promptModifiers: {
        tone: 'Collaborative, curious, open-ended',
        structure: 'Flexible, discovery-oriented',
        focus: 'Exploration, creativity, possibilities',
        constraints: ['Encourage exploration', 'Ask open-ended questions', 'Build on user ideas']
      },
      questionPatterns: {
        openingStyle: 'Ask open-ended questions about possibilities',
        followUpApproach: 'Explore interesting directions together',
        clarificationMethod: 'Build on user ideas and expand possibilities',
        progressionLogic: 'Follow user interest and energy'
      }
    })
  }
} 