/**
 * Privacy-Aware Data Pipeline Service
 * Real-time PII detection, anonymization, and compliant data processing
 */

import { EventEmitter } from 'events';
import { Logger } from '../monitoring/Logger';
import { productionMetrics } from '../monitoring/ProductionMetricsCollector';
import { PIIDetector } from '../monitoring/privacy/PIIDetector';
import { EventBus } from '../events/EventBus';
import { PrivacyEvents } from '../events/events/PrivacyEvents';

export interface DataPipelineStage {
  name: string;
  enabled: boolean;
  order: number;
  processor: (data: any, context: PipelineContext) => Promise<PipelineResult>;
  parallel: boolean;
  privacy: {
    required: boolean;
    piiDetection: boolean;
    anonymization: boolean;
    audit: boolean;
  };
}

export interface PipelineContext {
  userId?: string;
  studentId?: string;
  purpose: string;
  consent: Record<string, boolean>;
  complianceLevel: 'strict' | 'standard' | 'minimal';
  retentionPolicy?: string;
  tags: string[];
  correlationId: string;
}

export interface PipelineResult {
  data: any;
  metadata: {
    piiDetected: boolean;
    anonymized: boolean;
    dataClassification: string;
    processingTime: number;
    complianceFlags: string[];
  };
  warnings: string[];
  errors: string[];
}

export interface DataFlow {
  id: string;
  name: string;
  stages: DataPipelineStage[];
  sourceType: 'api' | 'event' | 'batch' | 'stream';
  targetType: 'database' | 'cache' | 'analytics' | 'export';
  privacyLevel: 'public' | 'internal' | 'confidential' | 'restricted';
  enabled: boolean;
}

export interface AnonymizationRule {
  field: string;
  method: 'hash' | 'redact' | 'generalize' | 'suppress' | 'pseudonymize';
  parameters?: Record<string, any>;
  preserveFormat?: boolean;
}

export interface DifferentialPrivacyConfig {
  epsilon: number; // Privacy budget
  delta: number; // Failure probability
  sensitivity: number; // Query sensitivity
  mechanism: 'laplace' | 'gaussian' | 'exponential';
  noiseScale?: number;
}

export class PrivacyAwareDataPipeline extends EventEmitter {
  private static instance: PrivacyAwareDataPipeline;
  private logger = Logger.getInstance('privacy-pipeline');
  private piiDetector = new PIIDetector();
  private eventBus?: EventBus;
  
  // Pipeline configuration
  private dataFlows = new Map<string, DataFlow>();
  private anonymizationRules = new Map<string, AnonymizationRule[]>();
  private differentialPrivacyConfig = new Map<string, DifferentialPrivacyConfig>();
  
  // Processing queues
  private processingQueue: Array<{
    flowId: string;
    data: any;
    context: PipelineContext;
    resolve: (result: PipelineResult) => void;
    reject: (error: Error) => void;
  }> = [];
  
  // Metrics tracking
  private pipelineMetrics = {
    totalProcessed: 0,
    piiDetected: 0,
    anonymized: 0,
    complianceViolations: 0,
    averageProcessingTime: 0,
    errorRate: 0
  };
  
  // Privacy budgets (for differential privacy)
  private privacyBudgets = new Map<string, number>();
  private privacyBudgetLimits = new Map<string, number>();

  private constructor() {
    super();
    this.initializeDefaultFlows();
    this.startQueueProcessing();
    this.startMetricsCollection();
  }

  static getInstance(): PrivacyAwareDataPipeline {
    if (!PrivacyAwareDataPipeline.instance) {
      PrivacyAwareDataPipeline.instance = new PrivacyAwareDataPipeline();
    }
    return PrivacyAwareDataPipeline.instance;
  }

  /**
   * Initialize with event bus
   */
  async initialize(eventBus: EventBus): Promise<void> {
    this.eventBus = eventBus;
    
    // Subscribe to privacy events
    this.eventBus.subscribe(PrivacyEvents.DATA_ACCESS_REQUESTED, async (event) => {
      await this.handleDataAccessRequest(event);
    });

    this.eventBus.subscribe(PrivacyEvents.CONSENT_UPDATED, async (event) => {
      await this.handleConsentUpdate(event);
    });

    this.logger.info('Privacy-aware data pipeline initialized', {
      dataFlows: this.dataFlows.size,
      anonymizationRules: this.anonymizationRules.size
    });
  }

