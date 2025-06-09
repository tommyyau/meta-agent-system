# Components Directory

This directory contains all reusable React components organized by functionality and purpose.

## Directory Structure

### `/ui` - Base UI Components
Atomic design components that serve as building blocks:
- `button.tsx` - Button component with variants
- `input.tsx` - Input field component
- `card.tsx` - Card container component
- `modal.tsx` - Modal/dialog component
- `loading.tsx` - Loading indicators

### `/forms` - Form Components
Complex form components with validation:
- `user-profile-form.tsx` - User profiling form
- `conversation-form.tsx` - Conversation input form
- `feedback-form.tsx` - User feedback forms

### `/layout` - Layout Components
Application structure components:
- `header.tsx` - Site header with navigation
- `sidebar.tsx` - Dashboard sidebar
- `footer.tsx` - Site footer
- `navigation.tsx` - Navigation components

### `/agents` - Agent-Specific Components
Components related to agent management:
- `agent-selector.tsx` - Agent selection interface
- `agent-config.tsx` - Agent configuration panel
- `agent-status.tsx` - Agent status display

### `/conversation` - Conversation Flow Components
Components for managing conversation flow:
- `conversation-stage.tsx` - Stage management
- `question-panel.tsx` - Question display
- `progress-indicator.tsx` - Progress visualization

### `/wireframes` - Wireframe Components
Components for wireframe generation and display:
- `wireframe-generator.tsx` - Wireframe creation interface
- `wireframe-preview.tsx` - Wireframe preview component
- `wireframe-export.tsx` - Export functionality

### `/analytics` - Analytics Components
Components for analytics and monitoring:
- `dashboard-metrics.tsx` - Metrics dashboard
- `usage-charts.tsx` - Usage visualization
- `performance-monitor.tsx` - Performance tracking

## Component Guidelines

### 1. Component Structure
```typescript
// ComponentName.tsx
import React from 'react'
import { cn } from '@/lib/utils'

interface ComponentNameProps {
  // Props definition
}

export default function ComponentName({ ...props }: ComponentNameProps) {
  return (
    // Component JSX
  )
}

// Named export for testing
export { ComponentName }
```

### 2. Prop Types
- Use TypeScript interfaces for all props
- Make props optional when appropriate
- Include proper JSDoc comments for complex props

### 3. Styling
- Use Tailwind CSS for styling
- Implement proper responsive design
- Support dark/light theme variants

### 4. Testing
- Every component should have unit tests
- Test user interactions and edge cases
- Use React Testing Library

### 5. Documentation
- Include Storybook stories for complex components
- Document component variants and use cases
- Provide usage examples

## Import Structure

Use barrel exports in index files:

```typescript
// components/ui/index.ts
export { Button } from './button'
export { Input } from './input'
export { Card } from './card'

// Usage
import { Button, Input } from '@/components/ui'
``` 