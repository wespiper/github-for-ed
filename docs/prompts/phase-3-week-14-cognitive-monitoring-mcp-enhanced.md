# Phase 3 - Week 14: Privacy-Enhanced Cognitive Monitoring MCP Server (Fastify)

## Objective
Implement a privacy-first, high-performance MCP server using Fastify for real-time cognitive monitoring that respects student privacy while providing educational value. Process 100+ behavioral events per second with <50ms response times while maintaining comprehensive privacy protections.

## Context
- **Current Phase**: Phase 3 - Infrastructure & Performance (Unified MCP + HTTP Microservices Migration)
- **Week**: Week 14 of 20
- **Branch**: `feat/mcp-microservices-migration`
- **Privacy Focus**: Implement comprehensive privacy protections throughout the cognitive monitoring pipeline
- **Dependencies**: Phase 2 NestJS patterns established, message queue infrastructure operational, Redis caching layer ready, privacy framework established, Unified Migration Plan (Phases 1-2 complete)
- **Unified Approach**: High-performance Fastify service with dual interface architecture (MCP protocol + HTTP REST APIs)

## Scope
### In Scope
- Create privacy-first, high-performance Fastify MCP server
- Extract CognitiveLoadService with built-in privacy protections
- Implement privacy-preserving WebSocket connections for behavioral data
- Build anonymized cognitive load detection algorithms
- Real-time consent validation and privacy preference enforcement
- Privacy-respecting intervention triggers
- Strict data minimization for sensitive behavioral patterns

### Out of Scope
- Machine learning model training on personal data
- Long-term behavioral data storage
- Cross-student behavioral comparisons
- Personally identifiable pattern storage
- Behavioral data sharing without explicit consent

## Technical Requirements
1. **Framework**: Fastify 4.x with privacy-by-design architecture
2. **Performance**: <50ms cognitive assessment with privacy filters, <10ms event processing
3. **Privacy**: Real-time consent validation, anonymized pattern detection, data minimization
4. **Memory**: <256MB per instance with privacy overhead
5. **Compliance**: FERPA, COPPA, and GDPR-compatible design

## Implementation Steps

### Step 1: Privacy-First Fastify Setup
- [ ] Create `mcp-servers/cognitive-monitoring/` directory structure
- [ ] Initialize Fastify project with privacy middleware
- [ ] Install dependencies: `fastify`, `@fastify/websocket`, `@fastify/compress`, `@fastify/secure-session`
- [ ] Configure Fastify with privacy-first defaults
- [ ] Set up Docker container with privacy isolation
- [ ] Implement privacy audit logging

### Step 2: Privacy-Enhanced MCP Protocol
- [ ] Create `src/mcp/privacy-aware-mcp-server.ts`
- [ ] Implement privacy-filtered MCP tools with consent validation
- [ ] Set up tool registry: `detect_cognitive_overload_anonymous`, `analyze_behavioral_patterns_private`, `trigger_privacy_safe_interventions`, `monitor_anonymized_metrics`
- [ ] Add privacy metadata to all tool responses
- [ ] Implement educational purpose validation for each tool

### Step 3: Secure WebSocket Infrastructure
- [ ] Set up `src/websocket/secure-websocket-handler.ts`
- [ ] Implement authenticated WebSocket connections with consent verification
- [ ] Create privacy-preserving message formats (no PII in transit)
- [ ] Add ephemeral session management (no long-term tracking)
- [ ] Implement automatic data expiration policies
- [ ] Build consent revocation handling

### Step 4: Privacy-Preserving Event Processing
- [ ] Create `src/processing/private-cognitive-event-processor.ts`
- [ ] Implement ephemeral circular buffer with automatic cleanup
- [ ] Build anonymization pipeline for behavioral events
- [ ] Add differential privacy noise for pattern detection
- [ ] Create aggregated metrics without individual tracking
- [ ] Implement k-anonymity for behavioral patterns (k≥5)

### Step 5: Anonymized Cognitive Load Detection
- [ ] Create `src/algorithms/private-cognitive-load-detector.ts`
- [ ] Implement privacy-preserving cognitive load indicators
- [ ] Add temporal aggregation to prevent individual tracking
- [ ] Build confidence scoring without storing raw behaviors
- [ ] Use statistical methods that don't require individual data
- [ ] Implement privacy-safe thresholds and alerts

### Step 6: Private Behavioral Pattern Analysis
- [ ] Create `src/algorithms/anonymized-pattern-analyzer.ts`
- [ ] Implement pattern detection on anonymized data streams
- [ ] Add noise injection for differential privacy
- [ ] Build pattern categories without individual attribution
- [ ] Create privacy-safe struggle indicators
- [ ] Implement group-level insights only

### Step 7: Privacy-Respecting Intervention Engine
- [ ] Create `src/interventions/private-intervention-engine.ts`
- [ ] Implement intervention decisions without storing triggers
- [ ] Add consent-aware intervention delivery
- [ ] Create educator notifications with privacy filters
- [ ] Build intervention effectiveness tracking without individual data
- [ ] Implement opt-out mechanisms for all interventions

### Step 8: Ephemeral Data Management
- [ ] Create `src/data/ephemeral-buffer.ts` with auto-expiration
- [ ] Implement memory-only storage (no disk persistence)
- [ ] Add automatic data purging after processing
- [ ] Create privacy-safe data compaction
- [ ] Build session isolation to prevent cross-contamination
- [ ] Implement secure memory clearing

