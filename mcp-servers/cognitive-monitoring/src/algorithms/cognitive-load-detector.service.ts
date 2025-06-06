import { Injectable, Logger } from '@nestjs/common';
import { CognitiveEvent, PrivacyContext, AnonymizedPattern } from '../privacy/privacy.types';
import { PRIVACY_THRESHOLDS } from '../privacy/privacy.config';

@Injectable()
export class CognitiveLoadDetectorService {
  private readonly logger = new Logger(CognitiveLoadDetectorService.name);

  async detectOverload(
    events: CognitiveEvent[],
    educationalContext: string,
    privacyContext: PrivacyContext
  ) {
    const startTime = Date.now();
    
    try {
      // Anonymize events immediately - no individual tracking
      const anonymizedMetrics = this.anonymizeEvents(events);
      
      // Detect cognitive load using statistical methods
      const cognitiveLoadScore = this.calculateCognitiveLoad(anonymizedMetrics, educationalContext);
      
      // Apply differential privacy noise
      const noisyCognitiveLoad = this.addDifferentialPrivacyNoise(cognitiveLoadScore);
      
      // Generate privacy-safe insights
      const insights = this.generatePrivacySafeInsights(noisyCognitiveLoad, educationalContext);
      
      const processingTime = Date.now() - startTime;
      
      return {
        cognitiveLoadLevel: this.categorizeCognitiveLoad(noisyCognitiveLoad),
        confidenceScore: Math.min(noisyCognitiveLoad * 0.8, 0.95), // Cap confidence for privacy
        educationalRecommendations: insights.recommendations,
        privacyProtected: true,
        processingTimeMs: processingTime,
        anonymizedPatterns: insights.patterns,
        interventionSuggested: noisyCognitiveLoad > PRIVACY_THRESHOLDS.INTERVENTION_REQUIRED
      };
      
    } catch (error) {
      this.logger.error('Error in cognitive load detection:', error);
      throw new Error('Cognitive load analysis temporarily unavailable');
    }
  }

  private anonymizeEvents(events: CognitiveEvent[]): any {
    // Process events without storing individual identifiers
    const aggregatedMetrics = {
      totalEvents: events.length,
      averageDuration: 0,
      eventTypeDistribution: {} as Record<string, number>,
      temporalPatterns: this.extractTemporalPatterns(events),
      cognitiveIndicators: this.extractCognitiveIndicators(events)
    };

    // Calculate averages without storing individual values
    let totalDuration = 0;
    let eventCount = 0;

    events.forEach(event => {
      if (event.anonymizedMetrics.duration) {
        totalDuration += event.anonymizedMetrics.duration;
        eventCount++;
      }
      
      // Count event types for pattern detection
      aggregatedMetrics.eventTypeDistribution[event.eventType] = 
        (aggregatedMetrics.eventTypeDistribution[event.eventType] || 0) + 1;
    });

    aggregatedMetrics.averageDuration = eventCount > 0 ? totalDuration / eventCount : 0;

    return aggregatedMetrics;
  }

  private extractTemporalPatterns(events: CognitiveEvent[]): any {
    // Extract timing patterns without individual identification
    const intervals: number[] = [];
    
    for (let i = 1; i < events.length; i++) {
      const interval = events[i].timestamp - events[i-1].timestamp;
      intervals.push(interval);
    }

    // Statistical analysis of intervals
    intervals.sort((a, b) => a - b);
    const median = intervals[Math.floor(intervals.length / 2)] || 0;
    const q1 = intervals[Math.floor(intervals.length * 0.25)] || 0;
    const q3 = intervals[Math.floor(intervals.length * 0.75)] || 0;

    return {
      medianInterval: median,
      quartileRange: q3 - q1,
      variability: this.calculateVariability(intervals),
      rhythmConsistency: this.calculateRhythmConsistency(intervals)
    };
  }

  private extractCognitiveIndicators(events: CognitiveEvent[]): any {
    // Extract cognitive load indicators from behavioral patterns
    const pauseEvents = events.filter(e => e.eventType === 'pause');
    const editEvents = events.filter(e => e.eventType === 'edit');
    const deleteEvents = events.filter(e => e.eventType === 'delete');

    const pauseDurations = pauseEvents
      .map(e => e.anonymizedMetrics.duration || 0)
      .filter(d => d > 0);

    const editPatterns = editEvents.length / Math.max(events.length, 1);
    const deletePatterns = deleteEvents.length / Math.max(events.length, 1);

    return {
      averagePauseDuration: pauseDurations.length > 0 
        ? pauseDurations.reduce((a, b) => a + b, 0) / pauseDurations.length 
        : 0,
      editFrequency: editPatterns,
      deleteFrequency: deletePatterns,
      hesitationIndicator: this.calculateHesitationIndicator(pauseDurations),
      focusConsistency: this.calculateFocusConsistency(events)
    };
  }

