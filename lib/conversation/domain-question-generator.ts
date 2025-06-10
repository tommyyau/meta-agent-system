/**
 * Domain-Specific Question Generator
 * 
 * Advanced question generation system that provides deep domain expertise
 * and generates contextually sophisticated questions based on user responses
 * and conversation analysis.
 */

import { openai } from '../openai/client'
import type { 
  ConversationContext, 
  QuestionGenerationResult,
  UserProfile,
  ConversationStage,
  SophisticationLevel
} from '../types/conversation'
import type { EnhancedResponseAnalysis } from './response-analyzer'

export interface DomainQuestionPattern {
  stage: ConversationStage
  sophisticationLevel: SophisticationLevel
  patterns: string[]
  examples: string[]
  keywords: string[]
  followUpTypes: string[]
}

export interface DomainExpertiseProfile {
  domain: string
  expertiseAreas: string[]
  questionPatterns: DomainQuestionPattern[]
  terminologyMap: Record<string, string[]>
  businessDrivers: string[]
  technicalConcepts: string[]
  commonChallenges: string[]
  bestPractices: string[]
  industryStandards: string[]
  regulatoryRequirements: string[]
}

export interface QuestionGenerationStrategy {
  type: 'exploration' | 'validation' | 'deep-dive' | 'clarification' | 'technical' | 'business'
  priority: number
  reasoning: string
  expectedOutcomes: string[]
}

export class DomainQuestionGenerator {
  private readonly model: string
  private readonly domainProfiles: Map<string, DomainExpertiseProfile>

  constructor(model: string = 'gpt-4o-mini') {
    this.model = model
    this.domainProfiles = new Map()
    this.initializeDomainProfiles()
  }

