# Architecture Continuity Template for Development Prompts

## Purpose
This template ensures all future development weeks properly reference and build upon completed architectural work, preventing the architectural misalignment issues experienced in Phase 2 Week 8.

## Required Sections for All Development Prompts

### 1. Architectural Foundation Reference

#### Template Section to Include:
```markdown
## Architectural Foundation Reference

### Completed Work to Build Upon
Before implementing this week's tasks, review the following completed implementations:

1. **Phase 1 Week 2 - Repository Pattern** (`docs/prompts/review/phase-1-week-2-repository-pattern-enhanced-completed-2025-01-06.md`):
   - Privacy-aware repository interfaces with PrivacyContext
   - Audit trail integration for all data operations
   - Mock-first development patterns
   - ServiceFactory dependency injection container

2. **Phase 1 Week 5 - Monitoring & Observability** (`docs/prompts/review/phase-1-week-5-monitoring-observability-enhanced-completed-2025-06-01.md`):
   - Privacy-safe logging with PII detection
   - Real-time consent tracking and compliance monitoring
   - Data access heat maps and anomaly detection
   - Multi-channel privacy alert system

3. **Phase 2 Week 7 - Writing Analysis MCP** (`docs/prompts/review/phase-2-week-7-writing-analysis-mcp-enhanced-completed-2025-06-02.md`):
   - NestJS MCP server architecture patterns
   - Repository integration with MCP servers
   - Privacy-enhanced content analysis
   - Educational purpose validation

4. **Phase 2 Week 8 - Student Profiling MCP** (`docs/prompts/review/phase-2-week-8-student-profiling-mcp-enhanced-completed-2025-06-03.md`):
   - Triple-tier fallback architecture (MCP → HTTP → Repository)
   - Student data agency and privacy controls
   - Comprehensive repository interface implementation
   - ServiceFactory integration patterns

[Add other completed weeks as they are finished]

### Required Architecture Patterns
- **Repository Interface**: Create `[ServiceName]Repository` extending `PrivacyAwareRepository<T, CreateDTO, UpdateDTO>`
- **Privacy Context**: All operations must include `PrivacyContext` parameter
- **ServiceFactory Integration**: Add repository to container and create getter method
- **Mock Implementation**: Create comprehensive mock repository for testing
- **Audit Trails**: Log all operations with educational justification
- **Triple-Tier Service**: Implement fallback from MCP → HTTP → Repository
- **Express Integration**: Create routes that leverage the unified service layer
```

### 2. Repository Integration Requirements

#### For Every New Service, Include:
```markdown
### Step 1: Repository Pattern Integration (REQUIRED FIRST)
- [ ] **Review completed architecture**: Study Phase 1 Week 2 and relevant Phase 2 patterns
- [ ] Create `backend/src/repositories/interfaces/[ServiceName]Repository.ts`
- [ ] Extend `PrivacyAwareRepository` with service-specific methods (all must include PrivacyContext)
- [ ] Create `backend/src/repositories/__mocks__/[ServiceName]Repository.mock.ts`
- [ ] Create `backend/src/repositories/prisma/Prisma[ServiceName]Repository.ts`
- [ ] Update `backend/src/repositories/interfaces.ts` to include [ServiceName]Repository
- [ ] Update `backend/src/container/ServiceFactory.ts` to include repository and getter
- [ ] Create `backend/src/services/[ServiceName]Service.ts` with triple-tier fallback
- [ ] Create Express routes in `backend/src/routes/[serviceName].ts`
- [ ] Update `backend/src/server.ts` to register routes
```

### 3. Technical Requirements Updates

#### Always Include Repository Requirements:
```markdown
## Technical Requirements
1. **Framework**: [Framework] with [specific capabilities]
2. **Repository Pattern**: Extend established privacy-aware repository architecture
3. **MCP Protocol**: Complete tool registration with [service]-focused functionality
4. **Performance**: [Performance targets] including repository fallback
5. **Integration**: Seamless communication with other MCP servers and repository layer
6. **Privacy Compliance**: Follow FERPA/COPPA patterns established in Phase 1
7. **Triple-Tier Architecture**: MCP (primary) → HTTP (secondary) → Repository (tertiary)
```

### 4. Context Dependencies Format

