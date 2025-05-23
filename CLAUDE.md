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

-   Frontend uses `@/*` mapping to `./src/*` (configured in tsconfig.json and vite.config.ts)
-   Import components as `@/components/ui/button` instead of relative paths

### ShadCN UI Setup

-   Pre-configured with "New York" style variant
-   Add components: `npx shadcn@latest add [component-name]`
-   Components installed to `frontend/src/components/ui/`

### TypeScript Configuration

-   **Frontend**: Modern ESNext modules, React JSX, strict mode
-   **Backend**: CommonJS compilation, output to `./dist`, strict mode
-   Both use path mapping and have separate tsconfig files

### Database Connection

-   MongoDB with Mongoose ODM
-   Connection string via `MONGODB_URI` environment variable
-   Automatic connection retry and error handling in `backend/src/server.ts`

## Architecture Patterns

### Frontend Architecture

-   Component-driven React SPA
-   Utility-first styling with Tailwind CSS
-   ShadCN UI for consistent component library
-   Vite for fast development and optimized builds

### Backend Architecture

-   Express RESTful API server
-   Environment-based configuration with dotenv
-   MongoDB document database with Mongoose schemas
-   TypeScript compilation for production deployment

### Current State

This is a foundational setup with:

-   ✅ Complete development environment
-   ✅ Build tooling and CI/CD pipeline
-   ✅ Basic Express server with health endpoint
-   ❌ No custom components or features yet implemented
-   ❌ No database models or API routes beyond health check
-   ❌ Frontend is still default Vite template

## CI/CD Pipeline

GitHub Actions workflow runs on push/PR to main/develop:

-   **Frontend**: Install deps, lint, type check, build
-   **Backend**: Install deps, lint, type check, build, test with MongoDB service
-   Both jobs run Node.js 18 with npm ci for dependency installation

## Development Workflow

1. **New Features**: Develop backend API routes first, then frontend components
2. **Database**: Create Mongoose schemas in `backend/src/models/`
3. **API Routes**: Add Express routes in `backend/src/routes/`
4. **Frontend**: Build components using ShadCN UI in `frontend/src/components/`
5. **Styling**: Use Tailwind utilities and CSS variables from ShadCN theme
6. **Testing**: Run `npm test` in respective directories (framework TBD)

## Development Standards

### Code Quality Principles

-   **Readability First**: Write code that is easily understandable by humans reading it
-   **Scalable Architecture**: Prioritize code that can grow with the application
-   **Self-Documenting**: Minimize line-level comments; let code speak for itself
-   **Design Intent**: Use high-level documentation to explain architectural decisions

### Testing Philosophy

-   **Test-Driven Development**: Write tests before implementing new features
-   **Unit Testing Focus**:
    -   Test specific method behavior and edge cases
    -   Verify parameter variations and error conditions
    -   Stub external dependencies (APIs, databases, file system)
-   **Integration Testing Approach**:
    -   Mock only external boundaries (third-party services)
    -   Create realistic data scenarios that mirror production
    -   Test complete application flows from input to output
    -   Verify end state after operations complete

### Documentation Standards

-   **Module Documentation**: Create clear README files for major packages/features
-   **API Documentation**: Document endpoints, request/response formats, and error codes
-   **Architecture Documentation**: Explain design decisions and trade-offs
-   **Component Documentation**: Document React component props and usage patterns

### Development Process

-   **Feature Development**: Backend API → Database Models → Frontend Components → Integration
-   **Code Reviews**: Value well-reasoned arguments over authority; remain open to new ideas
-   **Technology Adoption**: Consider new tools and approaches that improve developer experience
-   **Error Handling**: Implement comprehensive error boundaries and graceful degradation

### File Organization

-   **Backend**: Models → Routes → Controllers → Middleware → Utils
-   **Frontend**: Components → Hooks → Utils → Types → Constants
-   **Shared**: Types and interfaces should be clearly defined and shared between frontend/backend when appropriate

## Important Files

-   `frontend/components.json` - ShadCN UI configuration
-   `backend/src/server.ts` - Express app and MongoDB connection
-   `frontend/vite.config.ts` - Build configuration and path aliases
-   `.github/workflows/ci.yml` - Automated testing and deployment
-   Both `tsconfig.json` files for TypeScript compilation settings

## Project Vision & Philosophy

### Core Mission

GitHub for Writers transforms writing education by making the writing process visible, collaborative, and enhanced by responsible AI integration. We apply version control concepts to writing education, helping educators see student development and students understand their own growth.

### Key Differentiators

