import { OpenAIService, CompletionRequest } from '@/lib/openai/client';
import { openaiConfig } from '@/lib/config/environment';

/**
 * Role Detection System
 * Analyzes user input to determine role type (technical, business, hybrid)
 */

export enum UserRole {
  TECHNICAL = 'technical',
  BUSINESS = 'business', 
  HYBRID = 'hybrid',
  UNKNOWN = 'unknown'
}

export interface RoleClassification {
  role: UserRole;
  confidence: number;
  reasoning: string;
  indicators: {
    technical: string[];
    business: string[];
    hybrid: string[];
  };
  sophisticationLevel: 'low' | 'medium' | 'high';
  alternativeRoles: Array<{
    role: UserRole;
    confidence: number;
    reasoning: string;
  }>;
}

export interface RoleIndicators {
  technical: {
    keywords: string[];
    patterns: RegExp[];
    phrases: string[];
  };
  business: {
    keywords: string[];
    patterns: RegExp[];
    phrases: string[];
  };
  hybrid: {
    keywords: string[];
    patterns: RegExp[];
    phrases: string[];
  };
}

// Role-specific indicators for classification
const ROLE_INDICATORS: RoleIndicators = {
  technical: {
    keywords: [
      // Programming & Development
      'API', 'SDK', 'framework', 'library', 'database', 'server', 'cloud',
      'microservices', 'DevOps', 'CI/CD', 'containerization', 'Kubernetes',
      'React', 'Node.js', 'Python', 'JavaScript', 'TypeScript', 'SQL',
      'REST', 'GraphQL', 'authentication', 'authorization', 'encryption',
      
      // Technical Architecture
      'scalability', 'performance', 'latency', 'throughput', 'caching',
      'load balancing', 'sharding', 'replication', 'backup', 'monitoring',
      'logging', 'debugging', 'testing', 'unit tests', 'integration tests',
      
      // Infrastructure & Tools
      'AWS', 'Azure', 'GCP', 'Docker', 'Git', 'GitHub', 'GitLab',
      'Jenkins', 'Terraform', 'Ansible', 'Redis', 'PostgreSQL', 'MongoDB',
      'Elasticsearch', 'Kafka', 'RabbitMQ', 'nginx', 'Apache',
      
      // Security & Compliance
      'HTTPS', 'SSL/TLS', 'OAuth', 'JWT', 'CORS', 'XSS', 'CSRF',
      'penetration testing', 'vulnerability', 'security audit',
      'data encryption', 'key management', 'zero trust'
    ],
    patterns: [
      /\b\w+\.(js|ts|py|java|php|rb|go|rs)\b/i, // File extensions
      /\b(v\d+\.\d+(\.\d+)?)\b/i, // Version numbers
      /\b(HTTP|HTTPS|FTP|SSH|TCP|UDP|IP)\b/i, // Protocols
      /\b(GET|POST|PUT|DELETE|PATCH)\b/i, // HTTP methods
      /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/, // IP addresses
      /\b[a-zA-Z]+:[\/]{2}[a-zA-Z0-9\.\-]+/i, // URLs
    ],
    phrases: [
      'technical implementation', 'code review', 'pull request',
      'tech stack', 'system architecture', 'data model',
      'algorithm optimization', 'performance tuning', 'bug fixing',
      'technical debt', 'refactoring', 'deployment pipeline',
      'infrastructure as code', 'development environment'
    ]
  },
  business: {
    keywords: [
      // Business Strategy
      'revenue', 'profit', 'ROI', 'KPI', 'metrics', 'analytics',
      'market share', 'competitive advantage', 'value proposition',
      'business model', 'monetization', 'pricing strategy',
      'customer acquisition', 'retention', 'churn', 'LTV', 'CAC',
      
      // Operations & Management
      'stakeholders', 'executives', 'board', 'investors', 'funding',
      'Series A', 'Series B', 'venture capital', 'angel investors',
      'IPO', 'acquisition', 'merger', 'partnership', 'collaboration',
      'team management', 'hiring', 'organizational structure',
      
      // Marketing & Sales
      'go-to-market', 'marketing strategy', 'brand', 'positioning',
      'target audience', 'customer segments', 'personas', 'funnel',
      'conversion rate', 'lead generation', 'sales pipeline',
      'B2B', 'B2C', 'enterprise sales', 'SMB', 'customer success',
      
      // Finance & Legal
      'budget', 'forecast', 'P&L', 'cash flow', 'burn rate',
      'runway', 'valuation', 'equity', 'compliance', 'regulation',
      'contract', 'agreement', 'terms of service', 'privacy policy'
    ],
    patterns: [
      /\$[\d,]+(\.\d{2})?[KMB]?/i, // Currency amounts
      /\b\d+%\b/, // Percentages
      /\bQ[1-4]\s+\d{4}\b/i, // Quarters
      /\b(YoY|MoM|QoQ)\b/i, // Time comparisons
    ],
    phrases: [
      'business plan', 'market research', 'competitive analysis',
      'customer validation', 'product-market fit', 'user feedback',
      'business requirements', 'success metrics', 'growth strategy',
      'operational efficiency', 'cost optimization', 'resource allocation',
      'risk management', 'strategic planning', 'business development'
    ]
  },
  hybrid: {
    keywords: [
      // Product Management
      'product', 'feature', 'roadmap', 'backlog', 'sprint', 'agile',
      'scrum', 'user story', 'acceptance criteria', 'MVP', 'prototype',
      'user experience', 'UX', 'UI', 'design', 'wireframe', 'mockup',
      
      // Technical Business
      'API integration', 'data analytics', 'business intelligence',
      'automation', 'workflow', 'process optimization', 'digital transformation',
      'tech-enabled', 'data-driven', 'platform strategy',
      
      // Bridge Concepts
      'requirements', 'specifications', 'documentation', 'project management',
      'cross-functional', 'stakeholder alignment', 'technical debt',
      'feasibility', 'implementation timeline', 'resource planning'
    ],
    patterns: [
      /\b(PM|TPM|PMM)\b/i, // Product Manager acronyms
      /\b(A\/B|AB)\s+test/i, // A/B testing
    ],
    phrases: [
      'product requirements', 'technical feasibility', 'user research',
      'data analysis', 'performance metrics', 'technical discussion',
      'business logic', 'system requirements', 'product strategy',
      'technical specifications', 'implementation plan', 'project scope'
    ]
  }
};

