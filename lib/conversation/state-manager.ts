import { 
  ConversationState, 
  ConversationStage, 
  StageStatus, 
  StageProgress, 
  QuestionResponse, 
  ConversationMetrics,
  IConversationStateManager 
} from '@/lib/types/conversation';

/**
 * In-memory conversation state manager for MVP
 * TODO: Replace with database persistence in production
 */
export class ConversationStateManager implements IConversationStateManager {
  private states: Map<string, ConversationState> = new Map();

  async getCurrentState(sessionId: string): Promise<ConversationState | null> {
    return this.states.get(sessionId) || null;
  }

  async createConversationState(sessionId: string, userId: string): Promise<ConversationState> {
    const now = new Date();
    const initialState: ConversationState = {
      sessionId,
      userId,
      currentStage: ConversationStage.IDEA_CLARITY,
      overallProgress: 0,
      stageProgresses: new Map([
        [ConversationStage.IDEA_CLARITY, this.createInitialStageProgress(ConversationStage.IDEA_CLARITY)],
        [ConversationStage.USER_WORKFLOW, this.createInitialStageProgress(ConversationStage.USER_WORKFLOW)],
        [ConversationStage.TECHNICAL_SPECS, this.createInitialStageProgress(ConversationStage.TECHNICAL_SPECS)],
        [ConversationStage.WIREFRAMES, this.createInitialStageProgress(ConversationStage.WIREFRAMES)]
      ]),
      escapeTriggered: false,
      createdAt: now,
      updatedAt: now
    };

    this.states.set(sessionId, initialState);
    return initialState;
  }

  async updateCurrentStage(sessionId: string, stage: ConversationStage): Promise<void> {
    const state = this.states.get(sessionId);
    if (!state) {
      throw new Error(`Conversation state not found for session: ${sessionId}`);
    }

    // Mark previous stage as completed if moving forward
    if (this.isStageProgression(state.currentStage, stage)) {
      await this.markStageComplete(sessionId, state.currentStage);
    }

    // Update current stage
    state.currentStage = stage;
    state.updatedAt = new Date();

    // Start the new stage
    const stageProgress = state.stageProgresses.get(stage);
    if (stageProgress && stageProgress.status === StageStatus.NOT_STARTED) {
      stageProgress.status = StageStatus.IN_PROGRESS;
      stageProgress.startTime = new Date();
    }

    // Recalculate overall progress
    state.overallProgress = await this.calculateOverallProgress(sessionId);
  }

  async recordQuestionResponse(sessionId: string, response: QuestionResponse): Promise<void> {
    const state = this.states.get(sessionId);
    if (!state) {
      throw new Error(`Conversation state not found for session: ${sessionId}`);
    }

    const currentStageProgress = state.stageProgresses.get(state.currentStage);
    if (!currentStageProgress) {
      throw new Error(`Stage progress not found for stage: ${state.currentStage}`);
    }

    // Add response to current stage
    currentStageProgress.responses.push(response);
    
    // Update counters
    if (response.isSkipped) {
      currentStageProgress.skippedQuestions++;
    } else {
      currentStageProgress.answeredQuestions++;
    }

    state.updatedAt = new Date();
    
    // Recalculate progress
    state.overallProgress = await this.calculateOverallProgress(sessionId);
  }

  async markStageComplete(sessionId: string, stage: ConversationStage): Promise<void> {
    const state = this.states.get(sessionId);
    if (!state) {
      throw new Error(`Conversation state not found for session: ${sessionId}`);
    }

    const stageProgress = state.stageProgresses.get(stage);
    if (!stageProgress) {
      throw new Error(`Stage progress not found for stage: ${stage}`);
    }

    stageProgress.status = StageStatus.COMPLETED;
    stageProgress.completionTime = new Date();
    state.updatedAt = new Date();

    // If this is the last stage, mark conversation as completed
    if (stage === ConversationStage.WIREFRAMES) {
      state.currentStage = ConversationStage.COMPLETED;
    }

    // Recalculate progress
    state.overallProgress = await this.calculateOverallProgress(sessionId);
  }

