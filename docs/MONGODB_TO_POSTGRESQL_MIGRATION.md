# MongoDB to PostgreSQL Migration Plan for Scribe Tree

## Executive Summary

This document outlines the comprehensive migration strategy for transitioning Scribe Tree from MongoDB to PostgreSQL. The migration preserves all educational functionality while optimizing for the write-heavy, collaborative nature of the writing education platform.

## Table of Contents

1. [Current MongoDB Schema Analysis](#current-mongodb-schema-analysis)
2. [PostgreSQL Schema Design](#postgresql-schema-design)
3. [ORM Selection and Configuration](#orm-selection)
4. [Migration Strategy](#migration-strategy)
5. [Code Changes Required](#code-changes-required)
6. [Performance Optimization](#performance-optimization)
7. [Testing Requirements](#testing-requirements)
8. [Deployment Plan](#deployment-plan)

## Current MongoDB Schema Analysis

### Core Entities and Relationships

The current MongoDB implementation uses 10 primary models with extensive embedded documents and cross-references:

1. **User** - Authentication and role management (student/educator/admin)
2. **Course** - Educational class management with enrollment
3. **Assignment** - Complex writing assignments with scaffolding
4. **AssignmentTemplate** - Reusable assignment configurations
5. **CourseAssignment** - Bridge between templates and courses
6. **AssignmentSubmission** - Student work with version control
7. **Document** - Writing documents with collaboration
8. **DocumentVersion** - Version control for documents
9. **WritingSession** - Analytics for writing process
10. **Notification** - Multi-purpose notification system

### MongoDB-Specific Features in Use

- **Embedded Documents**: Complex nested structures for requirements, stages, analytics
- **Array Fields**: Students in courses, collaborators, learning objectives
- **Text Search**: Full-text indexing on assignment templates
- **Virtuals**: Computed properties for counts and analytics
- **Middleware**: Pre/post-save hooks for validation and side effects

## PostgreSQL Schema Design

### Design Principles

1. **Normalize where appropriate** while maintaining query performance
2. **Use JSONB** for flexible, semi-structured data
3. **Leverage PostgreSQL features** (arrays, full-text search, CTEs)
4. **Optimize for write-heavy workload** with appropriate indexes
5. **Support real-time collaboration** with row-level locking

### Core Tables Structure

```sql
-- Users table with role-based access
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'educator', 'admin')),
    profile_picture VARCHAR(500),
    bio TEXT,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Courses with enrollment management
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(100),
    instructor_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    is_public BOOLEAN DEFAULT false,
    max_students INTEGER DEFAULT 30,
    start_date DATE,
    end_date DATE,
    settings JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'planning',
    is_active BOOLEAN DEFAULT true,
    enrollment_code VARCHAR(20) UNIQUE,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Many-to-many enrollment table
CREATE TABLE course_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active',
    UNIQUE(course_id, student_id)
);

-- Assignment templates for reusability
CREATE TABLE assignment_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructions TEXT NOT NULL,
    requirements JSONB NOT NULL DEFAULT '{}',
    writing_stages JSONB NOT NULL DEFAULT '[]',
    learning_objectives JSONB NOT NULL DEFAULT '[]',
    ai_settings JSONB NOT NULL DEFAULT '{}',
    grading_criteria JSONB DEFAULT '{}',
    instructor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Course-specific assignments
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES assignment_templates(id),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    instructor_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    instructions TEXT NOT NULL,
    requirements JSONB NOT NULL,
    writing_stages JSONB NOT NULL,
    learning_objectives JSONB NOT NULL,
    ai_settings JSONB NOT NULL,
    grading_criteria JSONB,
    due_date TIMESTAMPTZ,
    stage_due_dates JSONB,
    status VARCHAR(20) DEFAULT 'draft',
    type VARCHAR(20) DEFAULT 'individual',
    collaboration_settings JSONB DEFAULT '{}',
    version_control_settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(template_id, course_id) WHERE template_id IS NOT NULL
);

-- Student submissions
CREATE TABLE assignment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    title VARCHAR(255),
    content TEXT,
    word_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'not_started',
    submitted_at TIMESTAMPTZ,
    collaboration_settings JSONB DEFAULT '{}',
    major_milestones JSONB DEFAULT '[]',
    analytics JSONB DEFAULT '{}',
    grade JSONB,
    ai_interactions JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(assignment_id, author_id)
);

-- Submission collaborators
CREATE TABLE submission_collaborators (
    submission_id UUID REFERENCES assignment_submissions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'collaborator',
    joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(submission_id, user_id)
);

-- Documents for writing
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    author_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    assignment_id UUID REFERENCES assignments(id) ON DELETE SET NULL,
    submission_id UUID REFERENCES assignment_submissions(id) ON DELETE SET NULL,
    type VARCHAR(20) DEFAULT 'assignment',
    status VARCHAR(20) DEFAULT 'draft',
    settings JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Document collaborators
CREATE TABLE document_collaborators (
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    permission VARCHAR(20) DEFAULT 'edit',
    joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(document_id, user_id)
);

-- Version control for documents
CREATE TABLE document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    title VARCHAR(255),
    content TEXT,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    changes JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    diff JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(document_id, version)
);

-- Writing sessions for analytics
CREATE TABLE writing_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    duration INTEGER, -- in seconds
    activity JSONB DEFAULT '{}',
    snapshots JSONB DEFAULT '[]',
    productivity JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Comments on submissions
CREATE TABLE submission_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES assignment_submissions(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    parent_id UUID REFERENCES submission_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'general',
    highlighted_text TEXT,
    position JSONB,
    is_resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Notifications system
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal',
    title VARCHAR(255) NOT NULL,
    message TEXT,
    context JSONB DEFAULT '{}',
    intervention JSONB,
    related_metrics JSONB,
    status VARCHAR(20) DEFAULT 'unread',
    action_required BOOLEAN DEFAULT false,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_courses_instructor ON courses(instructor_id);
CREATE INDEX idx_courses_active ON courses(is_active) WHERE is_active = true;
CREATE INDEX idx_courses_tags ON courses USING GIN(tags);
CREATE INDEX idx_assignments_course ON assignments(course_id);
CREATE INDEX idx_assignments_due ON assignments(due_date) WHERE status = 'published';
CREATE INDEX idx_submissions_assignment ON assignment_submissions(assignment_id);
CREATE INDEX idx_submissions_author ON assignment_submissions(author_id);
CREATE INDEX idx_documents_course_author ON documents(course_id, author_id);
CREATE INDEX idx_document_versions_document ON document_versions(document_id);
CREATE INDEX idx_writing_sessions_document ON writing_sessions(document_id);
CREATE INDEX idx_writing_sessions_user ON writing_sessions(user_id);
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, status);
CREATE INDEX idx_notifications_type ON notifications(type);

-- Full-text search
CREATE INDEX idx_assignment_templates_search ON assignment_templates 
    USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || array_to_string(tags, ' ')));

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- Add similar triggers for all tables with updated_at
```

### JSONB Structure Examples

#### Learning Objectives JSONB
```json
[
  {
    "id": "uuid",
    "description": "Analyze rhetorical strategies",
    "bloomsLevel": 4,
    "category": "analysis",
    "weight": 25
  }
]
```

#### Writing Stages JSONB
```json
[
  {
    "id": "uuid",
    "name": "Brainstorming",
    "order": 1,
    "description": "Generate and explore ideas",
    "requiredDuration": 30,
    "aiAssistance": {
      "allowedActions": ["generate_prompts", "suggest_perspectives"],
      "maxInteractions": 10,
      "reflectionRequired": true
    }
  }
]
```

#### AI Interactions JSONB
```json
[
  {
    "timestamp": "2024-01-26T10:00:00Z",
    "stage": "drafting",
    "type": "question",
    "prompt": "What evidence supports your main argument?",
    "studentResponse": "I considered three main sources...",
    "reflection": "This helped me identify gaps in my reasoning"
  }
]
```

## ORM Selection

### Recommended: Prisma

**Reasons:**
1. **Type Safety**: Generates TypeScript types from schema
2. **Migration System**: Built-in migration tracking
3. **Performance**: Efficient query generation and connection pooling
4. **Developer Experience**: Excellent tooling and documentation
5. **Active Development**: Regular updates and community support

### Prisma Configuration

```typescript
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id             String   @id @default(uuid())
  email          String   @unique
  passwordHash   String   @map("password_hash")
  firstName      String   @map("first_name")
  lastName       String   @map("last_name")
  role           UserRole
  profilePicture String?  @map("profile_picture")
  bio            String?
  isVerified     Boolean  @default(false) @map("is_verified")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  // Relations
  coursesTaught      Course[]
  enrollments        CourseEnrollment[]
  templates          AssignmentTemplate[]
  assignments        Assignment[]
  submissions        AssignmentSubmission[]
  documents          Document[]
  documentVersions   DocumentVersion[]
  writingSessions    WritingSession[]
  comments           SubmissionComment[]
  notificationsReceived Notification[] @relation("NotificationRecipient")
  notificationsSent     Notification[] @relation("NotificationSender")

  @@map("users")
  @@index([role])
}

enum UserRole {
  student
  educator
  admin
}

// Continue with other models...
```

### Connection Configuration

```typescript
// backend/src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;

export default prisma;
```

## Migration Strategy

### Phase 1: Preparation (Week 1)

1. **Set up PostgreSQL development environment**
   - Install PostgreSQL locally
   - Create development, test, and staging databases
   - Configure connection pooling with PgBouncer

2. **Install and configure Prisma**
   ```bash
   cd backend
   npm install prisma @prisma/client
   npm install -D @types/node
   npx prisma init
   ```

3. **Create complete Prisma schema**
   - Convert all Mongoose models to Prisma models
   - Define all relationships and constraints
   - Add necessary indexes

4. **Generate initial migration**
   ```bash
   npx prisma migrate dev --name initial_schema
   ```

### Phase 2: Data Migration Scripts (Week 2)

1. **Create migration utilities**

```typescript
// backend/src/migration/utils.ts
import { MongoClient } from 'mongodb';
import { PrismaClient } from '@prisma/client';

export class MigrationContext {
  mongo: MongoClient;
  prisma: PrismaClient;
  
  constructor(mongoUri: string) {
    this.mongo = new MongoClient(mongoUri);
    this.prisma = new PrismaClient();
  }
  
  async connect() {
    await this.mongo.connect();
  }
  
  async disconnect() {
    await this.mongo.close();
    await this.prisma.$disconnect();
  }
}

// ID mapping for preserving relationships
export class IdMapper {
  private mapping = new Map<string, string>();
  
  set(mongoId: string, postgresId: string) {
    this.mapping.set(mongoId, postgresId);
  }
  
  get(mongoId: string): string | undefined {
    return this.mapping.get(mongoId);
  }
}
```

2. **Create model-specific migration scripts**

```typescript
// backend/src/migration/migrate-users.ts
export async function migrateUsers(context: MigrationContext, idMapper: IdMapper) {
  const users = await context.mongo.db().collection('users').find({}).toArray();
  
  for (const user of users) {
    const prismaUser = await context.prisma.user.create({
      data: {
        email: user.email,
        passwordHash: user.password,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        profilePicture: user.profilePicture,
        bio: user.bio,
        isVerified: user.isVerified || false,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
    
    idMapper.set(user._id.toString(), prismaUser.id);
  }
}
```

3. **Handle complex embedded documents**

```typescript
// backend/src/migration/migrate-assignments.ts
export async function migrateAssignments(context: MigrationContext, idMapper: IdMapper) {
  const assignments = await context.mongo.db().collection('assignments').find({}).toArray();
  
  for (const assignment of assignments) {
    // Transform embedded documents to JSONB
    const requirements = {
      minWords: assignment.requirements?.minWords,
      maxWords: assignment.requirements?.maxWords,
      requiredSections: assignment.requirements?.requiredSections || [],
      citationStyle: assignment.requirements?.citationStyle,
      allowedResources: assignment.requirements?.allowedResources || [],
    };
    
    const writingStages = assignment.writingStages?.map((stage: any, index: number) => ({
      id: crypto.randomUUID(),
      name: stage.name,
      order: stage.order || index + 1,
      description: stage.description,
      requiredDuration: stage.requiredDuration,
      aiAssistance: {
        allowedActions: stage.aiAssistance?.allowedActions || [],
        maxInteractions: stage.aiAssistance?.maxInteractions || 0,
        reflectionRequired: stage.aiAssistance?.reflectionRequired || true,
      },
    })) || [];
    
    const prismaAssignment = await context.prisma.assignment.create({
      data: {
        courseId: idMapper.get(assignment.course.toString()),
        instructorId: idMapper.get(assignment.instructor.toString()),
        title: assignment.title,
        instructions: assignment.instructions,
        requirements,
        writingStages,
        learningObjectives: assignment.learningObjectives || [],
        aiSettings: assignment.aiSettings || {},
        gradingCriteria: assignment.grading || {},
        dueDate: assignment.dueDate,
        status: assignment.status,
        type: assignment.type,
        collaborationSettings: assignment.collaboration || {},
        versionControlSettings: assignment.versionControl || {},
        createdAt: assignment.createdAt,
        updatedAt: assignment.updatedAt,
      },
    });
    
    idMapper.set(assignment._id.toString(), prismaAssignment.id);
  }
}
```

### Phase 3: Code Updates (Week 3-4)

1. **Update all route handlers**

```typescript
// Before (Mongoose)
router.get('/courses/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'firstName lastName email')
      .populate('students', 'firstName lastName email');
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// After (Prisma)
router.get('/courses/:id', async (req, res) => {
  try {
    const course = await prisma.course.findUnique({
      where: { id: req.params.id },
      include: {
        instructor: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        enrollments: {
          include: {
            student: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Transform to match existing API
    const response = {
      ...course,
      students: course.enrollments.map(e => e.student),
    };
    delete response.enrollments;
    
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

2. **Update service classes**

```typescript
// backend/src/services/AssignmentService.ts
import prisma from '../lib/prisma';

export class AssignmentService {
  static async createAssignment(data: CreateAssignmentInput, userId: string) {
    // Validate educational requirements
    const validationResult = await this.validateEducationalRequirements(data);
    if (!validationResult.isValid) {
      throw new Error(validationResult.errors.join(', '));
    }
    
    // Create assignment with proper structure
    const assignment = await prisma.assignment.create({
      data: {
        courseId: data.courseId,
        instructorId: userId,
        title: data.title,
        instructions: data.instructions,
        requirements: data.requirements,
        writingStages: data.writingStages,
        learningObjectives: data.learningObjectives,
        aiSettings: data.aiSettings || {},
        gradingCriteria: data.gradingCriteria || {},
        dueDate: data.dueDate,
        status: 'draft',
        type: data.type || 'individual',
        collaborationSettings: data.collaborationSettings || {},
        versionControlSettings: data.versionControlSettings || {},
      },
      include: {
        course: true,
        instructor: true,
      },
    });
    
    return assignment;
  }
  
  static async validateEducationalRequirements(assignment: any) {
    // Validate learning objectives sum to 100%
    const totalWeight = assignment.learningObjectives?.reduce(
      (sum: number, obj: any) => sum + (obj.weight || 0), 
      0
    ) || 0;
    
    if (Math.abs(totalWeight - 100) > 0.01) {
      return {
        isValid: false,
        errors: ['Learning objective weights must sum to 100%'],
      };
    }
    
    // Validate writing stages have unique orders
    const stageOrders = new Set(
      assignment.writingStages?.map((s: any) => s.order) || []
    );
    
    if (stageOrders.size !== assignment.writingStages?.length) {
      return {
        isValid: false,
        errors: ['Writing stages must have unique order values'],
      };
    }
    
    return { isValid: true, errors: [] };
  }
}
```

3. **Update complex queries**

```typescript
// Complex aggregation query (Before - MongoDB)
const analytics = await WritingSession.aggregate([
  { $match: { user: userId, createdAt: { $gte: startDate } } },
  { $group: {
    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
    totalDuration: { $sum: "$duration" },
    totalWords: { $sum: "$activity.wordsAdded" },
    sessionCount: { $sum: 1 },
  }},
  { $sort: { _id: 1 } },
]);

// After - PostgreSQL with Prisma
const analytics = await prisma.$queryRaw`
  SELECT 
    DATE(created_at) as date,
    SUM(duration) as total_duration,
    SUM((activity->>'wordsAdded')::int) as total_words,
    COUNT(*) as session_count
  FROM writing_sessions
  WHERE user_id = ${userId}
    AND created_at >= ${startDate}
  GROUP BY DATE(created_at)
  ORDER BY date
`;
```

### Phase 4: Testing Updates (Week 5)

1. **Update test database setup**

```typescript
// backend/src/tests/setup.ts
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Set test database URL
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/scribe_tree_test';
  
  // Run migrations
  execSync('npx prisma migrate deploy', { env: process.env });
});

beforeEach(async () => {
  // Clean database
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename NOT LIKE '_prisma%'
  `;
  
  for (const { tablename } of tables) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tablename}" CASCADE`);
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});
```

2. **Update model tests**

```typescript
// backend/src/tests/assignment.test.ts
import prisma from '../lib/prisma';

describe('Assignment Model', () => {
  let testUser: any;
  let testCourse: any;
  
  beforeEach(async () => {
    testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        passwordHash: 'hashed',
        firstName: 'Test',
        lastName: 'User',
        role: 'educator',
      },
    });
    
    testCourse = await prisma.course.create({
      data: {
        title: 'Test Course',
        instructorId: testUser.id,
      },
    });
  });
  
  test('should create assignment with learning objectives', async () => {
    const assignment = await prisma.assignment.create({
      data: {
        courseId: testCourse.id,
        instructorId: testUser.id,
        title: 'Test Assignment',
        instructions: 'Write an essay',
        requirements: {
          minWords: 500,
          maxWords: 1000,
        },
        writingStages: [
          {
            id: crypto.randomUUID(),
            name: 'Brainstorming',
            order: 1,
            description: 'Generate ideas',
          },
        ],
        learningObjectives: [
          {
            id: crypto.randomUUID(),
            description: 'Analyze texts',
            bloomsLevel: 4,
            category: 'analysis',
            weight: 100,
          },
        ],
        aiSettings: {},
      },
    });
    
    expect(assignment.title).toBe('Test Assignment');
    expect(assignment.learningObjectives).toHaveLength(1);
  });
});
```

## Performance Optimization

### 1. Write-Heavy Optimization

```sql
-- Optimize for frequent writes
ALTER TABLE documents SET (fillfactor = 80);
ALTER TABLE document_versions SET (fillfactor = 80);
ALTER TABLE writing_sessions SET (fillfactor = 80);

-- Partitioning for large tables
CREATE TABLE writing_sessions_2024_q1 PARTITION OF writing_sessions
    FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');
```

### 2. Connection Pooling

```typescript
// backend/src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'minimal',
});

