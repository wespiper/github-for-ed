import { Injectable } from '@nestjs/common';
import { Logger } from '../monitoring/Logger';
import { MetricsCollector } from '../monitoring/MetricsCollector';

export interface HACluster {
  id: string;
  name: string;
  type: 'active-active' | 'active-passive' | 'multi-master';
  nodes: HANode[];
  healthStatus: 'healthy' | 'degraded' | 'critical' | 'offline';
  uptime: number;
  lastFailover?: Date;
  configuration: HAConfiguration;
}

export interface HANode {
  id: string;
  name: string;
  role: 'primary' | 'secondary' | 'arbiter';
  status: 'online' | 'offline' | 'maintenance' | 'failed';
  region: string;
  zone: string;
  ipAddress: string;
  resources: NodeResources;
  metrics: NodeMetrics;
  lastHealthCheck: Date;
}

export interface NodeResources {
  cpu: number; // percentage used
  memory: number; // percentage used
  disk: number; // percentage used
  network: number; // bandwidth usage
  connections: number; // active connections
}

export interface NodeMetrics {
  requestsPerSecond: number;
  responseTimeMs: number;
  errorRate: number;
  throughputMbps: number;
  availability: number;
}

export interface HAConfiguration {
  failoverTimeoutSeconds: number;
  healthCheckIntervalSeconds: number;
  maximumFailoverAttempts: number;
  autoFailbackEnabled: boolean;
  splitBrainProtection: boolean;
  dataReplicationMode: 'synchronous' | 'asynchronous' | 'semi-synchronous';
  backupRetentionDays: number;
  encryptionInTransit: boolean;
  encryptionAtRest: boolean;
}

export interface FailoverEvent {
  id: string;
  clusterId: string;
  sourceNodeId: string;
  targetNodeId: string;
  reason: string;
  triggeredAt: Date;
  completedAt?: Date;
  status: 'in_progress' | 'completed' | 'failed' | 'rolled_back';
  dataLoss: boolean;
  downTimeSeconds: number;
  automaticTrigger: boolean;
}

export interface BackupJob {
  id: string;
  type: 'full' | 'incremental' | 'differential';
  status: 'scheduled' | 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  sizeBytes: number;
  compressionRatio: number;
  encryptionEnabled: boolean;
  storageLocation: string;
  retentionDate: Date;
  verificationStatus: 'pending' | 'verified' | 'corrupted';
}

export interface DisasterRecoveryPlan {
  id: string;
  name: string;
  rpoMinutes: number; // Recovery Point Objective
  rtoMinutes: number; // Recovery Time Objective
  scenarios: DRScenario[];
  testSchedule: TestSchedule;
  lastTested: Date;
  testResults: DRTestResult[];
}

export interface DRScenario {
  name: string;
  description: string;
  triggerConditions: string[];
  recoverySteps: RecoveryStep[];
  estimatedRtoMinutes: number;
  dataLossRisk: 'none' | 'minimal' | 'moderate' | 'high';
}

export interface RecoveryStep {
  order: number;
  description: string;
  automated: boolean;
  estimatedDurationMinutes: number;
  dependencies: string[];
  verificationCriteria: string[];
}

export interface TestSchedule {
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'annually';
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string;
  scenarios: string[];
}

export interface DRTestResult {
  id: string;
  scenario: string;
  executedAt: Date;
  actualRtoMinutes: number;
  success: boolean;
  issues: string[];
  recommendations: string[];
}

@Injectable()
export class HighAvailabilityService {
  private readonly logger = new Logger('HighAvailabilityService');
  private readonly metrics = new MetricsCollector();

  private clusters: Map<string, HACluster> = new Map();
  private failoverEvents: Map<string, FailoverEvent> = new Map();
  private backupJobs: Map<string, BackupJob> = new Map();
  private drPlans: Map<string, DisasterRecoveryPlan> = new Map();

  constructor() {
    this.initializeHAClusters();
    this.initializeDisasterRecoveryPlans();
    this.startHealthMonitoring();
  }

