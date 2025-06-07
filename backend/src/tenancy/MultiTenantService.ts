import { Injectable } from '@nestjs/common';
import { Logger } from '../monitoring/Logger';
import { MetricsCollector } from '../monitoring/MetricsCollector';
import { PrivacyMonitor } from '../monitoring/PrivacyMonitor';

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  type: 'university' | 'k12_district' | 'corporate' | 'nonprofit';
  status: 'active' | 'suspended' | 'inactive' | 'trial';
  settings: TenantSettings;
  privacy: TenantPrivacyConfig;
  branding: TenantBranding;
  billing: TenantBilling;
  metadata: TenantMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantSettings {
  maxStudents: number;
  maxEducators: number;
  maxCourses: number;
  features: TenantFeature[];
  integrations: TenantIntegration[];
  dataRetentionDays: number;
  allowedCountries: string[];
  timeZone: string;
  academicCalendar: AcademicCalendar;
}

export interface TenantPrivacyConfig {
  dataResidency: 'us' | 'eu' | 'canada' | 'australia' | 'global';
  encryptionLevel: 'standard' | 'enhanced' | 'maximum';
  auditLevel: 'basic' | 'detailed' | 'comprehensive';
  consentModel: 'opt_in' | 'opt_out' | 'informed_consent';
  dataProcessingPurposes: string[];
  thirdPartySharing: boolean;
  analyticsLevel: 'none' | 'aggregate' | 'individual' | 'full';
  retentionPolicies: RetentionPolicy[];
  complianceFrameworks: ('GDPR' | 'CCPA' | 'FERPA' | 'COPPA' | 'PIPEDA')[];
}

export interface TenantBranding {
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  customCss?: string;
  welcomeMessage?: string;
  supportEmail: string;
  supportPhone?: string;
  privacyPolicyUrl?: string;
  termsOfServiceUrl?: string;
}

export interface TenantBilling {
  plan: 'trial' | 'basic' | 'professional' | 'enterprise' | 'custom';
  billingCycle: 'monthly' | 'annual';
  pricePerStudent: number;
  currency: string;
  billingContact: ContactInfo;
  paymentMethod?: PaymentMethod;
  nextBillingDate: Date;
  usageMetrics: UsageMetrics;
}

export interface TenantFeature {
  name: string;
  enabled: boolean;
  configuration?: Record<string, any>;
  limits?: Record<string, number>;
}

export interface TenantIntegration {
  type: 'lms' | 'sso' | 'sis' | 'email' | 'analytics';
  provider: string;
  enabled: boolean;
  configuration: Record<string, any>;
  lastSync?: Date;
  status: 'active' | 'error' | 'disabled';
}

export interface AcademicCalendar {
  startDate: Date;
  endDate: Date;
  semesters: Semester[];
  holidays: Holiday[];
}

export interface Semester {
  name: string;
  startDate: Date;
  endDate: Date;
  type: 'fall' | 'spring' | 'summer' | 'winter';
}

export interface Holiday {
  name: string;
  date: Date;
  description?: string;
}

export interface RetentionPolicy {
  dataType: string;
  retentionPeriod: number;
  retentionUnit: 'days' | 'months' | 'years';
  deletionMethod: 'soft' | 'hard' | 'anonymize';
  exceptions?: string[];
}

