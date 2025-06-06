import { Injectable } from '@nestjs/common';
import { Logger } from '../monitoring/Logger';
import { MetricsCollector } from '../monitoring/MetricsCollector';

export interface NetworkPolicy {
  id: string;
  name: string;
  source: NetworkSegment;
  destination: NetworkSegment;
  protocol: 'TCP' | 'UDP' | 'HTTP' | 'HTTPS' | 'ANY';
  ports: number[];
  action: 'ALLOW' | 'DENY' | 'LOG';
  conditions: PolicyCondition[];
  enabled: boolean;
  createdAt: Date;
  lastModified: Date;
}

export interface NetworkSegment {
  id: string;
  name: string;
  type: 'service' | 'user' | 'admin' | 'external' | 'dmz';
  services: string[];
  trustLevel: 'untrusted' | 'low' | 'medium' | 'high' | 'critical';
  securityControls: string[];
}

export interface PolicyCondition {
  type: 'time' | 'location' | 'user_role' | 'device_trust' | 'data_classification';
  operator: 'equals' | 'not_equals' | 'contains' | 'in_range';
  value: any;
}

export interface AccessRequest {
  id: string;
  userId: string;
  userRole: string;
  sourceService: string;
  destinationService: string;
  resource: string;
  operation: string;
  timestamp: Date;
  deviceInfo: DeviceInfo;
  contextInfo: ContextInfo;
}

export interface DeviceInfo {
  deviceId: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'server' | 'api';
  operatingSystem: string;
  trustScore: number;
  isManaged: boolean;
  complianceStatus: 'compliant' | 'non-compliant' | 'unknown';
}

export interface ContextInfo {
  ipAddress: string;
  location: string;
  timeOfDay: string;
  networkType: 'corporate' | 'vpn' | 'public' | 'unknown';
  riskScore: number;
}

export interface AccessDecision {
  requestId: string;
  decision: 'ALLOW' | 'DENY' | 'CONDITIONAL';
  reason: string;
  conditions?: string[];
  riskScore: number;
  decidedAt: Date;
  validUntil?: Date;
}

@Injectable()
export class ZeroTrustNetworkService {
  private readonly logger = new Logger('ZeroTrustNetworkService');
  private readonly metrics = new MetricsCollector();

  private networkPolicies: Map<string, NetworkPolicy> = new Map();
  private networkSegments: Map<string, NetworkSegment> = new Map();
  private accessDecisions: Map<string, AccessDecision> = new Map();

  constructor() {
    this.initializeNetworkSegments();
    this.initializeNetworkPolicies();
  }

  private initializeNetworkSegments(): void {
    // Frontend segment
    this.addNetworkSegment({
      id: 'frontend',
      name: 'Frontend Applications',
      type: 'user',
      services: ['react-app', 'static-assets'],
      trustLevel: 'medium',
      securityControls: ['authentication', 'content_security_policy', 'cors']
    });

    // API Gateway segment
    this.addNetworkSegment({
      id: 'api-gateway',
      name: 'API Gateway',
      type: 'service',
      services: ['fastify-server', 'express-server'],
      trustLevel: 'high',
      securityControls: ['authentication', 'authorization', 'rate_limiting', 'input_validation']
    });

    // MCP Services segment
    this.addNetworkSegment({
      id: 'mcp-services',
      name: 'MCP Microservices',
      type: 'service',
      services: ['writing-analysis', 'student-profiling', 'academic-integrity', 'educator-alerts'],
      trustLevel: 'critical',
      securityControls: ['mutual_tls', 'service_mesh', 'encryption', 'audit_logging']
    });

    // Database segment
    this.addNetworkSegment({
      id: 'database',
      name: 'Database Layer',
      type: 'service',
      services: ['postgresql', 'redis'],
      trustLevel: 'critical',
      securityControls: ['encryption_at_rest', 'network_isolation', 'access_logging', 'backup_encryption']
    });

    // External services segment
    this.addNetworkSegment({
      id: 'external',
      name: 'External Services',
      type: 'external',
      services: ['claude-api', 'email-service', 'lms-integrations'],
      trustLevel: 'untrusted',
      securityControls: ['certificate_validation', 'request_signing', 'response_validation']
    });

    // Admin segment
    this.addNetworkSegment({
      id: 'admin',
      name: 'Administrative Access',
      type: 'admin',
      services: ['monitoring', 'logging', 'deployment'],
      trustLevel: 'high',
      securityControls: ['mfa', 'privileged_access_management', 'session_recording', 'just_in_time_access']
    });

    this.logger.info('Network segments initialized', { 
      totalSegments: this.networkSegments.size 
    });
  }

