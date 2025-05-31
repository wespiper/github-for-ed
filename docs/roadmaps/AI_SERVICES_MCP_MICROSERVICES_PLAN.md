# AI Services MCP Microservices Migration Plan

## Executive Summary

This document outlines a comprehensive plan to migrate Scribe Tree's backend AI services from a monolithic Express.js architecture to distributed MCP (Model Context Protocol) based microservices using a strategic hybrid framework approach. This migration combines a transition to high-performance Fastify for the main API with enterprise-grade NestJS for complex microservices, improving scalability, maintainability, and performance while leveraging Claude Code's native MCP support.

### Key Benefits
- **Better Separation of Concerns**: Each AI service becomes an independent, focused microservice
- **Improved Scalability**: Services can be scaled independently based on demand
- **Enhanced Maintainability**: Isolated codebases with clear boundaries
- **Performance Boost**: 2-3x throughput improvement with Fastify for high-traffic services
- **Enterprise Patterns**: NestJS provides robust patterns for complex business logic
- **Claude Code Integration**: Native MCP support for development and debugging
- **Fault Isolation**: Service failures don't cascade to the entire system

### Migration Timeline
- **Total Duration**: 4 months (20 weeks)
- **Phase 1**: 6 weeks - Decouple, Modularize, and Migrate to Fastify
- **Phase 2**: 6 weeks - Extract Priority Services with Framework Strategy
- **Phase 3**: 4 weeks - Infrastructure Setup and Performance Services
- **Phase 4**: 4 weeks - Complete Migration and Optimization

## Current State Analysis

### Existing AI Services (13 Total)

1. **Core Services**
   - `EducationalAIService`: Central orchestrator, Claude API integration
   - `BoundaryIntelligence`: Class performance and AI boundary analysis
   - `WritingProcessAnalyzer`: Pattern detection and writing insights
   - `CognitiveLoadDetector`: Real-time behavioral analysis
   - `RealTimeInterventionEngine`: Automated intervention system

2. **Supporting Services**
   - `StudentLearningProfileService`: Comprehensive student profiling
   - `ReflectionAnalysisService`: Reflection quality assessment
   - `AuthenticityDetector`: AI-generated content detection
   - `AcademicIntegrityService`: Academic honesty monitoring
   - `EducatorAlertService`: Real-time educator notifications
   - `AutoAdjustmentEngine`: Dynamic system adjustments
   - `ExternalAIDetectionService`: Third-party AI tool detection
   - `MCPValidationService`: MCP server integration

### Current Architecture Issues

1. **Tight Coupling**
   - Direct Prisma imports in every service
   - Services directly call each other
   - Shared in-memory cache
   - No clear transaction boundaries

2. **Scalability Limitations**
   - Cannot scale services independently
   - Memory-based caching not distributed
   - Synchronous processing only
   - No message queue or event system
   - Express.js performance bottlenecks under high load

3. **Maintenance Challenges**
   - Changes ripple across services
   - Testing requires full stack
   - Deployment is all-or-nothing
   - Debugging is complex
   - Lack of enterprise patterns for complex services

## Proposed MCP Microservices Architecture

### Framework Strategy

Our hybrid approach leverages the strengths of two modern frameworks:

- **Fastify**: For high-performance, I/O-intensive services requiring maximum throughput
- **NestJS**: For complex business logic services benefiting from enterprise patterns, dependency injection, and modular architecture

### Service Categories and Groupings

#### 1. **Core Educational AI Services** (3 MCP Servers)

**MCP Server: `educational-ai-core`** (NestJS)
- **Framework Rationale**: Complex orchestration logic, multiple dependencies, benefits from DI and modular architecture
- EducationalAIService (main orchestrator)
- BoundaryIntelligence
- Tools:
  - `generate_educational_prompt`
  - `analyze_class_boundaries`
  - `get_ai_assistance_recommendations`

**MCP Server: `writing-analysis`** (NestJS)
- **Framework Rationale**: Complex domain logic, pattern analysis algorithms, benefits from structured modules
- WritingProcessAnalyzer
- ReflectionAnalysisService
- Tools:
  - `analyze_writing_patterns`
  - `evaluate_reflection_quality`
  - `track_writing_progress`
  - `generate_writing_insights`

