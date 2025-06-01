# Phase 1 - Week 3: Service Decoupling

## Objective
Complete service decoupling by implementing event-driven communication and cache abstraction, preparing remaining AI services for microservices extraction.

## Context
- **Current Phase**: Phase 1 - Decouple & Modernize
- **Week**: Week 3 of 6
- **Branch**: `feat/mcp-microservices-migration`
- **Dependencies**: Repository pattern from Week 2, Fastify setup from Week 1

## Scope
### In Scope
- Implement event system for service communication
- Create cache abstraction layer with Redis
- Decouple remaining AI services: WritingProcessAnalyzer, ReflectionAnalysisService, CognitiveLoadService
- Add comprehensive logging and monitoring
- Set up message queue infrastructure (RabbitMQ)

### Out of Scope
- Actual microservices extraction (Phase 2)
- Performance optimizations (Phase 3)
- Production message queue deployment
- Frontend changes

## Technical Requirements
1. **Event System**: Async event publishing and subscription
2. **Cache Layer**: Redis abstraction with educational data patterns
3. **Message Queue**: RabbitMQ setup for future MCP communication
4. **Monitoring**: Comprehensive logging for distributed tracing

## Implementation Steps

### Step 1: Event System Implementation
- [ ] Create `backend/src/events/EventBus.ts` interface and implementation
- [ ] Create `backend/src/events/events/` directory for event definitions
- [ ] Define educational events: `StudentProgressUpdated`, `AIInteractionLogged`, `InterventionTriggered`
- [ ] Implement in-memory event bus for Phase 1 (upgrade to RabbitMQ in Phase 2)
- [ ] Add event publishing to existing services

### Step 2: Cache Abstraction Layer
- [ ] Create `backend/src/cache/CacheService.ts` interface
- [ ] Implement `backend/src/cache/RedisCacheService.ts`
- [ ] Create educational cache key patterns: `student:{id}:profile`, `ai:{studentId}:interactions`
- [ ] Add cache TTL strategies for different data types
- [ ] Update services to use cache abstraction

### Step 3: Message Queue Infrastructure
- [ ] Add RabbitMQ Docker container to `docker-compose.yml`
- [ ] Create `backend/src/messaging/MessageQueue.ts` interface
- [ ] Implement `backend/src/messaging/RabbitMQService.ts`
- [ ] Set up queue topology for educational events
- [ ] Create connection management and error handling

### Step 4: Service Decoupling - WritingProcessAnalyzer
- [ ] Refactor `backend/src/services/WritingProcessAnalyzer.ts` to use repositories
- [ ] Remove direct service-to-service imports
- [ ] Implement event publishing for analysis results
- [ ] Add caching for writing pattern analysis
- [ ] Create service interface for future MCP extraction

### Step 5: Service Decoupling - ReflectionAnalysisService
- [ ] Refactor `backend/src/services/ReflectionAnalysisService.ts` to use repositories
- [ ] Implement event-driven communication with other services
- [ ] Add caching for reflection quality assessments
- [ ] Remove tight coupling with WritingProcessAnalyzer

### Step 6: Service Decoupling - CognitiveLoadService
- [ ] Refactor `backend/src/services/CognitiveLoadService.ts` to use repositories
- [ ] Implement real-time event publishing for cognitive state changes
- [ ] Add caching for cognitive load calculations
- [ ] Prepare for high-frequency event processing

### Step 7: Monitoring and Logging
- [ ] Create `backend/src/monitoring/Logger.ts` with structured logging
- [ ] Add correlation IDs for request tracing
- [ ] Implement service health checks
- [ ] Create metrics collection for service interactions

## Code Locations
- **Event system**: `backend/src/events/`
- **Cache layer**: `backend/src/cache/`
- **Message queue**: `backend/src/messaging/`
- **Services to refactor**: `backend/src/services/WritingProcessAnalyzer.ts`, `backend/src/services/ReflectionAnalysisService.ts`, `backend/src/services/CognitiveLoadService.ts`
- **Monitoring**: `backend/src/monitoring/`
- **Configuration**: `backend/src/config/messaging.ts`, `backend/src/config/cache.ts`

## Testing Steps
- [ ] Run full test suite: `cd backend && npm test`
- [ ] Test event system:
  - [ ] Verify event publishing works: Test service triggers generate correct events
  - [ ] Verify event subscription works: Test services respond to published events
  - [ ] Test event bus performance: Measure event processing latency
  - [ ] Verify correlation IDs are preserved across events
- [ ] Test cache abstraction:
  - [ ] Start Redis: `docker-compose up redis`
  - [ ] Test cache operations: set, get, delete, TTL expiration
  - [ ] Test educational cache key patterns work correctly
  - [ ] Verify cache invalidation on relevant events
- [ ] Test message queue infrastructure:
  - [ ] Start RabbitMQ: `docker-compose up rabbitmq`
  - [ ] Test connection management and error handling
  - [ ] Verify queue topology setup
  - [ ] Test message publishing and consumption
- [ ] Test service decoupling:
  - [ ] Check no direct service-to-service imports: `grep -r "import.*services/" src/services/`
  - [ ] Verify WritingProcessAnalyzer uses only repositories and events
  - [ ] Verify ReflectionAnalysisService decoupled properly
  - [ ] Verify CognitiveLoadService real-time events work
- [ ] Test monitoring and logging:
  - [ ] Verify structured logging includes correlation IDs
  - [ ] Test service health checks respond correctly
  - [ ] Verify metrics collection for service interactions
- [ ] End-to-end functionality test:
  - [ ] Run frontend and test complete writing analysis flow
  - [ ] Verify all AI service functionality preserved
  - [ ] Test with multiple concurrent users

## Success Criteria
- [ ] All AI services communicate through events, not direct calls
- [ ] Cache abstraction working with Redis backend
- [ ] RabbitMQ infrastructure ready for Phase 2
- [ ] No direct database access in services (repository pattern only)
- [ ] Comprehensive logging with correlation IDs
- [ ] All existing functionality preserved
- [ ] Service interfaces ready for MCP extraction

## Reference Documents
- [Migration Plan - Phase 1 Decoupling](../roadmaps/AI_MCP_MIGRATION_SUMMARY.md#phase-1-decouple-weeks-1-6)
- [Technical Details - Event System](../roadmaps/AI_MCP_TECHNICAL_ADDENDUM.md#event-driven-architecture)
- [Message Queue Patterns](../guides/MESSAGE_QUEUE_PATTERNS.md)

## Notes
- Keep event payloads small and focused on educational context
- Use correlation IDs to trace requests across services
- Cache keys should include educational context (courseId, studentId)
- Prepare event schemas for MCP tool communication in Phase 2

## Next Steps
After completing this prompt:
1. Run `/reflect` to document event patterns and decoupling insights
2. Commit with message: "feat: Implement event-driven service communication and cache abstraction"
3. Create PR for service decoupling review
4. Next prompt: `phase-1-week-4-remaining-services.md`