  private addNetworkSegment(segment: NetworkSegment): void {
    this.networkSegments.set(segment.id, segment);
  }

  private initializeNetworkPolicies(): void {
    // Frontend to API Gateway
    this.addNetworkPolicy({
      id: 'frontend-to-api',
      name: 'Frontend to API Gateway',
      source: this.networkSegments.get('frontend')!,
      destination: this.networkSegments.get('api-gateway')!,
      protocol: 'HTTPS',
      ports: [5001, 5002],
      action: 'ALLOW',
      conditions: [
        { type: 'user_role', operator: 'in_range', value: ['student', 'educator', 'admin'] }
      ],
      enabled: true,
      createdAt: new Date(),
      lastModified: new Date()
    });

    // API Gateway to MCP Services
    this.addNetworkPolicy({
      id: 'api-to-mcp',
      name: 'API Gateway to MCP Services',
      source: this.networkSegments.get('api-gateway')!,
      destination: this.networkSegments.get('mcp-services')!,
      protocol: 'HTTP',
      ports: [3001, 3002, 3003, 3004],
      action: 'ALLOW',
      conditions: [
        { type: 'device_trust', operator: 'equals', value: 'high' }
      ],
      enabled: true,
      createdAt: new Date(),
      lastModified: new Date()
    });

    // MCP Services to Database
    this.addNetworkPolicy({
      id: 'mcp-to-database',
      name: 'MCP Services to Database',
      source: this.networkSegments.get('mcp-services')!,
      destination: this.networkSegments.get('database')!,
      protocol: 'TCP',
      ports: [5432, 6379],
      action: 'ALLOW',
      conditions: [
        { type: 'data_classification', operator: 'equals', value: 'encrypted' }
      ],
      enabled: true,
      createdAt: new Date(),
      lastModified: new Date()
    });

    // API Gateway to External Services (restricted)
    this.addNetworkPolicy({
      id: 'api-to-external',
      name: 'API Gateway to External Services',
      source: this.networkSegments.get('api-gateway')!,
      destination: this.networkSegments.get('external')!,
      protocol: 'HTTPS',
      ports: [443],
      action: 'ALLOW',
      conditions: [
        { type: 'time', operator: 'in_range', value: { start: '06:00', end: '22:00' } },
        { type: 'data_classification', operator: 'not_equals', value: 'pii' }
      ],
      enabled: true,
      createdAt: new Date(),
      lastModified: new Date()
    });

    // Admin access (highly restricted)
    this.addNetworkPolicy({
      id: 'admin-access',
      name: 'Administrative Access',
      source: this.networkSegments.get('admin')!,
      destination: this.networkSegments.get('api-gateway')!,
      protocol: 'HTTPS',
      ports: [5001],
      action: 'ALLOW',
      conditions: [
        { type: 'user_role', operator: 'equals', value: 'admin' },
        { type: 'device_trust', operator: 'equals', value: 'high' },
        { type: 'location', operator: 'equals', value: 'corporate_network' }
      ],
      enabled: true,
      createdAt: new Date(),
      lastModified: new Date()
    });

    // Default deny policy
    this.addNetworkPolicy({
      id: 'default-deny',
      name: 'Default Deny All',
      source: { id: 'any', name: 'Any', type: 'external', services: ['*'], trustLevel: 'untrusted', securityControls: [] },
      destination: { id: 'any', name: 'Any', type: 'external', services: ['*'], trustLevel: 'untrusted', securityControls: [] },
      protocol: 'ANY',
      ports: [],
      action: 'DENY',
      conditions: [],
      enabled: true,
      createdAt: new Date(),
      lastModified: new Date()
    });

    this.logger.info('Network policies initialized', { 
      totalPolicies: this.networkPolicies.size 
    });
  }

  private addNetworkPolicy(policy: NetworkPolicy): void {
    this.networkPolicies.set(policy.id, policy);
  }