**MCP Server: `student-profiling`** (NestJS)
- **Framework Rationale**: Data-intensive operations, complex business rules, benefits from TypeORM integration
- StudentLearningProfileService
- Tools:
  - `build_student_profile`
  - `track_learning_trajectory`
  - `predict_student_needs`
  - `generate_personalized_recommendations`

#### 2. **Real-Time Monitoring Services** (2 MCP Servers)

**MCP Server: `cognitive-monitoring`** (Fastify)
- **Framework Rationale**: High-frequency real-time data processing, minimal overhead needed, performance critical
- CognitiveLoadDetector
- RealTimeInterventionEngine
- Tools:
  - `detect_cognitive_overload`
  - `analyze_behavioral_patterns`
  - `trigger_interventions`
  - `monitor_real_time_metrics`

**MCP Server: `educator-alerts`** (Fastify)
- **Framework Rationale**: High throughput alert processing, simple service logic, performance over complexity
- EducatorAlertService
- AutoAdjustmentEngine
- Tools:
  - `send_educator_alert`
  - `analyze_alert_patterns`
  - `auto_adjust_parameters`
  - `get_alert_history`

#### 3. **Integrity and Detection Services** (2 MCP Servers)

**MCP Server: `academic-integrity`** (NestJS)
- **Framework Rationale**: Complex detection algorithms, multiple AI provider integrations, benefits from modular architecture
- AcademicIntegrityService
- AuthenticityDetector
- ExternalAIDetectionService
- Tools:
  - `check_academic_integrity`
  - `detect_ai_content`
  - `analyze_external_ai_usage`
  - `generate_integrity_report`

**MCP Server: `educational-ai-validator`** (Fastify - Already Exists)
- **Framework Rationale**: Existing service, minimal refactoring needed, straightforward validation logic
- Validation and compliance tools
- Philosophy enforcement
- Educational boundary checking

### Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       API Gateway (Kong)                     │
└─────────────────┬───────────────────────────┬───────────────┘
                  │                           │
┌─────────────────▼───────────┐   ┌──────────▼───────────────┐
│    Fastify Backend API       │   │   Claude Code Client     │
│   (High-Performance Main)    │   │    (MCP Integration)     │
└─────────────────┬───────────┘   └──────────┬───────────────┘
                  │                           │
┌─────────────────▼───────────────────────────▼───────────────┐
│                    Message Queue (RabbitMQ)                  │
└─────────────────┬───────────────────────────┬───────────────┘
                  │                           │
     ┌────────────┴────────────┐   ┌─────────┴────────────┐
     │  NestJS MCP Servers     │   │  Fastify MCP Servers │
     │  ┌──────────────────┐  │   │  ┌────────────────┐  │
     │  │educational-ai-core│  │   │  │cognitive-monitor│ │
     │  └──────────────────┘  │   │  └────────────────┘  │
     │  ┌──────────────────┐  │   │  ┌────────────────┐  │
     │  │writing-analysis   │  │   │  │educator-alerts │  │
     │  └──────────────────┘  │   │  └────────────────┘  │
     │  ┌──────────────────┐  │   │  ┌────────────────┐  │
     │  │student-profiling  │  │   │  │ai-validator    │  │
     │  └──────────────────┘  │   │  └────────────────┘  │
     │  ┌──────────────────┐  │   └──────────────────────┘
     │  │academic-integrity │  │
     │  └──────────────────┘  │
     └─────────────────────────┘
                  │                           │
┌─────────────────▼───────────────────────────▼───────────────┐
│              Distributed Cache (Redis Cluster)               │
└─────────────────┬───────────────────────────┬───────────────┘
                  │                           │
