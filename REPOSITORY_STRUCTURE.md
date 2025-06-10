# Meta-Agent System - Repository Structure

This document defines the standardized repository structure and organization for the Meta-Agent System codebase.

## 🎯 **System Architecture**

The Meta-Agent System is a **dynamic conversation engine** using GPT-4 for intelligent, adaptive conversations:
- **No traditional database** - In-memory sessions with Redis caching
- **Dynamic question generation** - No static question banks  
- **Real-time adaptation** - Responds to user sophistication and escape signals
- **Professional wireframe output** - From conversation insights

## Directory Structure Overview

```
meta-agent-system/
├── app/                          # Next.js 13+ App Router
│   ├── (conversation)/           # Route groups for conversation flows
│   ├── (wireframes)/             # Route groups for wireframe generation
│   ├── api/                      # API route handlers
│   │   ├── conversation/         # Dynamic conversation endpoints
│   │   ├── profile/              # Profile detection endpoints
│   │   ├── openai/               # OpenAI integration endpoints
│   │   └── wireframes/           # Wireframe generation endpoints
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout component
│   └── page.tsx                  # Home page component
├── components/                   # Reusable UI components
│   ├── ui/                       # Base UI components (buttons, inputs, etc.)
│   ├── conversation/             # Dynamic conversation components
│   │   ├── ConversationFlow.tsx  # Main conversation orchestrator
│   │   ├── QuestionDisplay.tsx   # Dynamic question rendering
│   │   ├── ResponseInput.tsx     # User response capture
│   │   └── ProgressTracker.tsx   # Conversation stage tracking
│   ├── assumptions/              # Assumption display and editing
│   ├── wireframes/               # Wireframe generation and display
│   ├── profile/                  # Profile detection UI
│   └── analytics/                # Conversation analytics (optional)
├── lib/                          # Core system libraries
│   ├── types/                    # TypeScript type definitions
│   │   ├── conversation.ts       # Conversation flow types
│   │   ├── profile.ts            # User profile types
│   │   ├── agent-types.ts        # Agent template types
│   │   └── assumptions.ts        # Assumption generation types
│   ├── conversation/             # Conversation management
│   │   ├── state-manager.ts      # Session state tracking
│   │   ├── dynamic-generator.ts  # GPT-4 question generation
│   │   └── escape-detector.ts    # Escape signal detection
│   ├── profile/                  # Profile detection system
│   │   ├── profile-detector.ts   # Main profile analysis
│   │   ├── industry-classifier.ts # Industry detection
│   │   ├── role-detector.ts      # Role classification
│   │   └── sophistication-scorer.ts # Sophistication assessment
│   ├── agents/                   # Agent template management
│   │   ├── template-manager.ts   # Agent template CRUD
│   │   ├── deployment-manager.ts # Agent deployment
│   │   └── domain-expertise.ts   # Domain-specific prompts
│   ├── openai/                   # OpenAI API integration
│   │   ├── client.ts             # OpenAI client with rate limiting
│   │   ├── cost-monitor.ts       # Cost tracking and budgets
│   │   └── prompt-templates.ts   # Dynamic prompt generation
│   ├── assumptions/              # Assumption generation
│   │   ├── generator.ts          # Context-aware assumption creation
│   │   └── cascade-updater.ts    # Dependency tracking
│   ├── wireframes/               # Wireframe generation
│   │   ├── generator.ts          # Professional wireframe creation
│   │   └── exporter.ts           # Multiple format export
│   ├── auth/                     # Lightweight authentication
│   ├── config/                   # Environment configuration
│   └── utils/                    # General utilities
├── services/                     # Business logic services (lightweight)
│   ├── conversation-service.ts   # Conversation orchestration
│   ├── profile-service.ts        # Profile detection service
│   ├── assumption-service.ts     # Assumption management
│   └── analytics-service.ts      # Optional conversation analytics
├── tests/                        # Test files
│   ├── unit/                     # Unit tests
│   │   ├── conversation/         # Conversation logic tests
│   │   ├── profile/              # Profile detection tests
│   │   └── openai/               # OpenAI integration tests
│   ├── integration/              # Integration tests
│   │   ├── conversation-flow.test.ts # End-to-end conversation tests
│   │   └── agent-deployment.test.ts  # Agent template tests
│   ├── e2e/                      # Browser automation tests
│   └── fixtures/                 # Test data and mocks
├── docs/                         # Documentation
│   ├── ARCHITECTURE.md           # System architecture overview
│   ├── CONVERSATION_FLOW.md      # Dynamic conversation documentation
│   ├── PROFILE_DETECTION.md      # Profile detection algorithms
│   └── DEPLOYMENT.md             # Deployment guides
├── scripts/                      # Development and testing scripts
│   ├── test-openai.js            # OpenAI API integration test
│   ├── test-conversation-state.js # Conversation flow testing
│   ├── test-profile-detection.js # Profile detection testing
│   ├── setup-env.js              # Interactive environment setup
│   ├── validate-env.js           # Environment validation
│   └── debug-profile.js          # Profile detection debugging
├── config/                       # Configuration management
│   ├── environment.template      # Environment variable template
│   ├── environment.development.template # Development config
│   ├── environment.production.template  # Production config
│   └── conversation-stages.ts    # Conversation stage definitions
├── infrastructure/               # Deployment infrastructure
│   ├── vercel/                   # Vercel deployment configs
│   ├── docker-compose.yml        # Redis for local development
│   └── monitoring/               # Monitoring configurations
└── public/                       # Static assets
    ├── images/                   # Image assets
    ├── icons/                    # Icon assets
    └── examples/                 # Example wireframes and conversations
```

