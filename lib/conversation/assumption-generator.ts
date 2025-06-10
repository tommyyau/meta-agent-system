/**
 * Assumption Generation System
 * 
 * Generates intelligent, context-aware assumptions when escape signals are detected.
 * Integrates with the dynamic conversation engine to provide smooth transitions
 * from questioning to assumption generation.
 */

import { openai } from '../openai/client'
import type { 
  ConversationContext,
  UserProfile,
  Domain,
  SophisticationLevel,
  ConversationStage
} from '../types/conversation'
import type { EnhancedResponseAnalysis } from './response-analyzer'

export interface AssumptionSet {
  assumptions: Assumption[]
  confidence: number
  reasoning: string
  missingCriticalInfo: string[]
  recommendedNextSteps: string[]
  metadata: {
    generatedAt: string
    model: string
    tokens: number
    escapeSignalTrigger: string
  }
}

export interface Assumption {
  id: string
  category: 'user_target' | 'problem_definition' | 'technical_requirements' | 'business_model' | 'constraints'
  title: string
  description: string
  confidence: number
  reasoning: string
  impact: 'low' | 'medium' | 'high'
  dependencies: string[]
  validationQuestions: string[]
  alternatives?: string[]
}

export interface AssumptionPivotResult {
  shouldPivot: boolean
  pivotReason: string
  assumptionSet?: AssumptionSet
  transitionMessage: string
  userOptions: {
    proceedWithAssumptions: string
    modifyAssumptions: string
    continueQuestioning: string
  }
}

export class AssumptionGenerator {
  private readonly model: string
  private readonly maxTokens: number
  private readonly temperature: number

  constructor(
    model: string = 'gpt-4o-mini',
    maxTokens: number = 2000,
    temperature: number = 0.3  // Lower temperature for more consistent assumptions
  ) {
    this.model = model
    this.maxTokens = maxTokens
    this.temperature = temperature
  }

  /**
   * Check if conversation should pivot to assumptions (without generating them)
   */
  checkPivotConditions(
    context: ConversationContext,
    responseAnalysis: EnhancedResponseAnalysis
  ): { shouldPivot: boolean; pivotReason: string } {
    // Check for escape signals in the enhanced analysis
    const escapeSignals = responseAnalysis.advancedEscapeSignals
    
    // Determine pivot based on escape signals (lowered thresholds for better detection)
    let shouldPivot = false
    let pivotReason = ''
    
    if (escapeSignals.fatigue.detected && escapeSignals.fatigue.confidence > 0.5) {
      shouldPivot = true
      pivotReason = 'User showing conversation fatigue'
    } else if (escapeSignals.expertise.detected && escapeSignals.expertise.confidence > 0.6) {
      shouldPivot = true
      pivotReason = `User demonstrating ${escapeSignals.expertise.suggestedSkipLevel} expertise`
    } else if (escapeSignals.impatience.detected && escapeSignals.impatience.confidence > 0.5) {
      shouldPivot = true
      pivotReason = `User showing ${escapeSignals.impatience.urgencyLevel} impatience`
    } else if (escapeSignals.redirect.detected && escapeSignals.redirect.confidence > 0.6) {
      shouldPivot = true
      pivotReason = `User requesting direct access to ${escapeSignals.redirect.requestedDestination}`
    }
    
    // Additional pivot conditions
    if (!shouldPivot) {
      // Check conversation length vs progress
      if (context.conversationHistory.length > 8 && context.stage === 'idea_clarity') {
        shouldPivot = true
        pivotReason = 'Extended conversation without stage progression'
      }
      
      // Check for repeated low engagement
      const recentEngagement = context.conversationHistory.slice(-3)
        .map(h => h.analysis?.engagementLevel || 0.5)
      const avgEngagement = recentEngagement.reduce((a, b) => a + b, 0) / recentEngagement.length
      
      if (avgEngagement < 0.4) {
        shouldPivot = true
        pivotReason = 'Consistently low engagement detected'
      }
    }

    // Additional trigger: explicit assumption requests
    if (!shouldPivot) {
      // Check if user is explicitly asking for assumptions
      const userResponse = context.conversationHistory[context.conversationHistory.length - 1]?.userResponse || ''
      const assumptionKeywords = ['assumption', 'assume', 'just generate', 'move forward', 'skip ahead', 'wireframe']
      const hasAssumptionRequest = assumptionKeywords.some(keyword => 
        userResponse.toLowerCase().includes(keyword.toLowerCase())
      )
      
      if (hasAssumptionRequest) {
        shouldPivot = true
        pivotReason = 'User explicitly requesting assumption generation'
      }
    }

    return { shouldPivot, pivotReason }
  }

