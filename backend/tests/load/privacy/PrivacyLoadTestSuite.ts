import { performance } from 'perf_hooks';
import axios, { AxiosInstance } from 'axios';
import { EventEmitter } from 'events';

/**
 * Privacy Load Testing Suite
 * 
 * Validates privacy compliance under realistic load conditions
 * including concurrent operations, high-volume requests, and stress scenarios.
 */

export interface LoadTestConfig {
  baseURL: string;
  maxConcurrentUsers: number;
  testDurationMinutes: number;
  rampUpTimeMinutes: number;
  privacyOperationsPerSecond: number;
  scenarios: LoadTestScenario[];
}

export interface LoadTestScenario {
  name: string;
  weight: number; // percentage of total load
  operations: PrivacyOperation[];
  userProfile: 'student' | 'educator' | 'parent' | 'admin';
  privacyLevel: 'minimal' | 'standard' | 'maximum';
}

export interface PrivacyOperation {
  type: 'data_access' | 'consent_update' | 'rights_exercise' | 'audit_query' | 'incident_response';
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  payload?: any;
  expectedResponseTime: number; // milliseconds
  privacyValidations: string[];
}

export interface LoadTestResult {
  scenario: string;
  operation: string;
  responseTime: number;
  statusCode: number;
  privacyCompliant: boolean;
  privacyViolations: string[];
  timestamp: Date;
  userId: string;
}

export interface LoadTestMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  privacyComplianceRate: number;
  privacyViolations: number;
  concurrentUsers: number;
  requestsPerSecond: number;
  privacyOverhead: number; // additional time for privacy checks
}

export class PrivacyLoadTestSuite {
  private config: LoadTestConfig;
  private client: AxiosInstance;
  private results: LoadTestResult[] = [];
  private eventEmitter: EventEmitter;
  private activeUsers: Map<string, UserSession> = new Map();
  private testStartTime: number = 0;
  private testEndTime: number = 0;