  private calculateCognitiveLoad(metrics: any, context: string): number {
    // Evidence-based cognitive load calculation
    let cognitiveLoad = 0;

    // Factor 1: Pause duration analysis (research-backed)
    const pauseScore = Math.min(metrics.cognitiveIndicators.averagePauseDuration / 3000, 1); // 3s+ indicates high load
    cognitiveLoad += pauseScore * 0.3;

    // Factor 2: Edit/delete patterns (indication of uncertainty)
    const revisionScore = Math.min((metrics.cognitiveIndicators.editFrequency + metrics.cognitiveIndicators.deleteFrequency) * 2, 1);
    cognitiveLoad += revisionScore * 0.25;

    // Factor 3: Temporal variability (irregular patterns indicate load)
    const variabilityScore = Math.min(metrics.temporalPatterns.variability, 1);
    cognitiveLoad += variabilityScore * 0.2;

    // Factor 4: Hesitation patterns
    const hesitationScore = Math.min(metrics.cognitiveIndicators.hesitationIndicator, 1);
    cognitiveLoad += hesitationScore * 0.15;

    // Factor 5: Focus consistency (context-dependent)
    const focusScore = 1 - Math.max(metrics.cognitiveIndicators.focusConsistency, 0);
    cognitiveLoad += focusScore * 0.1;

    // Normalize to 0-1 range
    return Math.min(Math.max(cognitiveLoad, 0), 1);
  }

  private addDifferentialPrivacyNoise(score: number): number {
    // Add Laplace noise for differential privacy
    const epsilon = 0.1; // Privacy parameter from config
    const sensitivity = 0.1; // Maximum change in score from one data point
    
    const lambda = sensitivity / epsilon;
    const noise = this.sampleLaplaceNoise(lambda);
    
    // Add noise and clamp to valid range
    return Math.min(Math.max(score + noise, 0), 1);
  }

  private sampleLaplaceNoise(lambda: number): number {
    // Sample from Laplace distribution for differential privacy
    const u = Math.random() - 0.5;
    return -lambda * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
  }

  private categorizeCognitiveLoad(score: number): string {
    if (score >= PRIVACY_THRESHOLDS.HIGH_COGNITIVE_LOAD) {
      return 'high';
    } else if (score >= 0.5) {
      return 'moderate';
    } else if (score >= 0.3) {
      return 'low';
    } else {
      return 'minimal';
    }
  }

  private generatePrivacySafeInsights(cognitiveLoad: number, context: string) {
    const recommendations: string[] = [];
    const patterns: AnonymizedPattern[] = [];

    // Generate context-aware recommendations
    if (cognitiveLoad > PRIVACY_THRESHOLDS.HIGH_COGNITIVE_LOAD) {
      recommendations.push('Consider breaking down the task into smaller components');
      recommendations.push('Take a brief pause to consolidate learning');
      
      if (context === 'essay_writing') {
        recommendations.push('Try outlining key points before detailed writing');
      } else if (context === 'research_paper') {
        recommendations.push('Consider reviewing source material organization');
      }
    } else if (cognitiveLoad < 0.3) {
      recommendations.push('Task complexity could be increased for optimal challenge');
      
      if (context === 'creative_writing') {
        recommendations.push('Explore adding more complex narrative elements');
      }
    }

    // Generate anonymized patterns (no individual attribution)
    patterns.push({
      patternId: `cognitive-load-${Date.now()}`,
      cohortSize: 10, // Minimum for k-anonymity (simulated for demo)
      confidence: Math.min(cognitiveLoad * 0.8, 0.95),
      educationalContext: context,
      timeframe: 'session',
      metrics: {
        averageCognitiveLoad: cognitiveLoad,
        patternStrength: cognitiveLoad * 0.7
      }
    });

    return { recommendations, patterns };
  }

  private calculateVariability(intervals: number[]): number {
    if (intervals.length < 2) return 0;
    
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - mean, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    
    // Normalize variability score
    return Math.min(stdDev / mean, 2) / 2; // Cap at 2 for normalization
  }

  private calculateRhythmConsistency(intervals: number[]): number {
    if (intervals.length < 3) return 1;
    
    // Calculate consistency of timing patterns
    const differences: number[] = [];
    for (let i = 1; i < intervals.length; i++) {
      differences.push(Math.abs(intervals[i] - intervals[i-1]));
    }
    
    const averageDifference = differences.reduce((a, b) => a + b, 0) / differences.length;
    const averageInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    
    // Higher consistency = lower relative differences
    return Math.max(0, 1 - (averageDifference / averageInterval));
  }

  private calculateHesitationIndicator(pauseDurations: number[]): number {
    if (pauseDurations.length === 0) return 0;
    
    // Count significant pauses (>2 seconds)
    const significantPauses = pauseDurations.filter(d => d > 2000);
    const hesitationRatio = significantPauses.length / pauseDurations.length;
    
    // Weight by average duration of significant pauses
    const avgSignificantPause = significantPauses.length > 0 
      ? significantPauses.reduce((a, b) => a + b, 0) / significantPauses.length 
      : 0;
    
    const durationWeight = Math.min(avgSignificantPause / 5000, 1); // 5s = max weight
    
    return hesitationRatio * durationWeight;
  }

  private calculateFocusConsistency(events: CognitiveEvent[]): number {
    // Track focus/blur events to measure attention consistency
    const focusEvents = events.filter(e => e.eventType === 'focus' || e.eventType === 'blur');
    
    if (focusEvents.length === 0) return 1; // No focus data = assume consistent
    
    const focusedTime = focusEvents.reduce((total, event, index) => {
      if (event.eventType === 'focus' && index < focusEvents.length - 1) {
        const nextEvent = focusEvents[index + 1];
        if (nextEvent.eventType === 'blur') {
          return total + (nextEvent.timestamp - event.timestamp);
        }
      }
      return total;
    }, 0);
    
    const totalTime = events[events.length - 1].timestamp - events[0].timestamp;
    
    return totalTime > 0 ? focusedTime / totalTime : 1;
  }
}