import { Logger } from '../Logger';
import { PrivacyContext } from '../../types/privacy';

interface AccessEvent {
  id: string;
  resource: string;
  userId: string;
  userRole: 'student' | 'educator' | 'admin' | 'system';
  accessType: 'read' | 'write' | 'delete' | 'export';
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  sensitivityLevel: 'low' | 'medium' | 'high' | 'critical';
  dataTypes: string[];
  correlationId?: string;
}

interface AccessPattern {
  resource: string;
  accessFrequency: number;
  uniqueAccessors: number;
  sensitivityLevel: 'low' | 'medium' | 'high' | 'critical';
  anomalyScore: number;
  timeDistribution: TimeSeriesData;
  roleDistribution: Map<string, number>;
  geographicDistribution: Map<string, number>;
  lastAccess: Date;
}

interface TimeSeriesData {
  hourly: Map<number, number>; // 0-23 hours
  daily: Map<string, number>; // YYYY-MM-DD
  weekly: Map<string, number>; // Week of year
}

interface HeatMapData {
  resources: AccessPattern[];
  temporalHotspots: TemporalHotspot[];
  userHotspots: UserHotspot[];
  anomalies: AccessAnomaly[];
  lastUpdated: Date;
}

interface TemporalHotspot {
  timeRange: string;
  accessCount: number;
  uniqueUsers: number;
  criticalAccesses: number;
  anomalyScore: number;
}

interface UserHotspot {
  userHash: string;
  userRole: string;
  accessCount: number;
  resourcesAccessed: number;
  criticalAccessCount: number;
  suspiciousActivityScore: number;
}

interface AccessAnomaly {
  id: string;
  type: 'unusual_time' | 'unusual_location' | 'unusual_volume' | 'unusual_pattern' | 'privilege_escalation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  userId: string;
  resource: string;
  timestamp: Date;
  metrics: Record<string, number>;
  autoResolved: boolean;
}

export class DataAccessHeatMap {
  private static instance: DataAccessHeatMap;
  private logger: Logger;
  private accessEvents: AccessEvent[] = [];
  private accessPatterns: Map<string, AccessPattern> = new Map();
  private maxEventsInMemory = 100000;
  private anomalyThresholds = {
    unusualTimeScore: 0.8,
    unusualVolumeMultiplier: 3.0,
    unusualLocationScore: 0.9,
    privilegeEscalationScore: 0.7
  };

  private constructor() {
    this.logger = Logger.getInstance();
    this.initializeCleanupRoutine();
  }

  public static getInstance(): DataAccessHeatMap {
    if (!DataAccessHeatMap.instance) {
      DataAccessHeatMap.instance = new DataAccessHeatMap();
    }
    return DataAccessHeatMap.instance;
  }

