# Meta-Agent System - Repository Structure

This document defines the standardized repository structure and organization for the Meta-Agent System codebase.

## Directory Structure Overview

```
meta-agent-system/
├── app/                          # Next.js 13+ App Router
│   ├── (auth)/                   # Route groups for authentication
│   ├── (dashboard)/              # Route groups for dashboard
│   ├── api/                      # API route handlers
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout component
│   └── page.tsx                  # Home page component
├── components/                   # Reusable UI components
│   ├── ui/                       # Base UI components (buttons, inputs, etc.)
│   ├── forms/                    # Form components
│   ├── layout/                   # Layout components (header, sidebar, etc.)
│   ├── agents/                   # Agent-specific components
│   ├── conversation/             # Conversation flow components
│   ├── wireframes/               # Wireframe generation components
│   └── analytics/                # Analytics and monitoring components
├── lib/                          # Utility libraries and configurations
│   ├── types/                    # TypeScript type definitions
│   ├── utils/                    # General utility functions
│   ├── validations/              # Zod schemas and validations
│   ├── api/                      # API client functions
│   ├── auth/                     # Authentication utilities
│   ├── database/                 # Database utilities and queries
│   ├── openai/                   # OpenAI integration utilities
│   ├── agents/                   # Agent management utilities
│   └── constants/                # Application constants
├── hooks/                        # Custom React hooks
│   ├── use-auth.ts               # Authentication hooks
│   ├── use-agents.ts             # Agent management hooks
│   ├── use-conversation.ts       # Conversation flow hooks
│   └── use-analytics.ts          # Analytics hooks
├── services/                     # Business logic and external services
│   ├── auth/                     # Authentication services
│   ├── agents/                   # Agent creation and management
│   ├── conversation/             # Conversation flow management
│   ├── profiling/                # User profiling services
│   ├── assumptions/              # Assumption generation services
│   ├── wireframes/               # Wireframe generation services
│   ├── analytics/                # Analytics and tracking services
│   └── integrations/             # External service integrations
├── database/                     # Database schemas and migrations
│   ├── migrations/               # Database migration files
│   ├── schemas/                  # Database schema definitions
│   ├── seeds/                    # Database seed data
│   └── types/                    # Database type definitions
├── tests/                        # Test files
│   ├── unit/                     # Unit tests
│   ├── integration/              # Integration tests
│   ├── e2e/                      # End-to-end tests
│   ├── fixtures/                 # Test data and fixtures
│   └── utils/                    # Test utilities
├── docs/                         # Documentation
│   ├── api/                      # API documentation
│   ├── architecture/             # Architecture documentation
│   ├── deployment/               # Deployment guides
│   └── user-guide/               # User guides
├── scripts/                      # Build and deployment scripts
│   ├── build/                    # Build scripts
│   ├── deployment/               # Deployment scripts
│   ├── database/                 # Database utility scripts
│   └── development/              # Development utility scripts
├── config/                       # Configuration files
│   ├── environment.template      # Environment variable template
│   ├── database.config.ts        # Database configuration
│   ├── auth.config.ts            # Authentication configuration
│   └── constants.ts              # Configuration constants
├── infrastructure/               # Infrastructure and deployment
│   ├── docker/                   # Docker configurations
│   ├── vercel/                   # Vercel deployment configs
│   ├── monitoring/               # Monitoring configurations
│   └── deployment/               # Deployment configurations
├── public/                       # Static assets
│   ├── images/                   # Image assets
│   ├── icons/                    # Icon assets
│   ├── fonts/                    # Font files
│   └── docs/                     # Public documentation
└── ai-dev-tasks/                 # AI development task management
    ├── process-task-list.mdc     # Task management guidelines
    ├── create-prd.mdc            # PRD creation guidelines
    └── generate-tasks.mdc        # Task generation guidelines
```

## File Organization Principles

### 1. Feature-Based Organization
- Group related functionality together
- Maintain clear separation of concerns
- Enable easy navigation and discovery

