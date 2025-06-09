/**
 * Core Agent System Type Definitions
 * 
 * These types define the fundamental data structures for the Meta-Agent system
 */

// User Profile Types
export interface UserProfile {
  id: string
  sessionId?: string
  
  // Industry Classification
  industry: string
  industryConfidence: number
  subIndustry?: string
  
  // Role Classification  
  role: 'technical' | 'business' | 'hybrid' | 'unknown'
  roleConfidence: number
  roleDetails?: string
  
  // Sophistication Level
  sophisticationLevel: 'low' | 'medium' | 'high'
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
}

export interface ConversationMessage {
  id: string
  content: string
  timestamp: Date
  type: 'user' | 'agent' | 'system'
  metadata?: Record<string, any>
}

// Agent Template Types
export interface AgentTemplate {
  id: string
  name: string
  domain: string
  version: string
  description: string
  
  // Configuration
  questionBank: QuestionSet[]
  terminology: Map<string, string>
  assumptionTemplates: AssumptionTemplate[]
  conversationFlow: ConversationFlow
  
  // Metadata
  metadata: {
    created: Date
    lastUpdated: Date
    deploymentCount: number
  }
}

export interface QuestionSet {
  id: string
  category: string
  questions: Question[]
  priority: number
  prerequisites?: string[]
}

export interface Question {
  id: string
  text: string
  type: 'text' | 'choice' | 'scale' | 'boolean'
  options?: string[]
  required: boolean
  followUpQuestions?: string[]
  skipConditions?: SkipCondition[]
}

export interface SkipCondition {
  field: string
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than'
  value: any
}

export interface AssumptionTemplate {
  id: string
  category: string
  template: string
  confidence: number
  dependencies: string[]
  fallbackOptions: string[]
}

export interface ConversationFlow {
  stages: string[]
  transitions: Record<string, FlowTransition>
  configuration: FlowConfiguration
}

export interface FlowTransition {
  from: string
  to: string
  conditions: TransitionCondition[]
  actions?: FlowAction[]
}

export interface TransitionCondition {
  type: 'profile_complete' | 'user_input' | 'time_elapsed' | 'custom'
  parameters: Record<string, any>
}

export interface FlowAction {
  type: 'update_profile' | 'deploy_agent' | 'send_message' | 'custom'
  parameters: Record<string, any>
}

export interface FlowConfiguration {
  maxDuration?: number
  autoAdvance?: boolean
  allowBacktracking?: boolean
  customSettings?: Record<string, any>
}

// Specialized Agent Types
export interface SpecializedAgent {
  id: string
  templateId: string
  sessionId: string
  profile: UserProfile
  
  // Current State
  currentStage: string
  conversationState: ConversationState
  
  // Customizations
  customTerminology: Map<string, string>
  activeQuestionSet: QuestionSet[]
  conversationStyle: string
  
  // Methods (as interface, implementation will be in classes)
  processInput(input: string): Promise<AgentResponse>
  generateQuestion(): Promise<Question | null>
  makeAssumption(context: AssumptionContext): Promise<Assumption>
  updateState(newState: Partial<ConversationState>): Promise<void>
  
  // Metadata
  created: Date
  lastActivity: Date
  messageCount: number
}

export interface ConversationState {
  stage: string
  completedQuestions: string[]
  collectedData: Record<string, any>
  assumptions: Assumption[]
  nextActions: string[]
  confidence: number
}

export interface AgentResponse {
  message: string
  type: 'question' | 'clarification' | 'assumption' | 'summary' | 'transition'
  nextQuestion?: Question
  suggestions?: string[]
  metadata?: Record<string, any>
}

export interface Assumption {
  id: string
  category: string
  description: string
  confidence: number
  reasoning: string
  dependencies: string[]
  createdAt: Date
  validated?: boolean
}

export interface AssumptionContext {
  missingData: string[]
  collectedData: Record<string, any>
  userProfile: UserProfile
  conversationHistory: ConversationMessage[]
}

// Session Management Types
export interface SessionManager {
  sessionId: string
  profile?: UserProfile
  activeAgent?: SpecializedAgent
  
  // Session State
  getContext(): Promise<SessionContext>
  updateProfile(profile: UserProfile): Promise<void>
  registerAgent(agent: SpecializedAgent): Promise<void>
  
  // Data Management
  saveState(): Promise<void>
  loadState(): Promise<SessionState>
  clearSession(): Promise<void>
  
  // Lifecycle
  isActive(): boolean
  getUptime(): number
  extend(duration: number): Promise<void>
}

export interface SessionContext {
  sessionId: string
  startTime: Date
  lastActivity: Date
  profile?: UserProfile
  conversationHistory: ConversationMessage[]
  currentStage: string
  metadata: Record<string, any>
}

export interface SessionState {
  sessionId: string
  profile?: UserProfile
  agentId?: string
  conversationState?: ConversationState
  metadata: Record<string, any>
  created: Date
  lastUpdated: Date
}

// Service Configuration Types
export interface ProfileAnalysisRequest {
  input: string
  context?: SessionContext
  sessionId?: string
}

export interface AgentSelectionRequest {
  profile: UserProfile
  availableAgents: AgentTemplate[]
  selectionCriteria: SelectionCriteria
}

export interface SelectionCriteria {
  industryMatch: number
  roleMatch: number
  sophisticationMatch: number
  contextualFit: number
}

export interface AgentDeploymentRequest {
  template: AgentTemplate
  profile: UserProfile
  sessionId: string
  customizations: AgentCustomizations
}

export interface AgentCustomizations {
  terminology: Map<string, string>
  questionSet: any[]
  conversationStyle: string
}

export interface SessionConfiguration {
  sessionId: string
  masterAgent: any // Will be properly typed when MasterAgent is complete
  configuration: {
    maxDuration: number
    autoSave: boolean
    compressionEnabled: boolean
  }
}

// Health Check Types
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  services: Record<string, boolean>
  timestamp: Date
  details?: Record<string, any>
}

// Export utility types
export type AgentDomain = 'fintech' | 'healthcare' | 'ecommerce' | 'saas' | 'consumer' | 'enterprise' | 'general'
export type ConversationStage = 'idea-clarity' | 'user-workflow' | 'technical-specs' | 'wireframes'
export type SophisticationLevel = 'low' | 'medium' | 'high'
export type UserRole = 'technical' | 'business' | 'hybrid' | 'unknown' 