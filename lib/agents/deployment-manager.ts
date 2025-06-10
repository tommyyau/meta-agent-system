import { AgentTemplate, UserProfile } from '@/lib/types/agent-types';
import { ConversationStage } from '@/lib/types/conversation';

/**
 * Agent deployment status and lifecycle management
 */
export enum DeploymentStatus {
  PENDING = 'pending',
  DEPLOYED = 'deployed', 
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  TERMINATED = 'terminated',
  ERROR = 'error'
}

export interface DeployedAgent {
  agentId: string;
  sessionId: string;
  template: AgentTemplate;
  profile: UserProfile;
  status: DeploymentStatus;
  createdAt: Date;
  lastActiveAt: Date;
  conversationStage: ConversationStage;
  metadata: {
    version: string;
    capabilities: string[];
    resourceUsage: {
      memoryMB: number;
      cpuPercent: number;
      requestCount: number;
    };
  };
}

export interface DeploymentConfig {
  maxConcurrentAgents: number;
  resourceLimits: {
    maxMemoryMB: number;
    maxCpuPercent: number;
    maxRequestsPerMinute: number;
  };
  timeouts: {
    idleTimeoutMs: number;
    maxLifetimeMs: number;
  };
}

/**
 * Agent deployment manager for orchestrating specialized agents
 */
export class AgentDeploymentManager {
  private deployedAgents: Map<string, DeployedAgent> = new Map();
  private sessionToAgent: Map<string, string> = new Map();
  private config: DeploymentConfig;

  constructor(config: DeploymentConfig) {
    this.config = config;
    
    // Start cleanup interval
    setInterval(() => this.cleanupInactiveAgents(), 60000); // Every minute
  }

