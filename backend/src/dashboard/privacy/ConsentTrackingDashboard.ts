import { Logger } from '../../monitoring/Logger';
import { PrivacyContext } from '../../types/privacy';

interface ConsentRecord {
  consentId: string;
  userId: string;
  consentType: 'data_collection' | 'ai_processing' | 'analytics_sharing' | 'educator_data_access';
  granted: boolean;
  timestamp: Date;
  version: string;
  expiresAt?: Date;
  source: 'user' | 'parent' | 'guardian' | 'admin';
  ipAddress?: string;
  userAgent?: string;
}

interface ConsentState {
  userId: string;
  consentTypes: {
    dataCollection: ConsentRecord | null;
    aiProcessing: ConsentRecord | null;
    analyticsSharing: ConsentRecord | null;
    educatorDataAccess: ConsentRecord | null;
  };
  consentHistory: ConsentRecord[];
  parentalConsent?: ParentalConsentRecord;
  lastUpdated: Date;
  isCompliant: boolean;
}

interface ParentalConsentRecord {
  parentId: string;
  studentId: string;
  consentTypes: string[];
  verificationMethod: 'email' | 'signature' | 'phone' | 'in_person';
  verifiedAt: Date;
  expiresAt: Date;
}

interface ConsentMetrics {
  totalUsers: number;
  consentCoverage: {
    dataCollection: number;
    aiProcessing: number;
    analyticsSharing: number;
    educatorDataAccess: number;
  };
  complianceRate: number;
  expiringConsents: number;
  parentalConsentRequired: number;
  withdrawalRate: number;
  lastUpdated: Date;
}

interface ConsentTrend {
  date: Date;
  newConsents: number;
  withdrawals: number;
  expirations: number;
  complianceRate: number;
}

export class ConsentTrackingDashboard {
  private static instance: ConsentTrackingDashboard;
  private logger: Logger;
  private consentStates: Map<string, ConsentState> = new Map();
  private consentMetrics: ConsentMetrics | null = null;

  private constructor() {
    this.logger = Logger.getInstance();
  }

  public static getInstance(): ConsentTrackingDashboard {
    if (!ConsentTrackingDashboard.instance) {
      ConsentTrackingDashboard.instance = new ConsentTrackingDashboard();
    }
    return ConsentTrackingDashboard.instance;
  }

  public async updateConsentState(
    userId: string,
    consentRecord: ConsentRecord,
    privacyContext: PrivacyContext
  ): Promise<void> {
    try {
      let consentState = this.consentStates.get(userId);
      
      if (!consentState) {
        consentState = {
          userId,
          consentTypes: {
            dataCollection: null,
            aiProcessing: null,
            analyticsSharing: null,
            educatorDataAccess: null
          },
          consentHistory: [],
          lastUpdated: new Date(),
          isCompliant: false
        };
      }

      // Update specific consent type
      this.updateConsentType(consentState, consentRecord);
      
      // Add to history
      consentState.consentHistory.push(consentRecord);
      consentState.lastUpdated = new Date();
      
      // Update compliance status
      consentState.isCompliant = this.calculateComplianceStatus(consentState);
      
      // Store updated state
      this.consentStates.set(userId, consentState);
      
      // Log consent update
      this.logger.info('CONSENT_STATE_UPDATED', {
        userId: this.hashUserId(userId),
        consentType: consentRecord.consentType,
        granted: consentRecord.granted,
        timestamp: consentRecord.timestamp.toISOString(),
        correlation_id: privacyContext.correlationId
      });

      // Trigger metrics recalculation
      await this.recalculateMetrics();

    } catch (error) {
      this.logger.error('CONSENT_UPDATE_ERROR', {
        userId: this.hashUserId(userId),
        error: error instanceof Error ? error.message : 'Unknown error',
        correlation_id: privacyContext.correlationId
      });
      throw error;
    }
  }

  private updateConsentType(consentState: ConsentState, consentRecord: ConsentRecord): void {
    switch (consentRecord.consentType) {
      case 'data_collection':
        consentState.consentTypes.dataCollection = consentRecord;
        break;
      case 'ai_processing':
        consentState.consentTypes.aiProcessing = consentRecord;
        break;
      case 'analytics_sharing':
        consentState.consentTypes.analyticsSharing = consentRecord;
        break;
      case 'educator_data_access':
        consentState.consentTypes.educatorDataAccess = consentRecord;
        break;
    }
  }

  private calculateComplianceStatus(consentState: ConsentState): boolean {
    const now = new Date();
    
    // Check if all required consents are present and valid
    const requiredConsents = ['dataCollection', 'aiProcessing'] as const;
    
    for (const consentType of requiredConsents) {
      const consent = consentState.consentTypes[consentType];
      
      if (!consent || !consent.granted) {
        return false;
      }
      
      // Check expiration
      if (consent.expiresAt && consent.expiresAt < now) {
        return false;
      }
    }
    
    return true;
  }

  public async getConsentMetrics(): Promise<ConsentMetrics> {
    if (!this.consentMetrics || this.isMetricsStale()) {
      await this.recalculateMetrics();
    }
    
    return this.consentMetrics!;
  }