export interface ContactInfo {
  name: string;
  email: string;
  phone?: string;
  address?: Address;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface PaymentMethod {
  type: 'credit_card' | 'bank_transfer' | 'invoice';
  details: Record<string, any>;
  isDefault: boolean;
}

export interface UsageMetrics {
  activeStudents: number;
  activeEducators: number;
  coursesCreated: number;
  assignmentsCompleted: number;
  storageUsedGB: number;
  apiCallsThisMonth: number;
  lastUpdated: Date;
}

export interface TenantMetadata {
  contactPerson: ContactInfo;
  technicalContact?: ContactInfo;
  institution: {
    type: string;
    size: string;
    establishedYear?: number;
    accreditation?: string[];
  };
  deployment: {
    environment: 'production' | 'staging' | 'development';
    region: string;
    dataCenter: string;
  };
}

export interface TenantContext {
  tenantId: string;
  userId: string;
  userRole: string;
  permissions: string[];
  dataAccessLevel: 'full' | 'limited' | 'aggregate_only';
  privacyPreferences: Record<string, any>;
}

@Injectable()
export class MultiTenantService {
  private readonly logger = new Logger('MultiTenantService');
  private readonly metrics = new MetricsCollector();
  private readonly privacyMonitor = new PrivacyMonitor();

  private tenants: Map<string, Tenant> = new Map();
  private tenantContextCache: Map<string, TenantContext> = new Map();

  constructor() {
    this.initializeDemoTenants();
  }

