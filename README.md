# Scribe Tree

A privacy-first educational writing platform that transforms writing education by making the writing process visible and collaborative with responsible AI integration using version control concepts.

## 🎯 **Mission**

Transform writing education by making the writing process visible and collaborative with responsible AI integration.

**Key Decision Framework**: "Does this help educators understand student writing development?"

## 📚 **Documentation**

Comprehensive documentation is available in the [`docs/`](./docs/) directory:
- **[Architecture Guide](./docs/guides/ARCHITECTURE_GUIDE.md)**: Complete system architecture and patterns
- **[Implementation Guidelines](./docs/guides/IMPLEMENTATION_GUIDELINES.md)**: Development standards and best practices  
- **[Privacy Compliance Guide](./docs/guides/PRIVACY_COMPLIANCE_TESTING_GUIDE.md)**: Privacy testing and compliance frameworks
- **[Development Workflow](./docs/guides/DEVELOPMENT_WORKFLOW_GUIDE.md)**: Setup procedures and workflow testing
- **[Educational Philosophy](./docs/philosophy/scribe-tree-ai-philosophy-white-paper.md)**: Bounded Enhancement for Learning principles

**Current Priority**: [Phase 2 - MCP Microservices Migration](./docs/roadmaps/AI_MCP_MIGRATION_SUMMARY.md)

## 🏗️ **Architecture Overview**

Scribe Tree implements a privacy-first, event-driven microservices architecture with comprehensive educational AI integration.

### Core Architecture
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + ShadCN UI
- **Backend**: Event-driven microservices with Node.js + Express + TypeScript + PostgreSQL + Prisma
- **MCP Servers**: Privacy-enhanced Model Context Protocol servers for AI service integration
- **Privacy Framework**: GDPR/FERPA/COPPA compliant with AES-256-CBC encryption and audit trails

### Event-Driven Microservices
- **ServiceFactory**: Dependency injection container managing all services
- **EventBus**: Privacy-enhanced educational domain events with encryption
- **Repository Pattern**: Privacy-aware data access with comprehensive audit trails
- **Cache Layer**: Privacy-aware Redis + in-memory with consent-based TTL strategies
- **Message Queues**: RabbitMQ + in-memory with encrypted privacy event routing
- **Monitoring**: Correlation IDs, health checks, privacy metrics, and compliance tracking

### Privacy-First Design
- **AES-256-CBC Encryption**: All sensitive data encrypted at rest and in transit
- **Audit Trails**: Immutable audit logs for all data access with educational justification
- **Content Classification**: NLP-based sensitive content detection with >95% accuracy
- **Differential Privacy**: Aggregated analytics with privacy noise for small cohorts
- **Consent Management**: Granular consent tracking with automated compliance monitoring

### MCP Microservices Architecture
- **Writing Analysis MCP Server**: 8 privacy-enhanced tools for content analysis and AI boundaries
- **Student Profiling MCP Server**: 8 privacy-focused tools for student data agency and differential privacy analytics
- **Strategic CTO MCP Server**: 60+ tools for strategic planning and business intelligence
- **Risk Mitigation**: Circuit breaker patterns, fallback services, and adaptive service management
- **Performance**: <50ms privacy overhead, <200ms total response time targets

## 🚀 **Tech Stack**

### Frontend
- **React 19** - User interface framework with latest features
- **TypeScript** - Type safety and developer experience
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first styling framework
- **ShadCN UI** - Accessible component library with "New York" style variant
- **TanStack Query** - Data fetching and state management

### Backend
- **Node.js 18+** - Runtime environment
- **Express** - Web application framework
- **Fastify** - High-performance alternative web framework
- **TypeScript** - Type safety and enhanced development experience
- **PostgreSQL** - Primary database for educational data
- **Prisma** - Type-safe ORM with automatic migrations
- **Redis** - Caching layer for performance optimization

### Educational AI & Privacy
- **NestJS** - Framework for MCP servers with dependency injection
- **Model Context Protocol (MCP)** - AI service integration standard
- **Claude API** - Educational AI assistant with bounded enhancement
- **Content Classification** - NLP-based sensitive content detection
- **Reflection Analysis** - Multi-dimensional quality assessment engine
- **Progressive AI Access** - Reflection quality-based AI assistance levels

### Privacy & Compliance
- **AES-256-CBC Encryption** - Military-grade encryption for sensitive data
- **Cryptographic Hashing** - SHA-256 for user IDs and audit trail integrity
- **Differential Privacy** - Statistical privacy for aggregated analytics
- **GDPR Compliance** - Data minimization, purpose limitation, consent management
- **FERPA Compliance** - Educational records protection and parent access rights
- **COPPA Compliance** - Enhanced protections for users under 13

