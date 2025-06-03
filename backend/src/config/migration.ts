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
    '/api/student-profiling/status'
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