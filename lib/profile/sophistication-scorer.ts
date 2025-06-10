import { OpenAIService, CompletionRequest } from '@/lib/openai/client';
import { openaiConfig } from '@/lib/config/environment';
import { UserRole } from './role-detector';
import { Industry } from './industry-classifier';

/**
 * Sophistication Scoring System
 * Analyzes user terminology and language complexity to determine their level of expertise.
 */

export enum SophisticationLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export interface SophisticationScore {
  level: SophisticationLevel;
  score: number; // 0-100 numeric score
  confidence: number; // 0-1 confidence in assessment
  reasoning: string;
  factors: {
    vocabularyComplexity: number;
    domainExpertise: number;
    conceptualDepth: number;
    professionalTerminology: number;
    communicationClarity: number;
  };
  indicators: {
    advanced: string[];
    intermediate: string[];
    basic: string[];
  };
  recommendations: string[];
}

export interface SophisticationAnalysisContext {
  userRole?: UserRole;
  industry?: Industry;
  conversationHistory?: string[];
  previousScores?: SophisticationScore[];
}

/**
 * Advanced sophistication scorer using linguistic analysis and domain knowledge
 */
export class SophisticationScorer {
  private openaiService: OpenAIService;

  // Domain-specific advanced terminology
  private advancedTerminology = {
    [Industry.FINTECH]: [
      'algorithmic trading', 'quantitative analysis', 'risk modeling', 'derivatives',
      'compliance framework', 'regulatory sandbox', 'capital adequacy', 'stress testing',
      'market microstructure', 'high-frequency trading', 'dark pools', 'liquidity provision',
      'credit scoring models', 'alternative data', 'robo-advisory', 'regulatory technology'
    ],
    [Industry.HEALTHCARE]: [
      'clinical decision support', 'evidence-based medicine', 'pharmacovigilance',
      'clinical trial design', 'biomarker validation', 'regulatory approval pathway',
      'health economics', 'population health', 'precision medicine', 'genomics',
      'clinical informatics', 'interoperability standards', 'value-based care',
      'clinical data management', 'real-world evidence', 'health technology assessment'
    ],
    [Industry.SAAS]: [
      'multi-tenancy', 'horizontal scaling', 'API rate limiting', 'webhook architecture',
      'event-driven architecture', 'CQRS pattern', 'distributed systems', 'microservices',
      'container orchestration', 'service mesh', 'observability', 'chaos engineering',
      'progressive deployment', 'feature flags', 'A/B testing framework', 'customer success metrics'
    ],
    [Industry.ECOMMERCE]: [
      'conversion rate optimization', 'customer lifetime value', 'attribution modeling',
      'inventory optimization', 'demand forecasting', 'recommendation engines',
      'personalization algorithms', 'omnichannel strategy', 'fulfillment automation',
      'dynamic pricing', 'marketplace mechanics', 'payment orchestration',
      'fraud detection', 'supply chain visibility', 'customer data platform'
    ],
    [Industry.CONSUMER]: [
      'user engagement metrics', 'retention modeling', 'viral mechanics', 'growth hacking',
      'product-market fit', 'network effects', 'user acquisition funnel', 'cohort analysis',
      'behavioral analytics', 'push notification optimization', 'app store optimization',
      'social graph analysis', 'content recommendation', 'gamification strategies'
    ],
    [Industry.ENTERPRISE]: [
      'enterprise architecture', 'digital transformation', 'change management',
      'business process reengineering', 'governance framework', 'risk management',
      'compliance automation', 'identity management', 'zero trust security',
      'data governance', 'master data management', 'business intelligence',
      'process automation', 'workflow orchestration', 'stakeholder alignment'
    ],
    [Industry.GENERAL]: [
      'stakeholder management', 'value proposition', 'competitive analysis',
      'market segmentation', 'customer validation', 'business model canvas',
      'lean startup methodology', 'agile development', 'design thinking',
      'user experience design', 'data-driven decisions', 'growth strategies'
    ]
  };