  /**
   * Determine if conversation should pivot to assumption generation
   */
  async shouldPivotToAssumptions(
    context: ConversationContext,
    responseAnalysis: EnhancedResponseAnalysis
  ): Promise<AssumptionPivotResult> {
    try {
      const { shouldPivot, pivotReason } = this.checkPivotConditions(context, responseAnalysis)

      if (!shouldPivot) {
        return {
          shouldPivot: false,
          pivotReason: 'No escape signals detected, continuing conversation',
          transitionMessage: '',
          userOptions: {
            proceedWithAssumptions: '',
            modifyAssumptions: '',
            continueQuestioning: ''
          }
        }
      }

      // Generate assumptions if pivot is needed
      const assumptionSet = await this.generateAssumptions(context, responseAnalysis, pivotReason)
      const transitionMessage = this.createTransitionMessage(pivotReason, responseAnalysis.advancedEscapeSignals)
      
      return {
        shouldPivot: true,
        pivotReason,
        assumptionSet,
        transitionMessage,
        userOptions: {
          proceedWithAssumptions: "Yes, proceed with these assumptions",
          modifyAssumptions: "Let me adjust some of these assumptions",
          continueQuestioning: "Actually, I'd like to answer more questions"
        }
      }
      
    } catch (error) {
      console.error('Error in assumption pivot analysis:', error)
      return {
        shouldPivot: false,
        pivotReason: 'Error in analysis, continuing conversation',
        transitionMessage: '',
        userOptions: {
          proceedWithAssumptions: '',
          modifyAssumptions: '',
          continueQuestioning: ''
        }
      }
    }
  }