  /**
   * Initialize default data flows
   */
  private initializeDefaultFlows(): void {
    // Student data processing flow
    this.registerDataFlow({
      id: 'student-data-processing',
      name: 'Student Data Processing',
      sourceType: 'api',
      targetType: 'database',
      privacyLevel: 'confidential',
      enabled: true,
      stages: [
        {
          name: 'input-validation',
          enabled: true,
          order: 1,
          processor: this.validateInput.bind(this),
          parallel: false,
          privacy: {
            required: true,
            piiDetection: true,
            anonymization: false,
            audit: true
          }
        },
        {
          name: 'pii-detection',
          enabled: true,
          order: 2,
          processor: this.detectPII.bind(this),
          parallel: false,
          privacy: {
            required: true,
            piiDetection: true,
            anonymization: false,
            audit: true
          }
        },
        {
          name: 'consent-verification',
          enabled: true,
          order: 3,
          processor: this.verifyConsent.bind(this),
          parallel: false,
          privacy: {
            required: true,
            piiDetection: false,
            anonymization: false,
            audit: true
          }
        },
        {
          name: 'data-anonymization',
          enabled: true,
          order: 4,
          processor: this.anonymizeData.bind(this),
          parallel: false,
          privacy: {
            required: true,
            piiDetection: false,
            anonymization: true,
            audit: true
          }
        },
        {
          name: 'compliance-check',
          enabled: true,
          order: 5,
          processor: this.checkCompliance.bind(this),
          parallel: false,
          privacy: {
            required: true,
            piiDetection: false,
            anonymization: false,
            audit: true
          }
        }
      ]
    });

    // Analytics data flow
    this.registerDataFlow({
      id: 'analytics-aggregation',
      name: 'Analytics Data Aggregation',
      sourceType: 'event',
      targetType: 'analytics',
      privacyLevel: 'internal',
      enabled: true,
      stages: [
        {
          name: 'data-aggregation',
          enabled: true,
          order: 1,
          processor: this.aggregateData.bind(this),
          parallel: true,
          privacy: {
            required: true,
            piiDetection: true,
            anonymization: true,
            audit: true
          }
        },
        {
          name: 'differential-privacy',
          enabled: true,
          order: 2,
          processor: this.applyDifferentialPrivacy.bind(this),
          parallel: false,
          privacy: {
            required: true,
            piiDetection: false,
            anonymization: true,
            audit: true
          }
        }
      ]
    });

    // Initialize default anonymization rules
    this.initializeAnonymizationRules();
    this.initializeDifferentialPrivacyConfig();
  }

  /**
   * Initialize anonymization rules
   */
  private initializeAnonymizationRules(): void {
    this.anonymizationRules.set('student-data', [
      {
        field: 'email',
        method: 'hash',
        preserveFormat: false
      },
      {
        field: 'studentId',
        method: 'pseudonymize',
        parameters: { algorithm: 'hmac-sha256' }
      },
      {
        field: 'ipAddress',
        method: 'generalize',
        parameters: { maskLastOctet: true }
      },
      {
        field: 'personalNotes',
        method: 'redact',
        parameters: { replacement: '[REDACTED]' }
      }
    ]);

    this.anonymizationRules.set('analytics-data', [
      {
        field: 'userId',
        method: 'hash',
        preserveFormat: false
      },
      {
        field: 'sessionId',
        method: 'hash',
        preserveFormat: false
      },
      {
        field: 'location',
        method: 'generalize',
        parameters: { precision: 'city' }
      }
    ]);
  }

  /**
   * Initialize differential privacy configuration
   */
  private initializeDifferentialPrivacyConfig(): void {
    this.differentialPrivacyConfig.set('student-analytics', {
      epsilon: 1.0,
      delta: 1e-5,
      sensitivity: 1.0,
      mechanism: 'laplace'
    });

    this.differentialPrivacyConfig.set('course-analytics', {
      epsilon: 0.5,
      delta: 1e-6,
      sensitivity: 1.0,
      mechanism: 'gaussian'
    });

    // Initialize privacy budgets
    this.privacyBudgetLimits.set('student-analytics', 10.0); // Total epsilon budget
    this.privacyBudgetLimits.set('course-analytics', 5.0);
    this.privacyBudgets.set('student-analytics', 0.0); // Current usage
    this.privacyBudgets.set('course-analytics', 0.0);
  }

