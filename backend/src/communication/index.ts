export { HTTPServiceClient, HTTPClientConfig, ServiceRequest, ServiceResponse } from './HTTPServiceClient';
export { ServiceOrchestrator, WorkflowStep, WorkflowDefinition, WorkflowExecution } from './ServiceOrchestrator';

// Common workflow definitions for educational processes
export const EducationalWorkflows = {
  /**
   * Student writing analysis workflow
   */
  WRITING_ANALYSIS: {
    id: 'writing-analysis-workflow',
    name: 'Writing Analysis Workflow',
    description: 'Comprehensive analysis of student writing submissions',
    rollbackOnFailure: false,
    maxConcurrency: 3,
    steps: [
      {
        id: 'content-classification',
        serviceCapability: 'content-sensitivity-classification',
        operation: 'classify-content',
        input: {},
        timeout: 5000
      },
      {
        id: 'privacy-validation',
        serviceCapability: 'educational-purpose-validation',
        operation: 'validate-purpose',
        input: {},
        dependencies: ['content-classification'],
        timeout: 3000
      },
      {
        id: 'pattern-analysis',
        serviceCapability: 'writing-pattern-analysis',
        operation: 'analyze-patterns',
        input: {},
        dependencies: ['privacy-validation'],
        timeout: 10000
      },
      {
        id: 'reflection-evaluation',
        serviceCapability: 'reflection-quality-evaluation',
        operation: 'evaluate-reflection',
        input: {},
        dependencies: ['pattern-analysis'],
        timeout: 8000
      },
      {
        id: 'progress-tracking',
        serviceCapability: 'writing-progress-tracking',
        operation: 'track-progress',
        input: {},
        dependencies: ['reflection-evaluation'],
        timeout: 5000
      },
      {
        id: 'insights-generation',
        serviceCapability: 'writing-insights-generation',
        operation: 'generate-insights',
        input: {},
        dependencies: ['progress-tracking'],
        timeout: 12000
      }
    ]
  },

  /**
   * Academic integrity check workflow
   */
  ACADEMIC_INTEGRITY_CHECK: {
    id: 'academic-integrity-workflow',
    name: 'Academic Integrity Check',
    description: 'Comprehensive academic integrity analysis',
    rollbackOnFailure: false,
    maxConcurrency: 2,
    steps: [
      {
        id: 'ai-detection',
        serviceCapability: 'ai-assistance-detection',
        operation: 'detect-ai-assistance',
        input: {},
        timeout: 15000
      },
      {
        id: 'integrity-analysis',
        serviceCapability: 'integrity-analysis',
        operation: 'analyze-integrity',
        input: {},
        dependencies: ['ai-detection'],
        timeout: 12000
      },
      {
        id: 'educational-validation',
        serviceCapability: 'educational-validation',
        operation: 'validate-educational-context',
        input: {},
        dependencies: ['integrity-analysis'],
        timeout: 8000
      },
      {
        id: 'integrity-reporting',
        serviceCapability: 'integrity-reporting',
        operation: 'generate-report',
        input: {},
        dependencies: ['educational-validation'],
        timeout: 5000
      }
    ]
  },

  /**
   * Student profiling and recommendation workflow
   */
  STUDENT_PROFILING: {
    id: 'student-profiling-workflow',
    name: 'Student Profiling and Recommendations',
    description: 'Build student profile and generate personalized recommendations',
    rollbackOnFailure: true, // Privacy-sensitive, should rollback on failure
    maxConcurrency: 2,
    steps: [
      {
        id: 'privacy-validation',
        serviceCapability: 'data-access-validation',
        operation: 'validate-access',
        input: {},
        timeout: 3000
      },
      {
        id: 'profile-building',
        serviceCapability: 'student-profile-building',
        operation: 'build-profile',
        input: {},
        dependencies: ['privacy-validation'],
        timeout: 10000
      },
      {
        id: 'trajectory-tracking',
        serviceCapability: 'learning-trajectory-tracking',
        operation: 'track-trajectory',
        input: {},
        dependencies: ['profile-building'],
        timeout: 8000,
        optional: true // Can continue without trajectory data
      },
      {
        id: 'skill-assessment',
        serviceCapability: 'skill-development-assessment',
        operation: 'assess-skills',
        input: {},
        dependencies: ['profile-building'],
        timeout: 8000
      },
      {
        id: 'recommendations',
        serviceCapability: 'personalized-recommendations',
        operation: 'generate-recommendations',
        input: {},
        dependencies: ['skill-assessment'],
        timeout: 10000
      }
    ]
  },

  /**
   * Educator intervention workflow
   */
  EDUCATOR_INTERVENTION: {
    id: 'educator-intervention-workflow',
    name: 'Educator Intervention Analysis',
    description: 'Analyze student data and generate educator alerts',
    rollbackOnFailure: false,
    maxConcurrency: 3,
    steps: [
      {
        id: 'data-aggregation',
        serviceCapability: 'privacy-preserving-analytics',
        operation: 'aggregate-data',
        input: {},
        timeout: 8000
      },
      {
        id: 'pattern-detection',
        serviceCapability: 'writing-pattern-analysis',
        operation: 'detect-concerning-patterns',
        input: {},
        dependencies: ['data-aggregation'],
        timeout: 10000
      },
      {
        id: 'alert-creation',
        serviceCapability: 'educator-alert-creation',
        operation: 'create-alert',
        input: {},
        dependencies: ['pattern-detection'],
        timeout: 5000
      },
      {
        id: 'intervention-tracking',
        serviceCapability: 'intervention-tracking',
        operation: 'track-intervention',
        input: {},
        dependencies: ['alert-creation'],
        timeout: 3000,
        optional: true
      }
    ]
  }
} as const;

// Helper function to create service orchestrator with common workflows
export function createEducationalOrchestrator(serviceDiscovery: any): ServiceOrchestrator {
  const orchestrator = new ServiceOrchestrator(serviceDiscovery);
  
  // Register all educational workflows
  Object.values(EducationalWorkflows).forEach(workflow => {
    orchestrator.registerWorkflow(workflow);
  });

  console.log('[EDUCATIONAL ORCHESTRATOR] Registered 4 educational workflows');
  return orchestrator;
}