  async evaluateAccess(request: AccessRequest): Promise<AccessDecision> {
    const startTime = Date.now();
    
    this.logger.debug('Evaluating access request', {
      requestId: request.id,
      userId: request.userId,
      source: request.sourceService,
      destination: request.destinationService,
      resource: request.resource
    });

    // Calculate risk score
    const riskScore = this.calculateRiskScore(request);

    // Find applicable policies
    const applicablePolicies = this.findApplicablePolicies(request);

    // Evaluate policies in order of precedence
    let decision = this.evaluatePolicies(applicablePolicies, request, riskScore);

    // Apply additional security controls based on trust level
    decision = this.applySecurityControls(decision, request);

    // Cache decision for performance
    this.accessDecisions.set(request.id, decision);

    const evaluationTime = Date.now() - startTime;
    this.metrics.recordMetric('zero_trust_evaluation_duration_ms', evaluationTime);
    this.metrics.recordMetric('zero_trust_decisions_total', 1, [
      'decision', decision.decision,
      'risk_level', this.getRiskLevel(riskScore)
    ]);

    this.logger.info('Access decision made', {
      requestId: request.id,
      decision: decision.decision,
      riskScore: decision.riskScore,
      evaluationTimeMs: evaluationTime
    });

    return decision;
  }

  private calculateRiskScore(request: AccessRequest): number {
    let riskScore = 0;

    // Device trust factor
    const deviceTrustScore = request.deviceInfo.trustScore || 50;
    riskScore += (100 - deviceTrustScore) * 0.3;

    // Context risk factor
    riskScore += request.contextInfo.riskScore * 0.3;

    // Time-based risk (higher risk outside business hours)
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) {
      riskScore += 20;
    }

    // Network type risk
    switch (request.contextInfo.networkType) {
      case 'corporate':
        riskScore += 0;
        break;
      case 'vpn':
        riskScore += 10;
        break;
      case 'public':
        riskScore += 30;
        break;
      default:
        riskScore += 40;
    }

    // Device compliance
    if (request.deviceInfo.complianceStatus === 'non-compliant') {
      riskScore += 25;
    } else if (request.deviceInfo.complianceStatus === 'unknown') {
      riskScore += 15;
    }