┌─────────────────▼───────────┐   ┌──────────▼───────────────┐
│    PostgreSQL (Primary)      │   │  PostgreSQL (Read Replica)│
└──────────────────────────────┘   └──────────────────────────┘
```

## Migration Strategy

### Phase 1: Decouple, Modularize, and Migrate to Fastify (6 weeks)

#### Week 1-2: Fastify Migration for Main API
- **Week 1**: Set up Fastify project structure alongside Express
  - Install Fastify and essential plugins (cors, helmet, compress)
  - Create Fastify server configuration with optimal settings
  - Set up route auto-loading and plugin architecture
  - Implement parallel running for gradual migration
- **Week 2**: Migrate core routes to Fastify
  - Port authentication routes (highest traffic)
  - Migrate AI service endpoints
  - Implement request validation with JSON Schema
  - Add performance benchmarking

```typescript
// Fastify server setup with optimal configuration
const fastify = Fastify({
  logger: true,
  trustProxy: true,
  bodyLimit: 1048576, // 1MB
  caseSensitive: true,
  ignoreTrailingSlash: true
});

// Schema validation for performance
const aiRequestSchema = {
  body: {
    type: 'object',
    properties: {
      studentId: { type: 'string' },
      prompt: { type: 'string', maxLength: 1000 }
    },
    required: ['studentId', 'prompt']
  }
};
```

#### Week 2-4: Repository Pattern Implementation (Parallel with Fastify migration)
- Create repository interfaces for all database operations
- Implement repository classes with Prisma
- Update services to use repositories instead of direct Prisma access
- Add integration tests for repositories
- Optimize for both Express and Fastify compatibility

```typescript
// Example repository interface
interface StudentRepository {
  findById(id: string): Promise<Student>;
  findByWritingPattern(pattern: WritingPattern): Promise<Student[]>;
  updateProfile(id: string, profile: Partial<StudentProfile>): Promise<void>;
}
```

#### Week 4-5: Event System Introduction
- Implement event bus using EventEmitter initially
- Define event schemas for inter-service communication
- Replace direct service calls with events
- Add event logging and monitoring
- Ensure compatibility with both frameworks

```typescript
// Example event definitions
interface WritingAnalysisCompleted {
  studentId: string;
  assignmentId: string;
  patterns: WritingPattern[];
  timestamp: Date;
}
```

#### Week 6: Cache Abstraction and Team Training
- Create cache interface
- Implement Redis adapter
- Migrate from in-memory to Redis
- **Fastify Training**: Performance optimization, plugin development
- **NestJS Training**: Modules, dependency injection, decorators

### Phase 2: Extract Priority Services with Framework Strategy (6 weeks)

#### Week 7-8: Extract `writing-analysis` MCP Server (NestJS)
- **Why First**: Low coupling, clear boundaries, showcase NestJS patterns
- Create NestJS project structure with MCP integration
- Implement modules for WritingProcessAnalyzer and ReflectionAnalysisService
- Set up dependency injection and service providers
- Implement MCP tools with NestJS decorators
- Write comprehensive tests using Jest

```typescript
// NestJS MCP module structure
@Module({
  imports: [DatabaseModule, CacheModule],
  providers: [
    WritingAnalysisService,
    ReflectionAnalysisService,
    MCPToolsProvider
  ],
  exports: [MCPToolsProvider]
})
export class WritingAnalysisModule {}
```

#### Week 9-10: Extract `student-profiling` MCP Server (NestJS)
- Implement complex business logic with NestJS patterns
- Use TypeORM for advanced data operations
- Implement GraphQL subscriptions for real-time updates
- Create comprehensive DTOs with class-validator
- Set up Bull queues for background processing

#### Week 11-12: Enhance `educational-ai-validator` (Fastify)
- Minimal refactoring of existing Fastify code
- Add performance optimizations
- Implement caching strategies
- Update to use new event system
- Benchmark performance improvements

### Phase 3: Infrastructure Setup and Performance Services (4 weeks)

#### Week 13: Core Infrastructure Deployment
- Deploy RabbitMQ cluster with high availability
- Configure Kong API Gateway with framework-specific routing
- Set up service discovery for both NestJS and Fastify services
- Implement circuit breakers with framework-specific adapters

#### Week 14: Extract `cognitive-monitoring` MCP Server (Fastify)
- Implement high-performance real-time processing
- Use Fastify WebSocket plugin for live monitoring
- Optimize for minimal latency (<50ms)
- Implement efficient data streaming
- Set up performance benchmarks

```typescript
// Fastify WebSocket for real-time monitoring
fastify.register(require('@fastify/websocket'));
fastify.register(async function (fastify) {
  fastify.get('/monitor/:studentId', { websocket: true }, (connection, req) => {
    cognitiveMonitor.streamMetrics(req.params.studentId, connection);
  });
});
```

#### Week 15: Extract `educator-alerts` MCP Server (Fastify)
- Focus on high-throughput alert processing
- Implement efficient batching strategies
- Use Fastify hooks for performance optimization
- Set up horizontal scaling capabilities

#### Week 16: Monitoring and Observability
- Deploy Prometheus + Grafana with framework-specific metrics
- Set up distributed tracing (Jaeger) for both NestJS and Fastify
- Configure performance alerts and SLAs
- Create framework-specific dashboards

### Phase 4: Complete Migration and Optimization (4 weeks)

#### Week 17: Extract `educational-ai-core` MCP Server (NestJS)
- Implement complex orchestration with NestJS
- Use advanced patterns: CQRS, Event Sourcing
- Integrate multiple AI providers with strategy pattern
- Implement comprehensive error handling and retry logic
- Set up advanced caching strategies

#### Week 18: Extract `academic-integrity` MCP Server (NestJS)
- Implement sophisticated detection algorithms
- Use machine learning pipelines with NestJS modules
- Create rule engine for configurable detection
- Implement comprehensive audit logging
- Set up real-time alerts with WebSockets

#### Week 19: Framework-Specific Optimization
- **Fastify Services**: 
  - Fine-tune thread pool settings
  - Implement response caching
  - Optimize JSON serialization
- **NestJS Services**:
  - Optimize dependency injection
  - Implement lazy loading modules
  - Fine-tune TypeORM queries
- Conduct comparative benchmarks

#### Week 20: Final Testing and Deployment
- End-to-end testing across all frameworks
- Performance testing with framework-specific tools
- Load testing to verify 10x capacity improvement
- Final optimization based on production metrics
- Complete migration with zero-downtime deployment

## Service Implementation Details

### MCP Server Structure Template

```
mcp-servers/
└── [service-name]/
    ├── src/
    │   ├── index.ts           # MCP server entry
    │   ├── tools/             # MCP tool implementations
    │   ├── services/          # Business logic
    │   ├── repositories/      # Data access
    │   ├── events/            # Event handlers
    │   └── types/             # TypeScript types
    ├── tests/
    ├── Dockerfile
    ├── package.json
    └── README.md
