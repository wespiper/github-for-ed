# Phase 2: Service Layer Implementation

## 🎯 **Overview**
Extract business logic from route handlers into dedicated service classes for better separation of concerns, testability, and maintainability.

## 🏗️ **Current State Assessment**
✅ **Completed Phase 1**: Shared types library implemented
❌ **Current Issues**: Business logic mixed with HTTP handling in routes
❌ **Testing Gap**: Difficult to unit test business logic
❌ **Maintainability**: Code duplication across route handlers

## 📋 **Phase 2A: Core Services (Week 1)**

### **1. AssignmentService Implementation**
**Priority**: HIGH
**Estimated Time**: 2-3 days

```typescript
// backend/src/services/AssignmentService.ts
export class AssignmentService {
  static async createAssignment(data: CreateAssignmentInput, userId: string): Promise<Assignment> {
    // Validation logic
    // Business rule enforcement
    // Data transformation
    // Persistence logic
  }
  
  static async validateEducationalRequirements(assignment: Assignment): Promise<ValidationResult> {
    // Learning objectives weights sum to 100%
    // Writing stages have unique orders
    // AI settings reference valid stages
  }
  
  static async publishAssignment(assignmentId: string, userId: string): Promise<Assignment> {
    // Authorization checks
    // Publication rules
    // Notification triggers
  }
}
```

**Extract from**: `routes/assignments.ts` lines 10-104, 222-270, 397-430

### **2. AuthService Implementation**
**Priority**: HIGH  
**Estimated Time**: 1-2 days

```typescript
// backend/src/services/AuthService.ts
export class AuthService {
  static async registerUser(data: RegisterInput): Promise<AuthResponse> {
    // Validation rules
    // Password hashing
    // User creation
    // Token generation
  }
  
  static async authenticateUser(data: LoginInput): Promise<AuthResponse> {
    // Credential validation
    // Token generation
    // Login tracking
  }
  
  static async updateUserProfile(userId: string, data: UpdateProfileInput): Promise<User> {
    // Authorization checks
    // Data validation
    // Profile updates
  }
}
```

**Extract from**: `routes/auth.ts` lines 22-85, 88-137, 164-206

### **3. CourseService Implementation**
**Priority**: MEDIUM
**Estimated Time**: 1-2 days

```typescript
// backend/src/services/CourseService.ts
export class CourseService {
  static async createCourse(data: CreateCourseInput, instructorId: string): Promise<Course> {
    // Validation logic
    // Instructor authorization
    // Course creation
  }
  
  static async enrollStudent(courseId: string, studentId: string): Promise<void> {
    // Enrollment rules
    // Capacity checks
    // Permission validation
  }
  
  static async getStudentProgress(courseId: string, studentId: string): Promise<StudentProgress> {
    // Progress calculation
    // Assignment completion tracking
    // Grade aggregation
  }
}
```

## 📋 **Phase 2B: Educational Services (Week 2)**

### **4. LearningAnalyticsService**
**Priority**: MEDIUM
**Educational Focus**: HIGH

```typescript
// backend/src/services/LearningAnalyticsService.ts
export class LearningAnalyticsService {
  static async trackWritingProgress(submissionId: string, metrics: WritingMetrics): Promise<void> {
    // Word count tracking
    // Version comparison
    // Time spent analysis
    // Collaboration metrics
  }
  
  static async generateLearningInsights(studentId: string, courseId: string): Promise<LearningInsights> {
    // Writing pattern analysis
    // Bloom's taxonomy progress
    // AI assistance usage
    // Peer collaboration patterns
  }
  
  static async identifyAtRiskStudents(courseId: string): Promise<StudentRisk[]> {
    // Engagement metrics
    // Progress indicators
    // Early warning system
  }
}
```

### **5. AIBoundaryService**
**Priority**: HIGH (Educational Core)
**Educational Focus**: CRITICAL

```typescript
// backend/src/services/AIBoundaryService.ts
export class AIBoundaryService {
  static async validateAIUsage(request: AIRequest, stageSettings: AIStageSettings): Promise<boolean> {
    // Stage-specific boundary checks
    // Assistance type validation
    // Educational appropriateness
  }
  
  static async logAIInteraction(interaction: AIInteraction): Promise<void> {
    // Usage tracking
    // Educational impact measurement
    // Compliance monitoring
  }
  
  static async generateReflectionPrompts(stage: WritingStage): Promise<string[]> {
    // Context-aware prompts
    // Critical thinking encouragement
    // Learning objective alignment
  }
}
```