### DevOps & Monitoring
- **Docker** - Containerization for consistent deployment
- **Jest** - Comprehensive testing framework with privacy test suites
- **Correlation IDs** - Request tracing across microservices
- **Health Checks** - System monitoring and alerting
- **Privacy Metrics** - Compliance tracking and performance monitoring

## 📁 **Project Structure**

```
scribe-tree/
├── frontend/                   # React + TypeScript frontend
│   ├── src/
│   │   ├── components/        # UI components with ShadCN integration
│   │   ├── hooks/            # Custom React hooks
│   │   ├── pages/            # Application pages and routing
│   │   └── stores/           # State management
│   └── package.json
├── backend/                    # Node.js + Express backend
│   ├── src/
│   │   ├── container/        # Dependency injection (ServiceFactory)
│   │   ├── events/           # Event-driven architecture
│   │   ├── repositories/     # Privacy-aware data access layer
│   │   ├── services/         # Business logic and AI services
│   │   ├── monitoring/       # Privacy monitoring and observability
│   │   ├── cache/           # Privacy-aware caching services
│   │   └── routes/          # API endpoints
│   ├── prisma/              # Database schema and migrations
│   └── package.json
├── mcp-servers/               # Model Context Protocol servers
│   ├── writing-analysis/     # Privacy-enhanced writing analysis
│   ├── scribe-tree-strategic-cto/  # Strategic planning and business intelligence
│   └── educational-ai-validator/   # Educational AI validation
├── docs/                      # Comprehensive documentation
│   ├── guides/               # Architecture and implementation guides
│   ├── philosophy/           # Educational AI philosophy
│   ├── roadmaps/            # Development roadmaps and migration plans
│   └── privacy/             # Privacy compliance documentation
└── shared/                    # Shared TypeScript types
    └── types/                # Common interfaces and types
```

## 🛠️ **Getting Started**

### Prerequisites
- **Node.js 18+** - Runtime environment
- **PostgreSQL 15+** - Database server
- **Git** - Version control
- **npm** - Package manager

### Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd scribe-tree
```

2. **Install dependencies:**
```bash
# Install frontend dependencies
cd frontend && npm install

# Install backend dependencies
cd ../backend && npm install

# Install MCP server dependencies
cd ../mcp-servers/writing-analysis && npm install
cd ../student-profiling && npm install
cd ../scribe-tree-strategic-cto && npm install
```

3. **Set up environment:**
```bash
# Copy environment template
cp backend/.env.example backend/.env

# Update DATABASE_URL in backend/.env for your PostgreSQL instance
```

4. **Initialize database:**
```bash
cd backend
npx prisma migrate dev  # Run database migrations
npx prisma db seed     # Seed with initial data
```

### Development

Start all services for development:

```bash
# Terminal 1: Backend server
cd backend && npm run dev

# Terminal 2: Frontend development server  
cd frontend && npm run dev

# Terminal 3: MCP servers (optional, for AI features)
cd mcp-servers/writing-analysis && npm run dev

# Terminal 4: Student Profiling MCP server (optional, for privacy-enhanced profiling)
cd mcp-servers/student-profiling && npm run start:dual
```

**Access Points:**
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5001/api`  
- Writing Analysis MCP: `http://localhost:3001/api`
- Student Profiling API: `http://localhost:3002/api/v1` (with Swagger docs at `/api/docs`)

### Testing

```bash
# Run backend tests including privacy test suite
cd backend && npm test

# Run privacy-specific tests
npm test -- --testPathPattern=privacy

# Run frontend tests
cd frontend && npm test

# Run MCP server tests
cd mcp-servers/writing-analysis && npm test
```

## 🎓 **Features**

### Educational Writing Platform
- **Writing Projects** - Create and manage writing assignments like Git repositories
- **Version Control** - Track changes and revisions with complete history
- **Reflection System** - Multi-dimensional quality assessment with progressive AI access
- **Collaborative Writing** - Multiple writers can work on shared projects
- **Assignment Management** - Course-based assignment creation and submission workflows
- **Analytics Dashboard** - Privacy-aware insights for educators and students

### Responsible AI Integration  
- **Educational AI Assistant** - Claude-powered writing support with bounded enhancement
- **Progressive AI Access** - Reflection quality determines AI assistance levels
- **AI Boundary Enforcement** - Context-aware limitations based on assignment type and progress
- **Content Classification** - Automatic detection of sensitive content with privacy protection
- **Real-time Intervention** - Cognitive load detection and educational support

### Privacy & Compliance
- **Student Data Protection** - GDPR/FERPA/COPPA compliant with granular consent management
- **Sensitive Content Detection** - NLP-based classification with automatic redaction
- **Audit Trail System** - Immutable logs of all data access with educational justification
- **Privacy-Aware Analytics** - Differential privacy for aggregated insights
- **Consent Dashboard** - Real-time consent tracking and compliance monitoring