  private initializeHAClusters(): void {
    // Database cluster
    this.addCluster({
      id: 'postgres-cluster',
      name: 'PostgreSQL High Availability Cluster',
      type: 'active-passive',
      nodes: [
        {
          id: 'postgres-primary',
          name: 'PostgreSQL Primary',
          role: 'primary',
          status: 'online',
          region: 'us-east-1',
          zone: 'us-east-1a',
          ipAddress: '10.0.1.10',
          resources: { cpu: 45, memory: 60, disk: 35, network: 25, connections: 150 },
          metrics: { requestsPerSecond: 500, responseTimeMs: 5, errorRate: 0.1, throughputMbps: 100, availability: 99.95 },
          lastHealthCheck: new Date()
        },
        {
          id: 'postgres-secondary',
          name: 'PostgreSQL Secondary',
          role: 'secondary',
          status: 'online',
          region: 'us-east-1',
          zone: 'us-east-1b',
          ipAddress: '10.0.2.10',
          resources: { cpu: 20, memory: 40, disk: 35, network: 15, connections: 0 },
          metrics: { requestsPerSecond: 0, responseTimeMs: 0, errorRate: 0, throughputMbps: 50, availability: 99.9 },
          lastHealthCheck: new Date()
        }
      ],
      healthStatus: 'healthy',
      uptime: 99.95,
      configuration: {
        failoverTimeoutSeconds: 30,
        healthCheckIntervalSeconds: 10,
        maximumFailoverAttempts: 3,
        autoFailbackEnabled: false,
        splitBrainProtection: true,
        dataReplicationMode: 'synchronous',
        backupRetentionDays: 30,
        encryptionInTransit: true,
        encryptionAtRest: true
      }
    });

    // Application server cluster
    this.addCluster({
      id: 'app-cluster',
      name: 'Application Server Cluster',
      type: 'active-active',
      nodes: [
        {
          id: 'app-node-1',
          name: 'Application Server 1',
          role: 'primary',
          status: 'online',
          region: 'us-east-1',
          zone: 'us-east-1a',
          ipAddress: '10.0.1.20',
          resources: { cpu: 65, memory: 70, disk: 40, network: 45, connections: 500 },
          metrics: { requestsPerSecond: 200, responseTimeMs: 32, errorRate: 0.05, throughputMbps: 200, availability: 99.9 },
          lastHealthCheck: new Date()
        },
        {
          id: 'app-node-2',
          name: 'Application Server 2',
          role: 'primary',
          status: 'online',
          region: 'us-east-1',
          zone: 'us-east-1b',
          ipAddress: '10.0.2.20',
          resources: { cpu: 55, memory: 65, disk: 40, network: 35, connections: 450 },
          metrics: { requestsPerSecond: 180, responseTimeMs: 35, errorRate: 0.03, throughputMbps: 180, availability: 99.95 },
          lastHealthCheck: new Date()
        },
        {
          id: 'app-node-3',
          name: 'Application Server 3',
          role: 'primary',
          status: 'online',
          region: 'us-west-2',
          zone: 'us-west-2a',
          ipAddress: '10.1.1.20',
          resources: { cpu: 40, memory: 50, disk: 30, network: 25, connections: 300 },
          metrics: { requestsPerSecond: 120, responseTimeMs: 45, errorRate: 0.02, throughputMbps: 150, availability: 99.8 },
          lastHealthCheck: new Date()
        }
      ],
      healthStatus: 'healthy',
      uptime: 99.88,
      configuration: {
        failoverTimeoutSeconds: 10,
        healthCheckIntervalSeconds: 5,
        maximumFailoverAttempts: 5,
        autoFailbackEnabled: true,
        splitBrainProtection: false,
        dataReplicationMode: 'asynchronous',
        backupRetentionDays: 7,
        encryptionInTransit: true,
        encryptionAtRest: true
      }
    });

    // Redis cluster
    this.addCluster({
      id: 'redis-cluster',
      name: 'Redis Cache Cluster',
      type: 'multi-master',
      nodes: [
        {
          id: 'redis-master-1',
          name: 'Redis Master 1',
          role: 'primary',
          status: 'online',
          region: 'us-east-1',
          zone: 'us-east-1a',
          ipAddress: '10.0.1.30',
          resources: { cpu: 30, memory: 80, disk: 15, network: 40, connections: 1000 },
          metrics: { requestsPerSecond: 5000, responseTimeMs: 1, errorRate: 0, throughputMbps: 500, availability: 99.99 },
          lastHealthCheck: new Date()
        },
        {
          id: 'redis-master-2',
          name: 'Redis Master 2',
          role: 'primary',
          status: 'online',
          region: 'us-east-1',
          zone: 'us-east-1b',
          ipAddress: '10.0.2.30',
          resources: { cpu: 25, memory: 75, disk: 15, network: 35, connections: 800 },
          metrics: { requestsPerSecond: 4000, responseTimeMs: 1, errorRate: 0, throughputMbps: 400, availability: 99.98 },
          lastHealthCheck: new Date()
        },
        {
          id: 'redis-master-3',
          name: 'Redis Master 3',
          role: 'primary',
          status: 'online',
          region: 'us-west-2',
          zone: 'us-west-2a',
          ipAddress: '10.1.1.30',
          resources: { cpu: 20, memory: 70, disk: 15, network: 30, connections: 600 },
          metrics: { requestsPerSecond: 3000, responseTimeMs: 2, errorRate: 0, throughputMbps: 300, availability: 99.95 },
          lastHealthCheck: new Date()
        }
      ],
      healthStatus: 'healthy',
      uptime: 99.97,
      configuration: {
        failoverTimeoutSeconds: 5,
        healthCheckIntervalSeconds: 2,
        maximumFailoverAttempts: 10,
        autoFailbackEnabled: true,
        splitBrainProtection: true,
        dataReplicationMode: 'asynchronous',
        backupRetentionDays: 3,
        encryptionInTransit: true,
        encryptionAtRest: false
      }
    });

    this.logger.info('HA clusters initialized', { clusterCount: this.clusters.size });
  }