  // Professional terminology by role
  private professionalTerminology = {
    [UserRole.TECHNICAL]: [
      'software architecture', 'design patterns', 'code review', 'technical debt',
      'performance optimization', 'system scalability', 'fault tolerance',
      'continuous integration', 'infrastructure as code', 'monitoring and alerting',
      'security best practices', 'code maintainability', 'technical documentation'
    ],
    [UserRole.BUSINESS]: [
      'strategic planning', 'market analysis', 'business development', 'stakeholder engagement',
      'financial modeling', 'revenue optimization', 'cost-benefit analysis',
      'risk assessment', 'project management', 'organizational design',
      'performance metrics', 'competitive intelligence', 'partnership strategy'
    ],
    [UserRole.HYBRID]: [
      'product strategy', 'technical requirements', 'cross-functional collaboration',
      'user research', 'product roadmap', 'feature prioritization', 'data analytics',
      'technical feasibility', 'market requirements', 'agile methodology',
      'stakeholder alignment', 'product metrics', 'technical communication'
    ]
  };

  // Complexity indicators
  private complexityIndicators = {
    advanced: {
      sentenceLength: 25, // Words per sentence
      syllablesPerWord: 2.5,
      uniqueWordRatio: 0.7,
      technicalTermDensity: 0.15,
      abstractConcepts: ['framework', 'methodology', 'paradigm', 'ecosystem', 'architecture']
    },
    intermediate: {
      sentenceLength: 18,
      syllablesPerWord: 2.0,
      uniqueWordRatio: 0.6,
      technicalTermDensity: 0.08,
      abstractConcepts: ['strategy', 'process', 'system', 'approach', 'solution']
    },
    basic: {
      sentenceLength: 12,
      syllablesPerWord: 1.5,
      uniqueWordRatio: 0.5,
      technicalTermDensity: 0.03,
      abstractConcepts: ['idea', 'plan', 'way', 'method', 'tool']
    }
  };

  constructor() {
    this.openaiService = new OpenAIService();
  }

  /**
   * Score user sophistication based on their input
   */
  async scoreSophistication(
    input: string, 
    context?: SophisticationAnalysisContext
  ): Promise<SophisticationScore> {
    try {
      // Linguistic analysis
      const linguisticAnalysis = this.analyzeLinguisticComplexity(input);
      
      // Domain expertise analysis
      const domainAnalysis = this.analyzeDomainExpertise(input, context?.industry, context?.userRole);
      
      // GPT-4 based sophisticated analysis
      const gptAnalysis = await this.gptBasedSophisticationAnalysis(input, context);
      
      // Combine all analyses
      return this.combineSophisticationAnalyses(
        linguisticAnalysis,
        domainAnalysis,
        gptAnalysis,
        input,
        context
      );
      
    } catch (error) {
      console.error('Sophistication scoring failed:', error);
      
      // Fallback to linguistic analysis only
      const fallbackAnalysis = this.analyzeLinguisticComplexity(input);
      return this.createFallbackScore(fallbackAnalysis, input);
    }
  }

  /**
   * Analyze linguistic complexity of the text
   */
  private analyzeLinguisticComplexity(input: string) {
    const words = input.toLowerCase().match(/\b\w+\b/g) || [];
    const sentences = input.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const uniqueWords = new Set(words);

    // Calculate metrics
    const avgSentenceLength = words.length / Math.max(sentences.length, 1);
    const uniqueWordRatio = uniqueWords.size / Math.max(words.length, 1);
    const avgSyllables = this.calculateAverageSyllables(words);
    
    // Score components (0-100)
    const sentenceComplexity = this.scoreComplexityMetric(
      avgSentenceLength,
      this.complexityIndicators.basic.sentenceLength,
      this.complexityIndicators.advanced.sentenceLength
    );
    
    const vocabularyDiversity = this.scoreComplexityMetric(
      uniqueWordRatio,
      this.complexityIndicators.basic.uniqueWordRatio,
      this.complexityIndicators.advanced.uniqueWordRatio
    );
    
    const syllableComplexity = this.scoreComplexityMetric(
      avgSyllables,
      this.complexityIndicators.basic.syllablesPerWord,
      this.complexityIndicators.advanced.syllablesPerWord
    );

    // Abstract concept usage
    const abstractScore = this.scoreAbstractConcepts(input);

    return {
      sentenceComplexity,
      vocabularyDiversity,
      syllableComplexity,
      abstractScore,
      avgSentenceLength,
      uniqueWordRatio,
      avgSyllables,
      overallScore: (sentenceComplexity + vocabularyDiversity + syllableComplexity + abstractScore) / 4
    };
  }

