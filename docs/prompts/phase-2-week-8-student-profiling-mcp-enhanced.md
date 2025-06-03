# Phase 2 - Week 8: Student Profiling MCP Server (Privacy-Enhanced with Data Agency)

## Objective
Extract student profiling services with integrated data agency controls, privacy-preserving analytics, and comprehensive consent management to create a privacy-first student profile system.

## Context
- **Current Phase**: Phase 2 - Extract Services (Unified MCP + HTTP Microservices Migration)
- **Week**: Week 8 of 20
- **Branch**: `feat/mcp-microservices-migration`
- **Dependencies**: Writing Analysis MCP (Week 7), Unified Migration Plan (Phase 1 complete), privacy-aware repositories, audit event system
- **Privacy Architecture**: Consolidating Student Profiling + Student Data Agency + Analytics Privacy
- **Unified Approach**: Dual interface architecture (MCP protocol + HTTP REST APIs)

## Scope
### In Scope
- Create privacy-enhanced NestJS MCP server for student profiling with **DUAL INTERFACE**
- Extract LearningProgressTracker and student profiling logic
- Implement 8 tools with dual interfaces (4 original + 4 privacy):
  - **MCP Tools**: For Claude Code integration and AI development
  - **HTTP REST APIs**: For Fastify gateway and internal service communication
  - Original: build_student_profile, track_learning_trajectory, assess_skill_development, generate_personalized_recommendations
  - Privacy: manage_student_privacy_choices, generate_privacy_preserving_analytics, validate_data_access_requests, create_student_privacy_dashboard
- Implement comprehensive student data agency controls
- Set up differential privacy for analytics
- **Integration**: HTTP client for Fastify gateway communication

### Out of Scope
- Separate privacy MCP servers (integrated into this service)
- Cognitive monitoring (Phase 3)
- Real-time behavioral analysis
- Advanced ML model training

## Technical Requirements
1. **Framework**: NestJS 10.x with privacy-by-design architecture and dual interface support
2. **MCP Protocol**: Complete tool registration with consent validation (for Claude Code)
3. **HTTP REST API**: OpenAPI/Swagger documented endpoints (for internal services)
4. **Performance**: <150ms response time including privacy checks (both protocols)
5. **Privacy**: Student data agency, differential privacy, consent management, privacy dashboards
6. **Service Communication**: HTTP client integration with circuit breakers and fallbacks
7. **Protocol Routing**: Unified service layer supporting both MCP tools and HTTP endpoints

## Implementation Steps

### Step 1: Privacy-First NestJS MCP Server Setup
- [ ] Create `mcp-servers/student-profiling/` directory structure
- [ ] Initialize NestJS project: `nest new student-profiling-mcp-server`
- [ ] Install dependencies: `npm install @anthropic/mcp-sdk class-validator differential-privacy crypto`
- [ ] Configure privacy-first TypeScript settings
- [ ] Set up Docker container with data protection
- [ ] Create student privacy configuration system

### Step 2: Dual Interface Architecture Setup
- [ ] Create `src/mcp/mcp-server.module.ts` with consent middleware (MCP Protocol)
- [ ] Create `src/http/http-api.module.ts` with REST endpoints (HTTP API)
- [ ] Implement `src/mcp/consent-guard.ts` for MCP tool access
- [ ] Implement `src/http/api-auth.guard.ts` for HTTP endpoint access
- [ ] Create `src/shared/student-profiling.service.ts` (unified business logic)
- [ ] Define MCP tool schemas with privacy metadata
- [ ] Define OpenAPI/Swagger schemas for HTTP endpoints
- [ ] Create `src/mcp/privacy-context.decorator.ts`
- [ ] Set up consent-aware tool registration and HTTP routing

### Step 2a: Service Communication Integration
- [ ] Install HTTP client dependencies: `npm install @nestjs/axios axios`
- [ ] Create `src/http-client/fastify-gateway.client.ts`
- [ ] Implement circuit breaker integration for HTTP calls
- [ ] Add service discovery configuration
- [ ] Create health check endpoints for both protocols

**Dual Interface Implementation Example:**
```typescript
// Shared business logic service
@Injectable()
export class StudentProfilingService {
  async buildProfile(params: BuildProfileParams): Promise<StudentProfile> {
    // Core business logic used by both interfaces
  }
}

// MCP Tool Interface (for Claude Code)
@MCPTool('build_student_profile')
export class BuildProfileMCPTool {
  constructor(private service: StudentProfilingService) {}
  
  async execute(params: MCPParams): Promise<MCPResponse> {
    return this.service.buildProfile(params);
  }
}

// HTTP API Interface (for Fastify Gateway)
@Controller('student-profiles')
export class StudentProfileController {
  constructor(private service: StudentProfilingService) {}
  
  @Post('build')
  async buildProfile(@Body() params: HTTPParams): Promise<StudentProfile> {
    return this.service.buildProfile(params);
  }
}
```