### 2. Layer-Based Architecture
- **app/**: Presentation layer (Next.js routes and pages)
- **components/**: UI layer (reusable React components)
- **services/**: Business logic layer
- **lib/**: Utility layer (helpers, configurations)
- **database/**: Data layer (schemas, migrations)

### 3. Import Path Structure
Use absolute imports with path mapping configured in `tsconfig.json`:

```typescript
// Import examples
import { Button } from '@/components/ui/button'
import { userProfileService } from '@/services/profiling'
import { UserProfile } from '@/lib/types/user'
import { validateUserInput } from '@/lib/validations/user'
```

## Directory Responsibilities

### `/app` - Next.js App Router
- **Route Groups**: Use parentheses for route organization without affecting URL structure
- **API Routes**: RESTful API endpoints in `/app/api`
- **Layouts**: Shared layouts for different sections
- **Pages**: Route-specific page components

### `/components` - React Components
- **ui/**: Atomic design components (buttons, inputs, cards)
- **forms/**: Complex form components with validation
- **layout/**: Application layout components
- **Feature folders**: Components specific to business features

### `/services` - Business Logic
- **Pure functions**: Stateless business logic
- **External integrations**: Third-party service wrappers
- **Domain services**: Feature-specific business operations

### `/lib` - Utilities and Configuration
- **types/**: Shared TypeScript definitions
- **utils/**: Pure utility functions
- **validations/**: Schema validation using Zod
- **constants/**: Application-wide constants

### `/tests` - Testing
- **Mirror structure**: Test files mirror the source structure
- **Shared utilities**: Common test helpers and fixtures
- **Test types**: Unit, integration, and E2E test separation

## Naming Conventions

### Files and Folders
- **kebab-case**: For file and folder names (`user-profile.ts`)
- **PascalCase**: For React component files (`UserProfile.tsx`)
- **camelCase**: For utility functions and variables
- **UPPER_CASE**: For constants and environment variables

### Components
```typescript
// Component file: UserProfileForm.tsx
export default function UserProfileForm() {
  // Component implementation
}

// Named export for testing
export { UserProfileForm }
```

### Services
```typescript
// Service file: user-profile.service.ts
export const userProfileService = {
  create: async (data: UserProfileData) => { /* */ },
  update: async (id: string, data: Partial<UserProfileData>) => { /* */ },
  delete: async (id: string) => { /* */ },
}
```

### Types
```typescript
// Type file: user.types.ts
export interface UserProfile {
  id: string
  industry: Industry
  role: UserRole
  sophistication: SophisticationLevel
}

export type UserRole = 'technical' | 'business' | 'hybrid'
```

## Git Branching Strategy

### Branch Types
- **main**: Production-ready code
- **develop**: Integration branch for features
- **feature/**: New feature development
- **bugfix/**: Bug fixes
- **hotfix/**: Emergency production fixes
- **release/**: Release preparation

### Branch Naming Convention
```
feature/agent-profile-detection
bugfix/conversation-flow-error
hotfix/openai-api-timeout
release/v1.0.0
```

### Workflow
1. **Feature Development**:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   # Make changes
   git commit -m "feat: add feature description"
   git push origin feature/your-feature-name
   # Create PR to develop
   ```

2. **Release Process**:
   ```bash
   git checkout develop
   git checkout -b release/v1.0.0
   # Final testing and bug fixes
   git checkout main
   git merge release/v1.0.0
   git tag v1.0.0
   git checkout develop
   git merge release/v1.0.0
   ```

## Code Organization Best Practices

### 1. Index Files
Use `index.ts` files for clean imports:

```typescript
// components/ui/index.ts
export { Button } from './button'
export { Input } from './input'
export { Card } from './card'

// Usage
import { Button, Input, Card } from '@/components/ui'
```

### 2. Barrel Exports
Group related exports in barrel files:

```typescript
// services/index.ts
export * from './auth'
export * from './agents'
export * from './conversation'
```

### 3. Feature Folders
Organize complex features in dedicated folders:

```
features/
├── conversation-flow/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   ├── types/
│   └── index.ts
```

## Quality Assurance

### 1. Code Standards
- **ESLint**: Enforce coding standards
- **Prettier**: Consistent code formatting
- **TypeScript**: Strong typing for better maintainability

### 2. Testing Requirements
- **Unit tests**: All utility functions and services
- **Component tests**: All React components
- **Integration tests**: API endpoints and workflows
- **E2E tests**: Critical user journeys

### 3. Documentation
- **README files**: In each major directory
- **Inline comments**: For complex business logic
- **Type annotations**: Comprehensive TypeScript coverage

---

**Last Updated**: June 2025  
**Version**: 1.0.0 