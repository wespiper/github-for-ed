# Phase 2 - Week 7: Writing Analysis MCP Server (Privacy-Enhanced)

## Objective
Create the first privacy-enhanced NestJS MCP server by extracting WritingProcessAnalyzer and ReflectionAnalysisService with integrated content classification, AI boundaries, and educational privacy controls.

## Context
- **Current Phase**: Phase 2 - Extract Services
- **Week**: Week 7 of 20
- **Branch**: `feat/mcp-microservices-migration`
- **Dependencies**: Phase 1 complete with privacy-aware repositories, event system with audit trails
- **Privacy Architecture**: Consolidating Writing Analysis + Data Classification + AI Educational Boundary

## Scope
### In Scope
- Create privacy-enhanced NestJS MCP server for writing analysis
- Extract WritingProcessAnalyzer and ReflectionAnalysisService
- Implement 8 MCP tools (4 original + 4 privacy):
  - Original: analyze_writing_patterns, evaluate_reflection_quality, track_writing_progress, generate_writing_insights
  - Privacy: classify_content_sensitivity, validate_educational_purpose, apply_ai_boundaries, audit_writing_data_access
- Set up comprehensive NestJS architecture with privacy integration
- Integrate with privacy-aware event system and audit repositories

### Out of Scope
- Separate privacy MCP servers (integrated into this service)
- Other AI services (later weeks)
- Production deployment configuration
- Advanced ML model training

## Technical Requirements
1. **Framework**: NestJS 10.x with privacy-first architecture
2. **MCP Protocol**: Complete tool registration with privacy validation
3. **Performance**: <200ms response time including privacy checks
4. **Privacy**: Content classification, purpose validation, AI boundaries, audit trails

## Implementation Steps

### Step 1: Privacy-Enhanced NestJS MCP Server Setup
- [ ] Create `mcp-servers/writing-analysis/` directory structure
- [ ] Initialize NestJS project: `nest new writing-analysis-mcp-server`
- [ ] Install dependencies: `npm install @anthropic/mcp-sdk class-validator class-transformer bcrypt`
- [ ] Configure TypeScript with strict privacy typing
- [ ] Set up Docker container with security hardening
- [ ] Create privacy configuration in `.env.privacy`

### Step 2: Privacy-Integrated MCP Protocol
- [ ] Create `src/mcp/mcp-server.module.ts` with privacy middleware
- [ ] Implement `src/mcp/mcp-tools.controller.ts` with privacy validation
- [ ] Define MCP tool schemas in `src/mcp/schemas/` including privacy metadata
- [ ] Create `src/mcp/privacy-guard.ts` for tool-level privacy enforcement
- [ ] Set up privacy-aware tool registration

### Step 3: Core Domain Modules with Privacy
- [ ] Create `src/writing-analysis/writing-analysis.module.ts`
- [ ] Create `src/reflection-analysis/reflection-analysis.module.ts`
- [ ] Create `src/content-privacy/content-privacy.module.ts` (NEW)
- [ ] Create `src/educational-validation/educational-validation.module.ts` (NEW)
- [ ] Implement privacy-aware domain services

### Step 4: Content Sensitivity Classification Tool (Privacy Tool #1)
- [ ] Create `src/content-privacy/services/content-classifier.service.ts`
- [ ] Implement `classify_content_sensitivity` MCP tool
- [ ] Add NLP-based sensitivity detection for:
  - Personal information (names, locations, identifiers)
  - Family situations and relationships
  - Mental health indicators
  - Trauma or distress signals
  - Financial information
- [ ] Integrate with privacy configuration for sensitivity thresholds
- [ ] Add caching for classification results

### Step 5: Writing Pattern Analysis Tool (Enhanced with Privacy)
- [ ] Create `src/writing-analysis/services/writing-pattern-analyzer.service.ts`
- [ ] Implement `analyze_writing_patterns` MCP tool
- [ ] Add privacy preprocessing:
  - Remove sensitive content before analysis
  - Apply data minimization principles
  - Ensure no PII in analysis results
- [ ] Integrate content classification results
- [ ] Add privacy-safe pattern storage

### Step 6: Educational Purpose Validation Tool (Privacy Tool #2)
- [ ] Create `src/educational-validation/services/purpose-validator.service.ts`
- [ ] Implement `validate_educational_purpose` MCP tool
- [ ] Add validation criteria:
  - Direct educational benefit assessment
  - Platform improvement justification
  - Research ethics compliance
  - Student benefit verification
- [ ] Create purpose taxonomy with weighted scoring
- [ ] Add approval workflow routing

### Step 7: Reflection Quality Assessment Tool (Privacy-Enhanced)
- [ ] Create `src/reflection-analysis/services/reflection-quality-assessor.service.ts`
- [ ] Implement `evaluate_reflection_quality` MCP tool
- [ ] Add privacy features:
  - Sensitive content masking in reflections
  - Consent verification for quality tracking
  - Anonymous aggregation capabilities
- [ ] Integrate with student privacy preferences
- [ ] Add differential privacy for class-level analytics

### Step 8: AI Boundary Enforcement Tool (Privacy Tool #3)
- [ ] Create `src/content-privacy/services/ai-boundary-enforcer.service.ts`
- [ ] Implement `apply_ai_boundaries` MCP tool
- [ ] Add boundary rules:
  - Content scrubbing before AI processing
  - Context limitation for AI requests
  - Answer detection and blocking
  - Educational value validation
- [ ] Create boundary configuration system
- [ ] Add real-time boundary monitoring