    return Math.min(100, Math.max(0, riskScore));
  }

  private findApplicablePolicies(request: AccessRequest): NetworkPolicy[] {
    const policies: NetworkPolicy[] = [];

    for (const policy of this.networkPolicies.values()) {
      if (!policy.enabled) continue;

      // Check if policy applies to this request
      if (this.policyApplies(policy, request)) {
        policies.push(policy);
      }
    }

    // Sort by specificity (more specific policies first)
    return policies.sort((a, b) => this.getPolicySpecificity(b) - this.getPolicySpecificity(a));
  }

  private policyApplies(policy: NetworkPolicy, request: AccessRequest): boolean {
    // Check source segment
    if (policy.source.id !== 'any' && !policy.source.services.includes(request.sourceService)) {
      return false;
    }

    // Check destination segment
    if (policy.destination.id !== 'any' && !policy.destination.services.includes(request.destinationService)) {
      return false;
    }

    // Check conditions
    for (const condition of policy.conditions) {
      if (!this.evaluateCondition(condition, request)) {
        return false;
      }
    }

    return true;
  }

  private evaluateCondition(condition: PolicyCondition, request: AccessRequest): boolean {
    switch (condition.type) {
      case 'user_role':
        return this.evaluateUserRoleCondition(condition, request.userRole);
      case 'device_trust':
        return this.evaluateDeviceTrustCondition(condition, request.deviceInfo);
      case 'time':
        return this.evaluateTimeCondition(condition);
      case 'location':
        return this.evaluateLocationCondition(condition, request.contextInfo);
      case 'data_classification':
        return this.evaluateDataClassificationCondition(condition, request.resource);
      default:
        return true;
    }
  }

  private evaluateUserRoleCondition(condition: PolicyCondition, userRole: string): boolean {
    switch (condition.operator) {
      case 'equals':
        return userRole === condition.value;
      case 'not_equals':
        return userRole !== condition.value;
      case 'in_range':
        return Array.isArray(condition.value) && condition.value.includes(userRole);
      default:
        return false;
    }
  }

  private evaluateDeviceTrustCondition(condition: PolicyCondition, deviceInfo: DeviceInfo): boolean {
    const trustLevel = this.getDeviceTrustLevel(deviceInfo.trustScore);
    return condition.value === trustLevel;
  }

  private evaluateTimeCondition(condition: PolicyCondition): boolean {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    if (condition.operator === 'in_range' && condition.value.start && condition.value.end) {
      return currentTime >= condition.value.start && currentTime <= condition.value.end;
    }
    
    return true;
  }

  private evaluateLocationCondition(condition: PolicyCondition, contextInfo: ContextInfo): boolean {
    // Simplified location evaluation
    const isCorporateNetwork = contextInfo.networkType === 'corporate';
    return condition.value === 'corporate_network' ? isCorporateNetwork : true;
  }

  private evaluateDataClassificationCondition(condition: PolicyCondition, resource: string): boolean {
    // Simplified data classification - in production, this would integrate with data discovery
    const isPII = resource.includes('student') || resource.includes('personal');
    
    switch (condition.operator) {
      case 'equals':
        return (condition.value === 'pii') === isPII;
      case 'not_equals':
        return (condition.value === 'pii') !== isPII;
      default:
        return true;
    }
  }

  private getPolicySpecificity(policy: NetworkPolicy): number {
    let specificity = 0;
    
    if (policy.source.id !== 'any') specificity += 10;
    if (policy.destination.id !== 'any') specificity += 10;
    specificity += policy.conditions.length * 5;
    
    return specificity;
  }

  private evaluatePolicies(policies: NetworkPolicy[], request: AccessRequest, riskScore: number): AccessDecision {
    // If no specific policies match, use default deny
    if (policies.length === 0) {
      return {
        requestId: request.id,
        decision: 'DENY',
        reason: 'No applicable policies found - default deny',
        riskScore,
        decidedAt: new Date()
      };
    }

    // Use first matching policy (highest precedence)
    const matchingPolicy = policies[0];

    // High risk requests require additional validation
    if (riskScore > 70 && matchingPolicy.action === 'ALLOW') {
      return {
        requestId: request.id,
        decision: 'CONDITIONAL',
        reason: `High risk score (${riskScore}) - additional verification required`,
        conditions: ['mfa_verification', 'manager_approval'],
        riskScore,
        decidedAt: new Date(),
        validUntil: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
      };
    }

    return {
      requestId: request.id,
      decision: matchingPolicy.action as 'ALLOW' | 'DENY',
      reason: `Policy ${matchingPolicy.id}: ${matchingPolicy.name}`,
      riskScore,
      decidedAt: new Date()
    };
  }

  private applySecurityControls(decision: AccessDecision, request: AccessRequest): AccessDecision {
    // Apply additional controls based on destination trust level
    const destinationSegment = this.findSegmentByService(request.destinationService);
    
    if (destinationSegment && destinationSegment.trustLevel === 'critical' && decision.decision === 'ALLOW') {
      // Critical resources require additional verification
      if (!decision.conditions) {
        decision.conditions = [];
      }
      decision.conditions.push('audit_logging', 'session_monitoring');
    }

    return decision;
  }

  private findSegmentByService(service: string): NetworkSegment | undefined {
    for (const segment of this.networkSegments.values()) {
      if (segment.services.includes(service) || segment.services.includes('*')) {
        return segment;
      }
    }
    return undefined;
  }

  private getDeviceTrustLevel(trustScore: number): string {
    if (trustScore >= 90) return 'high';
    if (trustScore >= 70) return 'medium';
    if (trustScore >= 50) return 'low';
    return 'untrusted';
  }

  private getRiskLevel(riskScore: number): string {
    if (riskScore >= 80) return 'critical';
    if (riskScore >= 60) return 'high';
    if (riskScore >= 40) return 'medium';
    return 'low';
  }

  async getNetworkPolicies(): Promise<NetworkPolicy[]> {
    return Array.from(this.networkPolicies.values())
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async getNetworkSegments(): Promise<NetworkSegment[]> {
    return Array.from(this.networkSegments.values())
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async getAccessMetrics(): Promise<{
    totalRequests: number;
    allowedRequests: number;
    deniedRequests: number;
    conditionalRequests: number;
    averageRiskScore: number;
    highRiskRequests: number;
  }> {
    const decisions = Array.from(this.accessDecisions.values());
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentDecisions = decisions.filter(d => d.decidedAt > last24Hours);

    const totalRequests = recentDecisions.length;
    const allowedRequests = recentDecisions.filter(d => d.decision === 'ALLOW').length;
    const deniedRequests = recentDecisions.filter(d => d.decision === 'DENY').length;
    const conditionalRequests = recentDecisions.filter(d => d.decision === 'CONDITIONAL').length;
    
    const averageRiskScore = totalRequests > 0 
      ? recentDecisions.reduce((sum, d) => sum + d.riskScore, 0) / totalRequests 
      : 0;
    
    const highRiskRequests = recentDecisions.filter(d => d.riskScore > 70).length;

    return {
      totalRequests,
      allowedRequests,
      deniedRequests,
      conditionalRequests,
      averageRiskScore,
      highRiskRequests
    };
  }
}