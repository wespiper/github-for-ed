// Repository Interfaces
export * from './BaseRepository';
export * from './StudentRepository';
export * from './AssignmentRepository';
export * from './AIInteractionRepository';

// New privacy-aware repositories
export * from './DocumentRepository';
export * from './LearningAnalyticsRepository';
export * from './InterventionRepository';

// Re-export common types for convenience
export type { 
  FindManyOptions, 
  OrderByOptions, 
  CountOptions, 
  CreateData, 
  UpdateData, 
  TransactionContext 
} from './BaseRepository';

export type { Student } from './StudentRepository';
export type { AssignmentWithRelations } from './AssignmentRepository';
export type { AIInteractionWithRelations } from './AIInteractionRepository';
export type { DocumentWithRelations } from './DocumentRepository';
export type { StudentAnalytics, CourseAnalytics } from './LearningAnalyticsRepository';
export type { Intervention, InterventionAnalytics } from './InterventionRepository';