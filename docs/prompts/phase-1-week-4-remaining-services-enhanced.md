# Phase 1 - Week 4: Remaining Services Decoupling with Privacy-First Architecture

## Important Note
**Since we believe Phase 1 may already be completed, please first assess:**
- Have the remaining AI services already been decoupled?
- Are InterventionService, LearningProgressTracker, CollaborationService, and WritingAnalyticsService already using the repository pattern and event system?
- **NEW**: Are privacy patterns (consent tracking, data minimization, privacy events) already implemented?
- If these tasks are already done, document what was implemented and proceed to the next incomplete task.

## Objective
Complete the decoupling of remaining AI services by implementing repository pattern, event-driven communication, and **establishing privacy-aware patterns** that will be used throughout the migration. All services must handle student data with privacy-first principles.

## Context
- **Current Phase**: Phase 1 - Decouple & Modernize
- **Week**: Week 4 of 6
- **Branch**: `feat/mcp-microservices-migration`
- **Dependencies**: Service decoupling from Week 3, cache abstraction layer, event system operational
- **Privacy Focus**: Establishing privacy patterns for all future service implementations

## Scope
### In Scope
- Decouple remaining AI services with privacy-aware patterns
- Implement privacy metadata in all service interactions
- Add consent tracking to NotificationService
- Create privacy-aware session management patterns
- Establish privacy events in the message queue system
- Complete repository pattern with data minimization principles
- Finalize event-driven communication with privacy audit trails

### Out of Scope
- Full GDPR/FERPA compliance implementation (Phase 4)
- Advanced encryption at rest/in transit (Infrastructure phase)
- Complete privacy dashboard UI (Frontend phase)
- Third-party privacy integration (Later phases)

## Technical Requirements
1. **Privacy-First Patterns**: All services must implement data minimization and purpose limitation
2. **Consent Tracking**: Services must check consent before processing personal data
3. **Privacy Events**: All data access must generate auditable privacy events
4. **Session Privacy**: Session management must support privacy preferences
5. **Data Retention**: Services must respect retention policies

## Implementation Steps

### Step 1: Privacy Infrastructure Foundation
- [ ] Create privacy types in `backend/src/types/privacy.ts`:
  ```typescript
  interface PrivacyContext {
    userId: string;
    consentedPurposes: DataPurpose[];
    dataRetentionDays: number;
    anonymizationRequired: boolean;
  }
  
  interface PrivacyMetadata {
    accessedBy: string;
    purpose: DataPurpose;
    timestamp: Date;
    dataFields: string[];
    justification?: string;
  }
  
  enum DataPurpose {
    EDUCATIONAL_PROGRESS = 'educational_progress',
    AI_ASSISTANCE = 'ai_assistance',
    ANALYTICS = 'analytics',
    INTERVENTION = 'intervention',
    COLLABORATION = 'collaboration'
  }
  ```

- [ ] Create privacy event types in `backend/src/events/privacy/`:
  ```typescript
  interface DataAccessedEvent {
    type: 'privacy.data_accessed';
    userId: string;
    accessorId: string;
    dataType: string;
    purpose: DataPurpose;
    fields: string[];
  }
  
  interface ConsentUpdatedEvent {
    type: 'privacy.consent_updated';
    userId: string;
    purposes: DataPurpose[];
    timestamp: Date;
  }
  ```

### Step 2: Privacy-Aware Session Management
- [ ] Enhance WritingSessionService with privacy context:
  ```typescript
  class WritingSessionService {
    async createSession(userId: string, privacyContext: PrivacyContext) {
      // Check consent for session tracking
      if (!privacyContext.consentedPurposes.includes(DataPurpose.EDUCATIONAL_PROGRESS)) {
        return this.createAnonymousSession();
      }
      
      // Publish privacy event
      await this.eventBus.publish<DataAccessedEvent>({
        type: 'privacy.data_accessed',
        userId,
        accessorId: 'system',
        dataType: 'writing_session',
        purpose: DataPurpose.EDUCATIONAL_PROGRESS,
        fields: ['content', 'metrics']
      });
      
      // Create session with privacy metadata
      return this.sessionRepo.create({
        userId,
        privacyMetadata: {
          consentedAt: new Date(),
          purposes: privacyContext.consentedPurposes,
          retentionDays: privacyContext.dataRetentionDays
        }
      });
    }
  }
  ```

### Step 3: InterventionService with Privacy Controls
- [ ] Refactor `backend/src/services/InterventionService.ts`:
  ```typescript
  class InterventionService {
    async checkForIntervention(studentId: string, context: InterventionContext) {
      // Get privacy context first
      const privacyContext = await this.getPrivacyContext(studentId);
      
      // Only process if consent given for interventions
      if (!privacyContext.consentedPurposes.includes(DataPurpose.INTERVENTION)) {
        return { interventionAllowed: false, reason: 'no_consent' };
      }
      
      // Minimal data access based on consent
      const allowedData = this.filterDataByConsent(context, privacyContext);
      
      // Process intervention with privacy audit
      const intervention = await this.processIntervention(allowedData);
      
      // Log privacy event
      await this.publishPrivacyEvent({
        type: 'privacy.intervention_checked',
        studentId,
        dataAccessed: Object.keys(allowedData),
        outcome: intervention.triggered
      });
      
      return intervention;
    }
  }
  ```

