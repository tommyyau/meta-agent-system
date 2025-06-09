import OpenAI from 'openai'
import { openaiConfig, env } from '@/lib/config/environment'

// OpenAI client configuration
const openai = new OpenAI({
  apiKey: openaiConfig.apiKey,
  organization: openaiConfig.orgId,
  timeout: openaiConfig.limits.timeout * 1000, // Convert to milliseconds
  maxRetries: 3,
  defaultHeaders: {
    'User-Agent': 'Meta-Agent-System/1.0.0',
  },
})

// Rate limiting tracking
interface RateLimitState {
  requests: number
  resetTime: number
  dailyUsage: number
  monthlyBudget: number
}

class OpenAIRateLimiter {
  private state: RateLimitState = {
    requests: 0,
    resetTime: Date.now() + 60000, // Reset every minute
    dailyUsage: 0,
    monthlyBudget: 0,
  }

  private getDailyUsageKey(): string {
    const today = new Date().toISOString().split('T')[0]
    return `openai:daily:${today}`
  }

  private getMonthlyBudgetKey(): string {
    const month = new Date().toISOString().slice(0, 7) // YYYY-MM
    return `openai:budget:${month}`
  }

  async checkRateLimit(): Promise<boolean> {
    const now = Date.now()
    
    // Reset minute counter if needed
    if (now > this.state.resetTime) {
      this.state.requests = 0
      this.state.resetTime = now + 60000
    }

    // Check minute rate limit
    if (this.state.requests >= openaiConfig.limits.rateLimit) {
      throw new Error(`Rate limit exceeded: ${openaiConfig.limits.rateLimit} requests per minute`)
    }

    // Check daily quota
    if (this.state.dailyUsage >= openaiConfig.limits.dailyQuota) {
      throw new Error(`Daily quota exceeded: ${openaiConfig.limits.dailyQuota} requests per day`)
    }

    return true
  }

  incrementUsage(): void {
    this.state.requests++
    this.state.dailyUsage++
  }

  async trackCost(usage: OpenAI.Completions.CompletionUsage): Promise<void> {
    // Approximate cost calculation (GPT-4: $0.03/1K input, $0.06/1K output)
    const inputCost = (usage.prompt_tokens / 1000) * 0.03
    const outputCost = (usage.completion_tokens / 1000) * 0.06
    const totalCost = inputCost + outputCost

    this.state.monthlyBudget += totalCost

    if (this.state.monthlyBudget > openaiConfig.limits.monthlyBudget) {
      console.warn(`Monthly budget warning: $${this.state.monthlyBudget.toFixed(2)} / $${openaiConfig.limits.monthlyBudget}`)
    }
  }
}

const rateLimiter = new OpenAIRateLimiter()

// Custom error classes
export class OpenAIError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public originalError?: any
  ) {
    super(message)
    this.name = 'OpenAIError'
  }
}

export class OpenAIRateLimitError extends OpenAIError {
  constructor(message: string, retryAfter?: number) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429)
    this.retryAfter = retryAfter
  }
  public retryAfter?: number
}

export class OpenAIQuotaExceededError extends OpenAIError {
  constructor(message: string) {
    super(message, 'QUOTA_EXCEEDED', 429)
  }
}

// Request options interface
export interface OpenAIRequestOptions {
  model?: string
  maxTokens?: number
  temperature?: number
  usesFallback?: boolean
  retries?: number
  timeout?: number
}

// Completion request interface
export interface CompletionRequest {
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]
  options?: OpenAIRequestOptions
}

// OpenAI service class
export class OpenAIService {
  private client: OpenAI

  constructor() {
    this.client = openai
  }

  /**
   * Create a chat completion with rate limiting and error handling
   */
  async createCompletion(request: CompletionRequest): Promise<OpenAI.Chat.Completions.ChatCompletion> {
    const { messages, options = {} } = request

    try {
      // Check rate limits
      await rateLimiter.checkRateLimit()
      
      // Prepare request parameters
      const model = options.model || openaiConfig.models.primary
      const maxTokens = options.maxTokens || openaiConfig.limits.maxTokens
      const temperature = options.temperature ?? openaiConfig.limits.temperature

      // Make the API request
      const response = await this.client.chat.completions.create({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
      }, {
        timeout: options.timeout || openaiConfig.limits.timeout * 1000,
      })

      // Track usage
      rateLimiter.incrementUsage()
      if (response.usage) {
        await rateLimiter.trackCost(response.usage)
      }

      return response

    } catch (error: any) {
      return this.handleError(error, request, options)
    }
  }

