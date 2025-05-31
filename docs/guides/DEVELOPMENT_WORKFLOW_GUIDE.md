# Scribe Tree Development Workflow Guide

This guide outlines development standards, workflows, and best practices for contributing to the Scribe Tree platform.

## Code Quality Principles

- **Readability First**: Write code that is easily understandable by humans reading it
- **Scalable Architecture**: Prioritize code that can grow with the application
- **Self-Documenting**: Minimize line-level comments; let code speak for itself
- **Design Intent**: Use high-level documentation to explain architectural decisions

## Development Workflow

### Feature Development Process

1. **Understand Requirements**: Review GitHub issue, ask clarifying questions
2. **AI Compliance Check**: If AI-related, review `.claude/docs/ai-philosophy.md` for educational alignment
3. **Plan Implementation**: Identify components, APIs, and tests needed
4. **Write Tests First**: Create failing tests that define expected behavior
5. **Implement Backend**: API routes, database models, business logic
6. **Implement Frontend**: Components, hooks, integration with backend
7. **Integration Testing**: Test complete user workflows end-to-end
8. **Manual Testing**: Verify in browser/interface
9. **Complete Task Reflection**: Use `/reflect` command to document insights

### Code Quality Gates

- All tests must pass before code is considered complete
- ESLint warnings should be addressed (errors block completion)
- TypeScript compilation must succeed without errors
- Manual testing confirms feature works as expected
- Performance is acceptable for expected usage patterns

## Error Handling Requirements

### API Endpoints
- Return appropriate HTTP status codes and error messages
- Use consistent error response format
- Include helpful error details in development mode
- Log errors appropriately for debugging

### Frontend Components
- Use error boundaries to prevent app crashes
- Provide graceful degradation when possible
- Show user-friendly error messages
- Include recovery actions when applicable

### Database Operations
- Handle connection errors gracefully
- Validate data before database operations
- Use transactions for multi-step operations
- Provide meaningful error messages

### User Feedback
- Provide clear, actionable error messages
- Avoid technical jargon in user-facing messages
- Include next steps or support options
- Maintain consistent error UI patterns

## File Organization

### Backend Structure
- **Models** → Database schema and data models
- **Routes** → API endpoint definitions
- **Controllers** → Business logic handlers
- **Middleware** → Request processing and authentication
- **Utils** → Shared utility functions

### Frontend Structure
- **Components** → React components and UI elements
- **Hooks** → Custom React hooks
- **Utils** → Helper functions and utilities
- **Types** → TypeScript type definitions
- **Constants** → Application constants

### Shared Code
- Types and interfaces should be clearly defined
- Share between frontend/backend when appropriate
- Maintain single source of truth for shared types
- Document any shared contracts

## Database Standards

### Migration Standards
- **Test Preservation**: Update existing test logic rather than rewriting
- **Type Safety First**: Use Prisma-generated types for compile-time validation
- **API Contract Validation**: Ensure frontend expectations match backend reality
- **Role-Based Data Access**: Design queries that support multi-role visibility
- **Migration Completeness**: Complete API endpoint inventory prevents gaps

### API Design Standards
- **Standard Response Format**: `{ success: boolean, data: T, message?: string }`
- **Error Handling**: Standardized error responses with development details
- **Role-Based Endpoints**: Implement admin vs. user access patterns consistently
- **Type Safety**: Use Prisma-generated types for request/response validation
- **Documentation**: Maintain comprehensive API contract documentation

## Task Completion Protocol

### Definition of Done Checklist

Before marking any task complete, ensure:

- [ ] **Code implemented** and follows project standards
- [ ] **Tests written** and passing (see Testing Requirements)
- [ ] **Documentation updated** if public APIs changed
- [ ] **Manual testing completed** for user-facing features
- [ ] **Performance verified** for database queries and UI interactions
- [ ] **Accessibility checked** for new UI components
- [ ] **Task reflection completed** using `/reflect` command

### Post-Task Reflection Protocol

After completing each significant task, use the `/reflect` command to:

1. **Document Technical Decisions**: Architecture choices and rationale
2. **Capture Project Insights**: Understanding gained about user workflows
3. **Record Challenges & Solutions**: Problems encountered and resolutions
4. **Identify Future Opportunities**: Refactoring or feature ideas
5. **Assess Educational Alignment**: How the work serves our mission

## Learning & Reflection System

### Continuous Learning Process

The project uses a structured learning system to accumulate knowledge and improve development over time.

### Post-Task Reflection

After completing significant tasks, use: `/reflect`

This command guides you through documenting:
- Technical decisions and rationale
- Project insights about user workflows and architecture
- Challenges encountered and solutions implemented
- Educational platform alignment and value delivered
- Future improvement opportunities identified

### Learning Integration

Periodically (monthly or after major features), use: `/learn`

This command:
- Reviews recent reflections to identify patterns
- Extracts key learnings about technical approaches
- Updates accumulated knowledge about the project
- Recommends improvements to standards or processes
- Synthesizes insights specific to our educational mission

### Reflection Storage & Access

- **Individual reflections**: `.claude/reflections/YYYY-MM-DD-feature-name.md`
- **Accumulated insights**: `.claude/insights/accumulated-learnings.md`
- **Automatic context loading**: Relevant reflections imported for related features
- **Pattern recognition**: System identifies recurring challenges and solutions

## Development Best Practices

### Code Review Checklist
- [ ] Code follows project style guide
- [ ] Tests provide adequate coverage
- [ ] Documentation is updated
- [ ] No security vulnerabilities introduced
- [ ] Performance impact considered
- [ ] Accessibility requirements met

### Performance Guidelines
- Profile before optimizing
- Focus on user-perceived performance
- Use appropriate caching strategies
- Minimize database queries
- Optimize bundle sizes

### Security Considerations
- Never commit secrets or API keys
- Validate all user input
- Use parameterized queries
- Implement proper authentication
- Follow principle of least privilege

### Accessibility Requirements
- Semantic HTML structure
- Proper ARIA labels
- Keyboard navigation support
- Screen reader compatibility
- Sufficient color contrast

## Debugging and Troubleshooting

### Common Issues
1. **Build Failures**: Check TypeScript errors and dependencies
2. **Test Failures**: Verify test environment and mocks
3. **Runtime Errors**: Check browser console and server logs
4. **Performance Issues**: Use profiling tools to identify bottlenecks

### Debugging Tools
- Chrome DevTools for frontend debugging
- Node.js inspector for backend debugging
- React Developer Tools for component inspection
- Prisma Studio for database exploration

## Continuous Improvement

### Code Quality Metrics
- Test coverage reports
- ESLint violation tracking
- TypeScript strict mode compliance
- Bundle size monitoring
- Performance benchmarks

### Team Learning
- Regular code review sessions
- Knowledge sharing meetings
- Documentation updates
- Retrospective discussions
- Best practice evolution