  private addCluster(cluster: HACluster): void {
    this.clusters.set(cluster.id, cluster);
  }

  private initializeDisasterRecoveryPlans(): void {
    // Primary DR plan
    this.addDRPlan({
      id: 'primary-dr-plan',
      name: 'Primary Disaster Recovery Plan',
      rpoMinutes: 5,
      rtoMinutes: 30,
      scenarios: [
        {
          name: 'Data Center Outage',
          description: 'Complete loss of primary data center',
          triggerConditions: ['data_center_offline', 'network_partition', 'power_failure'],
          recoverySteps: [
            {
              order: 1,
              description: 'Activate secondary data center',
              automated: true,
              estimatedDurationMinutes: 5,
              dependencies: [],
              verificationCriteria: ['secondary_nodes_online', 'network_connectivity']
            },
            {
              order: 2,
              description: 'Promote secondary database to primary',
              automated: true,
              estimatedDurationMinutes: 10,
              dependencies: ['secondary_nodes_online'],
              verificationCriteria: ['database_writable', 'data_consistency']
            },
            {
              order: 3,
              description: 'Update DNS and load balancer',
              automated: true,
              estimatedDurationMinutes: 5,
              dependencies: ['database_writable'],
              verificationCriteria: ['traffic_routing', 'health_checks_passing']
            },
            {
              order: 4,
              description: 'Verify application functionality',
              automated: false,
              estimatedDurationMinutes: 10,
              dependencies: ['traffic_routing'],
              verificationCriteria: ['user_authentication', 'data_access', 'core_functions']
            }
          ],
          estimatedRtoMinutes: 30,
          dataLossRisk: 'minimal'
        },
        {
          name: 'Database Corruption',
          description: 'Primary database corruption or failure',
          triggerConditions: ['database_corruption', 'replication_failure', 'data_integrity_error'],
          recoverySteps: [
            {
              order: 1,
              description: 'Stop application writes to corrupted database',
              automated: true,
              estimatedDurationMinutes: 2,
              dependencies: [],
              verificationCriteria: ['writes_stopped', 'read_only_mode']
            },
            {
              order: 2,
              description: 'Restore from latest verified backup',
              automated: false,
              estimatedDurationMinutes: 45,
              dependencies: ['writes_stopped'],
              verificationCriteria: ['backup_integrity', 'data_restored']
            },
            {
              order: 3,
              description: 'Apply transaction logs since backup',
              automated: false,
              estimatedDurationMinutes: 15,
              dependencies: ['data_restored'],
              verificationCriteria: ['transactions_applied', 'data_consistency']
            },
            {
              order: 4,
              description: 'Restart application services',
              automated: true,
              estimatedDurationMinutes: 5,
              dependencies: ['data_consistency'],
              verificationCriteria: ['services_online', 'health_checks_passing']
            }
          ],
          estimatedRtoMinutes: 67,
          dataLossRisk: 'moderate'
        }
      ],
      testSchedule: {
        frequency: 'quarterly',
        dayOfMonth: 15,
        time: '02:00',
        scenarios: ['Data Center Outage']
      },
      lastTested: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      testResults: [
        {
          id: 'test-1',
          scenario: 'Data Center Outage',
          executedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          actualRtoMinutes: 28,
          success: true,
          issues: ['DNS propagation took 2 minutes longer than expected'],
          recommendations: ['Pre-configure DNS with lower TTL', 'Add automated DNS update verification']
        }
      ]
    });

    this.logger.info('Disaster recovery plans initialized', { planCount: this.drPlans.size });
  }