  private async recalculateMetrics(): Promise<void> {
    try {
      const totalUsers = this.consentStates.size;
      const consentCoverage = this.calculateConsentCoverage();
      const complianceRate = this.calculateComplianceRate();
      const expiringConsents = this.countExpiringConsents();
      const parentalConsentRequired = this.countParentalConsentRequired();
      const withdrawalRate = this.calculateWithdrawalRate();

      this.consentMetrics = {
        totalUsers,
        consentCoverage,
        complianceRate,
        expiringConsents,
        parentalConsentRequired,
        withdrawalRate,
        lastUpdated: new Date()
      };

      this.logger.info('CONSENT_METRICS_UPDATED', {
        metrics: this.consentMetrics,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      this.logger.error('CONSENT_METRICS_CALCULATION_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  private calculateConsentCoverage(): ConsentMetrics['consentCoverage'] {
    const coverage = {
      dataCollection: 0,
      aiProcessing: 0,
      analyticsSharing: 0,
      educatorDataAccess: 0
    };

    const totalUsers = this.consentStates.size;
    if (totalUsers === 0) return coverage;

    for (const [, consentState] of this.consentStates) {
      if (consentState.consentTypes.dataCollection?.granted) {
        coverage.dataCollection++;
      }
      if (consentState.consentTypes.aiProcessing?.granted) {
        coverage.aiProcessing++;
      }
      if (consentState.consentTypes.analyticsSharing?.granted) {
        coverage.analyticsSharing++;
      }
      if (consentState.consentTypes.educatorDataAccess?.granted) {
        coverage.educatorDataAccess++;
      }
    }

    // Convert to percentages
    coverage.dataCollection = (coverage.dataCollection / totalUsers) * 100;
    coverage.aiProcessing = (coverage.aiProcessing / totalUsers) * 100;
    coverage.analyticsSharing = (coverage.analyticsSharing / totalUsers) * 100;
    coverage.educatorDataAccess = (coverage.educatorDataAccess / totalUsers) * 100;

    return coverage;
  }

  private calculateComplianceRate(): number {
    const totalUsers = this.consentStates.size;
    if (totalUsers === 0) return 100;

    const compliantUsers = Array.from(this.consentStates.values())
      .filter(state => state.isCompliant).length;

    return (compliantUsers / totalUsers) * 100;
  }

  private countExpiringConsents(): number {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    let expiringCount = 0;

    for (const [, consentState] of this.consentStates) {
      for (const consent of Object.values(consentState.consentTypes)) {
        if (consent?.expiresAt && consent.expiresAt <= thirtyDaysFromNow) {
          expiringCount++;
        }
      }
    }

    return expiringCount;
  }

  private countParentalConsentRequired(): number {
    return Array.from(this.consentStates.values())
      .filter(state => state.parentalConsent !== undefined).length;
  }

  private calculateWithdrawalRate(): number {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let totalActions = 0;
    let withdrawals = 0;

    for (const [, consentState] of this.consentStates) {
      const recentHistory = consentState.consentHistory.filter(
        record => record.timestamp >= thirtyDaysAgo
      );

      totalActions += recentHistory.length;
      withdrawals += recentHistory.filter(record => !record.granted).length;
    }

    return totalActions > 0 ? (withdrawals / totalActions) * 100 : 0;
  }

  private isMetricsStale(): boolean {
    if (!this.consentMetrics) return true;
    
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
    
    return this.consentMetrics.lastUpdated < fiveMinutesAgo;
  }

  public async getConsentTrends(days: number = 30): Promise<ConsentTrend[]> {
    const trends: ConsentTrend[] = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const trend = this.calculateDayTrend(dayStart, dayEnd);
      trends.push(trend);
    }

    return trends;
  }

  private calculateDayTrend(dayStart: Date, dayEnd: Date): ConsentTrend {
    let newConsents = 0;
    let withdrawals = 0;
    let expirations = 0;

    for (const [, consentState] of this.consentStates) {
      const dayRecords = consentState.consentHistory.filter(
        record => record.timestamp >= dayStart && record.timestamp <= dayEnd
      );

      for (const record of dayRecords) {
        if (record.granted) {
          newConsents++;
        } else {
          withdrawals++;
        }
      }

      // Check for expirations
      for (const consent of Object.values(consentState.consentTypes)) {
        if (consent?.expiresAt && 
            consent.expiresAt >= dayStart && 
            consent.expiresAt <= dayEnd) {
          expirations++;
        }
      }
    }

    const complianceRate = this.calculateComplianceRate(); // Current rate for simplicity

    return {
      date: dayStart,
      newConsents,
      withdrawals,
      expirations,
      complianceRate
    };
  }

  public async getUserConsentState(userId: string): Promise<ConsentState | null> {
    return this.consentStates.get(userId) || null;
  }

  public async getExpiringConsents(daysAhead: number = 30): Promise<ConsentRecord[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const expiringConsents: ConsentRecord[] = [];

    for (const [, consentState] of this.consentStates) {
      for (const consent of Object.values(consentState.consentTypes)) {
        if (consent?.expiresAt && consent.expiresAt <= futureDate) {
          expiringConsents.push(consent);
        }
      }
    }

    return expiringConsents.sort((a, b) => 
      (a.expiresAt?.getTime() || 0) - (b.expiresAt?.getTime() || 0)
    );
  }

  private hashUserId(userId: string): string {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `user_${Math.abs(hash).toString(16)}`;
  }

  public getHealthStatus(): {
    isHealthy: boolean;
    issues: string[];
    totalUsers: number;
    complianceRate: number;
  } {
    const issues: string[] = [];
    const totalUsers = this.consentStates.size;
    const complianceRate = this.calculateComplianceRate();

    if (complianceRate < 95) {
      issues.push(`Low compliance rate: ${complianceRate.toFixed(1)}%`);
    }

    const expiringCount = this.countExpiringConsents();
    if (expiringCount > totalUsers * 0.1) {
      issues.push(`High number of expiring consents: ${expiringCount}`);
    }

    const withdrawalRate = this.calculateWithdrawalRate();
    if (withdrawalRate > 10) {
      issues.push(`High withdrawal rate: ${withdrawalRate.toFixed(1)}%`);
    }

    return {
      isHealthy: issues.length === 0,
      issues,
      totalUsers,
      complianceRate
    };
  }
}