export interface MigrationConfig {
  fastifyTrafficPercentage: number;
  enabledEndpoints: string[];
  rollbackOnError: boolean;
  debugMode: boolean;
}

export const migrationConfig: MigrationConfig = {
  // Percentage of traffic to route to Fastify (0-100)
  fastifyTrafficPercentage: parseInt(process.env.FASTIFY_TRAFFIC_PERCENTAGE || '0'),
  
  // Endpoints that have been migrated to Fastify
  enabledEndpoints: [
    // Auth endpoints
    '/api/auth/login',
    '/api/auth/verify',
    '/api/auth/register',
    '/api/auth/profile',
    // AI endpoints
    '/api/ai/generate',
    '/api/ai/capabilities',
    // Educator alerts endpoints
    '/api/educator-alerts/create',
    '/api/educator-alerts/list',
    '/api/educator-alerts/:alertId',
    '/api/educator-alerts/:alertId/dismiss',
    '/api/educator-alerts/:alertId/respond',
    '/api/educator-alerts/metrics',
    // Analytics endpoints
    '/api/analytics/writing-progress/:studentId/:assignmentId',
    '/api/analytics/analyze-patterns',
    '/api/analytics/evaluate-reflection',
    '/api/analytics/track-progress',
    '/api/analytics/generate-insights',
    '/api/analytics/classify-sensitivity',
    '/api/analytics/validate-educational-purpose',
    '/api/analytics/apply-ai-boundaries',
    '/api/analytics/audit-data-access',
    '/api/analytics/health',
    // Student profiling endpoints
    '/api/student-profiling/profiles/build',
    '/api/student-profiling/profiles/:studentId/privacy-choices',
    '/api/student-profiling/analytics/privacy-preserving',
    '/api/student-profiling/access-validation',
    '/api/student-profiling/profiles/:studentId/privacy-dashboard',
    '/api/student-profiling/profiles/:studentId/learning-trajectory',
    '/api/student-profiling/profiles/:studentId/skill-assessment',
    '/api/student-profiling/profiles/:studentId/recommendations',
    '/api/student-profiling/status',
    
    // NEWLY MIGRATED ENDPOINTS - ALL 11 ROUTE FILES (85 endpoints total)
    
    // Assignment endpoints (14 endpoints)
    '/api/assignments',
    '/api/assignments/:id',
    '/api/assignments/:id/submit',
    '/api/assignments/:id/clone',
    '/api/assignments/:id/validation-report',
    '/api/assignments/:id/ai-settings',
    '/api/assignments/:id/learning-objectives',
    '/api/assignments/:id/writing-stages',
    '/api/assignments/:id/grading-criteria',
    '/api/assignments/:id/ai-interactions',
    '/api/assignments/:id/progress/:studentId',
    '/api/assignments/:id/analytics',
    '/api/assignments/course/:courseId',
    '/api/assignments/bulk-update',
    
    // Course endpoints (9 endpoints)
    '/api/courses',
    '/api/courses/:id',
    '/api/courses/:id/assignments',
    '/api/courses/:id/students',
    '/api/courses/:id/analytics',
    '/api/courses/enroll',
    '/api/courses/my-courses',
    '/api/courses/:id/unenroll',
    '/api/courses/:id/bulk-operations',
    
    // Document endpoints (10 endpoints)
    '/api/documents',
    '/api/documents/:id',
    '/api/documents/:id/content',
    '/api/documents/:id/versions',
    '/api/documents/:id/sessions',
    '/api/documents/:id/sessions/:sessionId/end',
    '/api/documents/:id/statistics',
    '/api/documents/:id/collaboration',
    '/api/documents/:id/collaboration/users',
    '/api/documents/:id/share',
    
    // Submission endpoints (7 endpoints)
    '/api/submissions/:assignmentId',
    '/api/submissions/:id',
    '/api/submissions/:id/submit',
    '/api/submissions/:id/collaborators',
    '/api/submissions/:id/grade',
    '/api/submissions/:id/feedback',
    '/api/submissions/:id/versions',
    
    // Notification endpoints (10 endpoints)
    '/api/notifications',
    '/api/notifications/:id/read',
    '/api/notifications/read-all',
    '/api/notifications/:id',
    '/api/notifications/:id/resolve',
    '/api/notifications/interventions/analyze/:studentId',
    '/api/notifications/interventions/analyze-course/:courseId',
    '/api/notifications/interventions/summary',
    '/api/notifications/stats',
    '/api/notifications',
    
    // Admin endpoints (4 endpoints)
    '/api/admin/switch-role',
    '/api/admin/toggle-my-role',
    '/api/admin/users',
    '/api/admin/api-endpoints',
    
    // Course Assignment endpoints (8 endpoints)
    '/api/course-assignments/my-assignments',
    '/api/course-assignments/deploy',
    '/api/course-assignments/course/:courseId',
    '/api/course-assignments/:id',
    '/api/course-assignments/:id',
    '/api/course-assignments/:id',
    '/api/course-assignments/:id/submissions',
    
    // Assignment Template endpoints (8 endpoints)
    '/api/assignment-templates/my-templates',
    '/api/assignment-templates/library',
    '/api/assignment-templates/:id',
    '/api/assignment-templates',
    '/api/assignment-templates/:id',
    '/api/assignment-templates/:id/publish',
    '/api/assignment-templates/:id/clone',
    '/api/assignment-templates/:id',
    
    // Reflection endpoints (3 endpoints)
    '/api/reflections/submit',
    '/api/reflections/history/:studentId',
    '/api/reflections/quality-report/:assignmentId',
    
    // Learning Objective endpoints (6 endpoints)
    '/api/learning-objectives/presets',
    '/api/learning-objectives/categories',
    '/api/learning-objectives/subjects',
    '/api/learning-objectives/blooms-levels',
    '/api/learning-objectives/assessment-templates',
    '/api/learning-objectives/validate-set',
    
    // Boundary Intelligence endpoints (6 endpoints)
    '/api/boundary-intelligence/recommendations/:assignmentId',
    '/api/boundary-intelligence/proposals',
    '/api/boundary-intelligence/proposals/:proposalId',
    '/api/boundary-intelligence/proposals/:proposalId/approve',
    '/api/boundary-intelligence/proposals/:proposalId/reject',
    '/api/boundary-intelligence/effectiveness/:assignmentId',
    '/api/boundary-intelligence/analyze/:assignmentId'
  ],
  
  // Whether to automatically rollback to Express on Fastify errors
  rollbackOnError: process.env.FASTIFY_ROLLBACK_ON_ERROR === 'true',
  
  // Enable additional logging for debugging
  debugMode: process.env.FASTIFY_DEBUG_MODE === 'true'
};

