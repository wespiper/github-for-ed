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

## Development Standards

### Code Quality Principles

-   **Readability First**: Write code that is easily understandable by humans reading it
-   **Scalable Architecture**: Prioritize code that can grow with the application
-   **Self-Documenting**: Minimize line-level comments; let code speak for itself
-   **Design Intent**: Use high-level documentation to explain architectural decisions

### Development Workflow

#### Feature Development Process

1. **Understand Requirements**: Review GitHub issue, ask clarifying questions
2. **Plan Implementation**: Identify components, APIs, and tests needed
3. **Write Tests First**: Create failing tests that define expected behavior
4. **Implement Backend**: API routes, database models, business logic
5. **Implement Frontend**: Components, hooks, integration with backend
6. **Integration Testing**: Test complete user workflows end-to-end
7. **Manual Testing**: Verify in browser/interface
8. **Complete Task Reflection**: Use `/reflect` command to document insights

#### Code Quality Gates

-   All tests must pass before code is considered complete
-   ESLint warnings should be addressed (errors block completion)
-   TypeScript compilation must succeed without errors
-   Manual testing confirms feature works as expected
-   Performance is acceptable for expected usage patterns

### Error Handling Requirements

-   **API Endpoints**: Return appropriate HTTP status codes and error messages
-   **Frontend Components**: Use error boundaries and graceful degradation
-   **Database Operations**: Handle connection errors and validation failures
-   **User Feedback**: Provide clear, actionable error messages to users

### File Organization

-   **Backend**: Models → Routes → Controllers → Middleware → Utils
-   **Frontend**: Components → Hooks → Utils → Types → Constants
-   **Shared**: Types and interfaces should be clearly defined and shared between frontend/backend when appropriate

## Testing Requirements

### When to Write Tests

-   **Always**: New API endpoints, database models, utility functions
-   **Integration Tests**: Complete user workflows (signup → course creation → assignment)
-   **Unit Tests**: Individual component methods, data transformations, validation logic
-   **Before Deployment**: All new features must include appropriate test coverage

### Testing Commands

```bash
# Frontend testing (Vitest + React Testing Library)
cd frontend
npm test              # Run all tests once
npm run test:watch    # Watch mode for development
npm run test:coverage # Generate coverage report

# Backend testing (Jest + MongoDB Memory Server)
cd backend
npm test              # Run all tests with MongoDB memory server
npm run test:watch    # Watch mode for development
npm run test:coverage # Generate coverage report
```

### Testing Setup

**Frontend Testing Stack**:
- **Vitest**: Fast test runner with TypeScript support
- **React Testing Library**: Component testing focused on user behavior
- **@testing-library/jest-dom**: Additional DOM matchers
- **@testing-library/user-event**: User interaction simulation
- **jsdom**: DOM environment for tests

**Test Configuration**:
- `vitest.config.ts`: Test environment configuration with path aliases
- `src/test/setup.ts`: Global test setup with DOM mocks
- Test files: `*.test.tsx` for components, `*.test.ts` for utilities

### Testing Standards

-   **Minimum 80% code coverage** for new features
-   **Test file naming**: `ComponentName.test.tsx` or `functionName.test.ts`
-   **Test organization**: Group tests by feature/component, not by test type
-   **Mock external dependencies**: APIs, file system, third-party services
-   **Integration tests use realistic data** that mirrors production scenarios

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

### Required Test Types by Component

```typescript
// Example test requirements
interface TestRequirements {
    apiRoutes: ["unit", "integration"];
    reactComponents: ["unit", "integration"];
    databaseModels: ["unit"];
    utilities: ["unit"];
    userWorkflows: ["integration"];
}
```

## Task Completion Protocol

### Definition of Done Checklist

Before marking any task complete, ensure:

-   [ ] **Code implemented** and follows project standards
-   [ ] **Tests written** and passing (see Testing Requirements)
-   [ ] **Documentation updated** if public APIs changed
-   [ ] **Manual testing completed** for user-facing features
-   [ ] **Performance verified** for database queries and UI interactions
-   [ ] **Accessibility checked** for new UI components
-   [ ] **Task reflection completed** using `/reflect` command

### Post-Task Reflection Protocol

After completing each significant task, use the `/reflect` command to:

1. **Document Technical Decisions**: Architecture choices and rationale
2. **Capture Project Insights**: Understanding gained about user workflows and system integration
3. **Record Challenges & Solutions**: Problems encountered and how they were solved
4. **Identify Future Opportunities**: Refactoring, features, or process improvements
5. **Assess Educational Alignment**: How the work serves our writing education mission

Reflections are automatically saved to `.claude/reflections/YYYY-MM-DD-feature-name.md` for future reference.

## Learning & Reflection System

### Continuous Learning Process

This project uses a structured learning system to accumulate knowledge and improve development over time.

### Post-Task Reflection

After completing significant tasks, use: `/reflect`

This command guides you through documenting:

