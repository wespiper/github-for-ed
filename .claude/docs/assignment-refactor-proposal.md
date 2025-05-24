# Assignment Architecture Refactor: Many-to-Many Relationships

## Current Issue
The current many-to-one relationship (Assignment → Course) prevents educators from:
- Reusing assignments across multiple courses 
- Creating assignment templates for different semesters
- Efficiently managing similar assignments across course sections

## Proposed Architecture

### **Model 1: AssignmentTemplate** (Reusable Content)
```typescript
interface IAssignmentTemplate {
  _id: ObjectId;
  title: string;
  description: string;
  instructions: string;
  instructor: ObjectId; // Template owner
  
  // Reusable Educational Content
  learningObjectives: LearningObjective[];
  writingStages: WritingStage[];
  aiSettings: AISettings;
  requirements: Requirements;
  collaboration: CollaborationSettings;
  versionControl: VersionControlSettings;
  grading: GradingSettings;
  
  // Template Metadata
  status: 'draft' | 'published' | 'archived';
  tags: string[]; // For organization
  isPublic: boolean; // Share with other educators
  usageCount: number; // Track popularity
  
  createdAt: Date;
  updatedAt: Date;
}
```

### **Model 2: CourseAssignment** (Course-Specific Deployment)
```typescript
interface ICourseAssignment {
  _id: ObjectId;
  template: ObjectId; // Reference to AssignmentTemplate
  course: ObjectId;
  instructor: ObjectId; // May differ from template owner
  
  // Course-Specific Overrides
  dueDate?: Date;
  customInstructions?: string; // Additional course-specific instructions
  allowLateSubmissions: boolean;
  maxCollaborators?: number;
  
  // Course Deployment Status
  status: 'draft' | 'published' | 'in_progress' | 'completed' | 'archived';
  publishedAt?: Date;
  
  // Course-Specific Settings (Optional Overrides)
  courseSpecificRequirements?: Partial<Requirements>;
  courseSpecificDueStages?: {
    stageId: string;
    dueDate: Date;
  }[];
  
  createdAt: Date;
  updatedAt: Date;
}
```

## Benefits

### **For Educators:**
1. **Create Once, Use Many**: Build an assignment template and deploy to multiple courses
2. **Consistent Quality**: Reuse well-tested assignments with proven learning objectives
3. **Easy Updates**: Update template to improve future deployments
4. **Course Flexibility**: Adjust due dates and requirements per course without affecting template

### **For Students:**
1. **Consistent Experience**: Same high-quality assignments across similar courses
2. **Progressive Learning**: Templates can be adapted for different skill levels per course

### **For Platform:**
1. **Assignment Library**: Build a library of high-quality assignment templates
2. **Sharing Economy**: Educators can share templates with colleagues
3. **Analytics**: Track which templates are most effective
4. **Performance**: Smaller, focused data models

## Migration Strategy

### **Phase 1: Add New Models (Non-Breaking)**
1. Create `AssignmentTemplate` and `CourseAssignment` models
2. Add new API endpoints for template management
3. Build new UI for template creation and course assignment

### **Phase 2: Dual Mode (Backward Compatible)**
1. Keep existing `Assignment` model working
2. Add "Convert to Template" functionality for existing assignments
3. Add "Deploy Template" functionality for new workflow

### **Phase 3: Migration (Gradual)**
1. Migrate existing assignments to new architecture
2. Update all frontend components to use new models
3. Deprecate old endpoints with proper warnings

### **Phase 4: Cleanup**
1. Remove old `Assignment` model
2. Remove deprecated endpoints
3. Optimize database indexes for new structure

## UI/UX Changes Needed

### **New Workflow:**
```
Educator Dashboard
├── My Assignment Templates
│   ├── Create New Template
│   ├── Import from Library
│   └── My Templates List
├── Course Assignments
│   ├── Deploy Template to Course
│   ├── Course-Specific Settings
│   └── Active Assignments by Course
└── Assignment Library (Browse/Share)
```

### **Assignment Creation Options:**
1. **Create New Template** → Full wizard for reusable content
2. **Deploy Template** → Quick course-specific settings
3. **One-Time Assignment** → Convert to template later (optional)

## Database Schema Changes

### **New Collections:**
- `assignmentTemplates`
- `courseAssignments`

### **Preserved Data:**
- All learning objectives, writing stages, AI settings
- Instructor ownership and permissions
- Rich assignment content and metadata

### **Enhanced Relationships:**
```
AssignmentTemplate (1) → CourseAssignment (Many)
Course (1) → CourseAssignment (Many) 
Instructor (1) → AssignmentTemplate (Many)
Instructor (1) → CourseAssignment (Many)
```

## Implementation Priority

### **High Priority (Core Functionality):**
1. AssignmentTemplate model and basic CRUD
2. CourseAssignment model and deployment
3. Updated assignment creation UI

### **Medium Priority (Enhanced Features):**
1. Template library and sharing
2. Analytics and usage tracking
3. Advanced course-specific overrides

### **Low Priority (Future Enhancements):**
1. Public template marketplace
2. Template versioning and history
3. Collaborative template development

This architecture provides the flexibility educators need while maintaining the educational rigor and learning objectives integration that makes this platform valuable.