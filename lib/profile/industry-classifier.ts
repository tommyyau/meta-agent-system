import { OpenAIService, CompletionRequest } from '@/lib/openai/client';
import { openaiConfig } from '@/lib/config/environment';

/**
 * Industry Classification System
 * Analyzes user input to determine industry vertical with confidence scoring
 */

export enum Industry {
  FINTECH = 'fintech',
  HEALTHCARE = 'healthcare',
  ECOMMERCE = 'ecommerce',
  SAAS = 'saas',
  CONSUMER = 'consumer',
  ENTERPRISE = 'enterprise',
  GENERAL = 'general'
}

export interface IndustryClassification {
  industry: Industry;
  confidence: number;
  reasoning: string;
  keywords: string[];
  subIndustry?: string;
  alternativeIndustries: Array<{
    industry: Industry;
    confidence: number;
    reasoning: string;
  }>;
}

export interface IndustryKeywords {
  [Industry.FINTECH]: string[];
  [Industry.HEALTHCARE]: string[];
  [Industry.ECOMMERCE]: string[];
  [Industry.SAAS]: string[];
  [Industry.CONSUMER]: string[];
  [Industry.ENTERPRISE]: string[];
  [Industry.GENERAL]: string[];
}

// Industry-specific keyword patterns for initial classification
const INDUSTRY_KEYWORDS: IndustryKeywords = {
  [Industry.FINTECH]: [
    'payment', 'finance', 'banking', 'fintech', 'cryptocurrency', 'blockchain',
    'lending', 'investment', 'trading', 'wallet', 'transaction', 'compliance',
    'KYC', 'AML', 'PCI DSS', 'SOC2', 'fraud', 'credit', 'debit', 'mortgage',
    'insurance', 'wealth management', 'robo-advisor', 'neobank', 'regtech'
  ],
  [Industry.HEALTHCARE]: [
    'healthcare', 'medical', 'hospital', 'clinic', 'patient', 'doctor',
    'physician', 'nurse', 'health', 'medicine', 'pharmaceutical', 'biotech',
    'EHR', 'EMR', 'HIPAA', 'clinical', 'diagnosis', 'treatment', 'therapy',
    'telehealth', 'telemedicine', 'medical device', 'FDA', 'clinical trial'
  ],
  [Industry.ECOMMERCE]: [
    'ecommerce', 'e-commerce', 'online store', 'marketplace', 'retail',
    'shopping', 'cart', 'checkout', 'inventory', 'fulfillment', 'shipping',
    'product catalog', 'dropshipping', 'B2C', 'consumer goods', 'merchant',
    'Shopify', 'Amazon', 'marketplace seller', 'online retail'
  ],
  [Industry.SAAS]: [
    'SaaS', 'software as a service', 'B2B software', 'cloud software',
    'subscription', 'API', 'platform', 'dashboard', 'analytics', 'CRM',
    'productivity', 'collaboration', 'workflow', 'automation', 'integration',
    'enterprise software', 'business software', 'tool', 'solution'
  ],
  [Industry.CONSUMER]: [
    'consumer app', 'mobile app', 'social', 'entertainment', 'gaming',
    'lifestyle', 'travel', 'food', 'fitness', 'dating', 'social media',
    'content', 'media', 'streaming', 'B2C', 'user engagement', 'viral'
  ],
  [Industry.ENTERPRISE]: [
    'enterprise', 'B2B', 'corporate', 'business', 'organization',
    'company', 'internal tool', 'employee', 'HR', 'operations',
    'management', 'governance', 'compliance', 'security', 'infrastructure'
  ],
  [Industry.GENERAL]: [
    'business', 'startup', 'idea', 'product', 'service', 'market',
    'customer', 'user', 'solution', 'problem', 'opportunity'
  ]
};

/**
 * Advanced industry classifier using OpenAI GPT-4
 */
export class IndustryClassifier {
  private openaiService: OpenAIService;

  constructor() {
    this.openaiService = new OpenAIService();
  }

  /**
   * Classify user input into industry categories
   */
  async classifyIndustry(input: string, context?: string): Promise<IndustryClassification> {
    try {
      // First, do a quick keyword-based pre-classification
      const keywordResults = this.keywordBasedClassification(input);
      
      // Then use GPT-4 for sophisticated analysis
      const gptResults = await this.gptBasedClassification(input, context, keywordResults);
      
      // Combine results for final classification
      return this.combineClassificationResults(keywordResults, gptResults, input);
      
    } catch (error) {
      console.error('Industry classification failed:', error);
      
      // Fallback to keyword-based classification
      const fallbackResult = this.keywordBasedClassification(input);
      return {
        industry: fallbackResult.topIndustry,
        confidence: Math.max(0.3, fallbackResult.confidence), // Lower confidence for fallback
        reasoning: `Fallback classification based on keyword analysis: ${fallbackResult.reasoning}`,
        keywords: fallbackResult.keywords,
        alternativeIndustries: fallbackResult.alternatives
      };
    }
  }

