# Git Branching Strategy

This document defines the Git branching strategy and workflows for the Meta-Agent System project.

## Branch Structure

### Main Branches

#### `main` (Production)
- **Purpose**: Production-ready code
- **Protection**: Protected branch with required reviews
- **Auto-deploy**: Automatically deploys to production
- **Merge**: Only from `release/*` and `hotfix/*` branches

#### `develop` (Integration)
- **Purpose**: Integration branch for ongoing development
- **Protection**: Protected branch with required reviews
- **Auto-deploy**: Automatically deploys to staging environment
- **Merge**: From `feature/*` branches

### Supporting Branches

#### `feature/*` (Feature Development)
- **Purpose**: New feature development
- **Naming**: `feature/task-number-description`
- **Base**: Created from `develop`
- **Merge**: Into `develop` via Pull Request
- **Lifecycle**: Deleted after merge

#### `bugfix/*` (Bug Fixes)
- **Purpose**: Non-critical bug fixes
- **Naming**: `bugfix/issue-number-description`
- **Base**: Created from `develop`
- **Merge**: Into `develop` via Pull Request
- **Lifecycle**: Deleted after merge

#### `hotfix/*` (Emergency Fixes)
- **Purpose**: Critical production bug fixes
- **Naming**: `hotfix/version-description`
- **Base**: Created from `main`
- **Merge**: Into both `main` and `develop`
- **Lifecycle**: Deleted after merge

#### `release/*` (Release Preparation)
- **Purpose**: Release preparation and final testing
- **Naming**: `release/v1.0.0`
- **Base**: Created from `develop`
- **Merge**: Into `main` and back to `develop`
- **Lifecycle**: Deleted after release

## Branch Naming Conventions

### Feature Branches
```
feature/001-user-profile-detection
feature/002-conversation-flow-management
feature/003-wireframe-generation
feature/004-assumption-cascade-system
```

### Bug Fix Branches
```
bugfix/123-conversation-state-persistence
bugfix/124-openai-api-timeout-handling
bugfix/125-profile-detection-accuracy
```

### Hotfix Branches
```
hotfix/v1.0.1-security-vulnerability
hotfix/v1.0.2-database-connection-issue
hotfix/v1.0.3-api-rate-limiting
```

### Release Branches
```
release/v1.0.0
release/v1.1.0
release/v2.0.0
```

## Workflow Processes

### 1. Feature Development Workflow

```bash
# 1. Start new feature
git checkout develop
git pull origin develop
git checkout -b feature/001-user-profile-detection

# 2. Develop feature
# Make changes, commit regularly
git add .
git commit -m "feat: add industry detection algorithm"
git commit -m "test: add unit tests for profile detection"
git commit -m "docs: update API documentation"

# 3. Keep feature branch updated
git checkout develop
git pull origin develop
git checkout feature/001-user-profile-detection
git rebase develop

# 4. Push and create PR
git push origin feature/001-user-profile-detection
# Create Pull Request to develop branch

# 5. After merge, cleanup
git checkout develop
git pull origin develop
git branch -d feature/001-user-profile-detection
git push origin --delete feature/001-user-profile-detection
```

### 2. Bug Fix Workflow

```bash
# 1. Start bug fix
git checkout develop
git pull origin develop
git checkout -b bugfix/123-conversation-state-persistence

# 2. Fix bug
git add .
git commit -m "fix: resolve conversation state persistence issue"
git commit -m "test: add regression test for state persistence"

# 3. Push and create PR
git push origin bugfix/123-conversation-state-persistence
# Create Pull Request to develop branch
```

### 3. Hotfix Workflow

```bash
# 1. Start hotfix from main
git checkout main
git pull origin main
git checkout -b hotfix/v1.0.1-security-vulnerability

# 2. Fix critical issue
git add .
git commit -m "fix: resolve security vulnerability in auth"

# 3. Merge to main
git checkout main
git merge --no-ff hotfix/v1.0.1-security-vulnerability
git tag v1.0.1
git push origin main --tags

# 4. Merge back to develop
git checkout develop
git merge --no-ff hotfix/v1.0.1-security-vulnerability
git push origin develop

# 5. Cleanup
git branch -d hotfix/v1.0.1-security-vulnerability
```

### 4. Release Workflow

```bash
# 1. Start release from develop
git checkout develop
git pull origin develop
git checkout -b release/v1.0.0

# 2. Prepare release (version bumps, final testing)
npm version 1.0.0
git add .
git commit -m "chore: bump version to 1.0.0"

# 3. Final bug fixes (if needed)
git commit -m "fix: minor UI adjustments"

# 4. Merge to main
git checkout main
git merge --no-ff release/v1.0.0
git tag v1.0.0
git push origin main --tags

# 5. Merge back to develop
git checkout develop
git merge --no-ff release/v1.0.0
git push origin develop

# 6. Cleanup
git branch -d release/v1.0.0
```

## Pull Request Guidelines

### PR Title Format
```
type(scope): description

Examples:
feat(agents): add domain-specific agent generation
fix(conversation): resolve stage progression bug
docs(api): update OpenAI integration documentation
```

### PR Description Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Code is commented appropriately
- [ ] Documentation updated
- [ ] No merge conflicts
```

### Review Requirements
- **Feature PRs**: Minimum 2 approvals required
- **Bug fixes**: Minimum 1 approval required
- **Hotfixes**: Emergency approval process
- **All PRs**: Must pass CI/CD checks

## Commit Message Guidelines

### Format
```
type(scope): description

[optional body]

[optional footer]
```

### Types
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks
- **perf**: Performance improvements
- **ci**: CI/CD changes

### Examples
```
feat(agents): implement domain-specific agent selection

- Add industry classification algorithm
- Implement role detection logic
- Add sophistication scoring system

Closes #123
```

```
fix(conversation): resolve state persistence issue

The conversation state was not being properly saved between stages.
Fixed by implementing proper state serialization.

Fixes #456
```

## Release Management

### Version Numbering
Follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Process
1. **Feature Freeze**: Stop merging new features to develop
2. **Release Branch**: Create release branch from develop
3. **Testing**: Comprehensive testing in staging environment
4. **Bug Fixes**: Fix any issues found during testing
5. **Release**: Merge to main and tag version
6. **Deploy**: Automatic deployment to production
7. **Post-Release**: Merge back to develop

### Release Notes
Auto-generated from commit messages and PR titles:
```markdown
# Release v1.0.0

## New Features
- feat(agents): Domain-specific agent generation
- feat(conversation): 4-stage conversation flow

## Bug Fixes
- fix(api): OpenAI timeout handling
- fix(ui): Profile correction interface

## Documentation
- docs(api): Updated API documentation
- docs(deployment): Added deployment guide
```

## Branch Protection Rules

### `main` Branch
- Require pull request reviews (2 approvals)
- Require status checks to pass
- Require branches to be up to date
- Restrict pushes to administrators only
- Include administrators in restrictions

### `develop` Branch
- Require pull request reviews (1 approval)
- Require status checks to pass
- Require branches to be up to date
- Allow force pushes for administrators

## Continuous Integration

### Automated Checks
- **Linting**: ESLint checks
- **Type Checking**: TypeScript compilation
- **Testing**: Unit, integration, and E2E tests
- **Security**: Dependency vulnerability scanning
- **Performance**: Bundle size analysis

### Deployment Pipeline
- **develop → staging**: Automatic deployment
- **main → production**: Automatic deployment
- **feature branches**: Deploy to preview environments

---

**Last Updated**: June 2025  
**Version**: 1.0.0 