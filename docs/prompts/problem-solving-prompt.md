# Problem-Solving Session Prompt

## Issue Encountered
**Fill in specific problem details before starting session:**

### Problem Description
- **Issue**: [Specific problem you're encountering]
- **Error Message**: [Exact error message if applicable]
- **Expected Behavior**: [What should happen]
- **Actual Behavior**: [What is actually happening]

## Context
- **Current Phase**: [e.g., Phase 2 - Extract Services]
- **Week**: [e.g., Week 8 of 20]
- **Service**: [e.g., Writing Analysis MCP Server, Cognitive Monitoring Service]
- **Framework**: [Fastify/NestJS/Express]
- **Branch**: `feat/mcp-microservices-migration`

## Current Implementation Context
### What's Working
- [List components/features that are functioning correctly]
- [Recent successful implementations]
- [Passing tests and benchmarks]

### What's Not Working
- [Specific failing functionality]
- [Failing tests or performance issues]
- [Integration problems]

## Constraints and Requirements
### Technical Constraints
- **Performance**: [Specific performance targets that must be maintained]
- **Compatibility**: [API compatibility requirements]
- **Framework Requirements**: [Framework-specific patterns to follow]
- **Integration**: [Other services this must work with]

### Educational Constraints
- **Privacy Requirements**: [Student data protection needs]
- **Educational Purpose**: [How this serves educational goals]
- **Compliance**: [FERPA, educational standards to maintain]

### Architecture Constraints
- **Repository Pattern**: [How this integrates with existing repository pattern]
- **Event System**: [Event publishing/subscription requirements]
- **MCP Protocol**: [MCP tool registration and communication needs]

## Debugging Information
### Environment Details
- **Node.js Version**: [e.g., 18.17.0]
- **Framework Version**: [e.g., Fastify 4.21.0, NestJS 10.2.0]
- **Database**: [Prisma version, database type]
- **Cache**: [Redis configuration]
- **Message Queue**: [RabbitMQ setup]

### Error Details
```
[Paste exact error message, stack trace, or logs here]
```

### Relevant Code
```typescript
// Paste relevant code snippet that's causing issues
```

### Performance Data
- **Response Times**: [Current performance metrics]
- **Memory Usage**: [Current memory consumption]
- **Error Rates**: [Error frequency and patterns]

## Investigation Steps Already Taken
- [ ] [Step 1: What you've already tried]
- [ ] [Step 2: Debugging approaches used]
- [ ] [Step 3: Documentation or resources consulted]
- [ ] [Step 4: Similar issues researched]

## Integration Impact Analysis
### Affected Services
- **Main API**: [How this affects the main Fastify/Express API]
- **Other MCP Servers**: [Impact on other microservices]
- **Database**: [Database operation impacts]
- **Event System**: [Event publishing/subscription effects]

### Educational Impact
- **Student Experience**: [How this affects student interactions]
- **Educator Tools**: [Impact on educator functionality]
- **Privacy Compliance**: [Any privacy/compliance risks]

## Solution Requirements
### Must Have
- [Non-negotiable requirements for any solution]
- [Performance standards that must be met]
- [Compatibility requirements]

### Should Have
- [Preferred solution characteristics]
- [Performance improvements desired]
- [Code quality standards]

### Could Have
- [Nice-to-have features]
- [Future-proofing considerations]
- [Optimization opportunities]

## Potential Solutions to Evaluate
### Solution 1: [Approach Name]
- **Description**: [Brief description of approach]
- **Pros**: [Advantages of this solution]
- **Cons**: [Disadvantages or risks]
- **Implementation Effort**: [Time/complexity estimate]

### Solution 2: [Alternative Approach]
- **Description**: [Brief description of alternative]
- **Pros**: [Advantages of this approach]
- **Cons**: [Disadvantages or risks]
- **Implementation Effort**: [Time/complexity estimate]

### Solution 3: [Workaround/Temporary Fix]
- **Description**: [Quick fix description]
- **Pros**: [Benefits of temporary solution]
- **Cons**: [Technical debt or limitations]
- **Implementation Effort**: [Time to implement]

## Testing Strategy
### Validation Steps
- [ ] [How to verify the solution works]
- [ ] [Performance tests to run]
- [ ] [Integration tests to execute]
- [ ] [Educational functionality to validate]

### Regression Prevention
- [ ] [Tests to add to prevent this issue recurring]
- [ ] [Monitoring to implement]
- [ ] [Code review checklist items]

## Reference Documents
- [Migration Plan](../roadmaps/AI_MCP_MIGRATION_SUMMARY.md)
- [Technical Details](../roadmaps/AI_MCP_TECHNICAL_ADDENDUM.md)
- [Framework Documentation](../guides/FRAMEWORK_GUIDES.md)
- [Educational AI Architecture](../guides/EDUCATIONAL_AI_PATTERNS.md)

## Success Criteria
- [ ] Issue completely resolved
- [ ] All existing tests still pass
- [ ] Performance targets maintained or improved
- [ ] Educational functionality preserved
- [ ] Privacy compliance maintained
- [ ] Integration with other services working
- [ ] Documentation updated with solution

## Learning Capture
### Root Cause Analysis
- **Primary Cause**: [What actually caused the issue]
- **Contributing Factors**: [Other factors that led to the problem]
- **Prevention**: [How to prevent this issue in the future]

### Knowledge Gained
- [Technical insights discovered]
- [Framework-specific learnings]
- [Educational architecture patterns learned]

### Documentation Updates Needed
- [ ] [Code comments to add]
- [ ] [Architecture documentation to update]
- [ ] [Team knowledge base updates]
- [ ] [Troubleshooting guide additions]

## Next Steps
After resolving this issue:
1. Document solution and root cause in team knowledge base
2. Update relevant architecture documentation
3. Add prevention measures (tests, monitoring, code review items)
4. Share learnings with team if applicable
5. Return to main development prompt: `[current-phase-prompt].md`

---

**Use this prompt when encountering any significant technical issues during the MCP migration. The structured approach ensures you capture all relevant context and find solutions that align with our educational platform architecture.**