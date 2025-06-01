/**
 * Central export for all educational event types
 */

export * from './StudentProgressEvents';
export * from './AIInteractionEvents';
export * from './InterventionEvents';
export * from './PrivacyEvents';

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
  INTERVENTION_EFFECTIVENESS: 'intervention.effectiveness',

  // Privacy Events
  DATA_ACCESS_AUDITED: 'privacy.data.accessed',
  STUDENT_CONSENT_UPDATED: 'privacy.consent.updated',
  UNAUTHORIZED_ACCESS_ATTEMPTED: 'privacy.access.unauthorized',
  PRIVACY_THRESHOLD_EXCEEDED: 'privacy.threshold.exceeded',
  DATA_ANONYMIZED: 'privacy.data.anonymized',
  DATA_RETENTION_ACTION: 'privacy.retention.action',
  PRIVACY_RISK_ASSESSED: 'privacy.risk.assessed',
  EDUCATIONAL_DATA_SHARED: 'privacy.data.shared',
  CONSENT_VERIFIED: 'privacy.consent.verified'
} as const;

export type EventType = typeof EventTypes[keyof typeof EventTypes];