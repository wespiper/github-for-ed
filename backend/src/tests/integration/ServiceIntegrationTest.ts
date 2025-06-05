import { ServiceRegistry, ServiceDiscoveryClient } from '../../service-discovery';
import { APIGateway } from '../../gateway';
import { HTTPServiceClient } from '../../communication';
import { CircuitBreakerService } from '../../services/fallback/CircuitBreakerService';
import { createDistributedMonitor } from '../../monitoring/distributed';

export interface TestResult {
  testName: string;
  success: boolean;
  duration: number;
  error?: string;
  details?: any;
}

export interface ServiceTestSuite {
  serviceName: string;
  tests: TestCase[];
}

export interface TestCase {
  name: string;
  description: string;
  execute: () => Promise<TestResult>;
  dependencies?: string[];
  timeout?: number;
}

export class ServiceIntegrationTest {
  private serviceRegistry: ServiceRegistry;
  private serviceDiscovery: ServiceDiscoveryClient;
  private circuitBreaker: CircuitBreakerService;
  private httpClients = new Map<string, HTTPServiceClient>();
  private monitor = createDistributedMonitor('integration-test');

  constructor() {
    this.serviceRegistry = new ServiceRegistry();
    this.circuitBreaker = new CircuitBreakerService();
    this.serviceDiscovery = new ServiceDiscoveryClient(this.serviceRegistry, this.circuitBreaker);
  }

  /**
   * Register test services
   */
  async setupTestServices(): Promise<void> {
    // Register all MCP services for testing
    const services = [
      {
        id: 'writing-analysis-test',
        name: 'Writing Analysis Service',
        version: '1.0.0',
        type: 'hybrid' as const,
        endpoints: {
          http: 'http://localhost:3001',
          health: 'http://localhost:3001/health'
        },
        metadata: {
          capabilities: [
            'writing-pattern-analysis',
            'reflection-quality-evaluation',
            'writing-progress-tracking',
            'writing-insights-generation'
          ],
          dependencies: []
        }
      },
      {
        id: 'student-profiling-test',
        name: 'Student Profiling Service',
        version: '1.0.0',
        type: 'hybrid' as const,
        endpoints: {
          http: 'http://localhost:3002',
          health: 'http://localhost:3002/health'
        },
        metadata: {
          capabilities: [
            'student-profile-building',
            'learning-trajectory-tracking',
            'skill-development-assessment',
            'personalized-recommendations'
          ],
          dependencies: []
        }
      },
      {
        id: 'educator-alerts-test',
        name: 'Educator Alerts Service',
        version: '1.0.0',
        type: 'hybrid' as const,
        endpoints: {
          http: 'http://localhost:3003',
          health: 'http://localhost:3003/health'
        },
        metadata: {
          capabilities: [
            'educator-alert-creation',
            'educator-alert-listing',
            'educator-alert-management'
          ],
          dependencies: ['writing-analysis-test', 'student-profiling-test']
        }
      },
      {
        id: 'academic-integrity-test',
        name: 'Academic Integrity Service',
        version: '1.0.0',
        type: 'hybrid' as const,
        endpoints: {
          http: 'http://localhost:3004',
          health: 'http://localhost:3004/health'
        },
        metadata: {
          capabilities: [
            'ai-assistance-detection',
            'integrity-analysis',
            'educational-validation'
          ],
          dependencies: ['writing-analysis-test']
        }
      }
    ];

    services.forEach(service => {
      this.serviceRegistry.register(service);
    });

    // Wait for initial health checks
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('[INTEGRATION TEST] Test services registered');
  }