  private addDRPlan(plan: DisasterRecoveryPlan): void {
    this.drPlans.set(plan.id, plan);
  }

  private startHealthMonitoring(): void {
    // Start health check intervals for all clusters
    setInterval(() => {
      this.performHealthChecks();
    }, 30000); // Every 30 seconds

    // Start backup job monitoring
    setInterval(() => {
      this.monitorBackupJobs();
    }, 300000); // Every 5 minutes

    this.logger.info('Health monitoring started');
  }

  private async performHealthChecks(): Promise<void> {
    for (const cluster of this.clusters.values()) {
      await this.checkClusterHealth(cluster);
    }
  }

  private async checkClusterHealth(cluster: HACluster): Promise<void> {
    let healthyNodes = 0;
    let totalNodes = cluster.nodes.length;

    for (const node of cluster.nodes) {
      const isHealthy = await this.checkNodeHealth(node);
      if (isHealthy) {
        healthyNodes++;
      }
    }

    // Update cluster health status
    const healthPercentage = (healthyNodes / totalNodes) * 100;
    
    if (healthPercentage >= 90) {
      cluster.healthStatus = 'healthy';
    } else if (healthPercentage >= 70) {
      cluster.healthStatus = 'degraded';
    } else if (healthPercentage >= 50) {
      cluster.healthStatus = 'critical';
    } else {
      cluster.healthStatus = 'offline';
    }

    // Record metrics
    this.metrics.recordMetric('cluster_health_percentage', healthPercentage, [
      'cluster_id', cluster.id,
      'cluster_type', cluster.type
    ]);

    // Trigger failover if needed
    if (cluster.healthStatus === 'critical' || cluster.healthStatus === 'offline') {
      await this.triggerFailover(cluster);
    }
  }

  private async checkNodeHealth(node: HANode): Promise<boolean> {
    try {
      // Simulate health check
      const isHealthy = Math.random() > 0.05; // 95% uptime simulation
      
      node.lastHealthCheck = new Date();
      
      if (!isHealthy && node.status === 'online') {
        node.status = 'failed';
        this.logger.warn('Node health check failed', { nodeId: node.id, nodeName: node.name });
      } else if (isHealthy && node.status === 'failed') {
        node.status = 'online';
        this.logger.info('Node recovered', { nodeId: node.id, nodeName: node.name });
      }

      // Update node metrics
      this.updateNodeMetrics(node);

      return isHealthy;
    } catch (error) {
      this.logger.error('Health check error', { nodeId: node.id, error: error.message });
      return false;
    }
  }

