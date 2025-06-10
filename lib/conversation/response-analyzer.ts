/**
 * Enhanced Real-time Response Analysis System
 * 
 * Multi-dimensional analysis of user responses for:
 * - Sophistication level assessment with domain expertise scoring
 * - Clarity and specificity measurement
 * - Engagement level and sentiment analysis  
 * - Advanced escape signal detection with contextual interpretation
 * - Learning pattern recognition and adaptation recommendations
 */

import { openai } from '../openai/client'
import type { 
  ConversationContext,
  ConversationResponse,
  EscapeSignals,
  Domain,
  SophisticationLevel,
  EngagementLevel
} from '../types/conversation'

export interface EnhancedResponseAnalysis extends ConversationResponse {
  // Enhanced sophistication analysis
  sophisticationBreakdown: {
    technicalLanguage: number      // 0-1: Use of technical terms
    domainSpecificity: number      // 0-1: Domain-specific knowledge demonstrated
    complexityHandling: number     // 0-1: Ability to handle complex concepts
    businessAcumen: number         // 0-1: Business understanding shown
    communicationClarity: number   // 0-1: How clearly ideas are expressed
  }
  
  // Enhanced clarity analysis
  clarityMetrics: {
    specificity: number            // 0-1: How specific vs vague the response is
    structuredThinking: number     // 0-1: Logical organization of thoughts
    completeness: number           // 0-1: How complete the answer is
    relevance: number              // 0-1: How relevant to the question asked
    actionability: number          // 0-1: How actionable the information is
  }
  
  // Enhanced engagement analysis
  engagementMetrics: {
    enthusiasm: number             // 0-1: Enthusiasm level detected
    interestLevel: number          // 0-1: Interest in the topic
    participationQuality: number   // 0-1: Quality of participation
    proactiveness: number          // 0-1: Proactive vs reactive responses
    collaborativeSpirit: number    // 0-1: Willingness to engage collaboratively
  }
  
  // Advanced escape signal detection
  advancedEscapeSignals: {
    fatigue: {
      detected: boolean
      confidence: number
      indicators: string[]
    }
    expertise: {
      detected: boolean            // "I know this stuff" type signals
      confidence: number
      suggestedSkipLevel: 'basics' | 'intermediate' | 'advanced'
    }
    impatience: {
      detected: boolean
      confidence: number
      urgencyLevel: 'mild' | 'moderate' | 'high'
    }
    confusion: {
      detected: boolean
      confidence: number
      supportLevel: 'clarification' | 'guidance' | 'restart'
    }
    redirect: {
      detected: boolean            // "Just show me X" requests
      confidence: number
      requestedDestination: string | null
    }
  }
  
  // Learning and adaptation insights
  adaptationRecommendations: {
    nextQuestionComplexity: SophisticationLevel
    suggestedApproach: 'technical' | 'business' | 'exploratory' | 'validating'
    toneAdjustment: 'more_formal' | 'more_casual' | 'maintain' | 'more_empathetic'
    pacingRecommendation: 'slow_down' | 'maintain' | 'speed_up' | 'pivot'
    topicFocus: string[]
  }
  
  // Quality and confidence metrics
  analysisConfidence: {
    overall: number                // 0-1: Overall confidence in analysis
    sophistication: number         // 0-1: Confidence in sophistication assessment  
    clarity: number                // 0-1: Confidence in clarity assessment
    engagement: number             // 0-1: Confidence in engagement assessment
    escapeSignals: number          // 0-1: Confidence in escape detection
  }
}

export class EnhancedResponseAnalyzer {
  private readonly model: string
  private readonly maxTokens: number
  private readonly temperature: number

  constructor(
    model: string = 'gpt-4o-mini',
    maxTokens: number = 1500,
    temperature: number = 0.2  // Lower temperature for more consistent analysis
  ) {
    this.model = model
    this.maxTokens = maxTokens
    this.temperature = temperature
  }