### Step 4: LearningProgressTracker with Data Minimization
- [ ] Implement privacy-aware progress tracking:
  ```typescript
  class LearningProgressTracker {
    async trackProgress(studentId: string, assignmentId: string) {
      const privacyContext = await this.privacyService.getContext(studentId);
      
      // Determine data granularity based on consent
      const trackingLevel = this.getTrackingLevel(privacyContext);
      
      switch (trackingLevel) {
        case 'full':
          return this.fullProgressTracking(studentId, assignmentId);
        case 'aggregated':
          return this.aggregatedProgressTracking(studentId, assignmentId);
        case 'anonymous':
          return this.anonymousProgressTracking(assignmentId);
        default:
          return null;
      }
    }
    
    private async fullProgressTracking(studentId: string, assignmentId: string) {
      // Publish privacy event before accessing data
      await this.eventBus.publish<DataAccessedEvent>({
        type: 'privacy.data_accessed',
        userId: studentId,
        dataType: 'learning_progress',
        purpose: DataPurpose.EDUCATIONAL_PROGRESS,
        fields: ['submissions', 'reflections', 'ai_interactions']
      });
      
      // Access data with privacy metadata
      const progress = await this.progressRepo.findWithPrivacy(studentId, {
        includeMetadata: true,
        respectRetention: true
      });
      
      return progress;
    }
  }
  ```

### Step 5: CollaborationService with Privacy Boundaries
- [ ] Implement privacy-aware collaboration:
  ```typescript
  class CollaborationService {
    async shareDocument(ownerId: string, recipientId: string, documentId: string) {
      // Check both users' privacy preferences
      const ownerPrivacy = await this.getPrivacyContext(ownerId);
      const recipientPrivacy = await this.getPrivacyContext(recipientId);
      
      // Verify collaboration consent
      if (!this.canCollaborate(ownerPrivacy, recipientPrivacy)) {
        throw new PrivacyError('Collaboration not permitted by privacy settings');
      }
      
      // Create privacy-aware share
      const share = await this.collaborationRepo.createShare({
        documentId,
        ownerId,
        recipientId,
        privacyLevel: this.determinePrivacyLevel(ownerPrivacy, recipientPrivacy),
        expiresAt: this.calculateExpiration(ownerPrivacy.dataRetentionDays)
      });
      
      // Publish privacy events for both users
      await this.publishCollaborationPrivacyEvents(ownerId, recipientId, documentId);
      
      return share;
    }
  }
  ```

### Step 6: WritingAnalyticsService with Anonymous Options
- [ ] Add privacy-preserving analytics:
  ```typescript
  class WritingAnalyticsService {
    async generateAnalytics(courseId: string, options: AnalyticsOptions) {
      // Get consent status for all students
      const studentConsents = await this.getStudentConsents(courseId);
      
      // Separate data by consent level
      const { full, aggregated, anonymous } = this.categorizeByConsent(studentConsents);
      
      // Generate analytics respecting privacy
      const analytics = {
        detailed: await this.detailedAnalytics(full),
        aggregated: await this.aggregatedAnalytics([...full, ...aggregated]),
        anonymous: await this.anonymousAnalytics([...full, ...aggregated, ...anonymous])
      };
      
      // Log analytics generation with privacy metadata
      await this.logAnalyticsGeneration(courseId, {
        fullConsentCount: full.length,
        aggregatedCount: aggregated.length,
        anonymousCount: anonymous.length
      });
      
      return analytics;
    }
  }
  ```

### Step 7: NotificationService with Consent Tracking
- [ ] Enhance NotificationService with privacy controls:
  ```typescript
  class NotificationService {
    async sendNotification(userId: string, notification: Notification) {
      // Check notification consent
      const consent = await this.consentRepo.getNotificationConsent(userId);
      
      if (!consent.allowsType(notification.type)) {
        await this.logBlockedNotification(userId, notification.type);
        return;
      }
      
      // Apply privacy filters to notification content
      const sanitized = this.sanitizeNotification(notification, consent.privacyLevel);
      
      // Send with privacy metadata
      await this.notificationRepo.create({
        ...sanitized,
        userId,
        consentCheckedAt: new Date(),
        privacyLevel: consent.privacyLevel
      });
      
      // Publish notification privacy event
      await this.eventBus.publish({
        type: 'privacy.notification_sent',
        userId,
        notificationType: notification.type,
        dataIncluded: this.getIncludedDataTypes(sanitized)
      });
    }
  }
  ```