  private updateNodeMetrics(node: HANode): void {
    // Simulate metric updates
    node.resources.cpu = Math.max(0, Math.min(100, node.resources.cpu + (Math.random() - 0.5) * 10));
    node.resources.memory = Math.max(0, Math.min(100, node.resources.memory + (Math.random() - 0.5) * 5));
    node.metrics.responseTimeMs = Math.max(1, node.metrics.responseTimeMs + (Math.random() - 0.5) * 10);
    node.metrics.errorRate = Math.max(0, Math.min(5, node.metrics.errorRate + (Math.random() - 0.5) * 0.1));
  }

  private async triggerFailover(cluster: HACluster): Promise<void> {
    // Find a healthy node to failover to
    const healthyNodes = cluster.nodes.filter(node => node.status === 'online');
    const failedNodes = cluster.nodes.filter(node => node.status === 'failed');

    if (healthyNodes.length === 0) {
      this.logger.error('No healthy nodes available for failover', { clusterId: cluster.id });
      return;
    }

    if (failedNodes.length === 0) {
      return; // No failed nodes to failover from
    }

    const sourceNode = failedNodes[0];
    const targetNode = healthyNodes[0];

    const failoverEvent: FailoverEvent = {
      id: `failover-${Date.now()}`,
      clusterId: cluster.id,
      sourceNodeId: sourceNode.id,
      targetNodeId: targetNode.id,
      reason: 'Node health check failure',
      triggeredAt: new Date(),
      status: 'in_progress',
      dataLoss: false,
      downTimeSeconds: 0,
      automaticTrigger: true
    };

    this.failoverEvents.set(failoverEvent.id, failoverEvent);

    try {
      await this.executeFailover(failoverEvent, cluster);
    } catch (error) {
      failoverEvent.status = 'failed';
      this.logger.error('Failover failed', { 
        failoverId: failoverEvent.id, 
        error: error.message 
      });
    }
  }

  private async executeFailover(failoverEvent: FailoverEvent, cluster: HACluster): Promise<void> {
    const startTime = Date.now();

    this.logger.info('Starting failover', {
      failoverId: failoverEvent.id,
      clusterId: cluster.id,
      sourceNode: failoverEvent.sourceNodeId,
      targetNode: failoverEvent.targetNodeId
    });

    // Simulate failover process
    await new Promise(resolve => setTimeout(resolve, cluster.configuration.failoverTimeoutSeconds * 1000));

    // Update cluster state
    const sourceNode = cluster.nodes.find(n => n.id === failoverEvent.sourceNodeId);
    const targetNode = cluster.nodes.find(n => n.id === failoverEvent.targetNodeId);

    if (sourceNode && targetNode) {
      if (sourceNode.role === 'primary') {
        sourceNode.role = 'secondary';
        targetNode.role = 'primary';
      }
    }

    const endTime = Date.now();
    failoverEvent.completedAt = new Date();
    failoverEvent.status = 'completed';
    failoverEvent.downTimeSeconds = (endTime - startTime) / 1000;

    cluster.lastFailover = new Date();

    this.logger.info('Failover completed', {
      failoverId: failoverEvent.id,
      downTimeSeconds: failoverEvent.downTimeSeconds,
      newPrimary: failoverEvent.targetNodeId
    });

    this.metrics.recordMetric('failover_events_total', 1, [
      'cluster_id', cluster.id,
      'status', failoverEvent.status
    ]);

    this.metrics.recordMetric('failover_downtime_seconds', failoverEvent.downTimeSeconds, [
      'cluster_id', cluster.id
    ]);
  }

  private async monitorBackupJobs(): Promise<void> {
    // Check for scheduled backup jobs
    for (const cluster of this.clusters.values()) {
      if (this.shouldCreateBackup(cluster)) {
        await this.createBackupJob(cluster);
      }
    }

    // Check running backup jobs
    for (const job of this.backupJobs.values()) {
      if (job.status === 'running') {
        await this.checkBackupProgress(job);
      }
    }
  }

  private shouldCreateBackup(cluster: HACluster): boolean {
    // Simple logic - create daily backups
    const lastBackup = this.getLastBackupTime(cluster.id);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    return !lastBackup || lastBackup < oneDayAgo;
  }