-   **Process-Focused**: We value the writing journey, not just final products
-   **Educational First**: Every feature serves learning outcomes, not administrative convenience
-   **Invisible Design**: Complex functionality with intuitive, natural interfaces
-   **Responsible AI**: Bounded assistance that enhances learning rather than replacing critical thinking
-   **Collaboration-Centered**: Real-time educator-student interaction around writing development

### What We Are NOT Building

-   A generic Learning Management System (LMS)
-   A productivity tool focused on administrative efficiency
-   A content delivery platform for lessons/chapters
-   An AI writing generator that does work for students
-   A traditional plagiarism detection system

### What We ARE Building

-   Writing process visualization tools that show student development over time
-   Collaborative editing environments where educators can observe and guide writing
-   Assignment systems focused on writing skills and learning objectives
-   Analytics that inform pedagogical decisions about writing instruction
-   AI assistance that is bounded, transparent, and educational

### User Experience Principles

1. **Invisible Complexity**: "Good design is invisible - when done right, users don't notice it because everything feels natural, intuitive, and easy to use"
2. **Progressive Disclosure**: Show essential features first, reveal advanced options as needed
3. **Educational Context**: Every interface should clearly serve writing instruction
4. **Process Visibility**: Make the invisible writing process explicit and meaningful
5. **Professional Polish**: Interface quality that justifies institutional adoption

### Decision Framework

When making any implementation decision, ask:

-   **Does this help educators understand student writing development?**
-   **Does this make the writing process more visible and valuable?**
-   **Would a non-technical educator find this intuitive?**
-   **Does this serve learning outcomes or just administrative convenience?**
-   **How does this align with our vision of responsible AI integration?**

## Core User Workflows

### Primary User Stories

#### Educator Experience

1. **Course Creation**: Create writing-focused courses with clear learning objectives and skill progression
2. **Assignment Design**: Build assignments that scaffold the writing process with appropriate AI boundaries
3. **Process Monitoring**: Observe student writing development in real-time across all assignments
4. **Targeted Feedback**: Provide contextual feedback at appropriate stages of the writing process
5. **Learning Analytics**: Use writing journey data to improve instruction and identify intervention needs

#### Student Experience

1. **Assignment Engagement**: Receive clear writing assignments with scaffolded process stages
2. **Writing Development**: Work through guided writing processes with version control tracking
3. **Feedback Integration**: Receive and respond to educator feedback throughout the writing journey
4. **AI Assistance**: Access bounded AI help that enhances learning without replacing critical thinking
5. **Growth Visualization**: See concrete evidence of writing skill development over time

### User Interface Priorities

-   **Dedicated pages** over modal dialogs for complex workflows
-   **Writing education context** in every interface element
-   **Real-time collaboration** without disrupting writing flow
-   **Visual process representation** that makes writing development clear
-   **Professional design** that feels premium and educational

## Implementation Guidelines

### Feature Development Approach

-   **Start with user workflows**, then build technical implementation
-   **Design for non-technical educators** who may be intimidated by complex interfaces
-   **Focus on writing development insights** rather than administrative metrics
-   **Build collaborative features** that connect educators and students around writing
-   **Prepare for AI integration** without implementing it prematurely

### UI/UX Standards

-   **No modal dialogs** for complex course/assignment creation workflows
-   **Full-page experiences** for important educational configuration
-   **Writing-specific terminology** throughout (not generic "content" or "lessons")
-   **Visual hierarchy** that guides users through complex decisions
-   **Contextual help** that explains educational concepts and best practices

### Technical Architecture Decisions

-   **Assignment-centric data model** (not lesson/chapter focused)
-   **Real-time collaboration** capabilities built into core architecture
-   **Version control** optimized for writing development visibility
-   **Analytics focused** on educational insights, not productivity metrics
-   **Extensible AI integration** points without current implementation

### Quality Standards

-   **Educational value first**: Every feature must serve learning outcomes
-   **Professional polish**: Interface quality that competes with modern educational tools
-   **Intuitive workflows**: Non-technical users should feel confident and capable
-   **Responsive design**: Works well on educator and student devices
-   **Performance optimization**: Real-time features work smoothly under load

## Branch & Word Brand Guidelines

### Design Philosophy

-   **Thoughtful Growth**: Every interface element should suggest intentional development
-   **Word-Focused**: Language and typography are central to visual design
-   **Branching Metaphors**: Version control and collaboration visualized through organic growth
-   **Professional Warmth**: Sophisticated enough for institutions, approachable for students

### Interface Personality

-   **Celebrate Process**: Highlight writing development, not just completion
-   **Encourage Branching**: Make trying new approaches feel natural and safe
-   **Honor Words**: Treat student writing with respect and care
-   **Build Community**: Individual growth within collaborative context

### Success Metrics

Every feature should answer: "Does this help writers understand how their words and ideas branch into better writing?"
