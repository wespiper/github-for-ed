/**
 * Shared Assignment Types for Scribe Tree
 * 
 * This file contains all assignment-related type definitions shared between
 * frontend and backend to ensure consistency and eliminate duplication.
 */

/**
 * Learning Objective Interface
 * Represents a specific learning goal with Bloom's taxonomy categorization
 */
export interface LearningObjective {
  id: string;
  description: string;
  category: 'knowledge' | 'comprehension' | 'application' | 'analysis' | 'synthesis' | 'evaluation';
  bloomsLevel: 1 | 2 | 3 | 4 | 5 | 6;
  assessmentCriteria: string[];
  weight: number; // percentage of overall grade (0-100)
  subject?: string; // subject area for preset objectives
}

/**
 * Bloom's Taxonomy Level Interface
 * Represents a cognitive level with associated presets
 */
export interface BloomsLevel {
  level: number;
  name: string;
  description: string;
  presets: LearningObjective[];
  count: number;
}

/**
 * Subject Area Interface
 * Represents an academic subject with learning objectives
 */
export interface SubjectArea {
  key: string;
  name: string;
  presets: LearningObjective[];
  count: number;
}

/**
 * Writing Stage Interface
 * Defines a specific stage in the writing process with constraints
 */
export interface WritingStage {
  id: string;
  name: string;
  description: string;
  order: number;
  required: boolean;
  minWords?: number;
  maxWords?: number;
  durationDays?: number;
  allowAI: boolean;
  aiAssistanceLevel: 'none' | 'minimal' | 'moderate' | 'comprehensive';
}

/**
 * Writing Requirements Interface
 * Defines constraints and expectations for the assignment content
 */
export interface WritingRequirements {
  minWords?: number;
  maxWords?: number;
  requiredSections?: string[];
  citationStyle?: 'APA' | 'MLA' | 'Chicago' | 'IEEE';
  allowedResources?: string[];
}

/**
 * Collaboration Settings Interface
 * Controls how students can work together on assignments
 */
export interface CollaborationSettings {
  enabled: boolean;
  allowRealTimeEditing: boolean;
  allowComments: boolean;
  allowSuggestions: boolean;
  requireApprovalForChanges: boolean;
}

/**
 * Version Control Settings Interface
 * Manages how document versions are created and tracked
 */
export interface VersionControlSettings {
  autoSaveInterval: number; // in seconds
  createVersionOnSubmit: boolean;
  allowVersionRevert: boolean;
  trackAllChanges: boolean;
}

/**
 * AI Stage-Specific Settings Interface
 * Defines AI assistance rules for individual writing stages
 */
export interface AIStageSettings {
  stageId: string;
  allowedTypes: string[];
  boundaryLevel: 'strict' | 'moderate' | 'permissive';
  customPrompts: string[];
}

/**
 * AI Settings Interface
 * Comprehensive AI integration configuration with educational boundaries
 */
export interface AISettings {
  enabled: boolean;
  globalBoundary: 'strict' | 'moderate' | 'permissive';
  allowedAssistanceTypes: ('grammar' | 'style' | 'structure' | 'research' | 'citations' | 'brainstorming' | 'outlining')[];
  requireReflection: boolean;
  reflectionPrompts: string[];
  stageSpecificSettings: AIStageSettings[];
}

/**
 * Grading Rubric Criteria Interface
 * Individual criterion in a grading rubric
 */
export interface GradingCriteria {
  criteria: string;
  points: number;
  description: string;
}

/**
 * Grading Configuration Interface
 * Complete grading and assessment configuration
 */
export interface GradingSettings {
  enabled: boolean;
  totalPoints?: number;
  rubric?: GradingCriteria[];
  allowPeerReview: boolean;
}

/**
 * Assignment Type Enum
 * Defines the collaboration model for the assignment
 */
export type AssignmentType = 'individual' | 'collaborative' | 'peer-review';

/**
 * Assignment Status Enum
 * Tracks the lifecycle state of an assignment
 */
export type AssignmentStatus = 'draft' | 'published' | 'in_progress' | 'completed' | 'archived';

/**
 * Submission Status Enum
 * Tracks the lifecycle state of a student submission
 */
export type SubmissionStatus = 'not_started' | 'draft' | 'in_progress' | 'submitted' | 'returned' | 'graded';

/**
 * Citation Style Enum
 * Supported academic citation formats
 */
export type CitationStyle = 'APA' | 'MLA' | 'Chicago' | 'IEEE';

/**
 * Bloom's Taxonomy Levels
 * Cognitive complexity levels for learning objectives
 */
export type BloomsTaxonomyLevel = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Learning Objective Categories
 * Bloom's taxonomy cognitive categories
 */
export type LearningObjectiveCategory = 
  | 'knowledge' 
  | 'comprehension' 
  | 'application' 
  | 'analysis' 
  | 'synthesis' 
  | 'evaluation';

/**
 * AI Assistance Levels
 * Graduated levels of AI support for writing stages
 */
export type AIAssistanceLevel = 'none' | 'minimal' | 'moderate' | 'comprehensive';

/**
 * AI Boundary Levels
 * Educational boundary enforcement levels for AI integration
 */
export type AIBoundaryLevel = 'strict' | 'moderate' | 'permissive';

/**
 * AI Assistance Types
 * Specific types of AI assistance available to students
 */
export type AIAssistanceType = 
  | 'grammar' 
  | 'style' 
  | 'structure' 
  | 'research' 
  | 'citations' 
  | 'brainstorming' 
  | 'outlining';

/**
 * Assignment Interface (Full Document)
 * Complete assignment structure for database storage and API responses
 */