  private getLastBackupTime(clusterId: string): Date | null {
    const clusterBackups = Array.from(this.backupJobs.values())
      .filter(job => job.id.includes(clusterId) && job.status === 'completed')
      .sort((a, b) => b.endTime!.getTime() - a.endTime!.getTime());

    return clusterBackups.length > 0 ? clusterBackups[0].endTime! : null;
  }

  private async createBackupJob(cluster: HACluster): Promise<void> {
    const backupJob: BackupJob = {
      id: `backup-${cluster.id}-${Date.now()}`,
      type: 'incremental',
      status: 'scheduled',
      startTime: new Date(),
      sizeBytes: 0,
      compressionRatio: 0,
      encryptionEnabled: cluster.configuration.encryptionAtRest,
      storageLocation: `s3://backups/${cluster.id}/`,
      retentionDate: new Date(Date.now() + cluster.configuration.backupRetentionDays * 24 * 60 * 60 * 1000),
      verificationStatus: 'pending'
    };

    this.backupJobs.set(backupJob.id, backupJob);

    // Start backup job
    await this.executeBackupJob(backupJob);
  }

  private async executeBackupJob(job: BackupJob): Promise<void> {
    job.status = 'running';

    this.logger.info('Starting backup job', { jobId: job.id, type: job.type });

    try {
      // Simulate backup process
      const backupDurationMs = 30000 + Math.random() * 60000; // 30-90 seconds
      await new Promise(resolve => setTimeout(resolve, backupDurationMs));

      // Simulate backup completion
      job.status = 'completed';
      job.endTime = new Date();
      job.sizeBytes = Math.floor(Math.random() * 10000000000); // 0-10GB
      job.compressionRatio = 0.3 + Math.random() * 0.4; // 30-70% compression
      job.verificationStatus = 'verified';

      this.logger.info('Backup job completed', {
        jobId: job.id,
        sizeGB: Math.round(job.sizeBytes / 1000000000),
        compressionRatio: job.compressionRatio
      });

      this.metrics.recordMetric('backup_jobs_total', 1, [
        'type', job.type,
        'status', job.status
      ]);

    } catch (error) {
      job.status = 'failed';
      job.endTime = new Date();
      this.logger.error('Backup job failed', { jobId: job.id, error: error.message });
    }
  }

  private async checkBackupProgress(job: BackupJob): Promise<void> {
    // Simulate progress checking
    const elapsedMs = Date.now() - job.startTime.getTime();
    
    // If backup is taking too long, mark as failed
    if (elapsedMs > 2 * 60 * 60 * 1000) { // 2 hours
      job.status = 'failed';
      job.endTime = new Date();
      this.logger.error('Backup job timeout', { jobId: job.id });
    }
  }

  async getClusters(): Promise<HACluster[]> {
    return Array.from(this.clusters.values());
  }

  async getCluster(clusterId: string): Promise<HACluster | null> {
    return this.clusters.get(clusterId) || null;
  }

