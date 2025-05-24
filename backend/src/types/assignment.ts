import { Types } from 'mongoose';

/**
 * Learning Objective Interface
 * Represents a specific learning goal with Bloom's taxonomy categorization
 */
export interface ILearningObjective {
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
export interface IWritingStage {
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
export interface IWritingRequirements {
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
export interface ICollaborationSettings {
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
export interface IVersionControlSettings {
  autoSaveInterval: number; // in seconds
  createVersionOnSubmit: boolean;
  allowVersionRevert: boolean;
  trackAllChanges: boolean;
}

/**
 * AI Stage-Specific Settings Interface
 * Defines AI assistance rules for individual writing stages
 */
export interface IAIStageSettings {
  stageId: string;
  allowedTypes: string[];
  boundaryLevel: 'strict' | 'moderate' | 'permissive';
  customPrompts: string[];
}

/**
 * AI Settings Interface
 * Comprehensive AI integration configuration with educational boundaries
 */
export interface IAISettings {
  enabled: boolean;
  globalBoundary: 'strict' | 'moderate' | 'permissive';
  allowedAssistanceTypes: ('grammar' | 'style' | 'structure' | 'research' | 'citations' | 'brainstorming' | 'outlining')[];
  requireReflection: boolean;
  reflectionPrompts: string[];
  stageSpecificSettings: IAIStageSettings[];
}

/**
 * Grading Rubric Criteria Interface
 * Individual criterion in a grading rubric
 */
export interface IGradingCriteria {
  criteria: string;
  points: number;
  description: string;
}

/**
 * Grading Configuration Interface
 * Complete grading and assessment configuration
 */
export interface IGradingSettings {
  enabled: boolean;
  totalPoints?: number;
  rubric?: IGradingCriteria[];
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
 * Complete Assignment Interface
 * Full assignment document structure for the educational writing platform
 */
export interface IAssignmentDocument {
  _id: Types.ObjectId;
  title: string;
  description: string;
  instructions: string;
  course: Types.ObjectId;
  instructor: Types.ObjectId;
  
  // Assignment Configuration
  type: AssignmentType;
  dueDate?: Date;
  allowLateSubmissions: boolean;
  maxCollaborators?: number;
  
  // Writing Requirements
  requirements: IWritingRequirements;
  
  // Collaboration Settings
  collaboration: ICollaborationSettings;
  
  // Version Control Settings
  versionControl: IVersionControlSettings;
  
  // Learning Objectives (Educational Focus)
  learningObjectives: ILearningObjective[];

  // Writing Process Stages (Scaffold Learning)
  writingStages: IWritingStage[];

  // AI Integration (Educational Boundaries)
  aiSettings: IAISettings;
  
  // Assignment Status
  status: AssignmentStatus;
  publishedAt?: Date;
  
  // Grading and Feedback
  grading: IGradingSettings;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Assignment Creation Input Interface
 * Data required to create a new assignment
 */
export interface ICreateAssignmentInput {
  title: string;
  description: string;
  instructions: string;
  courseId: string;
  type?: AssignmentType;
  dueDate?: Date;
  allowLateSubmissions?: boolean;
  maxCollaborators?: number;
  requirements?: Partial<IWritingRequirements>;
  collaboration?: Partial<ICollaborationSettings>;
  versionControl?: Partial<IVersionControlSettings>;
  learningObjectives?: ILearningObjective[];
  writingStages?: IWritingStage[];
  aiSettings?: Partial<IAISettings>;
  grading?: Partial<IGradingSettings>;
}

/**
 * Assignment Update Input Interface
 * Data that can be updated on an existing assignment
 */
export interface IUpdateAssignmentInput {
  title?: string;
  description?: string;
  instructions?: string;
  type?: AssignmentType;
  dueDate?: Date;
  allowLateSubmissions?: boolean;
  maxCollaborators?: number;
  requirements?: Partial<IWritingRequirements>;
  collaboration?: Partial<ICollaborationSettings>;
  versionControl?: Partial<IVersionControlSettings>;
  learningObjectives?: ILearningObjective[];
  writingStages?: IWritingStage[];
  aiSettings?: Partial<IAISettings>;
  grading?: Partial<IGradingSettings>;
  status?: AssignmentStatus;
}