# Privacy-Aware Service Architecture Guide

## Overview

This guide documents the privacy-first service architecture implemented in Phase 1 Week 4, establishing foundational patterns for educational data protection throughout the Scribe Tree platform.

## Architecture Principles

### 1. Privacy by Design
- **Privacy Context First**: All service operations require explicit `PrivacyContext`
- **Data Minimization**: Only expose data necessary for the educational purpose
- **Consent Verification**: Check permissions before any sensitive data access
- **Audit by Default**: Comprehensive privacy event logging for compliance

### 2. Repository Pattern with Privacy
- **Clean Separation**: Business logic decoupled from data access
- **Privacy Filtering**: Repository methods apply privacy filters at the data layer
- **Educational Context**: Repositories understand educational purposes and FERPA requirements
- **Mock-First Development**: Privacy testing built into development workflow

### 3. Event-Driven Privacy
- **Real-time Auditing**: All data access generates privacy events
- **Educational Justification**: Every data access includes educational purpose
- **Correlation Tracking**: Full request tracing for compliance audits
- **Encrypted Events**: AES-256-CBC encryption for sensitive event data

## Core Components

### Privacy Context Interface

```typescript
interface PrivacyContext {
  /** ID of the entity making the request */
  requesterId: string;
  
  /** Type of requester for access control */
  requesterType: 'student' | 'educator' | 'system' | 'admin';
  
  /** Educational purpose for accessing the data */
  purpose: string;
  
  /** Optional educational justification for the access */
  educationalJustification?: string;
  
  /** Timestamp of the request */
  timestamp: Date;
  
  /** Optional correlation ID for tracking related operations */
  correlationId?: string;
}
```

### Privacy-Aware Repository Pattern

All repositories extend the base privacy-aware pattern:

```typescript
interface PrivacyAwareRepository<T> {
  // Standard CRUD with privacy context
  findById(id: string, privacyContext: PrivacyContext): Promise<T | null>;
  create(data: CreateData<T>, privacyContext: PrivacyContext): Promise<T>;
  
  // Privacy-specific methods
  findWithPrivacyFiltering(
    filters: any, 
    privacyContext: PrivacyContext
  ): Promise<T[]>;
}
```

## Privacy Access Control Matrix

| Requester Type | Student Data Access | Course Data Access | Analytics Access | Admin Functions |
|----------------|--------------------|--------------------|------------------|-----------------|
| **Student** | Own data only | Enrolled courses only | Own progress only | None |
| **Educator** | Course students only | Assigned courses only | Course analytics | Limited |
| **System** | All (with purpose) | All (with purpose) | All (automated) | None |
| **Admin** | All (with justification) | All | All | Full |

## Service Migration Patterns

### 1. InterventionEngine → PrivacyAwareInterventionEngine

**Key Changes:**
- **Privacy Validation**: All analysis requires valid `PrivacyContext`
- **Granular Permissions**: Students can access own interventions, educators can access course students
- **Data Minimization**: Intervention details filtered based on requester type
- **Audit Integration**: Every intervention analysis logged with educational justification

**Privacy Features:**
```typescript
// Before: Direct database access
const sessions = await prisma.writingSession.findMany({...});

// After: Privacy-aware repository access
const analytics = await this.analyticsRepo.getStudentAnalytics(
  studentId, 
  privacyContext,
  { assignmentId }
);
```

### 2. LearningAnalyticsService → PrivacyAwareLearningAnalyticsService

**Key Changes:**
- **Multi-Level Privacy**: Full/Limited/Anonymous data access based on context
- **Educational Purpose**: All analytics tied to specific educational outcomes
- **Aggregation Controls**: Sensitive data aggregated for privacy protection
- **Consent Integration**: Analytics respect student consent preferences

**Privacy Levels:**
- **Full**: Educators and admins - complete educational analytics
- **Limited**: Students viewing own data - progress without detailed behavioral analysis
- **Anonymous**: System operations - aggregate patterns only

### 3. WritingProcessService → PrivacyAwareWritingProcessService

**Key Changes:**
- **Content Filtering**: Writing content filtered based on privacy context
- **Collaboration Privacy**: Multi-user writing respects all participants' privacy
- **Version History**: Document versions filtered by access permissions
- **Session Tracking**: Writing session data anonymized for non-educational purposes

## Privacy Event System

### Event Categories

1. **Audit Events** (`privacy.data.accessed`)
   - Data access for educational purposes
   - Include educational justification
   - Track data scope and purpose

2. **Consent Events** (`privacy.consent.updated`)
   - Student privacy preference changes
   - Impact on service availability
   - Compliance requirement tracking

3. **Access Control Events** (`privacy.access.unauthorized`)
   - Failed access attempts
   - Security monitoring
   - Risk assessment

### Event Structure

```typescript
interface DataAccessAuditedEvent extends PrivacyEvent {
  type: 'privacy.data.accessed';
  category: 'audit';
  payload: {
    accessorId: string;
    dataType: 'student-writing' | 'reflection-data' | 'progress-metrics';
    purpose: 'educational-analysis' | 'instructor-review' | 'system-monitoring';
    educationalJustification: string;
    dataScope: {
      studentCount?: number;
      recordCount: number;
      timeRange?: { start: Date; end: Date; };
    };
  };
}
```

## Implementation Patterns

### 1. Service Constructor Pattern

```typescript
class PrivacyAwareService {
  constructor(
    private repository: PrivacyAwareRepository,
    private eventBus: EventBus,
    private config: ServiceConfig
  ) {}
}
```

