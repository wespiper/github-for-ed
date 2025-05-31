# Scribe Tree Architecture Guide

This guide provides a comprehensive overview of Scribe Tree's technical architecture, design patterns, and architectural decisions.

## Architecture Patterns

### Frontend Architecture

#### Technology Stack
- **React 19**: Latest React features with concurrent rendering
- **TypeScript**: Type safety and better developer experience
- **Vite**: Fast development and optimized production builds
- **Tailwind CSS**: Utility-first styling approach
- **ShadCN UI**: Consistent, accessible component library

#### Design Patterns
- **Component-Driven Development**: Modular, reusable UI components
- **Custom Hooks**: Encapsulated business logic and state management
- **Context API**: Global state management where appropriate
- **React Query**: Server state management and caching
- **Error Boundaries**: Graceful error handling

#### Directory Structure
```
frontend/
├── src/
│   ├── components/       # UI components
│   │   ├── ui/          # Base UI components (ShadCN)
│   │   ├── layout/      # Layout components
│   │   ├── assignments/ # Assignment-related components
│   │   └── ...          # Feature-specific components
│   ├── hooks/           # Custom React hooks
│   ├── pages/           # Page components (routes)
│   ├── lib/             # Utilities and helpers
│   ├── types/           # TypeScript type definitions
│   └── stores/          # Global state management
```

### Backend Architecture

#### Technology Stack
- **Node.js**: JavaScript runtime
- **Express**: Web application framework
- **TypeScript**: Type safety across the stack
- **PostgreSQL**: Relational database
- **Prisma ORM**: Type-safe database access
- **JWT**: Authentication tokens

#### Design Patterns
- **RESTful API**: Standard HTTP methods and status codes
- **Middleware Pipeline**: Request processing chain
- **Repository Pattern**: Database abstraction through Prisma
- **Service Layer**: Business logic separation
- **Error Middleware**: Centralized error handling

#### Directory Structure
```
backend/
├── src/
│   ├── routes/          # API endpoint definitions
│   ├── services/        # Business logic
│   │   ├── ai/         # AI-related services
│   │   └── cache/      # Caching services
│   ├── middleware/      # Express middleware
│   ├── lib/            # Shared utilities
│   ├── types/          # TypeScript types
│   └── server.ts       # Application entry point
├── prisma/
│   ├── schema.prisma   # Database schema
│   └── migrations/     # Database migrations
```

## Technical Architecture Decisions

### Core Principles
- **Assignment-Centric Data Model**: Not lesson/chapter focused
- **Real-Time Collaboration**: Built into core architecture
- **Version Control**: Optimized for writing development visibility
- **Analytics Focused**: Educational insights, not productivity metrics
- **Extensible AI Integration**: Points without current implementation

### Database Design
- **PostgreSQL**: Chosen for relational integrity and JSON support
- **Prisma ORM**: Type safety and migration management
- **Schema Design**: Normalized with strategic denormalization
- **Indexing Strategy**: Optimized for common query patterns
- **Connection Pooling**: Managed by Prisma for performance

### API Architecture
- **RESTful Design**: Predictable, standard HTTP semantics
- **Consistent Response Format**: `{ success, data, message? }`
- **Role-Based Access**: Middleware-enforced permissions
- **Versioning Strategy**: URL-based versioning when needed
- **Rate Limiting**: Protection against abuse

### Authentication & Security
- **JWT Tokens**: Stateless authentication
- **Role-Based Access Control**: Student, educator, admin roles
- **Secure Password Storage**: Bcrypt hashing
- **CORS Configuration**: Controlled cross-origin access
- **Environment Variables**: Sensitive configuration isolation

### Performance Optimization
- **Database Query Optimization**: Efficient Prisma queries
- **Caching Strategy**: Redis for frequently accessed data
- **API Response Compression**: Gzip compression
- **Frontend Code Splitting**: Dynamic imports
- **Asset Optimization**: Image and bundle optimization

## System Architecture

