# Phase 3 - Week 14: Cognitive Monitoring MCP Server (Fastify)

## Objective
Implement the highest-performance MCP server using Fastify for real-time cognitive monitoring, capable of processing 100+ behavioral events per second with <50ms response times.

## Context
- **Current Phase**: Phase 3 - Infrastructure & Performance
- **Week**: Week 14 of 20
- **Branch**: `feat/mcp-microservices-migration`
- **Dependencies**: Phase 2 NestJS patterns established, message queue infrastructure operational, Redis caching layer ready

## Scope
### In Scope
- Create ultra-high-performance Fastify MCP server
- Extract CognitiveLoadService into real-time monitoring microservice
- Implement WebSocket connections for live behavioral data streaming
- Build cognitive load detection and intervention triggering algorithms
- Optimize for classroom-scale concurrent monitoring (1000+ students)

### Out of Scope
- Machine learning model training (use existing algorithms)
- Frontend cognitive monitoring dashboard
- Production WebSocket infrastructure
- Advanced intervention delivery mechanisms

## Technical Requirements
1. **Framework**: Fastify 4.x optimized for high-throughput real-time processing
2. **Performance**: <50ms cognitive assessment, <10ms event processing, >2000 req/sec
3. **Real-time**: WebSocket support with <10ms latency
4. **Memory**: <256MB per instance under full load

## Implementation Steps

### Step 1: High-Performance Fastify Setup
- [ ] Create `mcp-servers/cognitive-monitoring/` directory structure
- [ ] Initialize Fastify project with performance optimizations
- [ ] Install performance-focused dependencies: `fastify`, `@fastify/websocket`, `@fastify/compress`
- [ ] Configure Fastify for educational real-time workloads
- [ ] Set up Docker container with resource limits

### Step 2: MCP Protocol Integration
- [ ] Create `src/mcp/mcp-server.ts` with Fastify-style registration
- [ ] Implement MCP tools using Fastify schema validation
- [ ] Set up tool registry: `detect_cognitive_overload`, `analyze_behavioral_patterns`, `trigger_interventions`, `monitor_real_time_metrics`
- [ ] Add comprehensive JSON Schema definitions
- [ ] Implement ultra-fast tool processing pipeline

### Step 3: Real-Time WebSocket Infrastructure
- [ ] Set up `src/websocket/websocket-handler.ts` for behavioral data streaming
- [ ] Implement connection management for classroom-scale monitoring
- [ ] Create efficient message parsing for high-frequency events
- [ ] Add connection pooling and resource management
- [ ] Implement graceful degradation under load

### Step 4: High-Performance Event Processing
- [ ] Create `src/processing/cognitive-event-processor.ts`
- [ ] Implement circular buffer for behavioral event storage
- [ ] Build ultra-efficient cognitive load calculation algorithms
- [ ] Add in-memory data structures optimized for speed
- [ ] Create batch processing for multiple students

### Step 5: Cognitive Load Detection Algorithm
- [ ] Create `src/algorithms/cognitive-load-detector.ts`
- [ ] Implement research-based cognitive load indicators
- [ ] Add pause analysis, revision pattern detection, writing velocity tracking
- [ ] Build confidence scoring for cognitive assessments
- [ ] Optimize algorithms for <10ms processing time

### Step 6: Behavioral Pattern Analysis
- [ ] Create `src/algorithms/behavioral-pattern-analyzer.ts`
- [ ] Implement struggle pattern detection (blank page syndrome, revision spiral, cognitive overload)
- [ ] Add engagement level assessment algorithms
- [ ] Build predictive indicators for student success/struggle
- [ ] Add pattern confidence and intervention recommendations

### Step 7: Real-Time Intervention Engine
- [ ] Create `src/interventions/intervention-engine.ts`
- [ ] Implement intervention decision matrix for educational scenarios
- [ ] Add privacy-respecting intervention delivery
- [ ] Create urgency assessment and timing optimization
- [ ] Build educator notification system

### Step 8: Memory-Optimized Data Management
- [ ] Create `src/data/circular-buffer.ts` for high-frequency event storage
- [ ] Implement efficient data structures for cognitive state tracking
- [ ] Add memory pooling for object reuse
- [ ] Create garbage collection optimization
- [ ] Build data compaction for historical events

### Step 9: Performance Monitoring
- [ ] Create `src/monitoring/performance-monitor.ts`
- [ ] Add real-time performance metrics collection
- [ ] Implement latency tracking and alerting
- [ ] Create memory usage monitoring
- [ ] Add throughput and error rate tracking