## 🗑️ **What We DON'T Have (By Design)**

### No Traditional Database Infrastructure
- ❌ `database/` directory - No PostgreSQL/MySQL schemas
- ❌ `migrations/` - No database migrations
- ❌ `seeds/` - No static data seeding
- ❌ Database ORMs (Prisma, TypeORM) - Not needed
- ❌ Question banks tables - Dynamic generation instead

### No Static Content Management
- ❌ `lib/data/` directory - No static question files
- ❌ Question bank APIs - Dynamic conversation instead
- ❌ Static wireframe templates - Generated from conversations
- ❌ Predetermined conversation flows - Adaptive based on user

## 🏗️ **Core Architecture Patterns**

### 1. Dynamic Conversation Engine
```typescript
// lib/conversation/dynamic-generator.ts
export class DynamicConversationEngine {
  async generateNextQuestion(context: ConversationContext): Promise<Question>
  async analyzeResponse(response: string): Promise<ResponseAnalysis>
  async detectEscapeSignals(context: ConversationContext): Promise<boolean>
}
```

### 2. Profile Detection System
```typescript
// lib/profile/profile-detector.ts  
export class ProfileDetector {
  async detectIndustry(text: string): Promise<IndustryClassification>
  async detectRole(text: string): Promise<RoleClassification>
  async scoreSophistication(text: string): Promise<SophisticationScore>
}
```

### 3. Session Management (In-Memory)
```typescript
// lib/conversation/state-manager.ts
export class ConversationStateManager {
  async createSession(userId: string): Promise<ConversationSession>
  async updateContext(sessionId: string, context: Partial<ConversationContext>): Promise<void>
  async getHistory(sessionId: string): Promise<ConversationHistory>
}
```

## File Organization Principles

### 1. Conversation-Centric Organization
- Everything organized around dynamic conversation flow
- Clear separation between static UI and dynamic logic
- AI integration as first-class citizen

### 2. Layer-Based Architecture
- **app/**: Presentation layer (Next.js routes)
- **components/**: UI layer (conversation-focused components)
- **lib/**: Core conversation logic and AI integration
- **services/**: Business orchestration (lightweight)
- **No database layer**: In-memory + Redis only

### 3. Import Path Structure
```typescript
// Dynamic conversation imports
import { DynamicConversationEngine } from '@/lib/conversation/dynamic-generator'
import { ProfileDetector } from '@/lib/profile/profile-detector'
import { OpenAIClient } from '@/lib/openai/client'
import { ConversationStateManager } from '@/lib/conversation/state-manager'

// UI component imports
import { ConversationFlow } from '@/components/conversation/ConversationFlow'
import { QuestionDisplay } from '@/components/conversation/QuestionDisplay'
```

## Directory Responsibilities

### `/lib/conversation` - Dynamic Conversation Engine
- **Real-time question generation** using GPT-4
- **Context-aware conversation flow** management
- **Escape signal detection** and response
- **Session state management** (in-memory)

### `/lib/profile` - Profile Detection System
- **Industry classification** with high accuracy
- **Role detection** (technical/business/hybrid)
- **Sophistication scoring** based on language patterns
- **Real-time profile refinement** during conversation

### `/lib/openai` - AI Integration
- **GPT-4 API client** with rate limiting and cost monitoring
- **Dynamic prompt generation** for different domains
- **Error handling and fallbacks** for API failures
- **Cost optimization** and budget management

### `/components/conversation` - Conversation UI
- **Dynamic question rendering** with context
- **Progressive conversation display** 
- **Real-time assumption tracking**
- **Escape hatch UI** with smart defaults

### `/services` - Business Orchestration
- **Lightweight coordination** between components
- **No heavy business logic** (moved to lib/)
- **API endpoint implementations**
- **Optional analytics coordination**

## 🧪 **Testing Strategy**

### Unit Tests
```typescript
// Test dynamic conversation logic
describe('DynamicConversationEngine', () => {
  test('generates contextually appropriate questions', async () => {
    // Test question generation based on context
  })
  
  test('adapts to user sophistication level', async () => {
    // Test sophistication-based adaptation
  })
})
```

### Integration Tests
```typescript
// Test full conversation flows
describe('Conversation Integration', () => {
  test('complete user journey from start to wireframe', async () => {
    // Test end-to-end conversation flow
  })
})
```

## 🚀 **Development Commands**

### Core Testing
```bash
npm run test:conversation    # Test conversation logic
npm run test:profile        # Test profile detection
npm run test:openai         # Test OpenAI integration
npm run test:services       # Test all services
```

### Environment Management
```bash
npm run setup:env          # Interactive environment setup
npm run validate:env       # Validate configuration
npm run debug:env          # Debug environment issues
```

## 🎯 **Key Principles**

1. **Dynamic Over Static**: Generate content in real-time vs pre-written content
2. **Context-Aware**: Every decision based on conversation history and user profile
3. **Lightweight Storage**: Minimal data persistence, maximum conversation intelligence
4. **AI-First**: GPT-4 as the core conversation engine, not just a helper
5. **Professional Output**: Investor-ready wireframes from natural conversations

---

**Last Updated**: December 2024  
**Version**: 2.0.0 (Dynamic Conversation Architecture) 