  private initializeDemoTenants(): void {
    // Demo University
    this.addTenant({
      id: 'university-demo',
      name: 'Demo University',
      domain: 'demo.university.edu',
      type: 'university',
      status: 'active',
      settings: {
        maxStudents: 10000,
        maxEducators: 500,
        maxCourses: 1000,
        features: [
          { name: 'advanced_analytics', enabled: true, limits: { reportCount: 100 } },
          { name: 'ai_assistance', enabled: true, limits: { dailyRequests: 1000 } },
          { name: 'collaboration_tools', enabled: true },
          { name: 'academic_integrity', enabled: true }
        ],
        integrations: [
          {
            type: 'lms',
            provider: 'canvas',
            enabled: true,
            configuration: { apiUrl: 'https://demo.instructure.com/api/v1' },
            status: 'active'
          }
        ],
        dataRetentionDays: 2555, // 7 years
        allowedCountries: ['US', 'CA'],
        timeZone: 'America/New_York',
        academicCalendar: {
          startDate: new Date('2024-08-15'),
          endDate: new Date('2025-05-15'),
          semesters: [
            { name: 'Fall 2024', startDate: new Date('2024-08-15'), endDate: new Date('2024-12-15'), type: 'fall' },
            { name: 'Spring 2025', startDate: new Date('2025-01-15'), endDate: new Date('2025-05-15'), type: 'spring' }
          ],
          holidays: [
            { name: 'Thanksgiving Break', date: new Date('2024-11-28') },
            { name: 'Winter Break', date: new Date('2024-12-20') }
          ]
        }
      },
      privacy: {
        dataResidency: 'us',
        encryptionLevel: 'enhanced',
        auditLevel: 'comprehensive',
        consentModel: 'informed_consent',
        dataProcessingPurposes: ['education', 'assessment', 'improvement'],
        thirdPartySharing: false,
        analyticsLevel: 'aggregate',
        retentionPolicies: [
          { dataType: 'student_work', retentionPeriod: 7, retentionUnit: 'years', deletionMethod: 'anonymize' },
          { dataType: 'personal_data', retentionPeriod: 3, retentionUnit: 'years', deletionMethod: 'hard' },
          { dataType: 'audit_logs', retentionPeriod: 10, retentionUnit: 'years', deletionMethod: 'soft' }
        ],
        complianceFrameworks: ['FERPA', 'CCPA']
      },
      branding: {
        primaryColor: '#1e3a8a',
        secondaryColor: '#3b82f6',
        fontFamily: 'Inter',
        welcomeMessage: 'Welcome to Demo University\'s Writing Platform',
        supportEmail: 'support@demo.university.edu',
        supportPhone: '+1-555-0123'
      },
      billing: {
        plan: 'enterprise',
        billingCycle: 'annual',
        pricePerStudent: 12.00,
        currency: 'USD',
        billingContact: {
          name: 'Finance Department',
          email: 'finance@demo.university.edu',
          phone: '+1-555-0199'
        },
        nextBillingDate: new Date('2025-08-01'),
        usageMetrics: {
          activeStudents: 8500,
          activeEducators: 450,
          coursesCreated: 750,
          assignmentsCompleted: 12000,
          storageUsedGB: 2500,
          apiCallsThisMonth: 150000,
          lastUpdated: new Date()
        }
      },
      metadata: {
        contactPerson: {
          name: 'Dr. Sarah Johnson',
          email: 'sarah.johnson@demo.university.edu',
          phone: '+1-555-0156'
        },
        technicalContact: {
          name: 'IT Department',
          email: 'it@demo.university.edu',
          phone: '+1-555-0134'
        },
        institution: {
          type: 'Research University',
          size: 'Large (10,000+ students)',
          establishedYear: 1965,
          accreditation: ['SACSCOC', 'ABET']
        },
        deployment: {
          environment: 'production',
          region: 'us-east-1',
          dataCenter: 'aws-virginia'
        }
      },
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date()
    });

    // Demo K-12 District
    this.addTenant({
      id: 'k12-demo',
      name: 'Demo School District',
      domain: 'demo.k12.edu',
      type: 'k12_district',
      status: 'active',
      settings: {
        maxStudents: 5000,
        maxEducators: 200,
        maxCourses: 300,
        features: [
          { name: 'basic_analytics', enabled: true },
          { name: 'ai_assistance', enabled: true, limits: { dailyRequests: 500 } },
          { name: 'parental_controls', enabled: true }
        ],
        integrations: [
          {
            type: 'sis',
            provider: 'powerschool',
            enabled: true,
            configuration: { district_id: 'demo_district' },
            status: 'active'
          }
        ],
        dataRetentionDays: 2190, // 6 years
        allowedCountries: ['US'],
        timeZone: 'America/Chicago',
        academicCalendar: {
          startDate: new Date('2024-08-20'),
          endDate: new Date('2025-06-10'),
          semesters: [
            { name: 'Fall Semester', startDate: new Date('2024-08-20'), endDate: new Date('2024-12-20'), type: 'fall' },
            { name: 'Spring Semester', startDate: new Date('2025-01-08'), endDate: new Date('2025-06-10'), type: 'spring' }
          ],
          holidays: [
            { name: 'Fall Break', date: new Date('2024-10-14') },
            { name: 'Winter Holiday', date: new Date('2024-12-23') }
          ]
        }
      },
      privacy: {
        dataResidency: 'us',
        encryptionLevel: 'enhanced',
        auditLevel: 'detailed',
        consentModel: 'opt_in',
        dataProcessingPurposes: ['education', 'safety', 'communication'],
        thirdPartySharing: false,
        analyticsLevel: 'aggregate',
        retentionPolicies: [
          { dataType: 'student_work', retentionPeriod: 6, retentionUnit: 'years', deletionMethod: 'anonymize' },
          { dataType: 'personal_data', retentionPeriod: 2, retentionUnit: 'years', deletionMethod: 'hard', exceptions: ['special_education'] }
        ],
        complianceFrameworks: ['FERPA', 'COPPA']
      },
      branding: {
        primaryColor: '#059669',
        secondaryColor: '#10b981',
        fontFamily: 'Roboto',
        welcomeMessage: 'Welcome to Demo School District Learning Platform',
        supportEmail: 'tech@demo.k12.edu'
      },
      billing: {
        plan: 'professional',
        billingCycle: 'annual',
        pricePerStudent: 8.00,
        currency: 'USD',
        billingContact: {
          name: 'Business Office',
          email: 'business@demo.k12.edu'
        },
        nextBillingDate: new Date('2025-07-01'),
        usageMetrics: {
          activeStudents: 4200,
          activeEducators: 180,
          coursesCreated: 280,
          assignmentsCompleted: 8500,
          storageUsedGB: 1200,
          apiCallsThisMonth: 75000,
          lastUpdated: new Date()
        }
      },
      metadata: {
        contactPerson: {
          name: 'Michael Rodriguez',
          email: 'mrodriguez@demo.k12.edu'
        },
        institution: {
          type: 'Public School District',
          size: 'Medium (1,000-5,000 students)',
          establishedYear: 1952
        },
        deployment: {
          environment: 'production',
          region: 'us-central-1',
          dataCenter: 'aws-illinois'
        }
      },
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date()
    });

    this.logger.info('Demo tenants initialized', { tenantCount: this.tenants.size });
  }