### Step 3: Core Domain Modules with Privacy Controls
- [ ] Create `src/student-profiling/student-profiling.module.ts`
- [ ] Create `src/data-agency/data-agency.module.ts` (NEW)
- [ ] Create `src/privacy-analytics/privacy-analytics.module.ts` (NEW)
- [ ] Create `src/learning-trajectory/learning-trajectory.module.ts`
- [ ] Implement privacy-first domain services

### Step 4: Student Privacy Choices Management Tool (Privacy Tool #1 - Dual Interface)
- [ ] Create `src/data-agency/services/privacy-choices.service.ts` (shared business logic)
- [ ] Implement `manage_student_privacy_choices` MCP tool (for Claude Code)
- [ ] Implement `POST /privacy-choices` HTTP endpoint (for Fastify gateway)
- [ ] Add comprehensive choice categories:
  ```typescript
  - Educational sharing (teacher, peer, parent access levels)
  - Platform improvement (anonymous patterns, feature analytics, research)
  - Personal benefits (enhanced analytics, portfolio, career guidance)
  - Privacy controls (retention period, sensitive content, third-party)
  ```
- [ ] Create value exchange explanations
- [ ] Add choice versioning and history
- [ ] Implement granular opt-in/opt-out

### Step 5: Student Profile Building Tool (Privacy-Enhanced)
- [ ] Create `src/student-profiling/services/profile-builder.service.ts`
- [ ] Implement `build_student_profile` MCP tool
- [ ] Add privacy features:
  - Build profiles respecting privacy choices
  - Separate public/private profile elements
  - Consent verification before profile creation
  - Data minimization in profile storage
- [ ] Integrate with Week 7 writing analysis data
- [ ] Add profile encryption for sensitive data

### Step 6: Privacy-Preserving Analytics Tool (Privacy Tool #2)
- [ ] Create `src/privacy-analytics/services/differential-privacy.service.ts`
- [ ] Implement `generate_privacy_preserving_analytics` MCP tool
- [ ] Add differential privacy features:
  ```typescript
  - Epsilon/delta privacy parameters
  - Laplace noise mechanism
  - Minimum cohort size enforcement (10+)
  - Suppression rules for small groups
  ```
- [ ] Create synthetic data generation
- [ ] Add privacy budget tracking
- [ ] Implement federated analytics patterns

### Step 7: Learning Trajectory Tracking Tool (Consent-Aware)
- [ ] Create `src/learning-trajectory/services/trajectory-tracker.service.ts`
- [ ] Implement `track_learning_trajectory` MCP tool
- [ ] Add privacy safeguards:
  - Trajectory tracking with explicit consent
  - Anonymous trajectory aggregation
  - Opt-out without losing functionality
  - Privacy-safe peer comparisons
- [ ] Add trajectory data retention policies
- [ ] Create exportable trajectory reports

### Step 8: Data Access Validation Tool (Privacy Tool #3)
- [ ] Create `src/data-agency/services/access-validator.service.ts`
- [ ] Implement `validate_data_access_requests` MCP tool
- [ ] Add validation features:
  ```typescript
  interface AccessRequest {
    requesterId: string;
    requesterType: 'teacher' | 'peer' | 'platform' | 'researcher';
    purpose: EducationalPurpose;
    dataTypes: DataType[];
    studentBenefit: string;
  }
  ```
- [ ] Check against student privacy choices
- [ ] Generate access tokens with restrictions
- [ ] Add access expiration and revocation

### Step 9: Skill Development Assessment Tool (Privacy-Aware)
- [ ] Create `src/skill-assessment/services/skill-assessor.service.ts`
- [ ] Implement `assess_skill_development` MCP tool
- [ ] Add privacy protections:
  - Skills assessed only with consent
  - Anonymous skill benchmarking
  - Private skill portfolio option
  - Educator access controls
- [ ] Create skill sharing preferences
- [ ] Add skill verification without exposure

### Step 10: Student Privacy Dashboard Tool (Privacy Tool #4)
- [ ] Create `src/data-agency/services/privacy-dashboard.service.ts`
- [ ] Implement `create_student_privacy_dashboard` MCP tool
- [ ] Add dashboard features:
  ```typescript
  interface PrivacyDashboard {
    currentChoices: StudentDataChoices;
    dataAccessLog: AccessLogEntry[];
    privacyScore: PrivacyMetrics;
    recommendations: PrivacyRecommendation[];
    controls: {
      updateChoices: () => void;
      downloadData: () => void;
      requestDeletion: () => void;
    };
  }
  ```
- [ ] Create visual privacy reports
- [ ] Add data export capabilities
- [ ] Implement deletion workflows

### Step 11: Personalized Recommendations Tool (Value Exchange)
- [ ] Create `src/personalization/services/recommendation-engine.service.ts`
- [ ] Implement `generate_personalized_recommendations` MCP tool
- [ ] Add privacy-aware features:
  - Recommendations based on consented data only
  - Clear value exchange explanations
  - Opt-in for enhanced recommendations
  - Privacy-safe recommendation storage
