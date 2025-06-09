# Services Directory

This directory contains all business logic and external service integrations organized by domain.

## Directory Structure

### `/auth` - Authentication Services
User authentication and authorization:
- `auth.service.ts` - Core authentication logic
- `session.service.ts` - Session management
- `permissions.service.ts` - User permissions

### `/agents` - Agent Management Services
Agent creation, configuration, and lifecycle:
- `agent-factory.service.ts` - Agent creation logic
- `agent-config.service.ts` - Agent configuration
- `agent-deployment.service.ts` - Agent deployment

### `/conversation` - Conversation Flow Services
Conversation management and orchestration:
- `conversation.service.ts` - Core conversation logic
- `stage-manager.service.ts` - Stage progression
- `context.service.ts` - Context preservation

### `/profiling` - User Profiling Services
User analysis and profile detection:
- `profile-detection.service.ts` - Industry/role detection
- `sophistication-scoring.service.ts` - User sophistication analysis
- `profile-correction.service.ts` - Profile updates

### `/assumptions` - Assumption Generation Services
Assumption creation and management:
- `assumption-generator.service.ts` - AI-powered assumption creation
- `assumption-cascade.service.ts` - Dependency management
- `assumption-validation.service.ts` - Assumption validation

### `/wireframes` - Wireframe Generation Services
Professional wireframe creation:
- `wireframe-generator.service.ts` - Core wireframe generation
- `template-manager.service.ts` - Template management
- `export.service.ts` - Export functionality

### `/analytics` - Analytics Services
Usage tracking and performance monitoring:
- `analytics.service.ts` - Core analytics
- `metrics.service.ts` - Metrics collection
- `reporting.service.ts` - Report generation

### `/integrations` - External Service Integrations
Third-party service wrappers:
- `openai.service.ts` - OpenAI API integration
- `supabase.service.ts` - Database operations
- `redis.service.ts` - Caching operations
- `email.service.ts` - Email notifications

## Service Architecture

### 1. Service Structure
```typescript
// example.service.ts
export interface ExampleServiceInterface {
  create(data: CreateData): Promise<Result>
  update(id: string, data: UpdateData): Promise<Result>
  delete(id: string): Promise<void>
  findById(id: string): Promise<Result | null>
}

class ExampleService implements ExampleServiceInterface {
  async create(data: CreateData): Promise<Result> {
    // Implementation
  }
  
  async update(id: string, data: UpdateData): Promise<Result> {
    // Implementation
  }
  
  async delete(id: string): Promise<void> {
    // Implementation
  }
  
  async findById(id: string): Promise<Result | null> {
    // Implementation
  }
}

export const exampleService = new ExampleService()
```

### 2. Error Handling
```typescript
import { ServiceError } from '@/lib/errors'

export class ProfileDetectionService {
  async detectIndustry(input: string): Promise<Industry> {
    try {
      // Service logic
      return result
    } catch (error) {
      throw new ServiceError(
        'Failed to detect industry',
        'PROFILE_DETECTION_ERROR',
        { input, originalError: error }
      )
    }
  }
}
```

### 3. Dependency Injection
```typescript
interface ServiceDependencies {
  database: DatabaseService
  cache: CacheService
  logger: LoggerService
}

export class ConversationService {
  constructor(private deps: ServiceDependencies) {}
  
  async createConversation(data: ConversationData) {
    // Use this.deps.database, this.deps.cache, etc.
  }
}
```

## Service Guidelines

### 1. Single Responsibility
- Each service should have a single, well-defined purpose
- Keep services focused on specific business domains
- Avoid mixing concerns across different domains

### 2. Stateless Design
- Services should be stateless and functional
- Use dependency injection for external dependencies
- Avoid global state within services

### 3. Error Handling
- Implement comprehensive error handling
- Use typed errors with meaningful messages
- Log errors appropriately for debugging

### 4. Testing
- Write unit tests for all service methods
- Mock external dependencies in tests
- Test error scenarios and edge cases

### 5. Documentation
- Document service interfaces and methods
- Include usage examples
- Document error conditions and return types

## Integration Patterns

### 1. Database Operations
```typescript
export const userService = {
  async create(userData: CreateUserData): Promise<User> {
    const user = await database.user.create(userData)
    await cache.set(`user:${user.id}`, user, 3600)
    return user
  }
}
```

### 2. External API Calls
```typescript
export const openaiService = {
  async generateCompletion(prompt: string): Promise<string> {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
    })
    
    return response.choices[0]?.message?.content || ''
  }
}
```

### 3. Event-Driven Architecture
```typescript
import { EventEmitter } from 'events'

export const conversationService = {
  events: new EventEmitter(),
  
  async progressStage(conversationId: string) {
    // Progress logic
    this.events.emit('stageProgressed', { conversationId, stage })
  }
}
``` 