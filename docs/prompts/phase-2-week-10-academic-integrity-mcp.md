# Phase 2 - Week 10: Academic Integrity MCP Server (NestJS)

## Objective
Extract academic integrity monitoring and AI detection systems into a specialized NestJS MCP server that handles AI usage detection, plagiarism analysis, and academic integrity compliance while supporting educational AI use.

## Context
- **Current Phase**: Phase 2 - Extract Services (Unified MCP + HTTP Microservices Migration)
- **Week**: Week 10 of 20
- **Branch**: `feat/mcp-microservices-migration`
- **Dependencies**: 
  - **Phase 1 Foundation**: Privacy-aware repository pattern, event-driven architecture, monitoring system (completed)
  - **Week 7**: Writing Analysis MCP Server with repository integration (completed 2025-06-02)
  - **Week 8**: Student Profiling MCP Server with triple-tier fallback architecture (completed 2025-06-03)
  - **Week 9**: Educator Alerts MCP Server with intervention management (expected completion)
- **Architecture Foundation**: Built on privacy-aware repository pattern from Phase 1 Week 2
- **Unified Approach**: Triple-tier architecture (MCP protocol + HTTP REST APIs + Repository fallback)

## Scope
### In Scope
- Create NestJS MCP server for academic integrity monitoring with **TRIPLE-TIER ARCHITECTURE**
- Extract AI detection and academic integrity validation logic following established patterns
- Implement 4 tools with triple-tier fallback architecture:
  - **MCP Tools**: For Claude Code integration and AI development (primary)
  - **HTTP REST APIs**: For Fastify gateway and internal service communication (secondary)
  - **Repository Pattern**: Privacy-aware database fallback following Phase 1 Week 2 architecture (tertiary)
  - Tools: detect_ai_assistance_levels, analyze_academic_integrity, validate_educational_ai_use, generate_integrity_reports
- Set up sophisticated AI usage pattern analysis with privacy controls
- **Repository Integration**: Create AcademicIntegrityRepository extending PrivacyAwareRepository
- **Integration**: Leverage existing repositories and MCP clients from Weeks 7-9
- Integrate with ServiceFactory dependency injection container

### Out of Scope
- Traditional plagiarism detection (focus on AI-specific integrity)
- Punitive enforcement mechanisms (focus on educational guidance)
- Advanced machine learning model training for detection
- Integration with external plagiarism detection services

## Architectural Foundation Reference

### Completed Work to Build Upon
Before implementing this week's tasks, review the following completed implementations:

1. **Phase 1 Week 2 - Repository Pattern** (`docs/prompts/review/phase-1-week-2-repository-pattern-enhanced-completed-2025-01-06.md`):
   - Privacy-aware repository interfaces with PrivacyContext
   - Audit trail integration for all data operations
   - Mock-first development patterns
   - ServiceFactory dependency injection container

2. **Phase 2 Week 7 - Writing Analysis MCP** (`docs/prompts/review/phase-2-week-7-writing-analysis-mcp-enhanced-completed-2025-06-02.md`):
   - NestJS MCP server architecture patterns
   - Repository integration with MCP servers
   - Privacy-enhanced content analysis
   - Educational purpose validation

3. **Phase 2 Week 8 - Student Profiling MCP** (`docs/prompts/review/phase-2-week-8-student-profiling-mcp-enhanced-completed-2025-06-03.md`):
   - Triple-tier fallback architecture (MCP → HTTP → Repository)
   - Student data agency and privacy controls
   - Comprehensive repository interface implementation
   - ServiceFactory integration patterns

4. **Phase 2 Week 9 - Educator Alerts MCP** (review when completed):
   - Intervention management with repository integration
   - Real-time notification system with privacy controls
   - Educator workflow patterns

### Required Architecture Patterns
- **Repository Interface**: Create `AcademicIntegrityRepository` extending `PrivacyAwareRepository<T, CreateDTO, UpdateDTO>`
- **Privacy Context**: All operations must include `PrivacyContext` parameter with educational justification
- **ServiceFactory Integration**: Add repository to container and create getter method
- **Mock Implementation**: Create comprehensive mock repository for testing
- **Audit Trails**: Log all integrity analysis and AI detection operations
- **Triple-Tier Service**: Implement fallback from MCP → HTTP → Repository

## Technical Requirements
1. **Framework**: NestJS 10.x with advanced pattern analysis capabilities
2. **Repository Pattern**: Extend established privacy-aware repository architecture
3. **MCP Protocol**: Complete tool registration with integrity-focused functionality
4. **Performance**: <200ms response time for integrity analysis including repository fallback
5. **Educational Focus**: Support legitimate educational AI use while detecting misuse
6. **Integration**: Seamless communication with other MCP servers and repository layer
7. **Privacy Compliance**: Follow FERPA/COPPA patterns with academic integrity context