-   **Technical decisions and rationale**
-   **Project insights gained about user workflows and system architecture**
-   **Challenges encountered and solutions implemented**
-   **Educational platform alignment and value delivered**
-   **Future improvement opportunities identified**

### Learning Integration

Periodically (monthly or after major features), use: `/learn`

This command:

-   **Reviews recent reflections** to identify patterns and insights
-   **Extracts key learnings** about technical approaches and user needs
-   **Updates accumulated knowledge** about the project and development processes
-   **Recommends improvements** to standards, processes, or architecture
-   **Synthesizes insights** specific to our educational writing platform mission

### Reflection Storage & Access

-   **Individual reflections**: `.claude/reflections/YYYY-MM-DD-feature-name.md`
-   **Accumulated insights**: `.claude/insights/accumulated-learnings.md`
-   **Automatic context loading**: Relevant reflections are imported when working on related features
-   **Pattern recognition**: System identifies recurring challenges and successful approaches

### Learning Benefits

This system enables:

-   **Improved decision making** based on accumulated experience
-   **Faster development** by reusing proven approaches
-   **Risk reduction** by learning from past challenges
-   **Quality improvement** through identified best practices
-   **Mission alignment** by deepening understanding of educational goals

## Project Vision

### Core Mission

Transform writing education by making the writing process visible and collaborative with responsible AI integration.

### Key Principles

-   **Process over Product**: Value writing journey, not just final drafts
-   **Educational First**: Every feature serves learning outcomes
-   **Invisible Design**: Complex functionality through intuitive interfaces
-   **Bounded AI**: Enhancement that builds critical thinking, doesn't replace it

### Decision Framework

Ask: "Does this help educators understand student writing development?"

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

## Implementation Guidelines

### User Experience Principles

1. **Invisible Complexity**: "Good design is invisible - when done right, users don't notice it because everything feels natural, intuitive, and easy to use"
2. **Progressive Disclosure**: Show essential features first, reveal advanced options as needed
3. **Educational Context**: Every interface should clearly serve writing instruction
4. **Process Visibility**: Make the invisible writing process explicit and meaningful
5. **Professional Polish**: Interface quality that justifies institutional adoption

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

## Testing Examples

### Unit Test Example

```typescript
// frontend/src/utils/wordCount.test.ts
import { calculateWordCount, calculateReadingTime } from "./wordCount";

describe("wordCount utilities", () => {
    test("calculates word count correctly", () => {
        expect(calculateWordCount("Hello world")).toBe(2);
        expect(calculateWordCount("")).toBe(0);
        expect(calculateWordCount("   ")).toBe(0);
    });

    test("calculates reading time", () => {
        const text = "word ".repeat(200); // 200 words
        expect(calculateReadingTime(text)).toBe(1); // ~1 minute
    });
});
```

### Integration Test Example

```typescript
// backend/src/routes/assignments.test.ts
describe("Assignment API", () => {
    test("creates assignment with version control setup", async () => {
        const response = await request(app).post("/api/assignments").send({
            title: "Persuasive Essay",
            courseId: testCourseId,
            instructions: "Write about climate change...",
        });

        expect(response.status).toBe(201);
        expect(response.body.versionControlEnabled).toBe(true);
    });
});
```

### React Component Test Example

```typescript
// frontend/src/components/WritingEditor.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { WritingEditor } from "./WritingEditor";

describe("WritingEditor", () => {
    test("saves version when content changes significantly", async () => {
        const mockSaveVersion = jest.fn();
        render(<WritingEditor onSaveVersion={mockSaveVersion} />);

        const editor = screen.getByRole("textbox");
        fireEvent.input(editor, {
            target: { textContent: "Significant content change..." },
        });

        // Wait for debounced save
        await new Promise((resolve) => setTimeout(resolve, 1000));

        expect(mockSaveVersion).toHaveBeenCalledWith({
            content: expect.stringContaining("Significant content"),
            wordCount: expect.any(Number),
        });
    });
});
```

## Brand Guidelines

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

## CI/CD Pipeline

GitHub Actions workflow runs on push/PR to main/develop:

-   **Frontend**: Install deps, lint, type check, build
-   **Backend**: Install deps, lint, type check, build, test with MongoDB service
-   Both jobs run Node.js 18 with npm ci for dependency installation

## Important Files

-   `frontend/components.json` - ShadCN UI configuration
-   `backend/src/server.ts` - Express app and MongoDB connection
-   `frontend/vite.config.ts` - Build configuration and path aliases
-   `.github/workflows/ci.yml` - Automated testing and deployment
-   Both `tsconfig.json` files for TypeScript compilation settings

## Success Metrics

Every feature should answer: "Does this help writers understand how their words and ideas branch into better writing?"

Success is measured by:

-   **Educational Impact**: Features that demonstrably improve writing instruction
-   **User Adoption**: Educators and students find the platform intuitive and valuable
-   **Process Visibility**: Writing development becomes transparent and actionable
-   **Collaborative Growth**: Real-time interaction enhances learning outcomes
-   **Responsible AI**: Bounded assistance builds critical thinking skills
