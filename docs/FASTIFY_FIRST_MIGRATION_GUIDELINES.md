# Fastify-First Architecture Migration Guidelines

## Overview

This document establishes architectural guidelines to ensure all future development follows Fastify-first architecture, eliminating Express dependencies and maintaining consistency across the entire backend stack.

## Current Migration Status

### ✅ Completed Migrations

1. **Phase 2 Week 9 - Educator Alerts** (2025-06-03)
   - Successfully migrated from Express to Fastify
   - TypeBox schema validation implemented
   - All 9 API endpoints using Fastify routes
   - Integration with existing Fastify app complete

### 📋 Planning Documents Status

**Phase 2 Documents** - ✅ Already Fastify-First:
- Week 10: Academic Integrity MCP - Correctly references Fastify
- Week 11: Remaining Services - Correctly references Fastify gateway
- Week 12: Integration Testing - Correctly references Fastify

**Phase 3 Documents** - ✅ Already Fastify-First:
- Week 13: Infrastructure Setup - Correctly uses Fastify architecture
- Week 14: Cognitive Monitoring MCP - Specifically mentions "Fastify MCP server"
- Week 15: Performance Optimization - Correctly references Fastify
- Week 16: Load Testing - Correctly uses Fastify architecture

**Phase 4 Documents** - ✅ Already Fastify-First:
- Week 17: Migration Completion - Correctly uses Fastify
- Week 18: Production Readiness - Correctly references Fastify
- Week 19: End-to-End Testing - Correctly uses Fastify
- Week 20: Final Validation - Correctly references Fastify

## Architecture Requirements

### 1. HTTP Layer Architecture

**Required**: All new HTTP services MUST use Fastify
**Prohibited**: Express.js is no longer supported for new development

```typescript
// ✅ Correct - Fastify Implementation
export async function createEducatorAlertsRoutes(fastify: FastifyInstance) {
  await fastify.register(async (fastify) => {
    fastify.post<{ Body: AlertRequest }>('/alerts', {
      schema: {
        body: AlertRequestSchema,
        response: { 200: AlertResponseSchema }
      }
    }, async (request, reply) => {
      // Implementation
    });
  });
}

// ❌ Incorrect - Express Implementation (Deprecated)
router.post('/alerts', (req: Request, res: Response) => {
  // This pattern is no longer allowed
});
```

### 2. Schema Validation

**Required**: TypeBox for Fastify schema validation
**Prohibited**: Zod validation middleware (Express pattern)

```typescript
// ✅ Correct - TypeBox with Fastify
import { Type, Static } from '@sinclair/typebox';

const AlertRequestSchema = Type.Object({
  studentId: Type.String(),
  alertType: Type.String(),
  severity: Type.Union([Type.Literal('low'), Type.Literal('medium'), Type.Literal('high')])
});

// ❌ Incorrect - Zod middleware (Express pattern)
import { z } from 'zod';
const alertSchema = z.object({...}); // No longer used
```

### 3. Service Integration Patterns

**Triple-Tier Architecture**: MCP → HTTP (Fastify) → Repository

```typescript
// ✅ Correct Implementation
export class FastifyEducatorAlertsClient implements EducatorAlertsHttpClient {
  private baseUrl: string;

  async generateInterventionRecommendations(params: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/educator-alerts/recommendations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return response.json();
  }
}
```

### 4. Route Registration

**Required**: Plugin-based route registration with Fastify
**Prohibited**: Express-style router mounting

```typescript
// ✅ Correct - Fastify Plugin Registration
// In src/fastify/app.ts
await fastify.register(educatorAlertsRoutes, { prefix: '/api/educator-alerts' });

// ❌ Incorrect - Express Router (Deprecated)
// app.use('/api/educator-alerts', educatorAlertsRouter);
```

## Implementation Guidelines

### New Service Development

When creating new services that require HTTP endpoints:

1. **Create Fastify Routes First**
   - Create routes in `backend/src/fastify/routes/`
   - Use TypeBox for schema validation
   - Follow existing patterns from `educatorAlerts.ts`

2. **Register Routes in Fastify App**
   - Add registration to `backend/src/fastify/app.ts`
   - Use appropriate URL prefix
   - Ensure proper error handling

3. **Update Service Layer**
   - Create Fastify-compatible HTTP client
   - Remove any Express-specific patterns
   - Use `fetch` API for HTTP communication

4. **Testing**
   - Create Fastify-specific tests in `__tests__/`
   - Use Fastify's `inject` method for testing
   - Validate TypeBox schema enforcement

### Migration Checklist for Existing Services

When migrating existing Express routes to Fastify:

- [ ] Create new Fastify route file in `backend/src/fastify/routes/`
- [ ] Convert Zod schemas to TypeBox schemas
- [ ] Replace Express middleware with Fastify hooks/plugins
- [ ] Update error handling to Fastify patterns
- [ ] Register routes in Fastify app
- [ ] Update HTTP clients to use Fastify endpoints
- [ ] Create Fastify-specific tests
- [ ] Remove Express routes and dependencies
- [ ] Update service documentation

