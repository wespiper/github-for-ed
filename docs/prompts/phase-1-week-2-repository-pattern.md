# Phase 1 - Week 2: Repository Pattern Implementation

## Objective
Implement the repository pattern to decouple AI services from direct Prisma access, starting with the highest-volume data operations (Student, Assignment, and AIInteraction repositories).

## Context
- **Current Phase**: Phase 1 - Decouple & Modernize
- **Week**: Week 2 of 6
- **Branch**: `feat/mcp-microservices-migration`
- **Dependencies**: Fastify setup from Week 1, existing Prisma schema

## Scope
### In Scope
- Create repository interfaces for Student, Assignment, and AIInteraction data
- Implement Prisma-based repository classes
- Refactor AIBoundaryService and EducationalAIService to use repositories
- Create mock repositories for testing
- Set up dependency injection patterns

### Out of Scope
- Changing database schema or migrations
- Modifying business logic in services
- Other AI services (defer to Week 3-4)
- Performance optimizations (focus on patterns)

## Technical Requirements
1. **Pattern**: Repository pattern with clear interfaces
2. **Framework**: Compatible with both Express and Fastify
3. **Testing**: Mock implementations for unit tests
4. **Performance**: No regression in query performance

## Implementation Steps

### Step 1: Repository Interfaces
- [ ] Create `backend/src/repositories/interfaces/StudentRepository.ts`
- [ ] Create `backend/src/repositories/interfaces/AssignmentRepository.ts` 
- [ ] Create `backend/src/repositories/interfaces/AIInteractionRepository.ts`
- [ ] Define common `BaseRepository<T, ID>` interface
- [ ] Add educational-specific methods (findByCourse, findByStudent)

### Step 2: Prisma Implementations
- [ ] Create `backend/src/repositories/prisma/PrismaStudentRepository.ts`
- [ ] Create `backend/src/repositories/prisma/PrismaAssignmentRepository.ts`
- [ ] Create `backend/src/repositories/prisma/PrismaAIInteractionRepository.ts`
- [ ] Implement connection pooling optimization
- [ ] Add comprehensive error handling

### Step 3: Service Refactoring
- [ ] Refactor `backend/src/services/AIBoundaryService.ts` to use repositories
- [ ] Refactor `backend/src/services/EducationalAIService.ts` to use repositories
- [ ] Update dependency injection in both Express and Fastify apps
- [ ] Ensure no direct Prisma imports in services

### Step 4: Testing Infrastructure
- [ ] Create `backend/src/repositories/mock/MockStudentRepository.ts`
- [ ] Create `backend/src/repositories/mock/MockAssignmentRepository.ts`
- [ ] Create `backend/src/repositories/mock/MockAIInteractionRepository.ts`
- [ ] Update service tests to use mock repositories
- [ ] Create integration tests for Prisma repositories

### Step 5: Dependency Injection Setup
- [ ] Create `backend/src/container/repositories.ts` for DI configuration
- [ ] Update Fastify app to register repositories as decorators
- [ ] Update Express app to use repository instances
- [ ] Create factory pattern for repository creation

## Code Locations
- **Repository interfaces**: `backend/src/repositories/interfaces/`
- **Prisma implementations**: `backend/src/repositories/prisma/`
- **Mock implementations**: `backend/src/repositories/mock/`
- **Services to refactor**: `backend/src/services/AIBoundaryService.ts`, `backend/src/services/EducationalAIService.ts`
- **DI configuration**: `backend/src/container/`

## Testing Steps
- [ ] Run existing test suite: `cd backend && npm test`
- [ ] Test repository implementations:
  - [ ] Run unit tests for each repository: `npm test -- --grep="Repository"`
  - [ ] Test Prisma connection with repositories: `npm test -- integration`
- [ ] Test service decoupling:
  - [ ] Verify AIBoundaryService tests pass with mock repositories
  - [ ] Verify EducationalAIService tests pass with mock repositories
  - [ ] Check no direct Prisma imports in service files: `grep -r "import.*@prisma" src/services/`
- [ ] Performance testing:
  - [ ] Run database query performance tests
  - [ ] Compare response times before/after repository pattern implementation
  - [ ] Verify no regression in API endpoint response times
- [ ] Integration testing:
  - [ ] Test repository factory creation
  - [ ] Test dependency injection in both Express and Fastify apps
  - [ ] Verify transaction support works correctly
  - [ ] Test error handling for database connection failures

## Success Criteria
- [ ] All repository interfaces defined with comprehensive methods
- [ ] Prisma implementations working with existing data
- [ ] AIBoundaryService and EducationalAIService fully decoupled
- [ ] All existing tests pass with mock repositories
- [ ] No performance regression in data operations
- [ ] Integration tests validate repository behavior

## Reference Documents
- [Migration Plan](../roadmaps/AI_MCP_MIGRATION_SUMMARY.md)
- [Technical Details - Repository Pattern](../roadmaps/AI_MCP_TECHNICAL_ADDENDUM.md#repository-pattern-implementation)
- [Repository Pattern Guide](https://martinfowler.com/eaaCatalog/repository.html)

## Notes
- Focus on educational data access patterns (student-centric queries)
- Ensure repository methods match actual service usage patterns
- Keep transaction support for complex operations
- Document query optimization opportunities for Phase 3

## Next Steps
After completing this prompt:
1. Run `/reflect` to document repository patterns and learnings
2. Commit with message: "feat: Implement repository pattern for core data access"
3. Create PR for repository pattern review
4. Next prompt: `phase-1-week-3-service-decoupling.md`