// Connection pool configuration in DATABASE_URL:
// postgresql://user:pass@localhost:5432/db?connection_limit=10&pool_timeout=30
```

### 3. Query Optimization

```typescript
// Use select to minimize data transfer
const documents = await prisma.document.findMany({
  where: { courseId, status: 'active' },
  select: {
    id: true,
    title: true,
    metadata: true,
    author: {
      select: {
        firstName: true,
        lastName: true,
      },
    },
  },
  orderBy: { updatedAt: 'desc' },
  take: 20,
});

// Use transactions for consistency
const result = await prisma.$transaction(async (tx) => {
  const submission = await tx.assignmentSubmission.update({
    where: { id: submissionId },
    data: { status: 'submitted', submittedAt: new Date() },
  });
  
  await tx.notification.create({
    data: {
      recipientId: submission.assignment.instructorId,
      type: 'submission_received',
      title: 'New submission received',
      context: { submissionId: submission.id },
    },
  });
  
  return submission;
});
```

## Testing Requirements

### 1. Update Jest Configuration

```javascript
// backend/jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/tests/**',
    '!src/migration/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

### 2. Integration Test Updates

```typescript
// backend/src/tests/integration/assignment-workflow.test.ts
describe('Assignment Workflow', () => {
  test('complete assignment creation and submission flow', async () => {
    // Create educator
    const educator = await createTestUser('educator');
    
    // Create course
    const course = await prisma.course.create({
      data: {
        title: 'Writing 101',
        instructorId: educator.id,
      },
    });
    
    // Create assignment
    const assignment = await request(app)
      .post('/api/assignments')
      .set('Authorization', `Bearer ${educator.token}`)
      .send({
        courseId: course.id,
        title: 'Essay Assignment',
        instructions: 'Write about climate change',
        requirements: { minWords: 500 },
        writingStages: [
          { name: 'Brainstorming', order: 1 },
          { name: 'Drafting', order: 2 },
        ],
        learningObjectives: [
          { description: 'Analyze data', bloomsLevel: 4, weight: 100 },
        ],
      });
    
    expect(assignment.status).toBe(201);
    
    // Student submits work
    const student = await createTestUser('student');
    await enrollStudentInCourse(student.id, course.id);
    
    const submission = await request(app)
      .post(`/api/assignments/${assignment.body.id}/submissions`)
      .set('Authorization', `Bearer ${student.token}`)
      .send({
        content: 'Essay content here...',
        wordCount: 523,
      });
    
    expect(submission.status).toBe(201);
  });
});
```