  /**
   * Run comprehensive integration tests
   */
  async runIntegrationTests(): Promise<{
    summary: {
      total: number;
      passed: number;
      failed: number;
      duration: number;
    };
    results: TestResult[];
  }> {
    const startTime = Date.now();
    const results: TestResult[] = [];

    console.log('[INTEGRATION TEST] Starting comprehensive integration tests...');

    // Test suites in dependency order
    const testSuites = [
      this.getServiceDiscoveryTests(),
      this.getCircuitBreakerTests(),
      this.getWritingAnalysisTests(),
      this.getStudentProfilingTests(),
      this.getEducatorAlertsTests(),
      this.getAcademicIntegrityTests(),
      this.getEndToEndWorkflowTests(),
      this.getPerformanceTests(),
      this.getResilienceTests()
    ];

    for (const suite of testSuites) {
      console.log(`[INTEGRATION TEST] Running test suite: ${suite.serviceName}`);
      
      for (const testCase of suite.tests) {
        const result = await this.runTestCase(testCase);
        results.push(result);
        
        if (result.success) {
          console.log(`  ✅ ${result.testName} (${result.duration}ms)`);
        } else {
          console.log(`  ❌ ${result.testName} (${result.duration}ms): ${result.error}`);
        }
      }
    }

    const duration = Date.now() - startTime;
    const passed = results.filter(r => r.success).length;
    const failed = results.length - passed;

    console.log(`[INTEGRATION TEST] Tests completed: ${passed}/${results.length} passed in ${duration}ms`);

    return {
      summary: {
        total: results.length,
        passed,
        failed,
        duration
      },
      results
    };
  }