### Code Patterns

#### Error Handling
```typescript
// ✅ Fastify Error Handling
async (request, reply) => {
  try {
    const result = await service.process(request.body);
    return { success: true, data: result };
  } catch (error) {
    reply.code(500).send({
      success: false,
      message: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
}
```

#### Authentication
```typescript
// ✅ Fastify Authentication Hook
fastify.addHook('preHandler', async (request, reply) => {
  const token = request.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    reply.code(401).send({ success: false, message: 'Authentication required' });
    return;
  }
  // Validate token and set user context
});
```

#### CORS Configuration
```typescript
// ✅ Fastify CORS
await fastify.register(require('@fastify/cors'), {
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
});
```

## Directory Structure

```
backend/
├── src/
│   ├── fastify/                 # Fastify-specific code
│   │   ├── app.ts              # Main Fastify app
│   │   ├── plugins/            # Fastify plugins
│   │   ├── routes/             # All HTTP routes (Fastify only)
│   │   │   ├── educatorAlerts.ts
│   │   │   ├── analytics.ts
│   │   │   └── ...
│   │   └── __tests__/          # Fastify route tests
│   ├── routes/                 # ⚠️  Legacy Express routes (to be migrated)
│   ├── services/               # Business logic (framework agnostic)
│   └── repositories/           # Data access (framework agnostic)
```

## Dependencies

### Required Fastify Dependencies
```json
{
  "dependencies": {
    "fastify": "^4.24.0",
    "@fastify/cors": "^8.4.0",
    "@fastify/websocket": "^7.2.0",
    "@sinclair/typebox": "^0.32.0"
  }
}
```

### Deprecated Express Dependencies
```json
{
  "dependencies": {
    "express": "// Remove when migration complete",
    "zod": "// Replace with TypeBox",
    "express-validator": "// No longer needed"
  }
}
```

## Testing Standards

### Fastify Test Pattern
```typescript
import { FastifyInstance } from 'fastify';
import { createFastifyApp } from '../app';

describe('Service Routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createFastifyApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should handle requests correctly', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/service/endpoint',
      payload: { data: 'test' }
    });

    expect(response.statusCode).toBe(200);
    const data = JSON.parse(response.payload);
    expect(data.success).toBe(true);
  });
});
```

## Future Development Guidelines

### New HTTP Services
1. **Always use Fastify** - No Express services allowed
2. **TypeBox schemas** - For all request/response validation
3. **Plugin architecture** - Register all routes as Fastify plugins
4. **Consistent error handling** - Follow established patterns
5. **Test coverage** - Use Fastify's testing capabilities

### MCP Server Integration
1. **Triple-tier fallback** - MCP → HTTP (Fastify) → Repository
2. **Consistent interfaces** - Same service interface for all tiers
3. **Protocol selection** - MCP for real-time, HTTP for bulk operations
4. **Error handling** - Graceful degradation across tiers

### Performance Considerations
1. **Fastify performance** - Leverage Fastify's superior performance
2. **Schema compilation** - Pre-compile TypeBox schemas
3. **Plugin efficiency** - Minimize plugin overhead
4. **Connection pooling** - Efficient database connections

## Migration Priority

### High Priority (Next Sprint)
- Migrate remaining Express routes in `backend/src/routes/`
- Analytics and reporting endpoints
- Student profiling routes
- Academic integrity routes

### Medium Priority
- Update development tools and scripts
- Complete test migration to Fastify patterns
- Update documentation and examples

### Low Priority
- Remove Express dependencies entirely
- Optimize Fastify configuration
- Performance benchmarking

## Success Metrics

### Migration Completion
- [ ] Zero Express routes in production
- [ ] All HTTP endpoints using Fastify
- [ ] Complete TypeBox schema coverage
- [ ] All tests using Fastify patterns

### Performance Targets
- [ ] Response times <100ms (p95) maintained or improved
- [ ] Memory usage optimized with Fastify
- [ ] CPU utilization reduced compared to Express
- [ ] Throughput increased with Fastify

### Developer Experience
- [ ] Consistent development patterns
- [ ] Clear testing strategies
- [ ] Simplified deployment process
- [ ] Reduced cognitive overhead

## References

- [Fastify Documentation](https://fastify.dev/)
- [TypeBox Schema Documentation](https://github.com/sinclairzx81/typebox)
- [Express to Fastify Migration Completion Report](./EXPRESS_TO_FASTIFY_MIGRATION_COMPLETION.md)
- [Phase 2 Week 9 Implementation](../backend/src/fastify/routes/educatorAlerts.ts)

## Contact

For questions about Fastify-first architecture:
- Review existing implementations in `backend/src/fastify/`
- Follow patterns established in educator alerts migration
- Ensure consistency with established architectural decisions

---

**Remember**: This migration ensures architectural consistency, improved performance, and better maintainability. All future HTTP development must follow these Fastify-first guidelines.