## Implementation Steps

### Step 1: Repository Pattern Integration (REQUIRED FIRST)
- [ ] **Review completed architecture**: Study Phase 1 Week 2 and Phase 2 Week 7-9 patterns
- [ ] Create `backend/src/repositories/interfaces/AcademicIntegrityRepository.ts`
- [ ] Extend `PrivacyAwareRepository` with integrity-specific methods:
  - `detectAIAssistanceLevels()` with PrivacyContext and educational justification
  - `analyzeAcademicIntegrity()` with audit trail
  - `validateEducationalAIUse()` with privacy controls
  - `generateIntegrityReports()` with access controls
- [ ] Create `backend/src/repositories/__mocks__/AcademicIntegrityRepository.mock.ts`
- [ ] Create `backend/src/repositories/prisma/PrismaAcademicIntegrityRepository.ts`
- [ ] Update `backend/src/repositories/interfaces.ts` to include AcademicIntegrityRepository
- [ ] Update `backend/src/container/ServiceFactory.ts` to include repository and getter
- [ ] Create `backend/src/services/AcademicIntegrityService.ts` with triple-tier fallback
- [ ] Create Express routes in `backend/src/routes/academicIntegrity.ts`
- [ ] Update `backend/src/server.ts` to register routes

### Step 2: NestJS MCP Server Setup
- [ ] Create `mcp-servers/academic-integrity/` directory structure
- [ ] Initialize NestJS project: `nest new academic-integrity-mcp-server`
- [ ] Install dependencies: `npm install @anthropic/mcp-sdk natural compromise`
- [ ] Configure TypeScript and project structure following Week 7-8 patterns
- [ ] Set up Docker container with text analysis optimization

### Step 3: MCP Protocol Integration
- [ ] Create `src/mcp/mcp-server.module.ts` for MCP integration
- [ ] Implement `src/mcp/mcp-tools.controller.ts` for tool registration
- [ ] Define MCP tool schemas in `src/mcp/schemas/integrity-schemas.ts`
- [ ] Create `src/mcp/mcp-tools.service.ts` for tool orchestration
- [ ] Set up educational purpose validation for integrity tools

### Step 3: Core Domain Modules
- [ ] Create `src/ai-detection/ai-detection.module.ts`
- [ ] Create `src/integrity-analysis/integrity-analysis.module.ts`
- [ ] Create `src/educational-validation/educational-validation.module.ts`
- [ ] Create `src/reporting/reporting.module.ts`
- [ ] Implement domain services with academic integrity modeling

### Step 4: AI Assistance Detection Tool
- [ ] Create `src/ai-detection/services/ai-assistance-detector.service.ts`
- [ ] Implement `detect_ai_assistance_levels` MCP tool
- [ ] Add writing pattern analysis for AI-generated content
- [ ] Build confidence scoring for AI detection
- [ ] Create differential analysis between AI assistance and generation

### Step 5: Academic Integrity Analysis Tool
- [ ] Create `src/integrity-analysis/services/integrity-analyzer.service.ts`
- [ ] Implement `analyze_academic_integrity` MCP tool
- [ ] Add comprehensive integrity risk assessment
- [ ] Build historical writing pattern comparison
- [ ] Create academic honesty evaluation framework

### Step 6: Educational AI Validation Tool
- [ ] Create `src/educational-validation/services/educational-ai-validator.service.ts`
- [ ] Implement `validate_educational_ai_use` MCP tool
- [ ] Add legitimate educational AI use detection
- [ ] Build AI assistance vs. replacement differentiation
- [ ] Create educational value assessment for AI interactions

### Step 7: Integrity Reporting Tool
- [ ] Create `src/reporting/services/integrity-reporter.service.ts`
- [ ] Implement `generate_integrity_reports` MCP tool
- [ ] Add comprehensive integrity assessment reports
- [ ] Build educator-friendly reporting formats
- [ ] Create trend analysis for AI usage patterns

### Step 8: Advanced Pattern Analysis
- [ ] Create `src/analysis/pattern-analyzer.service.ts`
- [ ] Implement sophisticated text analysis algorithms
- [ ] Add writing style consistency analysis
- [ ] Build temporal pattern detection for writing behavior
- [ ] Create anomaly detection for unusual writing patterns