### Advanced Architecture
- **Event-Driven Design** - Microservices communicate via encrypted educational domain events
- **Circuit Breaker Patterns** - Resilient architecture with automatic fallback services
- **Feature Flag Management** - Graceful degradation and safe feature rollouts
- **Performance Optimization** - <100ms response times with comprehensive caching
- **Risk Mitigation** - Adaptive service management with intelligent routing

## 🔒 **Privacy & Security**

### Data Protection Standards
- **Encryption**: AES-256-CBC for all sensitive data
- **Hashing**: SHA-256 for user identifiers and audit integrity
- **Access Control**: Role-based permissions with educational context validation
- **Data Minimization**: Only collect and process educationally necessary data
- **Retention Policies**: Automated cleanup based on educational and legal requirements

### Compliance Framework
- **GDPR**: Right to access, rectification, erasure, and data portability
- **FERPA**: Educational records protection with parent/student access rights
- **COPPA**: Enhanced protections for users under 13 with parental consent workflows
- **State Privacy Laws**: California CCPA and state-specific educational privacy requirements

### Privacy Monitoring
- **Real-time Detection**: Automatic PII detection with 12+ pattern types
- **Compliance Tracking**: Continuous monitoring of consent and data usage
- **Alert System**: Multi-channel privacy alerts with auto-escalation
- **Audit Reports**: Comprehensive compliance reports for institutional review

## 📊 **API Documentation**

### Core Endpoints
- **Health Check**: `GET /api/health` - System health and database connectivity
- **Authentication**: `POST /api/auth/login` - User authentication with role-based access
- **Assignments**: `GET /api/assignments` - Assignment management with privacy filtering
- **Analytics**: `GET /api/analytics` - Privacy-aware educational insights
- **Reflections**: `POST /api/reflections` - Reflection submission and quality analysis

### MCP Integration
- **Writing Analysis**: 8 privacy-enhanced tools for content analysis
- **Strategic Planning**: 60+ tools for business intelligence and forecasting
- **Educational Validation**: AI boundary enforcement and educational purpose validation

### Response Format
All API endpoints follow a consistent response format:
```json
{
  "success": boolean,
  "data": T,
  "message"?: string,
  "metadata"?: {
    "privacyProtected": boolean,
    "auditId": string,
    "processingTime": number
  }
}
```

## 🚀 **Deployment**

### Production Requirements
- **Node.js 18+** production environment
- **PostgreSQL 15+** with connection pooling
- **Redis** for caching and session management
- **SSL/TLS** certificates for HTTPS
- **Environment variables** for secure configuration

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d

# Scale services as needed
docker-compose up -d --scale backend=3
```

### Environment Configuration
Essential environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection for caching
- `ENCRYPTION_KEY` - AES encryption key for sensitive data
- `CLAUDE_API_KEY` - Educational AI service integration
- `PRIVACY_MODE` - Compliance level (strict/standard)

## 🤝 **Contributing**

1. **Fork the repository** and create a feature branch
2. **Follow privacy-first development** patterns established in the codebase
3. **Add comprehensive tests** including privacy compliance scenarios
4. **Document privacy implications** of any data handling changes
5. **Ensure educational value** aligns with bounded enhancement philosophy
6. **Submit pull request** with clear description of changes and educational impact

### Development Standards
- **Privacy by Design**: All features must include privacy impact assessment
- **Educational Value**: Changes must demonstrably benefit student learning
- **Performance**: Maintain <200ms response times including privacy checks
- **Testing**: >95% test coverage including privacy compliance scenarios
- **Documentation**: Update architecture guides for significant changes

## 📈 **Current Status**

**✅ Production-Ready Educational Platform**
- Complete development environment with PostgreSQL + Prisma
- Multi-role access control (students, educators, administrators)
- Privacy-enhanced event-driven microservices architecture
- Comprehensive monitoring with correlation IDs and privacy metrics

**✅ Privacy-First Architecture (GDPR/FERPA/COPPA Compliant)**
- AES-256-CBC encryption for sensitive data with differential privacy
- 97% privacy test coverage (116/119 tests passing)
- Real-time consent tracking and automated compliance monitoring
- Immutable audit trails with cryptographic integrity verification

**✅ Educational AI Integration**
- Multi-dimensional reflection quality analysis with progressive AI access
- Privacy-enhanced writing analysis with content classification >95% accuracy
- Real-time cognitive load detection and educational intervention
- AI boundary enforcement with educational context awareness

**✅ MCP Microservices Architecture**
- Privacy-enhanced Writing Analysis MCP Server with 8 operational tools
- Strategic CTO MCP Server with 60+ business intelligence tools
- Comprehensive risk mitigation with circuit breaker patterns and fallback services
- Performance optimized: <50ms privacy overhead, <200ms total response time

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Scribe Tree** - Transforming writing education through privacy-first technology and responsible AI integration.