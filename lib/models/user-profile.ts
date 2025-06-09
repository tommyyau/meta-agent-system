import { UserProfile, ConversationMessage, UserRole, SophisticationLevel } from '@/lib/types/agent-types'
import { nanoid } from 'nanoid'

/**
 * User Profile Data Model
 * 
 * Comprehensive data model for user profiles with validation,
 * serialization, and profile management capabilities
 */
export class UserProfileModel implements UserProfile {
  id: string
  sessionId?: string
  
  // Industry Classification
  industry: string
  industryConfidence: number
  subIndustry?: string
  
  // Role Classification
  role: UserRole
  roleConfidence: number
  roleDetails?: string
  
  // Sophistication Level
  sophisticationLevel: SophisticationLevel
  sophisticationScore: number
  
  // Context and History
  conversationHistory: ConversationMessage[]
  detectedKeywords: string[]
  terminology: string[]
  
  // Preferences
  preferredCommunicationStyle: 'formal' | 'casual' | 'technical'
  assumptionTolerance: 'low' | 'medium' | 'high'
  
  // Metadata
  created: Date
  lastUpdated: Date
  analysisVersion: string

  constructor(data: Partial<UserProfile> = {}) {
    this.id = data.id || nanoid()
    this.sessionId = data.sessionId
    
    // Industry defaults
    this.industry = data.industry || 'unknown'
    this.industryConfidence = data.industryConfidence || 0
    this.subIndustry = data.subIndustry
    
    // Role defaults
    this.role = data.role || 'unknown'
    this.roleConfidence = data.roleConfidence || 0
    this.roleDetails = data.roleDetails
    
    // Sophistication defaults
    this.sophisticationLevel = data.sophisticationLevel || 'medium'
    this.sophisticationScore = data.sophisticationScore || 0.5
    
    // Context defaults
    this.conversationHistory = data.conversationHistory || []
    this.detectedKeywords = data.detectedKeywords || []
    this.terminology = data.terminology || []
    
    // Preference defaults
    this.preferredCommunicationStyle = data.preferredCommunicationStyle || 'casual'
    this.assumptionTolerance = data.assumptionTolerance || 'medium'
    
    // Metadata
    this.created = data.created || new Date()
    this.lastUpdated = data.lastUpdated || new Date()
    this.analysisVersion = data.analysisVersion || '1.0.0'
  }

  /**
   * Update industry classification
   */
  updateIndustry(industry: string, confidence: number, subIndustry?: string): void {
    this.industry = industry
    this.industryConfidence = Math.max(0, Math.min(1, confidence))
    this.subIndustry = subIndustry
    this.touch()
  }

  /**
   * Update role classification
   */
  updateRole(role: UserRole, confidence: number, details?: string): void {
    this.role = role
    this.roleConfidence = Math.max(0, Math.min(1, confidence))
    this.roleDetails = details
    this.touch()
  }

  /**
   * Update sophistication level
   */
  updateSophistication(level: SophisticationLevel, score: number): void {
    this.sophisticationLevel = level
    this.sophisticationScore = Math.max(0, Math.min(1, score))
    this.touch()
  }

  /**
   * Add conversation message to history
   */
  addConversationMessage(message: Omit<ConversationMessage, 'id'>): void {
    const conversationMessage: ConversationMessage = {
      id: nanoid(),
      ...message
    }
    
    this.conversationHistory.push(conversationMessage)
    
    // Keep only last 50 messages to prevent memory issues
    if (this.conversationHistory.length > 50) {
      this.conversationHistory = this.conversationHistory.slice(-50)
    }
    
    this.touch()
  }

  /**
   * Add detected keywords
   */
  addKeywords(keywords: string[]): void {
    const newKeywords = keywords.filter(keyword => 
      !this.detectedKeywords.includes(keyword.toLowerCase())
    )
    
    this.detectedKeywords.push(...newKeywords.map(k => k.toLowerCase()))
    this.touch()
  }

  /**
   * Add terminology
   */
  addTerminology(terms: string[]): void {
    const newTerms = terms.filter(term => 
      !this.terminology.includes(term.toLowerCase())
    )
    
    this.terminology.push(...newTerms.map(t => t.toLowerCase()))
    this.touch()
  }

  /**
   * Update communication preferences
   */
  updatePreferences(
    style?: 'formal' | 'casual' | 'technical',
    assumptionTolerance?: 'low' | 'medium' | 'high'
  ): void {
    if (style) {
      this.preferredCommunicationStyle = style
    }
    if (assumptionTolerance) {
      this.assumptionTolerance = assumptionTolerance
    }
    this.touch()
  }

  /**
   * Get profile completeness score (0-1)
   */
  getCompletenessScore(): number {
    let score = 0
    let maxScore = 0

    // Industry classification (20%)
    maxScore += 0.2
    if (this.industry !== 'unknown') {
      score += 0.1 + (this.industryConfidence * 0.1)
    }

    // Role classification (20%)
    maxScore += 0.2
    if (this.role !== 'unknown') {
      score += 0.1 + (this.roleConfidence * 0.1)
    }

    // Sophistication level (15%)
    maxScore += 0.15
    if (this.sophisticationScore > 0) {
      score += 0.15
    }

    // Conversation history (15%)
    maxScore += 0.15
    const historyScore = Math.min(this.conversationHistory.length / 10, 1)
    score += historyScore * 0.15

    // Keywords and terminology (15%)
    maxScore += 0.15
    const keywordScore = Math.min((this.detectedKeywords.length + this.terminology.length) / 20, 1)
    score += keywordScore * 0.15

    // Preferences (15%)
    maxScore += 0.15
    score += 0.15 // Always complete since we have defaults

    return Math.min(score / maxScore, 1)
  }

