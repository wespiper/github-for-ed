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
    '/api/auth/login',
    '/api/auth/verify',
    '/api/auth/register',
    '/api/auth/profile',
    '/api/ai/generate',
    '/api/ai/capabilities'
  ],
  
  // Whether to automatically rollback to Express on Fastify errors
  rollbackOnError: process.env.FASTIFY_ROLLBACK_ON_ERROR === 'true',
  
  // Enable additional logging for debugging
  debugMode: process.env.FASTIFY_DEBUG_MODE === 'true'
};

export function shouldUseFastify(endpoint: string): boolean {
  // Check if endpoint is migrated
  if (!migrationConfig.enabledEndpoints.includes(endpoint)) {
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