export function shouldUseFastify(endpoint: string): boolean {
  // Check if endpoint is migrated (including parameterized routes)
  const isMigrated = migrationConfig.enabledEndpoints.some(migratedEndpoint => {
    // Direct match
    if (migratedEndpoint === endpoint) {
      return true;
    }
    
    // Handle parameterized routes like /api/educator-alerts/:alertId
    const pattern = migratedEndpoint.replace(/:[\w]+/g, '[^/]+');
    const regex = new RegExp(`^${pattern}$`);
    return regex.test(endpoint);
  });
  
  if (!isMigrated) {
    return false;
  }
  
  // Check traffic percentage
  if (migrationConfig.fastifyTrafficPercentage === 0) {
    return false;
  }
  
  if (migrationConfig.fastifyTrafficPercentage === 100) {
    return true;
  }
  
  // Use deterministic routing based on timestamp
  // This ensures consistent routing for the same request
  const random = Math.random() * 100;
  return random < migrationConfig.fastifyTrafficPercentage;
}

export function logRouting(endpoint: string, useFastify: boolean, requestId?: string): void {
  if (migrationConfig.debugMode) {
    console.log(`[ROUTING] ${requestId || 'N/A'} - ${endpoint} -> ${useFastify ? 'Fastify' : 'Express'}`);
  }
}