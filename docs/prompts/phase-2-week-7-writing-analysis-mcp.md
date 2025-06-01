# Phase 2 - Week 7: Writing Analysis MCP Server (NestJS)

## Objective
Create the first NestJS-based MCP server by extracting WritingProcessAnalyzer and ReflectionAnalysisService into a sophisticated microservice that establishes patterns for complex AI services.

## Context
- **Current Phase**: Phase 2 - Extract Services
- **Week**: Week 7 of 20
- **Branch**: `feat/mcp-microservices-migration`
- **Dependencies**: Phase 1 decoupling complete, repository pattern implemented, event system operational

## Scope
### In Scope
- Create NestJS MCP server for writing analysis
- Extract WritingProcessAnalyzer and ReflectionAnalysisService
- Implement 4 MCP tools: analyze_writing_patterns, evaluate_reflection_quality, track_writing_progress, generate_writing_insights
- Set up comprehensive NestJS architecture with modules, providers, and dependency injection
- Integrate with existing event system and repository pattern

### Out of Scope
- Other AI services (save for later weeks)
- Production deployment configuration
- Advanced performance optimizations
- Frontend integration changes

## Technical Requirements
1. **Framework**: NestJS 10.x with full TypeScript support
2. **MCP Protocol**: Complete tool registration and communication
3. **Performance**: <200ms response time (p95) for analysis operations
4. **Architecture**: Domain-driven design with CQRS patterns

## Implementation Steps

### Step 1: NestJS MCP Server Setup
- [ ] Create `mcp-servers/writing-analysis/` directory structure
- [ ] Initialize NestJS project: `nest new writing-analysis-mcp-server`
- [ ] Install MCP dependencies: `npm install @anthropic/mcp-sdk`
- [ ] Configure TypeScript and project structure
- [ ] Set up Docker container for the service

### Step 2: MCP Protocol Integration
- [ ] Create `src/mcp/mcp-server.module.ts` for MCP integration
- [ ] Implement `src/mcp/mcp-tools.controller.ts` for tool registration
- [ ] Define MCP tool schemas in `src/mcp/schemas/`
- [ ] Create `src/mcp/mcp-tools.service.ts` for tool orchestration
- [ ] Set up MCP server initialization and health checks

### Step 3: Core Domain Modules
- [ ] Create `src/writing-analysis/writing-analysis.module.ts`
- [ ] Create `src/reflection-analysis/reflection-analysis.module.ts`
- [ ] Create `src/insights-generation/insights-generation.module.ts`
- [ ] Implement domain services with dependency injection
- [ ] Set up inter-module communication patterns

### Step 4: Writing Pattern Analysis Tool
- [ ] Create `src/writing-analysis/services/writing-pattern-analyzer.service.ts`
- [ ] Implement `analyze_writing_patterns` MCP tool
- [ ] Add input validation with class-validator DTOs
- [ ] Integrate with repository pattern for data access
- [ ] Add comprehensive error handling and logging

### Step 5: Reflection Quality Assessment Tool
- [ ] Create `src/reflection-analysis/services/reflection-quality-assessor.service.ts`
- [ ] Implement `evaluate_reflection_quality` MCP tool
- [ ] Add metacognitive analysis algorithms
- [ ] Integrate with student learning profile data
- [ ] Add educational purpose validation

### Step 6: Writing Progress Tracking Tool
- [ ] Create `src/writing-analysis/services/writing-progress-tracker.service.ts`
- [ ] Implement `track_writing_progress` MCP tool
- [ ] Add longitudinal analysis capabilities
- [ ] Integrate with analytics repository
- [ ] Add privacy-preserving aggregation

### Step 7: Educational Insights Generation Tool
- [ ] Create `src/insights-generation/services/insights-generator.service.ts`
- [ ] Implement `generate_writing_insights` MCP tool
- [ ] Add educator-specific insight formatting
- [ ] Integrate with privacy compliance service
- [ ] Add recommendation engine

### Step 8: Repository Integration
- [ ] Create `src/repositories/repositories.module.ts`
- [ ] Set up repository providers with dependency injection
- [ ] Create service-specific repository interfaces
- [ ] Add connection pooling and transaction support
- [ ] Implement caching layer integration