#### Use This Format for Dependencies:
```markdown
## Context
- **Current Phase**: Phase [X] - [Phase Description]
- **Week**: Week [Y] of 20
- **Branch**: `feat/mcp-microservices-migration`
- **Dependencies**: 
  - **Phase 1 Foundation**: Privacy-aware repository pattern, event-driven architecture, monitoring system (completed)
  - **Week [X]**: [Service Name] with [key architectural contribution] (completed YYYY-MM-DD)
  - **Week [Y]**: [Service Name] with [key architectural contribution] (completed YYYY-MM-DD)
  - [List all relevant completed work with dates]
- **Architecture Foundation**: Built on privacy-aware repository pattern from Phase 1 Week 2
- **Unified Approach**: Triple-tier architecture (MCP protocol + HTTP REST APIs + Repository fallback)
```

### 5. Code Locations Integration

#### Always Include Backend Integration Paths:
```markdown
## Code Locations
- **MCP Server**: `mcp-servers/[service-name]/`
- **Backend Repository Interface**: `backend/src/repositories/interfaces/[ServiceName]Repository.ts`
- **Backend Mock Repository**: `backend/src/repositories/__mocks__/[ServiceName]Repository.mock.ts`
- **Backend Prisma Repository**: `backend/src/repositories/prisma/Prisma[ServiceName]Repository.ts`
- **Backend Service**: `backend/src/services/[ServiceName]Service.ts`
- **Backend Routes**: `backend/src/routes/[serviceName].ts`
- **ServiceFactory Integration**: `backend/src/container/ServiceFactory.ts`
- **Main Module**: `mcp-servers/[service-name]/src/app.module.ts`
- **MCP Integration**: `mcp-servers/[service-name]/src/mcp/`
- **Domain Services**: `mcp-servers/[service-name]/src/[domain]/`
```

## Checklist for Prompt Updates

Before finalizing any development prompt, verify:

- [ ] **Architectural Foundation Reference** section included with all completed work
- [ ] **Repository Integration** as Step 1 with backend integration tasks
- [ ] **Dependencies** properly list completed weeks with dates
- [ ] **Technical Requirements** include repository pattern requirements
- [ ] **Code Locations** include both MCP server and backend paths
- [ ] **Testing Steps** include repository integration testing
- [ ] **Success Criteria** include repository pattern compliance

## Examples of Architectural Continuity Issues to Avoid

### ❌ Bad Example:
```markdown
## Dependencies
- Writing Analysis MCP (Week 7)
- Student Profiling MCP (Week 8)
```

### ✅ Good Example:
```markdown
## Dependencies
- **Phase 1 Foundation**: Privacy-aware repository pattern, event-driven architecture, monitoring system (completed)
- **Week 7**: Writing Analysis MCP Server with repository integration (completed 2025-06-02)
- **Week 8**: Student Profiling MCP Server with triple-tier fallback architecture (completed 2025-06-03)
```

### ❌ Bad Example:
```markdown
### Step 1: NestJS MCP Server Setup
- [ ] Create mcp-servers/service-name/ directory
```

### ✅ Good Example:
```markdown
### Step 1: Repository Pattern Integration (REQUIRED FIRST)
- [ ] **Review completed architecture**: Study Phase 1 Week 2 and relevant patterns
- [ ] Create backend repository interfaces following established patterns
- [ ] Integrate with ServiceFactory dependency injection

### Step 2: NestJS MCP Server Setup
- [ ] Create mcp-servers/service-name/ directory following Week 7-8 patterns
```

## Benefits of This Template

1. **Prevents Architectural Drift**: Ensures each week builds on previous work
2. **Maintains Privacy Compliance**: Guarantees privacy patterns are followed
3. **Ensures Repository Integration**: Prevents MCP-only implementations
4. **Improves Development Velocity**: Reduces rework and architectural conflicts
5. **Maintains Documentation Quality**: Ensures proper reference to completed work

## Usage Instructions

1. **Copy relevant sections** from this template into new development prompts
2. **Update the completed work list** as new weeks are finished
3. **Customize service-specific requirements** while maintaining architectural patterns
4. **Review completion status** in `docs/prompts/review/` folder before creating new prompts
5. **Validate architectural alignment** before finalizing any prompt

---

**Template Version**: 1.0  
**Created**: 2025-06-03  
**Purpose**: Prevent architectural misalignment in microservices migration