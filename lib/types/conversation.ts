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