  /**
   * Generate intelligent assumptions based on conversation context
   */
  async generateAssumptions(
    context: ConversationContext,
    responseAnalysis: EnhancedResponseAnalysis,
    pivotReason: string
  ): Promise<AssumptionSet> {
    try {
      const prompt = this.buildAssumptionGenerationPrompt(context, responseAnalysis, pivotReason)
      
      console.log('🔧 Generating assumptions with OpenAI...')
      
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
      console.log('🔧 OpenAI response received, parsing...')
      
      let result
      
      try {
        result = JSON.parse(content)
      } catch (parseError) {
        console.log('🔧 JSON parsing failed, trying to extract JSON...')
        // If JSON parsing fails, try to extract JSON from the response
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0])
        } else {
          console.error('Failed to parse OpenAI response:', content)
          throw new Error(`Invalid JSON response from GPT-4: ${content}`)
        }
      }
      
      // Validate that we have assumptions
      if (!result.assumptions || !Array.isArray(result.assumptions)) {
        console.error('Invalid assumptions structure:', result)
        throw new Error('OpenAI response does not contain valid assumptions array')
      }
      
      console.log(`🔧 Successfully generated ${result.assumptions.length} assumptions`)
      
      return {
        assumptions: result.assumptions.map((a: any, index: number) => ({
          id: `assumption_${Date.now()}_${index}`,
          ...a
        })),
        confidence: result.confidence || 0.7,
        reasoning: result.reasoning || 'Generated based on conversation context',
        missingCriticalInfo: result.missingCriticalInfo || [],
        recommendedNextSteps: result.recommendedNextSteps || [],
        metadata: {
          generatedAt: new Date().toISOString(),
          model: this.model,
          tokens: response.usage?.total_tokens || 0,
          escapeSignalTrigger: pivotReason
        }
      }
      
    } catch (error) {
      console.error('Error generating assumptions:', error)
      
      // Provide fallback assumptions based on domain and context
      console.log('🔧 Generating fallback assumptions...')
      return this.generateFallbackAssumptions(context, pivotReason)
    }
  }

  /**
   * Generate fallback assumptions when OpenAI fails
   */
  private generateFallbackAssumptions(
    context: ConversationContext,
    pivotReason: string
  ): AssumptionSet {
    const domain = context.domain
    const userProfile = context.userProfile
    
    // Domain-specific fallback assumptions
    const domainAssumptions: Record<string, any[]> = {
      fintech: [
        {
          category: "technical_requirements",
          title: "Cloud-based Architecture",
          description: "The platform will be built on cloud infrastructure for scalability and compliance",
          confidence: 0.7,
          reasoning: "Most fintech solutions require cloud deployment for regulatory compliance",
          impact: "high",
          dependencies: [],
          validationQuestions: ["Do you have cloud provider preferences?"],
          alternatives: ["On-premise deployment"]
        },
        {
          category: "user_target",
          title: "Financial Services Professionals",
          description: "Primary users will be financial services professionals and compliance officers",
          confidence: 0.8,
          reasoning: "Fintech solutions typically target financial industry professionals",
          impact: "high",
          dependencies: [],
          validationQuestions: ["Who are your target users?"],
          alternatives: ["End consumers", "IT administrators"]
        }
      ],
      healthcare: [
        {
          category: "technical_requirements",
          title: "HIPAA Compliance",
          description: "The system must be HIPAA compliant for handling patient data",
          confidence: 0.9,
          reasoning: "Healthcare applications must comply with HIPAA regulations",
          impact: "high",
          dependencies: [],
          validationQuestions: ["What patient data will you handle?"],
          alternatives: ["Non-patient facing system"]
        }
      ],
      general: [
        {
          category: "user_target",
          title: "Business Users",
          description: "The application will primarily serve business users",
          confidence: 0.6,
          reasoning: "Most business applications target professional users",
          impact: "medium",
          dependencies: [],
          validationQuestions: ["Who will use this application?"],
          alternatives: ["Consumer users", "Technical users"]
        }
      ]
    }
    
    const assumptions = domainAssumptions[domain] || domainAssumptions.general
    
    return {
      assumptions: assumptions.map((a, index) => ({
        id: `fallback_assumption_${Date.now()}_${index}`,
        ...a
      })),
      confidence: 0.6,
      reasoning: `Fallback assumptions generated for ${domain} domain due to: ${pivotReason}`,
      missingCriticalInfo: [
        "Specific user requirements",
        "Technical constraints",
        "Business model details"
      ],
      recommendedNextSteps: [
        "Validate these assumptions with stakeholders",
        "Gather more specific requirements",
        "Define technical architecture"
      ],
      metadata: {
        generatedAt: new Date().toISOString(),
        model: 'fallback',
        tokens: 0,
        escapeSignalTrigger: pivotReason
      }
    }
  }

  /**
   * Validate and refine assumptions based on user feedback
   */
  async refineAssumptions(
    originalAssumptions: AssumptionSet,
    userFeedback: string,
    context: ConversationContext
  ): Promise<AssumptionSet> {
    try {
      const prompt = this.buildAssumptionRefinementPrompt(originalAssumptions, userFeedback, context)
      
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
      const result = JSON.parse(content)
      
      return {
        ...originalAssumptions,
        assumptions: result.assumptions.map((a: any, index: number) => ({
          id: `refined_assumption_${Date.now()}_${index}`,
          ...a
        })),
        confidence: result.confidence || originalAssumptions.confidence,
        reasoning: result.reasoning,
        missingCriticalInfo: result.missingCriticalInfo || originalAssumptions.missingCriticalInfo,
        recommendedNextSteps: result.recommendedNextSteps || originalAssumptions.recommendedNextSteps,
                 metadata: {
           generatedAt: originalAssumptions.metadata.generatedAt,
           model: originalAssumptions.metadata.model,
           tokens: originalAssumptions.metadata.tokens,
           escapeSignalTrigger: originalAssumptions.metadata.escapeSignalTrigger
         }
      }
      
    } catch (error) {
      console.error('Error refining assumptions:', error)
      // Return original assumptions if refinement fails
      return originalAssumptions
    }
  }

  /**
   * Create smooth transition message based on escape signals
   */
  private createTransitionMessage(
    pivotReason: string,
    escapeSignals: EnhancedResponseAnalysis['advancedEscapeSignals']
  ): string {
    if (escapeSignals.expertise.detected) {
      return `I can see you have ${escapeSignals.expertise.suggestedSkipLevel} expertise in this area. Let me generate some smart assumptions based on what you've shared so far, and we can move forward more efficiently.`
    }
    
    if (escapeSignals.impatience.detected) {
      return `I understand you'd like to move faster. Let me create some intelligent assumptions based on our conversation so far, and you can let me know if anything needs adjustment.`
    }
    
    if (escapeSignals.redirect.detected && escapeSignals.redirect.requestedDestination) {
      return `I hear you'd like to see ${escapeSignals.redirect.requestedDestination}. Let me generate some assumptions based on what we've discussed, and then we can move toward that goal.`
    }
    
    if (escapeSignals.fatigue.detected) {
      return `I can sense this conversation is getting lengthy. Let me summarize what I've learned and make some smart assumptions so we can progress more efficiently.`
    }
    
    return `Based on our conversation, I'll generate some intelligent assumptions to help us move forward more efficiently. You can review and adjust them as needed.`
  }

  /**
   * Build prompt for assumption generation
   */
  private buildAssumptionGenerationPrompt(
    context: ConversationContext,
    responseAnalysis: EnhancedResponseAnalysis,
    pivotReason: string
  ): string {
    const { userProfile, conversationHistory, stage, domain } = context
    
    return `You are an expert ${domain} consultant generating intelligent assumptions for a product discovery session.

CONTEXT:
- Domain: ${domain}
- Current Stage: ${stage}
- User Sophistication: ${userProfile.sophisticationLevel}
- User Role: ${userProfile.role}
- Pivot Reason: ${pivotReason}
- Conversation Length: ${conversationHistory.length} exchanges

 USER PROFILE:
 - Industry Experience: ${userProfile.domainKnowledge?.experience || 'Unknown'}
 - Technical Depth: ${userProfile.domainKnowledge?.technicalDepth || 'Unknown'}
 - Sophistication Level: ${userProfile.sophisticationLevel}

CONVERSATION SUMMARY:
${conversationHistory.map(h => `Q: ${h.generatedQuestion?.question}\nA: ${h.userResponse}`).join('\n\n')}

TASK:
Generate intelligent assumptions that:
1. Fill gaps in the conversation based on user sophistication level
2. Match the user's demonstrated expertise and communication style
3. Are reasonable for the ${domain} domain
4. Enable progression to the next conversation stage
5. Include validation questions for critical assumptions

Focus on these assumption categories:
- User Target: Who will use this product
- Problem Definition: What problem is being solved
- Technical Requirements: Architecture and technical needs
- Business Model: How the product creates value
- Constraints: Limitations and requirements

You must respond with valid JSON only, no other text. Use this exact format:
{
  "assumptions": [
    {
      "category": "user_target|problem_definition|technical_requirements|business_model|constraints",
      "title": "Brief assumption title",
      "description": "Detailed assumption description",
      "confidence": 0.8,
      "reasoning": "Why this assumption is reasonable",
      "impact": "low|medium|high",
      "dependencies": ["other assumption titles this depends on"],
      "validationQuestions": ["questions to validate this assumption"],
      "alternatives": ["alternative assumptions if this is wrong"]
    }
  ],
  "confidence": 0.75,
  "reasoning": "Overall reasoning for this assumption set",
  "missingCriticalInfo": ["critical information still needed"],
  "recommendedNextSteps": ["what to do after assumptions are validated"]
}`
  }

  /**
   * Build prompt for assumption refinement
   */
  private buildAssumptionRefinementPrompt(
    originalAssumptions: AssumptionSet,
    userFeedback: string,
    context: ConversationContext
  ): string {
    return `You are refining product assumptions based on user feedback.

ORIGINAL ASSUMPTIONS:
${JSON.stringify(originalAssumptions.assumptions, null, 2)}

USER FEEDBACK:
"${userFeedback}"

CONTEXT:
- Domain: ${context.domain}
- User Sophistication: ${context.userProfile.sophisticationLevel}
- Original Confidence: ${originalAssumptions.confidence}

TASK:
Refine the assumptions based on the user's feedback. You should:
1. Modify assumptions that the user corrected
2. Add new assumptions based on user input
3. Remove assumptions the user rejected
4. Maintain consistency across all assumptions
5. Update confidence levels based on user validation

You must respond with valid JSON only, no other text. Use the same format as the original assumptions:
{
  "assumptions": [...],
  "confidence": 0.85,
  "reasoning": "How the assumptions were refined based on feedback",
  "missingCriticalInfo": [...],
  "recommendedNextSteps": [...]
}`
  }
} 