  /**
   * Register a data flow
   */
  registerDataFlow(flow: DataFlow): void {
    // Sort stages by order
    flow.stages.sort((a, b) => a.order - b.order);
    
    this.dataFlows.set(flow.id, flow);
    
    this.logger.info(`Registered data flow: ${flow.name}`, {
      flowId: flow.id,
      stages: flow.stages.length,
      privacyLevel: flow.privacyLevel
    });

    productionMetrics.setGauge('pipeline_data_flows', this.dataFlows.size, {
      type: 'registered'
    });
  }

  /**
   * Process data through a specific flow
   */
  async processData(
    flowId: string,
    data: any,
    context: PipelineContext
  ): Promise<PipelineResult> {
    const startTime = Date.now();
    
    return new Promise<PipelineResult>((resolve, reject) => {
      this.processingQueue.push({
        flowId,
        data,
        context,
        resolve,
        reject
      });

      productionMetrics.setGauge('pipeline_queue_size', this.processingQueue.length);
    });
  }

  /**
   * Start queue processing
   */
  private startQueueProcessing(): void {
    setInterval(async () => {
      await this.processQueue();
    }, 100); // Process queue every 100ms
  }

  /**
   * Process queued items
   */
  private async processQueue(): Promise<void> {
    if (this.processingQueue.length === 0) return;

    const batchSize = Math.min(10, this.processingQueue.length);
    const batch = this.processingQueue.splice(0, batchSize);

    const processPromises = batch.map(async (item) => {
      try {
        const result = await this.executeFlow(item.flowId, item.data, item.context);
        item.resolve(result);
      } catch (error) {
        item.reject(error as Error);
      }
    });

    await Promise.allSettled(processPromises);
  }

  /**
   * Execute a data flow
   */
  private async executeFlow(
    flowId: string,
    data: any,
    context: PipelineContext
  ): Promise<PipelineResult> {
    const startTime = Date.now();
    const flow = this.dataFlows.get(flowId);
    
    if (!flow || !flow.enabled) {
      throw new Error(`Data flow not found or disabled: ${flowId}`);
    }

    let processedData = data;
    const metadata = {
      piiDetected: false,
      anonymized: false,
      dataClassification: flow.privacyLevel,
      processingTime: 0,
      complianceFlags: [] as string[]
    };
    const warnings: string[] = [];
    const errors: string[] = [];

    try {
      // Execute stages in order
      for (const stage of flow.stages) {
        if (!stage.enabled) continue;

        const stageStartTime = Date.now();
        
        try {
          const stageResult = await stage.processor(processedData, context);
          
          processedData = stageResult.data;
          
          // Merge metadata
          if (stageResult.metadata.piiDetected) metadata.piiDetected = true;
          if (stageResult.metadata.anonymized) metadata.anonymized = true;
          metadata.complianceFlags.push(...stageResult.metadata.complianceFlags);
          
          warnings.push(...stageResult.warnings);
          errors.push(...stageResult.errors);

          const stageDuration = Date.now() - stageStartTime;
          
          productionMetrics.recordHistogram('pipeline_stage_duration_ms', stageDuration, {
            flow: flowId,
            stage: stage.name,
            status: 'success'
          });

          this.logger.debug(`Pipeline stage completed: ${stage.name}`, {
            flowId,
            duration: stageDuration,
            piiDetected: stageResult.metadata.piiDetected
          });

        } catch (stageError) {
          const errorMessage = `Stage ${stage.name} failed: ${(stageError as Error).message}`;
          errors.push(errorMessage);
          
          productionMetrics.incrementCounter('pipeline_stage_errors', 1, {
            flow: flowId,
            stage: stage.name
          });

          this.logger.error(`Pipeline stage failed: ${stage.name}`, stageError as Error, {
            flowId,
            context
          });

          // Continue with other stages unless this is a critical privacy stage
          if (stage.privacy.required) {
            throw new Error(errorMessage);
          }
        }
      }

      metadata.processingTime = Date.now() - startTime;
      
      // Update metrics
      this.pipelineMetrics.totalProcessed++;
      if (metadata.piiDetected) this.pipelineMetrics.piiDetected++;
      if (metadata.anonymized) this.pipelineMetrics.anonymized++;
      if (errors.length > 0) this.pipelineMetrics.complianceViolations++;

      // Publish privacy event
      if (this.eventBus && metadata.piiDetected) {
        await this.eventBus.publish({
          type: PrivacyEvents.PII_DETECTED,
          correlationId: context.correlationId,
          timestamp: new Date(),
          payload: {
            flowId,
            dataClassification: metadata.dataClassification,
            anonymized: metadata.anonymized
          },
          metadata: {
            userId: context.userId,
            studentId: context.studentId
          }
        });
      }

      productionMetrics.incrementCounter('pipeline_flows_completed', 1, {
        flow: flowId,
        status: errors.length > 0 ? 'warning' : 'success'
      });

      productionMetrics.recordHistogram('pipeline_flow_duration_ms', metadata.processingTime, {
        flow: flowId
      });

      return {
        data: processedData,
        metadata,
        warnings,
        errors
      };

    } catch (error) {
      this.pipelineMetrics.complianceViolations++;
      
      productionMetrics.incrementCounter('pipeline_flows_completed', 1, {
        flow: flowId,
        status: 'error'
      });

      this.logger.error(`Data flow execution failed: ${flowId}`, error as Error, {
        context,
        processingTime: Date.now() - startTime
      });

      throw error;
    }
  }