  /**
   * Analyze domain-specific expertise indicators
   */
  private analyzeDomainExpertise(input: string, industry?: Industry, role?: UserRole) {
    const inputLower = input.toLowerCase();
    let advancedTerms: string[] = [];
    let professionalTerms: string[] = [];

    // Get domain-specific terms
    if (industry && this.advancedTerminology[industry]) {
      advancedTerms = this.advancedTerminology[industry];
    }

    // Get role-specific terms
    if (role && role in this.professionalTerminology) {
      professionalTerms = this.professionalTerminology[role as keyof typeof this.professionalTerminology];
    }

    // Count matches
    const advancedMatches = advancedTerms.filter(term => 
      inputLower.includes(term.toLowerCase())
    );
    
    const professionalMatches = professionalTerms.filter(term =>
      inputLower.includes(term.toLowerCase())
    );

    // Calculate domain expertise score
    const words = inputLower.match(/\b\w+\b/g) || [];
    const advancedDensity = advancedMatches.length / Math.max(words.length / 10, 1); // Per 10 words
    const professionalDensity = professionalMatches.length / Math.max(words.length / 10, 1);

    const domainScore = Math.min(100, (advancedDensity + professionalDensity) * 25);

    return {
      advancedMatches,
      professionalMatches,
      domainScore,
      advancedDensity,
      professionalDensity
    };
  }

  /**
   * GPT-4 based sophistication analysis
   */
  private async gptBasedSophisticationAnalysis(
    input: string,
    context?: SophisticationAnalysisContext
  ) {
    const prompt = this.buildSophisticationPrompt(input, context);
    
    const request: CompletionRequest = {
      messages: [
        {
          role: 'system',
          content: prompt.system
        },
        {
          role: 'user',
          content: prompt.user
        }
      ],
      options: {
        model: openaiConfig.models.primary,
        temperature: 0.2,
        maxTokens: 1000
      }
    };

    const response = await this.openaiService.createCompletionWithFallback(request);
    
    return this.parseSophisticationResponse(response.choices[0].message.content || '');
  }

  /**
   * Build sophistication analysis prompt
   */
  private buildSophisticationPrompt(input: string, context?: SophisticationAnalysisContext) {
    const system = `You are an expert in assessing professional sophistication and domain expertise. Analyze the user's communication to determine their level of sophistication across multiple dimensions.

SOPHISTICATION LEVELS:
- LOW (0-33): Basic understanding, simple language, general concepts
- MEDIUM (34-66): Intermediate knowledge, some domain terms, structured thinking  
- HIGH (67-100): Advanced expertise, sophisticated terminology, deep conceptual understanding

ANALYSIS DIMENSIONS:
1. VOCABULARY COMPLEXITY: Word choice, technical terminology, precision of language
2. DOMAIN EXPERTISE: Industry-specific knowledge, professional concepts, best practices
3. CONCEPTUAL DEPTH: Abstract thinking, systems perspective, strategic considerations
4. PROFESSIONAL TERMINOLOGY: Role-specific language, business/technical fluency
5. COMMUNICATION CLARITY: Structure, coherence, ability to explain complex ideas

SCORING CRITERIA:
- Language sophistication and precision
- Use of domain-specific terminology
- Depth of conceptual understanding
- Professional communication style
- Evidence of experience and expertise

RESPONSE FORMAT (JSON):
{
  "sophistication_level": "low|medium|high",
  "overall_score": 75,
  "confidence": 0.85,
  "reasoning": "Detailed analysis of sophistication indicators",
  "factor_scores": {
    "vocabulary_complexity": 80,
    "domain_expertise": 70,
    "conceptual_depth": 75,
    "professional_terminology": 85,
    "communication_clarity": 80
  },
  "indicators": {
    "advanced": ["indicator1", "indicator2"],
    "intermediate": ["indicator1", "indicator2"],
    "basic": ["indicator1", "indicator2"]
  },
  "recommendations": ["recommendation1", "recommendation2"]
}`;

    let user = `Analyze the sophistication level of this user input:

INPUT: "${input}"`;

    if (context?.userRole) {
      user += `\n\nUSER ROLE: ${context.userRole}`;
    }
    
    if (context?.industry) {
      user += `\n\nINDUSTRY CONTEXT: ${context.industry}`;
    }

    if (context?.conversationHistory && Array.isArray(context.conversationHistory) && context.conversationHistory.length > 0) {
      user += `\n\nCONVERSATION HISTORY:\n${context.conversationHistory.slice(-2).map((msg, i) => `${i + 1}. ${msg}`).join('\n')}`;
    }

    user += '\n\nProvide sophistication analysis as JSON:';

    return { system, user };
  }

