# Privacy Patterns Quick Reference

## Essential Privacy Patterns for Developers

### 1. Privacy Context Required

**Always pass `PrivacyContext` to repository methods:**

```typescript
// ✅ Correct - Privacy context included
const analytics = await this.analyticsRepo.getStudentAnalytics(
  studentId, 
  privacyContext,
  { assignmentId }
);

// ❌ Wrong - No privacy context
const analytics = await this.analyticsRepo.getStudentAnalytics(studentId);
```

### 2. Permission Checking Pattern

```typescript
private canAccessStudentData(privacyContext: PrivacyContext, studentId: string): boolean {
  // Educators and admins can access any student
  if (['educator', 'admin'].includes(privacyContext.requesterType)) {
    return true;
  }
  
  // Students can only access their own data
  if (privacyContext.requesterType === 'student' && privacyContext.requesterId === studentId) {
    return true;
  }
  
  return false;
}
```

### 3. Privacy Event Publishing

```typescript
async performOperation(studentId: string, privacyContext: PrivacyContext) {
  // 1. Check permissions
  if (!this.canPerformOperation(privacyContext, studentId)) {
    await this.publishPrivacyEvent('operation_denied', studentId, privacyContext);
    return null;
  }

  // 2. Log start
  await this.publishPrivacyEvent('operation_started', studentId, privacyContext);

  try {
    // 3. Perform operation
    const result = await this.doOperation(studentId, privacyContext);
    
    // 4. Log success
    await this.publishPrivacyEvent('operation_completed', studentId, privacyContext);
    return result;
  } catch (error) {
    // 5. Log error
    await this.publishPrivacyEvent('operation_error', studentId, privacyContext);
    throw error;
  }
}
```

### 4. Data Minimization

```typescript
private getDetailLevel(privacyContext: PrivacyContext): 'full' | 'limited' | 'anonymous' {
  if (privacyContext.requesterType === 'admin') return 'full';
  if (privacyContext.requesterType === 'educator') return 'full';
  if (privacyContext.requesterType === 'student') return 'limited';
  return 'anonymous';
}

private filterDataByPrivacy(data: any, privacyContext: PrivacyContext) {
  const level = this.getDetailLevel(privacyContext);
  
  switch (level) {
    case 'full':
      return data; // Full educational data
    case 'limited':
      return this.removeSensitiveFields(data); // Student's own data
    case 'anonymous':
      return this.aggregateOnly(data); // Statistical data only
    default:
      return null;
  }
}
```

### 5. Repository Integration Pattern

```typescript
export class PrivacyAwareService {
  constructor(
    private repository: RepositoryInterface,
    private eventBus: EventBus,
    private config: ServiceConfig
  ) {}

  async getData(id: string, privacyContext: PrivacyContext) {
    // Repository handles privacy filtering
    return await this.repository.findWithPrivacy(id, privacyContext);
  }
}
```

## Access Control Quick Reference

| Operation | Student | Educator | Admin | System |
|-----------|---------|----------|-------|--------|
| Own data access | ✅ | ✅ | ✅ | ✅ |
| Other student data | ❌ | ✅ (course only) | ✅ | ✅ (with purpose) |
| Course analytics | ❌ | ✅ (own courses) | ✅ | ✅ |
| System analytics | ❌ | ❌ | ✅ | ✅ |
| Data modification | Own only | Course students | All | Automated only |

## Privacy Event Types

| Event | When to Use | Required Fields |
|-------|-------------|-----------------|
| `operation_started` | Beginning of any data access | `accessorId`, `purpose`, `educationalJustification` |
| `operation_completed` | Successful completion | `accessorId`, `dataScope.recordCount` |
| `operation_denied` | Access denied | `accessorId`, `reason` |
| `operation_error` | Error occurred | `accessorId`, `error` |

## Common Privacy Context Examples

```typescript
// Educator accessing course analytics
const educatorContext: PrivacyContext = {
  requesterId: 'educator_123',
  requesterType: 'educator',
  purpose: 'course progress monitoring',
  educationalJustification: 'Reviewing student progress for course adjustment',
  timestamp: new Date(),
  correlationId: 'req_abc123'
};

// Student accessing own data
const studentContext: PrivacyContext = {
  requesterId: 'student_456',
  requesterType: 'student',
  purpose: 'personal progress review',
  timestamp: new Date()
};

// System automated analysis
const systemContext: PrivacyContext = {
  requesterId: 'system',
  requesterType: 'system',
  purpose: 'automated intervention detection',
  educationalJustification: 'Early identification of students needing support',
  timestamp: new Date()
};
```

## Testing Patterns

```typescript
describe('Privacy-Aware Service', () => {
  beforeEach(() => {
    // Always reset privacy logs
    mockRepository.clearPrivacyLogs();
  });

  it('should log privacy operations', async () => {
    await service.analyzeData('student_1', mockPrivacyContext);
    
    const logs = mockRepository.getPrivacyLogs();
    expect(logs).toContainEqual(
      expect.objectContaining({
        operation: 'analyzeData',
        context: mockPrivacyContext
      })
    );
  });

  it('should deny unauthorized access', async () => {
    const unauthorizedContext = {
      requesterId: 'student_2',
      requesterType: 'student' as const,
      purpose: 'unauthorized access',
      timestamp: new Date()
    };

    await expect(
      service.analyzeData('student_1', unauthorizedContext)
    ).rejects.toThrow('Insufficient privacy permissions');
  });
});
```

## Common Mistakes to Avoid

❌ **Don't bypass privacy context:**
```typescript
// Wrong - direct repository access
const data = await repository.findById(id);
```

❌ **Don't forget error logging:**
```typescript
try {
  // operation
} catch (error) {
  // Missing: await this.publishPrivacyEvent('error', id, context);
  throw error;
}
```

❌ **Don't expose sensitive data in logs:**
```typescript
// Wrong - logs contain sensitive content
console.log('Processing document:', document.content);

// Right - log IDs only
console.log('Processing document ID:', document.id);
```

❌ **Don't assume permissions:**
```typescript
// Wrong - no permission check
async getData(studentId: string, privacyContext: PrivacyContext) {
  return await this.repository.find(studentId, privacyContext);
}

// Right - check first
async getData(studentId: string, privacyContext: PrivacyContext) {
  if (!this.canAccess(privacyContext, studentId)) {
    throw new Error('Access denied');
  }
  return await this.repository.find(studentId, privacyContext);
}
```

## Development Workflow

1. **Design Phase**
   - Identify what educational data is accessed
   - Define access control requirements
   - Plan privacy event logging

2. **Implementation Phase**
   - Add privacy context to all methods
   - Implement permission checking
   - Add privacy event publishing
   - Apply data minimization

3. **Testing Phase**
   - Test all access control scenarios
   - Verify privacy event publishing
   - Test with different requester types
   - Validate data minimization

4. **Documentation Phase**
   - Document privacy controls
   - Update API documentation
   - Add compliance notes