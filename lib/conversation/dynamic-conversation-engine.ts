/**
 * Dynamic Conversation Engine
 * 
 * Core orchestrator for intelligent, adaptive conversations using GPT-4.
 * Replaces static question banks with dynamic, context-aware question generation.
 */

import { openai } from '../openai/client'
import { EnhancedResponseAnalyzer, type EnhancedResponseAnalysis } from './response-analyzer'
import { DomainQuestionGenerator } from './domain-question-generator'
import type { 
  ConversationContext, 
  ConversationResponse, 
  QuestionGenerationResult,
  UserProfile,
  ConversationStage,
  DomainExpertise,
  ConversationExchange,
  SophisticationLevel,
  EngagementLevel
} from '../types/conversation'

export class DynamicConversationEngine {
  private readonly model: string
  private readonly maxTokens: number
  private readonly temperature: number
  private readonly responseAnalyzer: EnhancedResponseAnalyzer
  private readonly domainQuestionGenerator: DomainQuestionGenerator

  constructor(
    model: string = 'gpt-4o-mini',
    maxTokens: number = 1000,
    temperature: number = 0.7
  ) {
    this.model = model
    this.maxTokens = maxTokens
    this.temperature = temperature
    this.responseAnalyzer = new EnhancedResponseAnalyzer(model)
    this.domainQuestionGenerator = new DomainQuestionGenerator(model)
  }

  /**
   * Generate the next optimal question with enhanced domain-specific context
   */
  async generateNextQuestionEnhanced(
    context: ConversationContext,
    responseAnalysis: EnhancedResponseAnalysis
  ): Promise<QuestionGenerationResult> {
    try {
      // Use the domain question generator for enhanced domain-specific questions
      return await this.domainQuestionGenerator.generateDomainQuestion(context, responseAnalysis)
    } catch (error) {
      console.error('Error in enhanced question generation, falling back to basic generation:', error)
      // Fallback to basic question generation
      return await this.generateNextQuestion(context)
    }
  }