/**
 * Advanced role detector using pattern matching and GPT-4
 */
export class RoleDetector {
  private openaiService: OpenAIService;

  constructor() {
    this.openaiService = new OpenAIService();
  }

  /**
   * Detect user role from input text
   */
  async detectRole(input: string, conversationHistory?: string[]): Promise<RoleClassification> {
    try {
      // Pattern-based analysis first
      const patternResults = this.patternBasedDetection(input);
      
      // GPT-4 based sophisticated analysis
      const gptResults = await this.gptBasedDetection(input, conversationHistory, patternResults);
      
      // Combine results for final classification
      return this.combineRoleResults(patternResults, gptResults, input);
      
    } catch (error) {
      console.error('Role detection failed:', error);
      
      // Fallback to pattern-based detection
      const fallbackResult = this.patternBasedDetection(input);
      return {
        role: fallbackResult.topRole,
        confidence: Math.max(0.3, fallbackResult.confidence),
        reasoning: `Fallback role detection: ${fallbackResult.reasoning}`,
        indicators: fallbackResult.indicators,
        sophisticationLevel: this.estimateSophisticationFromPatterns(fallbackResult.indicators),
        alternativeRoles: fallbackResult.alternatives
      };
    }
  }

  /**
   * Pattern-based role detection using keywords and regex
   */
  private patternBasedDetection(input: string) {
    const inputLower = input.toLowerCase();
    const roleScores = {
      [UserRole.TECHNICAL]: 0,
      [UserRole.BUSINESS]: 0,
      [UserRole.HYBRID]: 0
    };
    
    const foundIndicators = {
      technical: [] as string[],
      business: [] as string[],
      hybrid: [] as string[]
    };

    // Check keywords for each role
    Object.entries(ROLE_INDICATORS).forEach(([role, indicators]) => {
      // Keyword matching
      indicators.keywords.forEach(keyword => {
        if (inputLower.includes(keyword.toLowerCase())) {
          roleScores[role as keyof typeof roleScores]++;
          foundIndicators[role as keyof typeof foundIndicators].push(keyword);
        }
      });

      // Pattern matching
      indicators.patterns.forEach(pattern => {
        const matches = input.match(pattern);
        if (matches) {
          roleScores[role as keyof typeof roleScores] += matches.length;
          foundIndicators[role as keyof typeof foundIndicators].push(`Pattern: ${pattern.source}`);
        }
      });

      // Phrase matching
      indicators.phrases.forEach(phrase => {
        if (inputLower.includes(phrase.toLowerCase())) {
          roleScores[role as keyof typeof roleScores] += 2; // Phrases are more indicative
          foundIndicators[role as keyof typeof foundIndicators].push(phrase);
        }
      });
    });

    // Determine top role
    const sortedRoles = Object.entries(roleScores)
      .sort(([,a], [,b]) => b - a)
      .filter(([,score]) => score > 0);

    const topRole = sortedRoles[0]?.[0] as UserRole || UserRole.UNKNOWN;
    const topScore = sortedRoles[0]?.[1] || 0;
    
    // Calculate confidence
    const totalScore = Object.values(roleScores).reduce((sum, score) => sum + score, 0);
    let confidence = 0.1; // Base confidence for unknown
    
    if (totalScore > 0) {
      confidence = topScore / totalScore;
      
      // Boost confidence for clear technical indicators
      if (topRole === UserRole.TECHNICAL && foundIndicators.technical.length > 3) {
        confidence = Math.min(0.9, confidence + 0.2);
      }
      
      // Boost confidence for clear business indicators
      if (topRole === UserRole.BUSINESS && foundIndicators.business.length > 2) {
        confidence = Math.min(0.9, confidence + 0.15);
      }
      
      // Hybrid needs evidence from multiple roles
      if (topRole === UserRole.HYBRID) {
        const hasMultipleRoleEvidence = (foundIndicators.technical.length > 0 && foundIndicators.business.length > 0);
        if (!hasMultipleRoleEvidence) {
          confidence *= 0.7; // Reduce confidence for weak hybrid signals
        }
      }
    }

    const alternatives = sortedRoles.slice(1).map(([role, score]) => ({
      role: role as UserRole,
      confidence: totalScore > 0 ? score / totalScore : 0,
      reasoning: `Score: ${score}, indicators: ${(foundIndicators[role as keyof typeof foundIndicators] || []).slice(0, 3).join(', ')}`
    }));

    return {
      topRole,
      confidence: Math.max(0.1, Math.min(0.9, confidence)),
      reasoning: `Pattern analysis: ${topScore} points for ${topRole}. Key indicators: ${(foundIndicators[topRole as keyof typeof foundIndicators] || []).slice(0, 5).join(', ')}`,
      indicators: foundIndicators,
      alternatives
    };
  }