  async calculateOverallProgress(sessionId: string): Promise<number> {
    const state = this.states.get(sessionId);
    if (!state) return 0;

    const stages = [
      ConversationStage.IDEA_CLARITY,
      ConversationStage.USER_WORKFLOW,
      ConversationStage.TECHNICAL_SPECS,
      ConversationStage.WIREFRAMES
    ];

    let totalWeight = 0;
    let completedWeight = 0;

    for (const stage of stages) {
      const stageProgress = state.stageProgresses.get(stage);
      if (!stageProgress) continue;

      const weight = 25; // Each stage is 25% of total progress
      totalWeight += weight;

      if (stageProgress.status === StageStatus.COMPLETED) {
        completedWeight += weight;
      } else if (stageProgress.status === StageStatus.IN_PROGRESS) {
        // Partial progress based on answered questions
        const stageCompletion = stageProgress.totalQuestions > 0 
          ? (stageProgress.answeredQuestions / stageProgress.totalQuestions) 
          : 0;
        completedWeight += weight * stageCompletion;
      }
    }

    return totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
  }

  async getStageProgress(sessionId: string, stage: ConversationStage): Promise<StageProgress | null> {
    const state = this.states.get(sessionId);
    if (!state) return null;

    return state.stageProgresses.get(stage) || null;
  }

  async triggerEscape(sessionId: string, stage: ConversationStage): Promise<void> {
    const state = this.states.get(sessionId);
    if (!state) {
      throw new Error(`Conversation state not found for session: ${sessionId}`);
    }

    state.escapeTriggered = true;
    state.escapeStage = stage;
    state.escapeTimestamp = new Date();
    state.updatedAt = new Date();
  }

  async isEscapeTriggered(sessionId: string): Promise<boolean> {
    const state = this.states.get(sessionId);
    return state?.escapeTriggered || false;
  }

  async getConversationMetrics(sessionId: string): Promise<ConversationMetrics> {
    const state = this.states.get(sessionId);
    if (!state) {
      throw new Error(`Conversation state not found for session: ${sessionId}`);
    }

    const totalDuration = this.calculateTotalDuration(state);
    const averageResponseTime = this.calculateAverageResponseTime(state);
    const completionRate = this.calculateCompletionRate(state);
    const escapeRate = state.escapeTriggered ? 1 : 0;
    const stageCompletionRates = this.calculateStageCompletionRates(state);

    return {
      totalDuration,
      averageResponseTime,
      completionRate,
      escapeRate,
      stageCompletionRates
    };
  }

  async getAggregateMetrics(timeRange?: { start: Date; end: Date }): Promise<ConversationMetrics> {
    const allStates = Array.from(this.states.values());
    
    // Filter by time range if provided
    const filteredStates = timeRange 
      ? allStates.filter(state => 
          state.createdAt >= timeRange.start && state.createdAt <= timeRange.end
        )
      : allStates;

    if (filteredStates.length === 0) {
      return {
        totalDuration: 0,
        averageResponseTime: 0,
        completionRate: 0,
        escapeRate: 0,
        stageCompletionRates: new Map()
      };
    }

    const totalDuration = filteredStates.reduce(
      (sum, state) => sum + this.calculateTotalDuration(state), 0
    ) / filteredStates.length;

    const averageResponseTime = filteredStates.reduce(
      (sum, state) => sum + this.calculateAverageResponseTime(state), 0
    ) / filteredStates.length;

    const completionRate = filteredStates.reduce(
      (sum, state) => sum + this.calculateCompletionRate(state), 0
    ) / filteredStates.length;

    const escapeRate = filteredStates.filter(state => state.escapeTriggered).length / filteredStates.length;

    const stageCompletionRates = this.calculateAggregateStageCompletionRates(filteredStates);

    return {
      totalDuration,
      averageResponseTime,
      completionRate,
      escapeRate,
      stageCompletionRates
    };
  }