### Step 10: Educational Privacy Integration
- [ ] Create `src/privacy/privacy-filter.ts`
- [ ] Implement real-time privacy preference enforcement
- [ ] Add behavioral data anonymization
- [ ] Create educational purpose validation
- [ ] Build audit trail for cognitive monitoring activities

## Code Locations
- **MCP Server**: `mcp-servers/cognitive-monitoring/`
- **Main Application**: `mcp-servers/cognitive-monitoring/src/app.ts`
- **MCP Integration**: `mcp-servers/cognitive-monitoring/src/mcp/`
- **WebSocket Handling**: `mcp-servers/cognitive-monitoring/src/websocket/`
- **Algorithms**: `mcp-servers/cognitive-monitoring/src/algorithms/`
- **Real-time Processing**: `mcp-servers/cognitive-monitoring/src/processing/`
- **Performance Monitoring**: `mcp-servers/cognitive-monitoring/src/monitoring/`

## Testing Steps
- [ ] Run Fastify test suite: `cd mcp-servers/cognitive-monitoring && npm test`
- [ ] Performance testing:
  - [ ] Benchmark cognitive load assessment: `npm run benchmark:cognitive`
  - [ ] Verify <50ms response time for cognitive assessments
  - [ ] Benchmark behavioral event processing: `npm run benchmark:events`
  - [ ] Verify <10ms processing time for behavioral events
  - [ ] Load test with 2000+ requests/second: `npm run loadtest`
- [ ] Real-time WebSocket testing:
  - [ ] Test WebSocket connection establishment
  - [ ] Measure WebSocket message latency (<10ms requirement)
  - [ ] Test 1000+ concurrent WebSocket connections
  - [ ] Test connection pooling and resource management
  - [ ] Test graceful degradation under load
- [ ] MCP tool testing:
  - [ ] Test `detect_cognitive_overload` with behavioral data streams
  - [ ] Test `analyze_behavioral_patterns` with various struggle patterns
  - [ ] Test `trigger_interventions` with different urgency levels
  - [ ] Test `monitor_real_time_metrics` accuracy and performance
- [ ] Memory and resource testing:
  - [ ] Monitor memory usage under full load: `npm run memory-test`
  - [ ] Verify <256MB memory usage per instance
  - [ ] Test garbage collection performance
  - [ ] Test circular buffer efficiency
- [ ] Algorithm accuracy testing:
  - [ ] Test cognitive load detection accuracy with known patterns
  - [ ] Test behavioral pattern recognition (>85% accuracy requirement)
  - [ ] Test intervention decision matrix with educational scenarios
  - [ ] Validate confidence scoring algorithms
- [ ] Privacy and educational compliance:
  - [ ] Test real-time privacy filter performance
  - [ ] Test behavioral data anonymization
  - [ ] Test educational purpose validation under high load
  - [ ] Verify audit trail creation doesn't impact performance
- [ ] Integration testing:
  - [ ] Test integration with main backend event system
  - [ ] Test Redis integration for high-frequency data
  - [ ] Test educator notification system
  - [ ] End-to-end classroom simulation with 100+ virtual students

## Success Criteria
- [ ] <50ms cognitive load assessment response time
- [ ] <10ms behavioral event processing time
- [ ] 1000+ concurrent student monitoring capability
- [ ] >2000 requests/second throughput
- [ ] <256MB memory usage per instance
- [ ] WebSocket connections with <10ms latency
- [ ] 99.9% uptime under classroom load
- [ ] Educational intervention accuracy >85%

## Reference Documents
- [Migration Plan - Phase 3 Performance](../roadmaps/AI_MCP_MIGRATION_SUMMARY.md#phase-3-infrastructure-weeks-13-16)
- [Technical Details - Fastify Optimization](../roadmaps/AI_MCP_TECHNICAL_ADDENDUM.md#fastify-services-standards)
- [Cognitive Load Research](../research/COGNITIVE_LOAD_ALGORITHMS.md)
- [Real-time Architecture Guide](../guides/REALTIME_ARCHITECTURE.md)

## Notes
- This service sets the performance standard for all high-throughput MCP servers
- Focus on educational real-time processing patterns over generic performance
- Ensure behavioral data privacy throughout the processing pipeline
- Document performance optimization techniques for team knowledge
- Maintain educational purpose validation even at high speed

## Next Steps
After completing this prompt:
1. Run `/reflect` to document high-performance patterns and optimization techniques
2. Commit with message: "feat: Implement high-performance cognitive monitoring MCP server"
3. Create performance benchmark documentation
4. Next prompt: `phase-3-week-15-performance-optimization.md`