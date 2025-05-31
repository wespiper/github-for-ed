# Scribe Tree Testing Guide

This comprehensive guide covers all testing requirements, philosophy, and practices for the Scribe Tree educational platform.

## Testing Requirements

### When to Write Tests

- **Always**: New API endpoints, database models, utility functions
- **Integration Tests**: Complete user workflows (signup → course creation → assignment)
- **Unit Tests**: Individual component methods, data transformations, validation logic
- **Before Deployment**: All new features must include appropriate test coverage

### Testing Commands

```bash
# Frontend testing (Vitest + React Testing Library)
cd frontend
npm test              # Run all tests once
npm run test:watch    # Watch mode for development
npm run test:coverage # Generate coverage report

# Backend testing (Jest + Prisma)
cd backend
npm test              # Run all tests with Prisma mocking
npm run test:watch    # Watch mode for development
npm run test:coverage # Generate coverage report
```

## Testing Setup

### Frontend Testing Stack

- **Vitest**: Fast test runner with TypeScript support
- **React Testing Library**: Component testing focused on user behavior
- **@testing-library/jest-dom**: Additional DOM matchers
- **@testing-library/user-event**: User interaction simulation
- **jsdom**: DOM environment for tests

### Test Configuration

- `vitest.config.ts`: Test environment configuration with path aliases
- `src/test/setup.ts`: Global test setup with DOM mocks
- Test files: `*.test.tsx` for components, `*.test.ts` for utilities

## Testing Standards

- **Minimum 80% code coverage** for new features
- **Test file naming**: `ComponentName.test.tsx` or `functionName.test.ts`
- **Test organization**: Group tests by feature/component, not by test type
- **Mock external dependencies**: APIs, file system, third-party services
- **Integration tests use realistic data** that mirrors production scenarios

## Testing Philosophy

### Test-Driven Development
Write tests before implementing new features to ensure clear requirements and prevent regressions.

### Unit Testing Focus
- Test specific method behavior and edge cases
- Verify parameter variations and error conditions
- Stub external dependencies (APIs, databases, file system)
- Focus on isolated component behavior

### Integration Testing Approach
- Mock only external boundaries (third-party services)
- Create realistic data scenarios that mirror production
- Test complete application flows from input to output
- Verify end state after operations complete
- Ensure user workflows function correctly end-to-end

## Required Test Types by Component

```typescript
// Example test requirements
interface TestRequirements {
    apiRoutes: ["unit", "integration"];
    reactComponents: ["unit", "integration"];
    databaseModels: ["unit"];
    utilities: ["unit"];
    userWorkflows: ["integration"];
}
```

## Testing Examples

### Unit Test Example

```typescript
// frontend/src/utils/wordCount.test.ts
import { calculateWordCount, calculateReadingTime } from "./wordCount";

describe("wordCount utilities", () => {
    test("calculates word count correctly", () => {
        expect(calculateWordCount("Hello world")).toBe(2);
        expect(calculateWordCount("")).toBe(0);
        expect(calculateWordCount("   ")).toBe(0);
    });

    test("calculates reading time", () => {
        const text = "word ".repeat(200); // 200 words
        expect(calculateReadingTime(text)).toBe(1); // ~1 minute
    });
});
```

### Integration Test Example

```typescript
// backend/src/routes/assignments.test.ts
describe("Assignment API", () => {
    test("creates assignment with version control setup", async () => {
        const response = await request(app).post("/api/assignments").send({
            title: "Persuasive Essay",
            courseId: testCourseId,
            instructions: "Write about climate change...",
        });

        expect(response.status).toBe(201);
        expect(response.body.versionControlEnabled).toBe(true);
    });
});
```

### React Component Test Example

```typescript
// frontend/src/components/WritingEditor.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { WritingEditor } from "./WritingEditor";

describe("WritingEditor", () => {
    test("saves version when content changes significantly", async () => {
        const mockSaveVersion = jest.fn();
        render(<WritingEditor onSaveVersion={mockSaveVersion} />);

        const editor = screen.getByRole("textbox");
        fireEvent.input(editor, {
            target: { textContent: "Significant content change..." },
        });

        // Wait for debounced save
        await new Promise((resolve) => setTimeout(resolve, 1000));

        expect(mockSaveVersion).toHaveBeenCalledWith({
            content: expect.stringContaining("Significant content"),
            wordCount: expect.any(Number),
        });
    });
});
```

## Best Practices

### Test Organization
- Place test files next to the code they test
- Use descriptive test names that explain expected behavior
- Group related tests using `describe` blocks
- Keep tests focused on single behaviors

### Test Data Management
- Use factories or builders for test data creation
- Keep test data realistic but minimal
- Avoid hardcoding IDs or timestamps
- Use meaningful variable names for test data

### Mocking Strategy
- Mock at the boundaries (external services, APIs)
- Prefer dependency injection for easier testing
- Keep mocks simple and focused
- Update mocks when interfaces change

### Performance Considerations
- Run unit tests first (faster feedback)
- Parallelize test execution where possible
- Use test databases for integration tests
- Clean up test data after each test

## Educational Platform Specific Testing

### AI Boundary Testing
- Verify AI assistance follows educational boundaries
- Test progressive access based on student skill
- Ensure reflection requirements are enforced
- Validate transparency of AI contributions

### Writing Process Testing
- Test version control functionality
- Verify writing analytics calculations
- Test real-time collaboration features
- Validate feedback integration workflows

### Role-Based Access Testing
- Test student, educator, and admin permissions
- Verify data visibility rules
- Test cross-role interactions
- Validate security boundaries

## Continuous Integration

All tests run automatically on:
- Push to main/develop branches
- Pull request creation/updates
- Pre-deployment validation

Failed tests block deployment to ensure quality.

## Debugging Test Failures

### Common Issues
1. **Timing Issues**: Use appropriate wait utilities
2. **State Pollution**: Ensure proper cleanup between tests
3. **Mock Mismatches**: Verify mock return values match interfaces
4. **Environment Differences**: Check for CI/local environment variations

### Debugging Tools
- Use `--inspect` flag for Node.js debugging
- Enable verbose logging in test environment
- Use `test.only` to isolate failing tests
- Check test output for detailed error messages

## Future Testing Enhancements

- Visual regression testing for UI components
- Performance testing for critical paths
- Load testing for real-time features
- Accessibility testing automation
- Security testing integration