### Step 9: Educational AI Boundaries Integration
- [ ] Create `src/boundaries/educational-boundaries.service.ts`
- [ ] Integrate with existing educational AI boundary framework
- [ ] Add dynamic boundary adjustment based on integrity analysis
- [ ] Build educational coaching for appropriate AI use
- [ ] Create progressive guidance system for AI literacy

### Step 10: Privacy-Compliant Monitoring
- [ ] Set up privacy-preserving integrity analysis
- [ ] Create anonymized pattern analysis for research
- [ ] Add student consent management for integrity monitoring
- [ ] Build educator transparency reporting
- [ ] Implement audit trail for integrity decisions

## Code Locations
- **MCP Server**: `mcp-servers/academic-integrity/`
- **Main Module**: `mcp-servers/academic-integrity/src/app.module.ts`
- **MCP Integration**: `mcp-servers/academic-integrity/src/mcp/`
- **Domain Services**: `mcp-servers/academic-integrity/src/ai-detection/`, `mcp-servers/academic-integrity/src/integrity-analysis/`
- **Pattern Analysis**: `mcp-servers/academic-integrity/src/analysis/`
- **Educational Boundaries**: `mcp-servers/academic-integrity/src/boundaries/`

## Testing Steps
- [ ] Run NestJS test suite: `cd mcp-servers/academic-integrity && npm test`
- [ ] Test MCP tool functionality:
  - [ ] Test `detect_ai_assistance_levels` with various AI-assisted content
  - [ ] Test `analyze_academic_integrity` with known integrity scenarios
  - [ ] Test `validate_educational_ai_use` with legitimate educational AI usage
  - [ ] Test `generate_integrity_reports` with comprehensive data sets
- [ ] Test AI detection accuracy:
  - [ ] Validate AI detection algorithms against known AI-generated content
  - [ ] Test false positive rates with human-written content
  - [ ] Verify detection of different AI assistance levels
  - [ ] Test robustness against AI detection evasion attempts
- [ ] Performance testing:
  - [ ] Measure response times for each tool: `npm run benchmark`
  - [ ] Verify <200ms response time for integrity analysis
  - [ ] Test batch analysis performance for classroom-scale usage
  - [ ] Load test with concurrent integrity checks
- [ ] Educational validation testing:
  - [ ] Test legitimate educational AI use cases aren't flagged inappropriately
  - [ ] Verify educational guidance provides constructive feedback
  - [ ] Test progressive AI literacy coaching
  - [ ] Validate educator reporting usefulness and accuracy
- [ ] Integration testing:
  - [ ] Test integration with Writing Analysis MCP server
  - [ ] Test communication with Student Profiling MCP server
  - [ ] Test event publishing for integrity alerts
  - [ ] Verify seamless workflow with Educator Alerts MCP server
- [ ] Privacy compliance testing:
  - [ ] Test anonymized pattern analysis preserves privacy
  - [ ] Verify student consent enforcement
  - [ ] Test audit trail creation and access controls
  - [ ] Validate FERPA compliance for integrity monitoring

## Success Criteria
- [ ] All 4 MCP tools implemented and academically validated
- [ ] AI detection algorithms achieve >90% accuracy with <5% false positives
- [ ] Educational AI use validation supports legitimate learning
- [ ] Integration with other MCP servers working seamlessly
- [ ] Performance targets met: <200ms integrity analysis
- [ ] Comprehensive test suite with >95% coverage
- [ ] Educator reporting provides actionable insights
- [ ] Student privacy preserved throughout integrity monitoring

## Reference Documents
- [Migration Plan - Phase 2 Service Extraction](../roadmaps/AI_MCP_MIGRATION_SUMMARY.md#phase-2-extract-services-weeks-7-12)
- [Academic Integrity Framework](../docs/education/ACADEMIC_INTEGRITY_FRAMEWORK.md)
- [AI Detection Research](../docs/research/AI_DETECTION_METHODS.md)
- [Educational AI Boundaries](../docs/education/AI_BOUNDARIES.md)

## Notes
- Focus on supporting educational AI use while detecting misuse
- Ensure integrity monitoring doesn't inhibit legitimate learning
- Build educational guidance rather than punitive enforcement
- Maintain strong privacy protections for student writing analysis
- Document AI detection methods for transparency and improvement

## Next Steps
After completing this prompt:
1. Run `/reflect` to document academic integrity systems and AI detection patterns
2. Commit with message: "feat: Implement academic integrity MCP server with educational AI validation"
3. Create comprehensive PR with academic integrity framework documentation
4. Next prompt: `phase-2-week-11-remaining-services.md`

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