  private addTenant(tenant: Tenant): void {
    this.tenants.set(tenant.id, tenant);
  }

  async createTenant(tenantData: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tenant> {
    const tenantId = `tenant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const tenant: Tenant = {
      ...tenantData,
      id: tenantId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Validate tenant configuration
    await this.validateTenantConfiguration(tenant);

    // Initialize tenant-specific privacy controls
    await this.initializeTenantPrivacyControls(tenant);

    // Set up data isolation
    await this.setupDataIsolation(tenant);

    this.tenants.set(tenantId, tenant);

    this.logger.info('Tenant created', { 
      tenantId, 
      name: tenant.name, 
      type: tenant.type 
    });

    this.metrics.recordMetric('tenants_created_total', 1, ['type', tenant.type]);

    return tenant;
  }

  async getTenant(tenantId: string): Promise<Tenant | null> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) return null;

    // Update last accessed timestamp for usage tracking
    this.metrics.recordMetric('tenant_access_total', 1, ['tenant_id', tenantId]);

    return tenant;
  }

  async updateTenant(tenantId: string, updates: Partial<Tenant>): Promise<Tenant | null> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) return null;

    const updatedTenant = {
      ...tenant,
      ...updates,
      updatedAt: new Date()
    };

    // Validate updated configuration
    await this.validateTenantConfiguration(updatedTenant);

    // Update privacy controls if privacy config changed
    if (updates.privacy) {
      await this.updateTenantPrivacyControls(updatedTenant);
    }

    this.tenants.set(tenantId, updatedTenant);

    this.logger.info('Tenant updated', { tenantId, updates: Object.keys(updates) });

    return updatedTenant;
  }

  async getTenantByDomain(domain: string): Promise<Tenant | null> {
    for (const tenant of this.tenants.values()) {
      if (tenant.domain === domain || tenant.domain.includes(domain)) {
        return tenant;
      }
    }
    return null;
  }

  async getAllTenants(): Promise<Tenant[]> {
    return Array.from(this.tenants.values())
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async getTenantContext(tenantId: string, userId: string): Promise<TenantContext | null> {
    const cacheKey = `${tenantId}:${userId}`;
    
    // Check cache first
    if (this.tenantContextCache.has(cacheKey)) {
      return this.tenantContextCache.get(cacheKey)!;
    }

    const tenant = await this.getTenant(tenantId);
    if (!tenant) return null;

    // In a real implementation, this would fetch user details from database
    const context: TenantContext = {
      tenantId,
      userId,
      userRole: 'student', // This would be fetched from user data
      permissions: this.calculateUserPermissions(tenant, 'student'),
      dataAccessLevel: this.determineDataAccessLevel(tenant, 'student'),
      privacyPreferences: {}
    };

    // Cache for 15 minutes
    this.tenantContextCache.set(cacheKey, context);
    setTimeout(() => this.tenantContextCache.delete(cacheKey), 15 * 60 * 1000);

    return context;
  }

  private calculateUserPermissions(tenant: Tenant, userRole: string): string[] {
    const basePermissions = ['read_assignments', 'submit_work', 'view_feedback'];
    
    if (userRole === 'educator') {
      return [...basePermissions, 'create_assignments', 'grade_submissions', 'view_analytics'];
    }
    
    if (userRole === 'admin') {
      return [...basePermissions, 'manage_courses', 'manage_users', 'view_all_analytics', 'manage_settings'];
    }

    return basePermissions;
  }

  private determineDataAccessLevel(tenant: Tenant, userRole: string): 'full' | 'limited' | 'aggregate_only' {
    if (userRole === 'admin') return 'full';
    if (userRole === 'educator') return 'limited';
    return 'aggregate_only';
  }

  async validateTenantDataAccess(tenantId: string, userId: string, resourceType: string, resourceId: string): Promise<boolean> {
    const context = await this.getTenantContext(tenantId, userId);
    if (!context) return false;

    const tenant = await this.getTenant(tenantId);
    if (!tenant) return false;

    // Check if resource belongs to tenant
    if (!await this.resourceBelongsToTenant(tenantId, resourceType, resourceId)) {
      this.logger.warn('Cross-tenant data access attempt', {
        tenantId,
        userId,
        resourceType,
        resourceId
      });
      return false;
    }

    // Check user permissions
    const hasPermission = await this.checkUserPermission(context, resourceType, 'read');
    
    // Log access for audit trail
    await this.logDataAccess(tenantId, userId, resourceType, resourceId, hasPermission);

    return hasPermission;
  }

  private async resourceBelongsToTenant(tenantId: string, resourceType: string, resourceId: string): Promise<boolean> {
    // In production, this would query the database to verify resource ownership
    // For now, simulate with resource ID patterns
    return resourceId.includes(tenantId) || resourceId.startsWith(`${tenantId}-`);
  }

  private async checkUserPermission(context: TenantContext, resourceType: string, action: string): Promise<boolean> {
    const requiredPermission = `${action}_${resourceType}`;
    return context.permissions.includes(requiredPermission) || context.permissions.includes('*');
  }

  private async logDataAccess(tenantId: string, userId: string, resourceType: string, resourceId: string, granted: boolean): Promise<void> {
    await this.privacyMonitor.recordDataAccess({
      tenantId,
      userId,
      resourceType,
      resourceId,
      action: 'read',
      granted,
      timestamp: new Date()
    });

    this.metrics.recordMetric('tenant_data_access_total', 1, [
      'tenant_id', tenantId,
      'resource_type', resourceType,
      'granted', granted.toString()
    ]);
  }

  private async validateTenantConfiguration(tenant: Tenant): Promise<void> {
    // Validate privacy configuration
    if (!tenant.privacy.complianceFrameworks.length) {
      throw new Error('At least one compliance framework must be specified');
    }

    // Validate data residency requirements
    const validRegions = ['us', 'eu', 'canada', 'australia', 'global'];
    if (!validRegions.includes(tenant.privacy.dataResidency)) {
      throw new Error('Invalid data residency specification');
    }

    // Validate billing configuration
    if (tenant.billing.plan === 'enterprise' && !tenant.billing.billingContact) {
      throw new Error('Enterprise tenants must have billing contact information');
    }

    // Validate feature limits
    for (const feature of tenant.settings.features) {
      if (feature.enabled && feature.limits) {
        await this.validateFeatureLimits(tenant, feature);
      }
    }
  }

  private async validateFeatureLimits(tenant: Tenant, feature: TenantFeature): Promise<void> {
    // Validate that feature limits are within plan allowances
    const planLimits = this.getPlanLimits(tenant.billing.plan);
    
    if (feature.limits) {
      for (const [limitType, limitValue] of Object.entries(feature.limits)) {
        const planLimit = planLimits[`${feature.name}_${limitType}`];
        if (planLimit && limitValue > planLimit) {
          throw new Error(`Feature limit ${limitType} exceeds plan allowance for ${feature.name}`);
        }
      }
    }
  }

  private getPlanLimits(plan: string): Record<string, number> {
    const limits: Record<string, Record<string, number>> = {
      trial: { ai_assistance_dailyRequests: 100, advanced_analytics_reportCount: 10 },
      basic: { ai_assistance_dailyRequests: 500, advanced_analytics_reportCount: 50 },
      professional: { ai_assistance_dailyRequests: 1000, advanced_analytics_reportCount: 100 },
      enterprise: { ai_assistance_dailyRequests: 5000, advanced_analytics_reportCount: 500 }
    };

    return limits[plan] || {};
  }

  private async initializeTenantPrivacyControls(tenant: Tenant): Promise<void> {
    // Initialize encryption keys for tenant
    await this.setupTenantEncryption(tenant);

    // Create tenant-specific audit tables
    await this.setupTenantAuditTrails(tenant);

    // Configure retention policies
    await this.configureTenantRetentionPolicies(tenant);

    this.logger.info('Tenant privacy controls initialized', { tenantId: tenant.id });
  }

  private async updateTenantPrivacyControls(tenant: Tenant): Promise<void> {
    // Update encryption configuration if changed
    await this.updateTenantEncryption(tenant);

    // Update retention policies
    await this.configureTenantRetentionPolicies(tenant);

    this.logger.info('Tenant privacy controls updated', { tenantId: tenant.id });
  }

  private async setupTenantEncryption(tenant: Tenant): Promise<void> {
    // In production, this would generate and store tenant-specific encryption keys
    this.logger.debug('Setting up tenant encryption', { 
      tenantId: tenant.id, 
      encryptionLevel: tenant.privacy.encryptionLevel 
    });
  }

  private async updateTenantEncryption(tenant: Tenant): Promise<void> {
    this.logger.debug('Updating tenant encryption', { 
      tenantId: tenant.id, 
      encryptionLevel: tenant.privacy.encryptionLevel 
    });
  }

  private async setupTenantAuditTrails(tenant: Tenant): Promise<void> {
    // In production, this would create tenant-specific audit tables
    this.logger.debug('Setting up tenant audit trails', { 
      tenantId: tenant.id, 
      auditLevel: tenant.privacy.auditLevel 
    });
  }

  private async configureTenantRetentionPolicies(tenant: Tenant): Promise<void> {
    for (const policy of tenant.privacy.retentionPolicies) {
      this.logger.debug('Configuring retention policy', {
        tenantId: tenant.id,
        dataType: policy.dataType,
        retention: `${policy.retentionPeriod} ${policy.retentionUnit}`
      });
    }
  }

  private async setupDataIsolation(tenant: Tenant): Promise<void> {
    // In production, this would configure database schemas, user permissions, etc.
    this.logger.debug('Setting up data isolation', { 
      tenantId: tenant.id, 
      dataResidency: tenant.privacy.dataResidency 
    });
  }

  async getTenantUsageMetrics(tenantId: string): Promise<UsageMetrics | null> {
    const tenant = await this.getTenant(tenantId);
    if (!tenant) return null;

    // In production, this would calculate real-time usage metrics
    return tenant.billing.usageMetrics;
  }

  async updateTenantUsage(tenantId: string, usage: Partial<UsageMetrics>): Promise<void> {
    const tenant = await this.getTenant(tenantId);
    if (!tenant) return;

    tenant.billing.usageMetrics = {
      ...tenant.billing.usageMetrics,
      ...usage,
      lastUpdated: new Date()
    };

    await this.updateTenant(tenantId, { billing: tenant.billing });
  }

  async suspendTenant(tenantId: string, reason: string): Promise<void> {
    const tenant = await this.getTenant(tenantId);
    if (!tenant) return;

    tenant.status = 'suspended';
    await this.updateTenant(tenantId, { status: 'suspended' });

    this.logger.warn('Tenant suspended', { tenantId, reason });
    this.metrics.recordMetric('tenants_suspended_total', 1, ['reason', reason]);
  }

  async reactivateTenant(tenantId: string): Promise<void> {
    const tenant = await this.getTenant(tenantId);
    if (!tenant) return;

    tenant.status = 'active';
    await this.updateTenant(tenantId, { status: 'active' });

    this.logger.info('Tenant reactivated', { tenantId });
    this.metrics.recordMetric('tenants_reactivated_total', 1);
  }
}