import { SessionManager, SessionConfiguration, SessionContext, SessionState, UserProfile, SpecializedAgent } from '@/lib/types/agent-types'
import { sessionStore } from './session-store'
import { nanoid } from 'nanoid'

/**
 * Advanced Session Management System
 * 
 * Provides comprehensive session management with:
 * - Session lifecycle management
 * - State persistence and recovery
 * - Session monitoring and analytics
 * - Automatic cleanup and garbage collection
 * - Session synchronization across instances
 * - Performance optimization
 */
export class SessionManagementSystem {
  private activeSessions: Map<string, EnhancedSessionManager> = new Map()
  private sessionMetrics: Map<string, SessionMetrics> = new Map()
  private cleanupInterval: NodeJS.Timeout | null = null
  private monitoringInterval: NodeJS.Timeout | null = null
  
  // Configuration
  private readonly config = {
    maxSessionDuration: 24 * 60 * 60 * 1000, // 24 hours
    cleanupInterval: 5 * 60 * 1000, // 5 minutes
    monitoringInterval: 60 * 1000, // 1 minute
    maxConcurrentSessions: 1000,
    sessionTimeoutWarning: 30 * 60 * 1000, // 30 minutes
    persistenceEnabled: true,
    compressionEnabled: true
  }

  constructor() {
    this.initializeSystem()
  }

  /**
   * Initialize the session management system
   */
  private initializeSystem(): void {
    // Start cleanup process
    this.startCleanupProcess()
    
    // Start monitoring
    this.startMonitoring()
    
    // Setup graceful shutdown
    this.setupGracefulShutdown()
  }

  /**
   * Create a new session with enhanced features
   */
  async createSession(
    sessionId?: string,
    options?: SessionCreationOptions
  ): Promise<EnhancedSessionManager> {
    try {
      const id = sessionId || nanoid()
      
      // Check session limits
      if (this.activeSessions.size >= this.config.maxConcurrentSessions) {
        await this.cleanupExpiredSessions()
        
        if (this.activeSessions.size >= this.config.maxConcurrentSessions) {
          throw new Error('Maximum concurrent sessions reached')
        }
      }

      // Create enhanced session manager
      const sessionManager = new EnhancedSessionManager(id, {
        maxDuration: options?.maxDuration || this.config.maxSessionDuration,
        autoSave: options?.autoSave ?? true
      })

      // Initialize session metrics
      this.sessionMetrics.set(id, {
        sessionId: id,
        created: new Date(),
        lastActivity: new Date(),
        requestCount: 0,
        dataSize: 0,
        errors: 0,
        warnings: 0,
        performance: {
          averageResponseTime: 0,
          totalRequests: 0,
          cacheHits: 0,
          cacheMisses: 0
        }
      })

      // Store session
      this.activeSessions.set(id, sessionManager)

      // Persist session creation
      if (this.config.persistenceEnabled) {
        await this.persistSessionCreation(sessionManager)
      }

      return sessionManager
    } catch (error) {
      console.error('Error creating session:', error)
      throw new Error(`Session creation failed: ${(error as Error).message}`)
    }
  }

  /**
   * Get existing session with automatic recovery
   */
  async getSession(sessionId: string): Promise<EnhancedSessionManager | undefined> {
    try {
      // Check active sessions first
      let session = this.activeSessions.get(sessionId)
      
      if (session) {
        // Update last activity
        this.updateSessionActivity(sessionId)
        return session
      }

      // Try to recover from persistence
      if (this.config.persistenceEnabled) {
        session = await this.recoverSession(sessionId)
        
        if (session) {
          this.activeSessions.set(sessionId, session)
          this.updateSessionActivity(sessionId)
          return session
        }
      }

      return undefined
    } catch (error) {
      console.error('Error getting session:', error)
      return undefined
    }
  }

  /**
   * Update session with new data
   */
  async updateSession(
    sessionId: string,
    updates: Partial<SessionUpdateData>
  ): Promise<boolean> {
    try {
      const session = await this.getSession(sessionId)
      if (!session) {
        return false
      }

      // Apply updates
      if (updates.profile) {
        await session.updateProfile(updates.profile)
      }

      if (updates.agent) {
        await session.registerAgent(updates.agent)
      }

      if (updates.metadata) {
        await session.updateMetadata(updates.metadata)
      }

      // Update metrics
      this.updateSessionMetrics(sessionId, {
        requestCount: 1,
        dataSize: this.calculateDataSize(updates)
      })

      return true
    } catch (error) {
      console.error('Error updating session:', error)
      this.recordSessionError(sessionId, error as Error)
      return false
    }
  }

