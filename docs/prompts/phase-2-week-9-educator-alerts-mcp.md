# Phase 2 - Week 9: Educator Alerts MCP Server (NestJS)

## Objective
Extract intervention and educator alert systems into a sophisticated NestJS MCP server that handles real-time educator notifications, intervention recommendations, and automated support triggers based on student analysis.

## Context
- **Current Phase**: Phase 2 - Extract Services (Unified MCP + HTTP Microservices Migration)
- **Week**: Week 9 of 20
- **Branch**: `feat/mcp-microservices-migration`
- **Dependencies**: Writing Analysis MCP (Week 7), Student Profiling MCP (Week 8), Unified Migration Plan (Phase 1 complete), event system operational
- **Unified Approach**: Dual interface architecture (MCP protocol + HTTP REST APIs)

## Scope
### In Scope
- Create NestJS MCP server for educator alerts and interventions with **DUAL INTERFACE**
- Extract InterventionService and educator notification logic
- Implement 4 tools with dual interfaces:
  - **MCP Tools**: For Claude Code integration and AI development
  - **HTTP REST APIs**: For Fastify gateway and internal service communication
  - Tools: generate_intervention_recommendations, send_educator_alerts, schedule_intervention_actions, track_intervention_effectiveness
- Set up real-time notification system with educator preferences
- **Integration**: HTTP client for communication with Writing Analysis and Student Profiling services
- Integrate with existing MCP servers for comprehensive student insights

### Out of Scope
- Real-time cognitive monitoring (handled by high-performance Fastify service in Phase 3)
- Student-facing intervention delivery mechanisms
- Advanced machine learning for intervention prediction
- Production notification infrastructure (email/SMS services)

## Technical Requirements
1. **Framework**: NestJS 10.x with real-time capabilities and notification management
2. **MCP Protocol**: Complete tool registration with educator-focused functionality
3. **Performance**: <100ms response time for alert generation, real-time notification delivery
4. **Integration**: Seamless communication with other MCP servers

## Implementation Steps

### Step 1: NestJS MCP Server Setup
- [ ] Create `mcp-servers/educator-alerts/` directory structure
- [ ] Initialize NestJS project: `nest new educator-alerts-mcp-server`
- [ ] Install dependencies: `npm install @anthropic/mcp-sdk @nestjs/websockets socket.io`
- [ ] Configure TypeScript and project structure following established patterns
- [ ] Set up Docker container with notification system optimization

### Step 2: MCP Protocol Integration
- [ ] Create `src/mcp/mcp-server.module.ts` for MCP integration
- [ ] Implement `src/mcp/mcp-tools.controller.ts` for tool registration
- [ ] Define MCP tool schemas in `src/mcp/schemas/educator-alerts-schemas.ts`
- [ ] Create `src/mcp/mcp-tools.service.ts` for tool orchestration
- [ ] Set up educational purpose validation for educator tools

### Step 3: Core Domain Modules
- [ ] Create `src/interventions/interventions.module.ts`
- [ ] Create `src/alerts/alerts.module.ts`
- [ ] Create `src/notifications/notifications.module.ts`
- [ ] Create `src/effectiveness-tracking/effectiveness-tracking.module.ts`
- [ ] Implement domain services with educator workflow modeling

### Step 4: Intervention Recommendation Tool
- [ ] Create `src/interventions/services/intervention-recommender.service.ts`
- [ ] Implement `generate_intervention_recommendations` MCP tool
- [ ] Add intervention strategy algorithms based on student data
- [ ] Integrate with Writing Analysis and Student Profiling MCP servers
- [ ] Build personalized intervention recommendation engine

### Step 5: Educator Alert System Tool
- [ ] Create `src/alerts/services/alert-manager.service.ts`
- [ ] Implement `send_educator_alerts` MCP tool
- [ ] Add real-time alert generation and prioritization
- [ ] Integrate with educator preference management
- [ ] Build alert aggregation and digest capabilities

### Step 6: Intervention Scheduling Tool
- [ ] Create `src/interventions/services/intervention-scheduler.service.ts`
- [ ] Implement `schedule_intervention_actions` MCP tool
- [ ] Add intervention timing and sequencing logic
- [ ] Integrate with calendar and scheduling systems
- [ ] Build intervention workflow management

### Step 7: Effectiveness Tracking Tool
- [ ] Create `src/effectiveness-tracking/services/effectiveness-tracker.service.ts`
- [ ] Implement `track_intervention_effectiveness` MCP tool
- [ ] Add intervention outcome measurement
- [ ] Build longitudinal effectiveness analysis
- [ ] Create intervention improvement recommendations

### Step 8: Real-Time Notification System
- [ ] Create `src/notifications/services/notification-service.ts`
- [ ] Implement WebSocket connections for real-time alerts
- [ ] Add notification preference management
- [ ] Create notification delivery tracking
- [ ] Build notification rate limiting and batching

### Step 9: Inter-Service Communication
- [ ] Create `src/integrations/mcp-client.service.ts`
- [ ] Set up communication with Writing Analysis MCP server
- [ ] Integrate with Student Profiling MCP server
- [ ] Create event subscription for real-time student data
- [ ] Build comprehensive student insight aggregation

