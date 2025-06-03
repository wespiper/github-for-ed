# CLAUDE.md

Quick operational reference for Claude Code. For detailed documentation, use the MCP server:
`search_documents({"query": "your topic"})`

## Architecture Overview

Scribe Tree is a monorepo containing a React frontend and Node.js backend for teaching writing using version control concepts with responsible AI integration.

**Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + ShadCN UI
**Backend**: Event-driven microservices architecture with Node.js + Express + TypeScript + PostgreSQL + Prisma
**Structure**: Separate `/frontend` and `/backend` directories with independent package.json files

### Event-Driven Architecture
- **ServiceFactory**: Dependency injection container managing all services
- **EventBus**: Privacy-enhanced educational domain events with AES-256-CBC encryption
- **Repository Pattern**: Privacy-aware data access with audit trails and consent management
- **Cache Layer**: Privacy-aware Redis + in-memory with consent-based TTL strategies
- **Message Queues**: RabbitMQ + in-memory with encrypted privacy event routing
- **Monitoring**: Correlation IDs, health checks, privacy metrics, and compliance tracking

## Development Commands

### Frontend (React + Vite)

```bash
cd frontend
npm run dev     # Development server on http://localhost:5173
npm run build   # TypeScript compilation + Vite production build
npm run lint    # ESLint checking
npm run preview # Preview production build
```

### Backend (Node.js + Express)

```bash
cd backend
npm run dev     # Nodemon with ts-node hot reload on http://localhost:5001
npm run build   # TypeScript compilation to ./dist
npm run start   # Production server from compiled JS

# Privacy Testing
npm test -- --testPathPattern=privacy  # Run privacy test suite (116/119 passing)
```

## Setup Requirements

1. Install dependencies in both directories: `npm install`
2. Copy `backend/.env.example` to `backend/.env`
3. Ensure PostgreSQL is running (local or provide DATABASE_URL)
4. Run Prisma migrations: `npx prisma migrate dev`
5. Run both frontend and backend concurrently for development

## Key Configuration

### Path Aliases
- Frontend uses `@/*` mapping to `./src/*` (configured in tsconfig.json and vite.config.ts)
- Import components as `@/components/ui/button` instead of relative paths

### ShadCN UI Setup
- Pre-configured with "New York" style variant
- Add components: `npx shadcn@latest add [component-name]`
- Components installed to `frontend/src/components/ui/`

### Database Connection
- PostgreSQL with Prisma ORM
- Connection string via `DATABASE_URL` environment variable
- Automatic schema synchronization with `prisma db push`

### Service Architecture
- **Repository Pattern**: All data access via repository interfaces
- **Event-Driven Communication**: Services communicate via educational domain events
- **ServiceFactory**: Dependency injection container in `src/container/ServiceFactory.ts`
- **Cache Abstraction**: Educational cache patterns with Redis/in-memory backends
- **Message Queues**: RabbitMQ/in-memory for asynchronous service communication

### Reflection System
- **Quality Analysis**: Multi-dimensional assessment (depth, self-awareness, critical thinking, growth mindset)
- **Progressive Access**: AI assistance levels based on reflection quality (restricted → basic → standard → enhanced)
- **Educational Analytics**: Class trends, individual progress tracking, quality distribution
- **Real-time Events**: Reflection analysis triggers student progress and intervention events

## Using the Documentation MCP Server

The project has comprehensive documentation available through the MCP server tools:

### Search Documentation
```javascript
search_documents({"query": "testing philosophy"})
search_documents({"query": "AI", "category": "ai-philosophy"})
search_documents({"query": "architecture", "type": "guide"})
```

### Read Specific Documents
```javascript
read_document({"path": "docs/guides/TESTING_GUIDE.md"})
read_document({"path": "docs/philosophy/scribe-tree-ai-philosophy-white-paper.md"})
```

### Get Project Context
```javascript
get_project_context({"includeRecentActivity": true})
```

