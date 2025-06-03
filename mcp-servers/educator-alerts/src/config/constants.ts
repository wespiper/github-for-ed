/**
 * Configuration constants for Educator Alerts MCP Server
 */

export const MCP_PORT = process.env.MCP_PORT ? parseInt(process.env.MCP_PORT) : 3003;
export const HTTP_PORT = process.env.HTTP_PORT ? parseInt(process.env.HTTP_PORT) : 3004;

export const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || 'http://localhost:5001';
export const REPOSITORY_FALLBACK_ENABLED = process.env.REPOSITORY_FALLBACK_ENABLED !== 'false';

export const ALERT_TYPES = [
  'intervention_needed',
  'progress_concern', 
  'academic_integrity',
  'engagement_drop',
  'quality_decline',
  'urgent_support'
] as const;

export const SEVERITY_LEVELS = [
  'low',
  'medium', 
  'high',
  'critical',
  'urgent'
] as const;

export const INTERVENTION_TYPES = [
  'cognitive_support',
  'engagement_boost',
  'quality_improvement', 
  'progress_acceleration',
  'reflection_enhancement'
] as const;

export const RECOMMENDED_ACTION_TYPES = [
  'contact_student',
  'schedule_meeting',
  'provide_feedback',
  'modify_assignment',
  'refer_support',
  'adjust_ai_boundaries'
] as const;

export const NOTIFICATION_CHANNELS = [
  'in_app',
  'email',
  'sms',
  'slack'
] as const;

export const PRIVACY_CONFIG = {
  minimumCohortSize: 10,
  encryptionEnabled: true,
  auditTrailEnabled: true,
  anonymizationThreshold: 5
};

export const PERFORMANCE_THRESHOLDS = {
  alertGeneration: 100, // ms
  notificationDelivery: 2000, // ms
  interventionScheduling: 500, // ms
  effectivenessTracking: 1000 // ms
};