## Deployment Plan

### Phase 1: Development Environment (Week 1)
1. Set up PostgreSQL on development machines
2. Run initial migrations
3. Verify basic functionality

### Phase 2: Staging Deployment (Week 6)
1. Deploy PostgreSQL to staging environment
2. Run full data migration from MongoDB snapshot
3. Complete integration testing
4. Performance benchmarking

### Phase 3: Production Preparation (Week 7)
1. Set up production PostgreSQL with replication
2. Configure automated backups
3. Set up monitoring and alerting
4. Create rollback procedures

### Phase 4: Production Migration (Week 8)
1. **Maintenance window** (4-6 hours)
   - Put application in read-only mode
   - Take final MongoDB backup
   - Run migration scripts
   - Validate data integrity
   - Switch application to PostgreSQL
   - Monitor for issues
2. **Post-migration**
   - Keep MongoDB running for 30 days
   - Daily data validation checks
   - Performance monitoring
   - User feedback collection

## Rollback Plan

1. **Immediate Rollback** (< 1 hour after migration)
   - Switch DATABASE_URL back to MongoDB
   - Restart application servers
   - Investigate issues

2. **Delayed Rollback** (> 1 hour after migration)
   - Export changed data from PostgreSQL
   - Restore MongoDB from backup
   - Apply PostgreSQL changes to MongoDB
   - Switch back to MongoDB

## Success Metrics

1. **Data Integrity**
   - 100% of records migrated successfully
   - All relationships preserved
   - No data loss or corruption

2. **Performance**
   - Query response times ≤ MongoDB baseline
   - Write performance improved by 20%
   - Connection pool utilization < 80%

3. **Application Functionality**
   - All existing features working
   - API contracts unchanged
   - No regression in test coverage

4. **User Experience**
   - Zero user-reported data issues
   - No increase in error rates
   - Improved application responsiveness

## Conclusion

This migration plan provides a comprehensive approach to transitioning Scribe Tree from MongoDB to PostgreSQL while maintaining all educational functionality and improving performance for write-heavy workloads. The use of JSONB for flexible data structures preserves the benefits of document storage while gaining the advantages of a relational database for complex queries and data integrity.