import { Injectable } from '@nestjs/common';
import { Logger } from '../monitoring/Logger';
import { MetricsCollector } from '../monitoring/MetricsCollector';
import { PrivacyMonitor } from '../monitoring/PrivacyMonitor';
import { MultiTenantService, TenantContext } from './MultiTenantService';

export interface TenantDataQuery {
  tenantId: string;
  userId: string;
  resourceType: string;
  filters?: Record<string, any>;
  pagination?: {
    offset: number;
    limit: number;
  };
  sorting?: {
    field: string;
    direction: 'asc' | 'desc';
  }[];
}

export interface TenantDataResult<T> {
  data: T[];
  totalCount: number;
  tenantId: string;
  accessLevel: 'full' | 'limited' | 'aggregate_only';
  privacyFiltered: boolean;
  encryptionApplied: boolean;
}

export interface DataIsolationRule {
  tenantId: string;
  resourceType: string;
  isolationLevel: 'strict' | 'loose' | 'shared';
  encryptionRequired: boolean;
  auditRequired: boolean;
  crossTenantAccess: boolean;
  allowedOperations: ('create' | 'read' | 'update' | 'delete')[];
}

export interface TenantDataOperation {
  id: string;
  tenantId: string;
  userId: string;
  operation: 'create' | 'read' | 'update' | 'delete';
  resourceType: string;
  resourceId: string;
  timestamp: Date;
  dataSize: number;
  encryptionUsed: boolean;
  privacyLevel: string;
  success: boolean;
  error?: string;
}

@Injectable()
export class TenantDataService {
  private readonly logger = new Logger('TenantDataService');
  private readonly metrics = new MetricsCollector();
  private readonly privacyMonitor = new PrivacyMonitor();

  private isolationRules: Map<string, DataIsolationRule[]> = new Map();
  private dataOperations: Map<string, TenantDataOperation> = new Map();

  constructor(private readonly multiTenantService: MultiTenantService) {
    this.initializeIsolationRules();
  }

  private initializeIsolationRules(): void {
    // Student data isolation rules
    this.addIsolationRule({
      tenantId: '*', // Applies to all tenants
      resourceType: 'student_profile',
      isolationLevel: 'strict',
      encryptionRequired: true,
      auditRequired: true,
      crossTenantAccess: false,
      allowedOperations: ['create', 'read', 'update']
    });

    this.addIsolationRule({
      tenantId: '*',
      resourceType: 'student_work',
      isolationLevel: 'strict',
      encryptionRequired: true,
      auditRequired: true,
      crossTenantAccess: false,
      allowedOperations: ['create', 'read', 'update']
    });

    // Course data isolation rules
    this.addIsolationRule({
      tenantId: '*',
      resourceType: 'course',
      isolationLevel: 'loose',
      encryptionRequired: false,
      auditRequired: true,
      crossTenantAccess: false,
      allowedOperations: ['create', 'read', 'update', 'delete']
    });

    // Assignment data isolation rules
    this.addIsolationRule({
      tenantId: '*',
      resourceType: 'assignment',
      isolationLevel: 'loose',
      encryptionRequired: false,
      auditRequired: true,
      crossTenantAccess: false,
      allowedOperations: ['create', 'read', 'update', 'delete']
    });

    // Analytics data isolation rules
    this.addIsolationRule({
      tenantId: '*',
      resourceType: 'analytics',
      isolationLevel: 'strict',
      encryptionRequired: true,
      auditRequired: true,
      crossTenantAccess: false,
      allowedOperations: ['read']
    });

    // Audit logs - shared but with strict access controls
    this.addIsolationRule({
      tenantId: '*',
      resourceType: 'audit_log',
      isolationLevel: 'shared',
      encryptionRequired: true,
      auditRequired: false, // Audit logs don't audit themselves
      crossTenantAccess: false,
      allowedOperations: ['create', 'read']
    });

    this.logger.info('Data isolation rules initialized');
  }

