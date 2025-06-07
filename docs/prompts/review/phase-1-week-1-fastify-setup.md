# Phase 1 - Week 1: Fastify Setup and Initial Migration

## Objective
Set up Fastify alongside Express in the backend and migrate the three highest-traffic endpoints as a proof of concept, achieving 2-3x performance improvement.

## Context
- **Current Phase**: Phase 1 - Decouple & Modernize
- **Week**: Week 1 of 6
- **Branch**: `feat/mcp-microservices-migration`
- **Dependencies**: Node.js 18+, existing Express backend

## Scope
### In Scope
- Install and configure Fastify with essential plugins
- Set up parallel routing structure (Express on 3000, Fastify on 3001)
- Migrate auth endpoints: `/api/auth/login`, `/api/auth/verify`
- Migrate AI endpoint: `/api/ai/generate`
- Implement feature flag for gradual traffic routing
- Set up performance benchmarking

### Out of Scope
- Database layer modifications
- Service logic changes
- Other endpoints (defer to later weeks)
- Production deployment

## Technical Requirements
1. **Framework**: Fastify 4.x with TypeScript
2. **Compatibility**: 100% API compatibility with existing Express endpoints
3. **Performance**: Target 2-3x throughput improvement
4. **Testing**: All existing tests must pass

## Implementation Steps

### Step 1: Fastify Setup
- [ ] Install Fastify and core plugins: `npm install fastify @fastify/cors @fastify/helmet @fastify/compress @fastify/rate-limit`
- [ ] Create `backend/src/fastify/server.ts` with optimal configuration
- [ ] Set up plugin architecture in `backend/src/fastify/plugins/`
- [ ] Configure TypeScript paths for Fastify code

### Step 2: Parallel Server Structure
- [ ] Create `backend/src/fastify/app.ts` as Fastify app factory
- [ ] Modify `backend/src/server.ts` to run both Express (3000) and Fastify (3001)
- [ ] Implement health check endpoints for both servers
- [ ] Set up shared middleware compatibility layer

### Step 3: Migrate Auth Endpoints
- [ ] Create `backend/src/fastify/routes/auth.ts`
- [ ] Implement `/api/auth/login` with JSON Schema validation
- [ ] Implement `/api/auth/verify` with JWT verification
- [ ] Ensure middleware (auth, validation) works correctly
- [ ] Create compatibility wrapper for existing auth service

### Step 4: Migrate AI Endpoint
- [ ] Create `backend/src/fastify/routes/ai.ts`
- [ ] Implement `/api/ai/generate` with request validation
- [ ] Add rate limiting specific to AI endpoints
- [ ] Ensure Claude API integration works seamlessly

### Step 5: Feature Flag Implementation
- [ ] Create `backend/src/config/migration.ts` for feature flags
- [ ] Implement traffic router in `backend/src/middleware/router.ts`
- [ ] Add environment variable: `FASTIFY_TRAFFIC_PERCENTAGE=0`
- [ ] Create gradual rollout mechanism

### Step 6: Performance Benchmarking
- [ ] Install autocannon: `npm install -D autocannon`
- [ ] Create `backend/benchmarks/endpoint-comparison.ts`
- [ ] Benchmark all three endpoints on both frameworks
- [ ] Document results in `backend/benchmarks/results.md`

## Code Locations
- **Current Express routes**: `backend/src/routes/auth.ts`, `backend/src/routes/ai.ts`
- **New Fastify code**: `backend/src/fastify/`
- **Shared services**: `backend/src/services/` (keep unchanged)
- **Configuration**: `backend/src/config/`

## Testing Steps
- [ ] Run existing test suite: `cd backend && npm test`
- [ ] Test auth endpoints on both frameworks:
  - [ ] POST `/api/auth/login` on Express (port 3000) and Fastify (port 3001)
  - [ ] POST `/api/auth/verify` on both servers with valid JWT tokens
- [ ] Test AI endpoint on both frameworks:
  - [ ] POST `/api/ai/generate` with valid requests on both ports
- [ ] Run performance benchmarks:
  - [ ] Execute `node backend/benchmarks/endpoint-comparison.ts`
  - [ ] Verify Fastify shows 2-3x improvement in throughput
- [ ] Test feature flag functionality:
  - [ ] Set `FASTIFY_TRAFFIC_PERCENTAGE=50` and verify traffic splitting
  - [ ] Test with 0% and 100% to ensure routing works correctly
- [ ] Validate no breaking changes:
  - [ ] Run frontend: `cd frontend && npm run dev`
  - [ ] Test login flow end-to-end through frontend
  - [ ] Verify all existing API calls work without modification

## Success Criteria
- [ ] Both servers run concurrently without conflicts
- [ ] All three endpoints work identically on Fastify
- [ ] Performance benchmarks show 2-3x improvement
- [ ] All existing tests pass
- [ ] Feature flag successfully controls traffic routing
- [ ] No changes required in frontend code

## Reference Documents
- [Migration Plan](../roadmaps/AI_MCP_MIGRATION_SUMMARY.md)
- [Technical Details - Fastify Migration](../roadmaps/AI_MCP_TECHNICAL_ADDENDUM.md#framework-specific-implementation-patterns)
- [Express to Fastify Guide](https://www.fastify.io/docs/latest/Guides/Migration-Guide-V4/)

## Notes
- Start with GET endpoints if auth endpoints prove complex
- Use Fastify's built-in serialization for performance
- Keep service layer untouched - only migrate routing layer
- Document any compatibility issues for team awareness

## Next Steps
After completing this prompt:
1. Run `/reflect` to document learnings and performance gains
2. Commit with message: "feat: Add Fastify server with auth and AI endpoints"
3. Create PR for team review
4. Next prompt: `phase-1-week-2-repository-pattern.md`