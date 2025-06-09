import { UserProfile, ProfileAnalysisRequest, SessionContext } from '@/lib/types/agent-types'
import { UserProfileModel } from '@/lib/models/user-profile'
import { openaiService } from '@/lib/openai/client'

/**
 * Profile Analyzer Service
 * 
 * Analyzes user input to generate comprehensive user profiles
 * using AI-powered text analysis and domain classification
 */
export class ProfileAnalyzer {
  
  /**
   * Analyze user input to create or update a user profile
   */
  async analyzeUserInput(request: ProfileAnalysisRequest): Promise<UserProfile> {
    const { input, context, sessionId } = request

    try {
      // Create initial profile or use existing context
      let profile = context?.profile ? 
        UserProfileModel.fromJSON(context.profile) : 
        UserProfileModel.create(sessionId)

      // Add the input as a conversation message
      profile.addConversationMessage({
        content: input,
        timestamp: new Date(),
        type: 'user'
      })

      // Analyze industry classification
      const industryAnalysis = await this.analyzeIndustry(input, context)
      if (industryAnalysis.confidence > profile.industryConfidence) {
        profile.updateIndustry(
          industryAnalysis.industry,
          industryAnalysis.confidence,
          industryAnalysis.subIndustry
        )
      }

      // Analyze role classification
      const roleAnalysis = await this.analyzeRole(input, context)
      if (roleAnalysis.confidence > profile.roleConfidence) {
        profile.updateRole(
          roleAnalysis.role,
          roleAnalysis.confidence,
          roleAnalysis.details
        )
      }

      // Analyze sophistication level
      const sophisticationAnalysis = await this.analyzeSophistication(input, context)
      profile.updateSophistication(
        sophisticationAnalysis.level,
        sophisticationAnalysis.score
      )

      // Extract keywords and terminology
      const keywords = await this.extractKeywords(input)
      profile.addKeywords(keywords)

      const terminology = await this.extractTerminology(input)
      profile.addTerminology(terminology)

      // Update communication preferences
      const preferences = await this.analyzePreferences(input, context)
      profile.updatePreferences(preferences.style, preferences.assumptionTolerance)

      return profile.toJSON()
    } catch (error) {
      console.error('Error in profile analysis:', error)
      throw new Error(`Profile analysis failed: ${(error as Error).message}`)
    }
  }

  /**
   * Analyze industry classification from user input
   */
  private async analyzeIndustry(input: string, context?: SessionContext): Promise<{
    industry: string
    confidence: number
    subIndustry?: string
  }> {
    try {
      const prompt = `
Analyze the following user input and determine their industry. Consider:
- Industry-specific terminology and jargon
- Business context and use cases mentioned
- Technical requirements or compliance needs
- Workflow patterns described

User input: "${input}"
${context ? `Previous context: ${JSON.stringify(context, null, 2)}` : ''}

Respond with JSON only:
{
  "industry": "fintech|healthcare|ecommerce|saas|consumer|enterprise|general",
  "confidence": 0.0-1.0,
  "reasoning": "explanation",
  "subIndustry": "specific sub-category if applicable"
}
`

      const response = await openaiService.createCompletion({
        messages: [{ role: 'user', content: prompt }],
        options: {
          model: 'gpt-3.5-turbo', // Use cheaper model for classification
          maxTokens: 200,
          temperature: 0.1
        }
      })

      const content = response.choices[0]?.message?.content?.trim()
      if (!content) {
        throw new Error('No response from OpenAI')
      }

      const analysis = JSON.parse(content)
      return {
        industry: analysis.industry || 'general',
        confidence: Math.max(0, Math.min(1, analysis.confidence || 0.5)),
        subIndustry: analysis.subIndustry
      }
    } catch (error) {
      console.warn('Industry analysis failed, using defaults:', error)
      return { industry: 'general', confidence: 0.3 }
    }
  }

  /**
   * Analyze user role from input
   */
  private async analyzeRole(input: string, context?: SessionContext): Promise<{
    role: 'technical' | 'business' | 'hybrid' | 'unknown'
    confidence: number
    details?: string
  }> {
    try {
      const prompt = `
Analyze the user input to determine their professional role:
- Technical: Engineers, developers, CTOs, technical architects
- Business: Product managers, business analysts, executives, marketing
- Hybrid: Technical managers, solution architects, technical product managers
- Unknown: Cannot determine from available information

User input: "${input}"
${context ? `Previous context: ${JSON.stringify(context, null, 2)}` : ''}

Respond with JSON only:
{
  "role": "technical|business|hybrid|unknown",
  "confidence": 0.0-1.0,
  "reasoning": "explanation",
  "details": "specific role title or description"
}
`

      const response = await openaiService.createCompletion({
        messages: [{ role: 'user', content: prompt }],
        options: {
          model: 'gpt-3.5-turbo',
          maxTokens: 150,
          temperature: 0.1
        }
      })

      const content = response.choices[0]?.message?.content?.trim()
      if (!content) {
        throw new Error('No response from OpenAI')
      }

      const analysis = JSON.parse(content)
      return {
        role: analysis.role || 'unknown',
        confidence: Math.max(0, Math.min(1, analysis.confidence || 0.5)),
        details: analysis.details
      }
    } catch (error) {
      console.warn('Role analysis failed, using defaults:', error)
      return { role: 'unknown', confidence: 0.3 }
    }
  }