```

### Example MCP Tool Implementation

```typescript
// tools/analyze-writing-patterns.ts
export const analyzeWritingPatterns: MCPTool = {
  name: 'analyze_writing_patterns',
  description: 'Analyze writing patterns for a student',
  inputSchema: {
    type: 'object',
    properties: {
      studentId: { type: 'string' },
      assignmentId: { type: 'string' },
      timeRange: { 
        type: 'object',
        properties: {
          start: { type: 'string', format: 'date-time' },
          end: { type: 'string', format: 'date-time' }
        }
      }
    },
    required: ['studentId', 'assignmentId']
  },
  handler: async (params) => {
    // Implementation
  }
};
```

### Communication Patterns

#### 1. Synchronous (via MCP Tools)
```typescript
// Claude Code or backend calls MCP tool
const result = await mcp.callTool('writing-analysis', 'analyze_writing_patterns', {
  studentId: '123',
  assignmentId: '456'
});
```

#### 2. Asynchronous (via Message Queue)
```typescript
// Publish event
await messageQueue.publish('writing.analysis.requested', {
  studentId: '123',
  assignmentId: '456',
  requestId: uuid()
});

// Subscribe in MCP server
messageQueue.subscribe('writing.analysis.requested', async (event) => {
  const result = await analyzeWriting(event);
  await messageQueue.publish('writing.analysis.completed', result);
});
```

## Risk Assessment and Mitigation

### Technical Risks

1. **Data Consistency**
   - **Risk**: Distributed transactions across services
   - **Mitigation**: Implement saga pattern for complex workflows

2. **Network Latency**
   - **Risk**: Increased response times
   - **Mitigation**: Strategic caching, async processing, Fastify's superior performance

3. **Service Discovery**
   - **Risk**: Services unable to find each other
   - **Mitigation**: Use Consul or Kubernetes service mesh

4. **Framework Migration**
   - **Risk**: Express to Fastify migration introduces bugs
   - **Mitigation**: Parallel running, comprehensive testing, gradual cutover
   
5. **Framework Incompatibility**
   - **Risk**: NestJS and Fastify services don't integrate well
   - **Mitigation**: Standardized MCP protocol, framework-agnostic message queue

### Operational Risks

1. **Increased Complexity**
   - **Risk**: Harder to debug and maintain multiple frameworks
   - **Mitigation**: Clear framework selection criteria, comprehensive documentation

2. **Deployment Complexity**
   - **Risk**: Different deployment patterns for NestJS vs Fastify
   - **Mitigation**: Unified Docker containers, standardized CI/CD pipelines

3. **Team Learning Curve**
   - **Risk**: Team needs to learn two new frameworks plus microservices
   - **Mitigation**: Phased training (Week 1 & 6), proof-of-concepts, pair programming
   
4. **Performance Regression**
   - **Risk**: Poor framework implementation negates benefits
   - **Mitigation**: Continuous benchmarking, performance testing gates

## Success Metrics

### Technical Metrics
- **Fastify services**: Response time < 100ms (p95)
- **NestJS services**: Response time < 200ms (p95)
- **Main API throughput**: 2-3x improvement over Express baseline
- System availability > 99.9%
- Deployment frequency increased by 3x
- Mean time to recovery < 15 minutes

### Business Metrics
- AI feature development velocity increased by 50%
- Bug resolution time decreased by 40%
- System can handle 10x current load
- Cost per student reduced by 30%
- Framework migration ROI achieved within 3 months

### Framework-Specific Metrics
- **Fastify API**: Handle 10,000+ requests/second per instance
- **NestJS services**: Maintain <5% CPU overhead from DI
- **Team proficiency**: 90% comfort level with both frameworks by Week 12
- **Code reusability**: 40% shared code between services

## Technology Stack

### Backend Frameworks (Hybrid Strategy)
- **Fastify**: Main API and high-performance MCP servers
  - 2-3x faster than Express
  - JSON Schema validation
  - Built-in TypeScript support
- **NestJS**: Complex MCP servers with enterprise needs
  - Dependency injection
  - Modular architecture
  - Decorator-based development

### Core Technologies
- **MCP Protocol**: Native Claude Code integration
- **Node.js + TypeScript**: Service implementation
- **RabbitMQ**: Message queue (framework-agnostic)
- **Redis Cluster**: Distributed cache
- **PostgreSQL**: Primary database
- **Kong**: API Gateway with framework routing

### Supporting Technologies
- **Docker + Kubernetes**: Container orchestration
- **Prometheus + Grafana**: Framework-specific metrics
- **Jaeger**: Distributed tracing
- **ELK Stack**: Logging
- **Consul**: Service discovery

## Next Steps

1. **Review and Approval**: Team review of hybrid framework strategy
2. **Proof of Concept Phase**:
   - Fastify POC: Migrate high-traffic auth endpoints
   - NestJS POC: Implement `writing-analysis` MCP server
3. **Training Preparation**: 
   - Fastify workshop materials (Week 1)
   - NestJS workshop materials (Week 6)
4. **Infrastructure Setup**: Provision development environment
5. **Begin Phase 1**: Start Fastify migration in parallel with decoupling

## Conclusion

This migration plan provides a structured approach to transforming Scribe Tree's AI services into a scalable, maintainable microservices architecture while strategically upgrading our backend technology stack. By combining Fastify's performance benefits with NestJS's enterprise patterns and leveraging MCP servers throughout, we achieve:

1. **Optimal Performance**: Fastify for high-throughput services, NestJS for complex business logic
2. **Better Separation of Concerns**: Each AI service becomes focused and independent
3. **Enhanced Developer Experience**: Modern frameworks with excellent TypeScript support
4. **Future-Proof Architecture**: Scalable, maintainable, and aligned with industry best practices

The phased approach minimizes risk while delivering incremental value, with the Express-to-Fastify migration providing immediate performance benefits in Phase 1. The hybrid framework strategy ensures we use the right tool for each service's specific needs, maximizing both performance and maintainability while maintaining the educational focus and AI boundaries that are core to the platform's mission.