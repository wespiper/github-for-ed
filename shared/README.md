# Shared Types Library

This directory contains all shared type definitions used across both frontend and backend to ensure consistency and eliminate type duplication.

## Structure

```
shared/
├── types/
│   ├── index.ts          # Main export file
│   ├── auth.ts           # Authentication types
│   ├── assignment.ts     # Assignment and template types
│   ├── course.ts         # Course types
│   └── common.ts         # Common utility types
└── README.md
```

## Usage

### Frontend
```typescript
import { type Assignment, type User, type CreateAssignmentInput } from '@shared/types';
```

### Backend
```typescript
import { Assignment, User, CreateAssignmentInput } from '@shared/types';
```

## Configuration

### Frontend (Vite + TypeScript)
- `tsconfig.app.json`: Includes path mapping for `@shared/*`
- `vite.config.ts`: Alias configuration for `@shared`
- `include`: Added `../shared` to TypeScript includes

### Backend (Node.js + TypeScript)
- `tsconfig.json`: Path mapping for `@shared/*`
- Module resolution configured for shared types access

## Benefits

1. **Type Consistency**: Frontend and backend use identical type definitions
2. **Single Source of Truth**: No more duplicate type definitions
3. **Better Maintainability**: Update types in one place
4. **Reduced Bugs**: Eliminates type drift between client/server
5. **Better IDE Support**: Consistent autocomplete and type checking

## Adding New Types

1. Create type definitions in appropriate file under `shared/types/`
2. Export from `shared/types/index.ts`
3. Import using `@shared/types` alias in both frontend and backend
4. Use `type` imports in frontend for verbatimModuleSyntax compatibility