  async getFailoverHistory(clusterId: string): Promise<FailoverEvent[]> {
    return Array.from(this.failoverEvents.values())
      .filter(event => event.clusterId === clusterId)
      .sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime());
  }

  async getBackupJobs(clusterId?: string): Promise<BackupJob[]> {
    let jobs = Array.from(this.backupJobs.values());
    
    if (clusterId) {
      jobs = jobs.filter(job => job.id.includes(clusterId));
    }

    return jobs.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }

  async getDisasterRecoveryPlans(): Promise<DisasterRecoveryPlan[]> {
    return Array.from(this.drPlans.values());
  }

  async executeDisasterRecoveryTest(planId: string, scenarioName: string): Promise<DRTestResult> {
    const plan = this.drPlans.get(planId);
    if (!plan) {
      throw new Error('Disaster recovery plan not found');
    }

    const scenario = plan.scenarios.find(s => s.name === scenarioName);
    if (!scenario) {
      throw new Error('Scenario not found');
    }

    const testResult: DRTestResult = {
      id: `test-${Date.now()}`,
      scenario: scenarioName,
      executedAt: new Date(),
      actualRtoMinutes: 0,
      success: false,
      issues: [],
      recommendations: []
    };

    const startTime = Date.now();

    try {
      this.logger.info('Starting DR test', { planId, scenario: scenarioName });

      // Simulate test execution
      for (const step of scenario.recoverySteps) {
        const stepStartTime = Date.now();
        
        // Simulate step execution
        await new Promise(resolve => 
          setTimeout(resolve, step.estimatedDurationMinutes * 1000) // Use seconds for demo
        );

        const stepDuration = (Date.now() - stepStartTime) / 1000 / 60; // Convert to minutes
        
        if (stepDuration > step.estimatedDurationMinutes * 1.5) {
          testResult.issues.push(`Step "${step.description}" took ${stepDuration.toFixed(1)} minutes (expected ${step.estimatedDurationMinutes})`);
        }
      }

      const totalDuration = (Date.now() - startTime) / 1000 / 60; // Convert to minutes
      testResult.actualRtoMinutes = totalDuration;
      testResult.success = totalDuration <= scenario.estimatedRtoMinutes * 1.2; // 20% tolerance

      if (testResult.actualRtoMinutes > plan.rtoMinutes) {
        testResult.issues.push(`Actual RTO (${testResult.actualRtoMinutes.toFixed(1)} min) exceeds target RTO (${plan.rtoMinutes} min)`);
        testResult.recommendations.push('Review and optimize recovery procedures');
      }

      plan.testResults.push(testResult);
      plan.lastTested = new Date();

      this.logger.info('DR test completed', {
        planId,
        scenario: scenarioName,
        actualRtoMinutes: testResult.actualRtoMinutes,
        success: testResult.success
      });

    } catch (error) {
      testResult.success = false;
      testResult.issues.push(`Test execution failed: ${error.message}`);
      
      this.logger.error('DR test failed', {
        planId,
        scenario: scenarioName,
        error: error.message
      });
    }

    this.metrics.recordMetric('dr_tests_total', 1, [
      'plan_id', planId,
      'scenario', scenarioName,
      'success', testResult.success.toString()
    ]);

    return testResult;
  }

  async getHAMetrics(): Promise<{
    overallUptime: number;
    clusterHealthScores: Record<string, number>;
    failoverCount24h: number;
    averageFailoverTime: number;
    backupSuccessRate: number;
    lastDRTest: Date | null;
  }> {
    const clusters = Array.from(this.clusters.values());
    const overallUptime = clusters.reduce((sum, cluster) => sum + cluster.uptime, 0) / clusters.length;

    const clusterHealthScores: Record<string, number> = {};
    for (const cluster of clusters) {
      const healthyNodes = cluster.nodes.filter(n => n.status === 'online').length;
      clusterHealthScores[cluster.id] = (healthyNodes / cluster.nodes.length) * 100;
    }

    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentFailovers = Array.from(this.failoverEvents.values())
      .filter(event => event.triggeredAt > last24h);

    const averageFailoverTime = recentFailovers.length > 0
      ? recentFailovers.reduce((sum, event) => sum + event.downTimeSeconds, 0) / recentFailovers.length
      : 0;

    const recentBackups = Array.from(this.backupJobs.values())
      .filter(job => job.startTime > last24h);
    const successfulBackups = recentBackups.filter(job => job.status === 'completed').length;
    const backupSuccessRate = recentBackups.length > 0 
      ? (successfulBackups / recentBackups.length) * 100 
      : 100;

    const allTestResults = Array.from(this.drPlans.values())
      .flatMap(plan => plan.testResults)
      .sort((a, b) => b.executedAt.getTime() - a.executedAt.getTime());
    const lastDRTest = allTestResults.length > 0 ? allTestResults[0].executedAt : null;

    return {
      overallUptime,
      clusterHealthScores,
      failoverCount24h: recentFailovers.length,
      averageFailoverTime,
      backupSuccessRate,
      lastDRTest
    };
  }
}