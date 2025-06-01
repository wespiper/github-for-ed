# CLAUDE.md

Quick operational reference for Claude Code. For detailed documentation, use the MCP server:
`search_documents({"query": "your topic"})`

## Architecture Overview

Scribe Tree is a monorepo containing a React frontend and Node.js backend for teaching writing using version control concepts.

**Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + ShadCN UI
**Backend**: Node.js + Express + TypeScript + PostgreSQL + Prisma
**Structure**: Separate `/frontend` and `/backend` directories with independent package.json files

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

### Performance Standards
- Real-time monitoring: <100ms response time
- Analytics queries: <500ms response time
- Document performance targets in feature specifications
- Set clear targets early to prevent architecture problems

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

## Testing Requirements

### Mock Repository Testing
- Create complete mock implementations for all repositories
- Test repository contracts independently of database
- Use mock repositories for service unit tests
- Validate interface design before complex implementation

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

This is a fully functional educational writing platform with:

- ✅ Complete development environment with PostgreSQL + Prisma
- ✅ Build tooling and CI/CD pipeline
- ✅ Comprehensive API with educational features
- ✅ Educational AI assistant with bounded enhancement philosophy
- ✅ Multi-role access control (students, educators, administrators)
- ✅ Writing process tracking and analytics
- ✅ Assignment and submission management systems
- ✅ Collaborative writing and version control features
- ✅ Repository pattern for service architecture
- ✅ Dependency injection with ServiceFactory
- ✅ Mock-first development patterns established

## Important Files

- `frontend/components.json` - ShadCN UI configuration
- `backend/src/server.ts` - Express app and PostgreSQL connection
- `backend/prisma/schema.prisma` - Database schema and relationships
- `frontend/vite.config.ts` - Build configuration and path aliases
- `.github/workflows/ci.yml` - Automated testing and deployment
- Both `tsconfig.json` files for TypeScript compilation settings
- `backend/src/repositories/` - Repository pattern implementations
- `backend/src/container/` - Dependency injection configuration
- `.claude/insights/accumulated-learnings.md` - Project learnings and patterns
- `.claude/reflections/` - Development reflections and insights