### **6. AssessmentService**
**Priority**: MEDIUM
**Educational Focus**: HIGH

```typescript
// backend/src/services/AssessmentService.ts
export class AssessmentService {
  static async createRubric(assignmentId: string, criteria: GradingCriteria[]): Promise<Rubric> {
    // Rubric validation
    // Learning objective alignment
    // Point distribution checks
  }
  
  static async enablePeerReview(assignmentId: string, settings: PeerReviewSettings): Promise<void> {
    // Peer matching logic
    // Review assignment
    // Bias prevention
  }
  
  static async calculateProcessGrade(submissionId: string): Promise<ProcessGrade> {
    // Version history analysis
    // Engagement scoring
    // Growth measurement
  }
}
```

## 🛠️ **Implementation Strategy**

### **Step 1: Create Service Directory Structure**
```
backend/src/services/
├── AssignmentService.ts
├── AuthService.ts
├── CourseService.ts
├── LearningAnalyticsService.ts
├── AIBoundaryService.ts
├── AssessmentService.ts
├── __tests__/
│   ├── AssignmentService.test.ts
│   ├── AuthService.test.ts
│   └── ...
└── index.ts (export all services)
```

### **Step 2: Extract Business Logic Pattern**
1. **Identify** business logic in route handlers
2. **Extract** to service static methods
3. **Add** comprehensive validation
4. **Update** routes to use service methods
5. **Write** unit tests for services

### **Step 3: Service Method Pattern**
```typescript
export class ExampleService {
  static async methodName(params: InputType): Promise<OutputType> {
    try {
      // 1. Input validation
      this.validateInput(params);
      
      // 2. Authorization checks
      await this.checkPermissions(params.userId, params.resourceId);
      
      // 3. Business logic
      const result = await this.performBusinessLogic(params);
      
      // 4. Side effects (notifications, logs)
      await this.handleSideEffects(result);
      
      return result;
    } catch (error) {
      // Centralized error handling
      throw this.handleServiceError(error);
    }
  }
}
```

## 🎓 **Educational Platform Benefits**

### **Process Visibility**
- **Analytics Service**: Track writing development over time
- **Assessment Service**: Measure process vs. product
- **Metrics**: Version comparison, collaboration patterns

### **Bounded AI Integration**
- **Boundary Service**: Enforce educational constraints
- **Reflection Tracking**: Ensure critical thinking
- **Stage-Specific Rules**: Context-appropriate assistance

### **Scalable Pedagogy**
- **Flexible Rubrics**: Support diverse assessment approaches
- **Peer Review**: Enable collaborative learning
- **Learning Objectives**: Maintain educational focus

## ⚡ **Immediate Action Items**

### **Day 1-2: AssignmentService**
1. Create `backend/src/services/AssignmentService.ts`
2. Extract assignment creation logic from `routes/assignments.ts:11-104`
3. Add educational validation (learning objectives, writing stages)
4. Update route to use service method
5. Write unit tests

### **Day 3-4: AuthService**
1. Create `backend/src/services/AuthService.ts`
2. Extract registration/login logic from `routes/auth.ts`
3. Add password policies and user validation
4. Update routes to use service methods
5. Write unit tests

### **Day 5: Integration & Testing**
1. Test service integration with existing routes
2. Verify educational workflows still function
3. Add integration tests for complete user flows
4. Update API documentation

## 🚀 **Success Metrics**

### **Technical Metrics**
- [ ] 100% of business logic extracted from routes
- [ ] 80%+ test coverage for service methods
- [ ] Zero business logic in route handlers
- [ ] All educational validations centralized

### **Educational Metrics**
- [ ] Learning objective validation working
- [ ] AI boundary enforcement functional
- [ ] Assessment workflows preserved
- [ ] Writing process tracking intact

## 🔄 **Ready to Start?**

When ready to begin Phase 2, we'll start with:
1. **AssignmentService** - Most critical for educational workflows
2. **Extract** complex assignment creation logic
3. **Add** comprehensive educational validation
4. **Test** thoroughly to ensure educational features work
5. **Move** to AuthService once assignments are solid

This systematic approach ensures each service builds educational value while improving code quality and maintainability.