  /**
   * Pipeline Stage Processors
   */

  private async validateInput(data: any, context: PipelineContext): Promise<PipelineResult> {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Basic validation
    if (!data || typeof data !== 'object') {
      errors.push('Invalid input data format');
    }

    // Check for required fields based on context
    if (context.purpose === 'student_profile' && !data.studentId) {
      errors.push('Student ID required for student profile operations');
    }

    return {
      data,
      metadata: {
        piiDetected: false,
        anonymized: false,
        dataClassification: 'unclassified',
        processingTime: 0,
        complianceFlags: []
      },
      warnings,
      errors
    };
  }

  private async detectPII(data: any, context: PipelineContext): Promise<PipelineResult> {
    const detectionResult = await this.piiDetector.detectPII(JSON.stringify(data));
    
    const warnings: string[] = [];
    const complianceFlags: string[] = [];

    if (detectionResult.containsPII) {
      warnings.push(`PII detected: ${detectionResult.detectedTypes.join(', ')}`);
      complianceFlags.push('pii-detected');
    }

    return {
      data,
      metadata: {
        piiDetected: detectionResult.containsPII,
        anonymized: false,
        dataClassification: detectionResult.containsPII ? 'confidential' : 'internal',
        processingTime: 0,
        complianceFlags
      },
      warnings,
      errors: []
    };
  }

  private async verifyConsent(data: any, context: PipelineContext): Promise<PipelineResult> {
    const warnings: string[] = [];
    const errors: string[] = [];
    const complianceFlags: string[] = [];

    // Check consent for data processing
    if (context.studentId && !context.consent.dataProcessing) {
      errors.push('Student consent required for data processing');
      complianceFlags.push('consent-missing');
    }

    // Check purpose limitation
    if (context.purpose === 'research' && !context.consent.research) {
      errors.push('Research consent required for research purposes');
      complianceFlags.push('purpose-violation');
    }

    if (errors.length === 0) {
      complianceFlags.push('consent-verified');
    }

    return {
      data,
      metadata: {
        piiDetected: false,
        anonymized: false,
        dataClassification: 'verified',
        processingTime: 0,
        complianceFlags
      },
      warnings,
      errors
    };
  }

  private async anonymizeData(data: any, context: PipelineContext): Promise<PipelineResult> {
    const rules = this.anonymizationRules.get(context.purpose) || [];
    let anonymizedData = { ...data };
    let anonymized = false;

    for (const rule of rules) {
      if (anonymizedData[rule.field] !== undefined) {
        anonymizedData[rule.field] = await this.applyAnonymization(
          anonymizedData[rule.field],
          rule
        );
        anonymized = true;
      }
    }

    return {
      data: anonymizedData,
      metadata: {
        piiDetected: false,
        anonymized,
        dataClassification: anonymized ? 'anonymized' : 'original',
        processingTime: 0,
        complianceFlags: anonymized ? ['anonymized'] : []
      },
      warnings: [],
      errors: []
    };
  }

  private async checkCompliance(data: any, context: PipelineContext): Promise<PipelineResult> {
    const complianceFlags: string[] = [];
    const warnings: string[] = [];

    // FERPA compliance
    if (context.studentId && context.purpose === 'grade_sharing') {
      complianceFlags.push('ferpa-compliant');
    }

    // COPPA compliance for users under 13
    if (data.age && data.age < 13 && !context.consent.parentalConsent) {
      warnings.push('COPPA compliance required for users under 13');
      complianceFlags.push('coppa-required');
    }

    // GDPR compliance
    if (context.complianceLevel === 'strict') {
      complianceFlags.push('gdpr-compliant');
    }

    return {
      data,
      metadata: {
        piiDetected: false,
        anonymized: false,
        dataClassification: 'compliant',
        processingTime: 0,
        complianceFlags
      },
      warnings,
      errors: []
    };
  }