### Step 10: Testing & Educator Validation
- [ ] Set up comprehensive Jest testing with NestJS utilities
- [ ] Create unit tests for all intervention algorithms
- [ ] Add integration tests for MCP tool functionality
- [ ] Create educator workflow testing suite
- [ ] Add real-time notification testing

## Code Locations
- **MCP Server**: `mcp-servers/educator-alerts/`
- **Main Module**: `mcp-servers/educator-alerts/src/app.module.ts`
- **MCP Integration**: `mcp-servers/educator-alerts/src/mcp/`
- **Domain Services**: `mcp-servers/educator-alerts/src/interventions/`, `mcp-servers/educator-alerts/src/alerts/`
- **Notifications**: `mcp-servers/educator-alerts/src/notifications/`
- **Integrations**: `mcp-servers/educator-alerts/src/integrations/`

## Testing Steps
- [ ] Run NestJS test suite: `cd mcp-servers/educator-alerts && npm test`
- [ ] Test MCP tool functionality:
  - [ ] Test `generate_intervention_recommendations` with various student scenarios
  - [ ] Test `send_educator_alerts` with different urgency levels
  - [ ] Test `schedule_intervention_actions` with complex scheduling scenarios
  - [ ] Test `track_intervention_effectiveness` with longitudinal data
- [ ] Test intervention algorithms:
  - [ ] Validate intervention recommendations against educational research
  - [ ] Test alert prioritization algorithms
  - [ ] Verify intervention timing optimization
  - [ ] Test effectiveness measurement accuracy
- [ ] Performance testing:
  - [ ] Measure response times for each tool: `npm run benchmark`
  - [ ] Verify <100ms response time for alert generation
  - [ ] Test real-time notification delivery performance
  - [ ] Load test with multiple concurrent educators
- [ ] Integration testing:
  - [ ] Test communication with Writing Analysis MCP server
  - [ ] Test integration with Student Profiling MCP server
  - [ ] Test event subscription and real-time data flow
  - [ ] Verify comprehensive student insight aggregation
- [ ] Real-time notification testing:
  - [ ] Test WebSocket connection establishment and management
  - [ ] Test notification delivery under various network conditions
  - [ ] Test notification preference management
  - [ ] Verify notification rate limiting and batching
- [ ] Educator workflow testing:
  - [ ] Test complete intervention workflow from alert to action
  - [ ] Test educator preference customization
  - [ ] Test intervention scheduling and tracking
  - [ ] Verify educator-friendly alert formatting and prioritization

## Success Criteria
- [ ] All 4 MCP tools implemented and educationally validated
- [ ] Real-time notification system operational
- [ ] Integration with other MCP servers working seamlessly
- [ ] Intervention algorithms validated by educators
- [ ] Performance targets met: <100ms alert generation
- [ ] Comprehensive test suite with >95% coverage
- [ ] Educator workflow efficiency demonstrated
- [ ] Intervention effectiveness tracking operational

## Reference Documents
- [Migration Plan - Phase 2 Service Extraction](../roadmaps/AI_MCP_MIGRATION_SUMMARY.md#phase-2-extract-services-weeks-7-12)
- [Intervention Strategy Research](../docs/education/INTERVENTION_STRATEGIES.md)
- [Educator Workflow Documentation](../docs/education/EDUCATOR_WORKFLOWS.md)
- [Real-time Notification Architecture](../docs/architecture/NOTIFICATION_SYSTEM.md)

## Notes
- Focus on educator usability and workflow integration
- Ensure intervention recommendations are research-backed and practical
- Build strong integration patterns with other MCP servers
- Prioritize real-time responsiveness for urgent student situations
- Document intervention effectiveness measurement for continuous improvement

## Next Steps
After completing this prompt:
1. Run `/reflect` to document intervention systems and educator workflow patterns
2. Commit with message: "feat: Implement educator alerts MCP server with real-time intervention management"
3. Create comprehensive PR with educator workflow documentation
4. Next prompt: `phase-2-week-10-academic-integrity-mcp.md`

---

# Completion Instructions

After completing the implementation in this prompt:

1. **Run `/reflect`** to capture implementation insights and lessons learned
2. **Update this prompt file** by appending a "## Completion Reflection" section with:
   - Implementation date and completion status
   - Key insights and lessons learned from `/reflect`
   - Any deviations from the original plan
   - Recommendations for future similar work
3. **Create review folder** (`review/` in same directory as prompt file) if it doesn't exist
4. **Move the updated prompt** to the review folder with timestamp suffix
5. **Log the completion** for project tracking

## File Organization

```
docs/prompts/
├── phase-1-week-1-fastify-setup.md          # Active prompts
├── phase-1-week-2-repository-pattern.md
├── review/                                   # Completed prompts
│   ├── phase-1-week-1-fastify-setup-completed-2025-06-01.md
│   └── phase-2-week-7-mcp-server-completed-2025-06-01.md
```

**Note**: This process ensures all implementation work is properly documented and archived for future reference.