### Step 9: Event System Integration
- [ ] Create `src/events/events.module.ts`
- [ ] Implement event publishing for analysis results
- [ ] Set up event subscription for writing session updates
- [ ] Add event-driven cache invalidation
- [ ] Create comprehensive event logging

### Step 10: Testing Infrastructure
- [ ] Set up Jest with NestJS testing utilities
- [ ] Create unit tests for all services and controllers
- [ ] Add integration tests for MCP tool functionality
- [ ] Create mock repository implementations
- [ ] Add performance benchmarking tests

## Code Locations
- **MCP Server**: `mcp-servers/writing-analysis/`
- **Main Module**: `mcp-servers/writing-analysis/src/app.module.ts`
- **MCP Integration**: `mcp-servers/writing-analysis/src/mcp/`
- **Domain Services**: `mcp-servers/writing-analysis/src/writing-analysis/`, `mcp-servers/writing-analysis/src/reflection-analysis/`
- **Repositories**: `mcp-servers/writing-analysis/src/repositories/`
- **Events**: `mcp-servers/writing-analysis/src/events/`
- **Configuration**: `mcp-servers/writing-analysis/src/config/`

## Testing Steps
- [ ] Run NestJS test suite: `cd mcp-servers/writing-analysis && npm test`
- [ ] Test MCP tool functionality:
  - [ ] Test `analyze_writing_patterns` tool with sample writing data
  - [ ] Test `evaluate_reflection_quality` tool with reflection submissions
  - [ ] Test `track_writing_progress` tool with longitudinal data
  - [ ] Test `generate_writing_insights` tool with educator context
- [ ] Test MCP protocol integration:
  - [ ] Verify MCP server starts and registers tools correctly
  - [ ] Test tool schema validation with invalid inputs
  - [ ] Test error handling and response formatting
  - [ ] Verify MCP communication protocol compliance
- [ ] Performance testing:
  - [ ] Measure response times for each tool: `npm run benchmark`
  - [ ] Verify <200ms p95 response time requirement
  - [ ] Test concurrent tool execution performance
  - [ ] Load test with 100+ concurrent requests
- [ ] Integration testing:
  - [ ] Test repository integration with existing data
  - [ ] Test event publishing for analysis results
  - [ ] Test event subscription for writing session updates
  - [ ] Verify cache integration works correctly
- [ ] Educational validation testing:
  - [ ] Test educational purpose validation rejects non-educational requests
  - [ ] Test privacy compliance filters sensitive data
  - [ ] Test student learning profile integration
  - [ ] Verify metacognitive analysis algorithms work correctly
- [ ] End-to-end testing:
  - [ ] Start both main backend and MCP server
  - [ ] Test writing analysis flow from frontend through MCP server
  - [ ] Verify no functionality regression
  - [ ] Test with multiple educational scenarios

## Success Criteria
- [ ] All 4 MCP tools implemented and functional
- [ ] NestJS architecture with proper dependency injection
- [ ] Integration with existing repository pattern
- [ ] Event publishing/subscription working correctly
- [ ] Comprehensive test suite with >95% coverage
- [ ] Performance targets met: <200ms response time
- [ ] Educational purpose validation enforced
- [ ] Privacy compliance fully implemented

## Reference Documents
- [Migration Plan - Phase 2 Service Extraction](../roadmaps/AI_MCP_MIGRATION_SUMMARY.md#phase-2-extract-services-weeks-7-12)
- [Technical Details - NestJS Architecture](../roadmaps/AI_MCP_TECHNICAL_ADDENDUM.md#nestjs-services-standards)
- [MCP Protocol Documentation](../guides/MCP_PROTOCOL_GUIDE.md)
- [Writing Analysis Service Documentation](../services/WRITING_ANALYSIS_SERVICE.md)

## Notes
- This is the architectural template for all complex MCP services
- Focus on educational domain modeling with proper abstractions
- Ensure educational purpose validation is integrated throughout
- Use NestJS decorators and guards for cross-cutting concerns
- Document patterns for other team members to follow

## Next Steps
After completing this prompt:
1. Run `/reflect` to document NestJS patterns and architectural decisions
2. Commit with message: "feat: Implement writing analysis MCP server with NestJS architecture"
3. Create comprehensive PR with architecture documentation
4. Next prompt: `phase-2-week-8-student-profiling-mcp.md`