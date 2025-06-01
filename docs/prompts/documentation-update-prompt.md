# Documentation Update & Maintenance Prompt

## Objective
Systematically update all project documentation to reflect current architecture state, implementation progress, and lessons learned throughout the MCP migration phases.

## Context
- **Current Phase**: [e.g., Phase 2 - Extract Services, Phase 3 - Infrastructure]
- **Week**: [e.g., Week 10 of 20]
- **Documentation Trigger**: [e.g., Phase completion, major milestone, architecture change]
- **Branch**: `feat/mcp-microservices-migration`
- **Last Documentation Update**: [Date of previous comprehensive update]

## Scope
### In Scope
- Update all architecture documentation with current implementation state
- Refresh API documentation for migrated services
- Update deployment and operational guides
- Synchronize planning documents with actual progress
- Create/update troubleshooting guides based on issues encountered
- Update team onboarding documentation with new patterns

### Out of Scope
- Creating entirely new documentation categories
- Rewriting documentation from scratch (focus on updates)
- Detailed code documentation (should be in code comments)
- External documentation or public-facing docs

## Technical Requirements
1. **Accuracy**: All documentation must reflect current implementation
2. **Completeness**: Cover all implemented features and patterns
3. **Usability**: Clear instructions for team members and future developers
4. **Maintenance**: Include "last updated" dates and update procedures

## Implementation Steps

### Step 1: Architecture Documentation Update
- [ ] Update `docs/architecture/SYSTEM_OVERVIEW.md` with current service topology
- [ ] Refresh `docs/architecture/MCP_SERVICES_ARCHITECTURE.md` with implemented services
- [ ] Update `docs/architecture/DATA_FLOW.md` with event-driven patterns
- [ ] Revise `docs/architecture/PRIVACY_ARCHITECTURE.md` with implemented privacy patterns
- [ ] Update service dependency diagrams in `docs/architecture/diagrams/`

### Step 2: Migration Progress Documentation
- [ ] Update `roadmaps/AI_MCP_MIGRATION_SUMMARY.md` with actual progress vs. planned
- [ ] Refresh `roadmaps/AI_MCP_TECHNICAL_ADDENDUM.md` with implementation learnings
- [ ] Update phase completion status and timeline adjustments
- [ ] Document any scope changes or architectural decisions made
- [ ] Add lessons learned section for each completed phase

### Step 3: Service Documentation Updates
- [ ] Update `docs/services/WRITING_ANALYSIS_SERVICE.md` (if implemented)
- [ ] Update `docs/services/COGNITIVE_MONITORING_SERVICE.md` (if implemented)
- [ ] Create/update individual MCP server documentation in `mcp-servers/*/README.md`
- [ ] Update service interaction diagrams
- [ ] Document service-specific configuration and deployment

### Step 4: API Documentation Refresh
- [ ] Update `docs/api/MAIN_API.md` with Fastify migration changes
- [ ] Create/update `docs/api/MCP_TOOLS.md` with all implemented MCP tools
- [ ] Update OpenAPI/Swagger specifications for migrated endpoints
- [ ] Document authentication and authorization changes
- [ ] Update rate limiting and performance characteristics

### Step 5: Development Guide Updates
- [ ] Update `docs/development/SETUP_GUIDE.md` with new dependencies and setup steps
- [ ] Refresh `docs/development/CODING_STANDARDS.md` with framework-specific patterns
- [ ] Update `docs/development/TESTING_GUIDE.md` with new testing patterns
- [ ] Create/update `docs/development/MCP_DEVELOPMENT_GUIDE.md`
- [ ] Update debugging and troubleshooting procedures

### Step 6: Deployment Documentation
- [ ] Update `docs/deployment/LOCAL_DEVELOPMENT.md` with new services
- [ ] Refresh `docs/deployment/DOCKER_SETUP.md` with MCP server containers
- [ ] Update `docs/deployment/PRODUCTION_DEPLOYMENT.md` with microservices considerations
- [ ] Document monitoring and observability setup
- [ ] Update backup and recovery procedures

### Step 7: Operational Documentation
- [ ] Update `docs/operations/MONITORING.md` with new metrics and dashboards
- [ ] Refresh `docs/operations/TROUBLESHOOTING.md` with encountered issues and solutions
- [ ] Update `docs/operations/PERFORMANCE_TUNING.md` with optimization findings
- [ ] Create/update runbooks for new services
- [ ] Document incident response procedures for distributed architecture

### Step 8: Team Knowledge Documentation
- [ ] Update `docs/team/ONBOARDING.md` with new architecture concepts
- [ ] Create/update `docs/team/ARCHITECTURE_DECISIONS.md` with ADRs from migration
- [ ] Update `docs/team/CODE_REVIEW_CHECKLIST.md` with new patterns
- [ ] Document team processes and workflows learned during migration
- [ ] Update knowledge transfer materials

### Step 9: Educational Platform Documentation
- [ ] Update `docs/education/PRIVACY_COMPLIANCE.md` with implemented protections
- [ ] Refresh `docs/education/AI_BOUNDARIES.md` with current implementation
- [ ] Update `docs/education/EDUCATIONAL_PURPOSE_VALIDATION.md`
- [ ] Document student data handling procedures
- [ ] Update educator-facing documentation for new features