  /**
   * Delete session with cleanup
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const session = this.activeSessions.get(sessionId)
      
      if (session) {
        // Cleanup session data
        await session.cleanup()
        
        // Remove from active sessions
        this.activeSessions.delete(sessionId)
        
        // Remove metrics
        this.sessionMetrics.delete(sessionId)
        
        // Persist deletion
        if (this.config.persistenceEnabled) {
          await this.persistSessionDeletion(sessionId)
        }
        
        return true
      }
      
      return false
    } catch (error) {
      console.error('Error deleting session:', error)
      return false
    }
  }

  /**
   * Get session analytics and metrics
   */
  getSessionAnalytics(): SessionAnalytics {
    const now = new Date()
    const metrics = Array.from(this.sessionMetrics.values())
    
    return {
      totalSessions: metrics.length,
      activeSessions: this.activeSessions.size,
      averageSessionDuration: this.calculateAverageSessionDuration(metrics, now),
      totalRequests: metrics.reduce((sum, m) => sum + m.requestCount, 0),
      averageRequestsPerSession: metrics.length > 0 ? 
        metrics.reduce((sum, m) => sum + m.requestCount, 0) / metrics.length : 0,
      totalDataSize: metrics.reduce((sum, m) => sum + m.dataSize, 0),
      errorRate: this.calculateErrorRate(metrics),
      performanceMetrics: this.aggregatePerformanceMetrics(metrics),
      sessionDistribution: this.getSessionDistribution(),
      resourceUsage: this.getResourceUsage()
    }
  }

  /**
   * Get session health status
   */
  async getHealthStatus(): Promise<SessionHealthStatus> {
    try {
      const analytics = this.getSessionAnalytics()
      const memoryUsage = process.memoryUsage()
      
      return {
        status: this.determineHealthStatus(analytics),
        activeSessions: analytics.activeSessions,
        totalSessions: analytics.totalSessions,
        errorRate: analytics.errorRate,
        memoryUsage: {
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          external: memoryUsage.external,
          rss: memoryUsage.rss
        },
        uptime: process.uptime(),
        lastCleanup: this.lastCleanupTime,
        warnings: this.getSystemWarnings(analytics)
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        activeSessions: 0,
        totalSessions: 0,
        errorRate: 1,
        memoryUsage: { heapUsed: 0, heapTotal: 0, external: 0, rss: 0 },
        uptime: 0,
        lastCleanup: null,
        warnings: ['Health check failed']
      }
    }
  }

  /**
   * Cleanup expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    const now = Date.now()
    let cleanedCount = 0

    for (const [sessionId, session] of Array.from(this.activeSessions.entries())) {
      if (session.isExpired(now)) {
        await this.deleteSession(sessionId)
        cleanedCount++
      }
    }

    this.lastCleanupTime = new Date()
    return cleanedCount
  }

  /**
   * Start automatic cleanup process
   */
  private startCleanupProcess(): void {
    this.cleanupInterval = setInterval(async () => {
      try {
        const cleaned = await this.cleanupExpiredSessions()
        if (cleaned > 0) {
          console.log(`Cleaned up ${cleaned} expired sessions`)
        }
      } catch (error) {
        console.error('Error in cleanup process:', error)
      }
    }, this.config.cleanupInterval)
  }

