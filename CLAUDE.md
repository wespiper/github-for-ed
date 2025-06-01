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