### Step 9: Writing Progress Tracking Tool (Privacy-Aware)
- [ ] Create `src/writing-analysis/services/writing-progress-tracker.service.ts`
- [ ] Implement `track_writing_progress` MCP tool
- [ ] Add privacy features:
  - Progress tracking with consent verification
  - Privacy-preserving aggregation
  - Anonymized cohort comparisons
  - Data retention policy enforcement
- [ ] Integrate with student data choices
- [ ] Add opt-out capabilities

### Step 10: Writing Data Access Audit Tool (Privacy Tool #4)
- [ ] Create `src/content-privacy/services/audit-logger.service.ts`
- [ ] Implement `audit_writing_data_access` MCP tool
- [ ] Add comprehensive audit features:
  - All data access logging with purpose
  - Educational context capture
  - Privacy compliance tracking
  - Student notification triggers
- [ ] Create immutable audit storage
- [ ] Add audit report generation

### Step 11: Educational Insights Generation Tool (Privacy-First)
- [ ] Create `src/insights-generation/services/insights-generator.service.ts`
- [ ] Implement `generate_writing_insights` MCP tool
- [ ] Add privacy safeguards:
  - Insights based on aggregated data only
  - Differential privacy for small cohorts
  - Educator access validation
  - Student consent verification
- [ ] Create privacy-safe insight templates
- [ ] Add value exchange tracking

### Step 12: Privacy-Enhanced Repository Integration
- [ ] Create `src/repositories/repositories.module.ts`
- [ ] Add privacy metadata to all repository operations
- [ ] Create audit trail repository with encryption
- [ ] Add student preference repository
- [ ] Implement privacy-aware caching strategies

### Step 13: Privacy Event System Integration
- [ ] Create `src/events/events.module.ts`
- [ ] Add privacy-specific events:
  - `ContentClassified`
  - `EducationalPurposeValidated`
  - `AIBoundaryApplied`
  - `WritingDataAccessed`
- [ ] Implement privacy event subscribers
- [ ] Add event-driven consent updates

### Step 14: Comprehensive Privacy Testing
- [ ] Set up Jest with privacy testing utilities
- [ ] Create privacy compliance test suite
- [ ] Add content classification accuracy tests
- [ ] Create boundary enforcement tests
- [ ] Add audit completeness verification

## Code Locations
- **MCP Server**: `mcp-servers/writing-analysis/`
- **Privacy Modules**: `mcp-servers/writing-analysis/src/content-privacy/`, `mcp-servers/writing-analysis/src/educational-validation/`
- **Privacy Configuration**: `mcp-servers/writing-analysis/src/config/privacy.config.ts`
- **Privacy Tests**: `mcp-servers/writing-analysis/test/privacy/`

## Testing Steps
- [ ] Run privacy-enhanced test suite: `cd mcp-servers/writing-analysis && npm test`
- [ ] Test privacy tools functionality:
  - [ ] Test `classify_content_sensitivity` with various content types
  - [ ] Test `validate_educational_purpose` with different use cases
  - [ ] Test `apply_ai_boundaries` with boundary violations
  - [ ] Test `audit_writing_data_access` completeness
- [ ] Test privacy integration:
  - [ ] Verify content classification happens before analysis
  - [ ] Test educational purpose blocks inappropriate access
  - [ ] Verify AI boundaries prevent answer generation
  - [ ] Test audit trail captures all access
- [ ] Privacy compliance testing:
  - [ ] Test FERPA compliance for educational records
  - [ ] Verify student consent enforcement
  - [ ] Test data minimization effectiveness
  - [ ] Validate differential privacy implementation
- [ ] Performance testing with privacy:
  - [ ] Measure overhead of privacy checks: <50ms additional
  - [ ] Test concurrent privacy validations
  - [ ] Verify caching reduces privacy check latency
  - [ ] Load test with privacy features active
- [ ] End-to-end privacy workflow:
  - [ ] Student submits writing with sensitive content
  - [ ] System classifies and protects sensitive elements
  - [ ] Analysis proceeds with privacy safeguards
  - [ ] Audit trail captures complete workflow
  - [ ] Student can review privacy report

## Success Criteria
- [ ] All 8 MCP tools implemented (4 original + 4 privacy)
- [ ] Privacy checks add <50ms to response times
- [ ] Content classification accuracy >95%
- [ ] Educational purpose validation working correctly
- [ ] AI boundaries preventing inappropriate assistance
- [ ] Complete audit trail for all data access
- [ ] Student privacy preferences respected
- [ ] Comprehensive test coverage >95%

## Reference Documents
- [Consolidated Privacy Architecture](../docs/consolidated-privacy-mcp-architecture.md)
- [Educational Privacy Framework](../docs/scribe-tree-privacy-mcp-architecture.md)
- [Migration Plan - Phase 2](../roadmaps/AI_MCP_MIGRATION_SUMMARY.md#phase-2-extract-services-weeks-7-12)
- [NestJS Privacy Patterns](../docs/privacy/NESTJS_PRIVACY_PATTERNS.md)

## Notes
- Privacy is integrated, not bolted on - every operation considers privacy
- Focus on educational value exchange - students benefit from sharing
- Document privacy decisions for compliance audits
- Create reusable privacy patterns for other MCP servers
- Ensure privacy doesn't hinder educational effectiveness

## Next Steps
After completing this prompt:
1. Run `/reflect` to document privacy patterns and architectural decisions
2. Commit with message: "feat: Implement privacy-enhanced writing analysis MCP server with integrated content protection"
3. Create comprehensive PR with privacy compliance documentation
4. Next prompt: `phase-2-week-8-student-profiling-mcp-enhanced.md`