### Common Documentation Searches
- **Testing**: `search_documents({"query": "testing", "type": "guide"})`
- **AI Philosophy**: `search_documents({"query": "bounded enhancement", "category": "ai-philosophy"})`
- **Architecture**: `search_documents({"query": "architecture patterns"})`
- **Development Workflow**: `search_documents({"query": "development workflow"})`
- **Implementation**: `search_documents({"query": "implementation guidelines"})`

## Project Mission

Transform writing education by making the writing process visible and collaborative with responsible AI integration.

**Key Decision**: "Does this help educators understand student writing development?"

## Quick Reference Paths

- **AI Philosophy**: `.claude/docs/ai-philosophy.md`
- **Testing Guide**: `docs/guides/TESTING_GUIDE.md`
- **Architecture**: `docs/guides/ARCHITECTURE_GUIDE.md`
- **Development Workflow**: `docs/guides/DEVELOPMENT_WORKFLOW_GUIDE.md`
- **Implementation Guidelines**: `docs/guides/IMPLEMENTATION_GUIDELINES.md`
- **Brand Guidelines**: `docs/guides/BRAND_DESIGN_GUIDELINES.md`

## Git Commit Guidelines

### Commit Message Standards

- **Author Attribution**: ALL commits should reflect the repository owner as the sole author
- **No AI Attribution**: NEVER include Claude Code or AI assistant attribution in commit messages
- **Clear Descriptions**: Write descriptive commit messages that explain the changes made
- **Professional Tone**: Use professional language appropriate for a public repository

### Prohibited Attribution Patterns

DO NOT include any of the following in commit messages:
```
🤖 Generated with [Claude Code](https://claude.ai/code)
Co-Authored-By: Claude <noreply@anthropic.com>
```

The repository owner is the sole author and contributor to this codebase.

## Development Standards

### Repository Pattern Implementation
- Use mock-first development for all new services
- Implement dependency injection with ServiceFactory pattern
- Create repository interfaces before database implementation
- Abstract data access for testability and future microservices
- Include privacy context in all repository methods
- Implement audit trails for sensitive data operations

### Performance Standards
- Real-time monitoring: <100ms response time
- Analytics queries: <500ms response time
- Privacy encryption/decryption: <100ms per operation
- Document performance targets in feature specifications
- Set clear targets early to prevent architecture problems
- Consider encryption overhead in performance planning

### Type Safety Guidelines
- Prefer pragmatic type assertions over blocking progress
- Document type compromises with TODO comments
- Plan iterative type improvements in technical debt backlog
- Use Prisma-generated types for database operations

## MCP Risk Mitigation Patterns

### Overview
Phase 2 Week 7 established comprehensive risk mitigation patterns for MCP server integration, addressing external dependency failures and ensuring system reliability.

### Circuit Breaker Pattern
- **Purpose**: Prevent cascading failures when MCP services become unavailable
- **Implementation**: `CircuitBreakerService.ts` with configurable thresholds and recovery timeouts
- **States**: CLOSED (normal), OPEN (service down), HALF_OPEN (testing recovery)
- **Usage**: Automatically route to fallback services when external dependencies fail

### Adaptive Service Management
- **Purpose**: Intelligent routing between MCP, Direct, and Fallback services based on health metrics
- **Implementation**: `AdaptiveWritingAnalysisManager.ts` with performance monitoring
- **Features**: Automatic service selection, health-based routing, metrics tracking
- **Benefits**: Optimal performance while maintaining resilience

### Fallback Service Architecture
- **Purpose**: Provide basic functionality when primary MCP services are unavailable
- **Implementation**: Complete mock implementations of all MCP tools
- **Coverage**: All 8 writing analysis tools with simplified but functional behavior
- **Performance**: Optimized for speed with <50ms response times

