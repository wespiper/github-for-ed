import { Injectable, Logger } from '@nestjs/common';
import { CognitiveEvent, PrivacyContext } from '../privacy/privacy.types';
import { PrivacyMonitorService } from '../privacy/privacy-monitor.service';
import { BehavioralAnonymizerService } from '../privacy/behavioral-anonymizer.service';
import { CognitiveLoadDetectorService } from '../algorithms/cognitive-load-detector.service';

@Injectable()
export class CognitiveEventProcessorService {
  private readonly logger = new Logger(CognitiveEventProcessorService.name);

  constructor(
    private readonly privacyMonitor: PrivacyMonitorService,
    private readonly behavioralAnonymizer: BehavioralAnonymizerService,
    private readonly cognitiveDetector: CognitiveLoadDetectorService,
  ) {}

  async processEvents(
    events: CognitiveEvent[],
    educationalContext: string,
    privacyContext: PrivacyContext
  ): Promise<any> {
    const startTime = Date.now();

    try {
      // Step 1: Privacy validation
      const violations = await this.privacyMonitor.detectViolations(
        'cognitive_event_processing',
        events,
        privacyContext
      );

      if (violations.length > 0) {
        throw new Error('Privacy violations detected - processing halted');
      }

      // Step 2: Anonymize behavioral events
      const anonymizedData = await this.behavioralAnonymizer.anonymizeBehavioralEvents(events);

      // Step 3: Cognitive load detection
      const cognitiveAnalysis = await this.cognitiveDetector.detectOverload(
        events,
        educationalContext,
        privacyContext
      );

      // Step 4: Generate privacy-safe insights
      const insights = this.generatePrivacySafeInsights(
        anonymizedData,
        cognitiveAnalysis,
        educationalContext
      );

      const processingTime = Date.now() - startTime;

      return {
        insights,
        cognitiveLoad: cognitiveAnalysis.cognitiveLoadLevel,
        recommendations: cognitiveAnalysis.educationalRecommendations,
        privacyCompliant: true,
        anonymizationVerified: anonymizedData.kAnonymityVerified,
        processingTimeMs: processingTime,
        metadata: {
          eventsProcessed: events.length,
          privacyLevel: anonymizedData.privacyLevel,
          educationalContext,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      this.logger.error('Error processing cognitive events:', error);
      throw new Error('Event processing failed - data protection maintained');
    }
  }

  private generatePrivacySafeInsights(
    anonymizedData: any,
    cognitiveAnalysis: any,
    context: string
  ): any {
    return {
      sessionSummary: {
        engagementLevel: this.categorizeEngagement(anonymizedData),
        cognitiveLoadBalance: cognitiveAnalysis.cognitiveLoadLevel,
        learningRhythm: this.analyzeLearningRhythm(anonymizedData),
        interventionNeeded: cognitiveAnalysis.interventionSuggested
      },
      educationalGuidance: {
        contextSpecific: this.getContextSpecificGuidance(context, cognitiveAnalysis),
        generalRecommendations: cognitiveAnalysis.educationalRecommendations,
        nextSteps: this.suggestNextSteps(cognitiveAnalysis, context)
      },
      privacyNotice: {
        dataProcessed: 'Anonymized behavioral patterns only',
        retention: 'No persistent storage of individual data',
        protection: 'K-anonymity and differential privacy applied',
        consent: 'Processing based on validated consent preferences'
      }
    };
  }

  private categorizeEngagement(data: any): string {
    const avgInteractions = data.temporalAggregates?.averageEventsPerWindow || 0;
    
    if (avgInteractions > 15) return 'high';
    if (avgInteractions > 8) return 'moderate';
    if (avgInteractions > 3) return 'low';
    return 'minimal';
  }

  private analyzeLearningRhythm(data: any): string {
    const windows = data.temporalAggregates?.totalWindows || 0;
    
    if (windows < 2) return 'insufficient_data';
    
    // Analyze consistency across time windows
    const consistency = this.calculateTemporalConsistency(data.temporalAggregates);
    
    if (consistency > 0.8) return 'steady';
    if (consistency > 0.6) return 'variable';
    return 'irregular';
  }

  private calculateTemporalConsistency(aggregates: any): number {
    if (!aggregates?.temporalAggregates || aggregates.temporalAggregates.length < 2) {
      return 0;
    }

    const eventCounts = aggregates.temporalAggregates.map(window => 
      Object.values(window.eventCounts).reduce((a: number, b: number) => a + b, 0)
    );

    const mean = eventCounts.reduce((a, b) => a + b, 0) / eventCounts.length;
    const variance = eventCounts.reduce((sum, count) => sum + Math.pow(count - mean, 2), 0) / eventCounts.length;
    const stdDev = Math.sqrt(variance);

    // Return consistency score (lower variance = higher consistency)
    return Math.max(0, 1 - (stdDev / mean));
  }

  private getContextSpecificGuidance(context: string, analysis: any): string[] {
    const guidance: string[] = [];
    const cognitiveLoad = analysis.cognitiveLoadLevel;

    switch (context) {
      case 'essay_writing':
        if (cognitiveLoad === 'high') {
          guidance.push('Consider outlining main points before detailed writing');
          guidance.push('Break complex arguments into smaller paragraphs');
        } else if (cognitiveLoad === 'low') {
          guidance.push('Explore deeper analysis and evidence in your arguments');
        }
        break;

      case 'research_paper':
        if (cognitiveLoad === 'high') {
          guidance.push('Organize sources and citations before writing');
          guidance.push('Focus on one section at a time');
        } else {
          guidance.push('Consider integrating additional perspectives or sources');
        }
        break;

      case 'creative_writing':
        if (cognitiveLoad === 'high') {
          guidance.push('Try freewriting to overcome creative blocks');
          guidance.push('Focus on storytelling flow over perfect grammar');
        } else {
          guidance.push('Experiment with more complex narrative techniques');
        }
        break;

      case 'peer_review':
        guidance.push('Provide constructive feedback with specific examples');
        guidance.push('Balance positive reinforcement with improvement suggestions');
        break;

      default:
        guidance.push('Monitor your cognitive load and adjust approach as needed');
    }

    return guidance;
  }

  private suggestNextSteps(analysis: any, context: string): string[] {
    const steps: string[] = [];
    
    if (analysis.interventionSuggested) {
      steps.push('Consider taking a brief break to consolidate learning');
      steps.push('Review current approach and adjust if needed');
    }

    if (analysis.cognitiveLoadLevel === 'low' || analysis.cognitiveLoadLevel === 'minimal') {
      steps.push('Task complexity could be increased for optimal challenge');
      steps.push('Consider exploring additional depth in current work');
    }

    // Context-specific next steps
    switch (context) {
      case 'essay_writing':
        steps.push('Review and revise for clarity and coherence');
        break;
      case 'research_paper':
        steps.push('Verify citations and strengthen evidence');
        break;
      case 'creative_writing':
        steps.push('Read your work aloud to check flow and rhythm');
        break;
    }

    return steps;
  }
}