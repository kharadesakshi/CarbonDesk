# Frontend Testing Guide

## Overview

The Carbon Project Management Platform frontend uses **Vitest** + **React Testing Library** for component testing. Tests focus on:
- Component rendering
- User interactions
- Service integration
- Error handling
- Accessibility

## Setup

### Install Dependencies

```bash
npm install
```

### Run Tests

```bash
# Run all tests
npm run test

# Run tests once (CI mode)
npm run test:run

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Test Structure

### Typical Test File

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MyComponent from '../src/components/MyComponent';

describe('MyComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText(/Component Title/i)).toBeInTheDocument();
  });

  it('should handle user interactions', async () => {
    render(<MyComponent />);
    
    const button = screen.getByRole('button', { name: /Click me/i });
    await userEvent.click(button);
    
    expect(screen.getByText(/Clicked!/i)).toBeInTheDocument();
  });
});
```

## Testing Patterns

### 1. Rendering Tests

```typescript
it('should render component', () => {
  render(<ProjectsPage />);
  
  // Check for text
  expect(screen.getByText(/Projects/i)).toBeInTheDocument();
  
  // Check for elements
  expect(screen.getByRole('button', { name: /Create/i })).toBeInTheDocument();
  
  // Check for inputs
  expect(screen.getByPlaceholderText(/Search/i)).toBeInTheDocument();
});
```

### 2. User Interaction Tests

```typescript
it('should handle user events', async () => {
  const user = userEvent.setup();
  render(<MyComponent />);
  
  // Type into input
  const input = screen.getByPlaceholderText(/Name/i);
  await user.type(input, 'John Doe');
  
  // Click button
  const button = screen.getByRole('button', { name: /Submit/i });
  await user.click(button);
  
  // Verify result
  expect(screen.getByText(/Success!/i)).toBeInTheDocument();
});
```

### 3. Async Tests

```typescript
it('should load data', async () => {
  const mockService = vi.fn().mockResolvedValue({
    data: [{ id: '1', name: 'Item 1' }]
  });
  
  render(<DataComponent service={mockService} />);
  
  // Wait for async data to load
  await waitFor(() => {
    expect(screen.getByText('Item 1')).toBeInTheDocument();
  });
});
```

### 4. Error Handling Tests

```typescript
it('should display error message', async () => {
  const mockService = vi.fn().mockRejectedValue(
    new Error('API Error')
  );
  
  render(<DataComponent service={mockService} />);
  
  await waitFor(() => {
    expect(screen.getByText(/Failed to load/i)).toBeInTheDocument();
  });
});
```

### 5. Mock Service Tests

```typescript
vi.mock('../src/services/project.service', () => ({
  ProjectService: {
    listProjects: vi.fn(),
    createProject: vi.fn(),
  },
}));

it('should call service method', async () => {
  const { ProjectService } = await import('../src/services/project.service');
  (ProjectService.listProjects as any).mockResolvedValue({
    data: [],
  });
  
  render(<ProjectsPage />);
  
  await waitFor(() => {
    expect(ProjectService.listProjects).toHaveBeenCalled();
  });
});
```

## Best Practices

### 1. Use Semantic Queries

```typescript
// ❌ Bad: Implementation detail
screen.getByClassName('btn-primary');

// ✅ Good: User-facing text
screen.getByRole('button', { name: /Submit/i });

// ✅ Good: Placeholder text
screen.getByPlaceholderText(/Search/i);

// ✅ Good: Label text
screen.getByLabelText(/Email/i);
```

### 2. Test Behavior, Not Implementation

```typescript
// ❌ Bad: Testing internal state
expect(component.state.isOpen).toBe(true);

// ✅ Good: Testing visible behavior
expect(screen.getByText(/Modal Title/i)).toBeInTheDocument();
```

### 3. Use userEvent, Not fireEvent

```typescript
// ❌ Bad: Direct event simulation
fireEvent.click(button);

// ✅ Good: User-like interaction
await userEvent.click(button);
```

### 4. Wait for Async Operations