  /**
   * Generate the next optimal question based on conversation context (basic version)
   */
  async generateNextQuestion(
    context: ConversationContext
  ): Promise<QuestionGenerationResult> {
    try {
      const prompt = this.buildQuestionGenerationPrompt(context)
      
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
      let result
      
      try {
        result = JSON.parse(content)
      } catch (parseError) {
        // If JSON parsing fails, try to extract JSON from the response
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0])
        } else {
          throw new Error(`Invalid JSON response from GPT-4: ${content}`)
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
          timestamp: new Date().toISOString()
        }
      }
    } catch (error) {
      console.error('Error generating question:', error)
      throw new Error(`Failed to generate question: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Analyze user response using enhanced multi-dimensional analysis
   */
  async analyzeResponse(
    userResponse: string,
    context: ConversationContext
  ): Promise<EnhancedResponseAnalysis> {
    try {
      return await this.responseAnalyzer.analyzeResponse(userResponse, context)
    } catch (error) {
      console.error('Error analyzing response:', error)
      throw new Error(`Failed to analyze response: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Quick sophistication check for real-time adaptation
   */
  async quickSophisticationCheck(
    userResponse: string,
    domain: string
  ): Promise<{
    level: SophisticationLevel
    confidence: number
    keyIndicators: string[]
  }> {
    return await this.responseAnalyzer.quickSophisticationCheck(userResponse, domain as any)
  }

  /**
   * Monitor engagement trends across conversation
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
    return await this.responseAnalyzer.monitorEngagement(conversationHistory, currentResponse)
  }

  /**
   * Detect escape signals and determine if conversation should pivot
   */
  async detectEscapeSignals(
    context: ConversationContext
  ): Promise<boolean> {
    // Check recent responses for escape patterns
    const recentResponses = context.conversationHistory.slice(-3)
    const escapeSignals = recentResponses.filter((r: ConversationExchange) => 
      r.analysis?.escapeSignals?.detected
    )

    // Multiple escape signals or high confidence single signal
    if (escapeSignals.length >= 2) return true
    if (escapeSignals.length === 1 && escapeSignals[0].analysis?.escapeSignals?.confidence > 0.8) return true

    // Check for conversation fatigue (too many questions without progress)
    if (context.conversationHistory.length > 10 && context.stage === context.conversationHistory[5]?.stage) {
      return true
    }

    return false
  }

  /**
   * Update conversation context with new information
   */
  updateContext(
    context: ConversationContext,
    userResponse: string,
    responseAnalysis: EnhancedResponseAnalysis,
    generatedQuestion?: QuestionGenerationResult
  ): ConversationContext {
    const updatedHistory = [
      ...context.conversationHistory,
      {
        userResponse,
        analysis: responseAnalysis,
        generatedQuestion,
        timestamp: new Date().toISOString(),
        stage: context.stage
      }
    ]

    // Update profile based on enhanced analysis
    const updatedProfile: UserProfile = {
      ...context.userProfile,
      sophisticationLevel: this.calculateSophisticationTrend(updatedHistory),
      domainKnowledge: {
        ...context.userProfile.domainKnowledge,
        ...responseAnalysis.domainKnowledge
      },
      engagementPattern: this.analyzeEngagementPattern(updatedHistory)
    }

    return {
      ...context,
      conversationHistory: updatedHistory,
      userProfile: updatedProfile,
      lastUpdated: new Date().toISOString()
    }
  }

  /**
   * Build prompt for dynamic question generation
   */
  private buildQuestionGenerationPrompt(context: ConversationContext): string {
    const { userProfile, conversationHistory, stage, domain } = context
    const domainExpertise = this.getDomainExpertise(domain)
    
    return `You are an expert ${domain} consultant conducting an intelligent product discovery conversation.

CONTEXT:
- Domain: ${domain}
- Conversation Stage: ${stage}
- User Sophistication: ${userProfile.sophisticationLevel}
- User Role: ${userProfile.role}
- Previous Questions: ${conversationHistory.length}

USER PROFILE:
- Industry Experience: ${userProfile.domainKnowledge?.experience || 'Unknown'}
- Technical Depth: ${userProfile.domainKnowledge?.technicalDepth || 'Unknown'}
- Communication Style: ${userProfile.engagementPattern || 'Unknown'}

CONVERSATION HISTORY:
${conversationHistory.slice(-3).map(h => `Q: ${h.generatedQuestion?.question}\nA: ${h.userResponse}`).join('\n\n')}

DOMAIN EXPERTISE:
${domainExpertise.terminology}
${domainExpertise.commonProblems}
${domainExpertise.bestPractices}

 TASK:
Generate the next optimal question that:
1. Matches the user's sophistication level
2. Builds upon previous responses
3. Demonstrates domain expertise
4. Feels natural and conversational
5. Advances toward the conversation goal

You must respond with valid JSON only, no other text. Use this exact format:
{
  "question": "Your generated question",
  "questionType": "clarification|deep-dive|technical|business|validation",
  "sophisticationLevel": "novice|intermediate|advanced|expert",
  "domainContext": "Brief context for why this question matters",
  "followUpSuggestions": ["potential follow-up questions"],
  "confidence": 0.85,
  "reasoning": "Why this question is optimal now",
  "expectedResponseTypes": ["types of responses expected"]
}`
  }

  /**
   * Build prompt for response analysis
   */
  private buildResponseAnalysisPrompt(
    userResponse: string, 
    context: ConversationContext
  ): string {
    return `Analyze this user response in the context of a ${context.domain} product discovery conversation.

USER RESPONSE: "${userResponse}"

CONVERSATION CONTEXT:
- Stage: ${context.stage}
- Domain: ${context.domain}
- Previous Sophistication Level: ${context.userProfile.sophisticationLevel}
- Response #: ${context.conversationHistory.length + 1}

 ANALYSIS REQUIRED:
1. Sophistication Level (0-1): Technical depth and domain knowledge demonstrated
2. Engagement Level (0-1): Interest and participation quality
3. Clarity Score (0-1): How clear and specific the response is
4. Domain Knowledge: Specific expertise areas mentioned
5. Escape Signals: Signs of boredom, impatience, or desire to skip ahead
6. Extracted Entities: Key technical terms, business concepts, requirements
7. Sentiment: Overall attitude and emotion
8. Suggested Adaptations: How to adjust questioning approach

You must respond with valid JSON only, no other text. Use this exact format:
{
  "sophisticationScore": 0.75,
  "engagementLevel": 0.8,
  "clarityScore": 0.7,
  "domainKnowledge": {
    "technicalDepth": "intermediate",
    "businessAcumen": "advanced", 
    "industryExperience": "high",
    "specificAreas": ["compliance", "APIs", "security"]
  },
  "escapeSignals": {
    "detected": false,
    "type": null,
    "confidence": 0,
    "indicators": []
  },
  "extractedEntities": ["SOC2", "mid-market banks", "regulatory reporting"],
  "sentiment": "positive",
  "suggestedAdaptations": ["increase technical depth", "focus on compliance"],
  "nextQuestionHints": ["Ask about specific frameworks", "Dive into architecture"]
}`
  }

  /**
   * Get domain-specific expertise context
   */
  private getDomainExpertise(domain: string): DomainExpertise {
    const expertiseMap: Record<string, DomainExpertise> = {
      fintech: {
        terminology: "Use terms like regulatory compliance, PCI DSS, SOC2, BSA/AML, API integration, core banking systems, regulatory reporting, risk management",
        commonProblems: "Common challenges: regulatory compliance burden, legacy system integration, real-time transaction processing, fraud detection, customer onboarding complexity",
        bestPractices: "Industry best practices: API-first architecture, microservices for compliance isolation, real-time monitoring, automated reporting, cloud-first security"
      },
      healthcare: {
        terminology: "Use terms like HIPAA compliance, HL7 FHIR, EHR integration, patient data privacy, clinical workflows, interoperability, care coordination",
        commonProblems: "Common challenges: HIPAA compliance complexity, EHR vendor lock-in, clinical workflow disruption, provider adoption resistance, interoperability gaps",
        bestPractices: "Industry best practices: Privacy by design, minimal data collection, automated compliance monitoring, clinical workflow integration, provider-centric UX"
      },
      general: {
        terminology: "Use clear business language, avoid jargon unless user demonstrates expertise, focus on user value and business outcomes",
        commonProblems: "Common challenges: user adoption, scalability, time-to-market, development costs, competitive differentiation",
        bestPractices: "Best practices: User-centered design, MVP approach, iterative development, performance optimization, security first"
      }
    }

    return expertiseMap[domain] || expertiseMap.general
  }

  /**
   * Calculate sophistication trend from conversation history
   */
  private calculateSophisticationTrend(history: ConversationExchange[]): SophisticationLevel {
    if (history.length === 0) return 'novice'
    
    const scores = history
      .filter(h => h.analysis?.sophisticationScore)
      .map(h => h.analysis.sophisticationScore)
    
    if (scores.length === 0) return 'novice'
    
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length
    
    if (avgScore >= 0.8) return 'expert'
    if (avgScore >= 0.6) return 'advanced'  
    if (avgScore >= 0.4) return 'intermediate'
    return 'novice'
  }

  /**
   * Analyze engagement pattern from conversation history
   */
  private analyzeEngagementPattern(history: ConversationExchange[]): EngagementLevel {
    if (history.length < 3) return 'unknown'
    
    const recentEngagement = history.slice(-3)
      .filter(h => h.analysis?.engagementLevel)
      .map(h => h.analysis.engagementLevel)
    
    if (recentEngagement.length === 0) return 'unknown'
    
    const avgEngagement = recentEngagement.reduce((a, b) => a + b, 0) / recentEngagement.length
    
    if (avgEngagement >= 0.8) return 'highly-engaged'
    if (avgEngagement >= 0.6) return 'engaged'
    if (avgEngagement >= 0.4) return 'moderately-engaged'
    return 'disengaged'
  }
} 