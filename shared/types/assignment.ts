/**
 * Shared Assignment Types for GitHub for Education
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
 * Citation Style Enum
 * Supported academic citation formats
 */
export type CitationStyle = 'APA' | 'MLA' | 'Chicago' | 'IEEE';

/**
 * Bloom's Taxonomy Levels
 * Cognitive complexity levels for learning objectives
 */
export type BloomsLevel = 1 | 2 | 3 | 4 | 5 | 6;

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
  _id: string;
  title: string;
  description: string;
  instructions: string;
  course: {
    _id: string;
    title: string;
    students?: string[];
  };
  instructor: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  
  // Assignment Configuration
  type: AssignmentType;
  dueDate?: string; // ISO date string for frontend compatibility
  allowLateSubmissions: boolean;
  maxCollaborators?: number;
  
  // Writing Requirements
  requirements: WritingRequirements;
  
  // Collaboration Settings
  collaboration: CollaborationSettings;
  
  // Version Control Settings
  versionControl: VersionControlSettings;
  
  // Learning Objectives (Educational Focus)
  learningObjectives: LearningObjective[];

  // Writing Process Stages (Scaffold Learning)
  writingStages: WritingStage[];

  // AI Integration (Educational Boundaries)
  aiSettings: AISettings;
  
  // Assignment Status
  status: AssignmentStatus;
  publishedAt?: string; // ISO date string
  
  // Grading and Feedback
  grading: GradingSettings;
  
  // Computed fields (from virtuals)
  submissionCount?: number;
  isOverdue?: boolean;
  daysRemaining?: number | null;
  
  // Metadata
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
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
  _id: string;
  title: string;
  description: string;
  instructions: string;
  instructor: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  type: AssignmentType;
  requirements: WritingRequirements;
  collaboration: CollaborationSettings;
  versionControl: VersionControlSettings;
  learningObjectives: LearningObjective[];
  writingStages: WritingStage[];
  aiSettings: AISettings;
  grading: GradingSettings;
  status: 'draft' | 'published' | 'archived';
  tags: string[];
  isPublic: boolean;
  usageCount: number;
  deploymentCount?: number;
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
 * Assignment Filters Interface
 * Query parameters for filtering assignments
 */
export interface AssignmentFilters {
  courseId?: string;
  instructorId?: string;
  status?: AssignmentStatus;
  type?: AssignmentType;
  bloomsLevel?: BloomsLevel;
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
  bloomsLevel?: BloomsLevel;
  tags?: string[];
  search?: string;
  type?: AssignmentType;
}