  private addIsolationRule(rule: DataIsolationRule): void {
    const key = `${rule.tenantId}:${rule.resourceType}`;
    
    if (!this.isolationRules.has(key)) {
      this.isolationRules.set(key, []);
    }
    
    this.isolationRules.get(key)!.push(rule);
  }

  async queryTenantData<T>(query: TenantDataQuery): Promise<TenantDataResult<T>> {
    const startTime = Date.now();
    const operationId = `query-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Validate tenant access
      const context = await this.multiTenantService.getTenantContext(query.tenantId, query.userId);
      if (!context) {
        throw new Error('Invalid tenant context');
      }

      // Check data isolation rules
      const isolationRule = this.getApplicableIsolationRule(query.tenantId, query.resourceType);
      if (!isolationRule) {
        throw new Error('No isolation rule found for resource type');
      }

      // Validate operation is allowed
      if (!isolationRule.allowedOperations.includes('read')) {
        throw new Error('Read operation not allowed for this resource type');
      }

      // Apply tenant-specific filters
      const filteredQuery = await this.applyTenantFilters(query, context);

      // Execute query with privacy controls
      const rawData = await this.executeSecureQuery<T>(filteredQuery, isolationRule);

      // Apply privacy filtering based on user role and tenant settings
      const privacyFilteredData = await this.applyPrivacyFiltering(rawData, context, isolationRule);

      // Encrypt sensitive data if required
      const encryptedData = isolationRule.encryptionRequired 
        ? await this.applyEncryption(privacyFilteredData, context) 
        : privacyFilteredData;

      const result: TenantDataResult<T> = {
        data: encryptedData,
        totalCount: rawData.length,
        tenantId: query.tenantId,
        accessLevel: context.dataAccessLevel,
        privacyFiltered: privacyFilteredData.length < rawData.length,
        encryptionApplied: isolationRule.encryptionRequired
      };

      // Log the operation
      await this.logDataOperation({
        id: operationId,
        tenantId: query.tenantId,
        userId: query.userId,
        operation: 'read',
        resourceType: query.resourceType,
        resourceId: 'query-result',
        timestamp: new Date(),
        dataSize: JSON.stringify(result.data).length,
        encryptionUsed: isolationRule.encryptionRequired,
        privacyLevel: context.dataAccessLevel,
        success: true
      });

      const queryTime = Date.now() - startTime;
      this.metrics.recordMetric('tenant_data_query_duration_ms', queryTime, [
        'tenant_id', query.tenantId,
        'resource_type', query.resourceType,
        'access_level', context.dataAccessLevel
      ]);

      this.logger.debug('Tenant data query completed', {
        operationId,
        tenantId: query.tenantId,
        resourceType: query.resourceType,
        resultCount: result.data.length,
        queryTimeMs: queryTime
      });

      return result;

    } catch (error) {
      await this.logDataOperation({
        id: operationId,
        tenantId: query.tenantId,
        userId: query.userId,
        operation: 'read',
        resourceType: query.resourceType,
        resourceId: 'query-result',
        timestamp: new Date(),
        dataSize: 0,
        encryptionUsed: false,
        privacyLevel: 'none',
        success: false,
        error: error.message
      });

      this.logger.error('Tenant data query failed', {
        operationId,
        tenantId: query.tenantId,
        resourceType: query.resourceType,
        error: error.message
      });

      throw error;
    }
  }

  private getApplicableIsolationRule(tenantId: string, resourceType: string): DataIsolationRule | null {
    // First check for tenant-specific rules
    const tenantSpecificKey = `${tenantId}:${resourceType}`;
    const tenantRules = this.isolationRules.get(tenantSpecificKey);
    if (tenantRules && tenantRules.length > 0) {
      return tenantRules[0];
    }

    // Then check for global rules
    const globalKey = `*:${resourceType}`;
    const globalRules = this.isolationRules.get(globalKey);
    if (globalRules && globalRules.length > 0) {
      return globalRules[0];
    }

    return null;
  }

  private async applyTenantFilters(query: TenantDataQuery, context: TenantContext): Promise<TenantDataQuery> {
    const filteredQuery = { ...query };

    // Always add tenant ID filter to ensure data isolation
    if (!filteredQuery.filters) {
      filteredQuery.filters = {};
    }
    filteredQuery.filters.tenantId = query.tenantId;

    // Add user-specific filters based on role
    if (context.userRole === 'student') {
      // Students can only see their own data
      filteredQuery.filters.userId = context.userId;
    } else if (context.userRole === 'educator') {
      // Educators can see data for their courses
      // This would be expanded based on actual course assignments
      filteredQuery.filters.educatorId = context.userId;
    }
    // Admins can see all tenant data (no additional filters)

    return filteredQuery;
  }

  private async executeSecureQuery<T>(query: TenantDataQuery, rule: DataIsolationRule): Promise<T[]> {
    // In production, this would execute the actual database query with security controls
    // For now, simulate data retrieval
    const mockData: any[] = [];

    // Generate mock data based on resource type
    switch (query.resourceType) {
      case 'student_profile':
        for (let i = 0; i < 5; i++) {
          mockData.push({
            id: `${query.tenantId}-student-${i}`,
            tenantId: query.tenantId,
            userId: `user-${i}`,
            name: `Student ${i}`,
            email: `student${i}@${query.tenantId}.edu`,
            enrollmentDate: new Date(),
            privacyLevel: 'standard'
          });
        }
        break;

      case 'course':
        for (let i = 0; i < 3; i++) {
          mockData.push({
            id: `${query.tenantId}-course-${i}`,
            tenantId: query.tenantId,
            name: `Course ${i}`,
            description: `Description for course ${i}`,
            instructorId: `instructor-${i}`,
            studentCount: 25 + i * 5
          });
        }
        break;

      case 'assignment':
        for (let i = 0; i < 8; i++) {
          mockData.push({
            id: `${query.tenantId}-assignment-${i}`,
            tenantId: query.tenantId,
            title: `Assignment ${i}`,
            courseId: `${query.tenantId}-course-${i % 3}`,
            dueDate: new Date(Date.now() + i * 7 * 24 * 60 * 60 * 1000),
            submissions: i * 3
          });
        }
        break;

      default:
        // Return empty array for unknown resource types
        break;
    }

    // Apply pagination if specified
    if (query.pagination) {
      const { offset, limit } = query.pagination;
      return mockData.slice(offset, offset + limit) as T[];
    }

    return mockData as T[];
  }

  private async applyPrivacyFiltering<T>(data: T[], context: TenantContext, rule: DataIsolationRule): Promise<T[]> {
    const tenant = await this.multiTenantService.getTenant(context.tenantId);
    if (!tenant) return data;

    // Apply privacy filtering based on tenant privacy settings and user access level
    let filteredData = data;

    // Filter based on user access level
    if (context.dataAccessLevel === 'aggregate_only') {
      // For aggregate-only access, remove individual identifiers
      filteredData = data.map(item => {
        const filtered = { ...item };
        delete (filtered as any).userId;
        delete (filtered as any).email;
        delete (filtered as any).name;
        return filtered;
      });
    } else if (context.dataAccessLevel === 'limited') {
      // For limited access, apply role-based filtering
      if (context.userRole === 'educator') {
        // Educators can only see data for their courses/students
        filteredData = data.filter(item => {
          // This would be more sophisticated in production
          return true; // Simplified for demo
        });
      }
    }

    // Apply tenant-specific privacy preferences
    if (tenant.privacy.analyticsLevel === 'none') {
      // Remove all analytics data
      filteredData = filteredData.map(item => {
        const filtered = { ...item };
        delete (filtered as any).analytics;
        delete (filtered as any).metrics;
        return filtered;
      });
    } else if (tenant.privacy.analyticsLevel === 'aggregate') {
      // Aggregate individual data points
      filteredData = this.aggregateDataPoints(filteredData);
    }

    return filteredData;
  }

  private aggregateDataPoints<T>(data: T[]): T[] {
    // In production, this would perform actual data aggregation
    // For now, return the data as-is
    return data;
  }

  private async applyEncryption<T>(data: T[], context: TenantContext): Promise<T[]> {
    const tenant = await this.multiTenantService.getTenant(context.tenantId);
    if (!tenant) return data;

    // Apply encryption based on tenant encryption level
    switch (tenant.privacy.encryptionLevel) {
      case 'maximum':
        return this.encryptSensitiveFields(data, ['email', 'name', 'address', 'phone']);
      case 'enhanced':
        return this.encryptSensitiveFields(data, ['email', 'address']);
      case 'standard':
        return this.encryptSensitiveFields(data, ['email']);
      default:
        return data;
    }
  }

  private encryptSensitiveFields<T>(data: T[], fields: string[]): T[] {
    // In production, this would use actual encryption
    return data.map(item => {
      const encrypted = { ...item };
      for (const field of fields) {
        if ((encrypted as any)[field]) {
          (encrypted as any)[field] = `ENCRYPTED_${(encrypted as any)[field]}`;
        }
      }
      return encrypted;
    });
  }

  async createTenantData<T>(
    tenantId: string,
    userId: string,
    resourceType: string,
    data: T
  ): Promise<T> {
    const operationId = `create-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Validate tenant context
      const context = await this.multiTenantService.getTenantContext(tenantId, userId);
      if (!context) {
        throw new Error('Invalid tenant context');
      }

      // Check isolation rules
      const rule = this.getApplicableIsolationRule(tenantId, resourceType);
      if (!rule || !rule.allowedOperations.includes('create')) {
        throw new Error('Create operation not allowed for this resource type');
      }

      // Apply tenant ID to data
      const tenantData = { ...data, tenantId };

      // Encrypt if required
      const secureData = rule.encryptionRequired 
        ? await this.applyEncryption([tenantData], context)
        : [tenantData];

      // Log the operation
      await this.logDataOperation({
        id: operationId,
        tenantId,
        userId,
        operation: 'create',
        resourceType,
        resourceId: (tenantData as any).id || 'new',
        timestamp: new Date(),
        dataSize: JSON.stringify(tenantData).length,
        encryptionUsed: rule.encryptionRequired,
        privacyLevel: context.dataAccessLevel,
        success: true
      });

      this.logger.debug('Tenant data created', {
        operationId,
        tenantId,
        resourceType
      });

      return secureData[0];

    } catch (error) {
      await this.logDataOperation({
        id: operationId,
        tenantId,
        userId,
        operation: 'create',
        resourceType,
        resourceId: 'new',
        timestamp: new Date(),
        dataSize: 0,
        encryptionUsed: false,
        privacyLevel: 'none',
        success: false,
        error: error.message
      });

      this.logger.error('Tenant data creation failed', {
        operationId,
        tenantId,
        resourceType,
        error: error.message
      });

      throw error;
    }
  }

  async updateTenantData<T>(
    tenantId: string,
    userId: string,
    resourceType: string,
    resourceId: string,
    updates: Partial<T>
  ): Promise<T | null> {
    const operationId = `update-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Validate access
      const hasAccess = await this.multiTenantService.validateTenantDataAccess(
        tenantId, userId, resourceType, resourceId
      );
      if (!hasAccess) {
        throw new Error('Access denied');
      }

      // Check isolation rules
      const rule = this.getApplicableIsolationRule(tenantId, resourceType);
      if (!rule || !rule.allowedOperations.includes('update')) {
        throw new Error('Update operation not allowed for this resource type');
      }

      // In production, this would update the actual data
      const updatedData = { ...updates, tenantId, id: resourceId } as T;

      await this.logDataOperation({
        id: operationId,
        tenantId,
        userId,
        operation: 'update',
        resourceType,
        resourceId,
        timestamp: new Date(),
        dataSize: JSON.stringify(updates).length,
        encryptionUsed: rule.encryptionRequired,
        privacyLevel: 'full',
        success: true
      });

      return updatedData;

    } catch (error) {
      await this.logDataOperation({
        id: operationId,
        tenantId,
        userId,
        operation: 'update',
        resourceType,
        resourceId,
        timestamp: new Date(),
        dataSize: 0,
        encryptionUsed: false,
        privacyLevel: 'none',
        success: false,
        error: error.message
      });

      throw error;
    }
  }

  async deleteTenantData(
    tenantId: string,
    userId: string,
    resourceType: string,
    resourceId: string
  ): Promise<boolean> {
    const operationId = `delete-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Validate access
      const hasAccess = await this.multiTenantService.validateTenantDataAccess(
        tenantId, userId, resourceType, resourceId
      );
      if (!hasAccess) {
        throw new Error('Access denied');
      }

      // Check isolation rules
      const rule = this.getApplicableIsolationRule(tenantId, resourceType);
      if (!rule || !rule.allowedOperations.includes('delete')) {
        throw new Error('Delete operation not allowed for this resource type');
      }

      // In production, this would delete the actual data
      
      await this.logDataOperation({
        id: operationId,
        tenantId,
        userId,
        operation: 'delete',
        resourceType,
        resourceId,
        timestamp: new Date(),
        dataSize: 0,
        encryptionUsed: false,
        privacyLevel: 'full',
        success: true
      });

      return true;

    } catch (error) {
      await this.logDataOperation({
        id: operationId,
        tenantId,
        userId,
        operation: 'delete',
        resourceType,
        resourceId,
        timestamp: new Date(),
        dataSize: 0,
        encryptionUsed: false,
        privacyLevel: 'none',
        success: false,
        error: error.message
      });

      throw error;
    }
  }

  private async logDataOperation(operation: TenantDataOperation): Promise<void> {
    this.dataOperations.set(operation.id, operation);

    // Log to privacy monitor for audit trail
    await this.privacyMonitor.recordDataAccess({
      tenantId: operation.tenantId,
      userId: operation.userId,
      resourceType: operation.resourceType,
      resourceId: operation.resourceId,
      action: operation.operation,
      granted: operation.success,
      timestamp: operation.timestamp
    });

    // Record metrics
    this.metrics.recordMetric('tenant_data_operations_total', 1, [
      'tenant_id', operation.tenantId,
      'operation', operation.operation,
      'resource_type', operation.resourceType,
      'success', operation.success.toString()
    ]);

    if (operation.success && operation.encryptionUsed) {
      this.metrics.recordMetric('tenant_data_encrypted_operations_total', 1, [
        'tenant_id', operation.tenantId,
        'operation', operation.operation
      ]);
    }
  }

  async getTenantDataMetrics(tenantId: string): Promise<{
    totalOperations: number;
    operationsByType: Record<string, number>;
    encryptedOperations: number;
    failedOperations: number;
    averageDataSize: number;
    privacyCompliance: number;
  }> {
    const operations = Array.from(this.dataOperations.values())
      .filter(op => op.tenantId === tenantId);

    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentOperations = operations.filter(op => op.timestamp > last24Hours);

    const operationsByType: Record<string, number> = {};
    let encryptedOperations = 0;
    let failedOperations = 0;
    let totalDataSize = 0;

    for (const operation of recentOperations) {
      operationsByType[operation.operation] = (operationsByType[operation.operation] || 0) + 1;
      
      if (operation.encryptionUsed) {
        encryptedOperations++;
      }
      
      if (!operation.success) {
        failedOperations++;
      }
      
      totalDataSize += operation.dataSize;
    }

    const averageDataSize = recentOperations.length > 0 ? totalDataSize / recentOperations.length : 0;
    const privacyCompliance = recentOperations.length > 0 
      ? ((recentOperations.length - failedOperations) / recentOperations.length) * 100 
      : 100;

    return {
      totalOperations: recentOperations.length,
      operationsByType,
      encryptedOperations,
      failedOperations,
      averageDataSize,
      privacyCompliance
    };
  }
}