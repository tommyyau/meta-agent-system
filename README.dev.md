# Meta-Agent System - Development Environment Setup

This document provides comprehensive instructions for setting up a standardized development environment for the Meta-Agent System.

## 🎯 **System Overview**

The Meta-Agent System is a **dynamic conversation engine** that uses GPT-4 to conduct intelligent, adaptive conversations with users. Instead of static question banks, the system:

- **Dynamically generates questions** based on user responses and expertise level
- **Adapts in real-time** to user sophistication (novice → expert → impatient)
- **Detects escape signals** and pivots to assumption generation seamlessly  
- **Uses in-memory session storage** with Redis caching (no traditional database)
- **Generates professional wireframes** based on conversation insights

## Prerequisites

### Required Software

1. **Node.js** - Version 18.18.0 (specified in `.nvmrc`)
   ```bash
   # Install Node Version Manager (nvm) if not already installed
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   
   # Use the project's Node.js version
   nvm use
   ```

2. **Package Manager** - npm >= 8.0.0 (comes with Node.js 18+)
   ```bash
   npm --version  # Should be 8.0.0 or higher
   ```

3. **Git** - Latest stable version
4. **Docker** (optional, for Redis development)
5. **VS Code** (recommended IDE with extensions)

## Environment Setup

### 1. Clone and Install Dependencies

```bash
git clone https://github.com/your-org/meta-agent-system.git
cd meta-agent-system
nvm use  # Uses Node.js version from .nvmrc
npm install
```

### 2. Environment Configuration

```bash
# Interactive environment setup (recommended)
npm run setup:env

# Or manually copy template
cp config/environment.template .env.local
```

#### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key for dynamic conversations | `sk-...` |
| `UPSTASH_REDIS_REST_URL` | Redis cache URL for sessions | `https://xxx.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | Redis authentication token | `AXXXaaa...` |
| `NEXTAUTH_SECRET` | NextAuth secret key | Random 32+ char string |
| `SESSION_STORAGE` | Session storage type | `memory` |
| `MAX_CONVERSATION_HISTORY` | Max conversation items | `50` |

### 3. Development Scripts

```bash
# Start development server
npm run dev

# Run tests
npm test                 # All tests
npm run test:unit       # Unit tests only  
npm run test:integration # Integration tests
npm run test:e2e        # End-to-end tests

# Code quality
npm run lint            # ESLint
npm run format          # Prettier formatting
npm run format:check    # Check formatting
npm run type-check      # TypeScript type checking

# System tests
npm run test:openai     # Test OpenAI integration
npm run test:conversation # Test conversation state management
npm run test:profile    # Test profile detection
npm run test:services   # Test all services

# Environment validation
npm run validate:env    # Validate all environment variables
npm run debug:env      # Debug environment configuration
```

## 🏗️ **Architecture Overview**

### Dynamic Conversation Flow

```
User Input → GPT-4 Analysis → Dynamic Question Generation → Context Update
     ↓
Profile Detection + Sophistication Assessment + Escape Detection  
     ↓
Next Question OR Assumption Generation (seamless pivot)
     ↓
Professional Wireframe Generation
```

### Core Components

- **Dynamic Conversation Engine** (`lib/conversation/`) - Real-time question generation
- **Profile Detection** (`lib/profile/`) - Industry, role, and sophistication analysis  
- **Agent Templates** (`lib/agents/`) - Domain expertise prompts (no static data)
- **Session Management** (`lib/conversation/state-manager.ts`) - In-memory conversation tracking
- **OpenAI Integration** (`lib/openai/`) - GPT-4 API with rate limiting and cost monitoring

### No Traditional Database

- **Sessions**: In-memory storage with Redis caching
- **Conversations**: Dynamic GPT-4 generation, no static question banks
- **Analytics**: Optional Redis storage with configurable TTL
- **User Data**: Lightweight session-based storage only

## Development Workflow

### 1. Code Standards

- **TypeScript**: All code must be TypeScript with strict mode
- **ESLint**: Follow project ESLint configuration
- **Prettier**: Auto-format on save
- **Testing**: Minimum 80% code coverage required

### 2. Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: description of changes"

# Push and create PR
git push origin feature/your-feature-name
```

### 3. Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

## IDE Configuration

### VS Code Extensions (Recommended)

Install these extensions for optimal development experience:

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.eslint",
    "ms-playwright.playwright",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-json"
  ]
}
```

### VS Code Settings

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.enableRenameShorthandObjectProperties": false,
  "typescript.updateImportsOnFileMove.enabled": "always"
}
```

## 🧪 **Testing Strategy**

### Unit Tests
- Test conversation logic and profile detection
- Use Jest + React Testing Library
- Minimum 80% coverage required

### Integration Tests  
- Test OpenAI API integration and conversation flows
- Use Jest with mocked external services

### E2E Tests
- Test complete user conversation journeys
- Use Playwright for browser automation

### Running Tests

```bash
# Watch mode during development
npm run test -- --watch

# Coverage report
npm run test:coverage

# Test specific component
npm test lib/profile/profile-detector.test.ts

# Test OpenAI integration
npm run test:openai
```

## 🚀 **Local Development**

### Redis Development (Optional)

For local Redis caching:

```bash
# Start Redis with Docker
npm run docker:dev

# View logs
docker-compose -f infrastructure/docker-compose.yml logs -f redis

# Stop services
npm run docker:down
```

### Testing Dynamic Conversations

```bash
# Test conversation state management
npm run test:conversation

# Test profile detection accuracy
npm run test:profile

# Debug conversation flow
npm run dev
# Navigate to conversation endpoint in browser
```

## 🔧 **Troubleshooting**

### Common Issues

1. **Node.js version mismatch**
   ```bash
   nvm use  # Switches to correct version
   ```

2. **OpenAI API issues**
   ```bash
   npm run test:openai  # Test API connectivity
   npm run validate:env # Check API key format
   ```

3. **Environment variables not loading**
   ```bash
   npm run validate:env  # Validate all required vars
   npm run debug:env    # See current environment
   ```

4. **TypeScript errors**
   ```bash
   npm run type-check  # Check all TypeScript errors
   ```

### Performance Monitoring

- **OpenAI costs**: Monitor usage in environment setup
- **Session memory**: Configure `MAX_CONVERSATION_HISTORY`
- **Redis usage**: Optional analytics retention settings

### Getting Help

- Check existing GitHub issues
- Review `generate-tasks.md` for implementation status
- Test with `npm run test:services` 
- Check OpenAI API key limits and billing

## 📊 **Key Differences from Static Systems**

| Traditional Approach | Our Dynamic Approach |
|---------------------|---------------------|
| Static question databases | GPT-4 dynamic generation |
| Predetermined conversation flow | Adaptive based on user sophistication |
| Separate escape detection | Integrated conversation analysis |
| Database storage requirements | In-memory + Redis caching |
| Manual question curation | AI-powered domain expertise |

## 🎯 **Development Goals**

- **Conversation Quality**: Questions feel like talking to domain expert
- **Response Adaptation**: Real-time sophistication assessment
- **Seamless Transitions**: Natural pivots from questions to assumptions
- **Professional Output**: Investor-ready wireframes from conversations

---

**Last Updated**: December 2024  
**Version**: 2.0.0 (Dynamic Conversation Architecture) 