  // Helper methods
  private createInitialStageProgress(stage: ConversationStage): StageProgress {
    return {
      stage,
      status: stage === ConversationStage.IDEA_CLARITY ? StageStatus.IN_PROGRESS : StageStatus.NOT_STARTED,
      totalQuestions: this.getStageQuestionCount(stage),
      answeredQuestions: 0,
      skippedQuestions: 0,
      responses: [],
      startTime: stage === ConversationStage.IDEA_CLARITY ? new Date() : undefined
    };
  }

  private getStageQuestionCount(stage: ConversationStage): number {
    // TODO: Get actual question counts from question banks
    const questionCounts: Record<ConversationStage, number> = {
      [ConversationStage.IDEA_CLARITY]: 8,
      [ConversationStage.USER_WORKFLOW]: 12,
      [ConversationStage.TECHNICAL_SPECS]: 15,
      [ConversationStage.WIREFRAMES]: 6,
      [ConversationStage.COMPLETED]: 0
    };
    return questionCounts[stage] || 10;
  }

  private isStageProgression(currentStage: ConversationStage, newStage: ConversationStage): boolean {
    const stageOrder = [
      ConversationStage.IDEA_CLARITY,
      ConversationStage.USER_WORKFLOW,
      ConversationStage.TECHNICAL_SPECS,
      ConversationStage.WIREFRAMES,
      ConversationStage.COMPLETED
    ];

    const currentIndex = stageOrder.indexOf(currentStage);
    const newIndex = stageOrder.indexOf(newStage);
    
    return newIndex > currentIndex;
  }

  private calculateTotalDuration(state: ConversationState): number {
    const endTime = state.currentStage === ConversationStage.COMPLETED 
      ? (state.stageProgresses.get(ConversationStage.WIREFRAMES)?.completionTime || state.updatedAt)
      : state.updatedAt;
    
    return Math.floor((endTime.getTime() - state.createdAt.getTime()) / 1000);
  }

  private calculateAverageResponseTime(state: ConversationState): number {
    let totalResponses = 0;
    let totalTime = 0;

    state.stageProgresses.forEach(progress => {
      if (progress.responses.length > 0) {
        totalResponses += progress.responses.length;
        
        // Calculate time between responses
        for (let i = 1; i < progress.responses.length; i++) {
          const timeDiff = progress.responses[i].timestamp.getTime() - 
                          progress.responses[i-1].timestamp.getTime();
          totalTime += timeDiff / 1000; // Convert to seconds
        }
      }
    });

    return totalResponses > 1 ? totalTime / (totalResponses - 1) : 0;
  }

  private calculateCompletionRate(state: ConversationState): number {
    return state.overallProgress / 100;
  }

  private calculateStageCompletionRates(state: ConversationState): Map<ConversationStage, number> {
    const rates = new Map<ConversationStage, number>();
    
    state.stageProgresses.forEach((progress, stage) => {
      if (progress.status === StageStatus.COMPLETED) {
        rates.set(stage, 1);
      } else if (progress.status === StageStatus.IN_PROGRESS && progress.totalQuestions > 0) {
        rates.set(stage, progress.answeredQuestions / progress.totalQuestions);
      } else {
        rates.set(stage, 0);
      }
    });

    return rates;
  }

  private calculateAggregateStageCompletionRates(states: ConversationState[]): Map<ConversationStage, number> {
    const rates = new Map<ConversationStage, number>();
    const stages = [
      ConversationStage.IDEA_CLARITY,
      ConversationStage.USER_WORKFLOW,
      ConversationStage.TECHNICAL_SPECS,
      ConversationStage.WIREFRAMES
    ];

    stages.forEach(stage => {
      const stageRates = states.map(state => {
        const progress = state.stageProgresses.get(stage);
        if (!progress) return 0;
        
        if (progress.status === StageStatus.COMPLETED) return 1;
        if (progress.status === StageStatus.IN_PROGRESS && progress.totalQuestions > 0) {
          return progress.answeredQuestions / progress.totalQuestions;
        }
        return 0;
      });

      const averageRate = stageRates.reduce((sum, rate) => sum + rate, 0) / stageRates.length;
      rates.set(stage, averageRate);
    });

    return rates;
  }
}

// Singleton instance for MVP
export const conversationStateManager = new ConversationStateManager(); 