  /**
   * GPT-4 based sophisticated role detection
   */
  private async gptBasedDetection(
    input: string,
    conversationHistory?: string[],
    patternHint?: { topRole: UserRole; confidence: number }
  ) {
    const prompt = this.buildRoleDetectionPrompt(input, conversationHistory, patternHint);
    
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
        temperature: 0.2, // Low temperature for consistent role detection
        maxTokens: 800
      }
    };

    const response = await this.openaiService.createCompletionWithFallback(request);
    
    return this.parseRoleResponse(response.choices[0].message.content || '');
  }

  /**
   * Build role detection prompt for GPT-4
   */
  private buildRoleDetectionPrompt(
    input: string,
    conversationHistory?: string[],
    patternHint?: { topRole: UserRole; confidence: number }
  ) {
    const system = `You are an expert user role classifier for a meta-agent system. Analyze the user's language, terminology, and focus to classify them into one of these roles:

ROLE DEFINITIONS:
- TECHNICAL: Software developers, engineers, architects, DevOps, technical leads
  * Uses technical terminology, discusses implementation details, system architecture
  * Focus on "how" things work, technical feasibility, performance, security
  * Examples: "API integration", "microservices", "database optimization"

- BUSINESS: Executives, managers, marketers, sales, business analysts
  * Uses business terminology, discusses strategy, metrics, market dynamics
  * Focus on "why" and "what" value, ROI, customers, market fit
  * Examples: "revenue model", "customer acquisition", "market opportunity"

- HYBRID: Product managers, technical product owners, tech-savvy business leaders
  * Uses both technical and business terminology
  * Bridges technical implementation with business value
  * Examples: "technical feasibility", "product requirements", "user analytics"

- UNKNOWN: Insufficient information or mixed signals

ANALYSIS FACTORS:
1. Vocabulary and terminology used
2. Problem framing (technical vs business perspective)
3. Solution approach (implementation vs strategy focus)
4. Metrics mentioned (technical vs business KPIs)
5. Stakeholder references (developers vs customers vs both)

RESPONSE FORMAT (JSON):
{
  "role": "technical|business|hybrid|unknown",
  "confidence": 0.85,
  "reasoning": "Detailed explanation of classification",
  "sophistication_level": "low|medium|high",
  "key_indicators": ["indicator1", "indicator2"],
  "role_signals": {
    "technical": ["signal1", "signal2"],
    "business": ["signal1", "signal2"],
    "hybrid": ["signal1", "signal2"]
  },
  "alternative_roles": [
    {"role": "alternative", "confidence": 0.3, "reasoning": "Why this could also fit"}
  ]
}

CONFIDENCE GUIDELINES:
- 0.9+: Very clear role indicators, unambiguous language
- 0.7-0.89: Strong indicators with minor ambiguity  
- 0.5-0.69: Moderate confidence, some mixed signals
- 0.3-0.49: Weak signals, significant uncertainty
- 0.0-0.29: No clear role indicators`;

    let user = `Analyze this user input to determine their role:

INPUT: "${input}"`;

    if (conversationHistory && conversationHistory.length > 0) {
      user += `\n\nCONVERSATION HISTORY:\n${conversationHistory.slice(-3).map((msg, i) => `${i + 1}. ${msg}`).join('\n')}`;
    }

    if (patternHint && patternHint.confidence > 0.3) {
      user += `\n\nPATTERN ANALYSIS SUGGESTS: ${patternHint.topRole} (confidence: ${patternHint.confidence.toFixed(2)})`;
    }

    user += '\n\nProvide your role classification as JSON:';

    return { system, user };
  }

  /**
   * Parse GPT-4 role detection response
   */
  private parseRoleResponse(content: string): any {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      if (!parsed.role || !parsed.confidence || !parsed.reasoning) {
        throw new Error('Missing required fields in role response');
      }

      // Validate role value
      if (!Object.values(UserRole).includes(parsed.role)) {
        throw new Error(`Invalid role: ${parsed.role}`);
      }

      return {
        role: parsed.role,
        confidence: Math.max(0, Math.min(1, parsed.confidence)),
        reasoning: parsed.reasoning,
        sophisticationLevel: parsed.sophistication_level || 'medium',
        indicators: parsed.role_signals || { technical: [], business: [], hybrid: [] },
        keywords: parsed.key_indicators || [],
        alternatives: parsed.alternative_roles || []
      };

    } catch (error) {
      console.error('Failed to parse role detection response:', error);
      throw new Error(`Role response parsing failed: ${error}`);
    }
  }

  /**
   * Combine pattern and GPT results for final classification
   */
  private combineRoleResults(patternResults: any, gptResults: any, originalInput: string): RoleClassification {
    let finalConfidence = gptResults.confidence;
    let finalRole = gptResults.role;

    // Boost confidence when both methods agree
    if (patternResults.topRole === gptResults.role && patternResults.confidence > 0.4) {
      finalConfidence = Math.min(1.0, gptResults.confidence + (patternResults.confidence * 0.2));
    }

    // Handle disagreement by favoring higher confidence
    if (patternResults.topRole !== gptResults.role) {
      if (patternResults.confidence > 0.7 && gptResults.confidence < 0.6) {
        finalRole = patternResults.topRole;
        finalConfidence = patternResults.confidence * 0.9; // Slight penalty for disagreement
      }
    }

    // Merge indicators
    const combinedIndicators = {
      technical: [...new Set([...patternResults.indicators.technical, ...gptResults.indicators.technical])],
      business: [...new Set([...patternResults.indicators.business, ...gptResults.indicators.business])],
      hybrid: [...new Set([...patternResults.indicators.hybrid, ...gptResults.indicators.hybrid])]
    };

    // Merge alternatives
    const alternatives = [
      ...gptResults.alternatives,
      ...patternResults.alternatives
    ].filter((alt, index, arr) => 
      arr.findIndex(a => a.role === alt.role) === index
    ).slice(0, 2);

    return {
      role: finalRole,
      confidence: finalConfidence,
      reasoning: `Combined analysis: ${gptResults.reasoning}. Pattern indicators: ${Object.values(patternResults.indicators).flat().slice(0, 3).join(', ')}`,
      indicators: combinedIndicators,
      sophisticationLevel: gptResults.sophisticationLevel || this.estimateSophisticationFromPatterns(combinedIndicators),
      alternativeRoles: alternatives
    };
  }

  /**
   * Estimate sophistication level from pattern indicators
   */
  private estimateSophisticationFromPatterns(indicators: { technical: string[]; business: string[]; hybrid: string[] }): 'low' | 'medium' | 'high' {
    const totalIndicators = Object.values(indicators).flat().length;
    const advancedTerms = [
      'microservices', 'kubernetes', 'machine learning', 'blockchain',
      'enterprise architecture', 'digital transformation', 'API strategy',
      'competitive moat', 'product-market fit', 'venture capital'
    ];
    
    const advancedCount = Object.values(indicators).flat()
      .filter(indicator => advancedTerms.some(term => 
        indicator.toLowerCase().includes(term.toLowerCase())
      )).length;

    if (totalIndicators >= 8 && advancedCount >= 2) return 'high';
    if (totalIndicators >= 4 || advancedCount >= 1) return 'medium';
    return 'low';
  }

  /**
   * Batch role detection for multiple inputs
   */
  async batchDetectRoles(
    inputs: Array<{ text: string; conversationHistory?: string[] }>
  ): Promise<RoleClassification[]> {
    const results: RoleClassification[] = [];
    
    for (const input of inputs) {
      try {
        const classification = await this.detectRole(input.text, input.conversationHistory);
        results.push(classification);
        
        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Batch role detection failed for input: ${input.text}`, error);
      }
    }
    
    return results;
  }

  /**
   * Get role detection statistics
   */
  getRoleStats(classifications: RoleClassification[]) {
    const stats = {
      totalClassifications: classifications.length,
      roleDistribution: {} as Record<UserRole, number>,
      averageConfidence: 0,
      sophisticationDistribution: { low: 0, medium: 0, high: 0 },
      lowConfidenceCount: 0
    };

    classifications.forEach(classification => {
      stats.roleDistribution[classification.role] = 
        (stats.roleDistribution[classification.role] || 0) + 1;
      
      stats.averageConfidence += classification.confidence;
      stats.sophisticationDistribution[classification.sophisticationLevel]++;
      
      if (classification.confidence < 0.5) {
        stats.lowConfidenceCount++;
      }
    });

    stats.averageConfidence /= classifications.length || 1;

    return stats;
  }
}

// Singleton instance for global use
export const roleDetector = new RoleDetector(); 