  constructor(config: LoadTestConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: 30000
    });
    this.eventEmitter = new EventEmitter();
  }

  /**
   * Execute comprehensive privacy load test
   */
  async runLoadTest(): Promise<LoadTestMetrics> {
    console.log(`Starting Privacy Load Test - ${this.config.maxConcurrentUsers} users for ${this.config.testDurationMinutes} minutes`);
    
    this.testStartTime = performance.now();
    
    // Create user sessions
    await this.createUserSessions();
    
    // Ramp up users gradually
    await this.rampUpUsers();
    
    // Execute main test
    await this.executeMainTest();
    
    // Ramp down
    await this.rampDownUsers();
    
    this.testEndTime = performance.now();
    
    return this.calculateMetrics();
  }

  /**
   * Create user sessions for load test
   */
  private async createUserSessions(): Promise<void> {
    const promises: Promise<void>[] = [];
    
    for (let i = 0; i < this.config.maxConcurrentUsers; i++) {
      const userId = `load-test-user-${i}`;
      const scenario = this.selectScenario();
      
      promises.push(this.createUserSession(userId, scenario));
    }
    
    await Promise.all(promises);
    console.log(`Created ${this.activeUsers.size} user sessions`);
  }

  /**
   * Create individual user session
   */
  private async createUserSession(userId: string, scenario: LoadTestScenario): Promise<void> {
    try {
      // Register user with privacy profile
      const registrationResponse = await this.client.post('/auth/register', {
        email: `${userId}@loadtest.edu`,
        role: scenario.userProfile,
        privacyLevel: scenario.privacyLevel,
        loadTest: true
      });

      if (registrationResponse.status === 201) {
        const session: UserSession = {
          userId,
          authToken: registrationResponse.data.token,
          scenario,
          operationIndex: 0,
          startTime: performance.now(),
          requestCount: 0,
          privacyViolations: 0
        };
        
        this.activeUsers.set(userId, session);
      }
    } catch (error) {
      console.error(`Failed to create session for ${userId}:`, error.message);
    }
  }

  /**
   * Gradually ramp up user activity
   */
  private async rampUpUsers(): Promise<void> {
    const rampUpDuration = this.config.rampUpTimeMinutes * 60 * 1000; // milliseconds
    const userIncrement = Math.ceil(this.config.maxConcurrentUsers / 10); // 10 stages
    const stageInterval = rampUpDuration / 10;
    
    console.log('Starting ramp-up phase...');
    
    for (let stage = 1; stage <= 10; stage++) {
      const activeUserCount = Math.min(userIncrement * stage, this.config.maxConcurrentUsers);
      console.log(`Ramp-up stage ${stage}: ${activeUserCount} active users`);
      
      // Activate users for this stage
      const userSessions = Array.from(this.activeUsers.values()).slice(0, activeUserCount);
      await this.executeUserOperations(userSessions, stageInterval);
      
      await this.sleep(stageInterval);
    }
  }

  /**
   * Execute main load test
   */
  private async executeMainTest(): Promise<void> {
    const testDuration = this.config.testDurationMinutes * 60 * 1000; // milliseconds
    const intervalDuration = 10000; // 10 seconds
    const intervals = Math.floor(testDuration / intervalDuration);
    
    console.log(`Starting main test phase: ${intervals} intervals of ${intervalDuration}ms`);
    
    for (let interval = 0; interval < intervals; interval++) {
      const userSessions = Array.from(this.activeUsers.values());
      await this.executeUserOperations(userSessions, intervalDuration);
      
      // Log progress
      if (interval % 6 === 0) { // Every minute
        const elapsed = (interval + 1) * intervalDuration / 1000 / 60;
        console.log(`Progress: ${elapsed.toFixed(1)}/${this.config.testDurationMinutes} minutes`);
      }
    }
  }

  /**
   * Execute operations for user sessions
   */
  private async executeUserOperations(sessions: UserSession[], duration: number): Promise<void> {
    const operationsPerInterval = Math.floor(this.config.privacyOperationsPerSecond * (duration / 1000));
    const promises: Promise<void>[] = [];
    
    for (const session of sessions) {
      // Distribute operations across the interval
      for (let i = 0; i < operationsPerInterval; i++) {
        const delay = (i / operationsPerInterval) * duration;
        promises.push(this.scheduleOperation(session, delay));
      }
    }
    
    await Promise.all(promises);
  }

  /**
   * Schedule a single operation for a user
   */
  private async scheduleOperation(session: UserSession, delay: number): Promise<void> {
    await this.sleep(delay);
    
    const operation = session.scenario.operations[session.operationIndex];
    session.operationIndex = (session.operationIndex + 1) % session.scenario.operations.length;
    
    await this.executeOperation(session, operation);
  }

  /**
   * Execute privacy operation
   */
  private async executeOperation(session: UserSession, operation: PrivacyOperation): Promise<void> {
    const startTime = performance.now();
    let result: LoadTestResult;
    
    try {
      const response = await this.client.request({
        method: operation.method,
        url: operation.endpoint,
        data: operation.payload,
        headers: {
          Authorization: `Bearer ${session.authToken}`,
          'X-Load-Test': 'true'
        }
      });
      
      const responseTime = performance.now() - startTime;
      const privacyValidation = await this.validatePrivacyCompliance(response, operation);
      
      result = {
        scenario: session.scenario.name,
        operation: operation.type,
        responseTime,
        statusCode: response.status,
        privacyCompliant: privacyValidation.compliant,
        privacyViolations: privacyValidation.violations,
        timestamp: new Date(),
        userId: session.userId
      };
      
      session.requestCount++;
      if (!privacyValidation.compliant) {
        session.privacyViolations++;
      }
      
    } catch (error) {
      const responseTime = performance.now() - startTime;
      
      result = {
        scenario: session.scenario.name,
        operation: operation.type,
        responseTime,
        statusCode: error.response?.status || 0,
        privacyCompliant: false,
        privacyViolations: ['Request failed'],
        timestamp: new Date(),
        userId: session.userId
      };
      
      session.requestCount++;
      session.privacyViolations++;
    }
    
    this.results.push(result);
    
    // Track performance issues
    if (result.responseTime > operation.expectedResponseTime * 2) {
      this.eventEmitter.emit('performance-issue', {
        operation: operation.type,
        expectedTime: operation.expectedResponseTime,
        actualTime: result.responseTime,
        userId: session.userId
      });
    }
  }

  /**
   * Validate privacy compliance in response
   */
  private async validatePrivacyCompliance(response: any, operation: PrivacyOperation): Promise<PrivacyValidation> {
    const violations: string[] = [];
    
    // Check for personal information exposure
    if (this.containsPersonalInformation(response.data)) {
      violations.push('Response contains personal information');
    }
    
    // Check for proper consent enforcement
    if (operation.privacyValidations.includes('consent_required') && !this.hasValidConsent(response)) {
      violations.push('Operation performed without valid consent');
    }
    
    // Check for audit trail
    if (operation.privacyValidations.includes('audit_required') && !response.headers['x-audit-id']) {
      violations.push('Missing audit trail for privacy operation');
    }
    
    // Check for encryption
    if (operation.privacyValidations.includes('encryption_required') && !this.isEncrypted(response.data)) {
      violations.push('Sensitive data not properly encrypted');
    }
    
    // Check for data minimization
    if (operation.privacyValidations.includes('data_minimization') && this.hasExcessiveData(response.data)) {
      violations.push('Response contains excessive data (data minimization violation)');
    }
    
    return {
      compliant: violations.length === 0,
      violations
    };
  }

  /**
   * Gradually ramp down user activity
   */
  private async rampDownUsers(): Promise<void> {
    console.log('Starting ramp-down phase...');
    
    const rampDownDuration = this.config.rampUpTimeMinutes * 60 * 1000; // milliseconds
    const userDecrement = Math.ceil(this.config.maxConcurrentUsers / 5); // 5 stages
    const stageInterval = rampDownDuration / 5;
    
    for (let stage = 1; stage <= 5; stage++) {
      const activeUserCount = Math.max(this.config.maxConcurrentUsers - (userDecrement * stage), 0);
      console.log(`Ramp-down stage ${stage}: ${activeUserCount} active users`);
      
      if (activeUserCount > 0) {
        const userSessions = Array.from(this.activeUsers.values()).slice(0, activeUserCount);
        await this.executeUserOperations(userSessions, stageInterval);
      }
      
      await this.sleep(stageInterval);
    }
  }

  /**
   * Calculate load test metrics
   */
  private calculateMetrics(): LoadTestMetrics {
    const totalRequests = this.results.length;
    const successfulRequests = this.results.filter(r => r.statusCode >= 200 && r.statusCode < 300).length;
    const failedRequests = totalRequests - successfulRequests;
    
    const responseTimes = this.results.map(r => r.responseTime);
    responseTimes.sort((a, b) => a - b);
    
    const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const p95ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.95)];
    const p99ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.99)];
    
    const privacyCompliantRequests = this.results.filter(r => r.privacyCompliant).length;
    const privacyComplianceRate = (privacyCompliantRequests / totalRequests) * 100;
    const totalPrivacyViolations = this.results.reduce((sum, r) => sum + r.privacyViolations.length, 0);
    
    const testDurationSeconds = (this.testEndTime - this.testStartTime) / 1000;
    const requestsPerSecond = totalRequests / testDurationSeconds;
    
    // Calculate privacy overhead (additional time for privacy checks)
    const baselineResponseTimes = this.results
      .filter(r => r.operation === 'data_access')
      .map(r => r.responseTime);
    const privacyResponseTimes = this.results
      .filter(r => r.operation === 'rights_exercise')
      .map(r => r.responseTime);
    
    const baselineAvg = baselineResponseTimes.length > 0 
      ? baselineResponseTimes.reduce((sum, time) => sum + time, 0) / baselineResponseTimes.length 
      : 0;
    const privacyAvg = privacyResponseTimes.length > 0 
      ? privacyResponseTimes.reduce((sum, time) => sum + time, 0) / privacyResponseTimes.length 
      : 0;
    
    const privacyOverhead = privacyAvg - baselineAvg;
    
    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime,
      p95ResponseTime,
      p99ResponseTime,
      privacyComplianceRate,
      privacyViolations: totalPrivacyViolations,
      concurrentUsers: this.config.maxConcurrentUsers,
      requestsPerSecond,
      privacyOverhead
    };
  }

  /**
   * Select scenario based on weight distribution
   */
  private selectScenario(): LoadTestScenario {
    const random = Math.random() * 100;
    let cumulative = 0;
    
    for (const scenario of this.config.scenarios) {
      cumulative += scenario.weight;
      if (random <= cumulative) {
        return scenario;
      }
    }
    
    return this.config.scenarios[0]; // fallback
  }

  /**
   * Clean up test resources
   */
  async cleanup(): Promise<void> {
    console.log('Cleaning up load test resources...');
    
    // Delete test users
    const deletePromises = Array.from(this.activeUsers.keys()).map(userId => 
      this.client.delete(`/admin/test-users/${userId}`, {
        headers: { Authorization: 'Bearer admin-test-token' }
      }).catch(() => {}) // Ignore errors during cleanup
    );
    
    await Promise.all(deletePromises);
    
    this.activeUsers.clear();
    console.log('Load test cleanup completed');
  }

  // Utility methods
  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private containsPersonalInformation(data: any): boolean {
    const personalPatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
      /\b\d{3}-\d{3}-\d{4}\b/, // Phone
      /\b\d{16}\b/ // Credit card
    ];
    
    const dataString = JSON.stringify(data);
    return personalPatterns.some(pattern => pattern.test(dataString));
  }

  private hasValidConsent(response: any): boolean {
    return response.headers['x-consent-verified'] === 'true';
  }

  private isEncrypted(data: any): boolean {
    // Check if sensitive fields are encrypted
    return !this.containsPersonalInformation(data);
  }

  private hasExcessiveData(data: any): boolean {
    // Simple check for data minimization
    const dataString = JSON.stringify(data);
    return dataString.length > 10000; // Arbitrary threshold
  }
}

