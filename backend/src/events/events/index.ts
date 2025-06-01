/**
 * Central export for all educational event types
 */

export * from './StudentProgressEvents';
export * from './AIInteractionEvents';
export * from './InterventionEvents';

// Event type constants for easy reference
export const EventTypes = {
  // Student Progress Events
  STUDENT_PROGRESS_UPDATED: 'student.progress.updated',
  LEARNING_OBJECTIVE_ACHIEVED: 'student.objective.achieved',
  STUDENT_STRUGGLE_DETECTED: 'student.struggle.detected',
  
  // AI Interaction Events
  AI_INTERACTION_LOGGED: 'ai.interaction.logged',
  AI_INTEGRITY_CHECK: 'ai.integrity.check',
  AI_BOUNDARY_ENFORCED: 'ai.boundary.enforced',
  
  // Intervention Events
  INTERVENTION_TRIGGERED: 'intervention.triggered',
  INTERVENTION_RESPONDED: 'intervention.responded',
  INTERVENTION_EFFECTIVENESS: 'intervention.effectiveness'
} as const;

export type EventType = typeof EventTypes[keyof typeof EventTypes];