### High-Level Overview
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React SPA     │────▶│   Express API   │────▶│   PostgreSQL    │
│   (Frontend)    │◀────│   (Backend)     │◀────│   (Database)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                         │
         │                       │                         │
         ▼                       ▼                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Vite Build    │     │   TypeScript    │     │   Prisma ORM    │
│   Tailwind CSS  │     │   JWT Auth      │     │   Migrations    │
│   ShadCN UI     │     │   Middleware    │     │   Type Safety   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Data Flow Architecture
1. **User Interaction**: React components capture user actions
2. **API Request**: Axios/Fetch sends requests with JWT
3. **Middleware Processing**: Auth, validation, rate limiting
4. **Business Logic**: Service layer processes request
5. **Database Operations**: Prisma executes queries
6. **Response Formation**: Standardized response format
7. **Frontend Update**: React Query updates cache/UI

## AI Integration Architecture

### Bounded Enhancement System
- **Educational Boundaries**: AI assistance within learning goals
- **Stage-Specific Access**: Different AI capabilities per writing stage
- **Reflection Requirements**: Mandatory thinking documentation
- **Transparency Layer**: Complete AI contribution tracking
- **Progressive Independence**: Decreasing AI access over time

### AI Service Architecture
```
┌─────────────────────┐
│   AI Controller     │
│  (Route Handler)    │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│ BoundaryIntelligence│
│     (Service)       │
└──────────┬──────────┘
           │
┌──────────▼──────────┐     ┌─────────────────┐
│  AI Provider API    │────▶│ Reflection DB   │
│  (Claude/OpenAI)    │     │  (PostgreSQL)   │
└─────────────────────┘     └─────────────────┘
```

## Scalability Considerations

### Horizontal Scaling
- **Stateless API**: Easy to scale backend instances
- **Database Connections**: Connection pooling for efficiency
- **Session Management**: JWT tokens enable stateless auth
- **Load Balancing**: Ready for reverse proxy setup

### Vertical Scaling
- **Database Optimization**: Indexes and query optimization
- **Caching Layer**: Redis for hot data
- **CDN Integration**: Static asset delivery
- **Background Jobs**: Queue system for heavy tasks

### Performance Monitoring
- **Application Metrics**: Response times, error rates
- **Database Metrics**: Query performance, connection usage
- **Resource Monitoring**: CPU, memory, disk usage
- **User Analytics**: Feature usage, performance impact

## Development Environment

### Local Development
- **Hot Reload**: Vite for frontend, Nodemon for backend
- **TypeScript Watch**: Incremental compilation
- **Database Management**: Prisma Studio for exploration
- **Environment Variables**: .env files for configuration

### Testing Environment
- **Test Database**: Separate PostgreSQL instance
- **Mock Services**: External service mocking
- **CI/CD Pipeline**: Automated testing on commits
- **Coverage Reports**: Code coverage tracking

## Deployment Architecture

### Production Environment
- **Frontend Hosting**: Static file hosting (Vercel/Netlify)
- **Backend Hosting**: Node.js hosting (Railway/Render)
- **Database Hosting**: Managed PostgreSQL
- **Environment Config**: Production environment variables

### CI/CD Pipeline
- **GitHub Actions**: Automated workflows
- **Build Process**: TypeScript compilation, bundling
- **Test Execution**: Unit and integration tests
- **Deployment**: Automatic on main branch

## Future Architecture Enhancements

### Planned Improvements
- **WebSocket Support**: Real-time collaboration
- **Microservices**: Service separation for scale
- **Event-Driven Architecture**: Async processing
- **GraphQL API**: Flexible data fetching
- **Kubernetes**: Container orchestration

### Technology Considerations
- **Server-Side Rendering**: Next.js for SEO/performance
- **Edge Computing**: Distributed processing
- **Machine Learning Pipeline**: Advanced AI features
- **Multi-Tenancy**: Institution-level isolation
- **Internationalization**: Multi-language support