// Supporting interfaces
interface UserSession {
  userId: string;
  authToken: string;
  scenario: LoadTestScenario;
  operationIndex: number;
  startTime: number;
  requestCount: number;
  privacyViolations: number;
}

interface PrivacyValidation {
  compliant: boolean;
  violations: string[];
}

// Default load test scenarios
export const defaultPrivacyLoadTestScenarios: LoadTestScenario[] = [
  {
    name: 'Student Privacy Journey',
    weight: 40,
    userProfile: 'student',
    privacyLevel: 'standard',
    operations: [
      {
        type: 'data_access',
        endpoint: '/privacy/data-summary',
        method: 'GET',
        expectedResponseTime: 200,
        privacyValidations: ['data_minimization', 'encryption_required']
      },
      {
        type: 'consent_update',
        endpoint: '/privacy/consent',
        method: 'PUT',
        payload: { consentType: 'optional_analytics', granted: false },
        expectedResponseTime: 300,
        privacyValidations: ['audit_required', 'consent_required']
      },
      {
        type: 'rights_exercise',
        endpoint: '/privacy/data-export-request',
        method: 'POST',
        payload: { format: 'JSON' },
        expectedResponseTime: 500,
        privacyValidations: ['audit_required', 'data_minimization']
      }
    ]
  },
  {
    name: 'Educator Data Access',
    weight: 30,
    userProfile: 'educator',
    privacyLevel: 'standard',
    operations: [
      {
        type: 'data_access',
        endpoint: '/students/class-roster',
        method: 'GET',
        expectedResponseTime: 300,
        privacyValidations: ['audit_required', 'data_minimization']
      },
      {
        type: 'audit_query',
        endpoint: '/audit/my-access',
        method: 'GET',
        expectedResponseTime: 400,
        privacyValidations: ['audit_required']
      }
    ]
  },
  {
    name: 'Admin Privacy Monitoring',
    weight: 20,
    userProfile: 'admin',
    privacyLevel: 'minimal',
    operations: [
      {
        type: 'audit_query',
        endpoint: '/admin/privacy-metrics',
        method: 'GET',
        expectedResponseTime: 600,
        privacyValidations: ['audit_required', 'data_minimization']
      },
      {
        type: 'incident_response',
        endpoint: '/admin/privacy-incidents',
        method: 'GET',
        expectedResponseTime: 800,
        privacyValidations: ['audit_required', 'encryption_required']
      }
    ]
  },
  {
    name: 'Parent Rights Exercise',
    weight: 10,
    userProfile: 'parent',
    privacyLevel: 'maximum',
    operations: [
      {
        type: 'rights_exercise',
        endpoint: '/privacy/child-data-access',
        method: 'POST',
        payload: { childId: 'child-123' },
        expectedResponseTime: 700,
        privacyValidations: ['consent_required', 'audit_required', 'data_minimization']
      }
    ]
  }
];

export const defaultLoadTestConfig: LoadTestConfig = {
  baseURL: 'http://localhost:5001',
  maxConcurrentUsers: 100,
  testDurationMinutes: 10,
  rampUpTimeMinutes: 2,
  privacyOperationsPerSecond: 2,
  scenarios: defaultPrivacyLoadTestScenarios
};