export interface Assignment {
  id: string;
  templateId?: string;
  courseId: string;
  instructorId: string;
  title: string;
  instructions: string;
  requirements: Record<string, any>;
  writingStages: Record<string, any>;
  learningObjectives: Record<string, any>;
  aiSettings: Record<string, any>;
  gradingCriteria?: Record<string, any>;
  dueDate?: string; // ISO date string
  stageDueDates?: Record<string, any>;
  status: string;
  type: string;
  collaborationSettings: Record<string, any>;
  versionControlSettings: Record<string, any>;
  
  // Computed/virtual properties for frontend compatibility
  isOverdue?: boolean;
  versionControl?: Record<string, any>; // Alias for versionControlSettings
  
  // Relations when populated
  template?: AssignmentTemplate;
  course?: {
    id: string;
    title: string;
  };
  instructor?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

/**
 * Assignment Creation Input Interface
 * Data required to create a new assignment
 */
export interface CreateAssignmentInput {
  title: string;
  description: string;
  instructions: string;
  courseId: string;
  type?: AssignmentType;
  dueDate?: string; // ISO date string
  allowLateSubmissions?: boolean;
  maxCollaborators?: number;
  requirements?: Partial<WritingRequirements>;
  collaboration?: Partial<CollaborationSettings>;
  versionControl?: Partial<VersionControlSettings>;
  learningObjectives?: LearningObjective[];
  writingStages?: WritingStage[];
  aiSettings?: Partial<AISettings>;
  grading?: Partial<GradingSettings>;
}

/**
 * Assignment Update Input Interface
 * Data that can be updated on an existing assignment
 */
export interface UpdateAssignmentInput {
  title?: string;
  description?: string;
  instructions?: string;
  type?: AssignmentType;
  dueDate?: string; // ISO date string
  allowLateSubmissions?: boolean;
  maxCollaborators?: number;
  requirements?: Partial<WritingRequirements>;
  collaboration?: Partial<CollaborationSettings>;
  versionControl?: Partial<VersionControlSettings>;
  learningObjectives?: LearningObjective[];
  writingStages?: WritingStage[];
  aiSettings?: Partial<AISettings>;
  grading?: Partial<GradingSettings>;
  status?: AssignmentStatus;
}

/**
 * Assignment Template Interface
 * Template structure for reusable assignments
 */
export interface AssignmentTemplate {
  id: string;
  title: string;
  description?: string;
  instructions: string;
  instructorId?: string;
  requirements: Record<string, any>;
  writingStages: Record<string, any>;
  learningObjectives: Record<string, any>;
  aiSettings: Record<string, any>;
  gradingCriteria?: Record<string, any>;
  isPublic: boolean;
  usageCount: number;
  tags: string[];
  status?: string; // For filtering/display
  type?: string; // Assignment type
  
  // Relations when populated
  instructor?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  
  createdAt: string;
  updatedAt: string;
}

/**
 * Create Assignment Template Input Interface
 */
export interface CreateAssignmentTemplateInput {
  title: string;
  description: string;
  instructions: string;
  type?: AssignmentType;
  requirements?: Partial<WritingRequirements>;
  collaboration?: Partial<CollaborationSettings>;
  versionControl?: Partial<VersionControlSettings>;
  learningObjectives?: LearningObjective[];
  writingStages?: WritingStage[];
  aiSettings?: Partial<AISettings>;
  grading?: Partial<GradingSettings>;
  tags?: string[];
  isPublic?: boolean;
}

/**
 * Course Assignment Interface
 * Assignment as it appears in course contexts
 */
export interface CourseAssignment {
  id: string;
  templateId?: string;
  courseId: string;
  instructorId: string;
  title: string;
  instructions: string;
  requirements: Record<string, any>;
  writingStages: Record<string, any>;
  learningObjectives: Record<string, any>;
  aiSettings: Record<string, any>;
  gradingCriteria?: Record<string, any>;
  dueDate?: string;
  stageDueDates?: Record<string, any>;
  status: string;
  type: string;
  collaborationSettings: Record<string, any>;
  versionControlSettings: Record<string, any>;
  customInstructions?: string;
  courseSpecificRequirements?: Record<string, any>;
  allowLateSubmissions?: boolean;
  
  // Relations when populated
  template?: {
    id: string;
    title: string;
    description?: string;
    learningObjectives: Record<string, any>;
    writingStages: Record<string, any>;
  };
  course?: {
    id: string;
    title: string;
  };
  instructor?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  
  createdAt: string;
  updatedAt: string;
}

/**
 * Assignment Submission Interface
 * Student submission for an assignment
 */
export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  authorId: string;
  title?: string;
  content?: string;
  wordCount: number;
  status: SubmissionStatus;
  submittedAt?: string;
  collaborationSettings: Record<string, any>;
  majorMilestones: Record<string, any>;
  analytics: Record<string, any>;
  grade?: Record<string, any>;
  aiInteractions: Record<string, any>;
  
  // Relations when populated
  assignment?: Assignment;
  author?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  
  createdAt: string;
  updatedAt: string;
}

/**
 * Assignment Filters Interface
 * Query parameters for filtering assignments
 */
export interface AssignmentFilters {
  courseId?: string;
  instructorId?: string;
  status?: AssignmentStatus;
  type?: AssignmentType;
  bloomsLevel?: BloomsTaxonomyLevel;
  category?: LearningObjectiveCategory;
  hasAI?: boolean;
  hasCollaboration?: boolean;
  dueAfter?: string; // ISO date string
  dueBefore?: string; // ISO date string;
}

/**
 * Template Filters Interface
 * Query parameters for filtering assignment templates
 */
export interface TemplateFilters {
  status?: 'draft' | 'published' | 'archived';
  category?: LearningObjectiveCategory;
  bloomsLevel?: BloomsTaxonomyLevel;
  tags?: string[];
  search?: string;
  type?: AssignmentType;
}