  public async recordAccess(
    accessEvent: Omit<AccessEvent, 'id' | 'timestamp'>,
    privacyContext: PrivacyContext
  ): Promise<void> {
    try {
      const event: AccessEvent = {
        ...accessEvent,
        id: this.generateEventId(),
        timestamp: new Date(),
        correlationId: privacyContext.correlationId
      };

      // Store event
      this.accessEvents.push(event);
      
      // Update patterns
      await this.updateAccessPattern(event);
      
      // Check for anomalies
      const anomalies = await this.detectAnomalies(event);
      if (anomalies.length > 0) {
        await this.handleAnomalies(anomalies, privacyContext);
      }

      // Log access with privacy protection
      this.logger.info('DATA_ACCESS_RECORDED', {
        resource: event.resource,
        user_hash: this.hashUserId(event.userId),
        access_type: event.accessType,
        sensitivity: event.sensitivityLevel,
        correlation_id: event.correlationId,
        timestamp: event.timestamp.toISOString()
      });

      // Cleanup old events if necessary
      this.cleanupOldEvents();

    } catch (error) {
      this.logger.error('ACCESS_RECORDING_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        resource: accessEvent.resource,
        correlation_id: privacyContext.correlationId
      });
    }
  }

  private async updateAccessPattern(event: AccessEvent): Promise<void> {
    let pattern = this.accessPatterns.get(event.resource);
    
    if (!pattern) {
      pattern = {
        resource: event.resource,
        accessFrequency: 0,
        uniqueAccessors: 0,
        sensitivityLevel: event.sensitivityLevel,
        anomalyScore: 0,
        timeDistribution: {
          hourly: new Map(),
          daily: new Map(),
          weekly: new Map()
        },
        roleDistribution: new Map(),
        geographicDistribution: new Map(),
        lastAccess: event.timestamp
      };
    }

    // Update frequency
    pattern.accessFrequency++;
    pattern.lastAccess = event.timestamp;

    // Update time distribution
    this.updateTimeDistribution(pattern.timeDistribution, event.timestamp);

    // Update role distribution
    const currentCount = pattern.roleDistribution.get(event.userRole) || 0;
    pattern.roleDistribution.set(event.userRole, currentCount + 1);

    // Update geographic distribution (if IP available)
    if (event.ipAddress) {
      const location = this.getLocationFromIP(event.ipAddress);
      const geoCount = pattern.geographicDistribution.get(location) || 0;
      pattern.geographicDistribution.set(location, geoCount + 1);
    }

    // Calculate unique accessors
    const uniqueUsers = new Set(
      this.accessEvents
        .filter(e => e.resource === event.resource)
        .map(e => e.userId)
    ).size;
    pattern.uniqueAccessors = uniqueUsers;

    // Calculate anomaly score
    pattern.anomalyScore = await this.calculateAnomalyScore(pattern, event);

    this.accessPatterns.set(event.resource, pattern);
  }

  private updateTimeDistribution(distribution: TimeSeriesData, timestamp: Date): void {
    // Update hourly distribution
    const hour = timestamp.getHours();
    const hourlyCount = distribution.hourly.get(hour) || 0;
    distribution.hourly.set(hour, hourlyCount + 1);

    // Update daily distribution
    const dateStr = timestamp.toISOString().split('T')[0];
    const dailyCount = distribution.daily.get(dateStr) || 0;
    distribution.daily.set(dateStr, dailyCount + 1);

    // Update weekly distribution
    const weekStr = this.getWeekOfYear(timestamp);
    const weeklyCount = distribution.weekly.get(weekStr) || 0;
    distribution.weekly.set(weekStr, weeklyCount + 1);
  }

  private async calculateAnomalyScore(pattern: AccessPattern, event: AccessEvent): Promise<number> {
    let score = 0;

    // Time-based anomaly detection
    const timeScore = this.calculateTimeAnomalyScore(event.timestamp);
    score += timeScore * 0.3;

    // Volume-based anomaly detection
    const volumeScore = this.calculateVolumeAnomalyScore(pattern);
    score += volumeScore * 0.3;

    // Role-based anomaly detection
    const roleScore = this.calculateRoleAnomalyScore(event);
    score += roleScore * 0.2;

    // Sensitivity-based anomaly detection
    const sensitivityScore = this.calculateSensitivityAnomalyScore(event);
    score += sensitivityScore * 0.2;

    return Math.min(score, 1.0); // Cap at 1.0
  }

  private calculateTimeAnomalyScore(timestamp: Date): number {
    const hour = timestamp.getHours();
    
    // Business hours: 8 AM to 6 PM are normal (score closer to 0)
    // Late night/early morning hours are more suspicious (score closer to 1)
    if (hour >= 8 && hour <= 18) {
      return 0.1; // Normal business hours
    } else if (hour >= 19 && hour <= 22) {
      return 0.4; // Evening hours
    } else {
      return 0.8; // Late night/early morning
    }
  }

  private calculateVolumeAnomalyScore(pattern: AccessPattern): number {
    const currentHour = new Date().getHours();
    const currentHourAccess = pattern.timeDistribution.hourly.get(currentHour) || 0;
    
    // Calculate average access for this hour across all days
    const hourlyValues = Array.from(pattern.timeDistribution.hourly.values());
    const avgHourlyAccess = hourlyValues.length > 0 ? 
      hourlyValues.reduce((a, b) => a + b, 0) / hourlyValues.length : 1;

    const volumeRatio = currentHourAccess / Math.max(avgHourlyAccess, 1);
    
    // Return higher score for unusually high volume
    return Math.min(volumeRatio / this.anomalyThresholds.unusualVolumeMultiplier, 1.0);
  }

  private calculateRoleAnomalyScore(event: AccessEvent): number {
    // Higher scores for admin/system access to student data
    if (event.userRole === 'admin' && event.sensitivityLevel === 'critical') {
      return 0.6;
    } else if (event.userRole === 'system' && event.accessType === 'export') {
      return 0.5;
    } else if (event.userRole === 'student' && event.accessType === 'delete') {
      return 0.7; // Students shouldn't normally delete data
    }
    
    return 0.1; // Normal role-based access
  }

  private calculateSensitivityAnomalyScore(event: AccessEvent): number {
    const sensitivityScores = {
      'low': 0.1,
      'medium': 0.3,
      'high': 0.6,
      'critical': 0.9
    };
    
    return sensitivityScores[event.sensitivityLevel] || 0.1;
  }

  private async detectAnomalies(event: AccessEvent): Promise<AccessAnomaly[]> {
    const anomalies: AccessAnomaly[] = [];
    
    // Detect unusual time patterns
    const timeScore = this.calculateTimeAnomalyScore(event.timestamp);
    if (timeScore >= this.anomalyThresholds.unusualTimeScore) {
      anomalies.push({
        id: this.generateAnomalyId(),
        type: 'unusual_time',
        severity: timeScore > 0.9 ? 'critical' : 'high',
        description: `Access outside normal hours (${event.timestamp.getHours()}:00)`,
        userId: event.userId,
        resource: event.resource,
        timestamp: event.timestamp,
        metrics: { timeScore },
        autoResolved: false
      });
    }

    // Detect privilege escalation
    if (await this.detectPrivilegeEscalation(event)) {
      anomalies.push({
        id: this.generateAnomalyId(),
        type: 'privilege_escalation',
        severity: 'critical',
        description: 'Potential privilege escalation detected',
        userId: event.userId,
        resource: event.resource,
        timestamp: event.timestamp,
        metrics: { privilegeScore: 1.0 },
        autoResolved: false
      });
    }

    // Detect unusual volume
    const pattern = this.accessPatterns.get(event.resource);
    if (pattern) {
      const volumeScore = this.calculateVolumeAnomalyScore(pattern);
      if (volumeScore >= 0.8) {
        anomalies.push({
          id: this.generateAnomalyId(),
          type: 'unusual_volume',
          severity: volumeScore > 0.95 ? 'critical' : 'high',
          description: `Unusually high access volume detected`,
          userId: event.userId,
          resource: event.resource,
          timestamp: event.timestamp,
          metrics: { volumeScore },
          autoResolved: false
        });
      }
    }

    return anomalies;
  }

  private async detectPrivilegeEscalation(event: AccessEvent): Promise<boolean> {
    // Look for patterns indicating privilege escalation
    const userEvents = this.accessEvents
      .filter(e => e.userId === event.userId)
      .slice(-10); // Last 10 events

    if (userEvents.length < 2) return false;

    // Check if user suddenly gained access to higher sensitivity resources
    const recentSensitivities = userEvents.map(e => e.sensitivityLevel);
    const hasEscalation = recentSensitivities.some((level, index) => {
      if (index === 0) return false;
      const prevLevel = recentSensitivities[index - 1];
      return this.getSensitivityValue(level) > this.getSensitivityValue(prevLevel) + 1;
    });

    return hasEscalation;
  }

  private getSensitivityValue(level: string): number {
    const values = { 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
    return values[level as keyof typeof values] || 1;
  }

  private async handleAnomalies(anomalies: AccessAnomaly[], privacyContext: PrivacyContext): Promise<void> {
    for (const anomaly of anomalies) {
      this.logger.warn('ACCESS_ANOMALY_DETECTED', {
        anomaly_id: anomaly.id,
        type: anomaly.type,
        severity: anomaly.severity,
        description: anomaly.description,
        user_hash: this.hashUserId(anomaly.userId),
        resource: anomaly.resource,
        metrics: anomaly.metrics,
        correlation_id: privacyContext.correlationId
      });

      // Auto-remediation for critical anomalies
      if (anomaly.severity === 'critical') {
        await this.triggerAutoRemediation(anomaly, privacyContext);
      }
    }
  }

  private async triggerAutoRemediation(anomaly: AccessAnomaly, privacyContext: PrivacyContext): Promise<void> {
    this.logger.error('CRITICAL_ANOMALY_AUTO_REMEDIATION', {
      anomaly_id: anomaly.id,
      type: anomaly.type,
      user_hash: this.hashUserId(anomaly.userId),
      resource: anomaly.resource,
      action: 'session_review_required',
      correlation_id: privacyContext.correlationId
    });

    // In a real implementation, this would trigger:
    // - Security team notifications
    // - Session termination for privilege escalation
    // - Account lockout for suspicious activity
    // - Automated compliance reporting
  }

  public async getHeatMapData(
    timeRange: { start: Date; end: Date },
    includeAnomalies = true
  ): Promise<HeatMapData> {
    const filteredEvents = this.accessEvents.filter(
      event => event.timestamp >= timeRange.start && event.timestamp <= timeRange.end
    );

    const resources = Array.from(this.accessPatterns.values());
    const temporalHotspots = this.calculateTemporalHotspots(filteredEvents);
    const userHotspots = this.calculateUserHotspots(filteredEvents);
    const anomalies = includeAnomalies ? 
      await this.getAnomaliesInRange(timeRange.start, timeRange.end) : [];

    return {
      resources,
      temporalHotspots,
      userHotspots,
      anomalies,
      lastUpdated: new Date()
    };
  }

  private calculateTemporalHotspots(events: AccessEvent[]): TemporalHotspot[] {
    const hourlyGroups = new Map<number, AccessEvent[]>();
    
    for (const event of events) {
      const hour = event.timestamp.getHours();
      if (!hourlyGroups.has(hour)) {
        hourlyGroups.set(hour, []);
      }
      hourlyGroups.get(hour)!.push(event);
    }

    const hotspots: TemporalHotspot[] = [];
    
    for (const [hour, hourEvents] of hourlyGroups) {
      const accessCount = hourEvents.length;
      const uniqueUsers = new Set(hourEvents.map(e => e.userId)).size;
      const criticalAccesses = hourEvents.filter(e => e.sensitivityLevel === 'critical').length;
      const anomalyScore = this.calculateTimeAnomalyScore(new Date().setHours(hour) as any);

      hotspots.push({
        timeRange: `${hour}:00-${hour + 1}:00`,
        accessCount,
        uniqueUsers,
        criticalAccesses,
        anomalyScore
      });
    }

    return hotspots.sort((a, b) => b.accessCount - a.accessCount);
  }

  private calculateUserHotspots(events: AccessEvent[]): UserHotspot[] {
    const userGroups = new Map<string, AccessEvent[]>();
    
    for (const event of events) {
      if (!userGroups.has(event.userId)) {
        userGroups.set(event.userId, []);
      }
      userGroups.get(event.userId)!.push(event);
    }

    const hotspots: UserHotspot[] = [];
    
    for (const [userId, userEvents] of userGroups) {
      const accessCount = userEvents.length;
      const resourcesAccessed = new Set(userEvents.map(e => e.resource)).size;
      const criticalAccessCount = userEvents.filter(e => e.sensitivityLevel === 'critical').length;
      const suspiciousActivityScore = this.calculateUserSuspicionScore(userEvents);

      hotspots.push({
        userHash: this.hashUserId(userId),
        userRole: userEvents[0]?.userRole || 'unknown',
        accessCount,
        resourcesAccessed,
        criticalAccessCount,
        suspiciousActivityScore
      });
    }

    return hotspots.sort((a, b) => b.suspiciousActivityScore - a.suspiciousActivityScore);
  }

  private calculateUserSuspicionScore(userEvents: AccessEvent[]): number {
    let score = 0;

    // High volume of accesses
    if (userEvents.length > 100) score += 0.3;
    
    // Many critical resource accesses
    const criticalRatio = userEvents.filter(e => e.sensitivityLevel === 'critical').length / userEvents.length;
    score += criticalRatio * 0.4;

    // Unusual time patterns
    const nightAccesses = userEvents.filter(e => {
      const hour = e.timestamp.getHours();
      return hour < 6 || hour > 22;
    }).length;
    
    if (nightAccesses > userEvents.length * 0.2) score += 0.3;

    return Math.min(score, 1.0);
  }

  private async getAnomaliesInRange(start: Date, end: Date): Promise<AccessAnomaly[]> {
    // In a real implementation, this would query from a persistent store
    // For now, return simulated anomalies based on current data
    return [];
  }

  private getLocationFromIP(ipAddress: string): string {
    // Simplified location detection - in production, use GeoIP service
    if (ipAddress.startsWith('192.168') || ipAddress.startsWith('10.') || ipAddress.startsWith('172.')) {
      return 'internal';
    }
    return 'external';
  }

  private getWeekOfYear(date: Date): string {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    return `${date.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAnomalyId(): string {
    return `anom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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

  private cleanupOldEvents(): void {
    if (this.accessEvents.length > this.maxEventsInMemory) {
      // Remove oldest 20% of events
      const removeCount = Math.floor(this.maxEventsInMemory * 0.2);
      this.accessEvents = this.accessEvents.slice(removeCount);
    }
  }

  private initializeCleanupRoutine(): void {
    // Run cleanup every hour
    setInterval(() => {
      this.cleanupOldEvents();
    }, 60 * 60 * 1000);
  }

  public getHealthStatus(): {
    isHealthy: boolean;
    eventsInMemory: number;
    patternsTracked: number;
    criticalAnomalies: number;
  } {
    const criticalAnomalies = 0; // Would be calculated from stored anomalies
    
    return {
      isHealthy: this.accessEvents.length < this.maxEventsInMemory * 0.9,
      eventsInMemory: this.accessEvents.length,
      patternsTracked: this.accessPatterns.size,
      criticalAnomalies
    };
  }
}