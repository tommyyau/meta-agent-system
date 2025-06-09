import { SessionManager, SessionConfiguration, SessionContext, SessionState, UserProfile, SpecializedAgent } from '@/lib/types/agent-types'
import { nanoid } from 'nanoid'

/**
 * Session Store Service
 * 
 * Manages session data, lifecycle, and persistence
 */
export class SessionStore {
  private sessions: Map<string, SessionManagerImpl> = new Map()

  /**
   * Create a new session
   */
  async createSession(config: SessionConfiguration): Promise<SessionManager> {
    const { sessionId, masterAgent, configuration } = config

    try {
      const sessionManager = new SessionManagerImpl(sessionId, masterAgent, configuration)
      this.sessions.set(sessionId, sessionManager)
      
      return sessionManager
    } catch (error) {
      console.error('Error creating session:', error)
      throw new Error(`Session creation failed: ${(error as Error).message}`)
    }
  }

  /**
   * Get existing session
   */
  async getSession(sessionId: string): Promise<SessionManager | null> {
    return this.sessions.get(sessionId) || null
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (session) {
      await session.clearSession()
      this.sessions.delete(sessionId)
    }
  }

  /**
   * Health check for the service
   */
  async healthCheck(): Promise<boolean> {
    return true
  }

  /**
   * Get session statistics
   */
  getStatistics(): {
    activeSessions: number
    totalSessions: number
    averageUptime: number
  } {
    const activeSessions = this.sessions.size
    const uptimes = Array.from(this.sessions.values()).map(s => s.getUptime())
    const averageUptime = uptimes.length > 0 ? uptimes.reduce((a, b) => a + b, 0) / uptimes.length : 0

    return {
      activeSessions,
      totalSessions: activeSessions, // For now, same as active
      averageUptime
    }
  }
}

/**
 * Session Manager Implementation
 */
class SessionManagerImpl implements SessionManager {
  sessionId: string
  profile?: UserProfile
  activeAgent?: SpecializedAgent
  
  private masterAgent: any
  private configuration: any
  private startTime: Date
  private lastActivity: Date
  private sessionData: Record<string, any> = {}

  constructor(sessionId: string, masterAgent: any, configuration: any) {
    this.sessionId = sessionId
    this.masterAgent = masterAgent
    this.configuration = configuration
    this.startTime = new Date()
    this.lastActivity = new Date()
  }

  /**
   * Get session context
   */
  async getContext(): Promise<SessionContext> {
    return {
      sessionId: this.sessionId,
      startTime: this.startTime,
      lastActivity: this.lastActivity,
      profile: this.profile,
      conversationHistory: this.profile?.conversationHistory || [],
      currentStage: this.activeAgent?.currentStage || 'idea-clarity',
      metadata: this.sessionData
    }
  }

  /**
   * Update session profile
   */
  async updateProfile(profile: UserProfile): Promise<void> {
    this.profile = profile
    this.lastActivity = new Date()
    await this.saveState()
  }

  /**
   * Register active agent
   */
  async registerAgent(agent: SpecializedAgent): Promise<void> {
    this.activeAgent = agent
    this.lastActivity = new Date()
    await this.saveState()
  }

  /**
   * Save session state
   */
  async saveState(): Promise<void> {
    try {
      // In a real implementation, this would persist to database
      // For now, we'll just update the in-memory state
      this.lastActivity = new Date()
    } catch (error) {
      console.error('Error saving session state:', error)
    }
  }

  /**
   * Load session state
   */
  async loadState(): Promise<SessionState> {
    return {
      sessionId: this.sessionId,
      profile: this.profile,
      agentId: this.activeAgent?.id,
      conversationState: this.activeAgent?.conversationState,
      metadata: this.sessionData,
      created: this.startTime,
      lastUpdated: this.lastActivity
    }
  }

  /**
   * Clear session data
   */
  async clearSession(): Promise<void> {
    this.profile = undefined
    this.activeAgent = undefined
    this.sessionData = {}
  }

  /**
   * Check if session is active
   */
  isActive(): boolean {
    const maxDuration = this.configuration.maxDuration || 24 * 60 * 60 * 1000 // 24 hours
    const age = Date.now() - this.startTime.getTime()
    return age < maxDuration
  }

  /**
   * Get session uptime in milliseconds
   */
  getUptime(): number {
    return Date.now() - this.startTime.getTime()
  }

  /**
   * Extend session duration
   */
  async extend(duration: number): Promise<void> {
    // Update configuration to extend max duration
    this.configuration.maxDuration = (this.configuration.maxDuration || 0) + duration
    this.lastActivity = new Date()
  }
}

// Export singleton instance
export const sessionStore = new SessionStore() 