### Feature Flag Management
- **Purpose**: Control MCP integration features and enable graceful degradation
- **Implementation**: `FeatureFlagService.ts` with emergency, production, and development modes
- **Capabilities**: Per-tool feature flags, emergency mode, A/B testing support
- **Benefits**: Safe rollouts, instant rollbacks, controlled feature exposure

### Direct Service Integration
- **Purpose**: Bypass MCP JSON-RPC protocol overhead when needed
- **Implementation**: Direct instantiation of MCP service classes
- **Use Cases**: Performance optimization, SDK compatibility issues
- **Benefits**: Full feature parity without protocol overhead

### Usage Patterns

#### Emergency Mode Activation
```typescript
// Enable emergency mode to bypass all MCP dependencies
featureFlagService.setEmergencyMode(true);

// System automatically routes to fallback services
const result = await adaptiveManager.analyzeWritingPatterns(params);
```

#### Health-Based Routing
```typescript
// System monitors service health and routes intelligently
const manager = new AdaptiveWritingAnalysisManager();
await manager.initialize();

// Automatically selects best available service
const analysis = await manager.evaluateReflectionQuality(reflection);
```

#### Circuit Breaker Protection
```typescript
// Protect critical operations with circuit breakers
const result = await circuitBreaker.execute(
  'writing-analysis-mcp',
  () => mcpClient.analyzePatterns(content),
  () => fallbackService.analyzePatterns(content)
);
```

## Strategic CTO MCP Server

### Overview
The Strategic CTO MCP Server transforms ad-hoc strategic discussions into systematic business intelligence. Located at `mcp-servers/scribe-tree-strategic-cto/`, it provides 60+ tools for strategic planning, forecasting, and reporting.

### Key Capabilities
- **Strategic Conversation Tracking**: Capture and organize strategic discussions with structured context
- **Business Goal Management**: Create, track, and monitor business objectives with confidence metrics
- **Development-Business Alignment**: Map technical milestones to business value and competitive advantage
- **Balanced Forecasting**: 25%/50%/25% optimism distribution with 85% confidence cap for realistic projections
- **Competitive Intelligence**: Market analysis with threat assessment and opportunity identification
- **Collaborative Planning**: Team-based strategic sessions with templates and decision tracking
- **Executive Reporting**: Multi-format reports (Markdown, HTML, PDF) for stakeholders

### Usage Patterns

#### Daily Strategic Planning
```
# Connect technical work to business value
create_technical_milestone(name="Privacy Dashboard", businessContext={...})
analyze_development_business_alignment()
update_goal_progress(goalId="privacy-compliance", confidence=85)
```

#### Weekly Strategic Reviews
```
# Systematic strategic health monitoring
generate_quick_insights(timeframe="7-days")
evaluate_strategy_review_triggers()
run_comprehensive_analysis()
```

#### Monthly Board Reporting
```
# Executive-level strategic intelligence
generate_strategic_report(type="executive-summary", period={...})
generate_scenario_forecast(timeframe="12-months")
export_report_data(format="markdown")
```

### Integration with Development Workflow
- **Technical Milestones**: Record development achievements with strategic business context
- **Insights Integration**: Extract strategic implications from `.claude/insights` and `.claude/reflections`
- **Competitive Positioning**: Connect feature development to market advantage
- **Revenue Forecasting**: Project business impact of technical capabilities

### Strategic Decision Framework
- **Systematic Discussion**: Template-driven strategic conversations
- **Evidence-Based Planning**: Data-driven forecasting with confidence intervals
- **Risk Assessment**: Balanced analysis of opportunities and threats
- **Stakeholder Communication**: Automated reporting for investors, board, and team

### MCP Server Setup
Add to Claude Desktop configuration:
```json
{
  "mcpServers": {
    "scribe-tree-strategic-cto": {
      "command": "node",
      "args": ["./mcp-servers/scribe-tree-strategic-cto/dist/index.js"]
    }
  }
}
```