  /**
   * Run a single test case
   */
  private async runTestCase(testCase: TestCase): Promise<TestResult> {
    const startTime = Date.now();
    const timeout = testCase.timeout || 30000;

    try {
      // Check dependencies
      if (testCase.dependencies) {
        for (const dep of testCase.dependencies) {
          const service = this.serviceRegistry.getService(dep);
          if (!service || service.metadata.status !== 'healthy') {
            throw new Error(`Dependency ${dep} is not healthy`);
          }
        }
      }

      // Execute test with timeout
      const result = await Promise.race([
        testCase.execute(),
        new Promise<TestResult>((_, reject) => 
          setTimeout(() => reject(new Error('Test timeout')), timeout)
        )
      ]);

      return result;

    } catch (error) {
      return {
        testName: testCase.name,
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Service Discovery Tests
   */
  private getServiceDiscoveryTests(): ServiceTestSuite {
    return {
      serviceName: 'Service Discovery',
      tests: [
        {
          name: 'service-registration',
          description: 'Test service registration and discovery',
          execute: async () => {
            const startTime = Date.now();
            
            // Test service discovery
            const services = await this.serviceDiscovery.discoverServices('writing-pattern-analysis');
            
            if (services.length === 0) {
              throw new Error('No services discovered for writing-pattern-analysis');
            }

            const service = await this.serviceDiscovery.getBestService('writing-pattern-analysis');
            if (!service) {
              throw new Error('Could not get best service');
            }

            return {
              testName: 'service-registration',
              success: true,
              duration: Date.now() - startTime,
              details: { servicesFound: services.length, bestService: service.name }
            };
          }
        },
        {
          name: 'health-monitoring',
          description: 'Test service health monitoring',
          execute: async () => {
            const startTime = Date.now();
            
            const stats = this.serviceDiscovery.getDiscoveryStats();
            const healthyServices = stats.registry.healthyServices;
            
            if (healthyServices === 0) {
              throw new Error('No healthy services found');
            }

            return {
              testName: 'health-monitoring',
              success: true,
              duration: Date.now() - startTime,
              details: { healthyServices, totalServices: stats.registry.totalServices }
            };
          }
        }
      ]
    };
  }

  /**
   * Circuit Breaker Tests
   */
  private getCircuitBreakerTests(): ServiceTestSuite {
    return {
      serviceName: 'Circuit Breaker',
      tests: [
        {
          name: 'circuit-breaker-basic',
          description: 'Test basic circuit breaker functionality',
          execute: async () => {
            const startTime = Date.now();
            
            // Test successful execution
            const result = await this.circuitBreaker.execute(
              'test-circuit',
              async () => 'success',
              async () => 'fallback'
            );

            if (result !== 'success') {
              throw new Error(`Expected 'success', got '${result}'`);
            }

            return {
              testName: 'circuit-breaker-basic',
              success: true,
              duration: Date.now() - startTime,
              details: { result }
            };
          }
        }
      ]
    };
  }

  /**
   * Writing Analysis Service Tests
   */
  private getWritingAnalysisTests(): ServiceTestSuite {
    return {
      serviceName: 'Writing Analysis',
      tests: [
        {
          name: 'writing-pattern-analysis',
          description: 'Test writing pattern analysis capability',
          execute: async () => {
            const startTime = Date.now();
            
            const result = await this.serviceDiscovery.executeWithDiscovery(
              'writing-pattern-analysis',
              async (service) => {
                const client = this.getHttpClient(service.id, service.endpoints.http!);
                const response = await client.post('/analyze-patterns', {
                  content: 'This is a test writing sample for analysis.',
                  studentId: 'test-student-123',
                  assignmentId: 'test-assignment-456'
                });
                return response.data;
              },
              { type: 'http' }
            );

            return {
              testName: 'writing-pattern-analysis',
              success: true,
              duration: Date.now() - startTime,
              details: { result }
            };
          },
          dependencies: ['writing-analysis-test']
        },
        {
          name: 'reflection-quality-evaluation',
          description: 'Test reflection quality evaluation',
          execute: async () => {
            const startTime = Date.now();
            
            const result = await this.serviceDiscovery.executeWithDiscovery(
              'reflection-quality-evaluation',
              async (service) => {
                const client = this.getHttpClient(service.id, service.endpoints.http!);
                const response = await client.post('/evaluate-reflection', {
                  reflection: 'I learned a lot about writing and improved my skills.',
                  studentId: 'test-student-123',
                  assignmentId: 'test-assignment-456'
                });
                return response.data;
              },
              { type: 'http' }
            );

            return {
              testName: 'reflection-quality-evaluation',
              success: true,
              duration: Date.now() - startTime,
              details: { result }
            };
          },
          dependencies: ['writing-analysis-test']
        }
      ]
    };
  }

  /**
   * Student Profiling Service Tests
   */
  private getStudentProfilingTests(): ServiceTestSuite {
    return {
      serviceName: 'Student Profiling',
      tests: [
        {
          name: 'student-profile-building',
          description: 'Test student profile building',
          execute: async () => {
            const startTime = Date.now();
            
            const result = await this.serviceDiscovery.executeWithDiscovery(
              'student-profile-building',
              async (service) => {
                const client = this.getHttpClient(service.id, service.endpoints.http!);
                const response = await client.post('/build-profile', {
                  studentId: 'test-student-123',
                  requesterContext: {
                    userId: 'test-teacher-456',
                    role: 'teacher',
                    purpose: 'assessment'
                  }
                });
                return response.data;
              },
              { type: 'http' }
            );

            return {
              testName: 'student-profile-building',
              success: true,
              duration: Date.now() - startTime,
              details: { result }
            };
          },
          dependencies: ['student-profiling-test']
        }
      ]
    };
  }

  /**
   * Educator Alerts Service Tests
   */
  private getEducatorAlertsTests(): ServiceTestSuite {
    return {
      serviceName: 'Educator Alerts',
      tests: [
        {
          name: 'alert-creation',
          description: 'Test educator alert creation',
          execute: async () => {
            const startTime = Date.now();
            
            const result = await this.serviceDiscovery.executeWithDiscovery(
              'educator-alert-creation',
              async (service) => {
                const client = this.getHttpClient(service.id, service.endpoints.http!);
                const response = await client.post('/create-alert', {
                  type: 'struggling_student',
                  studentId: 'test-student-123',
                  educatorId: 'test-teacher-456',
                  priority: 'medium',
                  message: 'Student may need additional support'
                });
                return response.data;
              },
              { type: 'http' }
            );

            return {
              testName: 'alert-creation',
              success: true,
              duration: Date.now() - startTime,
              details: { result }
            };
          },
          dependencies: ['educator-alerts-test']
        }
      ]
    };
  }

  /**
   * Academic Integrity Service Tests
   */
  private getAcademicIntegrityTests(): ServiceTestSuite {
    return {
      serviceName: 'Academic Integrity',
      tests: [
        {
          name: 'ai-assistance-detection',
          description: 'Test AI assistance detection',
          execute: async () => {
            const startTime = Date.now();
            
            const result = await this.serviceDiscovery.executeWithDiscovery(
              'ai-assistance-detection',
              async (service) => {
                const client = this.getHttpClient(service.id, service.endpoints.http!);
                const response = await client.post('/detect-ai-assistance', {
                  content: 'This is a test submission for AI detection analysis.',
                  studentId: 'test-student-123',
                  assignmentId: 'test-assignment-456'
                });
                return response.data;
              },
              { type: 'http' }
            );

            return {
              testName: 'ai-assistance-detection',
              success: true,
              duration: Date.now() - startTime,
              details: { result }
            };
          },
          dependencies: ['academic-integrity-test']
        }
      ]
    };
  }

  /**
   * End-to-End Workflow Tests
   */
  private getEndToEndWorkflowTests(): ServiceTestSuite {
    return {
      serviceName: 'End-to-End Workflows',
      tests: [
        {
          name: 'complete-writing-workflow',
          description: 'Test complete writing analysis workflow',
          execute: async () => {
            const startTime = Date.now();
            
            // Simulate a complete workflow
            const steps = [
              'writing-pattern-analysis',
              'reflection-quality-evaluation',
              'student-profile-building',
              'educator-alert-creation'
            ];

            const results = [];
            for (const capability of steps) {
              const service = await this.serviceDiscovery.getBestService(capability);
              if (service) {
                results.push({ capability, service: service.name, status: 'available' });
              } else {
                results.push({ capability, service: null, status: 'unavailable' });
              }
            }

            const availableSteps = results.filter(r => r.status === 'available').length;
            if (availableSteps < steps.length) {
              throw new Error(`Only ${availableSteps}/${steps.length} workflow steps available`);
            }

            return {
              testName: 'complete-writing-workflow',
              success: true,
              duration: Date.now() - startTime,
              details: { steps: results }
            };
          },
          dependencies: ['writing-analysis-test', 'student-profiling-test', 'educator-alerts-test']
        }
      ]
    };
  }

  /**
   * Performance Tests
   */
  private getPerformanceTests(): ServiceTestSuite {
    return {
      serviceName: 'Performance',
      tests: [
        {
          name: 'concurrent-requests',
          description: 'Test handling of concurrent requests',
          execute: async () => {
            const startTime = Date.now();
            
            const concurrentRequests = 10;
            const promises = Array.from({ length: concurrentRequests }, async (_, i) => {
              return this.serviceDiscovery.executeWithDiscovery(
                'writing-pattern-analysis',
                async (service) => {
                  const client = this.getHttpClient(service.id, service.endpoints.http!);
                  const response = await client.get('/health');
                  return response.success;
                },
                { type: 'http' }
              );
            });

            const results = await Promise.all(promises);
            const successCount = results.filter(r => r).length;

            if (successCount < concurrentRequests * 0.8) { // 80% success rate
              throw new Error(`Only ${successCount}/${concurrentRequests} concurrent requests succeeded`);
            }

            return {
              testName: 'concurrent-requests',
              success: true,
              duration: Date.now() - startTime,
              details: { successCount, totalRequests: concurrentRequests }
            };
          },
          timeout: 60000
        }
      ]
    };
  }

  /**
   * Resilience Tests
   */
  private getResilienceTests(): ServiceTestSuite {
    return {
      serviceName: 'Resilience',
      tests: [
        {
          name: 'service-failure-handling',
          description: 'Test handling of service failures',
          execute: async () => {
            const startTime = Date.now();
            
            // Test fallback behavior when service is unavailable
            const result = await this.serviceDiscovery.executeWithDiscovery(
              'non-existent-capability',
              async () => {
                throw new Error('Service not available');
              },
              {
                fallback: async () => 'fallback-executed'
              }
            );

            if (result !== 'fallback-executed') {
              throw new Error(`Expected fallback execution, got: ${result}`);
            }

            return {
              testName: 'service-failure-handling',
              success: true,
              duration: Date.now() - startTime,
              details: { result }
            };
          }
        }
      ]
    };
  }

  /**
   * Get or create HTTP client for a service
   */
  private getHttpClient(serviceId: string, baseURL: string): HTTPServiceClient {
    let client = this.httpClients.get(serviceId);
    if (!client) {
      client = new HTTPServiceClient({ baseURL }, this.circuitBreaker);
      this.httpClients.set(serviceId, client);
    }
    return client;
  }

  /**
   * Cleanup test resources
   */
  async cleanup(): Promise<void> {
    this.serviceRegistry.shutdown();
    this.monitor.shutdown();
    console.log('[INTEGRATION TEST] Cleanup completed');
  }
}