```typescript
// ❌ Bad: No waiting
render(<AsyncComponent />);
expect(screen.getByText('Loaded')).toBeInTheDocument();

// ✅ Good: Wait for element
render(<AsyncComponent />);
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});
```

### 5. Mock External Services

```typescript
// ✅ Good: Mock API calls
const mockListProjects = vi.fn().mockResolvedValue({
  data: [{ id: '1', name: 'Project' }],
});

// Use in test
render(<ProjectsPage service={mockListProjects} />);
await waitFor(() => {
  expect(mockListProjects).toHaveBeenCalled();
});
```

## Common Queries

| Query | Use Case |
|-------|----------|
| `getByRole()` | Buttons, links, headings, form fields |
| `getByLabelText()` | Form inputs with labels |
| `getByPlaceholderText()` | Form inputs with placeholder |
| `getByText()` | Any text content |
| `getByDisplayValue()` | Input with current value |
| `getByTestId()` | Last resort (use sparingly) |

## Debugging Tests

### View DOM in Test

```typescript
import { render, screen } from '@testing-library/react';

it('should render', () => {
  const { debug } = render(<Component />);
  debug(); // Prints DOM to console
});
```

### Run Single Test

```bash
npm run test -- ProjectsPage.test.tsx
```

### Run Tests Matching Pattern

```bash
npm run test -- --grep="should create project"
```

### Open Test UI

```bash
npm run test -- --ui
```

## Coverage Goals

| Metric | Target |
|--------|--------|
| Statements | >75% |
| Branches | >70% |
| Functions | >80% |
| Lines | >75% |

View coverage:

```bash
npm run test:coverage
```

## Common Issues

### "Cannot find module" Error

**Problem:** Import path issues in tests.

**Solution:**
```typescript
// Use correct relative path
import MyComponent from '../src/components/MyComponent';
```

### "Timeout" Error

**Problem:** Async operation takes too long.

**Solution:**
```typescript
await waitFor(
  () => { /* assertion */ },
  { timeout: 5000 } // Increase timeout
);
```

### "act" Warning

**Problem:** State update not wrapped in act().

**Solution:**
```typescript
// Already handled by userEvent
await userEvent.click(button);

// If needed manually:
act(() => {
  // state update
});
```

### Mock Not Working

**Problem:** Mock not being used.

**Solution:**
```typescript
// Mock must be at top of file
vi.mock('../services/api');

// Import after mock
import { api } from '../services/api';
```

## Test Examples

### Form Validation

```typescript
it('should validate form fields', async () => {
  render(<CreateProjectForm />);
  
  const submitButton = screen.getByRole('button', { name: /Create/i });
  await userEvent.click(submitButton);
  
  expect(screen.getByText(/Name is required/i)).toBeInTheDocument();
});
```

### List Rendering with Filter

```typescript
it('should filter list items', async () => {
  render(<ParticipantsList />);
  
  const searchInput = screen.getByPlaceholderText(/Search/i);
  await userEvent.type(searchInput, 'John');
  
  expect(screen.getByText('John Doe')).toBeInTheDocument();
  expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
});
```

### Modal Interaction

```typescript
it('should open and close modal', async () => {
  render(<Component />);
  
  // Modal should not be visible initially
  expect(screen.queryByText(/Modal Title/i)).not.toBeInTheDocument();
  
  // Click to open
  await userEvent.click(screen.getByRole('button', { name: /Open/i }));
  expect(screen.getByText(/Modal Title/i)).toBeInTheDocument();
  
  // Click to close
  await userEvent.click(screen.getByRole('button', { name: /Close/i }));
  expect(screen.queryByText(/Modal Title/i)).not.toBeInTheDocument();
});
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Frontend Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:run -- --coverage
      - uses: codecov/codecov-action@v2
```

## Resources

- [Vitest Docs](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Query Priorities](https://testing-library.com/docs/queries/about/#priority)

## Next Steps

- Phase 6.1: Create Dockerfile
- Phase 6.2: Production configuration
- Phase 6.3: End-to-end verification