- [ ] Show how data sharing improves recommendations
- [ ] Add recommendation privacy controls

### Step 12: Privacy-Enhanced Data Repositories
- [ ] Create `src/repositories/student-data.repository.ts`
- [ ] Add consent checking to all data access
- [ ] Create privacy preference repository
- [ ] Add audit trail integration
- [ ] Implement data retention automation

### Step 13: Privacy Event System
- [ ] Create privacy-specific events:
  - `PrivacyChoicesUpdated`
  - `DataAccessRequested`
  - `ConsentGranted/Revoked`
  - `PrivacyThresholdExceeded`
- [ ] Add real-time privacy monitoring
- [ ] Create privacy alert system

### Step 14: Comprehensive Privacy Testing
- [ ] Create privacy compliance test suite
- [ ] Test differential privacy accuracy
- [ ] Verify consent enforcement
- [ ] Test data access validation
- [ ] Add privacy dashboard functionality tests

## Code Locations
- **MCP Server**: `mcp-servers/student-profiling/`
- **Privacy Modules**: `mcp-servers/student-profiling/src/data-agency/`, `mcp-servers/student-profiling/src/privacy-analytics/`
- **Privacy Dashboard**: `mcp-servers/student-profiling/src/data-agency/dashboard/`
- **Privacy Tests**: `mcp-servers/student-profiling/test/privacy/`

## Testing Steps
- [ ] Run privacy test suite: `cd mcp-servers/student-profiling && npm test`
- [ ] Test privacy tools:
  - [ ] Test `manage_student_privacy_choices` with various preference combinations
  - [ ] Test `generate_privacy_preserving_analytics` differential privacy
  - [ ] Test `validate_data_access_requests` enforcement
  - [ ] Test `create_student_privacy_dashboard` completeness
- [ ] Test consent enforcement:
  - [ ] Verify no profile building without consent
  - [ ] Test access denied for non-consented data
  - [ ] Verify privacy choices instantly enforced
  - [ ] Test consent revocation cascades
- [ ] Test differential privacy:
  - [ ] Verify epsilon/delta parameters enforced
  - [ ] Test noise addition maintains utility
  - [ ] Verify small cohort suppression
  - [ ] Test privacy budget tracking
- [ ] Performance with privacy:
  - [ ] Measure privacy overhead: <30ms
  - [ ] Test concurrent consent checks
  - [ ] Verify caching improves performance
  - [ ] Load test with privacy active
- [ ] Value exchange testing:
  - [ ] Test enhanced features with data sharing
  - [ ] Verify clear benefit communication
  - [ ] Test recommendation quality improves
  - [ ] Verify no punishment for privacy choices

## Success Criteria
- [ ] All 8 tools implemented with dual interfaces (4 original + 4 privacy)
- [ ] **MCP Protocol**: All tools accessible via Claude Code integration
- [ ] **HTTP REST API**: All endpoints accessible via Fastify gateway
- [ ] Student data agency fully functional (both protocols)
- [ ] Differential privacy protecting analytics
- [ ] Privacy dashboard empowering students
- [ ] Consent enforcement 100% effective
- [ ] Value exchange clearly demonstrated
- [ ] Privacy overhead <30ms (both protocols)
- [ ] HTTP client integration with circuit breakers
- [ ] Service discovery and health checks operational
- [ ] Test coverage >95% (including both interfaces)

## Reference Documents
- **[Unified Migration Plan](../roadmaps/HTTP_MICROSERVICES_MIGRATION_PLAN.md)** - Dual interface architecture
- **[Migration Plan Summary](../MIGRATION_PLAN_SUMMARY.md)** - Implementation strategy
- [Consolidated Privacy Architecture](../docs/consolidated-privacy-mcp-architecture.md)
- [Student Data Agency Framework](../docs/scribe-tree-privacy-mcp-architecture.md#student-data-agency)
- [Differential Privacy Guide](../docs/privacy/DIFFERENTIAL_PRIVACY_IMPLEMENTATION.md)
- [Value Exchange Model](../docs/privacy/VALUE_EXCHANGE_PATTERNS.md)
- **[Phase 2 Week 7 Completion](./review/phase-2-week-7-writing-analysis-mcp-enhanced-completed-2025-06-02.md)** - Risk mitigation patterns

## Notes
- Students are partners, not subjects - emphasize agency and value
- Make privacy choices meaningful with clear benefits/tradeoffs
- Default to maximum privacy with progressive consent
- Document all privacy decisions for transparency
- Create patterns for educational data stewardship

## Next Steps
After completing this prompt:
1. Run `/reflect` to document data agency patterns and privacy innovations
2. Commit with message: "feat: Implement student profiling MCP with comprehensive data agency and privacy analytics"
3. Create PR with privacy compliance and value exchange documentation
4. Next prompt: `phase-2-week-9-educator-alerts-mcp-enhanced.md`

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