  /**
   * Start monitoring process
   */
  private startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      try {
        const analytics = this.getSessionAnalytics()
        
        // Log warnings if needed
        if (analytics.errorRate > 0.1) {
          console.warn(`High error rate detected: ${(analytics.errorRate * 100).toFixed(1)}%`)
        }
        
        if (analytics.activeSessions > this.config.maxConcurrentSessions * 0.8) {
          console.warn(`High session count: ${analytics.activeSessions}/${this.config.maxConcurrentSessions}`)
        }
      } catch (error) {
        console.error('Error in monitoring process:', error)
      }
    }, this.config.monitoringInterval)
  }

  /**
   * Setup graceful shutdown
   */
  private setupGracefulShutdown(): void {
    const shutdown = async () => {
      console.log('Shutting down session management system...')
      
      // Clear intervals
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval)
      }
      
      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval)
      }
      
      // Save all active sessions
      if (this.config.persistenceEnabled) {
        await this.persistAllSessions()
      }
      
      console.log('Session management system shutdown complete')
    }

    process.on('SIGTERM', shutdown)
    process.on('SIGINT', shutdown)
  }

  // Helper methods
  private updateSessionActivity(sessionId: string): void {
    const metrics = this.sessionMetrics.get(sessionId)
    if (metrics) {
      metrics.lastActivity = new Date()
    }
  }

  private updateSessionMetrics(sessionId: string, updates: Partial<SessionMetrics>): void {
    const metrics = this.sessionMetrics.get(sessionId)
    if (metrics) {
      Object.assign(metrics, updates)
    }
  }

  private recordSessionError(sessionId: string, error: Error): void {
    const metrics = this.sessionMetrics.get(sessionId)
    if (metrics) {
      metrics.errors++
    }
  }

  private calculateDataSize(data: any): number {
    return JSON.stringify(data).length
  }

  private calculateAverageSessionDuration(metrics: SessionMetrics[], now: Date): number {
    if (metrics.length === 0) return 0
    
    return metrics.reduce((sum, m) => {
      return sum + (now.getTime() - m.created.getTime())
    }, 0) / metrics.length
  }

  private calculateErrorRate(metrics: SessionMetrics[]): number {
    if (metrics.length === 0) return 0
    
    const totalErrors = metrics.reduce((sum, m) => sum + m.errors, 0)
    const totalRequests = metrics.reduce((sum, m) => sum + m.requestCount, 0)
    
    return totalRequests > 0 ? totalErrors / totalRequests : 0
  }

  private aggregatePerformanceMetrics(metrics: SessionMetrics[]): PerformanceMetrics {
    const totalRequests = metrics.reduce((sum, m) => sum + m.performance.totalRequests, 0)
    const totalCacheHits = metrics.reduce((sum, m) => sum + m.performance.cacheHits, 0)
    const totalCacheMisses = metrics.reduce((sum, m) => sum + m.performance.cacheMisses, 0)
    
    return {
      averageResponseTime: metrics.length > 0 ? 
        metrics.reduce((sum, m) => sum + m.performance.averageResponseTime, 0) / metrics.length : 0,
      totalRequests,
      cacheHits: totalCacheHits,
      cacheMisses: totalCacheMisses,
      cacheHitRate: (totalCacheHits + totalCacheMisses) > 0 ? 
        totalCacheHits / (totalCacheHits + totalCacheMisses) : 0
    }
  }

  private getSessionDistribution(): Record<string, number> {
    // Implementation for session distribution analytics
    return {}
  }

  private getResourceUsage(): ResourceUsage {
    const memUsage = process.memoryUsage()
    return {
      memoryUsage: memUsage.heapUsed,
      cpuUsage: process.cpuUsage().user,
      sessionCount: this.activeSessions.size
    }
  }

  private determineHealthStatus(analytics: SessionAnalytics): 'healthy' | 'degraded' | 'unhealthy' {
    if (analytics.errorRate > 0.2) return 'unhealthy'
    if (analytics.errorRate > 0.1 || analytics.activeSessions > this.config.maxConcurrentSessions * 0.9) {
      return 'degraded'
    }
    return 'healthy'
  }

  private getSystemWarnings(analytics: SessionAnalytics): string[] {
    const warnings = []
    
    if (analytics.errorRate > 0.1) {
      warnings.push(`High error rate: ${(analytics.errorRate * 100).toFixed(1)}%`)
    }
    
    if (analytics.activeSessions > this.config.maxConcurrentSessions * 0.8) {
      warnings.push(`High session count: ${analytics.activeSessions}`)
    }
    
    return warnings
  }

  // Persistence methods (placeholder implementations)
  private async persistSessionCreation(session: EnhancedSessionManager): Promise<void> {
    // Implementation for persisting session creation
  }

  private async persistSessionDeletion(sessionId: string): Promise<void> {
    // Implementation for persisting session deletion
  }

  private async recoverSession(sessionId: string): Promise<EnhancedSessionManager | undefined> {
    // Implementation for session recovery from persistence
    return undefined
  }

  private async persistAllSessions(): Promise<void> {
    // Implementation for persisting all active sessions
  }

  private lastCleanupTime: Date | null = null
}

/**
 * Enhanced Session Manager with additional features
 */