### Step 10: Reference Documentation Sync
- [ ] Update `README.md` with current project state and setup instructions
- [ ] Refresh `CONTRIBUTING.md` with new development patterns
- [ ] Update `CHANGELOG.md` with migration milestones and breaking changes
- [ ] Sync `package.json` descriptions and metadata
- [ ] Update license and attribution documentation

## Documentation Standards

### Format Requirements
```markdown
# Document Title

**Last Updated**: [Date]
**Phase**: [Current implementation phase]
**Status**: [Current status - Planned/In Progress/Implemented/Deprecated]

## Overview
[Brief description of what this document covers]

## Current Implementation
[What exists now]

## Planned Changes
[What's coming next]

## Related Documents
- [Links to related documentation]
```

### Content Standards
- **Accuracy**: All examples must work with current codebase
- **Completeness**: Cover all major use cases and scenarios
- **Clarity**: Use clear language and provide examples
- **Maintenance**: Include update procedures and ownership

### Code Example Standards
```typescript
// All code examples must:
// 1. Be tested and working
// 2. Include proper TypeScript types
// 3. Follow current architectural patterns
// 4. Include educational context where relevant

// Example: MCP Tool Implementation
export async function analyzeWritingPatterns(
  input: AnalyzeWritingPatternsInput
): Promise<WritingAnalysisResult> {
  // Educational purpose validation
  await validateEducationalPurpose(input);
  
  // Implementation details...
}
```

## Code Locations
- **Main Documentation**: `docs/` directory
- **Service Documentation**: `mcp-servers/*/README.md`
- **API Documentation**: `docs/api/`
- **Migration Documentation**: `roadmaps/`
- **Team Documentation**: `docs/team/`
- **Architecture Diagrams**: `docs/architecture/diagrams/`

## Success Criteria
- [ ] All documentation reflects current implementation state
- [ ] New team members can onboard using updated documentation
- [ ] Troubleshooting guides include solutions to encountered issues
- [ ] API documentation matches current endpoints and schemas
- [ ] Architecture diagrams accurately represent system topology
- [ ] Migration progress tracking is current and accurate
- [ ] All "last updated" dates are current
- [ ] External links are validated and working

## Verification Checklist

### Documentation Accuracy
- [ ] All code examples compile and run successfully
- [ ] All service endpoints documented actually exist
- [ ] All configuration examples work with current setup
- [ ] All architectural diagrams match implemented systems

### Completeness Review
- [ ] Every implemented service has documentation
- [ ] All MCP tools are documented with examples
- [ ] All configuration options are documented
- [ ] All troubleshooting scenarios have solutions

### Usability Testing
- [ ] New developer can set up environment using docs
- [ ] Common tasks can be completed following documentation
- [ ] Troubleshooting guides resolve actual issues
- [ ] API documentation enables successful integration

## Reference Documents
- [Migration Plan](../roadmaps/AI_MCP_MIGRATION_SUMMARY.md) - For current phase status
- [Technical Addendum](../roadmaps/AI_MCP_TECHNICAL_ADDENDUM.md) - For implementation details
- [Architecture Decisions](../docs/team/ARCHITECTURE_DECISIONS.md) - For decision rationale
- [Documentation Style Guide](../docs/team/DOCUMENTATION_STANDARDS.md) - For formatting standards

## Documentation Maintenance Strategy

### Regular Update Schedule
- **Weekly**: Update migration progress and current implementation status
- **Phase Completion**: Comprehensive documentation review and update
- **Major Milestone**: Architecture and API documentation refresh
- **Issue Resolution**: Update troubleshooting guides with new solutions

### Update Triggers
- **Architecture Changes**: Update system diagrams and service documentation
- **API Changes**: Update API documentation and examples
- **Configuration Changes**: Update setup and deployment guides
- **Process Changes**: Update team and development documentation

### Quality Assurance
- **Peer Review**: All documentation updates reviewed by team member
- **Testing**: Code examples tested before documentation update
- **User Validation**: Periodic validation with actual usage scenarios
- **Link Checking**: Regular validation of internal and external links

## Post-Update Actions
- [ ] Notify team of documentation updates via Slack/email
- [ ] Update team knowledge base index with new/changed documents
- [ ] Schedule documentation review in next team meeting
- [ ] Create documentation update summary for stakeholders
- [ ] Plan next documentation update cycle

## Notes
- Focus on updating rather than rewriting - preserve institutional knowledge
- Include migration-specific learnings that benefit future development
- Maintain educational platform context throughout all documentation
- Ensure compliance and privacy considerations are well-documented
- Balance detail with readability for different audience levels

## Next Steps
After completing documentation update:
1. Run comprehensive documentation review with team
2. Commit with message: "docs: Update documentation for [phase/milestone]"
3. Create documentation update summary for project stakeholders
4. Schedule next documentation update based on development progress
5. Return to development with current prompt: `[current-development-prompt].md`

---

**Use this prompt regularly throughout the MCP migration to maintain accurate, useful documentation that supports team productivity and knowledge transfer. Quality documentation is essential for the long-term success of our educational platform architecture.**