### Step 9: Real-Time Consent Management
- [ ] Create `src/privacy/consent-manager.ts`
- [ ] Implement real-time consent validation for all operations
- [ ] Add granular privacy preference enforcement
- [ ] Create consent change propagation system
- [ ] Build parent/guardian consent verification
- [ ] Implement consent audit trail

### Step 10: Privacy Monitoring & Compliance
- [ ] Create `src/privacy/privacy-monitor.ts`
- [ ] Add real-time privacy violation detection
- [ ] Implement data minimization enforcement
- [ ] Create privacy metrics without exposing data
- [ ] Build compliance reporting tools
- [ ] Add automated privacy impact assessments

### Step 11: Behavioral Data Anonymization
- [ ] Create `src/privacy/behavioral-anonymizer.ts`
- [ ] Implement real-time PII removal from behavioral streams
- [ ] Add pattern generalization to prevent re-identification
- [ ] Create statistical noise injection
- [ ] Build temporal aggregation for privacy
- [ ] Implement k-anonymity verification

### Step 12: Privacy-Safe Analytics
- [ ] Create `src/analytics/private-analytics.ts`
- [ ] Implement aggregate-only analytics
- [ ] Add privacy-preserving statistical methods
- [ ] Create classroom-level insights without individual data
- [ ] Build trend analysis on anonymized patterns
- [ ] Implement privacy-safe reporting

## Code Locations
- **MCP Server**: `mcp-servers/cognitive-monitoring/`
- **Privacy Core**: `mcp-servers/cognitive-monitoring/src/privacy/`
- **Secure WebSocket**: `mcp-servers/cognitive-monitoring/src/websocket/`
- **Private Algorithms**: `mcp-servers/cognitive-monitoring/src/algorithms/`
- **Consent Management**: `mcp-servers/cognitive-monitoring/src/privacy/consent/`
- **Anonymization**: `mcp-servers/cognitive-monitoring/src/privacy/anonymization/`

## Testing Steps
- [ ] Run privacy-focused test suite: `cd mcp-servers/cognitive-monitoring && npm test:privacy`
- [ ] Privacy protection testing:
  - [ ] Test real-time consent validation performance
  - [ ] Verify no PII leakage in any data stream
  - [ ] Test anonymization effectiveness (k-anonymity ≥5)
  - [ ] Verify differential privacy noise levels
  - [ ] Test data minimization enforcement
  - [ ] Validate ephemeral data cleanup
- [ ] Consent management testing:
  - [ ] Test consent validation for all operations
  - [ ] Test consent revocation propagation
  - [ ] Test granular privacy preference enforcement
  - [ ] Test parent/guardian consent flows
  - [ ] Verify consent audit trail accuracy
- [ ] Anonymization testing:
  - [ ] Test behavioral data anonymization pipeline
  - [ ] Verify pattern generalization effectiveness
  - [ ] Test re-identification resistance
  - [ ] Validate statistical noise injection
  - [ ] Test temporal aggregation privacy
- [ ] Performance with privacy overhead:
  - [ ] Benchmark with privacy filters: `npm run benchmark:privacy`
  - [ ] Verify <50ms response with anonymization
  - [ ] Test throughput with consent validation
  - [ ] Measure privacy processing overhead
  - [ ] Validate memory usage with privacy features
- [ ] Compliance testing:
  - [ ] FERPA compliance validation
  - [ ] COPPA age-appropriate handling
  - [ ] GDPR data subject rights testing
  - [ ] Test right to erasure implementation
  - [ ] Validate data portability features
- [ ] Privacy breach prevention:
  - [ ] Test cross-student data isolation
  - [ ] Verify no behavioral fingerprinting possible
  - [ ] Test privacy violation detection
  - [ ] Validate automatic privacy safeguards
  - [ ] Test privacy-safe error handling

## Success Criteria
- [ ] Zero PII exposure in any data stream
- [ ] 100% consent validation before processing
- [ ] K-anonymity ≥5 for all behavioral patterns
- [ ] <50ms response time with full privacy protections
- [ ] Zero long-term behavioral data retention
- [ ] 100% compliance with FERPA/COPPA/GDPR
- [ ] Automatic data expiration working correctly
- [ ] Privacy audit trail complete and accurate

## Privacy Design Principles
1. **Data Minimization**: Collect only what's educationally necessary
2. **Purpose Limitation**: Use data only for declared educational purposes
3. **Consent-First**: No processing without explicit, granular consent
4. **Anonymization by Default**: All patterns anonymized before analysis
5. **Ephemeral Processing**: No long-term behavioral storage
6. **Transparent Operations**: Students can see what's being monitored
7. **User Control**: Easy opt-out and data deletion mechanisms
8. **Privacy by Design**: Privacy built into every component

## Reference Documents
- [Privacy Integration Strategy](./PRIVACY_INTEGRATION_STRATEGY.md)
- [Migration Plan - Phase 3 Performance](../roadmaps/AI_MCP_MIGRATION_SUMMARY.md#phase-3-infrastructure-weeks-13-16)
- [Privacy Framework](../guides/PRIVACY_FRAMEWORK.md)
- [Educational Privacy Laws](../compliance/EDUCATIONAL_PRIVACY_LAWS.md)

## Notes
- Privacy must be maintained even under high load conditions
- No performance optimization should compromise privacy protections
- Document all privacy decisions and trade-offs
- Regular privacy audits should be automated
- Consider privacy implications of future features

## Next Steps
After completing this prompt:
1. Run `/reflect` to document privacy patterns and protection strategies
2. Commit with message: "feat: Implement privacy-enhanced cognitive monitoring MCP server"
3. Create privacy protection documentation
4. Run privacy compliance audit
5. Next prompt: `phase-3-week-15-performance-optimization.md`

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