  /**
   * Keyword-based classification for quick initial analysis
   */
  private keywordBasedClassification(input: string) {
    const inputLower = input.toLowerCase();
    const industryScores: Record<Industry, number> = {
      [Industry.FINTECH]: 0,
      [Industry.HEALTHCARE]: 0,
      [Industry.ECOMMERCE]: 0,
      [Industry.SAAS]: 0,
      [Industry.CONSUMER]: 0,
      [Industry.ENTERPRISE]: 0,
      [Industry.GENERAL]: 0
    };
    
    const foundKeywords: Record<Industry, string[]> = {
      [Industry.FINTECH]: [],
      [Industry.HEALTHCARE]: [],
      [Industry.ECOMMERCE]: [],
      [Industry.SAAS]: [],
      [Industry.CONSUMER]: [],
      [Industry.ENTERPRISE]: [],
      [Industry.GENERAL]: []
    };

    // Score each industry based on keyword matches
    Object.entries(INDUSTRY_KEYWORDS).forEach(([industry, keywords]) => {
      keywords.forEach(keyword => {
        if (inputLower.includes(keyword.toLowerCase())) {
          industryScores[industry as Industry]++;
          foundKeywords[industry as Industry].push(keyword);
        }
      });
    });

    // Find top industry and alternatives
    const sortedIndustries = Object.entries(industryScores)
      .sort(([,a], [,b]) => b - a)
      .filter(([,score]) => score > 0);

    const topIndustry = sortedIndustries[0]?.[0] as Industry || Industry.GENERAL;
    const topScore = sortedIndustries[0]?.[1] || 0;
    
    // Calculate confidence based on keyword matches and uniqueness
    const totalMatches = Object.values(industryScores).reduce((sum, score) => sum + score, 0);
    const confidence = totalMatches > 0 ? Math.min(0.8, topScore / totalMatches) : 0.1;

    const alternatives = sortedIndustries.slice(1, 4).map(([industry, score]) => ({
      industry: industry as Industry,
      confidence: totalMatches > 0 ? score / totalMatches : 0,
      reasoning: `Keyword matches: ${foundKeywords[industry as Industry].join(', ')}`
    }));

    return {
      topIndustry,
      confidence,
      reasoning: `Keyword analysis found ${topScore} matches for ${topIndustry}: ${foundKeywords[topIndustry].join(', ')}`,
      keywords: foundKeywords[topIndustry],
      alternatives
    };
  }