  /**
   * Parse GPT sophistication response
   */
  private parseSophisticationResponse(content: string): any {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      if (!parsed.sophistication_level || parsed.overall_score === undefined) {
        throw new Error('Missing required fields in sophistication response');
      }

      return {
        level: parsed.sophistication_level,
        score: Math.max(0, Math.min(100, parsed.overall_score)),
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
        reasoning: parsed.reasoning || '',
        factors: parsed.factor_scores || {},
        indicators: parsed.indicators || { advanced: [], intermediate: [], basic: [] },
        recommendations: parsed.recommendations || []
      };

    } catch (error) {
      console.error('Failed to parse sophistication response:', error);
      throw new Error(`Sophistication response parsing failed: ${error}`);
    }
  }

  /**
   * Combine all analyses for final sophistication score
   */
  private combineSophisticationAnalyses(
    linguistic: any,
    domain: any,
    gpt: any,
    input: string,
    context?: SophisticationAnalysisContext
  ): SophisticationScore {
    // Weight the different analyses
    const weights = {
      linguistic: 0.3,
      domain: 0.3,
      gpt: 0.4
    };

    // Calculate combined score
    const combinedScore = Math.round(
      linguistic.overallScore * weights.linguistic +
      domain.domainScore * weights.domain +
      gpt.score * weights.gpt
    );

    // Determine level from score
    let level: SophisticationLevel;
    if (combinedScore >= 67) level = SophisticationLevel.HIGH;
    else if (combinedScore >= 34) level = SophisticationLevel.MEDIUM;
    else level = SophisticationLevel.LOW;

    // Combine confidence factors
    const confidence = Math.min(1.0, gpt.confidence + (domain.advancedMatches.length > 0 ? 0.1 : 0));

    // Merge indicators
    const indicators = {
      advanced: Array.from(new Set([...(domain.advancedMatches || []), ...(gpt.indicators.advanced || [])])) as string[],
      intermediate: Array.from(new Set([...(domain.professionalMatches || []), ...(gpt.indicators.intermediate || [])])) as string[],
      basic: Array.from(new Set(gpt.indicators.basic || [])) as string[]
    };

    return {
      level,
      score: combinedScore,
      confidence,
      reasoning: `Combined analysis (Score: ${combinedScore}): ${gpt.reasoning}. Linguistic complexity: ${linguistic.overallScore.toFixed(1)}. Domain expertise: ${domain.domainScore.toFixed(1)}.`,
      factors: {
        vocabularyComplexity: gpt.factors.vocabulary_complexity || linguistic.vocabularyDiversity,
        domainExpertise: gpt.factors.domain_expertise || domain.domainScore,
        conceptualDepth: gpt.factors.conceptual_depth || linguistic.abstractScore,
        professionalTerminology: gpt.factors.professional_terminology || (domain.professionalMatches.length * 20),
        communicationClarity: gpt.factors.communication_clarity || linguistic.sentenceComplexity
      },
      indicators,
      recommendations: gpt.recommendations || this.generateRecommendations(level, indicators)
    };
  }

  /**
   * Create fallback score when GPT analysis fails
   */
  private createFallbackScore(linguistic: any, input: string): SophisticationScore {
    const score = Math.round(linguistic.overallScore);
    let level: SophisticationLevel;
    
    if (score >= 67) level = SophisticationLevel.HIGH;
    else if (score >= 34) level = SophisticationLevel.MEDIUM;
    else level = SophisticationLevel.LOW;

    return {
      level,
      score,
      confidence: 0.4, // Lower confidence for fallback
      reasoning: `Fallback linguistic analysis: sentence complexity ${linguistic.sentenceComplexity.toFixed(1)}, vocabulary diversity ${linguistic.vocabularyDiversity.toFixed(1)}`,
      factors: {
        vocabularyComplexity: linguistic.vocabularyDiversity,
        domainExpertise: 50, // Neutral score
        conceptualDepth: linguistic.abstractScore,
        professionalTerminology: 50, // Neutral score
        communicationClarity: linguistic.sentenceComplexity
      },
      indicators: {
        advanced: [],
        intermediate: [],
        basic: ['Basic linguistic analysis only']
      },
      recommendations: this.generateRecommendations(level, { advanced: [], intermediate: [], basic: [] })
    };
  }

  // Helper methods

  private calculateAverageSyllables(words: string[]): number {
    const syllableCounts = words.map(word => this.countSyllables(word));
    return syllableCounts.reduce((sum, count) => sum + count, 0) / Math.max(words.length, 1);
  }

  private countSyllables(word: string): number {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    
    const vowels = 'aeiouy';
    let count = 0;
    let previousWasVowel = false;
    
    for (let i = 0; i < word.length; i++) {
      const isVowel = vowels.includes(word[i]);
      if (isVowel && !previousWasVowel) {
        count++;
      }
      previousWasVowel = isVowel;
    }
    
    // Adjust for silent e
    if (word.endsWith('e') && count > 1) {
      count--;
    }
    
    return Math.max(1, count);
  }

  private scoreComplexityMetric(value: number, basicThreshold: number, advancedThreshold: number): number {
    if (value <= basicThreshold) return (value / basicThreshold) * 33;
    if (value <= advancedThreshold) {
      const range = advancedThreshold - basicThreshold;
      const position = value - basicThreshold;
      return 33 + (position / range) * 34;
    }
    return Math.min(100, 67 + ((value - advancedThreshold) / advancedThreshold) * 33);
  }

  private scoreAbstractConcepts(input: string): number {
    const inputLower = input.toLowerCase();
    let score = 0;
    
    // Check for advanced abstract concepts
    this.complexityIndicators.advanced.abstractConcepts.forEach(concept => {
      if (inputLower.includes(concept)) score += 25;
    });
    
    // Check for intermediate concepts
    this.complexityIndicators.intermediate.abstractConcepts.forEach(concept => {
      if (inputLower.includes(concept)) score += 15;
    });
    
    // Check for basic concepts
    this.complexityIndicators.basic.abstractConcepts.forEach(concept => {
      if (inputLower.includes(concept)) score += 5;
    });
    
    return Math.min(100, score);
  }

  private generateRecommendations(level: SophisticationLevel, indicators: any): string[] {
    const recommendations: string[] = [];
    
    switch (level) {
      case SophisticationLevel.LOW:
        recommendations.push(
          'Consider providing more background context to help tailor responses',
          'Feel free to ask for explanations of technical terms',
          'We can start with basic concepts and build complexity gradually'
        );
        break;
        
      case SophisticationLevel.MEDIUM:
        recommendations.push(
          'You can provide more specific technical details for better assistance',
          'Consider sharing your role/background for more targeted advice',
          'We can dive deeper into implementation details if needed'
        );
        break;
        
      case SophisticationLevel.HIGH:
        recommendations.push(
          'Feel free to use advanced terminology and concepts',
          'We can focus on sophisticated implementation strategies',
          'Consider sharing specific constraints or advanced requirements'
        );
        break;
    }
    
    return recommendations;
  }

  /**
   * Track sophistication over conversation
   */
  async trackSophisticationProgression(
    inputs: string[],
    context?: SophisticationAnalysisContext
  ): Promise<SophisticationScore[]> {
    const scores: SophisticationScore[] = [];
    
    for (let i = 0; i < inputs.length; i++) {
      const updatedContext = {
        ...context,
        conversationHistory: inputs.slice(0, i),
        previousScores: scores
      };
      
      const score = await this.scoreSophistication(inputs[i], updatedContext);
      scores.push(score);
      
      // Small delay for rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return scores;
  }
}

// Singleton instance for global use
export const sophisticationScorer = new SophisticationScorer(); 