  /**
   * Generate domain-specific question with advanced context awareness
   */
  async generateDomainQuestion(
    context: ConversationContext,
    responseAnalysis: EnhancedResponseAnalysis,
    strategy?: QuestionGenerationStrategy
  ): Promise<QuestionGenerationResult> {
    try {
      const domainProfile = this.getDomainProfile(context.domain)
      const questionStrategy = strategy || this.determineQuestionStrategy(context, responseAnalysis)
      
      const prompt = this.buildAdvancedQuestionPrompt(context, responseAnalysis, domainProfile, questionStrategy)
      
      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: prompt
          }
        ],
        max_tokens: 1200,
        temperature: 0.6 // Slightly lower for more consistent domain expertise
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
          throw new Error(`Invalid JSON response from domain question generator: ${content}`)
        }
      }
      
      // Return result with basic metadata (keeping compatible with QuestionGenerationResult type)
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
      console.error('Error generating domain-specific question:', error)
      throw new Error(`Failed to generate domain question: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Determine optimal question strategy based on conversation analysis
   */
  private determineQuestionStrategy(
    context: ConversationContext,
    responseAnalysis: EnhancedResponseAnalysis
  ): QuestionGenerationStrategy {
    const conversationLength = context.conversationHistory.length

    // Calculate average sophistication from breakdown
    const sophisticationScore = (
      responseAnalysis.sophisticationBreakdown.technicalLanguage +
      responseAnalysis.sophisticationBreakdown.domainSpecificity +
      responseAnalysis.sophisticationBreakdown.complexityHandling +
      responseAnalysis.sophisticationBreakdown.businessAcumen +
      responseAnalysis.sophisticationBreakdown.communicationClarity
    ) / 5

    // Calculate average engagement from metrics
    const engagementScore = (
      responseAnalysis.engagementMetrics.enthusiasm +
      responseAnalysis.engagementMetrics.interestLevel +
      responseAnalysis.engagementMetrics.participationQuality +
      responseAnalysis.engagementMetrics.proactiveness +
      responseAnalysis.engagementMetrics.collaborativeSpirit
    ) / 5

    // Calculate average clarity from metrics
    const clarityScore = (
      responseAnalysis.clarityMetrics.specificity +
      responseAnalysis.clarityMetrics.structuredThinking +
      responseAnalysis.clarityMetrics.completeness +
      responseAnalysis.clarityMetrics.relevance +
      responseAnalysis.clarityMetrics.actionability
    ) / 5

    // High sophistication + high engagement = deep technical dive
    if (sophisticationScore >= 0.8 && engagementScore >= 0.7) {
      return {
        type: 'technical',
        priority: 10,
        reasoning: 'User demonstrates high expertise and engagement - deep technical exploration',
        expectedOutcomes: ['detailed technical requirements', 'architectural preferences', 'integration challenges']
      }
    }

    // Low clarity or confusion signals = clarification needed
    if (clarityScore < 0.5 || responseAnalysis.advancedEscapeSignals.confusion.detected) {
      return {
        type: 'clarification',
        priority: 9,
        reasoning: 'User response lacks clarity or shows confusion - need clarification',
        expectedOutcomes: ['clearer understanding', 'simplified explanation', 'concrete examples']
      }
    }

    // Early conversation + moderate sophistication = exploration
    if (conversationLength < 3 && sophisticationScore >= 0.4) {
      return {
        type: 'exploration',
        priority: 8,
        reasoning: 'Early conversation phase with competent user - explore problem space',
        expectedOutcomes: ['problem identification', 'use case definition', 'user workflow understanding']
      }
    }

    // Business-focused responses = business strategy questions
    if (responseAnalysis.sophisticationBreakdown.businessAcumen >= 0.7) {
      return {
        type: 'business',
        priority: 7,
        reasoning: 'User shows strong business focus - explore business requirements',
        expectedOutcomes: ['business objectives', 'success metrics', 'stakeholder needs']
      }
    }

    // High technical language but low engagement = validation
    if (responseAnalysis.sophisticationBreakdown.technicalLanguage >= 0.7 && engagementScore < 0.6) {
      return {
        type: 'validation',
        priority: 6,
        reasoning: 'Technical user with declining engagement - validate understanding',
        expectedOutcomes: ['requirement confirmation', 'priority validation', 'assumption checking']
      }
    }

    // Default: progressive exploration
    return {
      type: 'exploration',
      priority: 5,
      reasoning: 'Standard progression - continue exploring requirements',
      expectedOutcomes: ['deeper problem understanding', 'requirement refinement', 'context building']
    }
  }

  /**
   * Build advanced domain-aware question generation prompt
   */
  private buildAdvancedQuestionPrompt(
    context: ConversationContext,
    responseAnalysis: EnhancedResponseAnalysis,
    domainProfile: DomainExpertiseProfile,
    strategy: QuestionGenerationStrategy
  ): string {
    const { userProfile, conversationHistory, stage, domain } = context
    const lastResponse = conversationHistory[conversationHistory.length - 1]?.userResponse || 'No previous response'

    // Calculate scores from responseAnalysis breakdown
    const sophisticationScore = (
      responseAnalysis.sophisticationBreakdown.technicalLanguage +
      responseAnalysis.sophisticationBreakdown.domainSpecificity +
      responseAnalysis.sophisticationBreakdown.complexityHandling +
      responseAnalysis.sophisticationBreakdown.businessAcumen +
      responseAnalysis.sophisticationBreakdown.communicationClarity
    ) / 5

    const engagementScore = (
      responseAnalysis.engagementMetrics.enthusiasm +
      responseAnalysis.engagementMetrics.interestLevel +
      responseAnalysis.engagementMetrics.participationQuality +
      responseAnalysis.engagementMetrics.proactiveness +
      responseAnalysis.engagementMetrics.collaborativeSpirit
    ) / 5

    const clarityScore = (
      responseAnalysis.clarityMetrics.specificity +
      responseAnalysis.clarityMetrics.structuredThinking +
      responseAnalysis.clarityMetrics.completeness +
      responseAnalysis.clarityMetrics.relevance +
      responseAnalysis.clarityMetrics.actionability
    ) / 5

    return `You are a world-class ${domain} consultant with deep domain expertise, conducting an intelligent product discovery conversation.

CURRENT SITUATION:
- Domain: ${domain} (Expert-level knowledge required)
- Conversation Stage: ${stage}
- Strategy: ${strategy.type} (${strategy.reasoning})
- User Sophistication: ${sophisticationScore.toFixed(2)} (${userProfile.sophisticationLevel})
- Engagement Level: ${engagementScore.toFixed(2)} (${userProfile.engagementPattern})
- Clarity Score: ${clarityScore.toFixed(2)}

USER'S LAST RESPONSE:
"${lastResponse}"

RESPONSE ANALYSIS INSIGHTS:
- Technical Depth: ${responseAnalysis.sophisticationBreakdown.technicalLanguage.toFixed(2)}
- Business Acumen: ${responseAnalysis.sophisticationBreakdown.businessAcumen.toFixed(2)}
- Domain Specificity: ${responseAnalysis.sophisticationBreakdown.domainSpecificity.toFixed(2)}
- Communication Clarity: ${responseAnalysis.sophisticationBreakdown.communicationClarity.toFixed(2)}
- Enthusiasm: ${responseAnalysis.engagementMetrics.enthusiasm.toFixed(2)}
- Interest Level: ${responseAnalysis.engagementMetrics.interestLevel.toFixed(2)}

ESCAPE SIGNALS DETECTED:
${responseAnalysis.advancedEscapeSignals.fatigue.detected ? `- Fatigue: ${responseAnalysis.advancedEscapeSignals.fatigue.confidence.toFixed(2)} confidence` : ''}
${responseAnalysis.advancedEscapeSignals.expertise.detected ? `- Expertise Skip: ${responseAnalysis.advancedEscapeSignals.expertise.confidence.toFixed(2)} confidence (${responseAnalysis.advancedEscapeSignals.expertise.suggestedSkipLevel})` : ''}
${responseAnalysis.advancedEscapeSignals.impatience.detected ? `- Impatience: ${responseAnalysis.advancedEscapeSignals.impatience.confidence.toFixed(2)} confidence (${responseAnalysis.advancedEscapeSignals.impatience.urgencyLevel})` : ''}

DOMAIN EXPERTISE REQUIRED:
Domain: ${domainProfile.domain}
Key Areas: ${domainProfile.expertiseAreas.join(', ')}
Technical Concepts: ${domainProfile.technicalConcepts.join(', ')}
Business Drivers: ${domainProfile.businessDrivers.join(', ')}
Industry Standards: ${domainProfile.industryStandards.join(', ')}
Regulatory Requirements: ${domainProfile.regulatoryRequirements.join(', ')}
Common Challenges: ${domainProfile.commonChallenges.join(', ')}

CONVERSATION CONTEXT:
${conversationHistory.slice(-2).map((h, i) => 
  `Exchange ${conversationHistory.length - 1 + i}:
  Q: ${h.generatedQuestion?.question || 'Initial question'}
  A: ${h.userResponse}
  Analysis: Sophistication ${h.analysis?.sophisticationScore?.toFixed(2) || 'N/A'}, Engagement ${h.analysis?.engagementLevel?.toFixed(2) || 'N/A'}`
).join('\n\n')}

QUESTION GENERATION TASK:
Generate the next optimal question using strategy: ${strategy.type}
Expected outcomes: ${strategy.expectedOutcomes.join(', ')}

REQUIREMENTS:
1. Demonstrate expert-level ${domain} knowledge through terminology and concepts
2. Match user's sophistication level (${sophisticationScore.toFixed(2)})
3. Address any confusion or escape signals appropriately
4. Build logically on previous conversation exchanges
5. Use industry-specific terminology when appropriate for user level
6. Include follow-up options for different response types
7. Provide clear reasoning for why this question advances the conversation

RESPONSE FORMAT (JSON only, no other text):
{
  "question": "Your expertly crafted domain-specific question",
  "questionType": "exploration|validation|deep-dive|clarification|technical|business",
  "sophisticationLevel": "novice|intermediate|advanced|expert",
  "domainContext": "Why this question matters in ${domain} context",
  "followUpSuggestions": ["3-4 potential follow-up questions based on response type"],
  "confidence": 0.85,
  "reasoning": "Strategic reasoning for this question choice",
  "expectedResponseTypes": ["specific types of responses expected"],
  "expertiseArea": "Specific ${domain} expertise area being explored",
  "industryRelevance": "How this relates to real ${domain} industry needs",
  "technicalDepth": "novice|intermediate|advanced|expert",
  "businessImpact": "Business implications of this question area",
  "nextTopics": ["logical next topics to explore based on response"],
  "adaptationHints": {
    "ifNoviceResponse": "How to simplify if user shows confusion",
    "ifExpertResponse": "How to go deeper if user shows expertise",
    "ifConfusedResponse": "How to clarify if user seems lost"
  }
}

Remember: You are demonstrating world-class ${domain} expertise. Use appropriate industry terminology, reference real industry challenges, and show deep understanding of ${domain} business and technical requirements.`
  }

  /**
   * Get comprehensive domain profile
   */
  private getDomainProfile(domain: string): DomainExpertiseProfile {
    return this.domainProfiles.get(domain) || this.domainProfiles.get('general')!
  }

  /**
   * Initialize comprehensive domain expertise profiles
   */
  private initializeDomainProfiles(): void {
    // Fintech Domain Profile
    this.domainProfiles.set('fintech', {
      domain: 'fintech',
      expertiseAreas: [
        'Regulatory Compliance', 'Payment Processing', 'Risk Management', 'Core Banking Systems',
        'API Integration', 'Fraud Detection', 'Customer Onboarding', 'Regulatory Reporting',
        'Open Banking', 'Digital Wallets', 'Cryptocurrency', 'InsurTech', 'RegTech'
      ],
      questionPatterns: [],
      terminologyMap: {
        'regulatory': ['PCI DSS', 'SOC2', 'GDPR', 'Basel III', 'Dodd-Frank', 'MiFID II'],
        'payments': ['ACH', 'SWIFT', 'real-time payments', 'payment rails', 'settlement'],
        'risk': ['credit scoring', 'fraud detection', 'AML', 'KYC', 'risk assessment'],
        'technology': ['core banking', 'payment processors', 'APIs', 'microservices', 'cloud banking']
      },
      businessDrivers: [
        'Regulatory compliance automation', 'Customer experience improvement', 'Operational efficiency',
        'Risk reduction', 'Market expansion', 'Digital transformation', 'Cost reduction'
      ],
      technicalConcepts: [
        'Real-time payment processing', 'Microservices architecture', 'API-first design',
        'Event-driven systems', 'Encryption and tokenization', 'Blockchain integration',
        'Machine learning for fraud detection', 'Cloud-native banking platforms'
      ],
      commonChallenges: [
        'Legacy system integration complexity', 'Regulatory compliance burden',
        'Real-time processing requirements', 'Fraud prevention vs user experience',
        'Multi-jurisdiction compliance', 'Vendor lock-in with core banking systems',
        'Customer data privacy and security', 'Scalability under transaction volume'
      ],
      bestPractices: [
        'API-first architecture for flexibility', 'Microservices for compliance isolation',
        'Real-time monitoring and alerting', 'Automated compliance reporting',
        'Progressive customer onboarding', 'Multi-layered security approach',
        'Cloud-first for scalability', 'DevSecOps for secure development'
      ],
      industryStandards: [
        'ISO 27001', 'PCI DSS', 'SOC2 Type II', 'ISO 20022', 'FIDO Alliance standards',
        'Open Banking standards', 'SWIFT messaging standards', 'FIX protocol'
      ],
      regulatoryRequirements: [
        'Know Your Customer (KYC)', 'Anti-Money Laundering (AML)', 'Bank Secrecy Act (BSA)',
        'Payment Card Industry (PCI) compliance', 'General Data Protection Regulation (GDPR)',
        'Sarbanes-Oxley Act (SOX)', 'Consumer Financial Protection Bureau (CFPB) rules'
      ]
    })

    // Healthcare Domain Profile
    this.domainProfiles.set('healthcare', {
      domain: 'healthcare',
      expertiseAreas: [
        'HIPAA Compliance', 'EHR Integration', 'Clinical Workflows', 'Patient Privacy',
        'Interoperability', 'Care Coordination', 'Population Health', 'Telemedicine',
        'Clinical Decision Support', 'Medical Device Integration', 'Health Analytics'
      ],
      questionPatterns: [],
      terminologyMap: {
        'compliance': ['HIPAA', 'HITECH', 'PHI', 'ePHI', 'BAA', 'covered entity'],
        'interoperability': ['HL7 FHIR', 'CDA', 'DICOM', 'IHE profiles', 'API integration'],
        'clinical': ['EHR', 'EMR', 'CPOE', 'clinical decision support', 'care plans'],
        'standards': ['ICD-10', 'CPT codes', 'SNOMED CT', 'LOINC', 'RxNorm']
      },
      businessDrivers: [
        'Patient care quality improvement', 'Provider workflow efficiency', 'Cost reduction',
        'Regulatory compliance', 'Patient engagement', 'Population health management',
        'Care coordination', 'Clinical outcomes improvement'
      ],
      technicalConcepts: [
        'HL7 FHIR API integration', 'EHR data extraction', 'Clinical decision support systems',
        'Patient matching algorithms', 'Health information exchange', 'Secure messaging',
        'Telehealth platforms', 'Medical device connectivity', 'Health analytics pipelines'
      ],
      commonChallenges: [
        'EHR vendor integration complexity', 'HIPAA compliance requirements',
        'Clinical workflow disruption', 'Provider adoption resistance',
        'Interoperability standards complexity', 'Patient data privacy concerns',
        'Healthcare IT security requirements', 'Regulatory approval processes'
      ],
      bestPractices: [
        'Privacy by design principles', 'Minimal necessary data collection',
        'Clinical workflow integration', 'Provider-centric user experience',
        'Automated HIPAA compliance monitoring', 'Secure API design',
        'Evidence-based clinical decision support', 'Patient-centered design'
      ],
      industryStandards: [
        'HL7 FHIR R4', 'DICOM', 'IHE profiles', 'Direct Trust messaging',
        'SMART on FHIR', 'CDA R2', 'X12 transactions', 'NCPDP standards'
      ],
      regulatoryRequirements: [
        'HIPAA Privacy Rule', 'HIPAA Security Rule', 'HITECH Act',
        'FDA medical device regulations', '21 CFR Part 11', 'CMS requirements',
        'ONC certification criteria', 'State health information privacy laws'
      ]
    })

    // General/Business Domain Profile
    this.domainProfiles.set('general', {
      domain: 'general',
      expertiseAreas: [
        'Product Strategy', 'User Experience', 'Market Analysis', 'Technology Architecture',
        'Business Operations', 'Growth Strategy', 'Customer Success', 'Competitive Analysis'
      ],
      questionPatterns: [],
      terminologyMap: {
        'business': ['KPIs', 'ROI', 'product-market fit', 'go-to-market', 'value proposition'],
        'technology': ['APIs', 'microservices', 'cloud architecture', 'scalability', 'security'],
        'product': ['user experience', 'user stories', 'MVP', 'feature prioritization', 'roadmap'],
        'market': ['target market', 'customer segments', 'competitive landscape', 'market size']
      },
      businessDrivers: [
        'Revenue growth', 'Cost reduction', 'User experience improvement',
        'Market expansion', 'Operational efficiency', 'Competitive advantage',
        'Customer retention', 'Time to market'
      ],
      technicalConcepts: [
        'Cloud-native architecture', 'API-first design', 'Microservices',
        'Progressive web apps', 'Mobile-first development', 'Automation workflows',
        'Data analytics and reporting', 'Integration platforms'
      ],
      commonChallenges: [
        'User adoption and change management', 'Technical scalability requirements',
        'Market competition and differentiation', 'Resource constraints and prioritization',
        'Integration with existing systems', 'Security and privacy concerns',
        'Performance and reliability requirements', 'Cross-platform compatibility'
      ],
      bestPractices: [
        'User-centered design methodology', 'Agile development practices',
        'Continuous integration and deployment', 'Performance monitoring and optimization',
        'Security-first development approach', 'Responsive and accessible design',
        'Data-driven decision making', 'Iterative user feedback incorporation'
      ],
      industryStandards: [
        'ISO 27001 (Security)', 'GDPR compliance', 'WCAG accessibility guidelines',
        'OAuth 2.0 and OpenID Connect', 'REST API standards', 'JSON Schema',
        'Semantic versioning', 'HTTP/2 and HTTP/3'
      ],
      regulatoryRequirements: [
        'General Data Protection Regulation (GDPR)', 'California Consumer Privacy Act (CCPA)',
        'Americans with Disabilities Act (ADA) compliance', 'Industry-specific regulations',
        'Data localization requirements', 'Security breach notification laws',
        'Consumer protection regulations', 'Intellectual property considerations'
      ]
    })
  }
} 