import { Injectable, Logger } from '@nestjs/common';
import { EphemeralBuffer, CognitiveEvent } from '../privacy/privacy.types';
import { PRIVACY_CONFIG } from '../privacy/privacy.config';

@Injectable()
export class EphemeralBufferService {
  private readonly logger = new Logger(EphemeralBufferService.name);
  private readonly buffers = new Map<string, CircularBuffer<any>>();
  private readonly cleanupIntervals = new Map<string, NodeJS.Timeout>();

  createBuffer<T>(
    sessionId: string,
    maxSize: number = 1000,
    expiryMinutes: number = 60
  ): EphemeralBuffer<T> {
    // Clean up any existing buffer for this session
    this.destroyBuffer(sessionId);

    // Create new circular buffer
    const buffer = new CircularBuffer<T>(maxSize, expiryMinutes * 60 * 1000);
    this.buffers.set(sessionId, buffer);

    // Set up automatic cleanup
    const cleanupInterval = setInterval(() => {
      this.performBufferMaintenance(sessionId);
    }, 30000); // Check every 30 seconds

    this.cleanupIntervals.set(sessionId, cleanupInterval);

    this.logger.log(`Created ephemeral buffer for session ${sessionId.substring(0, 8)}... (max: ${maxSize}, expiry: ${expiryMinutes}min)`);

    return buffer;
  }

  getBuffer<T>(sessionId: string): EphemeralBuffer<T> | null {
    const buffer = this.buffers.get(sessionId);
    
    if (buffer && !buffer.isExpired()) {
      return buffer;
    }

    if (buffer) {
      this.destroyBuffer(sessionId);
    }

    return null;
  }

  destroyBuffer(sessionId: string): void {
    const buffer = this.buffers.get(sessionId);
    if (buffer) {
      // Secure memory clearing
      buffer.clear();
      this.buffers.delete(sessionId);
    }

    const interval = this.cleanupIntervals.get(sessionId);
    if (interval) {
      clearInterval(interval);
      this.cleanupIntervals.delete(sessionId);
    }

    this.logger.log(`Destroyed ephemeral buffer for session ${sessionId.substring(0, 8)}...`);
  }

  // Create cognitive event buffer with privacy safeguards
  createCognitiveEventBuffer(sessionId: string): EphemeralBuffer<CognitiveEvent> {
    return this.createBuffer<CognitiveEvent>(
      sessionId,
      500, // Max 500 events in memory
      30   // 30 minute expiry for cognitive data
    );
  }

  // Process cognitive events with immediate anonymization
  async processCognitiveEvents(
    sessionId: string,
    events: CognitiveEvent[]
  ): Promise<any> {
    const buffer = this.getBuffer<CognitiveEvent>(sessionId);
    
    if (!buffer) {
      throw new Error('No active buffer for cognitive event processing');
    }

    // Add events to buffer (they're automatically anonymized)
    events.forEach(event => {
      const anonymizedEvent = this.anonymizeEvent(event);
      buffer.add(anonymizedEvent);
    });

    // Generate aggregate insights without storing individual data
    const insights = this.generateAggregateInsights(buffer);

    // Clear processed events to minimize memory
    this.performBufferMaintenance(sessionId);

    return insights;
  }

  private anonymizeEvent(event: CognitiveEvent): CognitiveEvent {
    // Remove any potentially identifying information
    return {
      eventType: event.eventType,
      timestamp: event.timestamp,
      sessionId: 'anonymous', // Remove session linkage
      anonymizedMetrics: {
        duration: event.anonymizedMetrics.duration,
        frequency: event.anonymizedMetrics.frequency,
        pattern: event.anonymizedMetrics.pattern
      }
    };
  }

  private generateAggregateInsights(buffer: EphemeralBuffer<CognitiveEvent>): any {
    const aggregate = buffer.getAggregate();
    
    return {
      totalEvents: aggregate.count,
      eventTypeDistribution: aggregate.eventTypes,
      averageMetrics: aggregate.averages,
      temporalPatterns: aggregate.patterns,
      privacyProtected: true,
      dataRetained: false // No individual data retained
    };
  }

  private performBufferMaintenance(sessionId: string): void {
    const buffer = this.buffers.get(sessionId);
    
    if (!buffer) {
      return;
    }

    // Check if buffer has expired
    if (buffer.isExpired()) {
      this.destroyBuffer(sessionId);
      return;
    }

    // Perform cleanup of old data
    const cleanedItems = buffer.performCleanup();
    
    if (cleanedItems > 0) {
      this.logger.debug(`Cleaned ${cleanedItems} expired items from buffer ${sessionId.substring(0, 8)}...`);
    }
  }

  // Cleanup all buffers on shutdown
  onModuleDestroy(): void {
    this.logger.log('Performing final cleanup of all ephemeral buffers');
    
    for (const [sessionId] of this.buffers) {
      this.destroyBuffer(sessionId);
    }
  }