### Strategic Philosophy
- **Balanced Optimism**: Realistic expectations with measured confidence
- **Process-Driven**: Systematic approach to strategic planning
- **Data-Informed**: Evidence-based decision making
- **Stakeholder-Focused**: Clear communication of strategic progress
- **Development-Aligned**: Technical work connected to business outcomes

## Writing Analysis MCP Server

### Overview
The Writing Analysis MCP Server provides privacy-enhanced educational writing analysis with comprehensive AI boundaries and content protection. Located at `mcp-servers/writing-analysis/`, it implements 8 specialized tools for educational content analysis.

### Core MCP Tools (4 Original + 4 Privacy-Enhanced)
- **analyze_writing_patterns**: Privacy-safe writing pattern analysis with content redaction
- **evaluate_reflection_quality**: Multi-dimensional reflection assessment with progressive AI access
- **track_writing_progress**: Privacy-aware progress tracking with consent verification
- **generate_writing_insights**: Differential privacy for aggregated educational analytics
- **classify_content_sensitivity**: NLP-based content classification with 12+ detection patterns
- **validate_educational_purpose**: Purpose validation with weighted scoring criteria
- **apply_ai_boundaries**: Real-time AI boundary enforcement with educational context
- **audit_writing_data_access**: Immutable audit trails with cryptographic hashing

### Privacy Architecture
- **Privacy Guard**: Tool-level enforcement with educational purpose validation
- **Content Classification**: >95% accuracy with mental health, PII, and educational context detection
- **Event System**: 7 privacy event types with encrypted metadata
- **Repository Layer**: AES-256-CBC encryption with differential privacy for aggregated data
- **Compliance**: GDPR/FERPA/COPPA framework with automated consent management

### Performance Specifications
- **Privacy Overhead**: <50ms additional processing for privacy checks
- **Total Response Time**: <200ms including analysis and protection
- **Content Classification**: 10-40ms processing time with caching
- **Encryption/Decryption**: <100ms per operation for sensitive data

### MCP Server Setup
Add to Claude Desktop configuration:
```json
{
  "mcpServers": {
    "writing-analysis": {
      "command": "node",
      "args": ["./mcp-servers/writing-analysis/dist/index.js"]
    }
  }
}
```

### Educational Integration
- **Progressive AI Access**: Reflection quality determines AI assistance levels (restricted → basic → standard → enhanced)
- **Boundary Intelligence**: Context-aware AI limitations based on assignment type and student progress
- **Privacy-Aware Analytics**: Student benefit from data sharing while maintaining privacy protection
- **Educational Value Exchange**: Transparent data use with clear student benefits

## Student Profiling MCP Server

### Overview
The Student Profiling MCP Server provides privacy-enhanced student profiling with comprehensive data agency controls, differential privacy analytics, and dual MCP/HTTP interfaces. Located at `mcp-servers/student-profiling/`, it implements 8 privacy-focused tools for student data management.

### Core MCP Tools (4 Core + 4 Privacy)

#### Privacy Tools
- **manage_student_privacy_choices**: Granular privacy preference management with value exchange explanations
- **generate_privacy_preserving_analytics**: Differential privacy analytics with epsilon/delta parameters and Laplace noise
- **validate_data_access_requests**: Role-based access validation with educational purpose verification and audit trails
- **create_student_privacy_dashboard**: Real-time privacy metrics with personalized recommendations and data inventory

#### Core Tools (Privacy-Enhanced)
- **build_student_profile**: Privacy-aware profile construction with consent verification and access control
- **track_learning_trajectory**: Consent-based trajectory tracking with privacy level selection (full/anonymized/aggregate)
- **assess_skill_development**: Privacy-controlled skill assessment with granular sharing permissions
- **generate_personalized_recommendations**: Value-exchange based recommendations with transparent data usage