  /**
   * Deploy a specialized agent for a session
   */
  async deployAgent(
    sessionId: string, 
    template: AgentTemplate, 
    profile: UserProfile
  ): Promise<DeployedAgent> {
    // Check if agent already exists for this session
    const existingAgentId = this.sessionToAgent.get(sessionId);
    if (existingAgentId) {
      const existingAgent = this.deployedAgents.get(existingAgentId);
      if (existingAgent && existingAgent.status === DeploymentStatus.ACTIVE) {
        // Reactivate existing agent
        existingAgent.lastActiveAt = new Date();
        return existingAgent;
      }
    }

    // Check resource limits
    if (this.deployedAgents.size >= this.config.maxConcurrentAgents) {
      throw new Error('Maximum concurrent agents limit reached');
    }

    // Generate unique agent ID
    const agentId = `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create deployed agent
    const deployedAgent: DeployedAgent = {
      agentId,
      sessionId,
      template,
      profile,
      status: DeploymentStatus.PENDING,
      createdAt: new Date(),
      lastActiveAt: new Date(),
      conversationStage: ConversationStage.IDEA_CLARITY,
      metadata: {
        version: '1.0.0',
        capabilities: this.extractCapabilities(template),
        resourceUsage: {
          memoryMB: 0,
          cpuPercent: 0,
          requestCount: 0
        }
      }
    };

    try {
      // Initialize agent with template configuration
      await this.initializeAgent(deployedAgent);
      
      deployedAgent.status = DeploymentStatus.DEPLOYED;
      
      // Store mappings
      this.deployedAgents.set(agentId, deployedAgent);
      this.sessionToAgent.set(sessionId, agentId);
      
      // Activate agent
      await this.activateAgent(agentId);
      
      console.log(`✅ Agent deployed successfully: ${agentId} for session: ${sessionId}`);
      return deployedAgent;
      
    } catch (error) {
      deployedAgent.status = DeploymentStatus.ERROR;
      console.error(`❌ Failed to deploy agent: ${agentId}`, error);
      throw new Error(`Agent deployment failed: ${error}`);
    }
  }

  /**
   * Get deployed agent for a session
   */
  getAgentForSession(sessionId: string): DeployedAgent | null {
    const agentId = this.sessionToAgent.get(sessionId);
    if (!agentId) return null;
    
    return this.deployedAgents.get(agentId) || null;
  }

  /**
   * Get deployed agent by ID
   */
  getAgent(agentId: string): DeployedAgent | null {
    return this.deployedAgents.get(agentId) || null;
  }

  /**
   * Update agent status
   */
  async updateAgentStatus(agentId: string, status: DeploymentStatus): Promise<void> {
    const agent = this.deployedAgents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    agent.status = status;
    agent.lastActiveAt = new Date();

    if (status === DeploymentStatus.TERMINATED) {
      await this.terminateAgent(agentId);
    }
  }

  /**
   * Update agent conversation stage
   */
  async updateAgentStage(agentId: string, stage: ConversationStage): Promise<void> {
    const agent = this.deployedAgents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    agent.conversationStage = stage;
    agent.lastActiveAt = new Date();
  }

  /**
   * Record agent activity and resource usage
   */
  async recordAgentActivity(agentId: string, resourceUsage?: Partial<DeployedAgent['metadata']['resourceUsage']>): Promise<void> {
    const agent = this.deployedAgents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    agent.lastActiveAt = new Date();
    agent.metadata.resourceUsage.requestCount++;

    if (resourceUsage) {
      Object.assign(agent.metadata.resourceUsage, resourceUsage);
    }

    // Check resource limits
    if (agent.metadata.resourceUsage.memoryMB > this.config.resourceLimits.maxMemoryMB) {
      console.warn(`⚠️ Agent ${agentId} exceeding memory limit`);
      await this.suspendAgent(agentId);
    }

    if (agent.metadata.resourceUsage.cpuPercent > this.config.resourceLimits.maxCpuPercent) {
      console.warn(`⚠️ Agent ${agentId} exceeding CPU limit`);
      await this.suspendAgent(agentId);
    }
  }

  /**
   * Suspend an agent (temporary)
   */
  async suspendAgent(agentId: string): Promise<void> {
    const agent = this.deployedAgents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    agent.status = DeploymentStatus.SUSPENDED;
    console.log(`⏸️ Agent suspended: ${agentId}`);
  }

  /**
   * Terminate an agent (permanent)
   */
  async terminateAgent(agentId: string): Promise<void> {
    const agent = this.deployedAgents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    // Cleanup resources
    await this.cleanupAgent(agent);
    
    // Remove from mappings
    this.deployedAgents.delete(agentId);
    this.sessionToAgent.delete(agent.sessionId);
    
    console.log(`🗑️ Agent terminated: ${agentId}`);
  }

  /**
   * Get all deployed agents
   */
  getAllAgents(): DeployedAgent[] {
    return Array.from(this.deployedAgents.values());
  }

  /**
   * Get agents by status
   */
  getAgentsByStatus(status: DeploymentStatus): DeployedAgent[] {
    return Array.from(this.deployedAgents.values()).filter(agent => agent.status === status);
  }

  /**
   * Get deployment metrics
   */
  getDeploymentMetrics() {
    const agents = Array.from(this.deployedAgents.values());
    
    return {
      totalAgents: agents.length,
      activeAgents: agents.filter(a => a.status === DeploymentStatus.ACTIVE).length,
      suspendedAgents: agents.filter(a => a.status === DeploymentStatus.SUSPENDED).length,
      errorAgents: agents.filter(a => a.status === DeploymentStatus.ERROR).length,
      averageMemoryUsage: agents.reduce((sum, a) => sum + a.metadata.resourceUsage.memoryMB, 0) / agents.length || 0,
      averageCpuUsage: agents.reduce((sum, a) => sum + a.metadata.resourceUsage.cpuPercent, 0) / agents.length || 0,
      totalRequests: agents.reduce((sum, a) => sum + a.metadata.resourceUsage.requestCount, 0),
      resourceUtilization: {
        memoryPercent: (agents.reduce((sum, a) => sum + a.metadata.resourceUsage.memoryMB, 0) / (this.config.resourceLimits.maxMemoryMB * agents.length)) * 100 || 0,
        cpuPercent: (agents.reduce((sum, a) => sum + a.metadata.resourceUsage.cpuPercent, 0) / (this.config.resourceLimits.maxCpuPercent * agents.length)) * 100 || 0
      }
    };
  }

  // Private helper methods

  private async initializeAgent(agent: DeployedAgent): Promise<void> {
    // Initialize agent with template configuration
    // This would set up the agent's question banks, terminology, etc.
    console.log(`🔧 Initializing agent ${agent.agentId} with template: ${agent.template.domain}`);
    
    // Simulate initialization time
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Set initial resource usage
    agent.metadata.resourceUsage.memoryMB = Math.floor(Math.random() * 50) + 20; // 20-70 MB
    agent.metadata.resourceUsage.cpuPercent = Math.floor(Math.random() * 10) + 5; // 5-15%
  }

  private async activateAgent(agentId: string): Promise<void> {
    const agent = this.deployedAgents.get(agentId);
    if (!agent) return;

    agent.status = DeploymentStatus.ACTIVE;
    console.log(`🚀 Agent activated: ${agentId}`);
  }

  private extractCapabilities(template: AgentTemplate): string[] {
    const capabilities = ['conversation', 'profiling'];
    
    if (template.domain) {
      capabilities.push(`domain-${template.domain}`);
    }
    
    if (template.questionBank && template.questionBank.length > 0) {
      capabilities.push('questioning');
    }
    
    if (template.assumptionTemplates && template.assumptionTemplates.length > 0) {
      capabilities.push('assumption-generation');
    }
    
    return capabilities;
  }

  private async cleanupAgent(agent: DeployedAgent): Promise<void> {
    // Cleanup agent resources
    console.log(`🧹 Cleaning up agent resources: ${agent.agentId}`);
    
    // Reset resource usage
    agent.metadata.resourceUsage = {
      memoryMB: 0,
      cpuPercent: 0,
      requestCount: 0
    };
  }

  private async cleanupInactiveAgents(): Promise<void> {
    const now = new Date();
    const agentsToCleanup: string[] = [];

    for (const [agentId, agent] of Array.from(this.deployedAgents.entries())) {
      const inactiveTime = now.getTime() - agent.lastActiveAt.getTime();
      const agentLifetime = now.getTime() - agent.createdAt.getTime();

      // Check idle timeout
      if (inactiveTime > this.config.timeouts.idleTimeoutMs) {
        console.log(`⏰ Agent ${agentId} idle timeout reached`);
        agentsToCleanup.push(agentId);
      }
      
      // Check max lifetime
      else if (agentLifetime > this.config.timeouts.maxLifetimeMs) {
        console.log(`⏰ Agent ${agentId} max lifetime reached`);
        agentsToCleanup.push(agentId);
      }
    }

    // Cleanup inactive agents
    for (const agentId of agentsToCleanup) {
      await this.terminateAgent(agentId);
    }

    if (agentsToCleanup.length > 0) {
      console.log(`🧹 Cleaned up ${agentsToCleanup.length} inactive agents`);
    }
  }
}

// Default configuration
const defaultConfig: DeploymentConfig = {
  maxConcurrentAgents: 100,
  resourceLimits: {
    maxMemoryMB: 500,
    maxCpuPercent: 80,
    maxRequestsPerMinute: 1000
  },
  timeouts: {
    idleTimeoutMs: 30 * 60 * 1000, // 30 minutes
    maxLifetimeMs: 24 * 60 * 60 * 1000 // 24 hours
  }
};

// Singleton instance for MVP
export const agentDeploymentManager = new AgentDeploymentManager(defaultConfig); 