  /**
   * Create a completion with automatic fallback to cheaper model
   */
  async createCompletionWithFallback(request: CompletionRequest): Promise<OpenAI.Chat.Completions.ChatCompletion> {
    try {
      // Try primary model first
      return await this.createCompletion(request)
    } catch (error: any) {
      // If it's a rate limit or quota error, try fallback model
      if (this.shouldUseFallback(error)) {
        console.warn(`Primary model failed, using fallback: ${openaiConfig.models.fallback}`)
        
        const fallbackRequest = {
          ...request,
          options: {
            ...request.options,
            model: openaiConfig.models.fallback,
            usesFallback: true,
          }
        }
        
        return await this.createCompletion(fallbackRequest)
      }
      
      throw error
    }
  }

  /**
   * Stream a chat completion
   */
  async *streamCompletion(request: CompletionRequest): AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk> {
    const { messages, options = {} } = request

    try {
      await rateLimiter.checkRateLimit()

      const model = options.model || openaiConfig.models.primary
      const maxTokens = options.maxTokens || openaiConfig.limits.maxTokens
      const temperature = options.temperature ?? openaiConfig.limits.temperature

      const stream = await this.client.chat.completions.create({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
        stream: true,
      }, {
        timeout: options.timeout || openaiConfig.limits.timeout * 1000,
      })

      rateLimiter.incrementUsage()

      for await (const chunk of stream) {
        yield chunk
      }

    } catch (error: any) {
      throw this.handleError(error, request, options)
    }
  }

  /**
   * Test the OpenAI connection
   */
  async testConnection(): Promise<{ success: boolean; message: string; model?: string }> {
    try {
      const response = await this.createCompletion({
        messages: [
          { role: 'user', content: 'Say "Connection test successful"' }
        ],
        options: {
          model: openaiConfig.models.fallback, // Use cheaper model for testing
          maxTokens: 10,
          temperature: 0,
        }
      })

      const content = response.choices[0]?.message?.content?.trim()
      
      return {
        success: true,
        message: content || 'Test completed successfully',
        model: response.model,
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Connection test failed',
      }
    }
  }

  /**
   * Get current usage statistics
   */
  getUsageStats(): {
    currentMinuteRequests: number
    dailyUsage: number
    monthlyBudget: number
    limits: typeof openaiConfig.limits
  } {
    return {
      currentMinuteRequests: rateLimiter['state'].requests,
      dailyUsage: rateLimiter['state'].dailyUsage,
      monthlyBudget: rateLimiter['state'].monthlyBudget,
      limits: openaiConfig.limits,
    }
  }

  /**
   * Handle OpenAI API errors
   */
  private async handleError(error: any, request: CompletionRequest, options: OpenAIRequestOptions): Promise<never> {
    // OpenAI SDK errors
    if (error instanceof OpenAI.APIError) {
      switch (error.status) {
        case 401:
          throw new OpenAIError('Invalid API key', 'INVALID_API_KEY', 401, error)
        case 403:
          throw new OpenAIError('Insufficient permissions', 'INSUFFICIENT_PERMISSIONS', 403, error)
        case 429:
          throw new OpenAIRateLimitError('Rate limit exceeded', error.headers?.['retry-after'])
        case 500:
        case 502:
        case 503:
        case 504:
          throw new OpenAIError('OpenAI service unavailable', 'SERVICE_UNAVAILABLE', error.status, error)
        default:
          throw new OpenAIError(error.message, 'API_ERROR', error.status, error)
      }
    }

    // Network errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw new OpenAIError('Network connection failed', 'NETWORK_ERROR', undefined, error)
    }

    // Timeout errors
    if (error.code === 'ETIMEDOUT' || error.name === 'TimeoutError') {
      throw new OpenAIError('Request timed out', 'TIMEOUT', undefined, error)
    }

    // Custom rate limit errors
    if (error.message.includes('Rate limit exceeded') || error.message.includes('quota exceeded')) {
      throw new OpenAIQuotaExceededError(error.message)
    }

    // Generic error
    throw new OpenAIError(error.message || 'Unknown OpenAI error', 'UNKNOWN_ERROR', undefined, error)
  }

  /**
   * Check if we should use fallback model
   */
  private shouldUseFallback(error: any): boolean {
    return (
      error instanceof OpenAIRateLimitError ||
      error instanceof OpenAIQuotaExceededError ||
      (error.code && ['RATE_LIMIT_EXCEEDED', 'QUOTA_EXCEEDED', 'SERVICE_UNAVAILABLE'].includes(error.code))
    )
  }

  /**
   * Validate API key format
   */
  static validateApiKey(apiKey: string): boolean {
    return apiKey.startsWith('sk-') && apiKey.length > 20
  }
}

// Export singleton instance
export const openaiService = new OpenAIService()

// Export types (interfaces are already exported above)

// Export OpenAI types for convenience
export type ChatCompletion = OpenAI.Chat.Completions.ChatCompletion
export type ChatCompletionChunk = OpenAI.Chat.Completions.ChatCompletionChunk
export type ChatCompletionMessage = OpenAI.Chat.Completions.ChatCompletionMessage
export type ChatCompletionMessageParam = OpenAI.Chat.Completions.ChatCompletionMessageParam 