  private async aggregateData(data: any, context: PipelineContext): Promise<PipelineResult> {
    // Implement data aggregation with privacy preservation
    const aggregatedData = {
      ...data,
      aggregated: true,
      timestamp: new Date(),
      cohortSize: data.length || 1
    };

    return {
      data: aggregatedData,
      metadata: {
        piiDetected: false,
        anonymized: false,
        dataClassification: 'aggregated',
        processingTime: 0,
        complianceFlags: ['aggregated']
      },
      warnings: [],
      errors: []
    };
  }

  private async applyDifferentialPrivacy(data: any, context: PipelineContext): Promise<PipelineResult> {
    const config = this.differentialPrivacyConfig.get(context.purpose);
    if (!config) {
      return {
        data,
        metadata: {
          piiDetected: false,
          anonymized: false,
          dataClassification: 'original',
          processingTime: 0,
          complianceFlags: []
        },
        warnings: ['No differential privacy config found'],
        errors: []
      };
    }

    // Check privacy budget
    const currentBudget = this.privacyBudgets.get(context.purpose) || 0;
    const budgetLimit = this.privacyBudgetLimits.get(context.purpose) || 1.0;

    if (currentBudget + config.epsilon > budgetLimit) {
      return {
        data,
        metadata: {
          piiDetected: false,
          anonymized: false,
          dataClassification: 'budget-exceeded',
          processingTime: 0,
          complianceFlags: ['budget-exceeded']
        },
        warnings: [],
        errors: ['Privacy budget exceeded']
      };
    }

    // Apply noise based on mechanism
    const noisyData = this.addDifferentialPrivacyNoise(data, config);
    
    // Update privacy budget
    this.privacyBudgets.set(context.purpose, currentBudget + config.epsilon);

    return {
      data: noisyData,
      metadata: {
        piiDetected: false,
        anonymized: true,
        dataClassification: 'differential-private',
        processingTime: 0,
        complianceFlags: ['differential-privacy']
      },
      warnings: [],
      errors: []
    };
  }

  /**
   * Apply anonymization rule to a value
   */
  private async applyAnonymization(value: any, rule: AnonymizationRule): Promise<any> {
    switch (rule.method) {
      case 'hash':
        return this.hashValue(value);
      case 'redact':
        return rule.parameters?.replacement || '[REDACTED]';
      case 'generalize':
        return this.generalizeValue(value, rule.parameters);
      case 'suppress':
        return null;
      case 'pseudonymize':
        return this.pseudonymizeValue(value, rule.parameters);
      default:
        return value;
    }
  }

