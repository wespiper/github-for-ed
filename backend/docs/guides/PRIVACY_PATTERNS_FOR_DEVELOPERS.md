# Privacy Patterns for Developers

This guide provides reusable privacy patterns for implementing privacy-preserving features across Scribe Tree's MCP servers and services. These patterns ensure consistent privacy protection while maintaining educational effectiveness.

## Table of Contents
1. [Core Privacy Principles](#core-privacy-principles)
2. [Privacy-Aware Data Access](#privacy-aware-data-access)
3. [Consent Checking Middleware](#consent-checking-middleware)
4. [Data Minimization Techniques](#data-minimization-techniques)
5. [Anonymization and Pseudonymization](#anonymization-and-pseudonymization)
6. [Privacy-Preserving Analytics](#privacy-preserving-analytics)
7. [Audit Trail Implementation](#audit-trail-implementation)
8. [Privacy Event Handling](#privacy-event-handling)
9. [Secure Data Deletion](#secure-data-deletion)
10. [Testing Privacy Features](#testing-privacy-features)

## Core Privacy Principles

### Educational Context
- **Student Privacy First**: Protect student data while enabling educational insights
- **Transparency**: Clear data usage explanations for students and educators
- **Minimal Collection**: Only collect data necessary for educational outcomes
- **Purpose Limitation**: Use data only for declared educational purposes
- **Consent-Based**: Explicit consent for any data sharing or analysis

## Privacy-Aware Data Access

### Repository Pattern with Privacy Filtering

```typescript
// interfaces/PrivacyAwareRepository.ts
export interface PrivacyContext {
  userId: string;
  userRole: 'student' | 'educator' | 'admin';
  courseId?: string;
  consentLevel: ConsentLevel;
}

export interface PrivacyAwareRepository<T> {
  findWithPrivacy(
    criteria: any, 
    context: PrivacyContext
  ): Promise<T[]>;
  
  getPrivacyFilteredFields(
    entity: T, 
    context: PrivacyContext
  ): Partial<T>;
}

// implementations/StudentDataRepository.ts
export class StudentDataRepository implements PrivacyAwareRepository<StudentData> {
  async findWithPrivacy(
    criteria: FindCriteria,
    context: PrivacyContext
  ): Promise<StudentData[]> {
    const baseQuery = this.buildBaseQuery(criteria);
    
    // Apply privacy filters based on context
    const privacyFilter = this.buildPrivacyFilter(context);
    const results = await this.db.query({
      ...baseQuery,
      ...privacyFilter
    });
    
    // Filter fields based on privacy context
    return results.map(result => 
      this.getPrivacyFilteredFields(result, context)
    );
  }
  
  getPrivacyFilteredFields(
    data: StudentData,
    context: PrivacyContext
  ): Partial<StudentData> {
    const filtered: Partial<StudentData> = {
      id: data.id,
      // Always include non-sensitive fields
      courseEnrollment: data.courseEnrollment,
      assignmentProgress: data.assignmentProgress
    };
    
    // Include sensitive fields based on context
    if (context.userRole === 'educator' && 
        context.courseId === data.courseId) {
      filtered.writingPatterns = this.anonymizePatterns(data.writingPatterns);
      filtered.reflectionQuality = data.reflectionQuality;
    }
    
    if (context.userId === data.studentId || 
        context.userRole === 'admin') {
      filtered.personalNotes = data.personalNotes;
      filtered.aiInteractionHistory = data.aiInteractionHistory;
    }
    
    return filtered;
  }
  
  private anonymizePatterns(patterns: WritingPattern[]): AnonymizedPattern[] {
    return patterns.map(pattern => ({
      type: pattern.type,
      frequency: pattern.frequency,
      // Remove identifying details
      context: 'ANONYMIZED',
      timestamp: this.generalizeTimestamp(pattern.timestamp)
    }));
  }
}
```

### Privacy Decorator Pattern

```typescript
// decorators/PrivacyDecorator.ts
export function PrivacyProtected(
  options: { 
    requiredConsent?: ConsentType[],
    anonymize?: string[],
    auditLog?: boolean 
  } = {}
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const context = args.find(arg => arg.privacyContext);
      
      if (!context) {
        throw new Error('Privacy context required for protected method');
      }
      
      // Check consent requirements
      if (options.requiredConsent) {
        const hasConsent = await checkUserConsent(
          context.userId,
          options.requiredConsent
        );
        if (!hasConsent) {
          throw new PrivacyError('Required consent not granted');
        }
      }
      
      // Execute original method
      let result = await originalMethod.apply(this, args);
      
      // Apply anonymization
      if (options.anonymize && result) {
        result = anonymizeFields(result, options.anonymize);
      }
      
      // Log access if required
      if (options.auditLog) {
        await logDataAccess({
          userId: context.userId,
          method: propertyKey,
          dataType: target.constructor.name,
          timestamp: new Date()
        });
      }
      
      return result;
    };
  };
}

// Usage example
class StudentAnalyticsService {
  @PrivacyProtected({
    requiredConsent: ['analytics', 'performance_tracking'],
    anonymize: ['studentName', 'email'],
    auditLog: true
  })
  async getClassPerformanceMetrics(
    classId: string,
    context: PrivacyContext
  ): Promise<ClassMetrics> {
    // Method implementation
    return this.calculateMetrics(classId);
  }
}
```

## Consent Checking Middleware

### Express Middleware for Consent Validation

```typescript
// middleware/consentMiddleware.ts
export interface ConsentRequirement {
  types: ConsentType[];
  fallbackBehavior?: 'deny' | 'anonymous' | 'limited';
}

export function requireConsent(
  requirements: ConsentRequirement
): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        if (requirements.fallbackBehavior === 'anonymous') {
          req.privacyContext = {
            userId: 'anonymous',
            consentLevel: ConsentLevel.MINIMAL,
            limitations: ['no_personal_data', 'no_tracking']
          };
          return next();
        }
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      // Check user consents
      const userConsents = await consentService.getUserConsents(userId);
      const hasRequiredConsents = requirements.types.every(
        type => userConsents.includes(type)
      );
      
      if (!hasRequiredConsents) {
        if (requirements.fallbackBehavior === 'limited') {
          req.privacyContext = {
            userId,
            consentLevel: ConsentLevel.LIMITED,
            limitations: requirements.types
              .filter(type => !userConsents.includes(type))
              .map(type => `no_${type}`)
          };
          return next();
        }
        
        return res.status(403).json({
          error: 'Required consents not granted',
          required: requirements.types,
          granted: userConsents,
          consentUrl: `/api/consent/request?types=${requirements.types.join(',')}`
        });
      }
      
      // Full consent granted
      req.privacyContext = {
        userId,
        consentLevel: ConsentLevel.FULL,
        grantedConsents: userConsents
      };
      
      next();
    } catch (error) {
      next(error);
    }
  };
}

// Usage in routes
router.get('/api/analytics/personal',
  authenticate,
  requireConsent({ 
    types: ['analytics', 'performance_tracking'],
    fallbackBehavior: 'limited'
  }),
  async (req, res) => {
    const analytics = await analyticsService.getPersonalAnalytics(
      req.user.id,
      req.privacyContext
    );
    res.json(analytics);
  }
);
```

### Consent Service Implementation

```typescript
// services/ConsentService.ts
export class ConsentService {
  private cache: CacheService;
  private eventBus: EventBus;
  
  async requestConsent(
    userId: string,
    consentTypes: ConsentType[],
    context: ConsentContext
  ): Promise<ConsentRequest> {
    const request = await this.consentRepo.createRequest({
      userId,
      types: consentTypes,
      context,
      expiresAt: this.calculateExpiry(consentTypes)
    });
    
    await this.eventBus.publish({
      type: EventTypes.CONSENT_REQUESTED,
      payload: { userId, consentTypes, requestId: request.id }
    });
    
    return request;
  }
  
  async grantConsent(
    userId: string,
    consentTypes: ConsentType[],
    duration?: number
  ): Promise<ConsentGrant> {
    const grant = await this.consentRepo.createGrant({
      userId,
      types: consentTypes,
      grantedAt: new Date(),
      expiresAt: duration ? this.calculateExpiry(duration) : null
    });
    
    // Invalidate cache
    await this.cache.delete(`user_consents:${userId}`);
    
    await this.eventBus.publish({
      type: EventTypes.CONSENT_GRANTED,
      payload: { userId, consentTypes, grantId: grant.id }
    });
    
    return grant;
  }
  
  async revokeConsent(
    userId: string,
    consentTypes: ConsentType[]
  ): Promise<void> {
    await this.consentRepo.revokeConsents(userId, consentTypes);
    
    // Clear cached consents
    await this.cache.delete(`user_consents:${userId}`);
    
    // Trigger data cleanup
    await this.eventBus.publish({
      type: EventTypes.CONSENT_REVOKED,
      payload: { 
        userId, 
        consentTypes,
        cleanupRequired: this.getCleanupRequirements(consentTypes)
      }
    });
  }
  
  async getUserConsents(userId: string): Promise<ConsentType[]> {
    const cacheKey = `user_consents:${userId}`;
    const cached = await this.cache.get<ConsentType[]>(cacheKey);
    
    if (cached) return cached;
    
    const consents = await this.consentRepo.getActiveConsents(userId);
    await this.cache.set(cacheKey, consents, { ttl: 3600 }); // 1 hour
    
    return consents;
  }
}
```

## Data Minimization Techniques

### Field Selection Patterns

```typescript
// patterns/DataMinimization.ts
export class DataMinimizer {
  static selectFields<T>(
    data: T,
    purpose: DataPurpose,
    context: PrivacyContext
  ): Partial<T> {
    const fieldMap = this.getFieldMapForPurpose(purpose);
    const allowedFields = fieldMap[context.userRole] || fieldMap.default;
    
    return Object.keys(data)
      .filter(key => allowedFields.includes(key))
      .reduce((acc, key) => {
        acc[key] = data[key];
        return acc;
      }, {} as Partial<T>);
  }
  
  private static getFieldMapForPurpose(purpose: DataPurpose): FieldMap {
    const fieldMaps: Record<DataPurpose, FieldMap> = {
      'class_overview': {
        educator: ['id', 'averageScore', 'completionRate', 'trends'],
        student: ['id', 'personalScore', 'personalProgress'],
        default: ['id', 'aggregateStats']
      },
      'assignment_feedback': {
        educator: ['id', 'content', 'score', 'feedback', 'revisionCount'],
        student: ['id', 'content', 'score', 'feedback', 'suggestions'],
        default: ['id', 'score']
      },
      'writing_analytics': {
        educator: ['patterns', 'improvement', 'challengeAreas'],
        student: ['personalPatterns', 'goals', 'achievements'],
        default: ['generalTrends']
      }
    };
    
    return fieldMaps[purpose] || fieldMaps.default;
  }
}

// Usage in service
export class AssignmentService {
  async getAssignmentData(
    assignmentId: string,
    purpose: DataPurpose,
    context: PrivacyContext
  ): Promise<Partial<Assignment>> {
    const fullData = await this.assignmentRepo.findById(assignmentId);
    
    // Apply data minimization
    const minimized = DataMinimizer.selectFields(
      fullData,
      purpose,
      context
    );
    
    // Log data access
    await this.auditLog.logAccess({
      entityType: 'assignment',
      entityId: assignmentId,
      purpose,
      fieldsAccessed: Object.keys(minimized),
      userId: context.userId
    });
    
    return minimized;
  }
}
```

### Temporal Data Minimization

```typescript
// patterns/TemporalMinimization.ts
export class TemporalDataMinimizer {
  static async minimizeHistoricalData<T extends { timestamp: Date }>(
    data: T[],
    options: {
      retentionPeriod: number; // days
      aggregationLevel?: 'hour' | 'day' | 'week' | 'month';
      preserveRecent?: number; // days to keep at full detail
    }
  ): Promise<(T | AggregatedData)[]> {
    const now = new Date();
    const preserveThreshold = options.preserveRecent 
      ? subDays(now, options.preserveRecent)
      : now;
    const retentionThreshold = subDays(now, options.retentionPeriod);
    
    // Filter out data beyond retention period
    const retainedData = data.filter(
      item => item.timestamp > retentionThreshold
    );
    
    // Separate recent and historical data
    const recentData = retainedData.filter(
      item => item.timestamp > preserveThreshold
    );
    const historicalData = retainedData.filter(
      item => item.timestamp <= preserveThreshold
    );
    
    // Aggregate historical data
    const aggregated = options.aggregationLevel
      ? this.aggregateData(historicalData, options.aggregationLevel)
      : historicalData;
    
    return [...recentData, ...aggregated];
  }
  
  private static aggregateData<T>(
    data: T[],
    level: 'hour' | 'day' | 'week' | 'month'
  ): AggregatedData[] {
    // Group data by time period
    const grouped = groupBy(data, item => 
      this.getTimePeriodKey(item.timestamp, level)
    );
    
    // Create aggregated records
    return Object.entries(grouped).map(([period, items]) => ({
      period,
      aggregationLevel: level,
      count: items.length,
      summary: this.summarizeData(items),
      firstTimestamp: min(items.map(i => i.timestamp)),
      lastTimestamp: max(items.map(i => i.timestamp))
    }));
  }
}
```

## Anonymization and Pseudonymization

### Anonymization Service

```typescript
// services/AnonymizationService.ts
export class AnonymizationService {
  private saltStore: SaltStore;
  
  async anonymizeStudentData(
    data: StudentData,
    level: AnonymizationLevel
  ): Promise<AnonymizedStudentData> {
    switch (level) {
      case AnonymizationLevel.FULL:
        return this.fullAnonymization(data);
      case AnonymizationLevel.PSEUDO:
        return this.pseudonymization(data);
      case AnonymizationLevel.AGGREGATE:
        return this.aggregateAnonymization(data);
      default:
        throw new Error(`Unknown anonymization level: ${level}`);
    }
  }
  
  private async fullAnonymization(
    data: StudentData
  ): Promise<AnonymizedStudentData> {
    return {
      id: await this.generateAnonymousId(data.id),
      // Remove all identifying information
      demographics: this.generalizeDemographics(data.demographics),
      performance: this.preserveMetricsOnly(data.performance),
      writingPatterns: this.anonymizePatterns(data.writingPatterns),
      // Remove free text that could identify
      submissions: data.submissions.map(s => ({
        ...s,
        content: '[REDACTED]',
        metadata: this.sanitizeMetadata(s.metadata)
      }))
    };
  }
  
  private async pseudonymization(
    data: StudentData
  ): Promise<AnonymizedStudentData> {
    const salt = await this.saltStore.getSalt(data.courseId);
    
    return {
      id: this.hashWithSalt(data.id, salt),
      // Preserve structure but hash identifiers
      demographics: {
        ageGroup: this.generalizeAge(data.demographics.age),
        region: this.generalizeLocation(data.demographics.location),
        educationLevel: data.demographics.educationLevel
      },
      performance: data.performance,
      writingPatterns: data.writingPatterns,
      submissions: data.submissions.map(s => ({
        ...s,
        authorId: this.hashWithSalt(s.authorId, salt),
        // Preserve content for analysis
        content: s.content,
        metadata: this.pseudonymizeMetadata(s.metadata, salt)
      }))
    };
  }
  
  private generalizeAge(age: number): string {
    if (age < 13) return 'under-13';
    if (age < 18) return '13-17';
    if (age < 25) return '18-24';
    if (age < 35) return '25-34';
    return '35+';
  }
  
  private generalizeLocation(location: Location): string {
    // Generalize to region level
    return location.state || location.country || 'unknown';
  }
  
  private hashWithSalt(value: string, salt: string): string {
    return crypto
      .createHash('sha256')
      .update(value + salt)
      .digest('hex')
      .substring(0, 16); // Truncate for readability
  }
}
```

### Reversible Pseudonymization

```typescript
// patterns/ReversiblePseudonymization.ts
export class ReversiblePseudonymizer {
  private encryptionKey: Buffer;
  
  constructor(keyManager: KeyManager) {
    this.encryptionKey = keyManager.getKey('pseudonymization');
  }
  
  async pseudonymize(
    identifier: string,
    context: string
  ): Promise<{ pseudo: string; token: string }> {
    // Create context-specific IV
    const iv = crypto.randomBytes(16);
    const contextHash = crypto
      .createHash('sha256')
      .update(context)
      .digest();
    
    // Encrypt identifier
    const cipher = crypto.createCipheriv(
      'aes-256-gcm',
      this.encryptionKey,
      iv
    );
    cipher.setAAD(contextHash);
    
    const encrypted = Buffer.concat([
      cipher.update(identifier, 'utf8'),
      cipher.final()
    ]);
    
    const authTag = cipher.getAuthTag();
    
    // Create pseudonym
    const pseudo = this.createReadablePseudo(encrypted);
    
    // Create reversal token
    const token = Buffer.concat([iv, authTag, encrypted])
      .toString('base64');
    
    // Store mapping with expiration
    await this.mappingStore.store({
      pseudo,
      token,
      context,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });
    
    return { pseudo, token };
  }
  
  async depseudonymize(
    pseudo: string,
    token: string,
    context: string
  ): Promise<string | null> {
    try {
      // Retrieve and validate mapping
      const mapping = await this.mappingStore.retrieve(pseudo);
      
      if (!mapping || mapping.context !== context) {
        return null;
      }
      
      // Decode token
      const tokenBuffer = Buffer.from(token, 'base64');
      const iv = tokenBuffer.slice(0, 16);
      const authTag = tokenBuffer.slice(16, 32);
      const encrypted = tokenBuffer.slice(32);
      
      // Decrypt
      const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        this.encryptionKey,
        iv
      );
      
      const contextHash = crypto
        .createHash('sha256')
        .update(context)
        .digest();
      
      decipher.setAuthTag(authTag);
      decipher.setAAD(contextHash);
      
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]);
      
      return decrypted.toString('utf8');
    } catch (error) {
      // Log failed attempts
      await this.auditLog.logDepseudonymizationAttempt({
        pseudo,
        context,
        success: false,
        error: error.message
      });
      return null;
    }
  }
  
  private createReadablePseudo(data: Buffer): string {
    // Create human-readable pseudonym
    const hash = crypto
      .createHash('sha256')
      .update(data)
      .digest('hex');
    
    // Use word list for readable format
    const words = this.getWordFromHash(hash.substring(0, 8));
    const number = parseInt(hash.substring(8, 12), 16) % 10000;
    
    return `${words}-${number}`;
  }
}
```

## Privacy-Preserving Analytics

### Differential Privacy Implementation

```typescript
// analytics/DifferentialPrivacy.ts
export class DifferentialPrivacyAnalytics {
  private epsilon: number; // Privacy budget
  
  constructor(epsilon: number = 1.0) {
    this.epsilon = epsilon;
  }
  
  async addNoiseToCount(
    trueCount: number,
    sensitivity: number = 1
  ): Promise<number> {
    // Add Laplace noise
    const noise = this.laplaceSample(sensitivity / this.epsilon);
    const noisyCount = Math.max(0, Math.round(trueCount + noise));
    
    // Log privacy budget usage
    await this.privacyBudgetTracker.consume({
      operation: 'count_query',
      epsilon: this.epsilon,
      timestamp: new Date()
    });
    
    return noisyCount;
  }
  
  async addNoiseToAverage(
    values: number[],
    bounds: { min: number; max: number }
  ): Promise<number> {
    const trueAverage = mean(values);
    const sensitivity = (bounds.max - bounds.min) / values.length;
    
    const noise = this.laplaceSample(sensitivity / this.epsilon);
    const noisyAverage = Math.max(
      bounds.min,
      Math.min(bounds.max, trueAverage + noise)
    );
    
    await this.privacyBudgetTracker.consume({
      operation: 'average_query',
      epsilon: this.epsilon,
      dataSize: values.length
    });
    
    return noisyAverage;
  }
  
  private laplaceSample(scale: number): number {
    // Generate Laplace noise
    const u = Math.random() - 0.5;
    return scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
  }
  
  async privateHistogram(
    data: any[],
    bins: string[],
    getBin: (item: any) => string
  ): Promise<Map<string, number>> {
    // Create true histogram
    const histogram = new Map<string, number>();
    bins.forEach(bin => histogram.set(bin, 0));
    
    data.forEach(item => {
      const bin = getBin(item);
      histogram.set(bin, (histogram.get(bin) || 0) + 1);
    });
    
    // Add noise to each bin
    const privateHistogram = new Map<string, number>();
    
    for (const [bin, count] of histogram) {
      const noisyCount = await this.addNoiseToCount(count);
      privateHistogram.set(bin, noisyCount);
    }
    
    return privateHistogram;
  }
}
```

### K-Anonymity Implementation

```typescript
// analytics/KAnonymity.ts
export class KAnonymityService {
  async ensureKAnonymity<T>(
    records: T[],
    k: number,
    quasiIdentifiers: (keyof T)[]
  ): Promise<AnonymizedDataset<T>> {
    // Group records by quasi-identifiers
    const groups = this.groupByQuasiIdentifiers(records, quasiIdentifiers);
    
    // Check k-anonymity
    const nonAnonymousGroups = Array.from(groups.values())
      .filter(group => group.length < k);
    
    if (nonAnonymousGroups.length === 0) {
      // Already k-anonymous
      return {
        data: records,
        anonymityLevel: k,
        modifications: []
      };
    }
    
    // Apply generalization hierarchy
    const generalizedRecords = await this.generalizeRecords(
      records,
      quasiIdentifiers,
      k
    );
    
    // Verify k-anonymity after generalization
    const generalizedGroups = this.groupByQuasiIdentifiers(
      generalizedRecords,
      quasiIdentifiers
    );
    
    const stillNonAnonymous = Array.from(generalizedGroups.values())
      .filter(group => group.length < k);
    
    if (stillNonAnonymous.length > 0) {
      // Suppress records that can't be made k-anonymous
      const suppressedIds = stillNonAnonymous
        .flatMap(group => group.map(r => r.id));
      
      const finalRecords = generalizedRecords
        .filter(r => !suppressedIds.includes(r.id));
      
      return {
        data: finalRecords,
        anonymityLevel: k,
        modifications: [
          { type: 'generalization', fields: quasiIdentifiers },
          { type: 'suppression', count: suppressedIds.length }
        ]
      };
    }
    
    return {
      data: generalizedRecords,
      anonymityLevel: k,
      modifications: [
        { type: 'generalization', fields: quasiIdentifiers }
      ]
    };
  }
  
  private async generalizeRecords<T>(
    records: T[],
    quasiIdentifiers: (keyof T)[],
    targetK: number
  ): Promise<T[]> {
    // Apply generalization hierarchies
    const hierarchies = await this.getGeneralizationHierarchies();
    
    return records.map(record => {
      const generalized = { ...record };
      
      quasiIdentifiers.forEach(field => {
        const hierarchy = hierarchies.get(field as string);
        if (hierarchy) {
          generalized[field] = this.generalize(
            record[field],
            hierarchy,
            this.getGeneralizationLevel(field, targetK)
          );
        }
      });
      
      return generalized;
    });
  }
}
```

### Privacy-Preserving Aggregations

```typescript
// analytics/PrivateAggregation.ts
export class PrivateAggregationService {
  async computePrivateStatistics(
    data: StudentMetrics[],
    options: {
      minGroupSize: number;
      noiseLevel: number;
      suppressSmallGroups: boolean;
    }
  ): Promise<AggregatedStatistics> {
    const grouped = this.groupByDemographics(data);
    const statistics: AggregatedStatistics = {
      groups: [],
      totalRecords: data.length,
      suppressedGroups: 0
    };
    
    for (const [key, group] of grouped) {
      if (group.length < options.minGroupSize) {
        if (options.suppressSmallGroups) {
          statistics.suppressedGroups++;
          continue;
        }
        // Merge with larger group
        const mergedGroup = this.mergeWithSimilarGroup(group, grouped);
        group.push(...mergedGroup);
      }
      
      const stats = await this.computeGroupStatistics(group, options);
      statistics.groups.push({
        demographics: this.generalizeDemographics(key),
        size: await this.addNoise(group.length, options.noiseLevel),
        metrics: stats
      });
    }
    
    return statistics;
  }
  
  private async computeGroupStatistics(
    group: StudentMetrics[],
    options: { noiseLevel: number }
  ): Promise<GroupStatistics> {
    const scores = group.map(s => s.score);
    const progressRates = group.map(s => s.progressRate);
    
    return {
      averageScore: await this.addNoise(
        mean(scores),
        options.noiseLevel / Math.sqrt(group.length)
      ),
      medianScore: await this.addNoise(
        median(scores),
        options.noiseLevel / Math.sqrt(group.length)
      ),
      averageProgress: await this.addNoise(
        mean(progressRates),
        options.noiseLevel / Math.sqrt(group.length)
      ),
      // Round to reduce precision
      scoreDistribution: this.createPrivateDistribution(
        scores,
        [0, 60, 70, 80, 90, 100],
        options.noiseLevel
      )
    };
  }
  
  private async createPrivateDistribution(
    values: number[],
    bins: number[],
    noiseLevel: number
  ): Promise<Distribution> {
    const counts = new Array(bins.length - 1).fill(0);
    
    values.forEach(value => {
      for (let i = 0; i < bins.length - 1; i++) {
        if (value >= bins[i] && value < bins[i + 1]) {
          counts[i]++;
          break;
        }
      }
    });
    
    // Add noise to each bin
    const noisyCounts = await Promise.all(
      counts.map(count => this.addNoise(count, noiseLevel))
    );
    
    // Ensure non-negative and normalize
    const total = Math.max(1, sum(noisyCounts));
    const normalized = noisyCounts.map(c => Math.max(0, c) / total);
    
    return {
      bins: bins.map((b, i) => 
        i < bins.length - 1 ? `${b}-${bins[i + 1]}` : `${b}+`
      ),
      frequencies: normalized
    };
  }
}
```

## Audit Trail Implementation

### Comprehensive Audit Logger

```typescript
// audit/AuditLogger.ts
export interface AuditEvent {
  id: string;
  timestamp: Date;
  eventType: AuditEventType;
  userId: string;
  userRole: string;
  action: string;
  resource: {
    type: string;
    id: string;
    fields?: string[];
  };
  context: {
    ip?: string;
    sessionId?: string;
    correlationId?: string;
  };
  privacy: {
    dataClassification: DataClassification;
    consentTypes?: ConsentType[];
    anonymizationApplied?: boolean;
  };
  result: {
    success: boolean;
    error?: string;
    dataReturned?: boolean;
  };
}

export class AuditLogger {
  private eventStore: AuditEventStore;
  private encryptionService: EncryptionService;
  
  async logDataAccess(params: {
    userId: string;
    action: string;
    resource: AuditEvent['resource'];
    context: AuditEvent['context'];
    dataClassification: DataClassification;
  }): Promise<void> {
    const event: AuditEvent = {
      id: uuidv4(),
      timestamp: new Date(),
      eventType: AuditEventType.DATA_ACCESS,
      userId: params.userId,
      userRole: await this.getUserRole(params.userId),
      action: params.action,
      resource: params.resource,
      context: params.context,
      privacy: {
        dataClassification: params.dataClassification,
        consentTypes: await this.getAppliedConsents(params.userId)
      },
      result: { success: true, dataReturned: true }
    };
    
    await this.storeAuditEvent(event);
  }
  
  async logConsentChange(params: {
    userId: string;
    consentTypes: ConsentType[];
    action: 'grant' | 'revoke' | 'modify';
    context: AuditEvent['context'];
  }): Promise<void> {
    const event: AuditEvent = {
      id: uuidv4(),
      timestamp: new Date(),
      eventType: AuditEventType.CONSENT_CHANGE,
      userId: params.userId,
      userRole: await this.getUserRole(params.userId),
      action: params.action,
      resource: {
        type: 'consent',
        id: params.consentTypes.join(',')
      },
      context: params.context,
      privacy: {
        dataClassification: DataClassification.PERSONAL,
        consentTypes: params.consentTypes
      },
      result: { success: true }
    };
    
    await this.storeAuditEvent(event);
    
    // Trigger compliance notifications if needed
    if (params.action === 'revoke') {
      await this.notifyDataDeletion(params.userId, params.consentTypes);
    }
  }
  
  async logAnonymization(params: {
    userId: string;
    dataType: string;
    recordCount: number;
    technique: 'full' | 'pseudo' | 'k-anonymity' | 'differential';
    context: AuditEvent['context'];
  }): Promise<void> {
    const event: AuditEvent = {
      id: uuidv4(),
      timestamp: new Date(),
      eventType: AuditEventType.ANONYMIZATION,
      userId: params.userId,
      userRole: await this.getUserRole(params.userId),
      action: `anonymize_${params.technique}`,
      resource: {
        type: params.dataType,
        id: `batch_${Date.now()}`,
        fields: ['count:' + params.recordCount]
      },
      context: params.context,
      privacy: {
        dataClassification: DataClassification.ANONYMIZED,
        anonymizationApplied: true
      },
      result: { success: true }
    };
    
    await this.storeAuditEvent(event);
  }
  
  private async storeAuditEvent(event: AuditEvent): Promise<void> {
    // Encrypt sensitive fields
    const encrypted = await this.encryptSensitiveFields(event);
    
    // Store with integrity protection
    const signature = await this.signEvent(encrypted);
    
    await this.eventStore.store({
      ...encrypted,
      signature,
      // Index for efficient querying
      indexes: {
        userId: event.userId,
        timestamp: event.timestamp,
        eventType: event.eventType,
        resourceType: event.resource.type
      }
    });
    
    // Real-time compliance monitoring
    await this.complianceMonitor.checkEvent(event);
  }
  
  async queryAuditTrail(
    criteria: AuditQueryCriteria,
    requesterContext: PrivacyContext
  ): Promise<AuditEvent[]> {
    // Verify requester has audit access
    if (!this.hasAuditAccess(requesterContext)) {
      throw new PrivacyError('Insufficient privileges for audit access');
    }
    
    // Query events
    const events = await this.eventStore.query(criteria);
    
    // Filter based on requester's permissions
    const filtered = events.filter(event => 
      this.canViewAuditEvent(event, requesterContext)
    );
    
    // Log the audit query itself
    await this.logDataAccess({
      userId: requesterContext.userId,
      action: 'query_audit_trail',
      resource: {
        type: 'audit_log',
        id: 'trail',
        fields: Object.keys(criteria)
      },
      context: { correlationId: uuidv4() },
      dataClassification: DataClassification.SENSITIVE
    });
    
    return filtered;
  }
}
```

### Tamper-Proof Audit Chain

```typescript
// audit/TamperProofChain.ts
export class TamperProofAuditChain {
  private hashAlgorithm = 'sha256';
  
  async addEvent(
    event: AuditEvent,
    previousHash: string
  ): Promise<AuditChainEntry> {
    const eventData = this.canonicalizeEvent(event);
    const timestamp = new Date().toISOString();
    
    // Create block data
    const blockData = {
      index: await this.getNextIndex(),
      timestamp,
      event: eventData,
      previousHash
    };
    
    // Calculate hash
    const hash = this.calculateHash(blockData);
    
    // Create entry
    const entry: AuditChainEntry = {
      ...blockData,
      hash,
      signature: await this.signEntry(blockData, hash)
    };
    
    // Store entry
    await this.storage.append(entry);
    
    // Periodic anchoring to external system
    if (entry.index % 1000 === 0) {
      await this.anchorToBlockchain(entry);
    }
    
    return entry;
  }
  
  async verifyChain(
    startIndex?: number,
    endIndex?: number
  ): Promise<VerificationResult> {
    const entries = await this.storage.getRange(startIndex, endIndex);
    
    if (entries.length === 0) {
      return { valid: true, errors: [] };
    }
    
    const errors: VerificationError[] = [];
    
    // Verify first entry
    if (startIndex === 0 || !startIndex) {
      const firstEntry = entries[0];
      if (firstEntry.previousHash !== this.genesisHash) {
        errors.push({
          index: firstEntry.index,
          type: 'invalid_genesis',
          message: 'First entry does not reference genesis block'
        });
      }
    }
    
    // Verify chain integrity
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      
      // Verify hash
      const calculatedHash = this.calculateHash({
        index: entry.index,
        timestamp: entry.timestamp,
        event: entry.event,
        previousHash: entry.previousHash
      });
      
      if (calculatedHash !== entry.hash) {
        errors.push({
          index: entry.index,
          type: 'invalid_hash',
          message: 'Entry hash does not match calculated hash'
        });
      }
      
      // Verify signature
      const signatureValid = await this.verifySignature(
        entry,
        entry.signature
      );
      
      if (!signatureValid) {
        errors.push({
          index: entry.index,
          type: 'invalid_signature',
          message: 'Entry signature verification failed'
        });
      }
      
      // Verify chain continuity
      if (i > 0 && entry.previousHash !== entries[i - 1].hash) {
        errors.push({
          index: entry.index,
          type: 'broken_chain',
          message: 'Entry does not reference previous entry correctly'
        });
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      verified: entries.length,
      lastVerifiedIndex: entries[entries.length - 1]?.index
    };
  }
  
  private canonicalizeEvent(event: AuditEvent): string {
    // Ensure consistent serialization
    return JSON.stringify(event, Object.keys(event).sort());
  }
  
  private calculateHash(data: any): string {
    const content = JSON.stringify(data);
    return crypto
      .createHash(this.hashAlgorithm)
      .update(content)
      .digest('hex');
  }
}
```

## Privacy Event Handling

### Privacy Event System

```typescript
// events/PrivacyEventBus.ts
export enum PrivacyEventType {
  CONSENT_GRANTED = 'privacy.consent.granted',
  CONSENT_REVOKED = 'privacy.consent.revoked',
  DATA_ACCESS_REQUESTED = 'privacy.data.access_requested',
  DATA_EXPORTED = 'privacy.data.exported',
  DATA_DELETED = 'privacy.data.deleted',
  ANONYMIZATION_COMPLETED = 'privacy.anonymization.completed',
  RETENTION_EXPIRED = 'privacy.retention.expired',
  PRIVACY_VIOLATION = 'privacy.violation.detected'
}

export class PrivacyEventBus extends EventBus {
  async publishPrivacyEvent<T extends PrivacyEvent>(
    event: T
  ): Promise<void> {
    // Add privacy metadata
    const enrichedEvent = {
      ...event,
      privacyMetadata: {
        timestamp: new Date(),
        dataClassification: this.classifyEventData(event),
        requiredActions: this.determineRequiredActions(event)
      }
    };
    
    // Log privacy event
    await this.auditLogger.logPrivacyEvent(enrichedEvent);
    
    // Publish to subscribers
    await this.publish(enrichedEvent);
    
    // Check compliance requirements
    await this.complianceChecker.evaluateEvent(enrichedEvent);
  }
  
  subscribeToPrivacyEvents(
    handler: PrivacyEventHandler,
    options?: {
      eventTypes?: PrivacyEventType[];
      dataClassifications?: DataClassification[];
    }
  ): Subscription {
    const wrappedHandler = async (event: PrivacyEvent) => {
      // Filter by options
      if (options?.eventTypes && 
          !options.eventTypes.includes(event.type)) {
        return;
      }
      
      if (options?.dataClassifications &&
          !options.dataClassifications.includes(
            event.privacyMetadata.dataClassification
          )) {
        return;
      }
      
      // Execute handler with error handling
      try {
        await handler(event);
      } catch (error) {
        await this.handlePrivacyEventError(event, error);
      }
    };
    
    return this.subscribe(
      'privacy.*',
      wrappedHandler
    );
  }
}
```

### Privacy Event Handlers

```typescript
// events/handlers/ConsentRevocationHandler.ts
export class ConsentRevocationHandler {
  async handleConsentRevoked(
    event: ConsentRevokedEvent
  ): Promise<void> {
    const { userId, consentTypes } = event.payload;
    
    // Determine data to be deleted
    const affectedData = await this.identifyAffectedData(
      userId,
      consentTypes
    );
    
    // Create deletion tasks
    const deletionTasks = affectedData.map(data => ({
      type: 'delete_user_data',
      priority: 'high',
      payload: {
        userId,
        dataType: data.type,
        dataIds: data.ids,
        reason: 'consent_revoked',
        requiredBy: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      }
    }));
    
    // Queue deletion tasks
    await this.taskQueue.bulkEnqueue(deletionTasks);
    
    // Notify downstream services
    await this.eventBus.publish({
      type: EventTypes.DATA_DELETION_REQUIRED,
      payload: {
        userId,
        consentTypes,
        taskIds: deletionTasks.map(t => t.id)
      }
    });
    
    // Update user's privacy status
    await this.privacyService.updateUserPrivacyStatus(userId, {
      revokedConsents: consentTypes,
      deletionInProgress: true,
      deletionRequestedAt: new Date()
    });
  }
  
  private async identifyAffectedData(
    userId: string,
    revokedConsents: ConsentType[]
  ): Promise<AffectedData[]> {
    const dataMap = {
      'analytics': ['writing_analytics', 'performance_metrics'],
      'ai_interaction': ['ai_conversations', 'ai_feedback'],
      'behavioral': ['activity_logs', 'interaction_patterns'],
      'sharing': ['shared_documents', 'collaborative_sessions']
    };
    
    const affected: AffectedData[] = [];
    
    for (const consent of revokedConsents) {
      const dataTypes = dataMap[consent] || [];
      
      for (const dataType of dataTypes) {
        const ids = await this.dataInventory.findUserData(
          userId,
          dataType
        );
        
        if (ids.length > 0) {
          affected.push({ type: dataType, ids });
        }
      }
    }
    
    return affected;
  }
}
```

### Privacy Monitoring

```typescript
// monitoring/PrivacyMonitor.ts
export class PrivacyMonitor {
  private alertThresholds: Map<string, number>;
  
  async monitorPrivacyHealth(): Promise<PrivacyHealthReport> {
    const metrics = await this.collectPrivacyMetrics();
    const violations = await this.detectViolations(metrics);
    const recommendations = this.generateRecommendations(metrics);
    
    const report: PrivacyHealthReport = {
      timestamp: new Date(),
      overallHealth: this.calculateHealthScore(metrics, violations),
      metrics,
      violations,
      recommendations,
      trends: await this.analyzeTrends()
    };
    
    // Alert on critical issues
    if (violations.some(v => v.severity === 'critical')) {
      await this.alertService.sendCriticalPrivacyAlert(report);
    }
    
    return report;
  }
  
  private async collectPrivacyMetrics(): Promise<PrivacyMetrics> {
    return {
      consentCoverage: await this.calculateConsentCoverage(),
      dataMinimization: await this.assessDataMinimization(),
      anonymizationRate: await this.getAnonymizationRate(),
      retentionCompliance: await this.checkRetentionCompliance(),
      accessPatterns: await this.analyzeAccessPatterns(),
      auditCompleteness: await this.assessAuditCompleteness()
    };
  }
  
  private async detectViolations(
    metrics: PrivacyMetrics
  ): Promise<PrivacyViolation[]> {
    const violations: PrivacyViolation[] = [];
    
    // Check excessive data access
    const accessViolations = metrics.accessPatterns.anomalies
      .filter(a => a.severity > this.alertThresholds.get('access'));
    
    violations.push(...accessViolations.map(a => ({
      type: 'excessive_access',
      severity: a.severity > 0.8 ? 'critical' : 'warning',
      details: a,
      timestamp: new Date()
    })));
    
    // Check retention violations
    if (metrics.retentionCompliance.violationCount > 0) {
      violations.push({
        type: 'retention_violation',
        severity: 'critical',
        details: metrics.retentionCompliance,
        timestamp: new Date()
      });
    }
    
    // Check consent gaps
    if (metrics.consentCoverage.percentage < 95) {
      violations.push({
        type: 'insufficient_consent',
        severity: 'warning',
        details: {
          coverage: metrics.consentCoverage.percentage,
          missingConsents: metrics.consentCoverage.gaps
        },
        timestamp: new Date()
      });
    }
    
    return violations;
  }
}
```

## Secure Data Deletion

### Data Deletion Service

```typescript
// deletion/SecureDataDeletion.ts
export class SecureDataDeletionService {
  private deletionStrategies: Map<string, DeletionStrategy>;
  
  async deleteUserData(
    userId: string,
    options: {
      scope: 'all' | 'specific';
      dataTypes?: string[];
      preserveAnonymized?: boolean;
      reason: string;
    }
  ): Promise<DeletionReport> {
    const deletionPlan = await this.createDeletionPlan(userId, options);
    
    // Validate deletion authorization
    await this.validateDeletionRequest(userId, deletionPlan);
    
    // Execute deletion in phases
    const results: DeletionResult[] = [];
    
    // Phase 1: Soft delete and anonymization
    for (const item of deletionPlan.items) {
      if (options.preserveAnonymized && item.canAnonymize) {
        const result = await this.anonymizeData(item);
        results.push(result);
      } else {
        const result = await this.softDelete(item);
        results.push(result);
      }
    }
    
    // Phase 2: Hard delete after grace period
    await this.scheduleHardDeletion(deletionPlan, results);
    
    // Phase 3: Verify deletion
    const verification = await this.verifyDeletion(userId, deletionPlan);
    
    // Create deletion certificate
    const certificate = await this.createDeletionCertificate({
      userId,
      deletionPlan,
      results,
      verification,
      timestamp: new Date()
    });
    
    return {
      success: verification.complete,
      certificate,
      summary: this.summarizeDeletion(results),
      retainedData: this.identifyRetainedData(results)
    };
  }
  
  private async softDelete(
    item: DeletionItem
  ): Promise<DeletionResult> {
    const strategy = this.deletionStrategies.get(item.dataType);
    
    if (!strategy) {
      throw new Error(`No deletion strategy for type: ${item.dataType}`);
    }
    
    try {
      // Mark as deleted
      await strategy.markDeleted(item.dataId, {
        deletedAt: new Date(),
        deletionReason: item.reason,
        scheduledPurge: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
      
      // Remove from active indexes
      await this.removeFromIndexes(item);
      
      // Clear caches
      await this.clearRelatedCaches(item);
      
      return {
        item,
        status: 'soft_deleted',
        timestamp: new Date()
      };
    } catch (error) {
      return {
        item,
        status: 'failed',
        error: error.message,
        timestamp: new Date()
      };
    }
  }
  
  private async anonymizeData(
    item: DeletionItem
  ): Promise<DeletionResult> {
    const anonymizer = this.getAnonymizer(item.dataType);
    
    try {
      // Anonymize in place
      const anonymized = await anonymizer.anonymize(item.dataId, {
        level: AnonymizationLevel.FULL,
        preserveStructure: true,
        auditTrail: true
      });
      
      // Update references
      await this.updateReferences(item.dataId, anonymized.newId);
      
      return {
        item,
        status: 'anonymized',
        newId: anonymized.newId,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        item,
        status: 'failed',
        error: error.message,
        timestamp: new Date()
      };
    }
  }
  
  async scheduleHardDeletion(
    plan: DeletionPlan,
    softDeleteResults: DeletionResult[]
  ): Promise<void> {
    const successful = softDeleteResults
      .filter(r => r.status === 'soft_deleted');
    
    const hardDeleteJobs = successful.map(result => ({
      type: 'hard_delete',
      scheduledFor: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      payload: {
        dataType: result.item.dataType,
        dataId: result.item.dataId,
        deletionPlanId: plan.id
      }
    }));
    
    await this.jobScheduler.scheduleBatch(hardDeleteJobs);
  }
  
  async executeHardDeletion(
    dataType: string,
    dataId: string
  ): Promise<void> {
    const strategy = this.deletionStrategies.get(dataType);
    
    // Overwrite with random data multiple times
    for (let i = 0; i < 3; i++) {
      await strategy.overwriteWithRandom(dataId);
    }
    
    // Perform actual deletion
    await strategy.permanentDelete(dataId);
    
    // Verify deletion
    const exists = await strategy.checkExistence(dataId);
    if (exists) {
      throw new Error('Hard deletion failed - data still exists');
    }
    
    // Log completion
    await this.auditLogger.logDataDeletion({
      dataType,
      dataId,
      method: 'hard_delete',
      timestamp: new Date(),
      verified: true
    });
  }
}
```

### Deletion Strategies

```typescript
// deletion/strategies/DatabaseDeletionStrategy.ts
export class DatabaseDeletionStrategy implements DeletionStrategy {
  async markDeleted(
    recordId: string,
    metadata: DeletionMetadata
  ): Promise<void> {
    await this.db.transaction(async (trx) => {
      // Update record with deletion metadata
      await trx('records')
        .where('id', recordId)
        .update({
          deleted_at: metadata.deletedAt,
          deletion_reason: metadata.deletionReason,
          scheduled_purge: metadata.scheduledPurge,
          // Null out sensitive fields immediately
          personal_data: null,
          email: null,
          name: '[DELETED]'
        });
      
      // Move to deletion audit table
      await trx('deletion_audit').insert({
        record_id: recordId,
        record_type: this.recordType,
        deleted_at: metadata.deletedAt,
        reason: metadata.deletionReason,
        deleted_by: metadata.deletedBy || 'system'
      });
    });
  }
  
  async permanentDelete(recordId: string): Promise<void> {
    await this.db.transaction(async (trx) => {
      // Delete related records first
      await this.deleteRelatedRecords(recordId, trx);
      
      // Delete main record
      await trx('records')
        .where('id', recordId)
        .delete();
      
      // Clean up audit trail after retention period
      await trx('audit_logs')
        .where('record_id', recordId)
        .where('created_at', '<', 
          new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
        )
        .delete();
    });
  }
  
  async overwriteWithRandom(recordId: string): Promise<void> {
    const randomData = this.generateRandomData();
    
    await this.db('records')
      .where('id', recordId)
      .update(randomData);
  }
  
  private generateRandomData(): any {
    return {
      data: crypto.randomBytes(1024).toString('hex'),
      timestamp: new Date(),
      overwrite_pass: crypto.randomBytes(16).toString('hex')
    };
  }
}

// deletion/strategies/FileDeletionStrategy.ts
export class FileDeletionStrategy implements DeletionStrategy {
  async markDeleted(
    filePath: string,
    metadata: DeletionMetadata
  ): Promise<void> {
    // Move to quarantine directory
    const quarantinePath = this.getQuarantinePath(filePath);
    await fs.rename(filePath, quarantinePath);
    
    // Create deletion marker
    await fs.writeFile(
      `${quarantinePath}.deletion`,
      JSON.stringify(metadata)
    );
    
    // Update file metadata
    await this.fileMetadata.update(filePath, {
      status: 'deleted',
      deletedAt: metadata.deletedAt,
      quarantinePath
    });
  }
  
  async permanentDelete(filePath: string): Promise<void> {
    const quarantinePath = this.getQuarantinePath(filePath);
    
    // Secure file deletion
    await this.secureFileWipe(quarantinePath);
    
    // Remove metadata
    await this.fileMetadata.remove(filePath);
    
    // Remove from backups (if applicable)
    await this.backupService.removeFromBackups(filePath);
  }
  
  private async secureFileWipe(filePath: string): Promise<void> {
    const stats = await fs.stat(filePath);
    const fileSize = stats.size;
    
    // Overwrite with random data multiple times
    for (let pass = 0; pass < 3; pass++) {
      const randomData = crypto.randomBytes(fileSize);
      await fs.writeFile(filePath, randomData);
      await fs.fsync(await fs.open(filePath, 'r+'));
    }
    
    // Final deletion
    await fs.unlink(filePath);
  }
}
```

## Testing Privacy Features

### Privacy Test Utilities

```typescript
// testing/PrivacyTestUtils.ts
export class PrivacyTestUtils {
  static createMockPrivacyContext(
    overrides?: Partial<PrivacyContext>
  ): PrivacyContext {
    return {
      userId: 'test-user-123',
      userRole: 'student',
      consentLevel: ConsentLevel.FULL,
      grantedConsents: ['basic', 'analytics'],
      ...overrides
    };
  }
  
  static async assertDataMinimized<T>(
    actual: Partial<T>,
    expected: Partial<T>,
    context: PrivacyContext
  ): Promise<void> {
    const allowedFields = this.getAllowedFields(context);
    
    // Check no extra fields are present
    const actualFields = Object.keys(actual);
    const extraFields = actualFields.filter(
      field => !allowedFields.includes(field)
    );
    
    expect(extraFields).toHaveLength(0);
    
    // Check expected fields match
    Object.keys(expected).forEach(field => {
      expect(actual[field]).toEqual(expected[field]);
    });
  }
  
  static async assertAnonymized(
    data: any,
    identifyingFields: string[]
  ): Promise<void> {
    identifyingFields.forEach(field => {
      const value = this.getNestedValue(data, field);
      
      // Check field is either removed or anonymized
      expect(
        value === undefined ||
        value === null ||
        value === '[REDACTED]' ||
        this.isAnonymized(value)
      ).toBe(true);
    });
  }
  
  static async simulateConsentRevocation(
    userId: string,
    consentTypes: ConsentType[]
  ): Promise<void> {
    // Revoke consents
    await consentService.revokeConsent(userId, consentTypes);
    
    // Wait for async processing
    await this.waitForEventProcessing();
    
    // Verify data deletion initiated
    const deletionTasks = await taskQueue.getTasks({
      type: 'delete_user_data',
      userId
    });
    
    expect(deletionTasks.length).toBeGreaterThan(0);
  }
  
  static createPrivacyTestSuite(): PrivacyTestSuite {
    return {
      testDataMinimization: async (service, method, scenarios) => {
        for (const scenario of scenarios) {
          const result = await service[method](
            scenario.input,
            scenario.context
          );
          
          await this.assertDataMinimized(
            result,
            scenario.expected,
            scenario.context
          );
        }
      },
      
      testConsentEnforcement: async (endpoint, scenarios) => {
        for (const scenario of scenarios) {
          const response = await request(app)
            .get(endpoint)
            .set('Authorization', `Bearer ${scenario.token}`)
            .send(scenario.body);
          
          if (scenario.expectedStatus === 403) {
            expect(response.body).toHaveProperty('consentUrl');
          } else {
            expect(response.status).toBe(scenario.expectedStatus);
          }
        }
      },
      
      testAuditLogging: async (operation, context) => {
        // Clear audit logs
        await auditLogger.clear({ userId: context.userId });
        
        // Perform operation
        await operation();
        
        // Verify audit log created
        const logs = await auditLogger.query({
          userId: context.userId,
          timeRange: { start: new Date(Date.now() - 60000) }
        });
        
        expect(logs.length).toBeGreaterThan(0);
        expect(logs[0]).toMatchObject({
          userId: context.userId,
          privacy: {
            dataClassification: expect.any(String),
            consentTypes: expect.any(Array)
          }
        });
      }
    };
  }
}
```

### Privacy Integration Tests

```typescript
// testing/privacy.integration.test.ts
describe('Privacy Integration Tests', () => {
  let app: Application;
  let privacyMonitor: PrivacyMonitor;
  
  beforeEach(async () => {
    app = await createTestApp();
    privacyMonitor = new PrivacyMonitor();
  });
  
  describe('End-to-End Privacy Flow', () => {
    it('should handle complete privacy lifecycle', async () => {
      const userId = 'test-student-123';
      
      // 1. User grants consent
      await consentService.grantConsent(userId, [
        'analytics',
        'ai_interaction'
      ]);
      
      // 2. Access data with consent
      const response1 = await request(app)
        .get('/api/analytics/personal')
        .set('Authorization', `Bearer ${getTestToken(userId)}`)
        .expect(200);
      
      expect(response1.body.data).toBeDefined();
      
      // 3. Verify audit log
      const auditLogs = await auditLogger.query({
        userId,
        eventType: AuditEventType.DATA_ACCESS
      });
      
      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0].privacy.consentTypes).toContain('analytics');
      
      // 4. Revoke consent
      await consentService.revokeConsent(userId, ['analytics']);
      
      // 5. Attempt access without consent
      const response2 = await request(app)
        .get('/api/analytics/personal')
        .set('Authorization', `Bearer ${getTestToken(userId)}`)
        .expect(403);
      
      expect(response2.body.error).toContain('consent');
      
      // 6. Verify data deletion scheduled
      await PrivacyTestUtils.waitForEventProcessing();
      
      const deletionTasks = await taskQueue.getTasks({
        userId,
        type: 'delete_user_data'
      });
      
      expect(deletionTasks.some(
        t => t.payload.dataType === 'writing_analytics'
      )).toBe(true);
      
      // 7. Verify privacy health
      const healthReport = await privacyMonitor.monitorPrivacyHealth();
      expect(healthReport.overallHealth).toBeGreaterThan(0.8);
    });
  });
  
  describe('Anonymization Pipeline', () => {
    it('should properly anonymize dataset for research', async () => {
      // Create test dataset
      const students = await createTestStudents(20);
      const submissions = await createTestSubmissions(students);
      
      // Apply k-anonymity (k=5)
      const anonymizedData = await kAnonymityService.ensureKAnonymity(
        submissions,
        5,
        ['ageGroup', 'location', 'educationLevel']
      );
      
      // Verify k-anonymity
      const groups = groupBy(
        anonymizedData.data,
        item => `${item.ageGroup}-${item.location}-${item.educationLevel}`
      );
      
      Object.values(groups).forEach(group => {
        expect(group.length).toBeGreaterThanOrEqual(5);
      });
      
      // Apply differential privacy to statistics
      const stats = await differentialPrivacy.computePrivateStatistics(
        anonymizedData.data,
        { epsilon: 1.0 }
      );
      
      // Verify noise was added
      const trueAverage = mean(submissions.map(s => s.score));
      const privateAverage = stats.averageScore;
      
      expect(Math.abs(trueAverage - privateAverage)).toBeLessThan(10);
      
      // Verify no identifying information remains
      anonymizedData.data.forEach(record => {
        PrivacyTestUtils.assertAnonymized(record, [
          'studentId',
          'name',
          'email',
          'exactAge'
        ]);
      });
    });
  });
});
```

## Implementation Guidelines

### Getting Started

1. **Assess Privacy Requirements**
   - Identify sensitive data types
   - Determine consent requirements
   - Plan anonymization strategies
   - Design audit requirements

2. **Implement Core Patterns**
   - Start with privacy context and consent middleware
   - Add privacy-aware repositories
   - Implement audit logging
   - Set up basic anonymization

3. **Progressive Enhancement**
   - Add differential privacy for analytics
   - Implement k-anonymity for datasets
   - Build secure deletion pipelines
   - Create privacy monitoring

4. **Testing Strategy**
   - Unit test privacy functions
   - Integration test consent flows
   - End-to-end privacy scenarios
   - Regular privacy audits

### Best Practices

1. **Privacy by Design**
   - Consider privacy in initial design
   - Minimize data collection
   - Implement strong defaults
   - Make privacy controls visible

2. **Transparency**
   - Clear consent requests
   - Understandable privacy policies
   - Accessible privacy controls
   - Regular privacy reports

3. **Security Integration**
   - Encrypt sensitive data
   - Secure key management
   - Access control integration
   - Regular security reviews

4. **Compliance**
   - Map to regulations (GDPR, COPPA, FERPA)
   - Document data flows
   - Maintain audit trails
   - Regular compliance checks

## Next Steps

1. Review existing services for privacy gaps
2. Implement privacy patterns incrementally
3. Create privacy documentation for users
4. Establish privacy review process
5. Set up privacy monitoring dashboards
6. Train team on privacy practices
7. Regular privacy audits and improvements