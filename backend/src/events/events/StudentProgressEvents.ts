import { Event } from '../EventBus';

/**
 * Event fired when a student's progress is updated
 */
export interface StudentProgressUpdatedEvent extends Event {
  type: 'student.progress.updated';
  payload: {
    studentIdHash: string; // Hashed for privacy
    courseId: string;
    assignmentId?: string;
    progressType: 'writing' | 'reflection' | 'submission' | 'revision';
    metrics: {
      wordsWritten?: number;
      timeSpent?: number;
      completionPercentage?: number;
      reflectionQuality?: number;
      aiInteractionCount?: number;
    };
    previousState?: Record<string, any>;
    currentState: Record<string, any>;
  };
  privacyContext: {
    dataMinimized: boolean;
    consentVerified: boolean;
    educationalPurpose: string;
    retentionPeriod?: number; // days
  };
}

/**
 * Event fired when student learning objectives are achieved
 */
export interface LearningObjectiveAchievedEvent extends Event {
  type: 'student.objective.achieved';
  payload: {
    studentIdHash: string; // Hashed for privacy
    courseId: string;
    objectiveId: string;
    achievementLevel: 'basic' | 'proficient' | 'advanced';
    evidenceType: 'assignment' | 'reflection' | 'assessment';
    evidenceId: string;
  };
  privacyContext: {
    dataMinimized: boolean;
    consentVerified: boolean;
    educationalPurpose: string;
    retentionPeriod?: number; // days
  };
}

/**
 * Event fired when student struggle is detected
 */
export interface StudentStruggleDetectedEvent extends Event {
  type: 'student.struggle.detected';
  payload: {
    studentIdHash: string; // Hashed for privacy
    courseId: string;
    assignmentId?: string;
    struggleType: 'cognitive_overload' | 'writing_block' | 'concept_confusion' | 'time_management';
    severity: 'low' | 'medium' | 'high';
    indicators: string[];
    recommendedInterventions?: string[];
  };
  privacyContext: {
    dataMinimized: boolean;
    consentVerified: boolean;
    educationalPurpose: string;
    retentionPeriod?: number; // days
    sensitivityLevel: 'normal' | 'sensitive' | 'highly-sensitive';
  };
}