  /**
   * GPT-4 based sophisticated industry classification
   */
  private async gptBasedClassification(
    input: string, 
    context?: string, 
    keywordHint?: { topIndustry: Industry; confidence: number }
  ) {
    const prompt = this.buildClassificationPrompt(input, context, keywordHint);
    
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
        temperature: 0.3, // Lower temperature for more consistent classification
        maxTokens: 1000
      }
    };

    const response = await this.openaiService.createCompletionWithFallback(request);
    
    return this.parseGPTResponse(response.choices[0].message.content || '');
  }

  /**
   * Build classification prompt for GPT-4
   */
  private buildClassificationPrompt(
    input: string, 
    context?: string, 
    keywordHint?: { topIndustry: Industry; confidence: number }
  ) {
    const industries = Object.values(Industry).join(', ');
    
    const system = `You are an expert industry classifier for a meta-agent system. Your task is to analyze user input describing a business idea and classify it into one of these industries: ${industries}.

CLASSIFICATION GUIDELINES:
- FINTECH: Financial services, payments, banking, investment, cryptocurrency, lending, insurance
- HEALTHCARE: Medical services, healthcare providers, pharmaceuticals, medical devices, health tech
- ECOMMERCE: Online retail, marketplaces, e-commerce platforms, product sales
- SAAS: Business software, cloud platforms, B2B tools, subscription services
- CONSUMER: Mobile apps, social platforms, entertainment, lifestyle, B2C products
- ENTERPRISE: Corporate tools, internal systems, business operations, B2B services
- GENERAL: Unclear or doesn't fit specific categories

RESPONSE FORMAT (JSON):
{
  "primary_industry": "industry_name",
  "confidence": 0.85,
  "reasoning": "Detailed explanation of classification",
  "sub_industry": "Optional specific sub-category",
  "key_indicators": ["keyword1", "keyword2"],
  "alternative_classifications": [
    {"industry": "alternative1", "confidence": 0.6, "reasoning": "Why this could also fit"}
  ]
}

CONFIDENCE SCORING:
- 0.9-1.0: Very clear industry indicators, unambiguous
- 0.7-0.89: Strong indicators but some ambiguity
- 0.5-0.69: Moderate confidence, could fit multiple industries
- 0.3-0.49: Weak signals, significant uncertainty
- 0.0-0.29: No clear industry indicators`;

    let user = `Classify this business idea into an industry:

INPUT: "${input}"`;

    if (context) {
      user += `\n\nADDITIONAL CONTEXT: "${context}"`;
    }

    if (keywordHint && keywordHint.confidence > 0.3) {
      user += `\n\nKEYWORD ANALYSIS SUGGESTS: ${keywordHint.topIndustry} (confidence: ${keywordHint.confidence.toFixed(2)})`;
    }

    user += '\n\nProvide your classification as JSON:';

    return { system, user };
  }

  /**
   * Parse GPT-4 response into structured classification
   */
  private parseGPTResponse(content: string): any {
    try {
      // Extract JSON from response (handle cases where GPT adds extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      if (!parsed.primary_industry || !parsed.confidence || !parsed.reasoning) {
        throw new Error('Missing required fields in GPT response');
      }

      return {
        industry: parsed.primary_industry,
        confidence: Math.max(0, Math.min(1, parsed.confidence)), // Clamp to 0-1
        reasoning: parsed.reasoning,
        subIndustry: parsed.sub_industry,
        keywords: parsed.key_indicators || [],
        alternatives: parsed.alternative_classifications || []
      };

    } catch (error) {
      console.error('Failed to parse GPT classification response:', error);
      throw new Error(`GPT response parsing failed: ${error}`);
    }
  }

  /**
   * Combine keyword and GPT results for final classification
   */
  private combineClassificationResults(
    keywordResults: any,
    gptResults: any,
    originalInput: string
  ): IndustryClassification {
    // Use GPT results as primary, but boost confidence if keyword analysis agrees
    let finalConfidence = gptResults.confidence;
    
    if (keywordResults.topIndustry === gptResults.industry && keywordResults.confidence > 0.3) {
      // Boost confidence when both methods agree
      finalConfidence = Math.min(1.0, gptResults.confidence + (keywordResults.confidence * 0.2));
    } else if (keywordResults.confidence > 0.5 && gptResults.confidence < 0.5) {
      // Trust keyword analysis more when GPT is uncertain but keywords are strong
      finalConfidence = Math.max(finalConfidence, keywordResults.confidence * 0.8);
    }

    // Combine keywords from both methods
    const allKeywords = [...new Set([...keywordResults.keywords, ...gptResults.keywords])];

    // Merge alternative classifications
    const alternatives = [
      ...gptResults.alternatives,
      ...keywordResults.alternatives
    ].filter((alt, index, arr) => 
      // Remove duplicates
      arr.findIndex(a => a.industry === alt.industry) === index
    ).slice(0, 3); // Keep top 3

    return {
      industry: gptResults.industry,
      confidence: finalConfidence,
      reasoning: `Combined analysis: ${gptResults.reasoning}. Keyword analysis: ${keywordResults.reasoning}`,
      keywords: allKeywords,
      subIndustry: gptResults.subIndustry,
      alternativeIndustries: alternatives
    };
  }

  /**
   * Batch classify multiple inputs (for training data collection)
   */
  async batchClassify(inputs: Array<{ text: string; context?: string }>): Promise<IndustryClassification[]> {
    const results: IndustryClassification[] = [];
    
    for (const input of inputs) {
      try {
        const classification = await this.classifyIndustry(input.text, input.context);
        results.push(classification);
        
        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Batch classification failed for input: ${input.text}`, error);
        // Continue with next input
      }
    }
    
    return results;
  }

  /**
   * Get industry statistics from classification history (for improvement)
   */
  getIndustryStats(classifications: IndustryClassification[]) {
    const stats = {
      totalClassifications: classifications.length,
      industryDistribution: {} as Record<Industry, number>,
      averageConfidence: 0,
      lowConfidenceCount: 0,
      highConfidenceCount: 0
    };

    classifications.forEach(classification => {
      stats.industryDistribution[classification.industry] = 
        (stats.industryDistribution[classification.industry] || 0) + 1;
      
      stats.averageConfidence += classification.confidence;
      
      if (classification.confidence < 0.5) {
        stats.lowConfidenceCount++;
      } else if (classification.confidence > 0.8) {
        stats.highConfidenceCount++;
      }
    });

    stats.averageConfidence /= classifications.length || 1;

    return stats;
  }
}

// Singleton instance for global use
export const industryClassifier = new IndustryClassifier(); 