  /**
   * Analyze sophistication level
   */
  private async analyzeSophistication(input: string, context?: SessionContext): Promise<{
    level: 'low' | 'medium' | 'high'
    score: number
  }> {
    try {
      // Analyze technical terminology, complexity of language, etc.
      const technicalKeywords = [
        'api', 'database', 'microservices', 'architecture', 'scalability',
        'authentication', 'authorization', 'middleware', 'infrastructure',
        'devops', 'ci/cd', 'kubernetes', 'docker', 'aws', 'gcp', 'azure'
      ]

      const businessKeywords = [
        'roi', 'kpi', 'metrics', 'analytics', 'conversion', 'funnel',
        'stakeholders', 'requirements', 'user stories', 'personas',
        'market research', 'competitive analysis', 'go-to-market'
      ]

      const inputLower = input.toLowerCase()
      const technicalCount = technicalKeywords.filter(word => inputLower.includes(word)).length
      const businessCount = businessKeywords.filter(word => inputLower.includes(word)).length
      
      // Calculate sophistication score based on terminology usage and input complexity
      const wordCount = input.split(' ').length
      const avgWordLength = input.replace(/\s/g, '').length / wordCount
      const terminologyRatio = (technicalCount + businessCount) / wordCount
      
      let score = 0.5 // Base score
      
      // Adjust based on terminology usage
      score += terminologyRatio * 0.3
      
      // Adjust based on language complexity
      if (avgWordLength > 6) score += 0.1
      if (wordCount > 50) score += 0.1
      
      // Clamp score between 0 and 1
      score = Math.max(0, Math.min(1, score))
      
      let level: 'low' | 'medium' | 'high'
      if (score >= 0.7) level = 'high'
      else if (score >= 0.4) level = 'medium'
      else level = 'low'

      return { level, score }
    } catch (error) {
      console.warn('Sophistication analysis failed, using defaults:', error)
      return { level: 'medium', score: 0.5 }
    }
  }

  /**
   * Extract keywords from user input
   */
  private async extractKeywords(input: string): Promise<string[]> {
    try {
      // Simple keyword extraction - can be enhanced with NLP libraries
      const words = input
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 3)
        .filter(word => !['this', 'that', 'with', 'have', 'will', 'from', 'they', 'been', 'were', 'said', 'each', 'which', 'their', 'time', 'would', 'about', 'there', 'could', 'other', 'more', 'very', 'what', 'know', 'just', 'into', 'over', 'think', 'also', 'your', 'work', 'life', 'only', 'can', 'still', 'should', 'after', 'being', 'now', 'made', 'before', 'here', 'through', 'when', 'where', 'much', 'some', 'these', 'many', 'then', 'them', 'well', 'were'].includes(word))

      // Get unique words and limit to top 10
      return Array.from(new Set(words)).slice(0, 10)
    } catch (error) {
      console.warn('Keyword extraction failed:', error)
      return []
    }
  }

  /**
   * Extract domain-specific terminology
   */
  private async extractTerminology(input: string): Promise<string[]> {
    try {
      const domainTerms = [
        // Technical terms
        'api', 'rest', 'graphql', 'microservices', 'database', 'sql', 'nosql',
        'authentication', 'authorization', 'oauth', 'jwt', 'encryption',
        'kubernetes', 'docker', 'aws', 'azure', 'gcp', 'serverless',
        
        // Business terms
        'revenue', 'conversion', 'funnel', 'analytics', 'metrics', 'kpi',
        'stakeholder', 'requirements', 'workflow', 'process', 'automation',
        
        // Industry-specific terms
        'compliance', 'gdpr', 'hipaa', 'pci', 'soc2', 'audit',
        'fintech', 'healthcare', 'ecommerce', 'marketplace', 'saas'
      ]

      const inputLower = input.toLowerCase()
      return domainTerms.filter(term => inputLower.includes(term))
    } catch (error) {
      console.warn('Terminology extraction failed:', error)
      return []
    }
  }

  /**
   * Analyze communication preferences
   */
  private async analyzePreferences(input: string, context?: SessionContext): Promise<{
    style: 'formal' | 'casual' | 'technical'
    assumptionTolerance: 'low' | 'medium' | 'high'
  }> {
    try {
      // Analyze communication style based on language patterns
      const formalIndicators = ['please', 'kindly', 'would like', 'require', 'specifications']
      const casualIndicators = ['want', 'need', 'get', 'make', 'simple', 'easy']
      const technicalIndicators = ['implement', 'configure', 'integrate', 'architecture', 'system']

      const inputLower = input.toLowerCase()
      
      const formalScore = formalIndicators.filter(word => inputLower.includes(word)).length
      const casualScore = casualIndicators.filter(word => inputLower.includes(word)).length
      const technicalScore = technicalIndicators.filter(word => inputLower.includes(word)).length

      let style: 'formal' | 'casual' | 'technical'
      if (technicalScore > Math.max(formalScore, casualScore)) {
        style = 'technical'
      } else if (formalScore > casualScore) {
        style = 'formal'
      } else {
        style = 'casual'
      }

      // Determine assumption tolerance based on input detail level
      const wordCount = input.split(' ').length
      let assumptionTolerance: 'low' | 'medium' | 'high'
      
      if (wordCount > 100) assumptionTolerance = 'low' // Detailed input suggests low tolerance
      else if (wordCount > 30) assumptionTolerance = 'medium'
      else assumptionTolerance = 'high' // Brief input suggests high tolerance

      return { style, assumptionTolerance }
    } catch (error) {
      console.warn('Preference analysis failed, using defaults:', error)
      return { style: 'casual', assumptionTolerance: 'medium' }
    }
  }

  /**
   * Health check for the service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const testResult = await openaiService.testConnection()
      return testResult.success
    } catch {
      return false
    }
  }
}

// Export singleton instance
export const profileAnalyzer = new ProfileAnalyzer() 