  /**
   * Get profile confidence score (0-1)
   */
  getConfidenceScore(): number {
    const weights = {
      industry: 0.3,
      role: 0.3,
      sophistication: 0.2,
      completeness: 0.2
    }

    const confidence = 
      (this.industryConfidence * weights.industry) +
      (this.roleConfidence * weights.role) +
      (this.sophisticationScore * weights.sophistication) +
      (this.getCompletenessScore() * weights.completeness)

    return Math.min(confidence, 1)
  }

  /**
   * Check if profile meets minimum requirements
   */
  isValid(): boolean {
    return (
      this.industry !== 'unknown' &&
      this.role !== 'unknown' &&
      this.industryConfidence >= 0.3 &&
      this.roleConfidence >= 0.3 &&
      this.conversationHistory.length > 0
    )
  }

  /**
   * Get profile summary for agent selection
   */
  getSelectionSummary(): {
    industry: string
    role: UserRole
    sophistication: SophisticationLevel
    keywords: string[]
    confidence: number
    preferences: {
      style: string
      assumptionTolerance: string
    }
  } {
    return {
      industry: this.industry,
      role: this.role,
      sophistication: this.sophisticationLevel,
      keywords: [...this.detectedKeywords, ...this.terminology].slice(0, 20),
      confidence: this.getConfidenceScore(),
      preferences: {
        style: this.preferredCommunicationStyle,
        assumptionTolerance: this.assumptionTolerance
      }
    }
  }

  /**
   * Merge another profile into this one
   */
  merge(otherProfile: Partial<UserProfile>): void {
    // Update with higher confidence values
    if (otherProfile.industryConfidence && otherProfile.industryConfidence > this.industryConfidence) {
      this.updateIndustry(
        otherProfile.industry || this.industry,
        otherProfile.industryConfidence,
        otherProfile.subIndustry || this.subIndustry
      )
    }

    if (otherProfile.roleConfidence && otherProfile.roleConfidence > this.roleConfidence) {
      this.updateRole(
        otherProfile.role || this.role,
        otherProfile.roleConfidence,
        otherProfile.roleDetails || this.roleDetails
      )
    }

    // Merge conversation history
    if (otherProfile.conversationHistory) {
      const newMessages = otherProfile.conversationHistory.filter(msg =>
        !this.conversationHistory.some(existing => existing.id === msg.id)
      )
      this.conversationHistory.push(...newMessages)
    }

    // Merge keywords and terminology
    if (otherProfile.detectedKeywords) {
      this.addKeywords(otherProfile.detectedKeywords)
    }
    if (otherProfile.terminology) {
      this.addTerminology(otherProfile.terminology)
    }

    this.touch()
  }

  /**
   * Convert to plain object for serialization
   */
  toJSON(): UserProfile {
    return {
      id: this.id,
      sessionId: this.sessionId,
      industry: this.industry,
      industryConfidence: this.industryConfidence,
      subIndustry: this.subIndustry,
      role: this.role,
      roleConfidence: this.roleConfidence,
      roleDetails: this.roleDetails,
      sophisticationLevel: this.sophisticationLevel,
      sophisticationScore: this.sophisticationScore,
      conversationHistory: this.conversationHistory,
      detectedKeywords: this.detectedKeywords,
      terminology: this.terminology,
      preferredCommunicationStyle: this.preferredCommunicationStyle,
      assumptionTolerance: this.assumptionTolerance,
      created: this.created,
      lastUpdated: this.lastUpdated,
      analysisVersion: this.analysisVersion
    }
  }

  /**
   * Create from plain object
   */
  static fromJSON(data: UserProfile): UserProfileModel {
    const profile = new UserProfileModel(data)
    
    // Ensure dates are properly parsed
    profile.created = new Date(data.created)
    profile.lastUpdated = new Date(data.lastUpdated)
    
    // Ensure conversation messages have proper date objects
    profile.conversationHistory = data.conversationHistory.map(msg => ({
      ...msg,
      timestamp: new Date(msg.timestamp)
    }))

    return profile
  }

  /**
   * Create empty profile with session ID
   */
  static create(sessionId?: string): UserProfileModel {
    return new UserProfileModel({ sessionId })
  }

  /**
   * Update lastUpdated timestamp
   */
  private touch(): void {
    this.lastUpdated = new Date()
  }

  /**
   * Clone the profile
   */
  clone(): UserProfileModel {
    return UserProfileModel.fromJSON(this.toJSON())
  }

  /**
   * Get age of profile in milliseconds
   */
  getAge(): number {
    return Date.now() - this.created.getTime()
  }

  /**
   * Get time since last update in milliseconds
   */
  getTimeSinceUpdate(): number {
    return Date.now() - this.lastUpdated.getTime()
  }

  /**
   * Check if profile is stale (not updated in specified time)
   */
  isStale(maxAge: number = 30 * 60 * 1000): boolean { // 30 minutes default
    return this.getTimeSinceUpdate() > maxAge
  }
} 