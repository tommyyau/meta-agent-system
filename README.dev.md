# Meta-Agent System - Development Environment Setup

This document provides comprehensive instructions for setting up a standardized development environment for the Meta-Agent System.

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
4. **Docker** (optional, for containerized development)
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
# Copy environment template
cp config/environment.template .env.local

# Edit .env.local with your API keys and configuration
# See config/environment.template for required variables
```

#### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key for AI features | `sk-...` |
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJ...` |
| `UPSTASH_REDIS_REST_URL` | Redis cache URL | `https://xxx.upstash.io` |
| `NEXTAUTH_SECRET` | NextAuth secret key | Random string |

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

# Database and services
npm run docker:dev      # Start local services (Redis, etc.)
npm run docker:down     # Stop local services
```

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

## Testing Strategy

### Unit Tests
- Test individual functions and components
- Use Jest + React Testing Library
- Minimum 80% coverage required

### Integration Tests
- Test API endpoints and database interactions
- Use Jest with test database

### E2E Tests
- Test complete user workflows
- Use Playwright for browser automation

### Running Tests

```bash
# Watch mode during development
npm run test -- --watch

# Coverage report
npm run test:coverage

# Specific test file
npm test src/components/UserProfile.test.tsx
```

## Docker Development (Optional)

For containerized development:

```bash
# Start all services
npm run docker:dev

# View logs
docker-compose -f infrastructure/docker-compose.yml logs -f

# Stop services
npm run docker:down
```

## Troubleshooting

### Common Issues

1. **Node.js version mismatch**
   ```bash
   nvm use  # Switches to correct version
   ```

2. **Package installation issues**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Environment variables not loading**
   - Ensure `.env.local` exists and has correct format
   - Restart development server after changes

4. **TypeScript errors**
   ```bash
   npm run type-check  # Check all TypeScript errors
   ```

### Getting Help

- Check existing GitHub issues
- Review project documentation
- Ask in team Slack channel
- Contact project maintainers

## Performance Guidelines

- Use React.memo() for expensive components
- Implement proper loading states
- Optimize images and assets
- Monitor bundle size with `npm run build`

## Security Guidelines

- Never commit API keys or secrets
- Use environment variables for sensitive data
- Follow OWASP security practices
- Regular dependency updates

---

**Last Updated**: June 2025  
**Version**: 1.0.0 