### Student Data Agency Architecture
- **Privacy Choice Management**: Granular controls for educational sharing, platform improvement, and personal benefits
- **Value Exchange Model**: Clear explanations of data usage benefits for each feature
- **Progressive Consent**: Default maximum privacy with opt-in enhancements
- **No Privacy Punishment**: Full educational functionality regardless of privacy choices
- **Instant Enforcement**: Privacy preferences immediately applied across all services

### Differential Privacy Implementation
- **Configurable Parameters**: Epsilon/delta privacy parameters with recommended defaults
- **Laplace Noise Mechanism**: Mathematical privacy guarantees with utility preservation
- **Privacy Budget Tracking**: Prevents privacy erosion over time with per-entity budget management
- **Minimum Cohort Size**: Automatic suppression for groups smaller than 10 students
- **Federated Analytics**: Cross-institutional research with privacy preservation

### Dual Interface Architecture
- **MCP Protocol**: For Claude Code integration and AI-assisted development
- **HTTP REST API**: For Fastify gateway and service-to-service communication (Port 3002)
- **Shared Business Logic**: Single implementation serving both interfaces with unified privacy controls
- **Mode Selection**: Can run in MCP, HTTP, or dual mode

### Performance Specifications
- **Response Time**: <150ms including privacy checks (both protocols)
- **Privacy Overhead**: <30ms additional processing for privacy operations
- **Concurrent Operations**: Multiple consent checks and access validations supported
- **Privacy Dashboard**: Real-time metrics calculation and recommendation generation

### MCP Server Setup
Add to Claude Desktop configuration:
```json
{
  "mcpServers": {
    "student-profiling": {
      "command": "node",
      "args": ["./mcp-servers/student-profiling/dist/main.js", "mcp"]
    }
  }
}
```

### HTTP API Integration
```typescript
// Example usage with Fastify gateway
const studentProfilingClient = axios.create({
  baseURL: 'http://localhost:3002/api/v1',
  headers: { 'Authorization': `Bearer ${token}` }
});

const profile = await studentProfilingClient.post('/student-profiles/build', {
  studentId: 'student123',
  requesterContext: {
    userId: 'teacher456',
    role: 'teacher',
    purpose: 'grade_assignment'
  }
});
```

### Privacy Compliance
- **FERPA**: Educational records protection with legitimate educational interest validation
- **COPPA**: Enhanced protections for students under 13 with parental consent workflows
- **GDPR**: Right to access, rectification, erasure, and data portability implementation
- **State Laws**: Configurable compliance with state-specific educational privacy requirements

## HTTP Microservices Migration

### Overview
Planned evolution from current Express/Fastify hybrid with in-process MCP services to true HTTP-based microservices architecture while preserving all risk mitigation patterns.

### Migration Plan
- **[Complete Migration Plan](./docs/roadmaps/HTTP_MICROSERVICES_MIGRATION_PLAN.md)**: 9-week phased approach
- **[Progress Tracker](./docs/HTTP_MICROSERVICES_PROGRESS.md)**: Real-time progress tracking
- **Current Status**: 📋 Planning Phase - Ready for Phase A implementation

### Key Phases
1. **Phase A (Weeks 1-2)**: Complete Fastify migration and standardize service interfaces
2. **Phase B (Weeks 3-5)**: Extract Writing Analysis to HTTP microservice with service discovery
3. **Phase C (Weeks 6-7)**: Implement HTTP-aware circuit breakers and advanced resilience
4. **Phase D (Week 8)**: Containerize services with Docker/Kubernetes orchestration
5. **Phase E (Week 9)**: Production readiness with observability and monitoring

### Preserved Resilience
- **Circuit Breaker Patterns**: Extended for HTTP communication with cascading fallbacks
- **Adaptive Service Management**: Enhanced for HTTP load balancing and health-based routing
- **Fallback Architecture**: Always maintain in-process fallback for ultimate reliability
- **Feature Flags**: Gradual migration control with instant rollback capabilities

