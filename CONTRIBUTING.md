# Contributing to Homebase

Thank you for your interest in contributing to Homebase! This document provides guidelines and best practices for contributing to the project.

## Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/yourusername/homebased.git
   cd homebased
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up development environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with development values
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## Code Style

### TypeScript
- Use TypeScript for all new code
- Define proper types for all functions, components, and data structures
- Avoid `any` type - use proper type definitions
- Use type imports: `import type { ComponentProps } from 'react'`

### React Components
- Use functional components with hooks
- Follow the existing component structure:
  ```typescript
  'use client'; // Only for client components
  
  import { ComponentProps } from 'react';
  import { cn } from '@/lib/utils';
  
  interface ComponentProps {
    // Define props with JSDoc comments
  }
  
  export function Component({ prop }: ComponentProps) {
    // Component implementation
  }
  ```

### File Organization
- Components go in `src/components/` organized by feature
- Utility functions go in `src/lib/`
- Types go in `src/types/`
- API routes go in `src/app/api/`

### Naming Conventions
- **Components**: PascalCase (`WeeklyGrid.tsx`)
- **Files**: kebab-case for utilities (`date-utils.ts`)
- **Variables**: camelCase
- **Constants**: SCREAMING_SNAKE_CASE
- **CSS Classes**: Follow Tailwind conventions

### Styling
- Use Tailwind CSS classes
- Follow the established color palette:
  - Neutral: slate-* for backgrounds and text
  - Cyclical tasks: muted colors (slate-100)
  - Project tasks: bold accents (blue-100)
  - Work availability: orange-*
  - Childcare availability: green-*
  - Personal availability: purple-*

## Git Workflow

### Branch Naming
- `feature/description` - New features
- `fix/description` - Bug fixes
- `refactor/description` - Code refactoring
- `docs/description` - Documentation updates

### Commit Messages
Follow conventional commit format:
```
type(scope): description

body (optional)

footer (optional)
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(dashboard): add weekly time tracking display
fix(api): handle empty task list in weekly view
docs(readme): update setup instructions
test(grid): add drag and drop interaction tests
```

### Pull Request Process

1. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes with tests**
   - Write code following the style guidelines
   - Add or update tests as needed
   - Update documentation if needed

3. **Run quality checks**
   ```bash
   npm run lint        # Check code style
   npm run type-check  # Check TypeScript
   npm run test:e2e    # Run tests
   ```

4. **Create pull request**
   - Use descriptive title and description
   - Reference related issues
   - Include screenshots for UI changes
   - Add tests for new functionality

5. **Review process**
   - Address reviewer feedback
   - Keep commits focused and clean
   - Update based on suggestions

## Testing Guidelines

### Test Categories

1. **E2E Tests** (`tests/e2e/`)
   - Test complete user workflows
   - Use real browser interactions
   - Focus on critical user paths

2. **Component Tests** (`tests/components/`)
   - Test individual React components
   - Verify rendering and interactions
   - Check accessibility requirements

3. **API Tests** (`tests/api/`)
   - Test API endpoints
   - Verify request/response formats
   - Check error handling

### Writing Tests

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup code
  });

  test('should perform expected behavior', async ({ page }) => {
    // Arrange
    await page.goto('/path');
    
    // Act
    await page.click('button');
    
    // Assert
    await expect(page.locator('.result')).toBeVisible();
  });
});
```

### Test Data
- Use consistent test data across tests
- Create reusable fixtures in `tests/fixtures/`
- Mock external API calls in development
- Use descriptive test names that explain the behavior

## Database Changes

### Migrations
- Create new migration files in `supabase/migrations/`
- Use descriptive names: `003_add_user_preferences.sql`
- Include both up and down operations
- Test migrations on sample data

### Schema Changes
- Update TypeScript types in `src/types/database.ts`
- Update database client methods in `src/lib/database/client.ts`
- Add new seed data if needed
- Update API contracts in `src/types/api.ts`

## API Development

### New Endpoints
1. Define API contracts in `src/types/api.ts`
2. Create route handlers in `src/app/api/`
3. Add database queries to `DatabaseClient`
4. Include proper error handling
5. Add comprehensive tests

### Error Handling
```typescript
try {
  const result = await db.operation();
  return NextResponse.json({ success: true, data: result });
} catch (error) {
  console.error('Operation failed:', error);
  return NextResponse.json(
    { success: false, error: 'Operation failed' },
    { status: 500 }
  );
}
```

### Validation
- Validate all input parameters
- Use TypeScript for compile-time checking
- Return descriptive error messages
- Include field-level validation errors

## UI/UX Guidelines

### Accessibility
- Use semantic HTML elements
- Include proper ARIA labels
- Ensure keyboard navigation works
- Test with screen readers
- Maintain color contrast ratios

### Responsive Design
- Mobile-first approach
- Test on multiple screen sizes
- Ensure touch targets are adequate
- Consider performance on slower devices

### User Experience
- Follow established patterns in the app
- Provide loading states for async operations
- Show clear error messages
- Include confirmation for destructive actions

## Integration Guidelines

### Google APIs
- Handle rate limiting gracefully
- Implement proper error retry logic
- Cache responses when appropriate
- Respect user privacy and permissions

### External Services
- Use adapter patterns for integrations
- Provide mock implementations for development
- Handle service unavailability gracefully
- Document API requirements and limitations

## Performance Considerations

### Frontend
- Use React.memo for expensive components
- Implement proper loading states
- Optimize images and assets
- Minimize bundle size

### Backend
- Use database indexes for common queries
- Implement proper caching strategies
- Handle bulk operations efficiently
- Monitor API response times

### Database
- Write efficient SQL queries
- Use appropriate indexes
- Implement connection pooling
- Monitor query performance

## Security Guidelines

### Authentication
- Never store secrets in code
- Use environment variables for sensitive data
- Implement proper session management
- Follow OAuth best practices

### Data Protection
- Implement Row Level Security in Supabase
- Validate all user inputs
- Use HTTPS in production
- Follow GDPR compliance requirements

### API Security
- Validate all API inputs
- Implement rate limiting
- Use proper HTTP status codes
- Log security-relevant events

## Review Checklist

Before submitting a pull request, ensure:

### Code Quality
- [ ] TypeScript types are properly defined
- [ ] Code follows established patterns
- [ ] No console.log statements in production code
- [ ] Error handling is comprehensive
- [ ] Documentation is updated

### Testing
- [ ] New features have tests
- [ ] All tests pass locally
- [ ] Edge cases are covered
- [ ] API changes have corresponding tests
- [ ] Accessibility is tested

### Performance
- [ ] No obvious performance regressions
- [ ] Database queries are optimized
- [ ] Large datasets are handled efficiently
- [ ] Mobile performance is acceptable

### Security
- [ ] No secrets or credentials in code
- [ ] User inputs are validated
- [ ] Authentication is properly implemented
- [ ] Data access is properly restricted

## Getting Help

- **Issues**: Search existing issues or create a new one
- **Discussions**: Use GitHub Discussions for questions
- **Documentation**: Check README.md and inline code comments
- **Code Review**: Ask for specific feedback in pull requests

## Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes for significant contributions
- Project documentation

Thank you for contributing to Homebase!