  /**
   * Perform comprehensive multi-dimensional response analysis
   */
  async analyzeResponse(
    userResponse: string,
    context: ConversationContext
  ): Promise<EnhancedResponseAnalysis> {
    try {
      const prompt = this.buildEnhancedAnalysisPrompt(userResponse, context)
      
      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: prompt
          }
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature
      })

      const content = response.choices[0].message.content || '{}'
      let analysis
      
      try {
        analysis = JSON.parse(content)
      } catch (parseError) {
        // If JSON parsing fails, try to extract JSON from the response
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0])
        } else {
          throw new Error(`Invalid JSON response from GPT-4: ${content}`)
        }
      }
      
      // Convert to our enhanced interface
      return this.mapToEnhancedAnalysis(analysis, userResponse, response.usage?.total_tokens || 0)
      
    } catch (error) {
      console.error('Error in enhanced response analysis:', error)
      throw new Error(`Failed to analyze response: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Quick sophistication assessment for real-time adaptation
   */
  async quickSophisticationCheck(
    userResponse: string,
    domain: Domain
  ): Promise<{
    level: SophisticationLevel
    confidence: number
    keyIndicators: string[]
  }> {
    const prompt = this.buildQuickSophisticationPrompt(userResponse, domain)
    
    try {
      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [{ role: 'system', content: prompt }],
        max_tokens: 300,
        temperature: 0.1
      })

      const content = response.choices[0].message.content || '{}'
      const result = JSON.parse(content)
      
      return {
        level: result.sophisticationLevel,
        confidence: result.confidence,
        keyIndicators: result.keyIndicators || []
      }
    } catch (error) {
      console.error('Error in quick sophistication check:', error)
      // Fallback to basic assessment
      return {
        level: 'intermediate',
        confidence: 0.5,
        keyIndicators: ['fallback_assessment']
      }
    }
  }

  /**
   * Real-time engagement monitoring
   */
  async monitorEngagement(
    conversationHistory: any[],
    currentResponse: string
  ): Promise<{
    currentLevel: number
    trend: 'increasing' | 'stable' | 'decreasing'
    alertLevel: 'none' | 'mild' | 'moderate' | 'high'
    recommendations: string[]
  }> {
    const recentResponses = conversationHistory.slice(-3)
    const engagementScores = recentResponses
      .filter(r => r.analysis?.engagementLevel)
      .map(r => r.analysis.engagementLevel)

    if (engagementScores.length < 2) {
      return {
        currentLevel: 0.7, // Default assumption
        trend: 'stable',
        alertLevel: 'none',
        recommendations: []
      }
    }

    const currentLevel = engagementScores[engagementScores.length - 1]
    const previousLevel = engagementScores[engagementScores.length - 2]
    const difference = currentLevel - previousLevel

    let trend: 'increasing' | 'stable' | 'decreasing' = 'stable'
    if (difference > 0.1) trend = 'increasing'
    else if (difference < -0.1) trend = 'decreasing'

    let alertLevel: 'none' | 'mild' | 'moderate' | 'high' = 'none'
    if (currentLevel < 0.3) alertLevel = 'high'
    else if (currentLevel < 0.5) alertLevel = 'moderate'
    else if (currentLevel < 0.6) alertLevel = 'mild'

    const recommendations = this.generateEngagementRecommendations(currentLevel, trend, alertLevel)

    return {
      currentLevel,
      trend,
      alertLevel,
      recommendations
    }
  }

  /**
   * Build enhanced analysis prompt for comprehensive assessment
   */
  private buildEnhancedAnalysisPrompt(
    userResponse: string, 
    context: ConversationContext
  ): string {
    const { domain, stage, userProfile, conversationHistory } = context
    const conversationContext = conversationHistory.slice(-2)
      .map(h => `Q: ${h.generatedQuestion?.question}\nA: ${h.userResponse}`)
      .join('\n\n')

    return `You are an expert conversation analyst specializing in ${domain} domain. Perform comprehensive multi-dimensional analysis of this user response.

CONTEXT:
- Domain: ${domain}
- Conversation Stage: ${stage}
- User Profile: ${JSON.stringify(userProfile)}
- Recent Conversation:
${conversationContext}

USER RESPONSE TO ANALYZE: "${userResponse}"

ANALYSIS REQUIRED:
Perform deep, multi-dimensional analysis covering:

1. SOPHISTICATION BREAKDOWN (0-1 each):
   - technicalLanguage: Use of technical terms and concepts
   - domainSpecificity: Domain-specific knowledge demonstrated  
   - complexityHandling: Ability to handle complex concepts
   - businessAcumen: Business understanding shown
   - communicationClarity: How clearly ideas are expressed

2. CLARITY METRICS (0-1 each):
   - specificity: How specific vs vague the response is
   - structuredThinking: Logical organization of thoughts
   - completeness: How complete the answer is
   - relevance: How relevant to the question asked
   - actionability: How actionable the information is

3. ENGAGEMENT METRICS (0-1 each):
   - enthusiasm: Enthusiasm level detected
   - interestLevel: Interest in the topic
   - participationQuality: Quality of participation
   - proactiveness: Proactive vs reactive responses
   - collaborativeSpirit: Willingness to engage collaboratively

4. ADVANCED ESCAPE SIGNALS:
   - fatigue: Conversation tiredness indicators
   - expertise: "I know this stuff" type signals with skip level
   - impatience: Urgency and desire to move faster
   - confusion: Need for clarification or guidance
   - redirect: Direct requests to jump to specific outputs

5. ADAPTATION RECOMMENDATIONS:
   - nextQuestionComplexity: Sophistication level for next question
   - suggestedApproach: Best approach type
   - toneAdjustment: How to adjust communication tone
   - pacingRecommendation: How to adjust conversation pacing
   - topicFocus: Key topics to focus on

6. ANALYSIS CONFIDENCE (0-1 each):
   - overall, sophistication, clarity, engagement, escapeSignals

You must respond with valid JSON only, no other text. Use this exact structure:
{
  "sophisticationScore": 0.75,
  "engagementLevel": 0.8,
  "clarityScore": 0.7,
  "sophisticationBreakdown": {
    "technicalLanguage": 0.6,
    "domainSpecificity": 0.8,
    "complexityHandling": 0.7,
    "businessAcumen": 0.9,
    "communicationClarity": 0.8
  },
  "clarityMetrics": {
    "specificity": 0.7,
    "structuredThinking": 0.8,
    "completeness": 0.6,
    "relevance": 0.9,
    "actionability": 0.7
  },
  "engagementMetrics": {
    "enthusiasm": 0.8,
    "interestLevel": 0.9,
    "participationQuality": 0.8,
    "proactiveness": 0.7,
    "collaborativeSpirit": 0.8
  },
  "advancedEscapeSignals": {
    "fatigue": {"detected": false, "confidence": 0.1, "indicators": []},
    "expertise": {"detected": false, "confidence": 0.2, "suggestedSkipLevel": "basics"},
    "impatience": {"detected": false, "confidence": 0.1, "urgencyLevel": "mild"},
    "confusion": {"detected": false, "confidence": 0.1, "supportLevel": "clarification"},
    "redirect": {"detected": false, "confidence": 0.1, "requestedDestination": null}
  },
  "adaptationRecommendations": {
    "nextQuestionComplexity": "intermediate",
    "suggestedApproach": "business",
    "toneAdjustment": "maintain",
    "pacingRecommendation": "maintain",
    "topicFocus": ["compliance", "user experience"]
  },
  "analysisConfidence": {
    "overall": 0.85,
    "sophistication": 0.9,
    "clarity": 0.8,
    "engagement": 0.85,
    "escapeSignals": 0.7
  },
  "domainKnowledge": {
    "technicalDepth": "intermediate",
    "businessAcumen": "advanced",
    "industryExperience": "moderate",
    "specificAreas": ["compliance", "reporting"]
  },
  "escapeSignals": {
    "detected": false,
    "type": null,
    "confidence": 0.1
  },
  "extractedEntities": ["fintech", "compliance", "reporting"],
  "sentiment": "positive",
  "suggestedAdaptations": ["focus on compliance depth"],
  "nextQuestionHints": ["Ask about specific frameworks"],
  "metadata": {
    "responseLength": ${userResponse.length},
    "analysisDepth": "enhanced"
  }
}`
  }

  /**
   * Build quick sophistication assessment prompt
   */
  private buildQuickSophisticationPrompt(userResponse: string, domain: Domain): string {
    return `Quick sophistication assessment for ${domain} domain response.

USER RESPONSE: "${userResponse}"

Assess sophistication level based on:
- Technical vocabulary usage
- Domain-specific knowledge
- Complexity of concepts mentioned
- Business vs technical focus

Respond with valid JSON only:
{
  "sophisticationLevel": "novice|intermediate|advanced|expert",
  "confidence": 0.85,
  "keyIndicators": ["specific terms or concepts that indicate level"]
}`
  }

  /**
   * Map GPT-4 analysis result to our enhanced interface
   */
  private mapToEnhancedAnalysis(
    analysis: any, 
    userResponse: string, 
    tokens: number
  ): EnhancedResponseAnalysis {
    return {
      // Base ConversationResponse fields
      sophisticationScore: analysis.sophisticationScore || 0.5,
      engagementLevel: analysis.engagementLevel || 0.5,
      clarityScore: analysis.clarityScore || 0.5,
      domainKnowledge: analysis.domainKnowledge || {},
      escapeSignals: analysis.escapeSignals || {
        detected: false,
        type: null,
        confidence: 0
      },
      extractedEntities: analysis.extractedEntities || [],
      sentiment: analysis.sentiment || 'neutral',
      suggestedAdaptations: analysis.suggestedAdaptations || [],
      nextQuestionHints: analysis.nextQuestionHints || [],
      metadata: {
        model: this.model,
        tokens: tokens,
        timestamp: new Date().toISOString(),
        responseLength: userResponse.length
      },

      // Enhanced fields
      sophisticationBreakdown: analysis.sophisticationBreakdown || {
        technicalLanguage: 0.5,
        domainSpecificity: 0.5,
        complexityHandling: 0.5,
        businessAcumen: 0.5,
        communicationClarity: 0.5
      },
      clarityMetrics: analysis.clarityMetrics || {
        specificity: 0.5,
        structuredThinking: 0.5,
        completeness: 0.5,
        relevance: 0.5,
        actionability: 0.5
      },
      engagementMetrics: analysis.engagementMetrics || {
        enthusiasm: 0.5,
        interestLevel: 0.5,
        participationQuality: 0.5,
        proactiveness: 0.5,
        collaborativeSpirit: 0.5
      },
      advancedEscapeSignals: analysis.advancedEscapeSignals || {
        fatigue: { detected: false, confidence: 0, indicators: [] },
        expertise: { detected: false, confidence: 0, suggestedSkipLevel: 'basics' },
        impatience: { detected: false, confidence: 0, urgencyLevel: 'mild' },
        confusion: { detected: false, confidence: 0, supportLevel: 'clarification' },
        redirect: { detected: false, confidence: 0, requestedDestination: null }
      },
      adaptationRecommendations: analysis.adaptationRecommendations || {
        nextQuestionComplexity: 'intermediate',
        suggestedApproach: 'business',
        toneAdjustment: 'maintain',
        pacingRecommendation: 'maintain',
        topicFocus: []
      },
      analysisConfidence: analysis.analysisConfidence || {
        overall: 0.7,
        sophistication: 0.7,
        clarity: 0.7,
        engagement: 0.7,
        escapeSignals: 0.7
      }
    }
  }

  /**
   * Generate engagement recommendations based on current state
   */
  private generateEngagementRecommendations(
    currentLevel: number,
    trend: 'increasing' | 'stable' | 'decreasing',
    alertLevel: 'none' | 'mild' | 'moderate' | 'high'
  ): string[] {
    const recommendations: string[] = []

    if (alertLevel === 'high') {
      recommendations.push('Consider triggering escape hatch immediately')
      recommendations.push('Offer to jump to assumptions or deliverables')
      recommendations.push('Acknowledge user frustration explicitly')
    } else if (alertLevel === 'moderate') {
      recommendations.push('Reduce question complexity')
      recommendations.push('Ask more engaging, specific questions')
      recommendations.push('Consider changing topic focus')
    } else if (alertLevel === 'mild') {
      recommendations.push('Monitor closely for further decline')
      recommendations.push('Inject more relevant examples')
    }

    if (trend === 'decreasing') {
      recommendations.push('Change questioning approach')
      recommendations.push('Ask about user preferences directly')
    } else if (trend === 'increasing') {
      recommendations.push('Continue current approach')
      recommendations.push('Consider increasing question depth')
    }

    return recommendations
  }
} 