  /**
   * Hash a value
   */
  private hashValue(value: any): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(String(value)).digest('hex');
  }

  /**
   * Generalize a value
   */
  private generalizeValue(value: any, parameters?: Record<string, any>): any {
    if (typeof value === 'string' && parameters?.maskLastOctet) {
      // IP address generalization
      const parts = value.split('.');
      if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
      }
    }
    
    if (typeof value === 'number' && parameters?.precision) {
      const precision = parameters.precision;
      return Math.round(value / precision) * precision;
    }

    return value;
  }

  /**
   * Pseudonymize a value
   */
  private pseudonymizeValue(value: any, parameters?: Record<string, any>): string {
    const crypto = require('crypto');
    const algorithm = parameters?.algorithm || 'aes-256-cbc';
    const key = process.env.PSEUDONYMIZATION_KEY || 'default-key-change-in-production';
    
    // Simple pseudonymization - in production, use proper key management
    return crypto.createHmac('sha256', key).update(String(value)).digest('hex');
  }

  /**
   * Add differential privacy noise
   */
  private addDifferentialPrivacyNoise(data: any, config: DifferentialPrivacyConfig): any {
    if (typeof data === 'number') {
      const noise = this.generateNoise(config);
      return Math.max(0, data + noise); // Ensure non-negative results
    }

    if (Array.isArray(data)) {
      return data.map(item => this.addDifferentialPrivacyNoise(item, config));
    }

    if (typeof data === 'object' && data !== null) {
      const noisyData: any = {};
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'number') {
          noisyData[key] = this.addDifferentialPrivacyNoise(value, config);
        } else {
          noisyData[key] = value;
        }
      }
      return noisyData;
    }

    return data;
  }

  /**
   * Generate noise for differential privacy
   */
  private generateNoise(config: DifferentialPrivacyConfig): number {
    const scale = config.sensitivity / config.epsilon;
    
    switch (config.mechanism) {
      case 'laplace':
        return this.sampleLaplace(0, scale);
      case 'gaussian':
        return this.sampleGaussian(0, scale);
      default:
        return this.sampleLaplace(0, scale);
    }
  }

  /**
   * Sample from Laplace distribution
   */
  private sampleLaplace(location: number, scale: number): number {
    const u = Math.random() - 0.5;
    return location - scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
  }

  /**
   * Sample from Gaussian distribution
   */
  private sampleGaussian(mean: number, variance: number): number {
    // Box-Muller transform
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + Math.sqrt(variance) * z;
  }

  /**
   * Event handlers
   */
  private async handleDataAccessRequest(event: any): Promise<void> {
    this.logger.info('Handling data access request', {
      userId: event.payload.userId,
      purpose: event.payload.purpose
    });

    // Process through appropriate data flow
    // Implementation would depend on specific requirements
  }

  private async handleConsentUpdate(event: any): Promise<void> {
    this.logger.info('Handling consent update', {
      userId: event.payload.userId,
      consentType: event.payload.consentType
    });

    // Update consent context for future processing
    // Implementation would depend on specific requirements
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    setInterval(() => {
      this.updateMetrics();
    }, 30000); // Every 30 seconds
  }

  /**
   * Update pipeline metrics
   */
  private updateMetrics(): void {
    productionMetrics.setGauge('pipeline_total_processed', this.pipelineMetrics.totalProcessed);
    productionMetrics.setGauge('pipeline_pii_detected', this.pipelineMetrics.piiDetected);
    productionMetrics.setGauge('pipeline_anonymized', this.pipelineMetrics.anonymized);
    productionMetrics.setGauge('pipeline_compliance_violations', this.pipelineMetrics.complianceViolations);

    const piiDetectionRate = this.pipelineMetrics.totalProcessed > 0 
      ? (this.pipelineMetrics.piiDetected / this.pipelineMetrics.totalProcessed) * 100 
      : 0;

    const anonymizationRate = this.pipelineMetrics.totalProcessed > 0 
      ? (this.pipelineMetrics.anonymized / this.pipelineMetrics.totalProcessed) * 100 
      : 0;

    productionMetrics.setGauge('pipeline_pii_detection_rate', piiDetectionRate);
    productionMetrics.setGauge('pipeline_anonymization_rate', anonymizationRate);

    // Update privacy budget usage
    for (const [purpose, budget] of this.privacyBudgets.entries()) {
      const limit = this.privacyBudgetLimits.get(purpose) || 1.0;
      const usage = (budget / limit) * 100;
      
      productionMetrics.setGauge('pipeline_privacy_budget_usage', usage, {
        purpose
      });
    }
  }

  /**
   * Get pipeline statistics
   */
  getPipelineStats(): {
    metrics: typeof this.pipelineMetrics;
    dataFlows: number;
    queueSize: number;
    privacyBudgets: Record<string, { used: number; limit: number; remaining: number }>;
  } {
    const privacyBudgets: Record<string, { used: number; limit: number; remaining: number }> = {};
    
    for (const [purpose, used] of this.privacyBudgets.entries()) {
      const limit = this.privacyBudgetLimits.get(purpose) || 1.0;
      privacyBudgets[purpose] = {
        used,
        limit,
        remaining: limit - used
      };
    }

    return {
      metrics: { ...this.pipelineMetrics },
      dataFlows: this.dataFlows.size,
      queueSize: this.processingQueue.length,
      privacyBudgets
    };
  }

  /**
   * Reset privacy budget for a purpose
   */
  resetPrivacyBudget(purpose: string): void {
    this.privacyBudgets.set(purpose, 0);
    
    this.logger.info(`Privacy budget reset for purpose: ${purpose}`);
    
    productionMetrics.incrementCounter('pipeline_privacy_budget_resets', 1, {
      purpose
    });
  }
}

// Export singleton instance
export const privacyAwareDataPipeline = PrivacyAwareDataPipeline.getInstance();