### 2. Privacy Check Pattern

```typescript
async analyzeStudentData(studentId: string, privacyContext: PrivacyContext) {
  // 1. Verify privacy context
  if (!this.canAccessStudentData(privacyContext, studentId)) {
    await this.publishPrivacyEvent('access_denied', studentId, privacyContext);
    throw new Error('Insufficient privacy permissions');
  }

  // 2. Log data access
  await this.publishPrivacyEvent('analysis_started', studentId, privacyContext);

  try {
    // 3. Perform operation with privacy filtering
    const data = await this.repository.findWithPrivacy(studentId, privacyContext);
    
    // 4. Log completion
    await this.publishPrivacyEvent('analysis_completed', studentId, privacyContext);
    return data;
  } catch (error) {
    // 5. Log errors
    await this.publishPrivacyEvent('analysis_error', studentId, privacyContext);
    throw error;
  }
}
```

### 3. Data Minimization Pattern

```typescript
private getDetailLevel(privacyContext: PrivacyContext): 'full' | 'limited' | 'anonymous' {
  if (privacyContext.requesterType === 'admin') return 'full';
  if (privacyContext.requesterType === 'educator') return 'full';
  if (privacyContext.requesterType === 'student') return 'limited';
  return 'anonymous';
}

private filterDataByPrivacyLevel(data: any, level: string) {
  switch (level) {
    case 'full': return data;
    case 'limited': return this.removeSensitiveFields(data);
    case 'anonymous': return this.aggregateOnly(data);
    default: return null;
  }
}
```

## Testing Privacy Patterns

### Mock Repository Testing

```typescript
describe('Privacy-Aware Service', () => {
  let service: PrivacyAwareService;
  let mockRepo: MockRepository;

  beforeEach(() => {
    mockRepo = new MockRepository();
    service = new PrivacyAwareService(mockRepo, mockEventBus);
  });

  it('should log privacy operations', async () => {
    await service.analyzeData('student_1', mockPrivacyContext);
    
    const privacyLogs = mockRepo.getPrivacyLogs();
    expect(privacyLogs).toContainEqual(
      expect.objectContaining({
        operation: 'analyzeData',
        context: mockPrivacyContext
      })
    );
  });
});
```

### Privacy Event Testing

```typescript
it('should publish privacy events for all operations', async () => {
  await service.analyzeData('student_1', mockPrivacyContext);
  
  expect(mockEventBus.publish).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'privacy.data.accessed',
      category: 'audit',
      payload: expect.objectContaining({
        educationalJustification: expect.stringContaining('analysis')
      })
    })
  );
});
```

## ServiceFactory Integration

### Dependency Injection with Privacy

```typescript
export class ServiceFactory {
  async initialize(): Promise<void> {
    // Initialize privacy-aware repositories
    this.container.documentRepository = new MockDocumentRepository();
    this.container.analyticsRepository = new MockLearningAnalyticsRepository();
    this.container.interventionRepository = new MockInterventionRepository();
    
    // Initialize privacy-aware services
    this.container.interventionEngine = new PrivacyAwareInterventionEngine(
      this.container.interventionRepository,
      this.container.analyticsRepository,
      this.container.documentRepository,
      this.container.eventBus
    );
  }
}
```

## Compliance Framework

### FERPA Compliance
- **Educational Records**: All student data treated as educational records
- **Directory Information**: Public data clearly separated from private records
- **Consent Management**: Explicit consent for non-directory information
- **Audit Requirements**: Complete access logs for compliance review

### Privacy by Design Principles
1. **Proactive**: Privacy built into system design
2. **Default Setting**: Privacy as the default option
3. **Full Functionality**: Privacy without reducing educational value
4. **End-to-End Security**: Privacy throughout the data lifecycle
5. **Visibility**: Transparent privacy practices
6. **Respect for Privacy**: Student-centered privacy controls

## Migration Checklist

When migrating existing services to privacy-aware patterns:

- [ ] **Privacy Context Integration**
  - [ ] Add `PrivacyContext` parameter to all public methods
  - [ ] Implement privacy validation logic
  - [ ] Add permission checking for different requester types

- [ ] **Repository Pattern Adoption**
  - [ ] Replace direct database calls with repository methods
  - [ ] Create repository interface with privacy methods
  - [ ] Implement mock repository for testing

- [ ] **Event Integration**
  - [ ] Add privacy event publishing to all data access
  - [ ] Include educational justification in events
  - [ ] Implement error handling with privacy logging

- [ ] **Testing Implementation**
  - [ ] Create comprehensive privacy test suite
  - [ ] Test all access control scenarios
  - [ ] Validate privacy event publishing

- [ ] **Documentation Updates**
  - [ ] Document privacy controls and access patterns
  - [ ] Update API documentation with privacy requirements
  - [ ] Create compliance audit documentation

## Next Steps

This privacy-aware architecture provides the foundation for:

1. **Phase 4 Full Compliance**: Complete GDPR/FERPA implementation
2. **MCP Service Migration**: Privacy-first microservices architecture
3. **Advanced Privacy Features**: Consent management UI, data retention automation
4. **Compliance Automation**: Automated privacy impact assessments

## References

- [FERPA Compliance Guide](./FERPA_COMPLIANCE.md)
- [Privacy Event System](../events/PRIVACY_EVENTS.md)
- [Repository Pattern Implementation](../repositories/PRIVACY_PATTERNS.md)
- [Testing Privacy Features](./PRIVACY_TESTING_GUIDE.md)