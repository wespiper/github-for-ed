# MongoDB to PostgreSQL Migration Instructions

## Prerequisites

1. **Install PostgreSQL** (if not already installed):
   ```bash
   # macOS
   brew install postgresql@15
   brew services start postgresql@15

   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql postgresql-contrib

   # Start PostgreSQL
   sudo systemctl start postgresql
   ```

2. **Create PostgreSQL Database**:
   ```bash
   # Connect to PostgreSQL
   psql -U postgres

   # Create database and user
   CREATE DATABASE scribe_tree;
   CREATE USER scribe_tree_user WITH PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE scribe_tree TO scribe_tree_user;
   \q
   ```

3. **Install Dependencies**:
   ```bash
   cd backend
   npm install prisma @prisma/client
   npm install -D @types/node
   npm install mongodb  # For migration scripts
   ```

## Environment Setup

1. **Update .env file**:
   ```bash
   # Add PostgreSQL connection
   DATABASE_URL="postgresql://scribe_tree_user:your_secure_password@localhost:5432/scribe_tree?schema=public"
   
   # Keep MongoDB URI for migration
   MONGODB_URI="mongodb://localhost:27017/scribe-tree"
   ```

2. **Generate Prisma Client**:
   ```bash
   cd backend
   npx prisma generate
   ```

3. **Create Initial Migration**:
   ```bash
   npx prisma migrate dev --name initial_schema
   ```

## Running the Migration

### Step 1: Backup MongoDB Data
```bash
# Create backup of MongoDB database
mongodump --db scribe-tree --out ./mongodb-backup
```

### Step 2: Verify Database Connections
```bash
# Test MongoDB connection
mongo mongodb://localhost:27017/scribe-tree --eval "db.stats()"

# Test PostgreSQL connection
psql postgresql://scribe_tree_user:your_secure_password@localhost:5432/scribe_tree -c "\dt"
```

### Step 3: Run Migration Script
```bash
cd backend

# Run full migration with progress saving
npm run migrate -- --save-progress

# Or run specific stages
npm run migrate -- --resume-from documents
```

### Step 4: Verify Migration
```bash
# Open Prisma Studio to inspect data
npm run prisma:studio

# Check record counts
psql -U scribe_tree_user -d scribe_tree -c "
SELECT 
  'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'courses', COUNT(*) FROM courses
UNION ALL
SELECT 'assignments', COUNT(*) FROM assignments
UNION ALL
SELECT 'documents', COUNT(*) FROM documents;
"
```

## Code Updates Required

### 1. Update Database Connection

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

### 2. Update Server.ts

```typescript
// backend/src/server.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './lib/prisma';

// Remove mongoose imports and connection code

// Add Prisma connection check
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ message: 'Scribe Tree API is running!', database: 'PostgreSQL' });
  } catch (error) {
    res.status(500).json({ message: 'Database connection error' });
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
```

### 3. Update Routes Example

```typescript
// backend/src/routes/courses.ts
import { Router } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// Get all courses (Before - Mongoose)
// router.get('/', async (req, res) => {
//   const courses = await Course.find().populate('instructor');
//   res.json(courses);
// });

// Get all courses (After - Prisma)
router.get('/', async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      include: {
        instructor: true,
        _count: {
          select: { enrollments: true }
        }
      }
    });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Troubleshooting

### Common Issues

1. **Unique Constraint Violations**
   - Check for duplicate emails in users table
   - Verify enrollment codes are unique
   - Use `skipDuplicates: true` in createMany operations

2. **Foreign Key Constraints**
   - Ensure users are migrated before courses
   - Check that all referenced IDs exist
   - Use IdMapper to maintain relationships

3. **JSONB Data Issues**
   - Validate JSON structure before insertion
   - Use `DataValidator.ensureJson()` helper
   - Check for circular references

4. **Performance Issues**
   - Increase batch sizes in migration scripts
   - Add indexes after initial data load
   - Use connection pooling

### Rollback Procedure

If migration fails:

1. **Immediate Rollback** (within 1 hour):
   ```bash
   # Drop PostgreSQL schema
   npx prisma migrate reset --force
   
   # Switch back to MongoDB in .env
   # Restart application
   ```

2. **Data Recovery**:
   ```bash
   # Restore MongoDB from backup
   mongorestore --db scribe-tree ./mongodb-backup/scribe-tree
   ```

## Post-Migration Tasks

1. **Update Test Suite**:
   - Replace MongoDB Memory Server with PostgreSQL test database
   - Update all model tests for Prisma
   - Ensure integration tests pass

2. **Performance Optimization**:
   ```sql
   -- Add missing indexes
   CREATE INDEX idx_documents_updated ON documents(updated_at DESC);
   CREATE INDEX idx_submissions_status ON assignment_submissions(status);
   
   -- Analyze tables
   ANALYZE;
   ```

3. **Monitor Application**:
   - Check error logs for database issues
   - Monitor query performance
   - Verify all features work correctly

4. **Clean Up**:
   - Remove Mongoose dependencies after 30 days
   - Delete migration scripts and checkpoint files
   - Update documentation

## Support

For issues during migration:
1. Check migration logs in `./migration-checkpoint.json`
2. Review error details in console output
3. Consult PostgreSQL logs for database errors
4. Create GitHub issue with error details