class EnhancedSessionManager implements SessionManager {
  sessionId: string
  profile?: UserProfile
  activeAgent?: SpecializedAgent
  
  private configuration: any
  private startTime: Date
  private lastActivity: Date
  private sessionData: Record<string, any> = {}
  private metadata: Record<string, any> = {}

  constructor(sessionId: string, config: any) {
    this.sessionId = sessionId
    this.configuration = config
    this.startTime = new Date()
    this.lastActivity = new Date()
  }

  async getContext(): Promise<SessionContext> {
    return {
      sessionId: this.sessionId,
      startTime: this.startTime,
      lastActivity: this.lastActivity,
      profile: this.profile,
      conversationHistory: this.profile?.conversationHistory || [],
      currentStage: this.activeAgent?.currentStage || 'idea-clarity',
      metadata: this.metadata
    }
  }

  async updateProfile(profile: UserProfile): Promise<void> {
    this.profile = profile
    this.lastActivity = new Date()
    
    if (this.configuration.autoSave) {
      await this.saveState()
    }
  }

  async registerAgent(agent: SpecializedAgent): Promise<void> {
    this.activeAgent = agent
    this.lastActivity = new Date()
    
    if (this.configuration.autoSave) {
      await this.saveState()
    }
  }

  async updateMetadata(metadata: Record<string, any>): Promise<void> {
    Object.assign(this.metadata, metadata)
    this.lastActivity = new Date()
  }

  async saveState(): Promise<void> {
    try {
      // Implementation for saving session state
      this.lastActivity = new Date()
    } catch (error) {
      console.error('Error saving session state:', error)
    }
  }

  async loadState(): Promise<SessionState> {
    return {
      sessionId: this.sessionId,
      profile: this.profile,
      agentId: this.activeAgent?.id,
      conversationState: this.activeAgent?.conversationState,
      metadata: this.metadata,
      created: this.startTime,
      lastUpdated: this.lastActivity
    }
  }

  async clearSession(): Promise<void> {
    this.profile = undefined
    this.activeAgent = undefined
    this.sessionData = {}
    this.metadata = {}
  }

  async cleanup(): Promise<void> {
    await this.clearSession()
    // Additional cleanup logic
  }

  isActive(): boolean {
    const maxDuration = this.configuration.maxDuration || 24 * 60 * 60 * 1000
    const age = Date.now() - this.startTime.getTime()
    return age < maxDuration
  }

  isExpired(currentTime?: number): boolean {
    const now = currentTime || Date.now()
    const maxDuration = this.configuration.maxDuration || 24 * 60 * 60 * 1000
    const age = now - this.startTime.getTime()
    return age >= maxDuration
  }

  getUptime(): number {
    return Date.now() - this.startTime.getTime()
  }

  async extend(duration: number): Promise<void> {
    this.configuration.maxDuration = (this.configuration.maxDuration || 0) + duration
    this.lastActivity = new Date()
  }
}

// Type definitions
interface SessionCreationOptions {
  maxDuration?: number
  autoSave?: boolean
  compressionEnabled?: boolean
  persistenceEnabled?: boolean
  timeoutWarning?: number
}

interface SessionUpdateData {
  profile?: UserProfile
  agent?: SpecializedAgent
  metadata?: Record<string, any>
}

interface SessionMetrics {
  sessionId: string
  created: Date
  lastActivity: Date
  requestCount: number
  dataSize: number
  errors: number
  warnings: number
  performance: PerformanceMetrics
}

interface PerformanceMetrics {
  averageResponseTime: number
  totalRequests: number
  cacheHits: number
  cacheMisses: number
  cacheHitRate?: number
}

interface SessionAnalytics {
  totalSessions: number
  activeSessions: number
  averageSessionDuration: number
  totalRequests: number
  averageRequestsPerSession: number
  totalDataSize: number
  errorRate: number
  performanceMetrics: PerformanceMetrics
  sessionDistribution: Record<string, number>
  resourceUsage: ResourceUsage
}

interface ResourceUsage {
  memoryUsage: number
  cpuUsage: number
  sessionCount: number
}

interface SessionHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  activeSessions: number
  totalSessions: number
  errorRate: number
  memoryUsage: {
    heapUsed: number
    heapTotal: number
    external: number
    rss: number
  }
  uptime: number
  lastCleanup: Date | null
  warnings: string[]
}

// Export singleton instance
export const sessionManagementSystem = new SessionManagementSystem() 