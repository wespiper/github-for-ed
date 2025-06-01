// Repository Interfaces
export * from './BaseRepository';
export * from './StudentRepository';
export * from './AssignmentRepository';
export * from './AIInteractionRepository';

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