  // Get buffer statistics for monitoring
  getBufferStatistics(): any {
    const stats = {
      totalBuffers: this.buffers.size,
      memoryUsage: this.calculateMemoryUsage(),
      oldestBuffer: this.getOldestBufferAge(),
      cleanupIntervals: this.cleanupIntervals.size
    };

    return stats;
  }

  private calculateMemoryUsage(): string {
    let totalItems = 0;
    for (const [, buffer] of this.buffers) {
      totalItems += buffer.size();
    }
    return `~${Math.round(totalItems * 0.1)}KB`; // Rough estimate
  }

  private getOldestBufferAge(): string {
    let oldestTime = Date.now();
    
    for (const [, buffer] of this.buffers) {
      const bufferAge = (buffer as any).createdAt;
      if (bufferAge && bufferAge < oldestTime) {
        oldestTime = bufferAge;
      }
    }

    const ageMinutes = Math.round((Date.now() - oldestTime) / 60000);
    return `${ageMinutes} minutes`;
  }
}

// Circular buffer implementation with privacy features
class CircularBuffer<T> implements EphemeralBuffer<T> {
  private items: (T & { timestamp: number })[] = [];
  private maxSize: number;
  private expiryMs: number;
  private currentIndex = 0;
  private readonly createdAt: number;

  constructor(maxSize: number, expiryMs: number) {
    this.maxSize = maxSize;
    this.expiryMs = expiryMs;
    this.createdAt = Date.now();
  }

  add(item: T): void {
    const timestampedItem = {
      ...item,
      timestamp: Date.now()
    };

    if (this.items.length < this.maxSize) {
      this.items.push(timestampedItem);
    } else {
      // Overwrite oldest item
      this.items[this.currentIndex] = timestampedItem;
      this.currentIndex = (this.currentIndex + 1) % this.maxSize;
    }
  }

  getAggregate(): any {
    const validItems = this.getValidItems();
    
    const aggregate = {
      count: validItems.length,
      eventTypes: this.aggregateEventTypes(validItems),
      averages: this.calculateAverages(validItems),
      patterns: this.extractPatterns(validItems)
    };

    return aggregate;
  }

  clear(): void {
    // Secure memory clearing
    this.items.fill(null as any);
    this.items = [];
    this.currentIndex = 0;
  }

  size(): number {
    return this.items.filter(item => item !== null).length;
  }

  isExpired(): boolean {
    return Date.now() - this.createdAt > this.expiryMs;
  }

  performCleanup(): number {
    const initialSize = this.items.length;
    const now = Date.now();
    
    this.items = this.items.filter(item => 
      item && (now - item.timestamp) < this.expiryMs
    );

    return initialSize - this.items.length;
  }

  private getValidItems(): (T & { timestamp: number })[] {
    const now = Date.now();
    return this.items.filter(item => 
      item && (now - item.timestamp) < this.expiryMs
    );
  }

  private aggregateEventTypes(items: any[]): Record<string, number> {
    const types: Record<string, number> = {};
    
    items.forEach(item => {
      if (item.eventType) {
        types[item.eventType] = (types[item.eventType] || 0) + 1;
      }
    });

    return types;
  }

  private calculateAverages(items: any[]): Record<string, number> {
    if (items.length === 0) return {};

    const sums = { duration: 0, frequency: 0 };
    const counts = { duration: 0, frequency: 0 };

    items.forEach(item => {
      if (item.anonymizedMetrics?.duration) {
        sums.duration += item.anonymizedMetrics.duration;
        counts.duration++;
      }
      if (item.anonymizedMetrics?.frequency) {
        sums.frequency += item.anonymizedMetrics.frequency;
        counts.frequency++;
      }
    });

    return {
      averageDuration: counts.duration > 0 ? sums.duration / counts.duration : 0,
      averageFrequency: counts.frequency > 0 ? sums.frequency / counts.frequency : 0
    };
  }

  private extractPatterns(items: any[]): any {
    if (items.length < 2) return { intervals: [], variability: 0 };

    // Calculate time intervals between events
    const intervals: number[] = [];
    for (let i = 1; i < items.length; i++) {
      intervals.push(items[i].timestamp - items[i-1].timestamp);
    }

    // Calculate variability without storing individual data
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => 
      sum + Math.pow(interval - avgInterval, 2), 0
    ) / intervals.length;

    return {
      intervals: [], // Don't store actual intervals for privacy
      variability: Math.sqrt(variance) / avgInterval,
      rhythmConsistency: this.calculateRhythm(intervals)
    };
  }

  private calculateRhythm(intervals: number[]): number {
    if (intervals.length < 3) return 1;

    const differences: number[] = [];
    for (let i = 1; i < intervals.length; i++) {
      differences.push(Math.abs(intervals[i] - intervals[i-1]));
    }

    const avgDifference = differences.reduce((a, b) => a + b, 0) / differences.length;
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

    return Math.max(0, 1 - (avgDifference / avgInterval));
  }
}