### Target Architecture
```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   API        │  │   Writing    │  │   Student    │  │   Strategic  │
│  Gateway     │  │  Analysis    │  │  Profiling   │  │     CTO      │
│ (Fastify)    │  │  Service     │  │   Service    │  │   Service    │
│              │  │ (NestJS)     │  │ (NestJS)     │  │ (Node.js)    │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
     Port 5001        Port 3001        Port 3002        Port 3003
```

### API Design Standards
- Standard response format: `{ success: boolean, data: T, message?: string }`
- Consistent error responses with development details when appropriate
- Educational endpoints may require specialized non-CRUD approaches
- Complete API endpoint inventory during migrations

## Privacy Standards

### Data Protection
- **Student ID Hashing**: Never store raw student IDs in events or logs
- **AES-256-CBC Encryption**: Use for all sensitive data in events and cache
- **Consent Management**: Verify consent before any student data access
- **Data Minimization**: Only expose necessary fields based on role/purpose
- **Audit Trails**: Log all data access with educational justification

### Privacy Implementation
- Include `PrivacyContext` in all service operations
- Use `PrivacyEventUtils` for student ID hashing and encryption
- Implement privacy-aware TTL strategies in cache
- Publish privacy events for all sensitive operations
- Test privacy scenarios (414+ test cases as baseline)

### Compliance Requirements
- **GDPR**: Data minimization, purpose limitation, consent management
- **FERPA**: Educational records protection, parent access rights
- **COPPA**: Special protections for users under 13
- **State Laws**: California CCPA, state-specific education privacy laws

## Testing Requirements

### Mock Repository Testing
- Create complete mock implementations for all repositories
- Test repository contracts independently of database
- Use mock repositories for service unit tests
- Validate interface design before complex implementation
- Include privacy testing scenarios (consent, audit, data minimization)
- Test encryption/decryption in mock implementations

### Migration Testing
- Maintain test coverage during all migrations
- Update tests incrementally with implementation
- Validate API contracts between frontend and backend
- Use admin accounts to test role-based access patterns

### Educational Workflow Testing
- Test with actual educators and students regularly
- Validate educational outcomes, not just technical function
- Ensure features support learning process visibility
- Test AI boundaries and reflection requirements

## Educational Philosophy

### Trust Through Transparency
- Reward AI use disclosure with integrity points
- Frame detection as educational accountability
- Build features that students want to engage with
- All AI contributions visible to educators for assessment

### Multi-Dimensional Support
- Consider cognitive load in AI responses
- Adapt to emotional state, not just academic level
- Monitor without interrupting creative flow
- Support should enhance, not replace, thinking

### Process Over Product
- Make invisible writing processes visible
- Track learning journey, not just outcomes
- Enable educator insights without surveillance
- Focus on student growth and independence

## Current State

This is a fully functional educational writing platform with event-driven microservices architecture:

**✅ Core Platform**
- Complete development environment with PostgreSQL + Prisma
- Build tooling and CI/CD pipeline
- Comprehensive API with educational features
- Multi-role access control (students, educators, administrators)

**✅ Educational AI System**
- Educational AI assistant with bounded enhancement philosophy
- Multi-dimensional reflection quality analysis
- Progressive AI access based on reflection quality
- Real-time cognitive load detection and intervention
- Educational analytics and educator insights

**✅ Event-Driven Architecture**
- Complete service decoupling via privacy-enhanced event system
- Privacy-aware repository pattern with audit trails
- Dependency injection with ServiceFactory
- Privacy-aware cache abstraction (Redis + in-memory)
- Encrypted message queue infrastructure (RabbitMQ + in-memory)
- Comprehensive monitoring with correlation IDs and privacy metrics

**✅ Advanced Features**
- Writing process tracking and real-time analytics
- Assignment and submission management systems
- Collaborative writing and version control features
- Educational domain events for service communication
- Mock-first development patterns established

