/**
 * Conversation State Management
 * Tracks user progress through the 4-stage conversation flow:
 * Idea Clarity → User Workflow → Technical Specs → Wireframes
 */

export enum ConversationStage {
  IDEA_CLARITY = 'idea_clarity',
  USER_WORKFLOW = 'user_workflow', 
  TECHNICAL_SPECS = 'technical_specs',
  WIREFRAMES = 'wireframes',
  COMPLETED = 'completed'
}

export enum StageStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  SKIPPED = 'skipped'
}

export interface QuestionResponse {
  questionId: string;
  question: string;
  answer: string;
  timestamp: Date;
  confidence: number;
  isSkipped: boolean;
}

export interface StageProgress {
  stage: ConversationStage;
  status: StageStatus;
  startTime?: Date;
  completionTime?: Date;
  totalQuestions: number;
  answeredQuestions: number;
  skippedQuestions: number;
  responses: QuestionResponse[];
}

export interface ConversationState {
  sessionId: string;
  userId: string;
  currentStage: ConversationStage;
  overallProgress: number; // 0-100 percentage
  stageProgresses: Map<ConversationStage, StageProgress>;
  escapeTriggered: boolean;
  escapeStage?: ConversationStage;
  escapeTimestamp?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationMetrics {
  totalDuration: number; // in seconds
  averageResponseTime: number;
  completionRate: number;
  escapeRate: number;
  stageCompletionRates: Map<ConversationStage, number>;
}

/**
 * Conversation state management interface
 */
export interface IConversationStateManager {
  // State tracking
  getCurrentState(sessionId: string): Promise<ConversationState | null>;
  updateCurrentStage(sessionId: string, stage: ConversationStage): Promise<void>;
  recordQuestionResponse(sessionId: string, response: QuestionResponse): Promise<void>;
  markStageComplete(sessionId: string, stage: ConversationStage): Promise<void>;
  
  // Progress calculation
  calculateOverallProgress(sessionId: string): Promise<number>;
  getStageProgress(sessionId: string, stage: ConversationStage): Promise<StageProgress | null>;
  
  // Escape hatch tracking
  triggerEscape(sessionId: string, stage: ConversationStage): Promise<void>;
  isEscapeTriggered(sessionId: string): Promise<boolean>;
  
  // Analytics
  getConversationMetrics(sessionId: string): Promise<ConversationMetrics>;
  getAggregateMetrics(timeRange?: { start: Date; end: Date }): Promise<ConversationMetrics>;
}

/**
 * Type definitions for Dynamic Conversation Engine
 * 
 * Comprehensive types supporting intelligent, adaptive conversations
 */

export type SophisticationLevel = 
  | 'novice'
  | 'intermediate'
  | 'advanced' 
  | 'expert'

export type UserRole = 
  | 'technical'
  | 'business'
  | 'hybrid'
  | 'founder'
  | 'consultant'

export type QuestionType = 
  | 'clarification'
  | 'deep-dive'
  | 'technical'
  | 'business'
  | 'validation'

export type EngagementLevel = 
  | 'highly-engaged'
  | 'engaged'
  | 'moderately-engaged'
  | 'disengaged'
  | 'unknown'

export type Domain = 
  | 'fintech'
  | 'healthcare'
  | 'ecommerce'
  | 'saas'
  | 'consumer_apps'
  | 'enterprise'
  | 'general'

// Domain expertise for prompt engineering
export interface DomainExpertise {
  terminology: string
  commonProblems: string
  bestPractices: string
}

// User profile with sophistication and domain knowledge
export interface UserProfile {
  id?: string
  role: UserRole
  sophisticationLevel: SophisticationLevel
  domainKnowledge?: {
    experience?: string
    technicalDepth?: string
    businessAcumen?: string
    industryExperience?: string
    specificAreas?: string[]
  }
  engagementPattern?: EngagementLevel
  preferredCommunicationStyle?: string
}

// Escape signal detection
export interface EscapeSignals {
  detected: boolean
  type: 'boredom' | 'impatience' | 'expert_skip' | 'confusion' | null
  confidence: number
  indicators?: string[]
}

// Response analysis from GPT-4
export interface ConversationResponse {
  sophisticationScore: number
  engagementLevel: number
  clarityScore: number
  domainKnowledge?: {
    technicalDepth?: string
    businessAcumen?: string
    industryExperience?: string
    specificAreas?: string[]
  }
  escapeSignals: EscapeSignals
  extractedEntities: string[]
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed'
  suggestedAdaptations: string[]
  nextQuestionHints: string[]
  metadata: {
    model: string
    tokens: number
    timestamp: string
    responseLength: number
  }
}

// Generated question result
export interface QuestionGenerationResult {
  question: string
  questionType: QuestionType
  sophisticationLevel: SophisticationLevel
  domainContext: string
  followUpSuggestions: string[]
  confidence: number
  reasoning: string
  expectedResponseTypes: string[]
  metadata: {
    model: string
    tokens: number
    timestamp: string
  }
}

// Individual conversation exchange
export interface ConversationExchange {
  userResponse: string
  analysis: ConversationResponse
  generatedQuestion?: QuestionGenerationResult
  timestamp: string
  stage: ConversationStage
}

// Complete conversation context
export interface ConversationContext {
  sessionId: string
  userId?: string
  domain: Domain
  stage: ConversationStage
  userProfile: UserProfile
  conversationHistory: ConversationExchange[]
  currentQuestion?: QuestionGenerationResult
  assumptions?: AssumptionSet[]
  metadata?: {
    startedAt: string
    lastUpdated: string
    totalQuestions: number
    escapeCount: number
  }
  lastUpdated: string
}

// Assumption generation
export interface Assumption {
  id: string
  category: string
  assumption: string
  reasoning: string
  confidence: number
  impact: 'low' | 'medium' | 'high'
  source: 'conversation' | 'profile' | 'domain_default'
  dependencies?: string[]
  validatedBy?: 'user' | 'system'
  correctedBy?: string
}

export interface AssumptionSet {
  id: string
  domain: Domain
  stage: ConversationStage
  assumptions: Assumption[]
  completeness: number
  confidence: number
  lastUpdated: string
}

// Session management
export interface ConversationSession {
  id: string
  userId?: string
  context: ConversationContext
  status: 'active' | 'paused' | 'completed' | 'abandoned'
  createdAt: string
  lastActivity: string
  expiresAt?: string
}

// Enhanced question response interface (merging with existing)
export interface DynamicQuestionResponse {
  id: string
  question: string
  response: string
  timestamp: string
  analysis?: ConversationResponse
}

// Conversation metrics and analytics
export interface ConversationMetrics {
  totalQuestions: number
  averageResponseTime: number
  sophisticationProgression: number[]
  engagementTrend: number[]
  escapeSignalCount: number
  assumptionAccuracy: number
  completionRate: number
} 