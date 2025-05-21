# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

GitHub for Writers is a monorepo containing a React frontend and Node.js backend for teaching writing using version control concepts.

**Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + ShadCN UI
**Backend**: Node.js + Express + TypeScript + MongoDB + Mongoose
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
npm run dev     # Nodemon with ts-node hot reload on http://localhost:5000
npm run build   # TypeScript compilation to ./dist
npm run start   # Production server from compiled JS
```

### Setup Requirements
1. Install dependencies in both directories: `npm install`
2. Copy `backend/.env.example` to `backend/.env`
3. Ensure MongoDB is running (local or provide MONGODB_URI)
4. Run both frontend and backend concurrently for development

## Key Configuration

### Path Aliases
- Frontend uses `@/*` mapping to `./src/*` (configured in tsconfig.json and vite.config.ts)
- Import components as `@/components/ui/button` instead of relative paths

### ShadCN UI Setup
- Pre-configured with "New York" style variant
- Add components: `npx shadcn@latest add [component-name]`
- Components installed to `frontend/src/components/ui/`

### TypeScript Configuration
- **Frontend**: Modern ESNext modules, React JSX, strict mode
- **Backend**: CommonJS compilation, output to `./dist`, strict mode
- Both use path mapping and have separate tsconfig files

### Database Connection
- MongoDB with Mongoose ODM
- Connection string via `MONGODB_URI` environment variable
- Automatic connection retry and error handling in `backend/src/server.ts`

## Architecture Patterns

### Frontend Architecture
- Component-driven React SPA
- Utility-first styling with Tailwind CSS
- ShadCN UI for consistent component library
- Vite for fast development and optimized builds

### Backend Architecture  
- Express RESTful API server
- Environment-based configuration with dotenv
- MongoDB document database with Mongoose schemas
- TypeScript compilation for production deployment

### Current State
This is a foundational setup with:
- ✅ Complete development environment
- ✅ Build tooling and CI/CD pipeline
- ✅ Basic Express server with health endpoint
- ❌ No custom components or features yet implemented
- ❌ No database models or API routes beyond health check
- ❌ Frontend is still default Vite template

## CI/CD Pipeline

GitHub Actions workflow runs on push/PR to main/develop:
- **Frontend**: Install deps, lint, type check, build
- **Backend**: Install deps, lint, type check, build, test with MongoDB service
- Both jobs run Node.js 18 with npm ci for dependency installation

## Development Workflow

1. **New Features**: Develop backend API routes first, then frontend components
2. **Database**: Create Mongoose schemas in `backend/src/models/`
3. **API Routes**: Add Express routes in `backend/src/routes/`
4. **Frontend**: Build components using ShadCN UI in `frontend/src/components/`
5. **Styling**: Use Tailwind utilities and CSS variables from ShadCN theme
6. **Testing**: Run `npm test` in respective directories (framework TBD)

## Development Standards

### Code Quality Principles
- **Readability First**: Write code that is easily understandable by humans reading it
- **Scalable Architecture**: Prioritize code that can grow with the application
- **Self-Documenting**: Minimize line-level comments; let code speak for itself
- **Design Intent**: Use high-level documentation to explain architectural decisions

### Testing Philosophy
- **Test-Driven Development**: Write tests before implementing new features
- **Unit Testing Focus**:
  - Test specific method behavior and edge cases
  - Verify parameter variations and error conditions
  - Stub external dependencies (APIs, databases, file system)
- **Integration Testing Approach**:
  - Mock only external boundaries (third-party services)
  - Create realistic data scenarios that mirror production
  - Test complete application flows from input to output
  - Verify end state after operations complete

### Documentation Standards
- **Module Documentation**: Create clear README files for major packages/features
- **API Documentation**: Document endpoints, request/response formats, and error codes
- **Architecture Documentation**: Explain design decisions and trade-offs
- **Component Documentation**: Document React component props and usage patterns

### Development Process
- **Feature Development**: Backend API → Database Models → Frontend Components → Integration
- **Code Reviews**: Value well-reasoned arguments over authority; remain open to new ideas
- **Technology Adoption**: Consider new tools and approaches that improve developer experience
- **Error Handling**: Implement comprehensive error boundaries and graceful degradation

### File Organization
- **Backend**: Models → Routes → Controllers → Middleware → Utils
- **Frontend**: Components → Hooks → Utils → Types → Constants
- **Shared**: Types and interfaces should be clearly defined and shared between frontend/backend when appropriate

## Important Files

- `frontend/components.json` - ShadCN UI configuration
- `backend/src/server.ts` - Express app and MongoDB connection
- `frontend/vite.config.ts` - Build configuration and path aliases  
- `.github/workflows/ci.yml` - Automated testing and deployment
- Both `tsconfig.json` files for TypeScript compilation settings