**✅ Privacy Infrastructure**
- AES-256-CBC encryption for sensitive data
- Comprehensive audit trails for all data operations
- Privacy-aware caching with consent-based TTL
- Student ID hashing throughout the system
- Privacy event categories (audit, consent, access, compliance)
- GDPR/FERPA/COPPA compliance framework
- 414+ privacy-focused test cases

**✅ Privacy Monitoring & Observability (Phase 1 Week 5 - 2025-06-01)**
- Advanced PII Detection Service with 12+ pattern types and educational context awareness
- Privacy-safe logging system with automatic redaction and zero PII exposure guarantee
- Real-time consent tracking dashboard with compliance metrics and health monitoring
- Data access heat maps with anomaly detection and role-based access analysis
- Multi-channel privacy alert system with auto-escalation and remediation workflows
- 97% privacy test coverage (116/119 tests passing) across all privacy components
- Production-ready privacy monitoring with <100ms response times

**✅ MCP Microservices Architecture (Phase 2 Week 7 - 2024-12-03)**
- Privacy-enhanced Writing Analysis MCP Server with NestJS architecture
- 8 operational MCP tools (4 original + 4 privacy-enhanced) for content analysis and AI boundaries
- Comprehensive risk mitigation with circuit breaker patterns and adaptive service management
- Fallback services architecture for external dependency failures
- Feature flag system for graceful degradation and emergency modes
- Direct service integration bypassing MCP protocol when needed
- Performance optimized: <50ms privacy overhead, <200ms total response time
- Content classification with >95% accuracy and differential privacy for aggregated data

## Important Files

**Core Configuration**
- `frontend/components.json` - ShadCN UI configuration
- `backend/src/server.ts` - Express app and PostgreSQL connection
- `backend/prisma/schema.prisma` - Database schema with reflection models
- `frontend/vite.config.ts` - Build configuration and path aliases
- Both `tsconfig.json` files for TypeScript compilation settings

**Event-Driven Architecture**
- `backend/src/container/ServiceFactory.ts` - Dependency injection container
- `backend/src/events/EventBus.ts` - Event system infrastructure
- `backend/src/events/events/` - Educational domain event definitions
- `backend/src/repositories/interfaces.ts` - Repository contracts
- `backend/src/repositories/ReflectionRepository.ts` - Reflection data access
- `backend/src/cache/CacheService.ts` - Cache abstraction layer
- `backend/src/messaging/MessageQueue.ts` - Message queue interface
- `backend/src/monitoring/` - Logging, health checks, and metrics

**Educational AI Services**
- `backend/src/services/ai/ReflectionAnalysisService.ts` - Reflection quality analysis
- `backend/src/services/ai/CognitiveLoadDetector.ts` - Real-time cognitive monitoring
- `backend/src/services/ai/WritingProcessAnalyzer.ts` - Writing pattern analysis
- `backend/src/services/AIBoundaryService.ts` - Responsible AI boundaries

**Privacy-Aware Services (Phase 1 Week 4)**
- `backend/src/services/PrivacyAwareInterventionEngine.ts` - Privacy-first intervention analysis
- `backend/src/services/PrivacyAwareLearningAnalyticsService.ts` - Privacy-filtered analytics
- `backend/src/services/PrivacyAwareWritingProcessService.ts` - Privacy-controlled writing analysis
- `backend/src/repositories/interfaces/` - Privacy-aware repository interfaces
- `backend/src/repositories/__mocks__/` - Privacy-testing mock implementations

**Privacy Infrastructure**
- `backend/src/config/privacy.config.ts` - Privacy configuration and compliance settings
- `backend/src/types/privacy.ts` - Privacy types and interfaces
- `backend/src/repositories/AuditRepository.ts` - Audit trail implementation
- `backend/src/cache/PrivacyCacheService.ts` - Privacy-aware cache wrapper
- `backend/src/events/events/PrivacyEvents.ts` - Privacy event definitions
- `backend/src/monitoring/PrivacyMonitor.ts` - Privacy metrics and monitoring