### Step 8: Privacy Event Handler Service
- [ ] Create centralized privacy event handling:
  ```typescript
  class PrivacyEventHandler {
    constructor(
      private eventBus: IEventBus,
      private privacyRepo: IPrivacyRepository,
      private auditLog: IAuditLog
    ) {
      this.subscribeToPrivacyEvents();
    }
    
    private subscribeToPrivacyEvents() {
      this.eventBus.subscribe('privacy.*', async (event) => {
        // Log all privacy events
        await this.auditLog.logPrivacyEvent(event);
        
        // Update privacy metrics
        await this.updatePrivacyMetrics(event);
        
        // Check for privacy violations
        await this.checkPrivacyCompliance(event);
        
        // Handle data retention
        if (event.type === 'privacy.retention_check') {
          await this.handleDataRetention(event);
        }
      });
    }
  }
  ```

### Step 9: Privacy Repository Pattern
- [ ] Create privacy-aware repository base class:
  ```typescript
  abstract class PrivacyAwareRepository<T> implements IRepository<T> {
    async findById(id: string, privacyContext: PrivacyContext): Promise<T | null> {
      // Log data access
      await this.logDataAccess(id, privacyContext);
      
      // Apply privacy filters
      const filters = this.getPrivacyFilters(privacyContext);
      
      // Fetch with filters
      const data = await this.fetchWithFilters(id, filters);
      
      // Minimize data based on consent
      return this.minimizeData(data, privacyContext);
    }
    
    protected abstract minimizeData(data: T, context: PrivacyContext): T;
    protected abstract getPrivacyFilters(context: PrivacyContext): any;
  }
  ```

### Step 10: Privacy Configuration and Testing
- [ ] Add privacy configuration to `backend/src/config/privacy.ts`:
  ```typescript
  export const privacyConfig = {
    defaultRetentionDays: 365,
    anonymizationThreshold: 30,
    consentTypes: ['educational', 'ai_assistance', 'analytics', 'collaboration'],
    privacyEventRetention: 730, // 2 years for audit
    dataMinimizationRules: {
      anonymous: ['id', 'timestamp', 'type'],
      aggregated: ['id', 'metrics', 'category'],
      full: ['*']
    }
  };
  ```

- [ ] Create privacy testing utilities:
  ```typescript
  class PrivacyTestHelper {
    static createMockPrivacyContext(overrides?: Partial<PrivacyContext>): PrivacyContext {
      return {
        userId: 'test-user',
        consentedPurposes: [DataPurpose.EDUCATIONAL_PROGRESS],
        dataRetentionDays: 365,
        anonymizationRequired: false,
        ...overrides
      };
    }
    
    static async assertPrivacyEventPublished(eventBus: IEventBus, eventType: string) {
      const events = await eventBus.getPublishedEvents();
      expect(events).toContainEqual(
        expect.objectContaining({ type: eventType })
      );
    }
  }
  ```

## Testing Steps
- [ ] Privacy pattern testing:
  - [ ] Test consent checking in all services
  - [ ] Verify privacy events are published for all data access
  - [ ] Test data minimization based on consent levels
  - [ ] Verify anonymous mode works correctly
- [ ] Integration testing with privacy:
  - [ ] Test complete workflows with different privacy settings
  - [ ] Verify data retention policies are respected
  - [ ] Test privacy event aggregation and reporting
  - [ ] Ensure no data leakage between privacy contexts
- [ ] Performance testing:
  - [ ] Verify privacy checks don't significantly impact performance
  - [ ] Test privacy event handling under load
  - [ ] Ensure cache respects privacy boundaries

## Success Criteria
- [ ] All services implement privacy-aware patterns
- [ ] Privacy events generated for all data access
- [ ] Consent checking integrated into service flows
- [ ] Data minimization implemented based on privacy context
- [ ] Privacy metadata included in all service interactions
- [ ] Anonymous mode available for all services
- [ ] Privacy audit trail complete and queryable
- [ ] No performance degradation from privacy features

## Reference Documents
- [Privacy Integration Strategy](PRIVACY_INTEGRATION_STRATEGY.md)
- [Migration Plan - Privacy Considerations](../roadmaps/AI_MCP_MIGRATION_SUMMARY.md#privacy-considerations)
- [FERPA Compliance Guide](../guides/FERPA_COMPLIANCE.md)

## Notes
- Privacy patterns established here will be used throughout all phases
- Focus on creating reusable privacy components
- Document privacy decisions for future compliance audits
- Consider educational data protection requirements (FERPA, COPPA)
- Prepare for future GDPR compliance in Phase 4

## Next Steps
After completing this prompt:
1. Run `/reflect` to document privacy pattern implementation
2. Commit with message: "feat: Implement privacy-aware service decoupling"
3. Create privacy architecture documentation
4. Next prompt: `phase-1-week-5-infrastructure-monitoring.md`