**Privacy Monitoring & Observability (Phase 1 Week 5)**
- `backend/src/monitoring/privacy/PIIDetector.ts` - Advanced PII detection with educational patterns
- `backend/src/monitoring/privacy/PrivacyLogger.ts` - Privacy-safe logging with automatic redaction
- `backend/src/dashboard/privacy/ConsentTrackingDashboard.ts` - Real-time consent and compliance monitoring
- `backend/src/monitoring/access/DataAccessHeatMap.ts` - Access pattern visualization and anomaly detection
- `backend/src/alerts/privacy/PrivacyAlertSystem.ts` - Multi-channel privacy alerts with auto-remediation
- `backend/src/tests/privacy/privacy-monitoring.test.ts` - Core privacy monitoring test suite (8/8 passing)

**MCP Servers & Risk Mitigation (Phase 2 Week 7)**
- `mcp-servers/writing-analysis/` - Privacy-enhanced writing analysis MCP server
- `backend/src/services/fallback/WritingAnalysisFallbackService.ts` - Fallback implementation for MCP failures
- `backend/src/services/fallback/CircuitBreakerService.ts` - Circuit breaker pattern for resilience
- `backend/src/services/adaptive/AdaptiveWritingAnalysisManager.ts` - Intelligent service routing
- `backend/src/services/feature-flags/FeatureFlagService.ts` - Feature flag management
- `backend/src/services/direct/DirectWritingAnalysisService.ts` - Direct service integration
- `backend/src/services/mcp/ResilientWritingAnalysisMCPClient.ts` - Resilient MCP client

**Documentation & Learning**
- `.claude/insights/accumulated-learnings.md` - Project learnings and patterns
- `.claude/reflections/` - Development reflections and insights
- `backend/docs/guides/PRIVACY_AWARE_SERVICE_ARCHITECTURE.md` - Complete privacy architecture guide
- `backend/docs/guides/PRIVACY_PATTERNS_QUICK_REFERENCE.md` - Developer quick reference
- `docs/guides/PRIVACY_COMPLIANCE_TESTING_GUIDE.md` - Privacy testing scenarios
- `backend/src/repositories/README-Privacy-Implementation.md` - Repository privacy patterns

## Working with Event-Driven Architecture

### ServiceFactory Usage
```typescript
// Initialize services
const serviceFactory = ServiceFactory.getInstance();
await serviceFactory.initialize();

// Get services
const eventBus = serviceFactory.getEventBus();
const cache = serviceFactory.getCache();
const sessionRepo = serviceFactory.getWritingSessionRepository();
```

### Publishing Educational Events
```typescript
// Student progress events
await eventBus.publish<StudentProgressUpdatedEvent>({
  type: EventTypes.STUDENT_PROGRESS_UPDATED,
  correlationId: uuidv4(),
  timestamp: new Date(),
  payload: {
    studentId, courseId, assignmentId,
    progressType: 'reflection',
    metrics: { reflectionQuality: 85 }
  },
  metadata: { userId: studentId }
});
```

### Repository Pattern
```typescript
// Use repositories instead of direct Prisma calls
const reflections = await reflectionRepo.findByUser(userId, {
  assignmentId: 'assignment-123',
  type: 'ai_interaction',
  limit: 10
});

// Analysis with educational caching
const analysis = await reflectionAnalysisRepo.getQualityTrends(studentId);
```

### Cache Usage with Educational Patterns
```typescript
// Educational cache key patterns
const cacheKey = CacheKeyBuilder.studentProfile(studentId, assignmentId);
const cached = await cache.get<StudentLearningProfile>(cacheKey);
await cache.set(cacheKey, profile, { ttl: CacheTTL.STUDENT_STATE });
```